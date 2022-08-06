
var admin = require("firebase-admin");
const uuid = require('uuid-v4');
var serviceAccount = require("../serviceAccountKey.json");
// Import the functions you need from the SDKs you need
const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL, uploadString } = require("firebase/storage");
// const { getAnalytics } = require("firebase/analytics");

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyALq4M9lKK5lUp8Sg5A_LfsycfzlKu8Goc",
  authDomain: "chub-996fa.firebaseapp.com",
  projectId: "chub-996fa",
  storageBucket: "chub-996fa.appspot.com",
  messagingSenderId: "942749215777",
  appId: "1:942749215777:web:0d1007a0a7e165814d4760",
  measurementId: "G-P10E0WRGYQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
// Initialize Cloud Storage and get a reference to the service
const storage = getStorage(app);
// const analytics = getAnalytics(app);



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
    const metadata = {
      contentType: 'image/jpeg',
    };
    let saveName = name.toLowerCase().replace(/\s/g, '');
    var storageRef = ref(storage, `${saveName}/${saveAs}`);
    let url = "";
    try {

      await uploadString(storageRef, imageString, 'base64', metadata);

      url = await getDownloadURL(storageRef);

      return url;
    } catch (e) {
      console.error(e);
      return null;
    }

  },
  addVisitor: (no, d) => {
    // logEvent(analytics, 'visitor', {
    //   no: no,
    //   date: d
    // });
  }




}