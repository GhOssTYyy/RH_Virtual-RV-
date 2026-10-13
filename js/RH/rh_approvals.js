import { auth, db } from "../firebase_config.js"
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    serverTimestamp,
    where
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// ============================================
// 🔒 GUARD DO RH
// ============================================
const emails_rh = [
    "jpandreiph@gmail.com"
]


// ============================================
// MAPA DE ÍCONES
// ============================================
// Cada ícone tem: emoji (fallback) e arquivo (imagem)
// Se a imagem não carregar, o emoji aparece automaticamente

const ICONES = {
    // Status
    pendente:     { emoji: "⏳", arquivo: "/assets/icons/time_icon.svg" },
    aprovado:     { emoji: "✅", arquivo: "/assets/icons/check_icon.svg" },
    reprovado:    { emoji: "❌", arquivo: "/assets/icons/close_icon.svg" },
    
    // Campos de horário
    entrada:      { emoji: "⏰", arquivo: "/assets/icons/clock-in-button-icon.svg" },
    almoço:       { emoji: "🍽️", arquivo: "/assets/icons/dining_icon.svg" },
    volta:        { emoji: "🔄", arquivo: "/assets/icons/return_icon.svg" },
    saida:        { emoji: "🏁", arquivo: "/assets/icons/exit_icon.svg" },
    
    // Labels
    calendario:   { emoji: "📅", arquivo: "/assets/icons/calendar_icon.svg" },
    categoria:    { emoji: "📋", arquivo: "/assets/icons/content_paste_icon.svg" },
    motivo:       { emoji: "💬", arquivo: "/assets/icons/message_icon.svg" },
    
    // Navegação
    voltar:       { emoji: "⬅️", arquivo: "/assets/icons/arrow-left.svg" },
    dashboard:    { emoji: "📊", arquivo: "/assets/icons/bar-chart-icon.svg" },
    home:         { emoji: "🏠", arquivo: "/assets/icons/home-button-icon.svg" }
}


// ============================================
// HELPER — Gera o HTML do ícone
// ============================================
function icone(nome, classe = "icon-img") {
    const item = ICONES[nome]
    if (!item) return ""
    
    return `<img src="${item.arquivo}" alt="${item.emoji}" class="${classe}" onerror="this.replaceWith('${item.emoji}')">`
}


// ============================================
// REFERÊNCIAS DO DOM
// ============================================
const header_back_button = document.getElementById("header-back-button")
const header_badge = document.getElementById("header-badge")
const filters_container = document.getElementById("filters-container")
const adjustments_container = document.getElementById("adjustments-container")


// ============================================
// ESTADO
// ============================================
let todos_ajustes = []
let ajustes_filtrados = []
let filtro_ativo = "pending"
let admin_user = null


// ============================================
// MAPEAMENTO DE CATEGORIAS
// ============================================
const CATEGORIAS_LABEL = {
    esquecimento: "📌 Esquecimento",
    erro: "❌ Erro de digitação",
    atestado: "🏥 Atestado médico",
    remoto: "🏠 Trabalho remoto",
    tecnico: "⚠️ Problema técnico",
    licenca_medica: "🩺 Licença médica",
    licenca_parental: "👶 Licença parental",
    licenca_casamento: "💍 Licença casamento",
    licenca_luto: "🕊️ Licença luto",
    outro: "📝 Outro"
}

const CAMPOS_LABEL = {
    entrada: "Entrada",
    inicio_almoco: "Almoço",
    fim_almoco: "Volta",
    saida: "Saída",
    all: "Dia completo"
}


// ============================================
// HEADER — BOTÃO VOLTAR
// ============================================
if (header_back_button) {
    header_back_button.addEventListener("click", function() {
        window.location.href = "/pages/RH/rh-dashboard.html"
    })
}


// ============================================
// INICIALIZAÇÃO
// ============================================
onAuthStateChanged(auth, async function(user) {
    
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
    
    admin_user = user
    console.log("✅ RH autenticado:", user.email)
    
    configurar_filtros()
    await buscar_ajustes()
})


// ============================================
// CONFIGURA OS FILTROS
// ============================================
function configurar_filtros() {
    
    const botoes = filters_container.querySelectorAll(".filter-btn")
    
    botoes.forEach(function(btn) {
        btn.addEventListener("click", function() {
            
            botoes.forEach(b => b.classList.remove("active"))
            btn.classList.add("active")
            
            filtro_ativo = btn.dataset.filter
            aplicar_filtro()
        })
    })
}


