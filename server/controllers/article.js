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
  if (req.body.date_published)
    req.body.date_published = Date.parse(req.body.date_published);

  try {
    let curArticle = await Article.findById(req.params.id);
    if (!curArticle) {
      console.log(`Update failed. Unable to find article.`);
      console.log(`Params: ${req.params.id}, ${req.body.header}`);
      return res.status(500).json({
        message: 'Update fail! Record not found.',
        data: null,
      });
    }

    curArticle.date_published = req.body.date_published;
    curArticle.text = req.body.text;
    curArticle.isProcessing = undefined;
    curArticle.text_length = req.body.text_length;

    let doc = await curArticle.save();

    return res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  } catch (err) {
    console.log(`Update failed, ${err}`);
    return res.status(500).json({
      message: 'Update fail!',
      data: null,
    });
  }

  // const doc = await Article.findByIdAndUpdate(req.params.id, req.body, {
  //   new: true,
  //   runValidators: true,
  // });
};

exports.deleteArticle = async (req, res, next) => {
  try {
    await Article.deleteOne({ _id: req.params.id });
    res.status(204).json({
      message: 'Record deleted sucessfully!',
      data: null,
    });
  } catch (err) {
    res.status(500).json({
      message: 'Something went wrong!',
      data: null,
    });
  }
};

//Gets an article where its text is not crawled yet and not already being processed
exports.getUnprocessedArticle = async (req, res, next) => {
  try {
    const articles = await Article.find({
      text: '',
      isProcessing: { $exists: false },
    });

    res.status(200).json({
      status: 'success',
      results: articles.length,
      data: {
        data: articles,
      },
    });
  } catch (err) {
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

exports.deleteArticlesWithVideo = async (req, res, next) => {
  try {
    await Article.deleteMany({
      header: { $regex: /.*\|.*Video.*/ },
    });
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
