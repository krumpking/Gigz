const MONGO_DB_URL = "mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000";


module.exports = function initConnection() {
  // Set up mongoose connection
  var mongoose = require('mongoose');
  var mongoDB = MONGO_DB_URL;


  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
  };

  mongoose.connect(mongoDB, options);
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