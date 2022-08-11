// ==UserScript==
// @name         ST Basic Article Info Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.straitstimes.com/global*
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
const crawlArticles = categories => {};

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
const constructUrl = (query = '', categories = [], contentTypes = []) => {};

const main = async () => {
  const pause = false;
  if (pause) return;

  //Define your query & categorial params
  const query = 'disaster';
  const categories = ['Asia', 'Singapore', 'World'];
  const contentTypes = ['article'];
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

  if (document.querySelector('.block-nav-search')) {
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
