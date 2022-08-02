var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReviewsSchema = new Schema({
    reviewer_no: { type: String, required: true },
    urlName: { type: String, required: true },
    review: { type: String, required: true, index: "text" },
    stars: { type: Number, required: true },
    name: { type: String, required: true },
    date: { type: Date },
});



// Export model.
module.exports = mongoose.model('Reviews', ReviewsSchema, 'reviews');	
