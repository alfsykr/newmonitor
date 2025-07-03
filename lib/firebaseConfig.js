import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDGS5kvEcq4jYCh72VzrNtdiRQPQtT6u3g",
  authDomain: "monitoring-suhu-c2b68.firebaseapp.com",
  databaseURL: "https://monitoring-suhu-c2b68-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "monitoring-suhu-c2b68",
  storageBucket: "monitoring-suhu-c2b68.appspot.com",
  messagingSenderId: "968584293037",
  appId: "1:968584293037:web:c2c60081b86b9e4fb67424",
  measurementId: "G-G75B2B0KFH"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };