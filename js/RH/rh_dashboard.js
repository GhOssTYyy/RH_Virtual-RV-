import { auth, db } from "../firebase_config.js"
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { collection, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// ============================================
// 🔒 GUARD DO RH
// ============================================
const emails_rh = [
    "jpandreiph@gmail.com"
]


// ============================================
// ELEMENTOS DO DOM
// ============================================
const logout_button = document.getElementById("logout-button")
const filtro_funcionario = document.getElementById("filtro-funcionario")
const filtro_data = document.getElementById("filtro-data")
const btn_buscar = document.getElementById("btn-buscar")
const btn_limpar = document.getElementById("btn-limpar")
const btn_exportar = document.getElementById("btn-exportar")

const corpo_tabela = document.getElementById("corpo-tabela")
const info_total = document.getElementById("info-total")

const total_registros = document.getElementById("total-registros")
const total_funcionarios = document.getElementById("total-funcionarios")
const total_extras = document.getElementById("total-extras")


// ============================================
// ESTADO
// ============================================
let todos_registros = []
let registros_filtrados = []


// ============================================
// INICIALIZAÇÃO COM GUARD
// ============================================
onAuthStateChanged(auth, function(user) {
    
    if (!user) {
        window.location.href = "/index.html"
        return
    }
    
    // 🔒 GUARD: só RH acessa
    if (!emails_rh.includes(user.email)) {
        alert("❌ Acesso negado. Esta página é restrita ao RH.")
        window.location.href = "/pages/employees/main-page.html"
        return
    }
    
    console.log("✅ RH autenticado:", user.email)
    
    buscar_todos_registros()
})


// ============================================
// BUSCAR TODOS OS REGISTROS
// ============================================
async function buscar_todos_registros() {
    
    corpo_tabela.innerHTML = '<tr><td colspan="9" class="carregando">Carregando...</td></tr>'
    
    try {
        const colecao = collection(db, "Clock_in_registers_day")
        const consulta = query(
            colecao,
            orderBy("date", "desc"),
            limit(500)
        )
        
        const resultado = await getDocs(consulta)
        
        todos_registros = []
        
        resultado.forEach(function(documento) {
            todos_registros.push({
                id: documento.id,
                ...documento.data()
            })
        })
        
        console.log("📊 Registros carregados:", todos_registros.length)
        
        preencher_filtro_funcionarios()
        aplicar_filtros()
        
    } catch (error) {
        console.log("❌ Erro:", error.code, error.message)
        corpo_tabela.innerHTML = '<tr><td colspan="9" class="erro">Erro ao carregar registros</td></tr>'
    }
}


// ============================================
// FILTROS
// ============================================
function preencher_filtro_funcionarios() {
    
    const emails_unicos = [...new Set(todos_registros.map(r => r.employee_email))]
    
    filtro_funcionario.innerHTML = '<option value="todos">Todos</option>'
    
    emails_unicos.forEach(function(email) {
        if (!email) return
        
        const option = document.createElement("option")
        option.value = email
        option.textContent = email
        filtro_funcionario.appendChild(option)
    })
}


function aplicar_filtros() {
    
    const funcionario_selecionado = filtro_funcionario.value
    const data_selecionada = filtro_data.value
    
    registros_filtrados = todos_registros.filter(function(registro) {
        
        if (funcionario_selecionado !== "todos" 
            && registro.employee_email !== funcionario_selecionado) {
            return false
        }
        
        if (data_selecionada && registro.date !== data_selecionada) {
            return false
        }
        
        return true
    })
    
    console.log("🔍 Registros filtrados:", registros_filtrados.length)
    
    renderizar_tabela()
    atualizar_estatisticas()
}


// ============================================
// FORMATA DISTÂNCIA (metros → m ou km)
// ============================================
function formatar_distancia(metros) {
    
    if (metros === null || metros === undefined) {
        return null
    }
    
    if (metros < 1000) {
        return `${metros}m`
    }
    
    // Converte pra km com 1 casa decimal
    const km = (metros / 1000).toFixed(1)
    return `${km}km`
}


// ============================================
// MONTA O BADGE DE LOCALIZAÇÃO
// ============================================
function montar_badge_localizacao(registro) {
    
    const status = registro.location_status
    const distancia = registro.distance_from_company
    const lat = registro.latitude
    const lon = registro.longitude
    const accuracy = registro.accuracy
    
    // Monta o tooltip (com coordenadas)
    let tooltip = ""
    if (lat !== null && lat !== undefined && lon !== null && lon !== undefined) {
        tooltip = `📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}`
        if (accuracy) tooltip += ` (±${accuracy}m)`
    } else {
        tooltip = "Localização não registrada"
    }
    
    // Sem registro de localização (registros antigos)
    if (!status) {
        return `<span class="badge badge-sem-info" title="Registro antigo (sem GPS)">—</span>`
    }
    
    // Badge conforme o status
    if (status === "dentro") {
        const dist = formatar_distancia(distancia) || ""
        return `<span class="badge badge-dentro" title="${tooltip}">✅ ${dist}</span>`
    }
    
    if (status === "fora") {
        const dist = formatar_distancia(distancia) || ""
        return `<span class="badge badge-fora" title="${tooltip}">⚠️ ${dist}</span>`
    }
    
    if (status === "sem_gps") {
        return `<span class="badge badge-sem-gps" title="${tooltip}">❓ Sem GPS</span>`
    }
    
    if (status === "impreciso") {
        const dist = formatar_distancia(distancia) || ""
        return `<span class="badge badge-impreciso" title="${tooltip}">📡 ${dist || "Impreciso"}</span>`
    }
    
    if (status === "sem_config") {
        return `<span class="badge badge-sem-info" title="${tooltip}">⚙️ Sem config</span>`
    }
    
    // Fallback
    return `<span class="badge badge-sem-info" title="${tooltip}">—</span>`
}


// ============================================
// RENDERIZAR A TABELA
// ============================================
function renderizar_tabela() {
    
    if (registros_filtrados.length === 0) {
        corpo_tabela.innerHTML = '<tr><td colspan="9" class="vazio">Nenhum registro encontrado</td></tr>'
        info_total.textContent = "0 registros"
        return
    }
    
    corpo_tabela.innerHTML = ""
    
    registros_filtrados.forEach(function(registro) {
        
        const linha = document.createElement("tr")
        
        // Formata extras
        let extra_text = "-"
        let extra_class = ""
        
        if (registro.extra_hours) {
            if (registro.is_extra_hour) {
                extra_text = `+${registro.extra_hours}`
                extra_class = "extra-positivo"
            } else {
                extra_text = `-${registro.extra_hours}`
                extra_class = "extra-negativo"
            }
        }
        
        // Nome do funcionário
        const nome = registro.employee_email 
            ? registro.employee_email.split("@")[0] 
            : "N/A"
        
        // Badge de localização
        const badge_local = montar_badge_localizacao(registro)
        
        linha.innerHTML = `
            <td data-label="Funcionário">${nome}</td>
            <td data-label="Data">${registro.date || "-"}</td>
            <td data-label="Entrada">${registro.entrada || "-"}</td>
            <td data-label="Almoço">${registro.inicio_almoco || "-"}</td>
            <td data-label="Volta">${registro.fim_almoco || "-"}</td>
            <td data-label="Saída">${registro.saida || "-"}</td>
            <td data-label="Horas">${registro.hours_worked || "-"}</td>
            <td data-label="Extras" class="${extra_class}">${extra_text}</td>
            <td data-label="Local">${badge_local}</td>
        `
        
        corpo_tabela.appendChild(linha)
    })
    
    info_total.textContent = `${registros_filtrados.length} registros`
}


// ============================================
// ESTATÍSTICAS
// ============================================
function atualizar_estatisticas() {
    
    total_registros.textContent = registros_filtrados.length
    
    const emails_unicos = [...new Set(registros_filtrados.map(r => r.employee_email))]
    total_funcionarios.textContent = emails_unicos.length
    
    const com_extras = registros_filtrados.filter(r => r.is_extra_hour).length
    total_extras.textContent = com_extras
}


// ============================================
// BOTÕES
// ============================================
btn_buscar.addEventListener("click", function() {
    aplicar_filtros()
})


btn_limpar.addEventListener("click", function() {
    filtro_funcionario.value = "todos"
    filtro_data.value = ""
    aplicar_filtros()
})


btn_exportar.addEventListener("click", function() {
    
    if (registros_filtrados.length === 0) {
        alert("Não há registros para exportar!")
        return
    }
    
    // Cabeçalho do CSV (com coluna Local)
    let csv = "Funcionário,Data,Entrada,Almoço,Volta,Saída,Horas,Extras,Local,Distância,Latitude,Longitude\n"
    
    // Dados
    registros_filtrados.forEach(function(r) {
        const nome = r.employee_email ? r.employee_email.split("@")[0] : "N/A"
        
        const dist = r.distance_from_company !== null && r.distance_from_company !== undefined
            ? r.distance_from_company
            : ""
        
        const lat = r.latitude !== null && r.latitude !== undefined ? r.latitude : ""
        const lon = r.longitude !== null && r.longitude !== undefined ? r.longitude : ""
        
        csv += `${nome},${r.date || ""},${r.entrada || ""},${r.inicio_almoco || ""},${r.fim_almoco || ""},${r.saida || ""},${r.hours_worked || ""},${r.extra_hours || ""},${r.location_status || ""},${dist},${lat},${lon}\n`
    })
    
    // Cria o arquivo e baixa
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    
    link.href = url
    link.download = `registros-ponto-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    
    URL.revokeObjectURL(url)
})


// ============================================
// LOGOUT
// ============================================
logout_button.addEventListener("click", async function() {
    
    const confirm_logout = confirm("Deseja realmente sair?")
    if (!confirm_logout) return
    
    try {
        await signOut(auth)
        window.location.href = "/index.html"
    } catch(error) {
        alert("Erro ao sair. Tente novamente.")
    }
})