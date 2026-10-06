import { auth, db } from "../firebase_config.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"


// ============================================
// REFERÊNCIAS — HEADER
// ============================================
const header_back_button = document.getElementById("header-back-button")


// ============================================
// REFERÊNCIAS — CONTEÚDO
// ============================================
const year_selector_el = document.getElementById("year-selector")
const month_tabs_el = document.getElementById("month-tabs")
const active_month_title_el = document.getElementById("active-month-title")
const container_el = document.getElementById("historic-clock-in-register-container")


// ============================================
// ESTADO
// ============================================
let usuario_atual = null
let meses_disponiveis = []
let ano_ativo = null
let mes_ativo = null


// ============================================
// NOMES DOS MESES
// ============================================
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

const month_short_in_portuguese = {
    "01": "Jan",
    "02": "Fev",
    "03": "Mar",
    "04": "Abr",
    "05": "Mai",
    "06": "Jun",
    "07": "Jul",
    "08": "Ago",
    "09": "Set",
    "10": "Out",
    "11": "Nov",
    "12": "Dez"
}

// 🔑 Ordem cronológica explícita (garante Jan → Dez)
const ordem_cronologica_dos_meses = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
]


// ============================================
// HEADER — BOTÃO VOLTAR
// ============================================
if (header_back_button) {
    header_back_button.addEventListener("click", function() {
        window.location.href = "/pages/employees/main-page.html"
    })
}


// ============================================
// NAVEGAÇÃO DAS TABS
// ============================================
const tabs = document.querySelectorAll(".tab")

tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const target = tab.dataset.tab
        console.log("🚀 Tab clicada:", target)
        
        if (target === "home") {
            window.location.href = "/pages/employees/main-page.html"
        } else if (target === "point") {
            window.location.href = "/pages/employees/clock-in.html"
        } else if (target === "holiday") {
            window.location.href = "/pages/employees/holiday-day-off.html"
        }
        // "historic" já é a página atual
    })
})


// ============================================
// INICIALIZAÇÃO
// ============================================
onAuthStateChanged(auth, async function(user) {
    
    if (!user) {
        alert("Você precisa estar logado!")
        window.location.href = "/index.html"
        return
    }
    
    usuario_atual = user
    
    await carregar_indice_de_meses()
})


// ============================================
// CARREGA O ÍNDICE DE MESES
// ============================================
async function carregar_indice_de_meses() {
    
    container_el.innerHTML = "<p class='carregando'>Carregando Histórico...</p>"
    
    try {
        const user_doc_ref = doc(db, "employees", usuario_atual.uid)
        const snapshot = await getDoc(user_doc_ref)
        
        if (!snapshot.exists()) {
            meses_disponiveis = []
            renderizar_sem_registros()
            return
        }
        
        const dados = snapshot.data()
        meses_disponiveis = dados.meses_com_registro || []
        
        if (meses_disponiveis.length === 0) {
            renderizar_sem_registros()
            return
        }
        
        // Mês mais recente (já vem ordenado desc do Firestore)
        const mes_mais_recente = meses_disponiveis[0]
        const [ano, mes] = mes_mais_recente.split("-")
        
        ano_ativo = ano
        mes_ativo = mes
        
        renderizar_abas_de_ano()
        renderizar_abas_de_mes()
        await carregar_mes(ano, mes)
        
    } catch (error) {
        console.log("❌ Erro ao carregar índice:", error.code, error.message)
        container_el.innerHTML = "<p class='erro'>Erro ao carregar histórico</p>"
    }
}


// ============================================
// RENDERIZA O DROPDOWN DE ANO
// ============================================
function renderizar_abas_de_ano() {
    
    const anos = [...new Set(meses_disponiveis.map(m => m.split("-")[0]))]
    anos.sort().reverse()
    
    year_selector_el.innerHTML = ""
    
    anos.forEach(function(ano) {
        
        const option = document.createElement("option")
        option.value = ano
        option.textContent = ano
        
        if (ano === ano_ativo) {
            option.selected = true
        }
        
        year_selector_el.appendChild(option)
    })
    
    // Remove listener antigo e adiciona novo
    year_selector_el.onchange = async function() {
        
        ano_ativo = year_selector_el.value
        
        const meses_do_ano = meses_disponiveis
            .filter(m => m.startsWith(ano_ativo + "-"))
            .sort()
            .reverse()
        
        mes_ativo = meses_do_ano[0].split("-")[1]
        
        renderizar_abas_de_mes()
        await carregar_mes(ano_ativo, mes_ativo)
    }
}


