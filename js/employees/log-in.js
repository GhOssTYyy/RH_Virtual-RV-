import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

const firebaseConfig = {
    apiKey: "AIzaSyDS-AfrZ6ORzH6dvEo5WP1Yjwz8PaeS0GA",
    authDomain: "rh-virtual-rv.firebaseapp.com",
    projectId: "rh-virtual-rv",
    storageBucket: "rh-virtual-rv.firebasestorage.app",
    messagingSenderId: "266794278171",
    appId: "1:266794278171:web:acad7f4e27a73d78a387be"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)

const password_eye = document.getElementById("password-eye")
const email_content = document.getElementById("email-content")
const password_content = document.getElementById("password-content")
const go_to_sign_html = document.getElementById("go-to-sign-html")
const dark_mode_button = document.getElementById("dark-mode-button")
const login_button = document.getElementById("login-button")


const saved_local_storage_theme = localStorage.getItem("theme")
let page_is_on_dark_mode = false

if(saved_local_storage_theme === "dark"){
    
    document.documentElement.setAttribute("data-theme", "dark")
    dark_mode_button.src = "assets/icons/dark_mode_icon.svg"
    page_is_on_dark_mode = true
}


dark_mode_button.addEventListener("click", function(){

    if (page_is_on_dark_mode === false) {
        document.documentElement.setAttribute("data-theme","dark")
        dark_mode_button.src = "assets/icons/dark_mode_icon.svg"
        page_is_on_dark_mode = true
        localStorage.setItem("theme", "dark")
    } else {
        document.documentElement.removeAttribute("data-theme")
        dark_mode_button.src = "assets/icons/light_mode_icon.svg"
        page_is_on_dark_mode = false
        localStorage.setItem("theme", "light")
    }
})


//Deixar a senha visivel e mudar o ícone do olho.
password_eye.addEventListener("click", function(){

    if (password_content.type === "password") {

        password_content.type = "text"
        password_eye.src = "assets/icons/eye_opened.svg"


    }else {

        password_content.type = "password"
        password_eye.src = "assets/icons/eye_closed.svg"
    }


})

//Trocar para a página de registro de conta.
go_to_sign_html.addEventListener("click", function(){

    go_to_sign_html.href = "./sign-in-page.html"

})

//Botão de login redireciona para a página principal
login_button.addEventListener("click", async function(event) {
    
    event.preventDefault()
    
    const email_input = email_content.value
    const password_input = password_content.value
    
    try {
        const resultado = await signInWithEmailAndPassword(auth, email_input, password_input)
        const usuario = resultado.user
        
        console.log("✅ Logado:", usuario.email)
        window.location.href = "/pages/employees/main-page.html"
        
    } catch (error) {
        
        if (error.code === "auth/wrong-password") {
            alert("Senha incorreta!")
        } else if (error.code === "auth/user-not-found") {
            alert("Usuário não encontrado!")
        } else if (error.code === "auth/invalid-email") {
            alert("Email inválido!")
        } else {
            alert("Erro: " + error.message)
        }
    }
})