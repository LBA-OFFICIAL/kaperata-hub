import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1. Determine the Firebase Configuration
let firebaseConfig;
if (typeof __firebase_config !== 'undefined') { 
  try { 
    firebaseConfig = JSON.parse(__firebase_config); 
  } catch (e) { 
    firebaseConfig = {}; 
  } 
} else { 
  firebaseConfig = { 
    apiKey: "AIzaSyByPoN0xDIfomiNHLQh2q4OS0tvhY9a_5w", 
    authDomain: "kaperata-hub.firebaseapp.com", 
    projectId: "kaperata-hub", 
    storageBucket: "kaperata-hub.firebasestorage.app", 
    messagingSenderId: "760060001621", 
    appId: "1:760060001621:web:1d0439eff2fb2d2e1143dc", 
    measurementId: "G-D2YNL39DSF" 
  }; 
}

// 2. Initialize Firebase instances
const app = initializeApp(firebaseConfig); 
const auth = getAuth(app); 
const db = getFirestore(app);

// 3. Format the App ID used in your Firestore document paths
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13'; 
const appId = rawAppId.replace(/[\/.]/g, '_'); 

// 4. Export them for use across the application
export { app, auth, db, appId };
