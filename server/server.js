const dotenv = require('dotenv');
const app = require('./app');
const mongoose = require('mongoose');

dotenv.config({
  path: './config.env',
});

const db_conn = process.env.ATLAS_URI;
const db_client = mongoose
  .connect(db_conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to DB successfully`);
  });

//Error Handling
process.on('exit', function (code) {
  return console.log(`exiting the code implicitly ${code}`);
});

process.on('unhandledRejection', err => {
  console.log(`Unhandled Rejection: ${err.name}, ${err.message}`);
  console.log(err);
  process.exit(1);
});

process.on('uncaughtException', err => {
  console.log(`Uncaught Exception: ${err.name}, ${err.message}`);
  console.log(err);
  process.exit(1);
});

const port = process.env.PORT | 8000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
