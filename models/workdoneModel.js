var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var WorkDone = new Schema({
    name: { type: String, required: true },
    urlName: { type: String, required: true },
    no: { type: String, required: true },
    description: { type: String, required: true, index: "text" },
    imageUrl: { type: String, required: true },
    date: { type: Date },
});



// Export model.
module.exports = mongoose.model('WorkDone', WorkDone, 'workdone');	
