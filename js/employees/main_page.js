import { auth } from "../firebase_config.js"
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"


const welcome_name = document.getElementById("welcome-name")
const profile_picture = document.getElementById("profile-picture")
const settings_button = document.getElementById("settings-button")
const tabs = document.querySelectorAll(".tab")

const emails_rh = [
    "jpandreiph@gmail.com"
]

tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const target = tab.dataset.tab
        console.log("🚀 Tab clicada:", target)
        
        tabs.forEach(t => t.classList.remove("active"))
        tab.classList.add("active")
        
        if (target === "point") {

            window.location.href = "/pages/employees/clock-in.html"
        } else if (target === "holiday") {

            window.location.href = "/pages/employees/holiday-day-off.html"
        } else if (target === "profile") {

            alert("Em breve: Perfil do usuário!")
        } else if (target === "rh") {

            window.location.href = "/pages/RH/rh-dashboard.html"
        }
    })
})

profile_picture.addEventListener("click", function() {

    alert("Em breve: Perfil do usuário!")
})

settings_button.addEventListener("click", async function() {
    const confirm_logout = confirm("Deseja realmente sair?")
    if (!confirm_logout) return
    
    try {

        await signOut(auth)
        window.location.href = "/index.html"
    } catch(error) {

        alert("Erro ao sair. Tente novamente.")
    }
})

onAuthStateChanged(auth, function(user) {
    
    if (!user) {

        window.location.href = "/index.html"
        return
    }
    
    const nome = user.email.split("@")[0]
    welcome_name.textContent = `👋 Olá, ${nome}!`
    profile_picture.textContent = nome.charAt(0).toUpperCase()
    
    if (emails_rh.includes(user.email)) {
        
        const tab_rh = document.getElementById("tab-rh")
        if (tab_rh) {

            tab_rh.style.display = "flex"
        }
    }
})