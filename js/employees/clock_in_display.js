import { auth, db } from "../firebase_config.js"
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { discover_actual_clock_in_period, convert_time_to_minutes, convert_minutes_to_hours } from "./clock_in_verification.js"


// Header
const header_back_button = document.getElementById("header-back-button")
const header_menu_button = document.getElementById("header-menu-button")


// Card do Funcionário
const avatar = document.getElementById("avatar")
const greeting_text = document.getElementById("greeting-text")
const full_date_text = document.getElementById("full-date-text")
const status_text = document.getElementById("status-text")


// Card do Relógio
const clock_time_screen = document.getElementById("clock-time-screen")
const clock_date_screen = document.getElementById("clock-date-screen")
const clock_in_message = document.getElementById("clock-in-message")


// Botão Principal
const clock_in_register_button = document.getElementById("clock-in-register-button")
const button_title_text = document.getElementById("button-title-text")
const button_subtitle_text = document.getElementById("button-subtitle-text")


// Resumo
const entry_clock_in_register = document.getElementById("entry-clock-in-register")
const begin_dinner_clock_in_register = document.getElementById("begin-dinner-clock-in-register")
const ending_dinner_clock_in_register = document.getElementById("ending-dinner-clock-in-register")
const exit_clock_in_register = document.getElementById("exit-clock-in-register")


// Status do Resumo
const entry_status = document.getElementById("entry-status")
const begin_dinner_status = document.getElementById("begin-dinner-status")
const ending_dinner_status = document.getElementById("ending-dinner-status")
const exit_status = document.getElementById("exit-status")


// Saldo
const worked_hours_balance = document.getElementById("worked-hours-balance")
const worked_hours_status = document.getElementById("worked-hours-status")
const extra_hours_balance = document.getElementById("extra-hours-balance")
const extra_hours_status = document.getElementById("extra-hours-status")


// Botão Histórico
const clock_in_history_button = document.getElementById("clock-in-history-button")


// Variáveis de controle
let entry_registered = false
let begin_dinner_registered = false
let ending_dinner_registered = false
let exit_registered = false
let registered_something = false

let user_name = ""


// Função de saudação conforme a hora
function generate_greeting() {
    const hour = new Date().getHours()
    
    if (hour < 12) {
        return "Bom dia"
    } else if (hour < 18) {
        return "Boa tarde"
    } else {
        return "Boa noite"
    }
}


// Função de data completa por extenso
function generate_full_date() {
    const now = new Date()
    
    return now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    })
}


// Função de data (para o relógio)
function generate_short_date() {
    const now = new Date()
    
    const week_day = now.toLocaleDateString("pt-BR", { weekday: "long" })
    const date = now.toLocaleDateString("pt-BR")
    
    return `${week_day} · ${date}`
}


// Função de relógio em tempo real
function update_clock() {
    const now = new Date()
    
    const time = now.toLocaleTimeString("pt-BR")
    clock_time_screen.textContent = time
    
    clock_date_screen.textContent = generate_short_date()
    
    if (user_name) {
        greeting_text.textContent = `${generate_greeting()}, ${user_name}!`
    }
}


// Função de status de funcionário
function update_status() {
    const period = discover_actual_clock_in_period()
    
    if (period === "periodo_entrada" 
        || period === "trabalhando_manha" 
        || period === "periodo_almoco" 
        || period === "em_almoco" 
        || period === "periodo_volta" 
        || period === "trabalhando_tarde" 
        || period === "periodo_saida") {
        status_text.textContent = "Em expediente"
    } else {
        status_text.textContent = "Fora do expediente"
    }
}



