//Configuração Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"

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
const db = getFirestore(app)


const clock_in_register = document.getElementById("clock-in-register")
const actual_time_screen = document.getElementById("actual-time-screen")
const actual_date_screen = document.getElementById("actual-date-screen")
const clock_in_message = document.getElementById("clock-in-message")
const actual_week_day_screen = document.getElementById("actual-week-day-screen")

const entry_clock_in_register = document.getElementById("entry-clock-in-register")
const begin_dinner_clock_in_register = document.getElementById("begin-dinner-clock-in-register")
const ending_dinner_clock_in_register = document.getElementById("ending-dinner-clock-in-register")
const exit_clock_in_register = document.getElementById("exit-clock-in-register")


import {discover_actual_clock_in_period } from "./clock_in_verification.js"



document.addEventListener("DOMContentLoaded", function(){

    //Exibição da hora quando aba é aberta usando as informações da função register_the_clock()
    const actual_time = register_the_clock()
    
    const time_element = document.createElement("output")
    time_element.textContent = actual_time
    actual_time_screen.append(time_element)

    //A cada 1 seg esse setInterval é acionado e atualiza na tela a hora
    setInterval( function(){
        actual_time_screen.textContent = register_the_clock()
    }, 1000)


    //Exibição da data usando as informações da função register_the_date()
    const actual_date = register_the_date()

    const date_element = document.createElement("output")
    date_element.textContent = actual_date
    actual_date_screen.append(date_element)


    //Exibição do dia da semana usando as informações da função register_the_week_date()
    const actual_week_date = register_the_week_date()

    const week_date_element = document.createElement("output")
    week_date_element.textContent = actual_week_date
    actual_week_day_screen.append(week_date_element)
})



let entry_registered = false
let begin_dinner_registered = false
let ending_dinner_registered = false
let exit_registered = false

//Ao apertar o botão o ponto é registrado
clock_in_register.addEventListener("click", function(){

    const actual_time_formated_hours = register_the_clock()
    const actual_period = discover_actual_clock_in_period()

    if (actual_period === "periodo_entrada" && entry_registered === false){

        entry_clock_in_register.replaceChildren()

        const time_element = document.createElement("output")
        time_element.textContent = actual_time_formated_hours
        entry_clock_in_register.append(time_element)

        save_the_clock_in_data_base("entrada", actual_time_formated_hours)
        entry_registered = true
    }

    if (actual_period === "periodo_almoco" && begin_dinner_registered === false){

        begin_dinner_clock_in_register.replaceChildren()

        const time_2_element = document.createElement("output")
        time_2_element.textContent = actual_time_formated_hours
        begin_dinner_clock_in_register.append(time_2_element)

        save_the_clock_in_data_base("inicio_almoco", actual_time_formated_hours)
        begin_dinner_registered = true
    }

    if (actual_period === "periodo_volta" && ending_dinner_registered === false){

        ending_dinner_clock_in_register.replaceChildren()

        const time_3_element = document.createElement("output")
        time_3_element.textContent = actual_time_formated_hours
        ending_dinner_clock_in_register.append(time_3_element)

        save_the_clock_in_data_base("fim_almoco", actual_time_formated_hours)
        ending_dinner_registered = true
    }

    if (actual_period === "periodo_saida" && exit_registered === false){

        exit_clock_in_register.replaceChildren()

        const time_4_element = document.createElement("output")
        time_4_element.textContent = actual_time_formated_hours
        exit_clock_in_register.append(time_4_element)

        save_the_clock_in_data_base("saida", actual_time_formated_hours)
        exit_registered = true
    }

    const message_base = `O seu ponto foi registrado ás ${actual_time_formated_hours}`

    if (clock_in_message.textContent === "") {
        const message_el = document.createElement("output")
        message_el.textContent = message_base
        clock_in_message.append(message_el)
        
    } else{

    }
})


function register_the_clock() {

    const actual_time = new Date()
    const time_formated = actual_time.toLocaleTimeString([],{
        hour :"2-digit",
        minute : "2-digit"
    })

    return time_formated
}


function register_the_date() {

    const actual_date = new Date()
    const date_formated = actual_date.toLocaleDateString()

    return date_formated
}


function register_the_week_date() {
    const actual_week_date = new Date()
    const day_of_the_week_formated = actual_week_date.toLocaleDateString("pt-BR", {weekday: "long"})

    return day_of_the_week_formated
}


async function save_the_clock_in_data_base(clock_in_register_type, time) {

    const user = auth.currentUser

    if (!user){
        alert("Você precisa estar logado!")
        return
    }

    const actual_date = register_the_date()
    const actual_date_formated_to_id = actual_date.toISOString().split('T')[0]

    const document_id_user = actual_date_formated_to_id + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id_user)
    const verify_exist_document = await getDoc(document_reference)

    try {

        if (verify_exist_document.exists()) {

            await updateDoc(document_reference, {

                [clock_in_register_type] : time
            })
        } else {

            await setDoc(document_reference, {

                employee_id: user.uid,
                employee_email: user.email,
                date: actual_date_formated_to_id,

                [clock_in_register_type] : time

            })
        }

    } catch(error){
        

    }

}
