// ==UserScript==
// @name         Todayonline Basic Article Info Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.todayonline.com/search*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=channelnewsasia.com
// @grant        none
// ==/UserScript==

//For standardizing err handling messages
//err location is general, can be file name, method name, task name, etc...
const logError = (err, custom_message = '', err_loc = '') => {
  let message = `Error`;
  message = custom_message === '' ? message : `${message}: ${custom_message}`;
  message = err_loc === '' ? message : `${message} at ${err_loc}`;

  console.log(message);
  console.log(`Error Details: ${err}`);
};

//For standardizing logging information
const logInfo = (custom_message, loc = '') => {
  let message = `Log: `;
  message = custom_message === '' ? message : `${message}: ${custom_message}`;
  message = loc === '' ? message : `${message} at ${loc}`;

  console.log(message);
};

//Extract articles from current page (links, header, etc...)
const crawlArticles = categories => {
  const article_list = [];

  let docs = document.querySelectorAll('.list-object');

  //Exit if no more articles to found
  if (!docs || docs.length === 0) {
    logInfo(
      `No more articles for processing. Exiting program...`,
      `crawlArticles()`
    );
    localStorage.removeItem('cur_page_no');
    return article_list;
  }

  docs.forEach(async doc => {
    const main = doc.querySelector('.list-object__heading-link');
    const link = main.href;
    const header = cleanText(main.textContent);
    // const category = cleanText(
    //   doc.querySelector(':scope .list-object__category .link').textContent
    // );

    //publish date, category and text will be populated during article text crawling
    const article = {
      link,
      header,
      category: '',
      source: 'todayonline',
      date_published: null,
      text: '',
    };

    //Filter articles by categories
    if (categories.includes(category)) article_list.push(article);
  });
  return article_list;
};

const saveArticles = async articles => {
  let success = false;
  const server_url = 'http://localhost:8000/article/saveAll';
  try {
    const res = await fetch(server_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(articles),
    });
    const data = await res.json();
    logInfo(`Articles persisted ${data}`, `saveArticles()`);
    success = true;
  } catch (err) {
    logError(err, `Failed to save articles.`, `saveArticles()`);
  }
  return success;
};

//Construct url based on parameters supplied
//page_no is excluded to make it configurable
const constructUrl = (query = '', categories = [], contentTypes = []) => {
  //define url, note: page_no is excluded so it could be dynamic at in different redirect statements
  let base_url = 'https://www.todayonline.com/search?';
  if (query !== '') base_url += `q=`;
  let full_url = `${base_url}${query}`;
  for (let i = 0; i < contentTypes.length; i++)
    full_url += `&type%5B${i}%5D=${contentTypes[i]}`;
  for (let i = 0; i < categories.length; i++)
    full_url += `&categories%5B${i}%5D=${categories[i]}`;
  full_url += `&page=`;
  return full_url;
};

const main = async () => {
  const pause = false;
  if (pause) return;

  //Define your query & categorial params
  const query = 'disaster';
  const categories = ['Singapore', 'World'];
  const contentTypes = ['article'];

  //page_no is excluded to make it configurable
  const full_url = constructUrl(query, categories, contentTypes);

  //If no page number set yet, start from page 1.
  let page_no = localStorage.getItem('cur_page_no');
  if (page_no === null || page_no === undefined) {
    localStorage.setItem('cur_page_no', 1);
    page_no = 1;
    window.location.href = `${full_url}${page_no}`;
  }

  //Extract articles from current page (links, header, etc...)
  //Return if no more articles to process
  const article_list = crawlArticles(categories);
  if (article_list.length === 0) return;
  alert(article_list);
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
    10000 // how long to wait before rejecting
  );

  if (document.querySelector('.list-object')) {
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
