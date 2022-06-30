var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
    reviewer_no: { type: String, required: true },
    review: { type: String, required: true, index: "text" },
    stars: { type: Number, required: true },
    name: { type: String, required: true },
    date: { type: Date },
});



// Export model.
module.exports = mongoose.model('Review', ReviewSchema, 'reviews');	