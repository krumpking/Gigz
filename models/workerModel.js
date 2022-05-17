var mongoose = require('mongoose');
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching-v3');
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




// WorkerSchema.plugin(mongoose_fuzzy_searching, { fields: ['skills', 'category'] });
// Export model.
module.exports = mongoose.model('Worker', WorkerSchema, 'workers');	
