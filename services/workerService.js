var Worker = require('../models/workerModel');
var Review = require('../models/reviewsModel');
var Worker = require('../models/workerModel');

module.exports = {
    getWorker: function (no) {
        return Worker.findOne({ no: no });
    },
    saveWorker: function (worker) {
        return worker.save();
    },
    reduceWorkerBids: async function (no) {
        let worker = await Worker.findOne({ no: no });
        let bids = worker.bids - 1;
        const filter = { no: no };
        const update = { bids: bids };
        return Worker.findOneAndUpdate(filter, update);
    },
    addWorkerBids: async function (no) {
        let worker = await Worker.findOne({ no: no });
        let bids = worker.bids + 5;
        const filter = { no: no };
        const update = { bids: bids };
        return Worker.findOneAndUpdate(filter, update);
        worker.save();
    },
    getWorkerById: function (id) {
        return Worker.find({
            id: id
        });
    },
    getWorkerReviews: function (id) {
        return Review.find({
            reviewed_person_id: id
        }).limit(7);
    },
    addReview: async function (review) {

        var rvw = await Review.findOne({ reviewer_no: review.reviewer_no, reviewed_person_id: review.reviewed_person_id });
        if (rvw === null) {
            return review.save();
        } else {
            return null;
        }


    },
    unsubscribe: async function (no) {
        return Worker.deleteOne({ no: no });

    },
    updateWorkerProfile: async function (worker, no) {
        let newWorker = await Worker.findOne({ no: no });
        newWorker.name = worker.name;
        newWorker.category = worker.category;
        newWorker.skills = worker.skills;
        newWorker.brief = worker.brief;
        newWorker.areas = worker.areas;
        newWorker.save();

    },
    getClientsBySkillsCat: function (gig) { // show be able to to ensure Gig are approved and are not after the finalDay 
        return Worker.find({ category: gig.category }).fuzzySearch(gig.skills).sort({ date: 1 });
    },




}