// Função de atualizar o botão (texto + subtítulo)
function update_button() {
    const period = discover_actual_clock_in_period()
    
    let title = "REGISTRAR PONTO"
    let subtitle = "Toque para registrar"
    let disabled = false
    
    switch (period) {
        case "muito_cedo":
            title = "MUITO CEDO"
            subtitle = "Aguarde o horário"
            disabled = true
            break
        
        case "periodo_entrada":
            title = "REGISTRAR ENTRADA"
            subtitle = "Início do expediente"
            break
        
        case "trabalhando_manha":
            title = "TRABALHANDO"
            subtitle = "Aguardando intervalo"
            disabled = true
            break
        
        case "periodo_almoco":
            title = "REGISTRAR INTERVALO"
            subtitle = "Início do intervalo"
            break
        
        case "em_almoco":
            title = "EM INTERVALO"
            subtitle = "Bom descanso!"
            disabled = true
            break
        
        case "periodo_volta":
            title = "VOLTAR DO INTERVALO"
            subtitle = "Retorno do intervalo"
            break
        
        case "trabalhando_tarde":
            title = "TRABALHANDO"
            subtitle = "Aguardando saída"
            disabled = true
            break
        
        case "periodo_saida":
            title = "REGISTRAR SAÍDA"
            subtitle = "Fim do expediente"
            break
        
        case "fora_expediente":
            title = "FORA DO EXPEDIENTE"
            subtitle = "Até amanhã!"
            disabled = true
            break
    }
    
    button_title_text.textContent = title
    button_subtitle_text.textContent = subtitle
    clock_in_register_button.disabled = disabled
}



// Função de calcular horas e horas extras
function calculate_daily_hours() {
    
    const entry = localStorage.getItem("entry_saved")
    const begin_dinner = localStorage.getItem("beggin_dinner_saved")
    const ending_dinner = localStorage.getItem("ending_dinner_saved")
    const exit = localStorage.getItem("exit_saved")
    
    if (!entry) {
        return null
    }
    
    const entry_min = convert_time_to_minutes(entry)
    const now = new Date()
    const now_min = now.getHours() * 60 + now.getMinutes()
    
    let exit_min
    if (exit) {
        exit_min = convert_time_to_minutes(exit)
    } else {
        exit_min = now_min
    }
    
    let total_at_work = exit_min - entry_min
    let lunch_time = 0
    
    if (begin_dinner && ending_dinner) {
        const begin_min = convert_time_to_minutes(begin_dinner)
        const ending_min = convert_time_to_minutes(ending_dinner)
        lunch_time = ending_min - begin_min
    } else if (begin_dinner && !ending_dinner) {
        const begin_min = convert_time_to_minutes(begin_dinner)
        total_at_work = begin_min - entry_min
        lunch_time = 0
    }
    
    const total_worked = total_at_work - lunch_time
    const base = 8 * 60
    const extra = total_worked - base
    
    return {
        hours_worked: convert_minutes_to_hours(total_worked),
        hours_worked_minutes: total_worked,
        extra_hours: convert_minutes_to_hours(Math.abs(extra)),
        is_extra_hour: extra > 0,
        extra_minutes: extra,
        is_working: !exit,
        has_extra: extra !== 0
    }
}


// Função de atualizar saldo do dia
function update_balance() {
    
    const result = calculate_daily_hours()
    
    if (!result) {
        worked_hours_balance.textContent = "00:00"
        worked_hours_status.textContent = "aguardando"
        worked_hours_status.style.color = "var(--cinza-texto)"
        
        extra_hours_balance.textContent = "+00:00"
        extra_hours_status.textContent = "neutro"
        extra_hours_status.style.color = "var(--cinza-texto)"
        return
    }
    
    // Horas trabalhadas
    worked_hours_balance.textContent = result.hours_worked
    
    if (result.is_working) {
        worked_hours_status.textContent = "até agora"
        worked_hours_status.style.color = "var(--cinza-texto)"
    } else {
        worked_hours_status.textContent = "finalizado"
        worked_hours_status.style.color = "var(--verde)"
    }
    
    // Extras/Débito
    const extra_minutes = result.extra_minutes
    
    if (extra_minutes > 0) {
        extra_hours_balance.textContent = "+" + result.extra_hours
        extra_hours_status.textContent = "positivo"
        extra_hours_status.style.color = "var(--verde)"
        
    } else if (extra_minutes < 0) {
        extra_hours_balance.textContent = "-" + result.extra_hours
        extra_hours_status.textContent = "negativo"
        extra_hours_status.style.color = "var(--laranja)"
        
    } else {
        extra_hours_balance.textContent = "00:00"
        extra_hours_status.textContent = "neutro"
        extra_hours_status.style.color = "var(--cinza-texto)"
    }
}



