import { auth, db } from "../firebase_config.js"
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// =========================================================
// MAPA DE ÍCONES
// =========================================================
const ICONES = {
    dia:          { emoji: "📅", arquivo: "/assets/icons/calendar-icon.svg" },
    campo:        { emoji: "⏰", arquivo: "/assets/icons/clock-in-button-icon.svg" },
    horario:      { emoji: "📝", arquivo: "/assets/icons/edit_icon.svg" },
    categoria:    { emoji: "📋", arquivo: "/assets/icons/clipboard-icon.svg" },
    motivo:       { emoji: "💬", arquivo: "/assets/icons/message-icon.svg" },
    
    entrada:      { emoji: "⏰", arquivo: "/assets/icons/clock-in-button-icon.svg" },
    almoço:       { emoji: "🍽️", arquivo: "/assets/icons/lunch-icon.svg" },
    volta:        { emoji: "🔄", arquivo: "/assets/icons/return-icon.svg" },
    saida:        { emoji: "🏁", arquivo: "/assets/icons/finish-icon.svg" },
    
    sucesso:      { emoji: "✅", arquivo: "/assets/icons/check-icon.svg" },
    erro:         { emoji: "❌", arquivo: "/assets/icons/x-icon.svg" }
}


// =========================================================
// HELPER — Gera o HTML do ícone
// =========================================================
function icone(nome, classe = "icon-img") {
    const item = ICONES[nome]
    if (!item) return ""
    
    return `<img src="${item.arquivo}" alt="${item.emoji}" class="${classe}" onerror="this.replaceWith('${item.emoji}')">`
}


// =========================================================
// CATEGORIAS DISPONÍVEIS
// =========================================================
export const CATEGORIAS = [
    { 
        id: "esquecimento", 
        label: "Esquecimento", 
        emoji: "📌",
        arquivo: "/assets/icons/category-esquecimento.svg"
    },
    { 
        id: "erro", 
        label: "Erro de digitação", 
        emoji: "❌",
        arquivo: "/assets/icons/category-erro.svg"
    },
    { 
        id: "atestado", 
        label: "Atestado médico", 
        emoji: "🏥",
        arquivo: "/assets/icons/category-atestado.svg"
    },
    { 
        id: "remoto", 
        label: "Trabalho remoto", 
        emoji: "🏠",
        arquivo: "/assets/icons/category-remoto.svg"
    },
    { 
        id: "tecnico", 
        label: "Problema técnico", 
        emoji: "⚠️",
        arquivo: "/assets/icons/category-tecnico.svg"
    },
    { 
        id: "licenca_medica", 
        label: "Licença médica", 
        emoji: "🩺",
        arquivo: "/assets/icons/category-licenca-medica.svg"
    },
    { 
        id: "licenca_parental", 
        label: "Licença maternidade/paternidade", 
        emoji: "👶",
        arquivo: "/assets/icons/category-licenca-parental.svg"
    },
    { 
        id: "licenca_casamento", 
        label: "Licença casamento", 
        emoji: "💍",
        arquivo: "/assets/icons/category-licenca-casamento.svg"
    },
    { 
        id: "licenca_luto", 
        label: "Licença luto", 
        emoji: "🕊️",
        arquivo: "/assets/icons/category-licenca-luto.svg"
    },
    { 
        id: "outro", 
        label: "Outro", 
        emoji: "📝",
        arquivo: "/assets/icons/category-outro.svg"
    }
]


// =========================================================
// CAMPOS DISPONÍVEIS
// =========================================================
export const CAMPOS_LABEL = {
    entrada:        { label: "Entrada",  icone: "entrada" },
    inicio_almoco:  { label: "Almoço",   icone: "almoço" },
    fim_almoco:     { label: "Volta",    icone: "volta" },
    saida:          { label: "Saída",    icone: "saida" }
}


// =========================================================
// VALIDAÇÃO DE HORÁRIO (HH:MM)
// =========================================================
export function validar_horario(valor) {
    if (!valor) return false
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
    return regex.test(valor)
}


