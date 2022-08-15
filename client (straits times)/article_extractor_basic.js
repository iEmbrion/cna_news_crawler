// ==UserScript==
// @name         ST Basic Article Info Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.straitstimes.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=straitstimes.com
// @grant        none
// ==/UserScript==

//variable to ensure while main is executing, there will not be a second call.
let processing = true;
const query = 'ukraine';
const categories = ['asia', 'singapore', 'world', 'sport'];

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

//remove nextline chars and extra spaces
const cleanText = text => {
  let clean_text = text;
  clean_text = clean_text.replace(/\\n|\\r\\n|\\r/g, '');
  clean_text = clean_text.replace(/\s+/g, ' ').trim();
  return clean_text;
};

document.addEventListener('DOMSubtreeModified', async e => {
  if (
    //Ensure that all articles and next button is rendered before processing
    e.target.querySelectorAll('.queryly_item_row').length === 20 &&
    e.target.querySelector("a[href='#']") &&
    !processing
  ) {
    let article_list = [];

    //When the elements needed in the current page is already loaded,
    //prevent the listener from triggering this block of code multiple times by DOM changes from other elements)
    processing = true;

    //Crawl all articles basic details in current page (e.g. link and header)
    const docs = e.target.querySelectorAll('.queryly_item_row');
    docs.forEach(async doc => {
      const header = cleanText(
        doc.querySelector('.queryly_item_title').textContent
      );
      const link = doc.querySelector('a').href;

      const category = link.split('/')[3];

      const article = {
        link,
        header,
        category,
        source: 'straitstimes',
        date_published: null,
        text: '',
      };

      if (categories.includes(category)) article_list.push(article);
    });

    // Save articles and trigger next button click
    if (!(await saveArticles(article_list))) return;

    //clicking next button will cause the next set of articles to be dynamically loaded
    //This in turn triggers DOM changes and triggers this listener again.
    const nextBtn = e.target.querySelector("a[href='#']");
    if (nextBtn.style.float === 'left') {
      logInfo(
        'Last page reached. No more articles to process. Exiting script...'
      );
      return;
    }

    //Throttle
    setTimeout(() => {
      //Release the lock so that processing can take place in the next page.
      processing = false;
      nextBtn.click();
    }, 500);
  }
});

// function check_ad(changes, observer) {
//   if (document.querySelector('#pclose-btn')) {
//     document.querySelector('#pclose-btn').click();
//   }
// }

(function () {
  ('use strict');

  //Redirect if current url does not match query
  const baseUrl = `https://www.straitstimes.com/search?searchkey=`;
  if (window.location.href === `${baseUrl}${query}`) processing = false;
  else window.location.href = `${baseUrl}${query}`;
})();
