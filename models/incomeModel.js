var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var IncomeSchema = new Schema({
    no: { type: String, required: true },
    itemName: { type: String, required: true },
    numberOfItems: { type: Number, required: true },
    category: {type: String},
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
});

IncomeSchema.index({ itemName: 'text' });
// Export model.
module.exports = mongoose.model('Income', IncomeSchema, 'income');