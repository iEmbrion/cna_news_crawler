const express = require('express');
const controller = require('../controllers/article');

const router = express.Router();

router.route('/getArticleByText').get(controller.getArticleByText);
router.route('/saveAll').post(controller.createArticles);
router.route('/count').get(controller.countArticles);
router.route('/getUnprocessedArticles').get(controller.getUnprocessedArticle);
router.route('/:id').post(controller.updateArticle);
router.route('/deleteAll').get(controller.deleteAll);

module.exports = router;
