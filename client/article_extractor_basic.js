// ==UserScript==
// @name         CNA Basic Article Info Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.channelnewsasia.com/topic/sri-lanka*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=channelnewsasia.com
// @grant        none
// ==/UserScript==

let openedWindow = null;

//remove nextline chars and extra spaces
const cleanText = text => {
  let clean_text = text;
  clean_text = clean_text.replace(/\\n|\\r\\n|\\r/g, '');
  clean_text = clean_text.replace(/\s+/g, ' ').trim();
  return clean_text;
};

const openWindow = url => {
  if (!openedWindow) {
    openedWindow = window.open(url);
    return;
  }
  console.log(
    'A window is already opened. Please close before calling open window.'
  );
};

const closeWindow = () => {
  if (openedWindow) {
    openedWindow.close();
    openedWindow = null;
    return;
  }
};

(async function () {
  ('use strict');

  //If at first page, init start page
  let page_no = localStorage.getItem('cur_page_no');
  if (!page_no) localStorage.setItem('cur_page_no', 0);

  //Exit if no more pages
  const no_results = document.querySelector(
    ':scope .content-list--no-result span'
  );

  if (no_results) {
    localStorage.setItem('cur_page_no', 0);

    //Fetch and return no. of docs persisted
    const server_url = 'http://localhost:8000/article/count';
    try {
      const res = await fetch(server_url);
      const data = res.json();
      console.log(`No. of records persisted: ${data.data.count}`);
    } catch (err) {
      console.log(`Error fetching no. of documents processed`);
    } finally {
      console.log(`No more pages to process, terminating program...`);
      return;
    }
  }

  //Extract information from current page (links, header, etc...)
  const docs = document.querySelectorAll('.list-object');

  const article_list = [];
  docs.forEach(async doc => {
    const main = doc.querySelector('.list-object__heading-link');
    const link = main.href;
    const header = cleanText(main.textContent);
    const category = cleanText(
      doc.querySelector(':scope .list-object__category .link').textContent
    );

    //publish date and text will be populated in next phase
    const article = {
      link,
      header,
      category,
      date_published: null,
      text: '',
    };
    article_list.push(article);
  });

  //Send details to server for processing
  const server_url = 'http://localhost:8000/article/saveAll';

  try {
    const res = await fetch(server_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article_list),
    });

    const data = await res.json();
    console.log(data);

    //Redirect to next page after data persisted successfully
    page_no++;
    localStorage.setItem('cur_page_no', page_no);
    window.location.replace(
      `https://www.channelnewsasia.com/topic/sri-lanka?sort_by=field_release_date_value&sort_order=DESC&page=${page_no}`
    );
  } catch (err) {
    console.log(err);
    console.log(`Process terminated at Page number ${page_no}`);
  }
})();
