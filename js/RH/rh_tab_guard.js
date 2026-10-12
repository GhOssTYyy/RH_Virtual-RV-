import { auth } from "../firebase_config.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"


// =========================================================
// LISTA DE EMAILS COM ACESSO AO RH
// =========================================================
const emails_rh = [
    "jpandreiph@gmail.com"
]


// =========================================================
// MOSTRA A TAB RH SE O USUÁRIO FOR RH
// =========================================================
onAuthStateChanged(auth, function(user) {
    
    if (!user) return
    
    const tab_rh = document.getElementById("tab-rh")
    
    if (!tab_rh) return
    
    if (emails_rh.includes(user.email)) {
        tab_rh.style.display = "flex"
        console.log("✅ Tab RH ativada para:", user.email)
    } else {
        tab_rh.style.display = "none"
    }
})


// =========================================================
// NAVEGAÇÃO DA TAB RH
// =========================================================
const tab_rh = document.getElementById("tab-rh")

if (tab_rh) {
    tab_rh.addEventListener("click", function() {
        window.location.href = "/pages/RH/rh-dashboard.html"
    })
}