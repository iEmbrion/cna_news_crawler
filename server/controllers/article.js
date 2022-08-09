const Article = require('../models/article');

//Saves all articles found in the req.body
exports.createArticles = async (req, res, next) => {
  try {
    const doc = await Article.insertMany(req.body, { ordered: false });
    res.status(201).json({
      message: 'Success!',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong!',
      data: null,
    });
  }
};

//Used for updating fields of an article
exports.updateArticle = async (req, res, next) => {
  req.body.date_published = Date.parse(req.body.date_published);

  const doc = await Article.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doc) {
    res.status(500).json({
      message: 'Update fail! Record not found.',
      data: null,
    });
  } else {
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  }
};

//Gets an article where its text is not crawled yet
exports.getUnprocessedArticle = async (req, res, next) => {
  try {
    const articles = await Article.find({ text: '' });

    res.status(200).json({
      status: 'success',
      results: articles.length,
      data: {
        data: articles,
      },
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      data: null,
    });
  }
};

//Get count of all articles
exports.countArticles = async (req, res, next) => {
  try {
    Article.countDocuments({}, function (err, count) {
      if (err) {
        console.log(err);
      } else {
        res.status(200).json({
          message: 'Success!',
          data: {
            count,
          },
        });
      }
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      data: null,
    });
  }
};

//No use case atm
exports.getArticleByText = async (req, res, next) => {
  try {
    const article = await Article.findOne({ text: req.query.text });

    res.status(200).json({
      status: 'success',
      data: {
        data: article,
      },
    });
  } catch (err) {
    console.log(err.stack);
    res.status(500).json({
      message: 'Something went wrong!',
      data: null,
    });
  }
};

//Used for deleting all documents from the collection
exports.deleteAll = async (req, res, next) => {
  try {
    await Article.deleteMany({});
    res.status(200).json({
      status: 'success',
    });
  } catch (err) {
    res.status(500).json({
      message: 'Update fail! Record not found.',
      data: null,
    });
  }
};

//await Article.deleteMany({
// link: { $regex: /.*www.channelnewsasia.com\/Watch.*/ },
// });
