import { auth } from "/js/firebase_config.js"
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

const form = document.getElementById("forgot-password-form")
const email_content = document.getElementById("email-content")
const send_button = document.getElementById("send-button")
const button_text = document.getElementById("button-text")
const message = document.getElementById("message")

form.addEventListener("submit", async function(event){

    event.preventDefault()

    const email = email_content.value.trim()

    if (!email){

        show_message("Digite seu email.", "error")
        return
    }

    send_button.disabled = true
    button_text.textContent = "Enviando..."
    show_message("", "")

    try {

        await sendPasswordResetEmail(auth,email)

        show_message("Email enviado! Verifique sua caixa de entrada(e o SPAM).","success")


        email_content.value = ""
        
        send_button.disabled = false
        button_text.textContent = "Reenviar Link"
    }catch(error){

        console.log("Erro:", error.code, error.message)
        
        send_button.disabled = false
        button_text.textContent = "Enviar Link de Recuperação"

            if (error.code === "auth/user-not-found") {
            show_message("Nenhuma conta encontrada com este email.", "error")
        } else if (error.code === "auth/invalid-email") {
            show_message("Email inválido.", "error")
        } else if (error.code === "auth/too-many-requests") {
            show_message("Muitas tentativas. Aguarde alguns minutos.", "error")
        } else {
            show_message("Erro: " + error.message, "error")
        }
    }
})

function show_message(text, type) {
    message.textContent = text
    message.className = "message"
    
    if (type) {
        message.classList.add("message-" + type)
    }
}