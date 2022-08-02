const express = require('express');
const cors = require('cors');
const articleRouter = require('./routes/article');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/article', articleRouter);

//Error handling
app.all('*', (req, res, next) => {
  console.log('404 not found');
  next(); // pass control to the next handler
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

module.exports = app;
