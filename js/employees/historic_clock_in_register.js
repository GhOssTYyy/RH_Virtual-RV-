import {auth, db } from "../firebase_config.js"
import { collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"

async function get_all_user_clock_in_registers() {
    
    const user = auth.currentUser

    if (!user) {
        alert("Você precisa estar logado!")
        return
    }


    const historic_clock_in_register_container = document.getElementById("historic-clock-in-register-container")

    try {

        const collection_variable = collection(db, "Clock_in_registers_day")
        const consult_of_historic_clock_in = query(
            collection_variable,
            where("employee_id","==", user.uid),
            orderBy("date", "desc")
        )

        const result = await getDocs(consult_of_historic_clock_in)

        if (result.empty) {
            historic_clock_in_register_container.innerHTML = "<p class='vazio'>Nenhum registro encontrado</p>"
            return
        }

        const clock_in_registers_array = []
        result.forEach(function(document){

            clock_in_registers_array.push(document.data())
        })

        const clock_in_registers_organized = organized_clock_in_year_month(clock_in_registers_array)

        display_historic_of_clock_in(clock_in_registers_organized, historic_clock_in_register_container)

    } catch (error) {

        historic_clock_in_register_container.innerHTML = "<p class='erro'>Erro ao carregar histórico</p>"
    }
}


function organized_clock_in_year_month(registers) {

    const organized_clock_in = {}

    registers.forEach(function(register){

        const [year, month, day] = register.date.split("-")

        if (!organized_clock_in[year]) {
            organized_clock_in[year] = {}
        }
        

        if (!organized_clock_in[year][month]) {
           organized_clock_in[year][month] = []
        }

        organized_clock_in[year][month].push({
            day : day,
            ...register
        })
    })

    return organized_clock_in
}


function display_historic_of_clock_in(organized_clock_in, historic_clock_in_register_container){

    const month_names_in_portuguese = {
        "01": "Janeiro",
        "02": "Fevereiro",
        "03": "Março",
        "04": "Abril",
        "05": "Maio",
        "06": "Junho",
        "07": "Julho",
        "08": "Agosto",
        "09": "Setembro",
        "10": "Outubro",
        "11": "Novembro",
        "12": "Dezembro"
    }

    historic_clock_in_register_container.innerHTML = ""

    const clock_in_register_years = Object.keys(organized_clock_in).sort().reverse()

    clock_in_register_years.forEach(function(year){

        const year_html_block = document.createElement("div")
        year_html_block.className = "year-html-block"

        const year_html_title = document.createElement("h2")
        year_html_title.className = "year-html-title"
        year_html_title.textContent = `📅 ${year}`
        year_html_block.appendChild(year_html_title)


        const clock_in_registers_months = Object.keys(organized_clock_in[year]).sort().reverse()

        clock_in_registers_months.forEach(function(month){

            const month_html_block = document.createElement("div")
            month_html_block.className = "month-html-block"

            const month_html_title = document.createElement("h3")
            month_html_title.className = "month-html-title"
            month_html_title.textContent = `📆 ${month_names_in_portuguese[month]}`
            month_html_block.appendChild(month_html_title)

            const historic_clock_in_table = document.createElement("table")
            historic_clock_in_table.className = "historic-clock-in-table"

            historic_clock_in_table.innerHTML = `

                <thead>
                    <tr>
                        <th>Dia</th>
                        <th>Entrada</th>
                        <th>Almoço</th>
                        <th>Volta</th>
                        <th>Saída</th>
                        <th>Horas</th>
                        <th>Extras</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `

            const tbody = historic_clock_in_table.querySelector("tbody")

            const clock_in_register_organized_days = organized_clock_in[year][month].sort((a,b) => b.day.localeCompare(a.day))

            clock_in_register_organized_days.forEach(function(register){

                const line = document.createElement("tr")

                let extra_text = "-"
                let extra_class = ""

                if (register.extra_hours) {

                    if (register.is_extra_hour){
                        extra_text = `+ ${register.extra_hours}`
                        extra_class = "extra-hours-positive"
                } else{

                    extra_text = `-${register.extra_hours}`
                    extra_class = "extra-hours-negative"
                }
            }
                line.innerHTML = `
                    <td>${register.day}</td>
                    <td>${register.entrada || "-"}</td>
                    <td>${register.inicio_almoco || "-"}</td>
                    <td>${register.fim_almoco || "-"}</td>
                    <td>${register.saida || "-"}</td>
                    <td>${register.hours_worked || "-"}</td>
                    <td class="${extra_class}">${extra_text}</td>
                `

                tbody.appendChild(line)
            })

            month_html_block.appendChild(historic_clock_in_table)
            year_html_block.appendChild(month_html_block)
            
        })

        historic_clock_in_register_container.appendChild(year_html_block)
    })
}

document.addEventListener("DOMContentLoaded", function() {
    
    get_all_user_clock_in_registers()
})