var Stock = require('../models/stockModel');


module.exports = {
    addStock: (stock) => {

        return stock.save();
    },
    seeAvailableStock: (no) => {
        return Stock.find({ no: no, numberOfItems: { $gt: 0 } });

    },
    removeFromAvailableStock: () => {

    }
}