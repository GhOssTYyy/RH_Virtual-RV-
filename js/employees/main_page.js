import { auth } from "../firebase_config.js"
import { signOut } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"

const clock_in_button =  document.getElementById("clock-in-button")
const holiday_and_day_off = document.getElementById("holiday-and-day-off")
const logout_button = document.getElementById("logout-button")

clock_in_button.addEventListener("click", function(){

    window.location.href = "/pages/employees/clock-in.html"

})

holiday_and_day_off.addEventListener("click", function(){

    window.location.href = "/pages/employees/holiday-day-off.html"

})

logout_button.addEventListener("click", async function(){

    const confirm_logout = confirm("Deseja realmente sair?")

    if (!confirm_logout) return

    try {

        await signOut(auth)

        window.location.href = "/index.html"
    } catch(error) {

        alert("Erro ao sair, Tente novamente.")
    }
})