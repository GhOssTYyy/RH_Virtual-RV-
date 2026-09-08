const arrow_back_page = document.getElementById("arrow-back-page")
const email_content = document.getElementById("email-content")
const password_content_1 = document.getElementById("password-content-1")
const password_content_2 = document.getElementById("password-content-2")
const register_account = document.getElementById("register-account")

import { auth } from "./fire_base_config.js"
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

arrow_back_page.addEventListener("click", function(){

    window.location.href = "index.html"

})

function show_password(password_id, eye_id){

    const password_content = document.getElementById(password_id)
    const password_eye = document.getElementById(eye_id)

    password_eye.addEventListener("click", function(){

        if (password_content.type === "password") {

            password_content.type = "text"
            password_eye.src = "assets/icons/eye_opened.svg"

        }else {

            password_content.type = "password"
            password_eye.src = "assets/icons/eye_closed.svg"
        }
    })
}

show_password("password-content-1", "password-eye-1")
show_password("password-content-2", "password-eye-2")

register_account.addEventListener("click", async function(event){

    event.preventDefault()

    const email_input = email_content.value
    const password_input_1 = password_content_1.value
    const password_input_2 = password_content_2.value

    if (password_input_1.value !== password_input_2.value){

        alert("As senhas não coincidem!")
        return
    }

    try {

        const register_result = await createUserWithEmailAndPassword(auth, email_input, password_input_1)
        const username = register_result.user
         console.log("✅ Conta criada:", username.email)
        alert("Conta criada com sucesso!")
        window.location.href = "index.html"
    } catch{

    if (error.code === "auth/email-already-in-use") {
        alert("Este email já está cadastrado!")
    } else if (error.code === "auth/weak-password") {
        alert("Senha muito fraca!")
    } else if (error.code === "auth/invalid-email") {
        alert("Email inválido!")
    } else {
        alert("Erro: " + error.message)
    }
    }
})