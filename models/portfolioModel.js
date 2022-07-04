var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PortfolioSchema = new Schema({
    name: { type: String, required: true },
    no: { type: String, required: true },
    description: { type: String, required: true, index: "text" },
    imageUrl: { type: String, required: true },
    date: { type: Date },
});



// Export model.
module.exports = mongoose.model('Portfolio', PortfolioSchema, 'portfolio');	
