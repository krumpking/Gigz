var Gig = require('../models/gigModel');

module.exports = {
    addGig: function (gig) {
        return gig.save();
    },
    getGigz: function (skills, category, no) { // show be able to to ensure Gig are approved and are not after the finalDay
        // soon will add same category, for now leave like this
        return Gig.fuzzySearch(skills).where('approved').equals(true).where('winner').equals("none").skip(no).limit(5).sort({ budget: -1 });

    },
    searchGigz: function (query, no) {
        return Gig.fuzzySearch(query).where('approved').equals(true).where('winner').equals("none").skip(no).limit(5).sort({ budget: -1 });;
    },
    findGig: function (id) {
        return Gig.findOne({ id: id });
    },
    addWorkHistory: async function (gigId, winnerId) {
        let gig = await Gig.findOne({ id: gigId });
        if (gig != null) {
            gig.winner = winnerId;
            gig.save();
        }

    },
    getWorkerHistory: function (id) {
        return Gig.find({
            winnner: id
        }).limit(7);
    },
    getGigsToApproval: function (skipNumber) {

        return Gig.find({
            winner: "none",
            approved: false,
        }).skip(parseInt(skipNumber)).sort({ date: 1 });


    },
    approve: async function (gig) {
        const filter = { id: gig.id };
        const update = { approved: true, skills: gig.skills, category: gig.category };
        return Gig.findOneAndUpdate(filter, update);
    },
    deleteGig: function (id) {
        return Gig.deleteOne({ id: id });
    },
    getAccomodationGigz: function (house) {
        return Gig.find({ category: "Facilities and property services", winner: "none", approved: true }).fuzzySearch(house);
    },
    expire: async function () {

        var expiredGigz = await Gig.find({ winner: "none", finalDay: { $lt: new Date() } });
        expiredGigz.forEach(async element => {
            var date1 = new Date();
            var date2 = new Date(element.finalDay);

            // To calculate the time difference of two dates
            var Difference_In_Time = date2.getTime() - date1.getTime();

            // To calculate the no. of days between two dates
            var differeInDays = parseInt(Difference_In_Time / (1000 * 3600 * 24));
            console.log(element);
            console.log(differeInDays);
            if (differeInDays < 0) {
                const filter = { id: element.id };
                const update = { winner: "expired", approved: false };
                await Gig.findOneAndUpdate(filter, update);
            }
        });

    },
    addAcceptTimes: async function (gig, newAcceptingTimes) {
        const filter = { id: gig.id };
        const update = { acceptingTimes: newAcceptingTimes };
        return Gig.findOneAndUpdate(filter, update);
    },
    removeAcceptTimes: async function (gig) {
        const newAcceptingTimes = gig.acceptingTimes - 1;
        const filter = { id: gig.id };
        const update = { acceptingTimes: newAcceptingTimes };
        return Gig.findOneAndUpdate(filter, update);
    }





}



