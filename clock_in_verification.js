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
    const 
}

function discover_the_period_of_clock_in(){
    
    const actual_time = new Date()
    const actual_time_conversion = clock_time.getHours * 60 + clock_time.getMinutes
}

