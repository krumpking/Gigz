var mongoose = require('mongoose');
const mongooseFuzzySearching = require('mongoose-fuzzy-searching');
var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
    reviewer_no: { type: String, required: true },
    review: { type: String, required: true },
    date: { type: Date },
    reviewed_person_id: { type: String, required: true }
});




ReviewSchema.plugin(mongooseFuzzySearching, { fields: ['review'] });
// Export model.
module.exports = mongoose.model('Review', ReviewSchema, 'reviews');	