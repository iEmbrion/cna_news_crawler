const express = require('express');
const controller = require('../controllers/article');

const router = express.Router();

router.route('/getArticleByText').get(controller.getArticleByText);
router.route('/saveAll').post(controller.createArticles);
router.route('/count').get(controller.countArticles);
router.route('/getUnprocessedArticles').get(controller.getUnprocessedArticles);
router.route('/:id').post(controller.updateArticle);
router.route('/deleteArticles').get(controller.deleteArticles);

module.exports = router;