// =========================================================
// CRIA O MODAL
// =========================================================
export function criar_modal_ajuste() {
    
    const modal = document.createElement("div")
    modal.className = "adjust-modal-overlay"
    modal.id = "adjust-modal-overlay"
    
    modal.innerHTML = `
        <div class="adjust-modal" id="adjust-modal">
            <div class="adjust-modal-header">
                <h3 class="adjust-modal-title" id="adjust-modal-title">
                    Solicitar Ajuste
                </h3>
                <button class="adjust-modal-close" id="adjust-modal-close">✕</button>
            </div>
            <div class="adjust-modal-body" id="adjust-modal-body"></div>
            <div class="adjust-modal-footer">
                <button class="adjust-btn adjust-btn-secondary" id="adjust-modal-cancel">
                    Cancelar
                </button>
                <button class="adjust-btn adjust-btn-primary" id="adjust-modal-submit">
                    Enviar
                </button>
            </div>
        </div>
    `
    
    document.body.appendChild(modal)
    return modal
}


// =========================================================
// ABRE MODAL — AJUSTE SIMPLES (COM DROPDOWN DE CAMPO)
// =========================================================
export function abrir_modal_ajuste_simples({
    register,
    employee_name,
    on_success
}) {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const body = document.getElementById("adjust-modal-body")
    const title = document.getElementById("adjust-modal-title")
    
    if (!modal || !body) return
    
    title.textContent = "Solicitar Ajuste"
    
    const data = register.date
    const [ano, mes, dia] = data.split("-")
    const data_formatada = `${dia}/${mes}/${ano}`
    
    // Detecta o campo sugerido (primeiro que estiver vazio ou o que faz mais sentido)
    const campo_sugerido = detectar_campo_sugerido(register)
    const valor_atual_inicial = register[campo_sugerido] || ""
    
    body.innerHTML = `
        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("dia", "adjust-label-icon")}
                Dia
            </span>
            <div class="adjust-value-info">
                <span class="adjust-value-new">${data_formatada}</span>
            </div>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("campo", "adjust-label-icon")}
                Campo
            </span>
            <select class="adjust-select" id="adjust-select-field">
                <option value="entrada" ${campo_sugerido === "entrada" ? "selected" : ""}>
                    ⏰ Entrada
                </option>
                <option value="inicio_almoco" ${campo_sugerido === "inicio_almoco" ? "selected" : ""}>
                    🍽️ Almoço
                </option>
                <option value="fim_almoco" ${campo_sugerido === "fim_almoco" ? "selected" : ""}>
                    🔄 Volta
                </option>
                <option value="saida" ${campo_sugerido === "saida" ? "selected" : ""}>
                    🏁 Saída
                </option>
            </select>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("horario", "adjust-label-icon")}
                Novo horário
            </span>
            <div class="adjust-value-info">
                <span class="adjust-value-old" id="adjust-value-old">${valor_atual_inicial || "--:--"}</span>
                <span class="adjust-value-arrow">→</span>
                <input 
                    type="text" 
                    class="adjust-input" 
                    id="adjust-input-value"
                    placeholder="HH:MM"
                    maxlength="5"
                    style="width: 80px; text-align: center; font-weight: 700; padding: 6px 8px;"
                >
            </div>
            <span class="adjust-hint">Use o formato HH:MM (ex: 08:00)</span>
            <span class="adjust-error" id="adjust-error-value">
                Formato inválido. Use HH:MM (ex: 08:00)
            </span>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("categoria", "adjust-label-icon")}
                Categoria
            </span>
            <select class="adjust-select" id="adjust-select-category">
                ${CATEGORIAS.map(cat => 
                    `<option value="${cat.id}">${cat.emoji} ${cat.label}</option>`
                ).join("")}
            </select>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("motivo", "adjust-label-icon")}
                Motivo *
            </span>
            <textarea 
                class="adjust-textarea" 
                id="adjust-textarea-reason"
                placeholder="Explique o motivo do ajuste (mínimo 5 caracteres)"
                maxlength="500"
            ></textarea>
            <span class="adjust-error" id="adjust-error-reason">
                Motivo obrigatório (mínimo 5 caracteres)
            </span>
        </div>
    `
    
    // 🔑 Guarda o register completo no dataset
    modal.dataset.mode = "simple"
    modal.dataset.target_date = data
    modal.dataset.target_field = campo_sugerido
    modal.dataset.original_value = valor_atual_inicial
    modal.dataset.employee_name = employee_name || ""
    
    // 🔑 Guarda todos os valores do register num JSON
    modal.dataset.register_json = JSON.stringify({
        entrada: register.entrada || "",
        inicio_almoco: register.inicio_almoco || "",
        fim_almoco: register.fim_almoco || "",
        saida: register.saida || ""
    })
    
    modal.classList.add("active")
    
    // 🔑 Listener do dropdown de campo
    const select_field = document.getElementById("adjust-select-field")
    const value_old = document.getElementById("adjust-value-old")
    
    select_field.addEventListener("change", function() {
        const novo_campo = select_field.value
        const valores = JSON.parse(modal.dataset.register_json)
        const valor_do_campo = valores[novo_campo] || ""
        
        // Atualiza o "valor atual" e o dataset
        value_old.textContent = valor_do_campo || "--:--"
        modal.dataset.target_field = novo_campo
        modal.dataset.original_value = valor_do_campo
    })
    
    setTimeout(() => {
        const input = document.getElementById("adjust-input-value")
        if (input) input.focus()
    }, 100)
    
    modal._on_success = on_success
}


