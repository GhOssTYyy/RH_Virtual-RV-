import { auth, db } from "../firebase_config.js"
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { collection, query, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// ============================================
// 🔒 GUARD DO RH
// ============================================
const emails_rh = [
    "jpandreiph@gmail.com"
]


// Elementos do DOM
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
    
    corpo_tabela.innerHTML = '<tr><td colspan="8" class="carregando">Carregando...</td></tr>'
    
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
        corpo_tabela.innerHTML = '<tr><td colspan="8" class="erro">Erro ao carregar registros</td></tr>'
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
// RENDERIZAR TABELA
// ============================================
function renderizar_tabela() {
    
    if (registros_filtrados.length === 0) {
        corpo_tabela.innerHTML = '<tr><td colspan="8" class="vazio">Nenhum registro encontrado</td></tr>'
        info_total.textContent = "0 registros"
        return
    }
    
    corpo_tabela.innerHTML = ""
    
    registros_filtrados.forEach(function(registro) {
        
        const linha = document.createElement("tr")
        
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
        
        const nome = registro.employee_email 
            ? registro.employee_email.split("@")[0] 
            : "N/A"
        
        linha.innerHTML = `
            <td data-label="Funcionário">${nome}</td>
            <td data-label="Data">${registro.date || "-"}</td>
            <td data-label="Entrada">${registro.entrada || "-"}</td>
            <td data-label="Almoço">${registro.inicio_almoco || "-"}</td>
            <td data-label="Volta">${registro.fim_almoco || "-"}</td>
            <td data-label="Saída">${registro.saida || "-"}</td>
            <td data-label="Horas">${registro.hours_worked || "-"}</td>
            <td data-label="Extras" class="${extra_class}">${extra_text}</td>
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
    
    let csv = "Funcionário,Data,Entrada,Almoço,Volta,Saída,Horas,Extras\n"
    
    registros_filtrados.forEach(function(r) {
        const nome = r.employee_email ? r.employee_email.split("@")[0] : "N/A"
        
        csv += `${nome},${r.date || ""},${r.entrada || ""},${r.inicio_almoco || ""},${r.fim_almoco || ""},${r.saida || ""},${r.hours_worked || ""},${r.extra_hours || ""}\n`
    })
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    
    link.href = url
    link.download = `registros-ponto-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    
    URL.revokeObjectURL(url)
})


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