const AnswerModel = require('../models/answerModel');

module.exports = {
    addAnswer: function (answer) {
        return answer.save();
    },
    getAnswer: async function (question) {
        let results = await AnswerModel.find({
            $text: { $search: question }
        }).sort({ score: { $meta: "textScore" } }).where({ expired: false }).limit(1);
        let primary = true;
        if (!results.length > 0) {
            results = await AnswerModel.find({}).where({ expired: false }).limit(1);
            primary = false;
        }
        return {
            primary: primary,
            results: results,
        }
    }
}