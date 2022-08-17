var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ItemBookedSchema = new Schema({
    name: { type: String },
    description: { type: String },
    itemId: { type: String, required: true },
    dateAdded: { type: String, required: true },
    dateOfReturn: { type: Date },
    bookerId: { type: String },
    bookerName: { type: String },
    dateOfBooking: { type: Date },
    company: { type: String },
});


// Export model.
module.exports = mongoose.model('ItemBooked', ItemBookedSchema, 'itembooked');	