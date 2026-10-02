// ============================================
// IMPORTS
// ============================================

import { auth, db } from "../firebase_config.js"
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { discover_actual_clock_in_period, convert_time_to_minutes, convert_minutes_to_hours } from "./clock_in_verification.js"


// ============================================
// ELEMENTOS DA TELA
// ============================================

// Header
const header_back = document.getElementById("header-back")
const header_icon = document.getElementById("header-icon")

// Card do funcionário
const saudacao = document.getElementById("saudacao")
const data_completa = document.getElementById("data-completa")
const status_texto = document.getElementById("status-texto")

// Card do ponto
const actual_time_screen = document.getElementById("actual-time-screen")
const relogio_data = document.getElementById("relogio-data")
const clock_in_message = document.getElementById("clock-in-message")

// Botão principal
const clock_in_register = document.getElementById("clock-in-register")
const button_text = document.getElementById("button-text")
const button_subtitle = document.getElementById("button-subtitle")

// Resumo do dia
const entry_clock_in_register = document.getElementById("entry-clock-in-register")
const begin_dinner_clock_in_register = document.getElementById("begin-dinner-clock-in-register")
const ending_dinner_clock_in_register = document.getElementById("ending-dinner-clock-in-register")
const exit_clock_in_register = document.getElementById("exit-clock-in-register")

// Status do resumo
const entry_status = document.getElementById("entry-status")
const begin_dinner_status = document.getElementById("begin-dinner-status")
const ending_dinner_status = document.getElementById("ending-dinner-status")
const exit_status = document.getElementById("exit-status")

// Saldo
const saldo_horas_trabalhadas = document.getElementById("saldo-horas-trabalhadas")
const saldo_horas_status = document.getElementById("saldo-horas-status")
const saldo_horas = document.getElementById("saldo-horas")
const saldo_status = document.getElementById("saldo-status")

// Botão histórico
const clock_in_historic_button = document.getElementById("clock-in-historic-button")


// ============================================
// VARIÁVEIS DE CONTROLE
// ============================================

let entry_registered = false
let begin_dinner_registered = false
let ending_dinner_registered = false
let exit_registered = false
let registered_something = false

let nome_usuario = ""


// ============================================
// FUNÇÃO: SAUDAR CONFORME A HORA
// ============================================

function gerar_saudacao() {
    const hora = new Date().getHours()
    
    if (hora < 12) {
        return "Bom dia"
    } else if (hora < 18) {
        return "Boa tarde"
    } else {
        return "Boa noite"
    }
}


// ============================================
// FUNÇÃO: DATA COMPLETA POR EXTENSO
// ============================================

function gerar_data_completa() {
    const agora = new Date()
    
    return agora.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    })
}


// ============================================
// FUNÇÃO: DATA CURTA (para o relógio)
// ============================================

function gerar_data_curta() {
    const agora = new Date()
    
    const dia_semana = agora.toLocaleDateString("pt-BR", { weekday: "long" })
    const data = agora.toLocaleDateString("pt-BR")
    
    return `${dia_semana} · ${data}`
}


// ============================================
// FUNÇÃO: RELÓGIO EM TEMPO REAL
// ============================================

function atualizar_relogio() {
    const agora = new Date()
    
    // Hora formatada com segundos
    const hora = agora.toLocaleTimeString("pt-BR")
    actual_time_screen.textContent = hora
    
    // Data curta
    relogio_data.textContent = gerar_data_curta()
    
    // Saudação (atualiza também)
    if (nome_usuario) {
        saudacao.textContent = `${gerar_saudacao()}, ${nome_usuario}!`
    }
}


// ============================================
// FUNÇÃO: STATUS DO FUNCIONÁRIO
// ============================================

function atualizar_status() {
    const periodo = discover_actual_clock_in_period()
    
    if (periodo === "periodo_entrada" 
        || periodo === "trabalhando_manha" 
        || periodo === "periodo_almoco" 
        || periodo === "em_almoco" 
        || periodo === "periodo_volta" 
        || periodo === "trabalhando_tarde" 
        || periodo === "periodo_saida") {
        status_texto.textContent = "Em expediente"
    } else {
        status_texto.textContent = "Fora do expediente"
    }
}


// ============================================
// FUNÇÃO: ATUALIZAR BOTÃO (texto + subtítulo)
// ============================================

