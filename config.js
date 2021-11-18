import * as firebase from 'firebase'
require("@firebase/firestore")

var firebaseConfig = {
    apiKey: "AIzaSyBO7HhssGviBYwUow4p_DPiUmSUd-iWtRA",
    authDomain: "wily-a8cf6.firebaseapp.com",
    projectId: "wily-a8cf6",
    storageBucket: "wily-a8cf6.appspot.com",
    messagingSenderId: "288574075919",
    appId: "1:288574075919:web:bdd8c6c3d2f7364ed4df7a"
  };

if(!firebase.apps.length)
firebase.initializeApp(firebaseConfig);

export default firebase.firestore();
  