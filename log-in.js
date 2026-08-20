const password_eye = document.getElementById("password-eye")
const password_content = document.getElementById("password-content")
const go_to_sign_html = document.getElementById("go-to-sign-html")

//Deixar a senha visivel e mudar o ícone do olho.
password_eye.addEventListener("click", function(){

    if (password_content.type === "password") {

        password_content.type = "text"
        password_eye.src = "icons/eye_opened.svg"


    }else {

        password_content.type = "password"
        password_eye.src = "icons/eye_closed.svg"
    }


})

//Trocar para a página de registro de conta.
go_to_sign_html.addEventListener("click", function(){

    go_to_sign_html.href = "sign-in_page.html"

})