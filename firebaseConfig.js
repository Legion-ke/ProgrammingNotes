import { initializeApp, getApps } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // Your Firebase configuration
  apiKey: "AIzaSyAGIEPvgR3X3hxuI78YEiACnhwG8Ya1zTk",
  authDomain: "programmingnotesapp.firebaseapp.com",
  projectId: "programmingnotesapp",
  storageBucket: "programmingnotesapp.appspot.com",
  messagingSenderId: "866444077909",
  appId: "1:866444077909:web:f3b8eaa6431a0fedac1ddc",
  measurementId: "G-ZW8P9HBL15"
};

let app;
let auth;
let db;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
  db = getFirestore(app);
} else {
  app = getApps()[0];
  auth = app.auth();
  db = getFirestore(app);
}

export { db, auth };