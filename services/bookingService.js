const AnswerModel = require('../models/answerModel');
const itemBooked = require('../models/itemBooked');
const rentItemModel = require('../models/rentalItemModel');

module.exports = {
    addRentalItem: (item) => {
        return item.save();
    },
    getItem: (id) => {
        return rentItemModel.findById(id);
    },
    getAvailableRentalItems: () => {
        return rentItemModel.find();
    },
    bookItem: async (newBooking) => {
        return newBooking.save();
    },
    checkBooking: (id) => {
        return itemBooked.find({ itemId: id }).sort({ date: 1 });
    }
}