// Função atualizar resumo
function update_summary_status() {
    
    entry_status.textContent = entry_registered ? "✓" : "Pendente"
    entry_status.style.color = entry_registered ? "var(--verde)" : "var(--laranja)"
    
    begin_dinner_status.textContent = begin_dinner_registered ? "✓" : "Pendente"
    begin_dinner_status.style.color = begin_dinner_registered ? "var(--verde)" : "var(--laranja)"
    
    ending_dinner_status.textContent = ending_dinner_registered ? "✓" : "Pendente"
    ending_dinner_status.style.color = ending_dinner_registered ? "var(--verde)" : "var(--laranja)"
    
    exit_status.textContent = exit_registered ? "✓" : "Pendente"
    exit_status.style.color = exit_registered ? "var(--verde)" : "var(--laranja)"
}



// Função de restaurar do localstorage
function restore_clock_in_from_local_storage() {
    
    const current_date = new Date().toLocaleDateString("pt-BR")
    const saved_date = localStorage.getItem("date_saved_in_local_storage")
    
    if (saved_date !== current_date) {
        localStorage.removeItem("entry_saved")
        localStorage.removeItem("beggin_dinner_saved")
        localStorage.removeItem("ending_dinner_saved")
        localStorage.removeItem("exit_saved")
    } else {
        const entry_saved = localStorage.getItem("entry_saved")
        if (entry_saved) {
            entry_clock_in_register.textContent = entry_saved
            entry_registered = true
        }
        
        const begin_dinner_saved = localStorage.getItem("beggin_dinner_saved")
        if (begin_dinner_saved) {
            begin_dinner_clock_in_register.textContent = begin_dinner_saved
            begin_dinner_registered = true
        }
        
        const ending_dinner_saved = localStorage.getItem("ending_dinner_saved")
        if (ending_dinner_saved) {
            ending_dinner_clock_in_register.textContent = ending_dinner_saved
            ending_dinner_registered = true
        }
        
        const exit_saved = localStorage.getItem("exit_saved")
        if (exit_saved) {
            exit_clock_in_register.textContent = exit_saved
            exit_registered = true
        }
    }
    
    localStorage.setItem("date_saved_in_local_storage", current_date)
}



// Função de salvar no firebase
async function save_clock_in_to_database(clock_in_type, time) {
    
    const user = auth.currentUser
    if (!user) {
        alert("Você precisa estar logado!")
        return
    }
    
    const current_date_formatted = new Date().toISOString().split('T')[0]
    const document_id = current_date_formatted + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id)
    
    try {
        await setDoc(document_reference, {
            employee_id: user.uid,
            employee_email: user.email,
            date: current_date_formatted,
            [clock_in_type]: time
        }, { merge: true })
        
        console.log("✅ Ponto salvo:", clock_in_type)
        
    } catch (error) {
        console.log("❌ Erro ao salvar ponto:", error.code, error.message)
    }
}



// Função de salvar as horas
async function save_hours_to_database(result) {
    
    const user = auth.currentUser
    if (!user) return
    
    const current_date_formatted = new Date().toISOString().split('T')[0]
    const document_id = current_date_formatted + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id)
    
    try {
        await setDoc(document_reference, {
            employee_id: user.uid,
            employee_email: user.email,
            date: current_date_formatted,
            hours_worked: result.hours_worked,
            extra_hours: result.extra_hours,
            is_extra_hour: result.is_extra_hour
        }, { merge: true })
        
        console.log("✅ Horas salvas:", result.hours_worked)
        
    } catch (error) {
        console.log("❌ Erro ao salvar horas:", error.code, error.message)
    }
}