// =========================================================
// DETECTA O CAMPO SUGERIDO BASEADO NO REGISTRO
// =========================================================
function detectar_campo_sugerido(register) {
    // Se não tem entrada → sugere entrada
    if (!register.entrada) return "entrada"
    
    // Se tem entrada mas não tem almoço → sugere almoço
    if (!register.inicio_almoco) return "inicio_almoco"
    
    // Se tem almoço mas não tem volta → sugere volta
    if (!register.fim_almoco) return "fim_almoco"
    
    // Se tem volta mas não tem saída → sugere saída
    if (!register.saida) return "saida"
    
    // Se tem tudo → sugere entrada (padrão)
    return "entrada"
}


// =========================================================
// ABRE MODAL — PONTO ESQUECIDO
// =========================================================
export function abrir_modal_ponto_esquecido({
    employee_name,
    on_success
}) {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const body = document.getElementById("adjust-modal-body")
    const title = document.getElementById("adjust-modal-title")
    
    if (!modal || !body) return
    
    title.textContent = "Adicionar Ponto Esquecido"
    
    const hoje = new Date().toISOString().split("T")[0]
    
    body.innerHTML = `
        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("dia", "adjust-label-icon")}
                Data do ponto esquecido
            </span>
            <input 
                type="date" 
                class="adjust-input" 
                id="adjust-input-date"
                value="${hoje}"
                max="${hoje}"
            >
            <span class="adjust-error" id="adjust-error-date">
                Selecione uma data válida (até hoje)
            </span>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("campo", "adjust-label-icon")}
                Horários trabalhados
            </span>
            <div class="adjust-time-grid">
                <div class="adjust-time-item">
                    <label for="adjust-input-entrada">
                        ${icone("entrada", "time-label-icon")} Entrada
                    </label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-entrada"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-inicio_almoco">
                        ${icone("almoço", "time-label-icon")} Almoço
                    </label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-inicio_almoco"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-fim_almoco">
                        ${icone("volta", "time-label-icon")} Volta
                    </label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-fim_almoco"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-saida">
                        ${icone("saida", "time-label-icon")} Saída
                    </label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-saida"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
            </div>
            <span class="adjust-hint">Preencha pelo menos entrada e saída</span>
            <span class="adjust-error" id="adjust-error-times">
                Preencha pelo menos entrada e saída com formato HH:MM
            </span>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("categoria", "adjust-label-icon")}
                Categoria
            </span>
            <select class="adjust-select" id="adjust-select-category">
                ${CATEGORIAS.map(cat => 
                    `<option value="${cat.id}">${cat.emoji} ${cat.label}</option>`
                ).join("")}
            </select>
        </div>

        <div class="adjust-field">
            <span class="adjust-label">
                ${icone("motivo", "adjust-label-icon")}
                Motivo *
            </span>
            <textarea 
                class="adjust-textarea" 
                id="adjust-textarea-reason"
                placeholder="Explique o motivo do ajuste (mínimo 5 caracteres)"
                maxlength="500"
            ></textarea>
            <span class="adjust-error" id="adjust-error-reason">
                Motivo obrigatório (mínimo 5 caracteres)
            </span>
        </div>
    `
    
    modal.dataset.mode = "esquecido"
    modal.dataset.employee_name = employee_name || ""
    modal.classList.add("active")
    
    setTimeout(() => {
        const input = document.getElementById("adjust-input-entrada")
        if (input) input.focus()
    }, 100)
    
    modal._on_success = on_success
}


