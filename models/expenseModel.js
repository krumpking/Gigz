var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var ExpenseSchema = new Schema({
    no: { type: String, required: true },
    itemDescription: { type: String, required: true },
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
});

ExpenseSchema.index({ itemName: 'text' });
// Export model.
module.exports = mongoose.model('Expense', ExpenseSchema, 'expense');