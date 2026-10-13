import { auth, db } from "../firebase_config.js"
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { discover_actual_clock_in_period, convert_time_to_minutes, convert_minutes_to_hours } from "./clock_in_verification.js"
import { verify_location } from "./clock_in_location.js"


// ============================================
// REFERÊNCIAS DO DOM — HEADER
// ============================================
const header_back_button = document.getElementById("header-back-button")


// ============================================
// REFERÊNCIAS — CARD DO FUNCIONÁRIO
// ============================================
const avatar = document.getElementById("avatar")
const greeting_text = document.getElementById("greeting-text")
const full_date_text = document.getElementById("full-date-text")
const status_text = document.getElementById("status-text")


// ============================================
// REFERÊNCIAS — CARD DO RELÓGIO
// ============================================
const clock_time_screen = document.getElementById("clock-time-screen")
const clock_date_screen = document.getElementById("clock-date-screen")
const clock_in_message = document.getElementById("clock-in-message")
const location_status_text = document.getElementById("location-status-text")


// ============================================
// REFERÊNCIAS — BOTÃO PRINCIPAL
// ============================================
const clock_in_register_button = document.getElementById("clock-in-register-button")
const button_title_text = document.getElementById("button-title-text")
const button_subtitle_text = document.getElementById("button-subtitle-text")


// ============================================
// REFERÊNCIAS — RESUMO
// ============================================
const entry_clock_in_register = document.getElementById("entry-clock-in-register")
const begin_dinner_clock_in_register = document.getElementById("begin-dinner-clock-in-register")
const ending_dinner_clock_in_register = document.getElementById("ending-dinner-clock-in-register")
const exit_clock_in_register = document.getElementById("exit-clock-in-register")


// ============================================
// REFERÊNCIAS — STATUS DO RESUMO
// ============================================
const entry_status = document.getElementById("entry-status")
const begin_dinner_status = document.getElementById("begin-dinner-status")
const ending_dinner_status = document.getElementById("ending-dinner-status")
const exit_status = document.getElementById("exit-status")


// ============================================
// REFERÊNCIAS — SALDO
// ============================================
const worked_hours_balance = document.getElementById("worked-hours-balance")
const worked_hours_status = document.getElementById("worked-hours-status")
const extra_hours_balance = document.getElementById("extra-hours-balance")
const extra_hours_status = document.getElementById("extra-hours-status")


// ============================================
// VARIÁVEIS DE CONTROLE
// ============================================
let entry_registered = false
let begin_dinner_registered = false
let ending_dinner_registered = false
let exit_registered = false
let registered_something = false

let user_name = ""


// ============================================
// FUNÇÕES DE FORMATAÇÃO (datas/saudações)
// ============================================
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


function generate_full_date() {
    const now = new Date()
    
    return now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    })
}


function generate_short_date() {
    const now = new Date()
    
    const week_day = now.toLocaleDateString("pt-BR", { weekday: "long" })
    const date = now.toLocaleDateString("pt-BR")
    
    return `${week_day} · ${date}`
}


function get_current_time() {
    const now = new Date()
    return now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })
}


// ============================================
// RELÓGIO EM TEMPO REAL
// ============================================
function update_clock() {
    const now = new Date()
    
    const time = now.toLocaleTimeString("pt-BR")
    clock_time_screen.textContent = time
    
    clock_date_screen.textContent = generate_short_date()
    
    if (user_name) {
        greeting_text.textContent = `${generate_greeting()}, ${user_name}!`
    }
}


// ============================================
// STATUS DO FUNCIONÁRIO (badge)
// ============================================
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


// ============================================
// ATUALIZA O BOTÃO PRINCIPAL
// ============================================
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


// ============================================
// CÁLCULO DE HORAS DO DIA
// ============================================
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


