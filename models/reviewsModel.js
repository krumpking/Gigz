var mongoose = require('mongoose');
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching-v3');
var Schema = mongoose.Schema;

var ReviewSchema = new Schema({
    reviewer_no: { type: String, required: true },
    review: { type: String, required: true },
    date: { type: Date },
    reviewed_person_id: { type: String, required: true }
});




// ReviewSchema.plugin(mongoose_fuzzy_searching, { fields: ['review'] });
// Export model.
module.exports = mongoose.model('Review', ReviewSchema, 'reviews');	