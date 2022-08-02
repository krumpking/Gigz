var Worker = require('../models/workerModel');
var Reviews = require('../models/reviewsModel');
var Worker = require('../models/workerModel');
const WorkDone = require('../models/workdoneModel');

module.exports = {
    getWorker: function (no) {
        return Worker.findOne({ no: no });
    },
    saveWorker: function (worker) {
        return worker.save();
    },
    getWorkerById: function (id) {
        return Worker.findOne({
            id: id
        });
    },
    getWorkerReviews: function (name) {
        let search = name.toLowerCase().replace(/\s/g, '');
        return Reviews.find({
            urlName: search
        }).limit(7);
    },
    addReview: async function (review) {

        return review.save();

    },
    unsubscribe: async function (no) {
        return Worker.deleteOne({ no: no });
    },
    updateWorkerProfile: async function (worker, no) {
        const filter = { no: no };
        const update = { category: worker.category, skills: worker.skills, brief: worker.brief, areas: worker.areas };
        return Worker.findOneAndUpdate(filter, update);

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
    getWorkers: async function (searchString, number) {
        let results = await Worker.find({
            $text: { $search: searchString },
        }).sort({ score: { $meta: "textScore" } }).where({ expired: false }).skip(number).limit(7);
        let primary = true;
        if (!results.length > 0) {
            results = await Worker.find({}).where({ expired: false }).skip(number).limit(7);
            primary = false;
        }
        return {
            primary: primary,
            results: results,
        }



    },
    addFaq: async (no, info) => {
        let user = await Worker.findOne({ no, no });
        let faqs = user.faqs + ";" + info;
        let filter = { no: no };
        let update = { faqs: faqs };
        return Worker.findOneAndUpdate(filter, update);
    },
    addService: async (no, service) => {
        let user = await Worker.findOne({ no, no });
        let services = user.prices + ";" + info;
        let filter = { no: no };
        let update = { prices: services };
        return Worker.findOneAndUpdate(filter, update);
    },
    checkName: function (name) {
        let search = name.toLowerCase().replace(/\s/g, '');
        return Worker.findOne({ urlName: search });
    },
    addPortfolio: function (workdone) {
        return workdone.save();
    },
    addPicture: function (no, url) {
        const filter = { no: no };
        const update = { pic: url };
        return Worker.findOneAndUpdate(filter, update);

    },
    getPortfolio: function (name) {
        let search = name.toLowerCase().replace(/\s/g, '');
        return WorkDone.find({
            urlName: search,
        })
    },
    addVA: async function (no, prices, faqs) {
        const filter = { no: no };
        const update = { prices: prices, faqs: faqs };
        return Worker.findOneAndUpdate(filter, update);
    },
    updateAllOther: async function (no) {
        const filter = { no: no };
        const update = { package: "0", expired: false };
        return Worker.findOneAndUpdate(filter, update);
    },
    getAllWorkers: async function () {
        return Worker.find({});
    },
    removeBids: async function (bids, no) {

        let newAmount = bids - 1;
        const filter = { no: no };
        const update = { bids: parseInt(newAmount) };
        return Worker.findOneAndUpdate(filter, update);

    }




}

