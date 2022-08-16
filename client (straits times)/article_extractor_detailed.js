// ==UserScript==
// @name         Straitstimes Text Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract and Update Text Content of news articles
// @author       You
// @match        https://*.straitstimes.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=straitstimes.com
// @grant        none
// ==/UserScript==

let processing = false;

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

//Ensures that url matches the target domain for crawling
//CNA will at times perform redirects via the initially valid url
// const isCurUrlValid = () => {
//   let isValid = false;
//   //Sample
//   //https://www.channelnewsasia.com/*
//   const cur_url = window.location.href;
//   const regex = /https:\/\/www\.todayonline\.com.*/;
//   const result = cur_url.match(regex);
//   if (result) isValid = true;
//   return isValid;
// };

//Retrieves and returns an unprocessed article record
const getUnprocessedArticle = async () => {
  let article = null;
  let data = undefined;
  try {
    //Retrieve a non-processed article
    const server_url =
      'http://localhost:8000/article/getArticleByText?text=&source=straitstimes';
    const res = await fetch(server_url);
    data = await res.json();

    article = data.data.data;
  } catch (err) {
    logError(
      err,
      `Failed to get unprocessed article.`,
      `getUnprocessedArticle()`
    );
  }

  //If no records found, do logging here
  if (!article)
    logInfo('No unprocessed articles found.', `getUnprocessedArticle()`);

  return article;
};

const updateArticle = async article => {
  let success = false;
  const update_url = `http://localhost:8000/article/${article._id}`;
  try {
    const res = await fetch(update_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });
    success = true;
  } catch (err) {
    logError(err, `Failed to update article.`, `updateArticle()`);
  }
  return success;
};

//Updates processing status of article
const updateProcessingStatus = async (article, isProcessing) => {
  let success = false;

  //Persist changes to server
  const update_url = `http://localhost:8000/article/${article._id}`;
  if (!isProcessing) article.isProcessing = undefined;
  else article.isProcessing = isProcessing;
  try {
    const res = await fetch(update_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });

    success = true;
  } catch (err) {
    logError(
      err,
      `Failed to update processing status.`,
      `updateProcessingStatus()`
    );
  }
  return success;
};

const deleteArticle = async article => {
  let success = false;
  try {
    await fetch(`http://localhost:8000/article/${article._id}`, {
      method: 'delete',
    });
    success = true;
  } catch (err) {
    logError(err, `Failed to delete article`, `deleteArticle()`);
  }
  return success;
};

const crawlText = article => {
  //List of text segregated into a list of paragraphs
  let docs = document.querySelectorAll(
    ':scope .article-content-rawhtml .layout--onecol .field--type-text-long p'
  );

  if (docs.length === 0 || !docs) {
    logError(`N.A.`, `Failed to crawl any text from article.`, `crawlText()`);
    return article;
  }

  docs.forEach(doc => {
    article.text = `${article.text} ${doc.textContent}`;
  });
  article.text = cleanText(article.text);
  article.text_length = article.text.length;

  return article;
};

//E.g. input 01:02 PM  output 13:02
const convertTime12to24 = time12h => {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }
  return `${hours}:${minutes}`;
};

//Date from straitstimes "AUG 7, 2022, 1:47 AM SGT"
const processDate = date_str => {
  let temp = '';
  let date_publish = null;
  let date_arr = date_str.split(' ');

  //Check type of date
  //Type 1: 2 HOURS AGO
  if (date_arr.length === 3 && date_arr[2].toLowerCase() === 'ago') {
    //Get current date and subtract accordingly
    const today = new Date();
    const curHour = today.getHours();
    today.setHours(curHour - date_arr[0]);
    date_publish = today;
  }

  //Type 2: AUG 7, 2022, 1:47 AM SGT
  if (
    date_arr.length === 6 &&
    (date_arr[4].toLowerCase() === 'am' || date_arr[4].toLowerCase() === 'pm')
  ) {
    temp =
      date_arr[1] + ' ' + date_arr[0] + ' ' + date_arr[2] + ' 00:00:00 GMT';
    temp = temp.replace(/,/g, '');

    // let date_publish = date_str;
    date_publish = new Date(temp);

    let time = date_arr[3] + ' ' + date_arr[4];
    time = convertTime12to24(time);
    let hour = time.split(':')[0];
    let minute = time.split(':')[1];

    date_publish.setHours(hour);
    date_publish.setMinutes(minute);
  }

  // if(date_publish)
  date_publish = date_publish.toJSON();
  return date_publish;
};