// =========================================================
// FECHA O MODAL
// =========================================================
export function fechar_modal_ajuste() {
    const modal = document.getElementById("adjust-modal-overlay")
    if (modal) {
        modal.classList.remove("active")
        modal.dataset.mode = ""
    }
}


// =========================================================
// CONFIGURA OS EVENTOS DO MODAL
// =========================================================
export function configurar_eventos_modal() {
    
    const modal = document.getElementById("adjust-modal-overlay")
    if (!modal) return
    
    const btn_close = document.getElementById("adjust-modal-close")
    if (btn_close) btn_close.addEventListener("click", fechar_modal_ajuste)
    
    const btn_cancel = document.getElementById("adjust-modal-cancel")
    if (btn_cancel) btn_cancel.addEventListener("click", fechar_modal_ajuste)
    
    modal.addEventListener("click", function(e) {
        if (e.target === modal) fechar_modal_ajuste()
    })
    
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            fechar_modal_ajuste()
        }
    })
    
    const btn_submit = document.getElementById("adjust-modal-submit")
    if (btn_submit) btn_submit.addEventListener("click", enviar_solicitacao)
    
    // Formatação automática dos inputs de horário
    document.addEventListener("input", function(e) {
        if (e.target.classList && e.target.classList.contains("adjust-input")) {
            if (e.target.type === "text" && e.target.maxLength === 5) {
                let valor = e.target.value.replace(/\D/g, "")
                if (valor.length > 2) {
                    valor = valor.substring(0, 2) + ":" + valor.substring(2, 4)
                }
                e.target.value = valor
            }
        }
    })
}


// =========================================================
// ENVIA A SOLICITAÇÃO
// =========================================================
async function enviar_solicitacao() {
    const modal = document.getElementById("adjust-modal-overlay")
    const mode = modal.dataset.mode
    
    if (mode === "simple") {
        await enviar_solicitacao_simples()
    } else if (mode === "esquecido") {
        await enviar_solicitacao_esquecido()
    }
}


// =========================================================
// ENVIO — AJUSTE SIMPLES
// =========================================================
async function enviar_solicitacao_simples() {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const input_value = document.getElementById("adjust-input-value")
    const select_category = document.getElementById("adjust-select-category")
    const textarea_reason = document.getElementById("adjust-textarea-reason")
    const error_value = document.getElementById("adjust-error-value")
    const error_reason = document.getElementById("adjust-error-reason")
    
    let has_error = false
    
    error_value.classList.remove("visible")
    error_reason.classList.remove("visible")
    input_value.style.borderColor = ""
    textarea_reason.style.borderColor = ""
    
    const novo_valor = input_value.value.trim()
    if (!validar_horario(novo_valor)) {
        error_value.classList.add("visible")
        input_value.style.borderColor = "#EF4444"
        has_error = true
    }
    
    const motivo = textarea_reason.value.trim()
    if (motivo.length < 5) {
        error_reason.classList.add("visible")
        textarea_reason.style.borderColor = "#EF4444"
        has_error = true
    }
    
    if (has_error) return
    
    const target_date = modal.dataset.target_date
    const target_field = modal.dataset.target_field
    const original_value = modal.dataset.original_value
    const campo_label = CAMPOS_LABEL[target_field]?.label || target_field
    
    const [ano, mes, dia] = target_date.split("-")
    const data_formatada = `${dia}/${mes}/${ano}`
    
    const ok = await mostrar_confirmacao({
        titulo: "Confirmar solicitação",
        linhas: [
            `📅 Dia: ${data_formatada}`,
            `⏰ ${campo_label}: ${original_value || "--:--"} → ${novo_valor}`,
            `📋 Categoria: ${obter_label_categoria(select_category.value)}`
        ],
        aviso: "Após enviar, o RH será notificado e você não poderá editar."
    })
    
    if (!ok) return
    
    const btn_submit = document.getElementById("adjust-modal-submit")
    btn_submit.disabled = true
    btn_submit.textContent = "Enviando..."
    
    try {
        const user = auth.currentUser
        if (!user) throw new Error("Usuário não autenticado")
        
        await addDoc(collection(db, "Clock_in_adjustments"), {
            employee_id: user.uid,
            employee_email: user.email,
            employee_name: modal.dataset.employee_name || user.email.split("@")[0],
            target_date: target_date,
            target_field: target_field,
            original_value: original_value || null,
            requested_value: novo_valor,
            reason: motivo,
            category: select_category.value,
            status: "pending",
            requested_at: serverTimestamp(),
            reviewed_by: null,
            reviewed_by_email: null,
            reviewed_at: null,
            review_notes: ""
        })
        
        fechar_modal_ajuste()
        mostrar_banner("Solicitação enviada! O RH será notificado.", "success")
        
        if (typeof modal._on_success === "function") {
            modal._on_success()
        }
        
    } catch (error) {
        console.error("❌ Erro ao enviar:", error)
        mostrar_banner("Erro ao enviar. Tente novamente.", "error")
    } finally {
        btn_submit.disabled = false
        btn_submit.textContent = "Enviar"
    }
}


