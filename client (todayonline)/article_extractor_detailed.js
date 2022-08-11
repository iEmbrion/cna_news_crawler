// ==UserScript==
// @name         Todayonline Text Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract and Update Text Content of news articles
// @author       You
// @match        https://www.todayonline.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
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

//Ensures that url matches the target domain for crawling
//CNA will at times perform redirects via the initially valid url
const isCurUrlValid = () => {
  let isValid = false;
  //Sample
  //https://www.channelnewsasia.com/*
  const cur_url = window.location.href;
  const regex = /https:\/\/www\.todayonline\.com.*/;
  const result = cur_url.match(regex);
  if (result) isValid = true;
  return isValid;
};

//Retrieves and returns an unprocessed article record
const getUnprocessedArticle = async () => {
  let article = null;
  try {
    //Retrieve a non-processed article
    const server_url = 'http://localhost:8000/article/getArticleByText?text=';
    const res = await fetch(server_url);
    const data = await res.json();
    article = data.data.data;
    console.log(article);
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
  let docs = document.querySelectorAll(':scope .text-long > p');
  if (docs.length === 0 || !docs) {
    alert('1');
    docs = document.querySelectorAll(':scope .text-long > div > p');
  }
  if (docs.length === 0 || !docs) {
    docs = document.querySelectorAll(':scope .text-long');
    alert('2');
  }
  if (docs.length === 0 || !docs) {
    alert('3');
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

const redirectToArticle = article_link => {
  const cur_url = window.location.href;
  if (cur_url !== article_link) {
    window.location.replace(article_link);
  }
};

const processDate = date_str => {
  let date_publish = date_str;
  date_publish = date_publish.trim();
  date_publish = date_publish + ' 00:00:00' + ' GMT';
  date_publish = new Date(date_publish);
  date_publish = date_publish.toJSON();
  return date_publish;
};

const cleanText = text => {
  let clean_text = text;
  clean_text = clean_text.trim();
  clean_text = clean_text.replace(/\s+/g, ' ').trim();
  return clean_text;
};

(async function () {
  'use strict';
  //Configurations
  const categories = ['Singapore', 'World'];

  //Retrieve a non-processed article
  let article = await getUnprocessedArticle();

  //If no more articles to process, return, else redirect to article if not already done so
  if (!article) return;
  redirectToArticle(article.link);

  //If current Url is invalid, delete article and proceed to the next
  if (!isCurUrlValid()) {
    if (!(await deleteArticle(article))) return;
    article = await getUnprocessedArticle();
    if (!article) return;
    redirectToArticle(article.link);
  }

  //Lock article for processing
  if (!(await updateProcessingStatus(article, true))) return;

  // Check if link is still valid, if not, delete article and process next one
  const not_found = document.querySelector('[about="/page-not-found"]');
  if (not_found) {
    alert(`not_found!`);
    if (!(await deleteArticle(article))) return;

    //Redirect to next article
    article = await getUnprocessedArticle();
    if (!article) return;
    redirectToArticle(article.link);
  }

  // //Extract details and update article object
  let date_published = document.querySelector(
    ':scope .article-date .article__row'
  );

  // //Delete article if date element cannot be found in html
  if (date_published) date_published = date_published.textContent;
  else {
    if (!(await deleteArticle(article))) return;

    //Redirect to next article
    article = await getUnprocessedArticle();
    if (!article) return;
    redirectToArticle(article.link);
  }

  article.date_published = processDate(date_published);

  //Get category and delete articles that doesn't match the category configuration
  const category = document.querySelector('.list-object__category');
  if (category) article.category = category.textContent.trim();

  if (!categories.includes(article.category)) {
    if (!(await deleteArticle(article))) return;

    //Redirect to next article
    article = await getUnprocessedArticle();
    if (!article) return;
    redirectToArticle(article.link);
  }

  article = crawlText(article);
  if (article.text === '') return;

  //Persist changes to server and update processing status to false
  if (!(await updateArticle(article))) return;
  if (!(await updateProcessingStatus(article, false))) return;

  //Get the next article for processing
  article = await getUnprocessedArticle();
  if (!article) return;
  redirectToArticle(article.link);
})();
