// ==UserScript==
// @name         CNA Basic Article Info Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.channelnewsasia.com/search?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=channelnewsasia.com
// @grant        none
// ==/UserScript==

const main = async () => {
  const pause = false;
  if (pause) return;

  //Define your query & categorial params
  const query = 'monkey';
  const categories = ['Asia', 'Business', 'Singapore', 'Sport', 'World'];
  const contentTypes = ['article'];

  //If no page number set yet, start from page 1.
  let first_load = false;
  let page_no = localStorage.getItem('cur_page_no');
  if (page_no === null || page_no === undefined) {
    first_load = true;
    localStorage.setItem('cur_page_no', 1);
    page_no = 1;
  }

  //define url, note: page_no is excluded so it could be dynamic at in different redirect statements
  let base_url = 'https://www.channelnewsasia.com/search?';
  if (query !== '') base_url += `q=`;
  let full_url = `${base_url}${query}`;
  for (let i = 0; i < categories.length; i++)
    full_url += `&type%5B${i}%5D=${contentTypes[i]}`;
  for (let i = 0; i < categories.length; i++)
    full_url += `&categories%5B${i}%5D=${categories[i]}`;
  full_url += `&page=`;

  //If processing just started, redirect to page 1
  if (first_load) window.location.href = `${full_url}${page_no}`;

  //Extract articles from current page (links, header, etc...)
  let docs = document.querySelectorAll('.list-object');

  //Exit if no more articles to found
  if (!docs || docs.length === 0) {
    localStorage.removeItem('cur_page_no');
    console.log(`No more articles for processing. Exiting program...`);
    return;
  }

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
      source: 'cna',
      date_published: null,
      text: '',
    };

    //Ensure cat is within defined / acceptable categories
    if (categories.includes(category)) article_list.push(article);
  });

  //Send articles to server for persisting
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
    console.log(`Articles persisted ${data}`);

    //Redirect to next page after data persisted successfully
    page_no++;
    localStorage.setItem('cur_page_no', page_no);
    window.location.href = `${full_url}${page_no}`;
  } catch (err) {
    console.log(`Error saving articles: ${err}`);
    console.log(`Process terminated at Page number ${page_no}`);
  }
};

//remove nextline chars and extra spaces
const cleanText = text => {
  let clean_text = text;
  clean_text = clean_text.replace(/\\n|\\r\\n|\\r/g, '');
  clean_text = clean_text.replace(/\s+/g, ' ').trim();
  return clean_text;
};

async function check(changes, observer) {
  const observer_timeout = setTimeout(
    () => {
      // when the timeout expires, stop watching…
      observer.disconnect();
      console.log('Observer Timeout!');
    },
    5000 // how long to wait before rejecting
  );

  if (
    document.querySelector('.list-object') ||
    document.querySelector('.content-list--no-result')
  ) {
    observer.disconnect();
    clearTimeout(observer_timeout);
    await main();
  }
}

(async function () {
  ('use strict');
  new MutationObserver(check).observe(document, {
    childList: true,
    subtree: true,
  });
})();
