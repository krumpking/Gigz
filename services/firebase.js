
var admin = require("firebase-admin");

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const storage = admin.storage();



module.exports = {
  getRentalPropertyClientMatches: async function () {

    const res = await db.collection('rentalproperty')
      .where("approved", "==", true)
      .orderBy("day", "desc").limit(7).get();


    return res;

  },
  getRentalNextPropertyClientMatches: async function (lastVisible) {

    const res = await db.collection('rentalproperty')
      .where("approved", "==", true)
      .orderBy("day", "desc").startAfter(lastVisible).limit(7).get();


    return res;

  },
  addRentalProperty: (day, city, description, author, id) => {
    return db.collection('rentalproperty').add({
      day: day, // day of the year
      city: city,
      description: description,
      author: author,
      approved: false,
      id: id
    })
  },
  getRentalPropertyById: async function (id) {

    const res = await db.collection('rentalproperty')
      .where("approved", "==", true)
      .where("id", "==", id).get();


    return res;

  },
  addImage: async function (name, imageString, saveAs) {
    var storageRef = firebase.storage().ref().child(`${name}/${saveAs}`);
    let url = "";
    try {
      url = await storageRef.getDownloadURL();
      storageRef.putString(imageString, 'base64').then(function (snapshot) {
        console.log('Uploaded a base64 string!');
      });

      return url;
    } catch (e) {
      console.error(e);
      return null;
    }

  }




}