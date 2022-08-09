// ==UserScript==
// @name         CNA Text Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract and Update Text Content of news articles
// @author       You
// @match        https://www.channelnewsasia.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

//Retrieves and returns an unprocessed article record
//Perform redirect if current url does not match article url
const getUnprocessedArticle = async () => {
  let article = null;
  try {
    //Retrieve a non-processed article
    const server_url = 'http://localhost:8000/article/getArticleByText?text=';
    const res = await fetch(server_url);
    const data = await res.json();
    article = data.data.data;
  } catch (err) {
    console.log(`Error getting unprocessed article.`);
  }

  return article;
};

//Updates processing status of article
const updateProcessingStatus = async (article, isProcessing) => {
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
  } catch (err) {
    console.log(`err at updateProcessingStatus: ${err}`);
    throw err;
  }
};

const redirectToArticle = article_link => {
  const cur_url = window.location.href;
  if (cur_url !== article_link) {
    window.location.replace(article_link);
  }
};

const processDate = date_str => {
  let date_publish = date_str;
  date_publish.replace(/\(.*\)/, '').trim();
  date_publish = date_publish.replace(/(AM|PM)/, '');
  date_publish = date_publish + ':00 GMT';
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
  //Ensures an article finishes processing before moving on to the next
  let next = false;

  //Retrieve a non-processed article
  let article = await getUnprocessedArticle();

  //If no more articles to process, return
  if (!article) {
    alert('No more articles for processing...');
    return;
  }

  //Redirect to article url if current url !== article url
  redirectToArticle(article.link);

  //Lock article for processing and prevent it from being updated by other processes
  await updateProcessingStatus(article, true);

  //Check if link is still valid, if not, delete article and process next one
  const not_found = document.querySelector('[about="/page-not-found"]');
  if (not_found) {
    try {
      await fetch(`http://localhost:8000/article/${article._id}`, {
        method: 'delete',
      });
    } catch (err) {
      console.log(`Error: Failed to delete article... Terminating script...`);
      alert(`Fail to delete article. Terminating script...`);
      return;
    }
    //Redirect to next article
    article = await getUnprocessedArticle();
    if (article) redirectToArticle(article.link);
    else {
      alert(`No next article found. Terminating script...`);
      console.log(`No next article found. Terminating script...`);
      return;
    }
  }

  //Extract details and update article object
  let date_published = document.querySelector('.article-publish').textContent;
  article.date_published = processDate(date_published);

  //List of text segregated into a list of paragraphs
  let docs = document.querySelectorAll(':scope .text-long > p');
  if (docs.length === 0 || !docs) {
    docs = document.querySelectorAll(':scope .text-long > div > p');
  }
  if (docs.length === 0 || !docs) {
    alert('DOCS LENGTH 0. EXITING...');
    return;
  }
  docs.forEach(doc => {
    article.text = `${article.text} ${doc.textContent}`;
  });
  article.text = cleanText(article.text);
  article.text_length = article.text.length;

  //Persist changes to server
  const update_url = `http://localhost:8000/article/${article._id}`;
  try {
    const res = await fetch(update_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(article),
    });
    if (res.status !== 500) next = true;
    else {
      alert(`Update failed!, exiting program`);
      return;
    }
  } catch (err) {
    console.log(err);
    console.log(`Failed to update article record.`);
    return;
  }

  //Finished processing article, update processing status of article to false
  try {
    await updateProcessingStatus(article, false);

    //Get next article for processing
    article = await getUnprocessedArticle();
    if (article) redirectToArticle(article.link);
  } catch (err) {
    alert(`Error finishing processing article... terminating program...`);
    alert(err);
    return;
  }
})();
