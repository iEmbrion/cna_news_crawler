const mongoose = require('mongoose');

const articleSchema = mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  link: {
    type: String,
    required: true,
    unique: true,
  },
  header: {
    type: String,
    required: true,
  },
  category: {
    type: String,
  },
  source: {
    type: String,
    required: true,
  },
  date_published: {
    type: Date,
    default: null,
  },
  text: {
    type: String,
    default: '',
  },
  text_length: {
    type: Number,
    required: true,
    default: function () {
      if (this.text) return len(this.text);
      else return 0;
    },
  },
});

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;
