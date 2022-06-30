var Payments = require('../models/paymentModel');

module.exports = {
    addPayment: function (payment) {
        return payment.save();
    },
    checkSubscriptionStatus: function (no, dayOfYear) {
        // check for subscription payment
        let today = new Date();
        let latestPayment = Payments.find({ no: no, valid: true }).sort({ date: -1 });
        if (latestPayment === null) {
            return null;
        } else {
            let lastPayment = latestPayment[0];
            let dayOfPayment = new Date(lastPayment.date);
            if (dayOfYear - lastPayment.dayOfYear < 30 && today.getFullYear() == dayOfPayment.getFullYear()) {
                return { expired: false, days: dayOfYear - lastPayment.dayOfYear, package: lastPayment.package };
            } else {
                return { expired: true, days: dayOfYear - lastPayment.dayOfYear, package: lastPayment.package };
            }
        }



    },
    getAllPayments: function () {
        return Payments.find({ valid: true });
    },



}
