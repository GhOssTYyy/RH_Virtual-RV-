const clock_in_register = document.getElementById("clock-in-register")
const actual_time_screen = document.getElementById("actual-time-screen")
const actual_date_screen = document.getElementById("actual-date-screen")
const clock_in_message = document.getElementById("clock-in-message")

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
})



//Ao apertar o botão o ponto é registrado
clock_in_register.addEventListener("click", function(){

    const date_clock_in = register_the_clock()
    const message_base = `O seu ponto foi registrado ás ${date_clock_in}`

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

