const clock_in_button =  document.getElementById("clock-in-button")
const holiday_and_day_off = document.getElementById("holiday-and-day-off")

clock_in_button.addEventListener("click", function(){

    window.location.href = "/pages/employees/clock-in.html"

})

holiday_and_day_off.addEventListener("click", function(){

    window.location.href = "/pages/employees/holiday-day-off.html"

})