// ============================================
// BUSCA TODOS OS AJUSTES
// ============================================
async function buscar_ajustes() {
    
    adjustments_container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">${icone("pendente", "empty-icon")}</div>
            <div class="empty-state-title">Carregando...</div>
        </div>
    `
    
    try {
        const colecao = collection(db, "Clock_in_adjustments")
        const consulta = query(
            colecao,
            orderBy("requested_at", "desc"),
            limit(200)
        )
        
        const resultado = await getDocs(consulta)
        
        todos_ajustes = []
        
        resultado.forEach(function(documento) {
            todos_ajustes.push({
                id: documento.id,
                ...documento.data()
            })
        })
        
        console.log("📊 Ajustes carregados:", todos_ajustes.length)
        
        atualizar_header_badge()
        aplicar_filtro()
        
    } catch (error) {
        console.log("❌ Erro:", error.code, error.message)
        adjustments_container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icone("reprovado", "empty-icon")}</div>
                <div class="empty-state-title">Erro ao carregar</div>
                <div class="empty-state-text">Tente novamente mais tarde</div>
            </div>
        `
    }
}


// ============================================
// APLICA O FILTRO ATIVO
// ============================================
function aplicar_filtro() {
    
    if (filtro_ativo === "all") {
        ajustes_filtrados = [...todos_ajustes]
    } else {
        ajustes_filtrados = todos_ajustes.filter(a => a.status === filtro_ativo)
    }
    
    console.log(`🔍 Filtro: ${filtro_ativo} → ${ajustes_filtrados.length} resultados`)
    
    renderizar_lista()
}


// ============================================
// ATUALIZA BADGE NO HEADER
// ============================================
function atualizar_header_badge() {
    
    if (!header_badge) return
    
    const pendentes = todos_ajustes.filter(a => a.status === "pending").length
    
    header_badge.textContent = pendentes
    
    if (pendentes === 0) {
        header_badge.classList.add("empty")
    } else {
        header_badge.classList.remove("empty")
    }
}


// ============================================
// FORMATA DATA (YYYY-MM-DD → DD/MM/YYYY)
// ============================================
function formatar_data(data_str) {
    if (!data_str) return "—"
    const [ano, mes, dia] = data_str.split("-")
    return `${dia}/${mes}/${ano}`
}


// ============================================
// FORMATA TIMESTAMP (há X tempo)
// ============================================
function formatar_tempo_relativo(timestamp) {
    
    if (!timestamp) return "—"
    
    const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const agora = new Date()
    const diff_ms = agora - data
    const diff_min = Math.floor(diff_ms / 60000)
    const diff_h = Math.floor(diff_min / 60)
    const diff_d = Math.floor(diff_h / 24)
    
    if (diff_min < 1) return "agora mesmo"
    if (diff_min < 60) return `há ${diff_min}min`
    if (diff_h < 24) return `há ${diff_h}h`
    if (diff_d < 7) return `há ${diff_d}d`
    
    return data.toLocaleDateString("pt-BR")
}


