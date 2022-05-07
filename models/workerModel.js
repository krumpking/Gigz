var mongoose = require('mongoose');
const mongooseFuzzySearching = require('mongoose-fuzzy-searching');
var Schema = mongoose.Schema;

var WorkerSchema = new Schema({
    name: { type: String, required: true },
    skills: { type: String },
    category: { type: String, required: true },
    brief: { type: String, required: true },
    no: { type: String, required: true },
    areas: { type: String, required: true },
    bids: { type: Number, required: true },
    date: { type: Date },
    id: { type: String, required: true },
});




WorkerSchema.plugin(mongooseFuzzySearching, { fields: ['skills', 'category'] });
// Export model.
module.exports = mongoose.model('Worker', WorkerSchema, 'workers');	