function atualizar_botao() {
    const periodo = discover_actual_clock_in_period()
    
    let texto = "REGISTRAR PONTO"
    let subtitulo = "Toque para registrar"
    let desabilitado = false
    
    switch (periodo) {
        case "muito_cedo":
            texto = "MUITO CEDO"
            subtitulo = "Aguarde o horário"
            desabilitado = true
            break
        
        case "periodo_entrada":
            texto = "REGISTRAR ENTRADA"
            subtitulo = "Início do expediente"
            break
        
        case "trabalhando_manha":
            texto = "TRABALHANDO"
            subtitulo = "Aguardando intervalo"
            desabilitado = true
            break
        
        case "periodo_almoco":
            texto = "REGISTRAR INTERVALO"
            subtitulo = "Início do intervalo"
            break
        
        case "em_almoco":
            texto = "EM INTERVALO"
            subtitulo = "Bom descanso!"
            desabilitado = true
            break
        
        case "periodo_volta":
            texto = "VOLTAR DO INTERVALO"
            subtitulo = "Retorno do intervalo"
            break
        
        case "trabalhando_tarde":
            texto = "TRABALHANDO"
            subtitulo = "Aguardando saída"
            desabilitado = true
            break
        
        case "periodo_saida":
            texto = "REGISTRAR SAÍDA"
            subtitulo = "Fim do expediente"
            break
        
        case "fora_expediente":
            texto = "FORA DO EXPEDIENTE"
            subtitulo = "Até amanhã!"
            desabilitado = true
            break
    }
    
    button_text.textContent = texto
    button_subtitle.textContent = subtitulo
    clock_in_register.disabled = desabilitado
}


// ============================================
// FUNÇÃO: CALCULAR HORAS (trabalhadas + extras)
// ============================================

function calcular_horas_do_dia() {
    
    const entry = localStorage.getItem("entry_saved")
    const beggin_dinner = localStorage.getItem("beggin_dinner_saved")
    const ending_dinner = localStorage.getItem("ending_dinner_saved")
    const exit = localStorage.getItem("exit_saved")
    
    // Se não tem entrada, não tem nada
    if (!entry) {
        return null
    }
    
    const entry_min = convert_time_to_minutes(entry)
    const agora = new Date()
    const agora_min = agora.getHours() * 60 + agora.getMinutes()
    
    // Se não tem saída ainda, calcula até agora
    let exit_min
    if (exit) {
        exit_min = convert_time_to_minutes(exit)
    } else {
        exit_min = agora_min
    }
    
    // Total no trabalho
    let total_at_work = exit_min - entry_min
    
    // Desconta o almoço se já terminou
    let lunch_time = 0
    if (beggin_dinner && ending_dinner) {
        const beggin_min = convert_time_to_minutes(beggin_dinner)
        const ending_min = convert_time_to_minutes(ending_dinner)
        lunch_time = ending_min - beggin_min
    } else if (beggin_dinner && !ending_dinner) {
        // Está em almoço agora
        const beggin_min = convert_time_to_minutes(beggin_dinner)
        // Não conta o tempo de almoço
        total_at_work = beggin_min - entry_min
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
        esta_trabalhando: !exit,
        tem_extra: extra !== 0
    }
}


// ============================================
// FUNÇÃO: ATUALIZAR SALDO DO DIA
// ============================================

function atualizar_saldo() {
    
    const result = calcular_horas_do_dia()
    
    // Não bateu entrada ainda
    if (!result) {
        saldo_horas_trabalhadas.textContent = "00:00"
        saldo_horas_status.textContent = "aguardando"
        saldo_horas_status.style.color = "var(--cinza-texto)"
        
        saldo_horas.textContent = "00:00"
        saldo_status.textContent = "neutro"
        saldo_status.style.color = "var(--cinza-texto)"
        return
    }
    
    // ✅ Horas trabalhadas
    saldo_horas_trabalhadas.textContent = result.hours_worked
    
    if (result.esta_trabalhando) {
        saldo_horas_status.textContent = "até agora"
        saldo_horas_status.style.color = "var(--cinza-texto)"
    } else {
        saldo_horas_status.textContent = "finalizado"
        saldo_horas_status.style.color = "var(--verde)"
    }
    
    // ✅ Extras/Débito - LÓGICA CORRIGIDA
    const minutos_extras = result.extra_minutes
    
    if (minutos_extras > 0) {
        // POSITIVO
        saldo_horas.textContent = "+" + result.extra_hours
        saldo_status.textContent = "positivo"
        saldo_status.style.color = "var(--verde)"
        
    } else if (minutos_extras < 0) {
        // NEGATIVO
        saldo_horas.textContent = "-" + result.extra_hours
        saldo_status.textContent = "negativo"
        saldo_status.style.color = "var(--laranja)"
        
    } else {
        // ✅ NEUTRO (0 minutos)
        saldo_horas.textContent = "00:00"
        saldo_status.textContent = "neutro"
        saldo_status.style.color = "var(--cinza-texto)"
    }
}


