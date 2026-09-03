
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

//Ao apertar o botão o ponto é registrado
clock_in_register.addEventListener("click", function(){

    const actual_time_formated_hours = register_the_clock()
    const actual_period = discover_actual_clock_in_period()

    if (actual_period === "periodo_entrada" && entry_registered === false){

        const time_element = document.createElement("output")
        time_element.textContent = actual_time_formated_hours
        entry_clock_in_register.append(time_element)

        entry_registered = true
    }

    if (actual_period === "periodo_almoco" && begin_dinner_registered === false){

        const time_2_element = document.createElement("output")
        time_2_element.textContent = actual_time_formated_hours
        begin_dinner_clock_in_register.append(time_2_element)

        begin_dinner_registered = true
    }

    if (actual_period === "periodo_almoco" && ){

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

