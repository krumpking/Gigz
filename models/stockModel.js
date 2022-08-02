var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var StockModelSchema = new Schema({
    numberOfItems: { type: Number, required: true },
    itemName: { type: String, required: true },
    visibleName: { type: String, required: true },
    itemPrice: { type: Number, required: true },
    dayOfTheYear: { type: Number, required: true },
    date: { type: Date },
    no: { type: String, required: true },
});

StockModelSchema.index({ itemName: 'text' });
// Export model.
module.exports = mongoose.model('Stock', StockModelSchema, 'stock');