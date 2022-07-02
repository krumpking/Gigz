var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortfolioSchema = new Schema({
    name: { type: String, unique: true, required: true, dropDups: true },
    no: { type: String, unique: true, required: true, dropDups: true },
    description: { type: String, required: true, index: "text" },
    imageUrl: { type: String, required: true },
    date: { type: Date },
});



// Export model.
module.exports = mongoose.model('Portfolio', PortfolioSchema, 'portfolio');	