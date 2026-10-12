import { auth, db } from "../firebase_config.js"
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// =========================================================
// CATEGORIAS DISPONÍVEIS
// =========================================================
// Cada categoria tem: id (vai pro Firestore), label (mostrado), 
// icone (visual), exige_motivo (se é obrigatório detalhar)

export const CATEGORIAS = [
    { id: "esquecimento",       label: "Esquecimento",                icone: "📌" },
    { id: "erro",               label: "Erro de digitação",           icone: "❌" },
    { id: "atestado",           label: "Atestado médico",             icone: "🏥" },
    { id: "remoto",             label: "Trabalho remoto",             icone: "🏠" },
    { id: "tecnico",            label: "Problema técnico",            icone: "⚠️" },
    { id: "licenca_medica",     label: "Licença médica",              icone: "🩺" },
    { id: "licenca_parental",   label: "Licença maternidade/paternidade", icone: "👶" },
    { id: "licenca_casamento",  label: "Licença casamento",           icone: "💍" },
    { id: "licenca_luto",       label: "Licença luto",                icone: "🕊️" },
    { id: "outro",              label: "Outro",                       icone: "📝" }
]


// =========================================================
// MAPEAMENTO DE CAMPOS (pra exibição)
// =========================================================
export const CAMPOS_LABEL = {
    entrada:        "Entrada",
    inicio_almoco:  "Almoço",
    fim_almoco:     "Volta",
    saida:          "Saída"
}


// =========================================================
// VALIDAÇÃO DE HORÁRIO (HH:MM)
// =========================================================
export function validar_horario(valor) {
    if (!valor) return false
    
    // Regex: 00:00 até 23:59
    const regex = /^([01]\d|2[0-3]):([0-5]\d)$/
    return regex.test(valor)
}