// ============================================
// RENDERIZA A LISTA DE AJUSTES
// ============================================
function renderizar_lista() {
    
    if (ajustes_filtrados.length === 0) {
        
        const mensagens = {
            pending: {
                icone: "aprovado",
                title: "Nenhum ajuste pendente",
                text: "Todos os ajustes foram revisados"
            },
            approved: {
                icone: "pendente",
                title: "Nenhum ajuste aprovado",
                text: "Nenhum ajuste foi aprovado ainda"
            },
            rejected: {
                icone: "pendente",
                title: "Nenhum ajuste reprovado",
                text: "Nenhum ajuste foi reprovado ainda"
            },
            all: {
                icone: "pendente",
                title: "Nenhum ajuste encontrado",
                text: "Nenhum ajuste foi solicitado ainda"
            }
        }
        
        const msg = mensagens[filtro_ativo] || mensagens.all
        
        adjustments_container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${icone(msg.icone, "empty-icon")}</div>
                <div class="empty-state-title">${msg.title}</div>
                <div class="empty-state-text">${msg.text}</div>
            </div>
        `
        return
    }
    
    adjustments_container.innerHTML = ""
    
    ajustes_filtrados.forEach(function(ajuste) {
        const card = criar_card_ajuste(ajuste)
        adjustments_container.appendChild(card)
    })
}


// ============================================
// CRIA O CARD DE UM AJUSTE
// ============================================
function criar_card_ajuste(ajuste) {
    
    const card = document.createElement("div")
    card.className = `adjustment-card status-${ajuste.status}`
    
    // Nome do funcionário
    const nome = ajuste.employee_name || 
                 (ajuste.employee_email ? ajuste.employee_email.split("@")[0] : "N/A")
    
    const iniciais = nome.substring(0, 2).toUpperCase()
    
    const campo_label = CAMPOS_LABEL[ajuste.target_field] || ajuste.target_field
    const categoria_label = CATEGORIAS_LABEL[ajuste.category] || ajuste.category
    
    // Status badge
    let status_badge_html = ""
    if (ajuste.status === "pending") {
        status_badge_html = `<span class="status-badge status-pending">${icone("pendente", "badge-icon")} Pendente</span>`
    } else if (ajuste.status === "approved") {
        status_badge_html = `<span class="status-badge status-approved">${icone("aprovado", "badge-icon")} Aprovado</span>`
    } else if (ajuste.status === "rejected") {
        status_badge_html = `<span class="status-badge status-rejected">${icone("reprovado", "badge-icon")} Reprovado</span>`
    }
    
    // Valores
    let valores_html = ""
    if (ajuste.target_field === "all") {
        const rv = ajuste.requested_value || {}
        valores_html = `
            <div class="adjustment-values">
                <span style="font-size: 12px; color: #7A8BA3;">Ponto esquecido:</span>
            </div>
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("entrada", "row-icon")}</span>
                <span class="adjustment-card-row-label">Entrada:</span>
                <span class="adjustment-card-row-value">${rv.entrada || "—"}</span>
            </div>
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("almoço", "row-icon")}</span>
                <span class="adjustment-card-row-label">Almoço:</span>
                <span class="adjustment-card-row-value">${rv.inicio_almoco || "—"}</span>
            </div>
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("volta", "row-icon")}</span>
                <span class="adjustment-card-row-label">Volta:</span>
                <span class="adjustment-card-row-value">${rv.fim_almoco || "—"}</span>
            </div>
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("saida", "row-icon")}</span>
                <span class="adjustment-card-row-label">Saída:</span>
                <span class="adjustment-card-row-value">${rv.saida || "—"}</span>
            </div>
        `
    } else {
        valores_html = `
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("entrada", "row-icon")}</span>
                <span class="adjustment-card-row-label">${campo_label}:</span>
            </div>
            <div class="adjustment-values">
                <span class="adjustment-value-old">${ajuste.original_value || "--:--"}</span>
                <span class="adjustment-value-arrow">→</span>
                <span class="adjustment-value-new">${ajuste.requested_value}</span>
            </div>
        `
    }
    
    // Ações
    let acoes_html = ""
    if (ajuste.status === "pending") {
        acoes_html = `
            <div class="adjustment-card-actions">
                <button class="action-btn action-btn-approve" data-action="approve" data-id="${ajuste.id}">
                    ${icone("aprovado", "action-icon")} Aprovar
                </button>
                <button class="action-btn action-btn-reject" data-action="reject" data-id="${ajuste.id}">
                    ${icone("reprovado", "action-icon")} Reprovar
                </button>
            </div>
        `
    } else if (ajuste.review_notes) {
        acoes_html = `
            <div class="adjustment-reason" style="border-left-color: ${ajuste.status === 'approved' ? '#22C55E' : '#EF4444'};">
                <strong>${icone("motivo", "row-icon")} Observação do RH:</strong> ${ajuste.review_notes}
            </div>
        `
    }
    
    card.innerHTML = `
        <div class="adjustment-card-header">
            <div class="adjustment-card-employee">
                <div class="adjustment-card-avatar">${iniciais}</div>
                <div class="adjustment-card-info">
                    <span class="adjustment-card-name">${nome}</span>
                    <span class="adjustment-card-email">${ajuste.employee_email}</span>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
                ${status_badge_html}
                <span class="adjustment-card-time">${formatar_tempo_relativo(ajuste.requested_at)}</span>
            </div>
        </div>
        
        <div class="adjustment-card-body">
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("calendario", "row-icon")}</span>
                <span class="adjustment-card-row-label">Dia:</span>
                <span class="adjustment-card-row-value">${formatar_data(ajuste.target_date)}</span>
            </div>
            
            <div class="adjustment-card-row">
                <span class="adjustment-card-row-icon">${icone("categoria", "row-icon")}</span>
                <span class="adjustment-card-row-label">Tipo:</span>
                <span class="adjustment-card-row-value">${categoria_label}</span>
            </div>
            
            ${valores_html}
            
            <div class="adjustment-reason">
                <strong>${icone("motivo", "row-icon")} Motivo:</strong> ${ajuste.reason}
            </div>
        </div>
        
        ${acoes_html}
    `
    
    // Listeners dos botões
    const btn_approve = card.querySelector('[data-action="approve"]')
    const btn_reject = card.querySelector('[data-action="reject"]')
    
    if (btn_approve) {
        btn_approve.addEventListener("click", () => abrir_modal_revisao(ajuste, "approved"))
    }
    
    if (btn_reject) {
        btn_reject.addEventListener("click", () => abrir_modal_revisao(ajuste, "rejected"))
    }
    
    return card
}


// ============================================
// ABRE O MODAL DE REVISÃO
// ============================================
function abrir_modal_revisao(ajuste, novo_status) {
    
    const antigo = document.getElementById("review-modal-overlay")
    if (antigo) antigo.remove()
    
    const nome = ajuste.employee_name || 
                 (ajuste.employee_email ? ajuste.employee_email.split("@")[0] : "N/A")
    
    const acao_label = novo_status === "approved" ? "Aprovar" : "Reprovar"
    const confirm_class = novo_status === "approved" ? "confirm-approve" : "confirm-reject"
    const confirm_icone = novo_status === "approved" ? "aprovado" : "reprovado"
    
    const overlay = document.createElement("div")
    overlay.className = "review-modal-overlay active"
    overlay.id = "review-modal-overlay"
    
    overlay.innerHTML = `
        <div class="review-modal">
            <div class="review-modal-header">
                <h3 class="review-modal-title">${acao_label} ajuste</h3>
            </div>
            <div class="review-modal-body">
                <p style="font-size: 14px; color: #1A2942; line-height: 1.5;">
                    Você está prestes a <strong>${acao_label.toLowerCase()}</strong> o ajuste de 
                    <strong>${nome}</strong> do dia <strong>${formatar_data(ajuste.target_date)}</strong>.
                </p>
                
                <div>
                    <div class="review-label">Observação (opcional)</div>
                    <textarea 
                        class="review-textarea" 
                        id="review-notes"
                        placeholder="Adicione uma observação para o funcionário..."
                        maxlength="500"
                    ></textarea>
                </div>
            </div>
            <div class="review-modal-footer">
                <button class="review-btn review-btn-cancel" id="review-cancel">
                    Cancelar
                </button>
                <button class="review-btn review-btn-confirm ${confirm_class}" id="review-confirm">
                    ${icone(confirm_icone, "action-icon")} ${acao_label}
                </button>
            </div>
        </div>
    `
    
    document.body.appendChild(overlay)
    
    const handle_esc = (e) => {
        if (e.key === "Escape") {
            fechar_modal_revisao()
            document.removeEventListener("keydown", handle_esc)
        }
    }
    document.addEventListener("keydown", handle_esc)
    
    const btn_cancel = overlay.querySelector("#review-cancel")
    btn_cancel.addEventListener("click", fechar_modal_revisao)
    
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) fechar_modal_revisao()
    })
    
    const btn_confirm = overlay.querySelector("#review-confirm")
    btn_confirm.addEventListener("click", async () => {
        
        const notes = overlay.querySelector("#review-notes").value.trim()
        
        btn_confirm.disabled = true
        btn_confirm.textContent = "Processando..."
        
        const sucesso = await processar_revisao(ajuste, novo_status, notes)
        
        if (sucesso) {
            fechar_modal_revisao()
        } else {
            btn_confirm.disabled = false
            btn_confirm.innerHTML = `${icone(confirm_icone, "action-icon")} ${acao_label}`
        }
    })
}


// ============================================
// FECHA O MODAL
// ============================================
function fechar_modal_revisao() {
    const overlay = document.getElementById("review-modal-overlay")
    if (overlay) overlay.remove()
}


// ============================================
// PROCESSA A REVISÃO
// ============================================
async function processar_revisao(ajuste, novo_status, notes) {
    
    try {
        console.log(`📝 Processando ${novo_status} do ajuste ${ajuste.id}`)
        
        // 1️⃣ Atualiza o ajuste
        const adjustment_ref = doc(db, "Clock_in_adjustments", ajuste.id)
        await updateDoc(adjustment_ref, {
            status: novo_status,
            reviewed_by: admin_user.uid,
            reviewed_by_email: admin_user.email,
            reviewed_at: serverTimestamp(),
            review_notes: notes
        })
        
        console.log("✅ Ajuste atualizado")
        
        // 2️⃣ Se aprovado, atualiza o registro de ponto
        if (novo_status === "approved") {
            await aplicar_ajuste_no_registro(ajuste)
        }
        
        // 3️⃣ Feedback
        const acao = novo_status === "approved" ? "aprovado" : "reprovado"
        mostrar_banner(`Ajuste ${acao} com sucesso!`, novo_status === "approved" ? "success" : "error")
        
        // 4️⃣ Recarrega
        await buscar_ajustes()
        
        return true
        
    } catch (error) {
        console.log("❌ Erro ao processar:", error.code, error.message)
        mostrar_banner("Erro ao processar. Tente novamente.", "error")
        return false
    }
}


// ============================================
// APLICA O AJUSTE NO REGISTRO ORIGINAL
// ============================================
async function aplicar_ajuste_no_registro(ajuste) {
    
    const doc_id = `${ajuste.target_date}_${ajuste.employee_id}`
    const registro_ref = doc(db, "Clock_in_registers_day", doc_id)
    
    const snapshot = await getDoc(registro_ref)
    
    if (!snapshot.exists()) {
        
        console.log("📝 Criando doc novo (ponto esquecido)")
        
        const rv = ajuste.requested_value || {}
        
        await setDoc(registro_ref, {
            employee_id: ajuste.employee_id,
            employee_email: ajuste.employee_email,
            date: ajuste.target_date,
            
            entrada: rv.entrada || null,
            inicio_almoco: rv.inicio_almoco || null,
            fim_almoco: rv.fim_almoco || null,
            saida: rv.saida || null,
            
            adjusted: true,
            adjustment_id: ajuste.id,
            adjusted_by: admin_user.uid,
            adjusted_at: serverTimestamp()
        })
        
        console.log("✅ Doc criado")
        return
    }
    
    console.log("📝 Atualizando doc existente")
    
    const dados_atuais = snapshot.data()
    const campo = ajuste.target_field
    
    if (campo === "all") {
        const rv = ajuste.requested_value || {}
        
        await updateDoc(registro_ref, {
            entrada: rv.entrada || dados_atuais.entrada || null,
            entrada_original: dados_atuais.entrada || null,
            
            inicio_almoco: rv.inicio_almoco || dados_atuais.inicio_almoco || null,
            inicio_almoco_original: dados_atuais.inicio_almoco || null,
            
            fim_almoco: rv.fim_almoco || dados_atuais.fim_almoco || null,
            fim_almoco_original: dados_atuais.fim_almoco || null,
            
            saida: rv.saida || dados_atuais.saida || null,
            saida_original: dados_atuais.saida || null,
            
            adjusted: true,
            adjustment_id: ajuste.id,
            adjusted_by: admin_user.uid,
            adjusted_at: serverTimestamp()
        })
        
    } else {
        const valor_original = dados_atuais[campo] || null
        
        const update_data = {
            [campo]: ajuste.requested_value,
            [`${campo}_original`]: valor_original,
            adjusted: true,
            adjustment_id: ajuste.id,
            adjusted_by: admin_user.uid,
            adjusted_at: serverTimestamp()
        }
        
        await updateDoc(registro_ref, update_data)
    }
    
    console.log("✅ Doc atualizado")
}


// ============================================
// BANNER DE FEEDBACK
// ============================================
function mostrar_banner(texto, tipo = "success") {
    
    const antigo = document.querySelector(".feedback-banner")
    if (antigo) antigo.remove()
    
    const banner = document.createElement("div")
    banner.className = `feedback-banner ${tipo}`
    
    const icone_nome = tipo === "success" ? "aprovado" : "reprovado"
    
    banner.innerHTML = `
        ${icone(icone_nome, "banner-icon")}
        <span>${texto}</span>
    `
    
    document.body.appendChild(banner)
    
    setTimeout(() => banner.classList.add("active"), 50)
    
    setTimeout(() => {
        banner.classList.remove("active")
        setTimeout(() => banner.remove(), 400)
    }, 4000)
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
        } else if (target === "dashboard") {
            window.location.href = "/pages/RH/rh-dashboard.html"
        } else if (target === "approvals") {
            // Já estamos aqui
        }
    })
})