import { auth } from "./firebase_config.js"
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

onAuthStateChanged(auth, async function(user) {
    
    if (!user) {

        window.location.href = "/index.html"
        return
    }
    

    if (!user.emailVerified) {

        alert("Você precisa verificar seu email!")
        await signOut(auth)
        window.location.href = "/index.html"
        return
    }

})