// =========================================================
// CRIA O HTML DO MODAL DE AJUSTE
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

            <div class="adjust-modal-body" id="adjust-modal-body">
                <!-- preenchido via JS -->
            </div>

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
// ABRE O MODAL — AJUSTE DE CAMPO ESPECÍFICO
// =========================================================
export function abrir_modal_ajuste_simples({
    data,
    campo,
    valor_atual,
    employee_name,
    on_success
}) {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const body = document.getElementById("adjust-modal-body")
    const title = document.getElementById("adjust-modal-title")
    
    if (!modal || !body) {
        console.error("❌ Modal não encontrado no DOM")
        return
    }
    
    title.textContent = "Solicitar Ajuste"
    
    // Formata a data pra exibição (DD/MM/YYYY)
    const [ano, mes, dia] = data.split("-")
    const data_formatada = `${dia}/${mes}/${ano}`
    
    // Campo por extenso
    const campo_label = CAMPOS_LABEL[campo] || campo
    
    body.innerHTML = `
        <!-- Info do dia -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">📅</span>
                Dia
            </span>
            <div class="adjust-value-info">
                <span class="adjust-value-new">${data_formatada}</span>
            </div>
        </div>

        <!-- Campo a ajustar -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">⏰</span>
                Campo
            </span>
            <div class="adjust-value-info">
                <span class="adjust-value-new">${campo_label}</span>
            </div>
        </div>

        <!-- Valor atual → novo -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">📝</span>
                Novo horário
            </span>
            <div class="adjust-value-info">
                <span class="adjust-value-old">${valor_atual || "--:--"}</span>
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

        <!-- Categoria -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">📋</span>
                Categoria
            </span>
            <select class="adjust-select" id="adjust-select-category">
                ${CATEGORIAS.map(cat => 
                    `<option value="${cat.id}">${cat.icone} ${cat.label}</option>`
                ).join("")}
            </select>
        </div>

        <!-- Motivo (obrigatório) -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">💬</span>
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
    
    // Guarda referências dos valores
    modal.dataset.target_date = data
    modal.dataset.target_field = campo
    modal.dataset.original_value = valor_atual || ""
    modal.dataset.mode = "simple"
    modal.dataset.employee_name = employee_name || ""
    
    // Abre o modal
    modal.classList.add("active")
    
    // Foca no input
    setTimeout(() => {
        const input = document.getElementById("adjust-input-value")
        if (input) input.focus()
    }, 100)
    
    // Callback de sucesso
    modal.dataset.on_success = "true"
    modal._on_success = on_success
}


// =========================================================
// ABRE O MODAL — PONTO ESQUECIDO (dia inteiro)
// =========================================================
export function abrir_modal_ponto_esquecido({
    employee_name,
    on_success
}) {
    
    const modal = document.getElementById("adjust-modal-overlay")
    const body = document.getElementById("adjust-modal-body")
    const title = document.getElementById("adjust-modal-title")
    
    if (!modal || !body) {
        console.error("❌ Modal não encontrado no DOM")
        return
    }
    
    title.textContent = "Adicionar Ponto Esquecido"
    
    // Data de hoje em formato YYYY-MM-DD (default)
    const hoje = new Date().toISOString().split("T")[0]
    
    body.innerHTML = `
        <!-- Data -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">📅</span>
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

        <!-- Horários -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">⏰</span>
                Horários trabalhados
            </span>
            <div class="adjust-time-grid">
                <div class="adjust-time-item">
                    <label for="adjust-input-entrada">Entrada</label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-entrada"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-inicio_almoco">Almoço</label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-inicio_almoco"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-fim_almoco">Volta</label>
                    <input 
                        type="text" 
                        class="adjust-input" 
                        id="adjust-input-fim_almoco"
                        placeholder="HH:MM"
                        maxlength="5"
                    >
                </div>
                <div class="adjust-time-item">
                    <label for="adjust-input-saida">Saída</label>
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

        <!-- Categoria -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">📋</span>
                Categoria
            </span>
            <select class="adjust-select" id="adjust-select-category">
                ${CATEGORIAS.map(cat => 
                    `<option value="${cat.id}">${cat.icone} ${cat.label}</option>`
                ).join("")}
            </select>
        </div>

        <!-- Motivo -->
        <div class="adjust-field">
            <span class="adjust-label">
                <span class="adjust-label-icon">💬</span>
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
// CONFIGURA OS EVENTOS DO MODAL (chamado UMA vez)
// =========================================================
export function configurar_eventos_modal() {
    
    const modal = document.getElementById("adjust-modal-overlay")
    if (!modal) return
    
    // Fechar (X)
    const btn_close = document.getElementById("adjust-modal-close")
    if (btn_close) {
        btn_close.addEventListener("click", fechar_modal_ajuste)
    }
    
    // Cancelar
    const btn_cancel = document.getElementById("adjust-modal-cancel")
    if (btn_cancel) {
        btn_cancel.addEventListener("click", fechar_modal_ajuste)
    }
    
    // Fechar ao clicar fora
    modal.addEventListener("click", function(e) {
        if (e.target === modal) {
            fechar_modal_ajuste()
        }
    })
    
    // Fechar com ESC
    document.addEventListener("keydown", function(e) {
        if (e.key === "Escape" && modal.classList.contains("active")) {
            fechar_modal_ajuste()
        }
    })
    
    // Enviar
    const btn_submit = document.getElementById("adjust-modal-submit")
    if (btn_submit) {
        btn_submit.addEventListener("click", enviar_solicitacao)
    }
    
    // Formatação automática dos inputs de horário (adiciona ":")
    document.addEventListener("input", function(e) {
        if (e.target.classList && e.target.classList.contains("adjust-input")) {
            const tipo = e.target.type
            if (tipo === "text" && e.target.maxLength === 5) {
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
// ENVIA A SOLICITAÇÃO (valida + salva)
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
    
    // Limpa erros
    error_value.classList.remove("visible")
    error_reason.classList.remove("visible")
    input_value.style.borderColor = ""
    textarea_reason.style.borderColor = ""
    
    // Valida horário
    const novo_valor = input_value.value.trim()
    if (!validar_horario(novo_valor)) {
        error_value.classList.add("visible")
        input_value.style.borderColor = "#EF4444"
        has_error = true
    }
    
    // Valida motivo
    const motivo = textarea_reason.value.trim()
    if (motivo.length < 5) {
        error_reason.classList.add("visible")
        textarea_reason.style.borderColor = "#EF4444"
        has_error = true
    }
    
    if (has_error) return
    
    // 📝 Confirmação "Tem certeza?"
    const target_date = modal.dataset.target_date
    const target_field = modal.dataset.target_field
    const original_value = modal.dataset.original_value
    const campo_label = CAMPOS_LABEL[target_field] || target_field
    
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
    
    // Desabilita botão
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
        mostrar_banner("✅ Solicitação enviada! O RH será notificado.", "success")
        
        // Callback de sucesso
        if (typeof modal._on_success === "function") {
            modal._on_success()
        }
        
    } catch (error) {
        console.error("❌ Erro ao enviar:", error)
        mostrar_banner("❌ Erro ao enviar. Tente novamente.", "error")
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
    
    // Limpa erros
    error_date.classList.remove("visible")
    error_times.classList.remove("visible")
    error_reason.classList.remove("visible")
    
    // Valida data
    const data = input_date.value
    if (!data) {
        error_date.classList.add("visible")
        has_error = true
    }
    
    // Valida horários
    const entrada = input_entrada.value.trim()
    const ini_almoco = input_ini_almoco.value.trim()
    const fim_almoco = input_fim_almoco.value.trim()
    const saida = input_saida.value.trim()
    
    // Entrada e saída são obrigatórios
    const entrada_ok = validar_horario(entrada)
    const saida_ok = validar_horario(saida)
    
    // Almoço é opcional, mas se preenchido, tem que ser válido
    const ini_almoco_ok = !ini_almoco || validar_horario(ini_almoco)
    const fim_almoco_ok = !fim_almoco || validar_horario(fim_almoco)
    
    if (!entrada_ok || !saida_ok || !ini_almoco_ok || !fim_almoco_ok) {
        error_times.classList.add("visible")
        has_error = true
    }
    
    // Valida motivo
    const motivo = textarea_reason.value.trim()
    if (motivo.length < 5) {
        error_reason.classList.add("visible")
        textarea_reason.style.borderColor = "#EF4444"
        has_error = true
    }
    
    if (has_error) return
    
    // Confirmação
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
    
    // Desabilita botão
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
        mostrar_banner("✅ Solicitação enviada! O RH será notificado.", "success")
        
        if (typeof modal._on_success === "function") {
            modal._on_success()
        }
        
    } catch (error) {
        console.error("❌ Erro ao enviar:", error)
        mostrar_banner("❌ Erro ao enviar. Tente novamente.", "error")
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
    return cat ? `${cat.icone} ${cat.label}` : id
}


// =========================================================
// MODAL DE CONFIRMAÇÃO ("Tem certeza?")
// =========================================================
function mostrar_confirmacao({ titulo, linhas, aviso }) {
    
    return new Promise((resolve) => {
        
        // Cria overlay de confirmação
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
// BANNER DE CONFIRMAÇÃO (toast no topo)
// =========================================================
export function mostrar_banner(texto, tipo = "success") {
    
    // Remove banner antigo se existir
    const antigo = document.getElementById("adjust-banner")
    if (antigo) antigo.remove()
    
    const banner = document.createElement("div")
    banner.className = "adjust-banner"
    banner.id = "adjust-banner"
    
    if (tipo === "error") {
        banner.classList.add("adjust-banner-error")
    }
    
    const icone = tipo === "success" ? "✅" : "❌"
    
    banner.innerHTML = `
        <span class="adjust-banner-icon">${icone}</span>
        <span>${texto}</span>
    `
    
    document.body.appendChild(banner)
    
    // Anima entrada
    setTimeout(() => banner.classList.add("active"), 50)
    
    // Remove depois de 4s
    setTimeout(() => {
        banner.classList.remove("active")
        setTimeout(() => banner.remove(), 400)
    }, 4000)
}