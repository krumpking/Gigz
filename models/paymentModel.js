var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PaymentsSchema = new Schema({
    dayOfYear: { type: String },
    numberUsedInPayment: { type: String },
    amount: { type: String, required: true, index: "number" },
    package: { type: String, required: true },
    no: { type: String, required: true },
    date: { type: Date },
    valid: { type: Boolean }
});

PaymentsSchema.index({ details: 'text', package: 'text', numberUsedInPayment: 'text' });
// Export model.
module.exports = mongoose.model('Payments', PaymentsSchema, 'payments');	