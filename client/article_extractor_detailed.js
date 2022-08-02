// ==UserScript==
// @name         CNA Text Extractor
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Extract and Update Text Content of news articles
// @author       You
// @match        https://www.channelnewsasia.com/*/*
// @match        https://cnalifestyle.channelnewsasia.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

//Retrieves and returns an unprocessed article record
//Perform redirect if current url does not match article url
const redirectToUnprocessedArticle = async () => {
  //Retrieve a non-processed article
  const server_url = 'http://localhost:8000/article/getArticleByText?text=';
  const res = await fetch(server_url);
  const data = await res.json();
  const article = data.data.data;

  //Redirect to article url if current url !== article url
  const article_link = article.link;
  const cur_url = window.location.href;
  if (cur_url !== article_link) window.location.replace(article_link);
  return article;
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

  //Retrieve a non-processed article
  const article = await redirectToUnprocessedArticle();

  //Extract details and update article object
  let date_published = document.querySelector('.article-publish').textContent;
  article.date_published = processDate(date_published);

  //List of text segregated into a list of paragraphs
  let docs = document.querySelectorAll(':scope .text-long > p');
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
  } catch (err) {
    console.log(err);
    console.log(`Failed to update article record.`);
  }

  await redirectToUnprocessedArticle();
  //
})();
