// const MONGO_DB_URL = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";
const MONGO_DB_URL = `mongodb+srv://gigzadmin:Zimbabwe1@cluster0.h7zqs.mongodb.net/?retryWrites=true&w=majority`


module.exports = function initConnection() {
  // Set up mongoose connection
  var mongoose = require('mongoose');
  var mongoDB = MONGO_DB_URL;



  mongoose.connect(mongoDB);
  mongoose.Promise = global.Promise;
  var db = mongoose.connection;
  db.on('error', console.error.bind(console, 'MongoDB connection error:'));
  db.on('error', function (err) {
    console.log('Failed to connect to database');
    process.exit(1);
  });

  db.once('open', function () {
    console.log("Connected to database");
    // callback();
  });
};