// Função de mostrar a mensagem
function show_message(text) {
    clock_in_message.textContent = text
    
    setTimeout(() => {
        clock_in_message.textContent = ""
    }, 4000)
}


// Registrar ponto
clock_in_register_button.addEventListener("click", async function() {
    
    const formatted_time = get_current_time()
    const current_period = discover_actual_clock_in_period()
    registered_something = false
    
    // entrada
    if (current_period === "periodo_entrada" && entry_registered === false) {
        
        if (localStorage.getItem("entry_saved")) {
            show_message("❌ Você já registrou a ENTRADA hoje!")
            return
        }
        
        entry_clock_in_register.textContent = formatted_time
        show_message(`✅ Entrada registrada às ${formatted_time}`)
        
        await save_clock_in_to_database("entrada", formatted_time)
        localStorage.setItem("entry_saved", formatted_time)
        
        entry_registered = true
        registered_something = true
    }
    
    // Início do intervalo
    if (current_period === "periodo_almoco" && begin_dinner_registered === false) {
        
        begin_dinner_clock_in_register.textContent = formatted_time
        
        await save_clock_in_to_database("inicio_almoco", formatted_time)
        localStorage.setItem("beggin_dinner_saved", formatted_time)
        
        begin_dinner_registered = true
        registered_something = true
        show_message(`✅ Intervalo iniciado às ${formatted_time}`)
    }
    
    // Volta do intervalo
    if (current_period === "periodo_volta" && ending_dinner_registered === false) {
        
        ending_dinner_clock_in_register.textContent = formatted_time
        
        await save_clock_in_to_database("fim_almoco", formatted_time)
        localStorage.setItem("ending_dinner_saved", formatted_time)
        
        ending_dinner_registered = true
        registered_something = true
        show_message(`✅ Retorno registrado às ${formatted_time}`)
    }
    
    // Saída
    if (current_period === "periodo_saida" && exit_registered === false) {
        
        exit_clock_in_register.textContent = formatted_time
        
        await save_clock_in_to_database("saida", formatted_time)
        localStorage.setItem("exit_saved", formatted_time)
        
        exit_registered = true
        registered_something = true
        
        // Calcula extras
        const result = calculate_daily_hours()
        
        if (result) {
            await save_hours_to_database(result)
        }
        
        show_message(`✅ Saída registrada às ${formatted_time}`)
    }
    
    // Se nada foi registrado
    if (!registered_something) {
        show_message("❌ Não é possível registrar agora!")
    }
    
    // ✅ Atualiza a interface
    update_button()
    update_summary_status()
    update_balance()
})



// Função da hora atual (HH:MM)
function get_current_time() {
    const now = new Date()
    return now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })
}


// Botão histórico
clock_in_history_button.addEventListener("click", function() {
    window.location.href = "/pages/employees/historic-clock-in-register.html"
})


// Botão voltar (HEADER)
header_back_button.addEventListener("click", function() {
    window.location.href = "/pages/employees/main-page.html"
})


// Botão menu (HEADER)
header_menu_button.addEventListener("click", function() {
    alert("Em breve: Menu")
})


// INICIALIZAÇÃO
onAuthStateChanged(auth, function(user) {
    
    if (!user) {
        window.location.href = "/index.html"
        return
    }
    
    
    // Extrai o nome
    user_name = user.email.split("@")[0]
    user_name = user_name.charAt(0).toUpperCase() + user_name.slice(1)
    
    // Atualiza saudação
    greeting_text.textContent = `${generate_greeting()}, ${user_name}!`
    full_date_text.textContent = generate_full_date()
    
    // Atualiza avatar
    avatar.textContent = user_name.substring(0, 2).toUpperCase()
    
    // Restaura
    restore_clock_in_from_local_storage()
    
    // Relógio
    update_clock()
    setInterval(update_clock, 1000)
    
    // Atualiza tudo
    update_button()
    update_status()
    update_summary_status()
    update_balance()
    
    // Atualiza a cada 30s
    setInterval(() => {
        update_button()
        update_status()
        update_summary_status()
        update_balance()
    }, 30000)
})