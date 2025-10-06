import { initializeApp } from '@react-native-firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyC2y09hsGoyXgh8kF6cOkDUsW-FD3q5QuM",
  authDomain: "shopping-scanner-app.firebaseapp.com",
  projectId: "shopping-scanner-app",
  storageBucket: "shopping-scanner-app.firebasestorage.app",
  messagingSenderId: "309362127079",
  appId: "1:309362127079:web:561d430179fc0f48a2f242",
  measurementId: "G-HXR8G8200H"
};

export const initializeFirebase = () => {
  initializeApp(firebaseConfig);
};