// ============================================
// ATUALIZA O SALDO DO DIA
// ============================================
function update_balance() {
    
    const result = calculate_daily_hours()
    
    if (!result) {
        worked_hours_balance.textContent = "00:00"
        worked_hours_status.textContent = "aguardando"
        worked_hours_status.style.color = "var(--texto-secundario)"
        
        extra_hours_balance.textContent = "+00:00"
        extra_hours_status.textContent = "neutro"
        extra_hours_status.style.color = "var(--texto-secundario)"
        return
    }
    
    worked_hours_balance.textContent = result.hours_worked
    
    if (result.is_working) {
        worked_hours_status.textContent = "até agora"
        worked_hours_status.style.color = "var(--texto-secundario)"
    } else {
        worked_hours_status.textContent = "finalizado"
        worked_hours_status.style.color = "var(--verde)"
    }
    
    const extra_minutes = result.extra_minutes
    
    if (extra_minutes > 0) {
        extra_hours_balance.textContent = "+" + result.extra_hours
        extra_hours_status.textContent = "positivo"
        extra_hours_status.style.color = "var(--verde)"
        
    } else if (extra_minutes < 0) {
        extra_hours_balance.textContent = "-" + result.extra_hours
        extra_hours_status.textContent = "negativo"
        extra_hours_status.style.color = "var(--vermelho)"
        
    } else {
        extra_hours_balance.textContent = "00:00"
        extra_hours_status.textContent = "neutro"
        extra_hours_status.style.color = "var(--texto-secundario)"
    }
}


// ============================================
// ATUALIZA RESUMO (✓ / Pendente)
// ============================================
function update_summary_status() {
    
    entry_status.textContent = entry_registered ? "✓" : "Pendente"
    entry_status.style.color = entry_registered ? "var(--verde)" : "var(--texto-secundario)"
    
    begin_dinner_status.textContent = begin_dinner_registered ? "✓" : "Pendente"
    begin_dinner_status.style.color = begin_dinner_registered ? "var(--verde)" : "var(--texto-secundario)"
    
    ending_dinner_status.textContent = ending_dinner_registered ? "✓" : "Pendente"
    ending_dinner_status.style.color = ending_dinner_registered ? "var(--verde)" : "var(--texto-secundario)"
    
    exit_status.textContent = exit_registered ? "✓" : "Pendente"
    exit_status.style.color = exit_registered ? "var(--verde)" : "var(--texto-secundario)"
}


// ============================================
// RESTAURA DO LOCALSTORAGE
// ============================================
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


// ============================================
// SALVA PONTO NO FIRESTORE (COM LOCALIZAÇÃO)
// ============================================
async function save_clock_in_to_database(clock_in_type, time) {
    
    const user = auth.currentUser
    if (!user) {
        alert("Você precisa estar logado!")
        return null
    }
    
    // 🔑 Verifica a localização antes de salvar
    console.log("📍 Verificando localização...")
    const location = await verify_location()
    console.log("📍 Resultado:", location.status, "-", location.message)
    
    // 🔑 Atualiza o texto na tela com o status
    update_location_display(location)
    
    const current_date_formatted = new Date().toISOString().split('T')[0]
    const document_id = current_date_formatted + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id)
    
    try {
        await setDoc(document_reference, {
            employee_id: user.uid,
            employee_email: user.email,
            date: current_date_formatted,
            [clock_in_type]: time,
            
            // Campos de localização
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: location.accuracy,
            distance_from_company: location.distance,
            location_status: location.status
            
        }, { merge: true })
        
        console.log("✅ Ponto salvo:", clock_in_type, "| Localização:", location.status)
        
        if (clock_in_type === "entrada") {
            await atualizar_indice_de_meses(user, current_date_formatted)
        }
        
        return location
        
    } catch (error) {
        console.log("❌ Erro ao salvar ponto:", error.code, error.message)
        return location
    }
}


// ============================================
// ATUALIZA O ÍNDICE DE MESES
// ============================================
async function atualizar_indice_de_meses(user, data_str) {
    
    const mes_chave = data_str.substring(0, 7)
    
    const user_doc_ref = doc(db, "employees", user.uid)
    
    try {
        const user_snapshot = await getDoc(user_doc_ref)
        
        let meses = []
        
        if (user_snapshot.exists()) {
            const dados = user_snapshot.data()
            meses = dados.meses_com_registro || []
        }
        
        if (!meses.includes(mes_chave)) {
            
            meses.push(mes_chave)
            meses.sort().reverse()
            
            const nome = user.email.split("@")[0]
            const nome_formatado = nome.charAt(0).toUpperCase() + nome.slice(1)
            
            await setDoc(user_doc_ref, {
                email: user.email,
                name: nome_formatado,
                meses_com_registro: meses
            }, { merge: true })
            
            console.log("📅 Índice de meses atualizado:", mes_chave)
        }
        
    } catch (error) {
        console.log("⚠️ Erro ao atualizar índice (não crítico):", error.code, error.message)
    }
}


