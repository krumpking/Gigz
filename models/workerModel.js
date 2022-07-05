var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkerSchema = new Schema({
    name: { type: String, unique: true, required: true, dropDups: true },
    category: { type: String, required: true },
    skills: { type: String, required: true },
    brief: { type: String, required: true },
    no: { type: String, unique: true, required: true, dropDups: true },
    areas: { type: String, required: true },
    expired: { type: Boolean, required: true },
    prices: { type: String },
    faqs: { type: String },
    url: { type: String },
    urlName: { type: String },
    package: { type: String, required: true },
    date: { type: Date, required: true },
    id: { type: String, unique: true, required: true, dropDups: true },
    pic: { type: String },
});



WorkerSchema.index({ category: 'text', skills: 'text', areas: 'text' });
// Export model.
module.exports = mongoose.model('Worker', WorkerSchema, 'workers');	