// =========================================================
// ENVIO — PONTO ESQUECIDO
// =========================================================
async function enviar_solicitacao_esquecido() {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const input_date = document.getElementById("adjust-input-date")
    const input_entrada = document.getElementById("adjust-input-entrada")
    const input_ini_almoco = document.getElementById("adjust-input-inicio_almoco")
    const input_fim_almoco = document.getElementById("adjust-input-fim_almoco")
    const input_saida = document.getElementById("adjust-input-saida")
    const select_category = document.getElementById("adjust-select-category")
    const textarea_reason = document.getElementById("adjust-textarea-reason")
    const error_date = document.getElementById("adjust-error-date")
    const error_times = document.getElementById("adjust-error-times")
    const error_reason = document.getElementById("adjust-error-reason")
    
    let has_error = false
    
    error_date.classList.remove("visible")
    error_times.classList.remove("visible")
    error_reason.classList.remove("visible")
    
    const data = input_date.value
    if (!data) {
        error_date.classList.add("visible")
        has_error = true
    }
    
    const entrada = input_entrada.value.trim()
    const ini_almoco = input_ini_almoco.value.trim()
    const fim_almoco = input_fim_almoco.value.trim()
    const saida = input_saida.value.trim()
    
    const entrada_ok = validar_horario(entrada)
    const saida_ok = validar_horario(saida)
    const ini_almoco_ok = !ini_almoco || validar_horario(ini_almoco)
    const fim_almoco_ok = !fim_almoco || validar_horario(fim_almoco)
    
    if (!entrada_ok || !saida_ok || !ini_almoco_ok || !fim_almoco_ok) {
        error_times.classList.add("visible")
        has_error = true
    }
    
    const motivo = textarea_reason.value.trim()
    if (motivo.length < 5) {
        error_reason.classList.add("visible")
        textarea_reason.style.borderColor = "#EF4444"
        has_error = true
    }
    
    if (has_error) return
    
    const [ano, mes, dia] = data.split("-")
    const data_formatada = `${dia}/${mes}/${ano}`
    
    const ok = await mostrar_confirmacao({
        titulo: "Confirmar ponto esquecido",
        linhas: [
            `📅 Dia: ${data_formatada}`,
            `⏰ Entrada: ${entrada}`,
            `🍽️ Almoço: ${ini_almoco || "--:--"}`,
            `🔄 Volta: ${fim_almoco || "--:--"}`,
            `🏁 Saída: ${saida}`,
            `📋 Categoria: ${obter_label_categoria(select_category.value)}`
        ],
        aviso: "Após enviar, o RH será notificado e você não poderá editar."
    })
    
    if (!ok) return
    
    const btn_submit = document.getElementById("adjust-modal-submit")
    btn_submit.disabled = true
    btn_submit.textContent = "Enviando..."
    
    try {
        const user = auth.currentUser
        if (!user) throw new Error("Usuário não autenticado")
        
        await addDoc(collection(db, "Clock_in_adjustments"), {
            employee_id: user.uid,
            employee_email: user.email,
            employee_name: modal.dataset.employee_name || user.email.split("@")[0],
            target_date: data,
            target_field: "all",
            original_value: null,
            requested_value: {
                entrada: entrada,
                inicio_almoco: ini_almoco || null,
                fim_almoco: fim_almoco || null,
                saida: saida
            },
            reason: motivo,
            category: select_category.value,
            status: "pending",
            requested_at: serverTimestamp(),
            reviewed_by: null,
            reviewed_by_email: null,
            reviewed_at: null,
            review_notes: ""
        })
        
        fechar_modal_ajuste()
        mostrar_banner("Solicitação enviada! O RH será notificado.", "success")
        
        if (typeof modal._on_success === "function") {
            modal._on_success()
        }
        
    } catch (error) {
        console.error("❌ Erro ao enviar:", error)
        mostrar_banner("Erro ao enviar. Tente novamente.", "error")
    } finally {
        btn_submit.disabled = false
        btn_submit.textContent = "Enviar"
    }
}