// ============================================
// FUNÇÃO: ATUALIZAR STATUS DO RESUMO
// ============================================

function atualizar_status_resumo() {
    
    // Entrada
    entry_status.textContent = entry_registered ? "✓" : "Pendente"
    entry_status.style.color = entry_registered ? "var(--verde)" : "var(--laranja)"
    
    // Almoço
    begin_dinner_status.textContent = begin_dinner_registered ? "✓" : "Pendente"
    begin_dinner_status.style.color = begin_dinner_registered ? "var(--verde)" : "var(--laranja)"
    
    // Volta
    ending_dinner_status.textContent = ending_dinner_registered ? "✓" : "Pendente"
    ending_dinner_status.style.color = ending_dinner_registered ? "var(--verde)" : "var(--laranja)"
    
    // Saída
    exit_status.textContent = exit_registered ? "✓" : "Pendente"
    exit_status.style.color = exit_registered ? "var(--verde)" : "var(--laranja)"
}


// ============================================
// FUNÇÃO: RESTAURAR DO LOCAL STORAGE
// ============================================

function verify_exist_clock_in_local_storage() {
    
    const actual_date_day = new Date().toLocaleDateString("pt-BR")
    const verify_date_saved = localStorage.getItem("date_saved_in_local_storage")
    
    if (verify_date_saved !== actual_date_day) {
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
        
        const beggin_dinner_saved = localStorage.getItem("beggin_dinner_saved")
        if (beggin_dinner_saved) {
            begin_dinner_clock_in_register.textContent = beggin_dinner_saved
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
    
    localStorage.setItem("date_saved_in_local_storage", actual_date_day)
}


// ============================================
// FUNÇÃO: SALVAR NO FIREBASE
// ============================================

async function save_the_clock_in_data_base(clock_in_register_type, time) {
    
    const user = auth.currentUser
    if (!user) {
        alert("Você precisa estar logado!")
        return
    }
    
    const actual_date_formated_to_id = new Date().toISOString().split('T')[0]
    const document_id_user = actual_date_formated_to_id + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id_user)
    
    try {
        await setDoc(document_reference, {
            employee_id: user.uid,
            employee_email: user.email,
            date: actual_date_formated_to_id,
            [clock_in_register_type]: time
        }, { merge: true })
        
        console.log("✅ Ponto salvo:", clock_in_register_type)
        
    } catch (error) {
        console.log("❌ Erro ao salvar ponto:", error.code, error.message)
    }
}


// ============================================
// FUNÇÃO: SALVAR HORAS
// ============================================

async function save_the_extra_hours_and_total_worked_data_base(result) {
    
    const user = auth.currentUser
    if (!user) return
    
    const actual_date_formated_to_id = new Date().toISOString().split('T')[0]
    const document_id_user = actual_date_formated_to_id + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id_user)
    
    try {
        await setDoc(document_reference, {
            employee_id: user.uid,
            employee_email: user.email,
            date: actual_date_formated_to_id,
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
// FUNÇÃO: MOSTRAR MENSAGEM
// ============================================

function mostrar_mensagem(texto) {
    clock_in_message.textContent = texto
    
    setTimeout(() => {
        clock_in_message.textContent = ""
    }, 4000)
}


// ============================================
// ✅ REGISTRAR PONTO (EVENTO DE CLIQUE)
// ============================================

clock_in_register.addEventListener("click", async function() {
    
    const actual_time_formated = register_the_clock()
    const actual_period = discover_actual_clock_in_period()
    registered_something = false
    
    // ENTRADA
    if (actual_period === "periodo_entrada" && entry_registered === false) {
        
        if (localStorage.getItem("entry_saved")) {
            mostrar_mensagem("❌ Você já registrou a ENTRADA hoje!")
            return
        }
        
        entry_clock_in_register.textContent = actual_time_formated
        mostrar_mensagem(`✅ Entrada registrada às ${actual_time_formated}`)
        
        await save_the_clock_in_data_base("entrada", actual_time_formated)
        localStorage.setItem("entry_saved", actual_time_formated)
        
        entry_registered = true
        registered_something = true
    }
    
    // INÍCIO DO INTERVALO
    if (actual_period === "periodo_almoco" && begin_dinner_registered === false) {
        
        begin_dinner_clock_in_register.textContent = actual_time_formated
        
        await save_the_clock_in_data_base("inicio_almoco", actual_time_formated)
        localStorage.setItem("beggin_dinner_saved", actual_time_formated)
        
        begin_dinner_registered = true
        registered_something = true
        mostrar_mensagem(`✅ Intervalo iniciado às ${actual_time_formated}`)
    }
    
    // VOLTA DO INTERVALO
    if (actual_period === "periodo_volta" && ending_dinner_registered === false) {
        
        ending_dinner_clock_in_register.textContent = actual_time_formated
        
        await save_the_clock_in_data_base("fim_almoco", actual_time_formated)
        localStorage.setItem("ending_dinner_saved", actual_time_formated)
        
        ending_dinner_registered = true
        registered_something = true
        mostrar_mensagem(`✅ Retorno registrado às ${actual_time_formated}`)
    }
    
    // SAÍDA
    if (actual_period === "periodo_saida" && exit_registered === false) {
        
        exit_clock_in_register.textContent = actual_time_formated
        
        await save_the_clock_in_data_base("saida", actual_time_formated)
        localStorage.setItem("exit_saved", actual_time_formated)
        
        exit_registered = true
        registered_something = true
        
        // Calcula extras
        const result = calcular_horas_do_dia()
        
        if (result) {
            await save_the_extra_hours_and_total_worked_data_base(result)
        }
        
        mostrar_mensagem(`✅ Saída registrada às ${actual_time_formated}`)
    }
    
    // Se nada foi registrado
    if (!registered_something) {
        mostrar_mensagem("❌ Não é possível registrar agora!")
    }
    
    // ✅ Atualiza a interface
    atualizar_botao()
    atualizar_status_resumo()
    atualizar_saldo()
})


// ============================================
// FUNÇÃO: HORA ATUAL (HH:MM)
// ============================================

function register_the_clock() {
    const actual_time = new Date()
    return actual_time.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    })
}


// ============================================
// ✅ BOTÃO HISTÓRICO
// ============================================

clock_in_historic_button.addEventListener("click", function() {
    window.location.href = "/pages/employees/historic-clock-in-register.html"
})


// ============================================
// ✅ BOTÃO VOLTAR (HEADER)
// ============================================

header_back.addEventListener("click", function() {
    window.location.href = "/pages/employees/main-page.html"
})


// ============================================
// ✅ BOTÃO MENU (HEADER)
// ============================================

header_icon.addEventListener("click", function() {
    alert("Em breve: Menu")
})


// ============================================
// ✅ INICIALIZAÇÃO
// ============================================

onAuthStateChanged(auth, function(user) {
    
    if (!user) {
        window.location.href = "/index.html"
        return
    }
    
    console.log("✅ Usuário autenticado:", user.email)
    
    // Extrai o nome
    nome_usuario = user.email.split("@")[0]
    nome_usuario = nome_usuario.charAt(0).toUpperCase() + nome_usuario.slice(1)
    
    // Atualiza saudação
    saudacao.textContent = `${gerar_saudacao()}, ${nome_usuario}!`
    data_completa.textContent = gerar_data_completa()
    
    // Restaura
    verify_exist_clock_in_local_storage()
    
    // Relógio
    atualizar_relogio()
    setInterval(atualizar_relogio, 1000)
    
    // Atualiza tudo
    atualizar_botao()
    atualizar_status()
    atualizar_status_resumo()
    atualizar_saldo()
    
    // Atualiza a cada 30s
    setInterval(() => {
        atualizar_botao()
        atualizar_status()
        atualizar_status_resumo()
        atualizar_saldo()
    }, 30000)
})