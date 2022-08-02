const Article = require('../models/article');

exports.deleteArticles = async (req, res, next) => {
  try {
    await Article.deleteMany({
      link: { $regex: /.*www.channelnewsasia.com\/watch.*/ },
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

exports.createArticles = async (req, res, next) => {
  try {
    const doc = await Article.insertMany(req.body);
    res.status(201).json({
      message: 'Success!',
      data: {
        data: doc,
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

exports.getUnprocessedArticles = async (req, res, next) => {
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

// exports.getAll = Model =>
//   catchAsync(async (req, res, next) => {
//     //Execute Query
//     const apiFeatures = new APIFeatures(Model.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     const doc = await apiFeatures.query;
//     // const doc = await apiFeatures.query.explain();

//     res.status(200).json({
//       status: 'success',
//       results: doc.length,
//       data: {
//         data: doc,
//       },
//     });
//   });
