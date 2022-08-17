var Stock = require('../models/stockModel');
var Income = require('../models/incomeModel');
var Expense = require('../models/expenseModel');
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
    removeFromAvailableStock: async (no, itemName, numberOfItems) => {
        let stock = await Stock.findOne({ no: no, itemName: itemName.toLowerCase() });
        if (stock === null) {
            return null;
        } else {

            if (stock.numberOfItems < 1) {
                return 0;
            } else {
                let filter = { no: no, itemName: itemName.toLowerCase() };
                let update = { numberOfItems: stock.numberOfItems - 1 };
                Stock.findOneAndUpdate(filter, update).catch(console.error);

                let income = new Income({
                    no: no,
                    itemName: itemName,
                    catergory: "sales",
                    numberOfItems: numberOfItems,
                    date: new Date,
                    amount: stock.itemPrice * numberOfItems,
                });

                return income.save();
            }

        }

    },
    addMember: (member, stock) => {

        stock.forEach(v => {

            var id = mongoose.Types.ObjectId(v._id).toString();
            let filter = { _id: id };
            let update = { $push: { members: member } };
            Stock.findOneAndUpdate(filter, update).catch(console.error);
        });

    },
    getPLReport: async (no) => {

        var id = no;

        // Check if user is in the members list
        let stockAvail = await Stock.find({ no: no });
        if (stockAvail.length < 1) {
            stockAvail = Stock.find({ members: { $in: no } });
            if (stockAvail.length > 1) {
                id = stockAvail[0].no;
            }
        }

        // Get income
        let income = await Income.find({ no: id });

        // Get income
        let expense = await Expense.find({ no: id });

        // report back with income and expenses within an object
        return {
            income: income,
            expense: expense
        }
    },
    addExpense: (expense) => {
        return expense.save();
    },
    addIncome: (income) => {
        return income.save();
    },


}