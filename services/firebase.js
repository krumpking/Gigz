
var admin = require("firebase-admin");

var serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore(); 



 module.exports = {
    getRentalPropertyClientMatches: async function (){

        const res = await db.collection('rentalproperty')
            .orderBy("day", "desc").limit(7).get();
    

        return res;
        
     },
   getRentalNextPropertyClientMatches: async function (lastVisible) {
       

        const res = await db.collection('rentalproperty')
        .orderBy("day", "desc").startAfter(lastVisible).limit(7).get();
    

        return res;
        
    },
   
	


 }