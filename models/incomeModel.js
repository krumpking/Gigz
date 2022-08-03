var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IncomeSchema = new Schema({
    no: no,
    itemName: { type: Array, required: true },
    itemPrice: { type: String, required: true },
    date: { type: Date },
    amount: { type: Number },
});

IncomeSchema.index({ itemName: 'text' });
// Export model.
module.exports = mongoose.model('Income', IncomeSchema, 'income');