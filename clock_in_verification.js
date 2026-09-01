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



function get_actual_hours(){

    const actual_hour = new Date()

    return actual_hour
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

/*  const janela_almoco_inicio = begin_dinner - times_of_clock_in.tolerance.start_dinner_tolerance
    const janela_almoco_fim = begin_dinner + times_of_clock_in.tolerance.dinner_arrive_late

    const janela_volta_inicio = ending_dinner - times_of_clock_in.tolerance.start_return_tolerance
    const janela_volta_fim = ending_dinner + times_of_clock_in.tolerance.return_arrive_late

    const janela_saida_inicio = exit - times_of_clock_in.tolerance.start_exit_tolerance */
    const extra_hours = exit + times_of_clock_in.tolerance.extra_hours
}

