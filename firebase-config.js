// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    writeBatch, 
    enableIndexedDbPersistence 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAWhNkYnC2n4iuHvdp1O_-S5suxivDidgc",
    authDomain: "cash-84acc.firebaseapp.com",
    projectId: "cash-84acc",
    storageBucket: "cash-84acc.appspot.com",
    messagingSenderId: "774737678098",
    appId: "1:774737678098:web:8b918375b4e51692b7edcb",
    measurementId: "G-GRKNPJ45N1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
      if (err.code == 'failed-precondition') {
          console.warn("Multiple tabs open, persistence can only be enabled in one tab at a time.");
      } else if (err.code == 'unimplemented') {
          console.warn("The current browser does not support all of the features required to enable persistence.");
      }
  });

// Export firestore functions to be used in other files
export { 
    db,
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    serverTimestamp, 
    doc, 
    updateDoc, 
    deleteDoc, 
    getDoc, 
    writeBatch 
};