// =========================================================
// HELPER — Label da categoria
// =========================================================
function obter_label_categoria(id) {
    const cat = CATEGORIAS.find(c => c.id === id)
    return cat ? `${cat.emoji} ${cat.label}` : id
}


// =========================================================
// MODAL DE CONFIRMAÇÃO
// =========================================================
function mostrar_confirmacao({ titulo, linhas, aviso }) {
    
    return new Promise((resolve) => {
        
        const overlay = document.createElement("div")
        overlay.className = "adjust-modal-overlay active"
        overlay.style.zIndex = "1500"
        
        overlay.innerHTML = `
            <div class="adjust-modal" style="max-width: 400px;">
                <div class="adjust-modal-header">
                    <h3 class="adjust-modal-title">${titulo}</h3>
                </div>
                <div class="adjust-modal-body">
                    <p style="color: #1A2942; font-size: 14px; margin-bottom: 12px; font-weight: 600;">
                        Tem certeza que deseja solicitar?
                    </p>
                    <div style="background: #F4F7FA; padding: 12px; border-radius: 10px; font-size: 13px; line-height: 1.8; color: #1A2942;">
                        ${linhas.map(l => `<div>${l}</div>`).join("")}
                    </div>
                    ${aviso ? `<p style="color: #7A8BA3; font-size: 12px; margin-top: 12px; font-style: italic;">${aviso}</p>` : ""}
                </div>
                <div class="adjust-modal-footer">
                    <button class="adjust-btn adjust-btn-secondary" id="confirm-no">
                        Voltar
                    </button>
                    <button class="adjust-btn adjust-btn-primary" id="confirm-yes">
                        Confirmar envio
                    </button>
                </div>
            </div>
        `
        
        document.body.appendChild(overlay)
        
        const btn_yes = overlay.querySelector("#confirm-yes")
        const btn_no = overlay.querySelector("#confirm-no")
        
        btn_yes.addEventListener("click", () => {
            document.body.removeChild(overlay)
            resolve(true)
        })
        
        btn_no.addEventListener("click", () => {
            document.body.removeChild(overlay)
            resolve(false)
        })
        
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay)
                resolve(false)
            }
        })
    })
}


// =========================================================
// BANNER DE FEEDBACK
// =========================================================
export function mostrar_banner(texto, tipo = "success") {
    
    const antigo = document.getElementById("adjust-banner")
    if (antigo) antigo.remove()
    
    const banner = document.createElement("div")
    banner.className = "adjust-banner"
    banner.id = "adjust-banner"
    
    if (tipo === "error") {
        banner.classList.add("adjust-banner-error")
    }
    
    const icone_nome = tipo === "success" ? "sucesso" : "erro"
    
    banner.innerHTML = `
        ${icone(icone_nome, "adjust-banner-icon")}
        <span>${texto}</span>
    `
    
    document.body.appendChild(banner)
    
    setTimeout(() => banner.classList.add("active"), 50)
    
    setTimeout(() => {
        banner.classList.remove("active")
        setTimeout(() => banner.remove(), 400)
    }, 4000)
}