const cleanText = text => {
  let clean_text = text;
  clean_text = clean_text.trim();
  clean_text = clean_text.replace(/\s+/g, ' ').trim();
  return clean_text;
};

//delete article if it doesn't meet criterias below
//Prevents outliers from stopping the crawling process
const articleTimeout = setTimeout(async () => {
  if (!processing) {
    processing = true;
    let article = await getUnprocessedArticle();
    if (!article) return;
    if (!(await deleteArticle(article))) return;
    let next_article = await getUnprocessedArticle();
    if (!next_article) return;
    window.location.replace(next_article.link);
    return;
  }
}, 20000);

document.addEventListener('DOMSubtreeModified', async e => {
  //Handle page not found
  if (
    !processing &&
    e.target.querySelector(':scope #content .section') &&
    e.target
      .querySelector(':scope #content .section')
      .textContent.includes('The requested page could not be found')
  ) {
    // Check if link is still valid, if not, delete article and process next one
    processing = true;
    let article = await getUnprocessedArticle();
    if (!article) return;
    if (!(await deleteArticle(article))) return;
    let next_article = await getUnprocessedArticle();
    if (!next_article) return;
    window.location.replace(next_article.link);
    return;
  }

  //Handle normal cases
  //Note: Detecting wrong url is not implemented here due to how ST works.
  //To trigger program, go to any article.
  //'window.location.href' detected 'https://www.straitstimes.com/concurrency.html'
  if (
    !processing &&
    e.target.querySelector(`:scope .group-story-postdate .story-postdate`)
  ) {
    processing = true;

    let article = await getUnprocessedArticle();
    if (!article) return;

    //Check if content is for subscribers
    if (e.target.querySelector('.paid-premium.st-flag-1')) {
      logInfo('Content is for subscribers only. Deleting article...');
      if (!(await deleteArticle(article))) return;

      let next_article = await getUnprocessedArticle();
      if (!next_article) return;
      window.location.replace(next_article.link);
      return;
    }

    //Lock article for processing
    if (!(await updateProcessingStatus(article, true))) return;

    // Extract details and update article object
    let date_published = document.querySelector(
      ':scope .group-story-postdate .story-postdate'
    );

    //Delete article if date element cannot be found in html
    if (date_published) date_published = date_published.textContent;
    else {
      logInfo('No date found!');
      alert('no date found... exiting program...');
      // if (!(await deleteArticle(article))) return;
      // window.location.replace('https://straitstimes.com/');
      return;
    }
    article.date_published = processDate(date_published);

    //If article does not contain any text, delete and move to next article
    article = crawlText(article);

    if (article.text === '') {
      logInfo('No text found in article... Deleting article..');
      if (!(await deleteArticle(article))) return;
      let next_article = await getUnprocessedArticle();
      if (!next_article) return;
      window.location.replace(next_article.link);
      return;
    }

    //Persist changes to server and update processing status to false
    if (!(await updateArticle(article))) return;
    if (!(await updateProcessingStatus(article, false))) return;

    let next_article = await getUnprocessedArticle();
    if (!next_article) return;
    window.location.replace(next_article.link);
  }
});

//Handle edge cases here
(async function () {
  'use strict';
  //Delete multimedia articles and proceed to next article
  const cur_url = window.location.href;
  if (
    cur_url.match(/\/multimedia\//g) ||
    !cur_url.match(/https:\/\/www.straitstimes.com\/.*/g)
  ) {
    processing = true;
    let article = await getUnprocessedArticle();
    if (!article) return;
    if (!(await deleteArticle(article))) return;
    let next_article = await getUnprocessedArticle();
    if (!next_article) return;
    window.location.replace(next_article.link);
    return;
  }
})();
