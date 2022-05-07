var mongoose = require('mongoose');
const mongooseFuzzySearching = require('mongoose-fuzzy-searching');
var Schema = mongoose.Schema;

var GigSchema = new Schema({
  category: { type: String },
  skills: { type: String },
  details: { type: String, required: true },
  budget: { type: Number, required: true },
  no: { type: String, required: true },
  paymentStructure: { type: String, required: true },
  date: { type: Date },
  acceptingTimes: { type: Number },
  finalDay: { type: String, required: true },
  approved: { type: Boolean, required: true },
  id: { type: Number, required: true },
  winner: { type: String, required: true },
});




GigSchema.plugin(mongooseFuzzySearching, { fields: ['skills', 'category', 'details', 'budget'] });
// Export model.
module.exports = mongoose.model('Gig', GigSchema, 'gigs');	