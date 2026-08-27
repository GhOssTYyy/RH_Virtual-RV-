const clock_in_register = document.getElementById("clock-in-register")
const actual_time = document.getElementById("actual-time")
const actual_date = document.getElementById("actual-date")

document.addEventListener("DOMContentLoaded", function(){
    const actual_date = register_the_clock()
    
    const date_element = document.createElement("output")
    date_element.textContent = actual_date
    actual_time.append(date_element)

    setInterval( function(){
        actual_date_and_time.textContent = register_the_clock()
    }, 60000)


})

clock_in_register.addEventListener("click", function(){

    register_the_clock()
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

