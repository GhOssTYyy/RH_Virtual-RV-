const arrow_back_page = document.getElementById("arrow-back-page")

arrow_back_page.addEventListener("click", function(){

    window.location.href = "index.html"

})

function show_password(password_id, eye_id){

    const password_content = document.getElementById(password_id)
    const password_eye = document.getElementById(eye_id)

    password_eye.addEventListener("click", function(){

        if (password_content.type === "password") {

            password_content.type = "text"
            password_eye.src = "icons/eye_opened.svg"

        }else {

            password_content.type = "password"
            password_eye.src = "icons/eye_closed.svg"
        }
    })
}

show_password("password-content-1", "password-eye-1")
show_password("password-content-2", "password-eye-2")