// ============================================
// RENDERIZA ABAS DE MÊS (ORDEM CRONOLÓGICA)
// ============================================
function renderizar_abas_de_mes() {
    
    const meses_do_ano = meses_disponiveis
        .filter(m => m.startsWith(ano_ativo + "-"))
        .map(m => m.split("-")[1])
    
    month_tabs_el.innerHTML = ""
    
    // 🔑 Usa array explícito em ordem cronológica (Jan → Dez)
    ordem_cronologica_dos_meses.forEach(function(mes) {
        
        const tem_registro = meses_do_ano.includes(mes)
        
        const btn = document.createElement("button")
        btn.className = "month-tab"
        btn.textContent = month_short_in_portuguese[mes]
        
        if (!tem_registro) {
            btn.classList.add("disabled")
            btn.disabled = true
        } else {
            
            if (mes === mes_ativo) {
                btn.classList.add("active")
            }
            
            btn.addEventListener("click", async function() {
                mes_ativo = mes
                renderizar_abas_de_mes()
                await carregar_mes(ano_ativo, mes_ativo)
            })
        }
        
        month_tabs_el.appendChild(btn)
    })
}


// ============================================
// CARREGA UM MÊS ESPECÍFICO
// ============================================
async function carregar_mes(ano, mes) {
    
    active_month_title_el.textContent = 
        `${month_names_in_portuguese[mes]} ${ano}`
    
    container_el.innerHTML = "<p class='carregando'>Carregando...</p>"
    
    try {
        const registros = await buscar_registros_do_mes(usuario_atual, ano, mes)
        
        if (registros.length === 0) {
            container_el.innerHTML = "<p class='vazio'>Nenhum registro neste mês</p>"
            return
        }
        
        registros.sort((a, b) => b.day.localeCompare(a.day))
        
        renderizar_historico(registros, container_el)
        
    } catch (error) {
        console.log("❌ Erro:", error.code, error.message)
        container_el.innerHTML = "<p class='erro'>Erro ao carregar registros</p>"
    }
}


// ============================================
// BUSCA REGISTROS VIA GET (paralelo)
// ============================================
async function buscar_registros_do_mes(user, ano, mes) {
    
    const dias_no_mes = new Date(ano, mes, 0).getDate()
    const promises = []
    
    for (let dia = 1; dia <= dias_no_mes; dia++) {
        
        const dia_fmt = String(dia).padStart(2, "0")
        const mes_fmt = String(mes).padStart(2, "0")
        const data_str = `${ano}-${mes_fmt}-${dia_fmt}`
        const doc_id = `${data_str}_${user.uid}`
        
        const doc_ref = doc(db, "Clock_in_registers_day", doc_id)
        
        promises.push(
            getDoc(doc_ref).then(function(snapshot) {
                if (snapshot.exists()) {
                    return {
                        day: dia_fmt,
                        ...snapshot.data()
                    }
                }
                return null
            })
        )
    }
    
    const resultados = await Promise.all(promises)
    return resultados.filter(r => r !== null)
}


// ============================================
// RENDERIZA A TABELA DO MÊS
// ============================================
function renderizar_historico(registros, container) {
    
    container.innerHTML = ""
    
    const tabela = document.createElement("table")
    tabela.className = "historic-clock-in-table"
    
    tabela.innerHTML = `
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
    
    const tbody = tabela.querySelector("tbody")
    
    registros.forEach(function(register) {
        
        const line = document.createElement("tr")
        
        let extra_text = "-"
        let extra_class = ""
        
        if (register.extra_hours) {
            if (register.is_extra_hour) {
                extra_text = `+ ${register.extra_hours}`
                extra_class = "extra-hours-positive"
            } else {
                extra_text = `- ${register.extra_hours}`
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
    
    container.appendChild(tabela)
}


// ============================================
// SEM REGISTROS
// ============================================
function renderizar_sem_registros() {
    
    year_selector_el.innerHTML = ""
    month_tabs_el.innerHTML = ""
    active_month_title_el.textContent = ""
    
    container_el.innerHTML = 
        "<p class='vazio'>Nenhum registro encontrado. Registre um ponto para começar seu histórico!</p>"
}