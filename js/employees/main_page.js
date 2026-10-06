import { auth } from "../firebase_config.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"


// ============================================
// REFERÊNCIAS DO DOM
// ============================================
const welcome_name = document.getElementById("welcome-name")
const welcome_date = document.getElementById("welcome-date")
const profile_picture = document.getElementById("profile-picture")
const settings_button = document.getElementById("settings-button")

const next_action_icon = document.getElementById("next-action-icon")
const next_action_title = document.getElementById("next-action-title")
const next_action_subtitle = document.getElementById("next-action-subtitle")
const next_action_button = document.getElementById("next-action-button")

const tabs = document.querySelectorAll(".tab")


// ============================================
// LISTA DE RH (temporário)
// ============================================
const emails_rh = [
    "jpandreiph@gmail.com"
]


// ============================================
// NAVEGAÇÃO DAS TABS
// ============================================
tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const target = tab.dataset.tab
        console.log("🚀 Tab clicada:", target)
        
        tabs.forEach(t => t.classList.remove("active"))
        tab.classList.add("active")
        
        if (target === "point") {
            window.location.href = "/pages/employees/clock-in.html"
        } else if (target === "historic") {
            window.location.href = "/pages/employees/historic-clock-in-register.html"
        } else if (target === "holiday") {
            window.location.href = "/pages/employees/holiday-day-off.html"
        } else if (target === "rh") {
            window.location.href = "/pages/RH/rh-dashboard.html"
        }
        // "home" já é a página atual
    })
})


// ============================================
// BOTÃO PRÓXIMA AÇÃO
// ============================================
next_action_button.addEventListener("click", function() {
    window.location.href = "/pages/employees/clock-in.html"
})


// ============================================
// PERFIL E CONFIGURAÇÕES
// ============================================
profile_picture.addEventListener("click", function() {
    alert("Em breve: Perfil do usuário!")
})


settings_button.addEventListener("click", function() {
    alert("Em breve: Tela de configurações")
})


// ============================================
// DATA DO TOPO
// ============================================
function gerar_data_completa() {
    const now = new Date()
    return now.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    })
}


// ============================================
// PRÓXIMA AÇÃO
// ============================================
function gerar_proxima_acao() {
    
    const hoje = new Date().toLocaleDateString("pt-BR")
    const data_salva = localStorage.getItem("date_saved_in_local_storage")
    
    if (data_salva !== hoje) {
        return {
            icon: "⏰",
            title: "Registrar ENTRADA",
            subtitle: "Você ainda não bateu o ponto hoje"
        }
    }
    
    const entrada = localStorage.getItem("entry_saved")
    const inicio_almoco = localStorage.getItem("beggin_dinner_saved")
    const fim_almoco = localStorage.getItem("ending_dinner_saved")
    const saida = localStorage.getItem("exit_saved")
    
    if (!entrada) {
        return {
            icon: "⏰",
            title: "Registrar ENTRADA",
            subtitle: "Você ainda não bateu o ponto hoje"
        }
    }
    
    if (!inicio_almoco) {
        return {
            icon: "🍽️",
            title: "Registrar INTERVALO",
            subtitle: "Hora do almoço"
        }
    }
    
    if (!fim_almoco) {
        return {
            icon: "🔄",
            title: "Voltar do INTERVALO",
            subtitle: "Retornar ao trabalho"
        }
    }
    
    if (!saida) {
        return {
            icon: "🏁",
            title: "Registrar SAÍDA",
            subtitle: "Encerrar o expediente"
        }
    }
    
    return {
        icon: "✅",
        title: "Dia encerrado",
        subtitle: `Saída registrada às ${saida}`
    }
}


// ============================================
// ATUALIZA PRÓXIMA AÇÃO
// ============================================
function atualizar_proxima_acao() {
    
    const acao = gerar_proxima_acao()
    
    // Renderiza o ícone com fallback pro emoji
    next_action_icon.innerHTML = `
        <img src="" alt="${acao.icon}" class="icon-img" onerror="this.replaceWith('${acao.icon}')">
    `
    next_action_title.textContent = acao.title
    next_action_subtitle.textContent = acao.subtitle
}


// ============================================
// INICIALIZAÇÃO
// ============================================
onAuthStateChanged(auth, function(user) {
    
    if (!user) {
        window.location.href = "/index.html"
        return
    }
    
    const nome = user.email.split("@")[0]
    const nome_formatado = nome.charAt(0).toUpperCase() + nome.slice(1)
    
    welcome_name.textContent = `👋 Olá, ${nome_formatado}!`
    welcome_date.textContent = gerar_data_completa()
    
    profile_picture.textContent = nome.charAt(0).toUpperCase()
    
    if (emails_rh.includes(user.email)) {
        const tab_rh = document.getElementById("tab-rh")
        if (tab_rh) {
            tab_rh.style.display = "flex"
        }
    }
    
    atualizar_proxima_acao()
})