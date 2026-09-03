const times_of_clock_in = {

    fixed_times : {

        entry : "8:00",
        begin_dinner : "12:00",
        ending_dinner : "13:00",
        exit : "17:00"
    },

    tolerance : {

        start_entry_tolerance : 60,
        entry_arrive_late : 10,
        extra_hours : 120
    }
}



function convert_time_to_minutes(time){

    const split_time = time.split(":")
    const format_hours_time = Number(split_time[0])
    const format_minutes_time = Number(split_time[1])

    return format_hours_time * 60 + format_minutes_time
}



function convert_minutes_to_hours(minutes){

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    const formated_hours = String(hours).padStart(2, "0")
    const formated_minutes = String(mins).padStart(2, "0")

    return formated_hours + ":" + formated_minutes
}



function get_actual_minutes(){
    
    const actual_minute = new Date()

    return actual_minute.getHours() * 60 + actual_minute.getMinutes()
}



function discover_actual_clock_in_period(){

    const actual_time_in_minutes = get_actual_minutes()

    const entry = convert_time_to_minutes(times_of_clock_in.fixed_times.entry)
    const begin_dinner = convert_time_to_minutes(times_of_clock_in.fixed_times.begin_dinner)
    const ending_dinner = convert_time_to_minutes(times_of_clock_in.fixed_times.ending_dinner)
    const exit = convert_time_to_minutes(times_of_clock_in.fixed_times.exit)



    const start_entry_tolerance = entry - times_of_clock_in.tolerance.start_entry_tolerance
    const entry_arrive_late_tolerance = entry + times_of_clock_in.tolerance.entry_arrive_late


    const extra_hours = exit + times_of_clock_in.tolerance.extra_hours

    if (actual_time_in_minutes < start_entry_tolerance) return "muito_cedo";
    if (actual_time_in_minutes <= entry_arrive_late_tolerance) return "periodo_entrada";
    if (actual_time_in_minutes < begin_dinner) return "trabalhando_manha";
    if (actual_time_in_minutes === begin_dinner) return "periodo_almoco";
    if (actual_time_in_minutes < ending_dinner) return "em_almoco";
    if (actual_time_in_minutes === ending_dinner) return "periodo_volta";
    if (actual_time_in_minutes < exit) return "trabalhando_tarde";
    if (actual_time_in_minutes <= extra_hours) return "periodo_saida";
    
    return "fora_expediente";
}



function update_to_display(){

    const actual_period = discover_actual_clock_in_period()

    const clock_in_register = document.getElementById("clock-in-register")
    const button_text = document.getElementById("button-text")


    switch (actual_period) {
    case "muito_cedo":
        button_text.textContent = "Muito cedo";
        clock_in_register.disabled = true;
        break;
    
    case "periodo_entrada":
        button_text.textContent = "Registrar Entrada";
        clock_in_register.disabled = false;
        break;
    
    case "trabalhando_manha":
    case "trabalhando_tarde":
        button_text.textContent = "Trabalhando";
        clock_in_register.disabled = true;
        break;
    
    case "periodo_almoco":
        button_text.textContent = "Iniciar Almoço";
        clock_in_register.disabled = false;
        break;
    
    case "em_almoco":
        button_text.textContent = "Em Almoço";
        clock_in_register.disabled = true;
        break;
    
    case "periodo_volta":
        button_text.textContent = "Voltar do Almoço";
        clock_in_register.disabled = false;
        break;
    
    case "periodo_saida":
        button_text.textContent = "Registrar Saída";
        clock_in_register.disabled = false;
        break;
    
    case "fora_expediente":
        button_text.textContent = "Fora do Expediente";
        clock_in_register.disabled = true;
        break;
    
    default:
        button_text.textContent = "Carregando...";
        clock_in_register.disabled = true;
}
}



document.addEventListener("DOMContentLoaded", function(){

    update_to_display()
})

setInterval(update_to_display, 30000)

export {discover_actual_clock_in_period, }