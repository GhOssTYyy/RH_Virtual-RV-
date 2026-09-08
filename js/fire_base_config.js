import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"

const firebaseConfig = {
    apiKey:"AIzaSyDS-AfrZ6ORzH6dvEo5WP1Yjwz8PaeS0GA",
    authDomain: "rh-virtual-rv.firebaseapp.com",
    projectId: "rh-virtual-rv",
    storageBucket: "rh-virtual-rv.firebasestorage.app" ,
    messagingSenderId: "266794278171",
    appId: "1:266794278171:web:acad7f4e27a73d78a387be"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

console.log("✅ Firebase configurado!")
