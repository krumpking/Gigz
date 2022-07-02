var Worker = require('../models/workerModel');
var Review = require('../models/reviewsModel');
var Worker = require('../models/workerModel');
const portfolioModel = require('../models/portfolioModel');

module.exports = {
    getWorker: function (no) {
        return Worker.findOne({ no: no });
    },
    saveWorker: function (worker) {
        return worker.save();
    },
    getWorkerById: function (id) {
        return Worker.find({
            id: id
        });
    },
    getWorkerReviews: function (name) {
        return Review.find({
            name: name
        }).limit(7);
    },
    addReview: async function (review) {
        var rvw = await Review.findOne({ reviewer_no: review.reviewer_no });
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
    getClientsBySkillsCat: async function (gig) { // show be able to to ensure Gig are approved and are not after the finalDay 
        var allWorkers = [];
        var skills = gig.skills.split(" ");
        for (skill of skills) {
            const currWorkers = await Worker.find({ category: gig.category }).find({ skills: { $regex: skill, $options: "i" } }).sort({ date: 1 });
            allWorkers = allWorkers.concat(currWorkers);
        }
        return allWorkers;
    },
    getWorkers: function (searchString, number) {
        return Worker.find({ $text: { $search: searchString }, expired: false }).skip(number).limit(7);
    },
    checkName: function (name) {
        return Worker.findOne({ name: name });
    },
    addPortfolio: function (portfolio) {
        return portfolio.save();
    },
    addPicture: function (no, url) {
        const filter = { no: no };
        const update = { pic: url };
        return Worker.findOneAndUpdate(filter, update);

    },
    getPortfolio: function (name) {
        return portfolioModel.find({
            name: name,
        })
    },
    addVA: async function (no, prices, faqs) {
        const filter = { no: no };
        const update = { prices: prices, faqs: faqs };
        return Worker.findOneAndUpdate(filter, update);
    }




}

