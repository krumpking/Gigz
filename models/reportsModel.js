var mongoose = require('mongoose');
// const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching-v3');
var Schema = mongoose.Schema;

var ReportsSchema = new Schema({
  category: { type: String },
  details: { type: String },
  no: { type: String, required: true },
  date: { type: Date },
});




// GigSchema.plugin(mongoose_fuzzy_searching, { fields: ['skills', 'category', 'details', 'budget'] });
// Export model.
module.exports = mongoose.model('Reports', ReportsSchema, 'reports');