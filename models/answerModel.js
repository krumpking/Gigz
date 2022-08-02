var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var AnswerModelSchema = new Schema({
    keywords: { type: Array, required: true },
    info: { type: String, required: true },
    date: { type: Date },
    expired: { type: Boolean },
    imageUrl: { type: String }
});

AnswerModelSchema.index({ keywords: 'text' });
// Export model.
module.exports = mongoose.model('Answer', AnswerModelSchema, 'answer');