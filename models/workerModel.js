var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkerSchema = new Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    skills: { type: String, required: true },
    brief: { type: String, required: true },
    no: { type: String, required: true },
    areas: { type: String, required: true },
    expired: { type: Boolean, required: true },
    prices: { type: String },
    faqs: { type: String },
    package: { type: String, required: true },
    date: { type: Date, required: true },
    id: { type: String, required: true },
    pic: { type: String },
});



WorkerSchema.index({ category: 'text', skills: 'text', areas: 'text' });
// Export model.
module.exports = mongoose.model('Worker', WorkerSchema, 'workers');	