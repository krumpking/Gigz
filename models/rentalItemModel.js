var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var RentalItemSchema = new Schema({
    description: { type: String, required: true },
    img: { type: String, required: true },
});



// Export model.
module.exports = mongoose.model('RentalItem', RentalItemSchema, 'rentalItem');	