var Payments = require('../models/paymentModel');

module.exports = {
    addPayment: function (payment) {
        return payment.save();
    },
    checkSubscriptionStatus: async function (no, dayOfYear) {
        // check for subscription payment
        let today = new Date();
        let latestPayment = await Payments.find({ no: no, valid: true }).sort({ date: -1 });
        if (latestPayment === null) {
            return { expired: true, days: null, package: null };
        } else if (latestPayment.length > 0) {
            let lastPayment = latestPayment[0];
            let dayOfPayment = new Date(lastPayment.date);
            if (dayOfYear - parseInt(lastPayment.dayOfYear) < 31 && today.getFullYear() == dayOfPayment.getFullYear()) {
                return { expired: false, days: dayOfYear - lastPayment.dayOfYear, package: lastPayment.package };
            } else {
                return { expired: true, days: dayOfYear - lastPayment.dayOfYear, package: lastPayment.package };
            }
        } else {
            return { expired: true, days: null, package: null };
        }



    },
    getAllPayments: function () {
        return Payments.find({ valid: true });
    },



}
