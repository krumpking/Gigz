var Stock = require('../models/stockModel');
var mongoose = require('mongoose');

module.exports = {
    addStock: (stock) => {

        return stock.save();
    },
    seeAvailableStock: async (no, member) => {

        let stockAvail = await Stock.find({ no: no });
        if (stockAvail.length < 1) {
            return Stock.find({ members: { $in: no } })
        }
        return stockAvail;


    },
    removeFromAvailableStock: async (itemName, numberOfItems) => {
        let stock = await Stock.findOne({ itemName: itemName.toLowerCase() })

    },
    addMember: (member, stock) => {

        stock.forEach(v => {

            var id = mongoose.Types.ObjectId(v._id).toString();
            let filter = { _id: id };
            let update = { $push: { members: member } };
            Stock.findOneAndUpdate(filter, update).catch(console.error);
        });

    },

}