// ============================================
// SALVA AS HORAS NO FIRESTORE
// ============================================
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


// ============================================
// RESTAURA O ÚLTIMO STATUS DE LOCALIZAÇÃO
// ============================================
// Lê o localStorage e mostra o último status salvo.
// NÃO verifica o GPS (respeitando a privacidade).
function restaurar_status_localizacao() {
    
    try {
        const salvo = localStorage.getItem("last_location_status")
        
        // Sem status salvo → mostra mensagem neutra
        if (!salvo) {
            if (location_status_text) {
                location_status_text.textContent = "📍 Localização será verificada no registro"
                location_status_text.className = "location-status"
            }
            return
        }
        
        const dados = JSON.parse(salvo)
        
        if (location_status_text) {
            location_status_text.textContent = dados.text
            location_status_text.className = "location-status " + (dados.classe || "")
        }
        
        console.log("📍 Status restaurado do localStorage:", dados.text)
        
    } catch (error) {
        console.log("⚠️ Erro ao restaurar status:", error)
        
        if (location_status_text) {
            location_status_text.textContent = "Localização será verificada no registro"
            location_status_text.className = "location-status"
        }
    }
}

// ============================================
// ATUALIZA O STATUS DE LOCALIZAÇÃO NA TELA
// ============================================
function update_location_display(location_result) {
    
    if (!location_status_text) return
    
    // Limpa classes antigas
    location_status_text.className = "location-status"
    
    if (!location_result) {
        location_status_text.textContent = "📍 Verificando localização..."
        return
    }
    
    const status = location_result.status
    const distance = location_result.distance
    const accuracy = location_result.accuracy
    
    // Formata distância (m ou km)
    function formatar_distancia(m) {
        if (m === null || m === undefined) return ""
        if (m < 1000) return `${m}m`
        return `${(m / 1000).toFixed(1)}km`
    }
    
    let novo_texto = ""
    let nova_classe = ""
    
    if (status === "dentro") {
        novo_texto = `✅ Dentro da área (${formatar_distancia(distance)})`
        nova_classe = "status-dentro"
        
    } else if (status === "fora") {
        novo_texto = `⚠️ Fora da área (${formatar_distancia(distance)})`
        nova_classe = "status-fora"
        
    } else if (status === "impreciso") {
        novo_texto = `📡 GPS impreciso (±${accuracy}m)`
        nova_classe = "status-impreciso"
        
    } else if (status === "sem_gps") {
        novo_texto = `❓ Localização indisponível`
        nova_classe = "status-sem-gps"
        
    } else if (status === "sem_config") {
        novo_texto = `⚙️ Configuração da empresa não encontrada`
        nova_classe = "status-erro"
        
    } else {
        novo_texto = `📍 Localização registrada`
    }
    
    // Atualiza a tela
    location_status_text.textContent = novo_texto
    location_status_text.classList.add(nova_classe)
    
    // 🔑 Salva no localStorage pra persistir
    localStorage.setItem("last_location_status", JSON.stringify({
        text: novo_texto,
        classe: nova_classe,
        timestamp: Date.now()
    }))
    
    console.log("✅ Status de localização salvo no localStorage")
}


// ============================================
// MOSTRA MENSAGEM DE FEEDBACK
// ============================================
function show_message(text, location_status) {
    clock_in_message.textContent = text
    
    // Muda a cor do fundo conforme o status da localização
    if (location_status === "dentro") {
        clock_in_message.style.background = "#E8F5EE"
        clock_in_message.style.color = "#166534"
    } else if (location_status === "fora") {
        clock_in_message.style.background = "#FEF3C7"
        clock_in_message.style.color = "#92400E"
    } else if (location_status === "sem_gps" || location_status === "impreciso") {
        clock_in_message.style.background = "#F1F5F9"
        clock_in_message.style.color = "#475569"
    } else {
        clock_in_message.style.background = ""
        clock_in_message.style.color = ""
    }
    
    setTimeout(() => {
        clock_in_message.textContent = ""
        clock_in_message.style.background = ""
        clock_in_message.style.color = ""
    }, 4000)
}


// ============================================
// REGISTRAR PONTO (botão principal)
// ============================================
clock_in_register_button.addEventListener("click", async function() {
    
    const formatted_time = get_current_time()
    const current_period = discover_actual_clock_in_period()
    registered_something = false
    
    // ENTRADA
    if (current_period === "periodo_entrada" && entry_registered === false) {
        
        if (localStorage.getItem("entry_saved")) {
            show_message("❌ Você já registrou a ENTRADA hoje!", null)
            return
        }
        
        entry_clock_in_register.textContent = formatted_time
        
        const location = await save_clock_in_to_database("entrada", formatted_time)
        localStorage.setItem("entry_saved", formatted_time)
        
        show_message(`✅ Entrada registrada às ${formatted_time}`, location?.status)
        
        entry_registered = true
        registered_something = true
    }
    
    // INÍCIO DO INTERVALO
    if (current_period === "periodo_almoco" && begin_dinner_registered === false) {
        
        begin_dinner_clock_in_register.textContent = formatted_time
        
        const location = await save_clock_in_to_database("inicio_almoco", formatted_time)
        localStorage.setItem("beggin_dinner_saved", formatted_time)
        
        show_message(`✅ Intervalo iniciado às ${formatted_time}`, location?.status)
        
        begin_dinner_registered = true
        registered_something = true
    }
    
    // VOLTA DO INTERVALO
    if (current_period === "periodo_volta" && ending_dinner_registered === false) {
        
        ending_dinner_clock_in_register.textContent = formatted_time
        
        const location = await save_clock_in_to_database("fim_almoco", formatted_time)
        localStorage.setItem("ending_dinner_saved", formatted_time)
        
        show_message(`✅ Retorno registrado às ${formatted_time}`, location?.status)
        
        ending_dinner_registered = true
        registered_something = true
    }
    
    // SAÍDA
    if (current_period === "periodo_saida" && exit_registered === false) {
        
        exit_clock_in_register.textContent = formatted_time
        
        const location = await save_clock_in_to_database("saida", formatted_time)
        localStorage.setItem("exit_saved", formatted_time)
        
        exit_registered = true
        registered_something = true
        
        const result = calculate_daily_hours()
        
        if (result) {
            await save_hours_to_database(result)
        }
        
        show_message(`✅ Saída registrada às ${formatted_time}`, location?.status)
    }
    
    // Nada registrado
    if (!registered_something) {
        show_message("❌ Não é possível registrar agora!", null)
    }
    
    update_button()
    update_summary_status()
    update_balance()
})


// ============================================
// BOTÃO VOLTAR (HEADER)
// ============================================
header_back_button.addEventListener("click", function() {
    window.location.href = "/pages/employees/main-page.html"
})


// ============================================
// NAVEGAÇÃO DAS TABS INFERIORES
// ============================================
const tabs = document.querySelectorAll(".tab")

tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const target = tab.dataset.tab
        console.log("🚀 Tab clicada:", target)
        
        if (target === "home") {
            window.location.href = "/pages/employees/main-page.html"
        } else if (target === "historic") {
            window.location.href = "/pages/employees/historic-clock-in-register.html"
        } else if (target === "holiday") {
            window.location.href = "/pages/employees/holiday-day-off.html"
        }
        // "point" já é a página atual
    })
})


// ============================================
// INICIALIZAÇÃO
// ============================================
// ============================================
// INICIALIZAÇÃO
// ============================================
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
    
    // Restaura os pontos do dia (localStorage)
    restore_clock_in_from_local_storage()
    
    // 🔑 NOVO: restaura o último status de localização (sem verificar GPS)
    restaurar_status_localizacao()
    
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