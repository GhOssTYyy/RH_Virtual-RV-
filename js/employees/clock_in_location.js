import { db } from "../firebase_config.js"
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"


// =========================================================
// CACHE DA CONFIGURAÇÃO
// =========================================================
// Pra não buscar no Firestore toda vez que o usuário clica.
// A config fica salva em memória depois da primeira busca.

let company_location_cache = null


// =========================================================
// BUSCA A CONFIGURAÇÃO DA EMPRESA NO FIRESTORE
// =========================================================
// Lê o documento "config/company_location".
// Na primeira chamada, busca no Firestore e cacheia.
// Nas próximas, retorna do cache.

async function get_company_location() {

    // Se já tem cache, retorna direto
    if (company_location_cache) {
        return company_location_cache
    }

    try {
        const doc_ref = doc(db, "config", "company_location")
        const snapshot = await getDoc(doc_ref)

        if (!snapshot.exists()) {
            console.log("⚠️ Config da empresa não encontrada no Firestore")
            return null
        }

        // Salva no cache
        company_location_cache = snapshot.data()
        return company_location_cache

    } catch (error) {
        console.log("❌ Erro ao buscar config:", error.code, error.message)
        return null
    }
}


// =========================================================
// CONVERTE GRAUS PARA RADIANOS
// =========================================================
// A Fórmula de Haversine usa radianos, não graus.
//   radianos = graus * (π / 180)

function toRadians(degrees) {
    return degrees * (Math.PI / 180)
}


// =========================================================
// FÓRMULA DE HAVERSINE
// =========================================================
// Calcula a distância (em metros) entre dois pontos GPS,
// levando em conta a curvatura da Terra.

function calculate_distance_meters(lat1, lon1, lat2, lon2) {

    const EARTH_RADIUS_METERS = 6371000

    const delta_lat = toRadians(lat2 - lat1)
    const delta_lon = toRadians(lon2 - lon1)

    const a =
        Math.sin(delta_lat / 2) * Math.sin(delta_lat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(delta_lon / 2) * Math.sin(delta_lon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return EARTH_RADIUS_METERS * c
}


// =========================================================
// PEGA A LOCALIZAÇÃO ATUAL DO USUÁRIO
// =========================================================
// Wrapper em cima do navigator.geolocation.

function get_current_location() {

    return new Promise(function(resolve) {

        // Verifica se o navegador suporta
        if (!navigator.geolocation) {
            resolve({
                success: false,
                error: "not_supported",
                message: "Navegador não suporta geolocalização"
            })
            return
        }

        navigator.geolocation.getCurrentPosition(

            // ✅ SUCESSO
            function(position) {
                resolve({
                    success: true,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                })
            },

            // ❌ ERRO
            function(error) {
                let mensagem = "Erro desconhecido"

                if (error.code === 1) mensagem = "Permissão negada"
                if (error.code === 2) mensagem = "GPS indisponível"
                if (error.code === 3) mensagem = "Tempo esgotado"

                resolve({
                    success: false,
                    error: error.code,
                    message: mensagem
                })
            },

            // ⚙️ OPÇÕES
            {
                enableHighAccuracy: true,   // força GPS real
                timeout: 10000,             // desiste após 10s
                maximumAge: 0               // não usa cache
            }
        )
    })
}


// =========================================================
// FUNÇÃO PRINCIPAL — VERIFICA LOCALIZAÇÃO
// =========================================================
// Essa é a função que o clock_in_display.js chama.
// Retorna um objeto com:
//   status: "dentro" | "fora" | "sem_gps" | "impreciso" | "sem_config"
//   distance: distância em metros (ou null)
//   latitude / longitude: onde o usuário estava
//   accuracy: precisão do GPS em metros
//   message: mensagem amigável

async function verify_location() {

    // 1. Busca a config da empresa no Firestore
    const company = await get_company_location()

    // 2. Se não achou, retorna erro
    if (!company) {
        return {
            status: "sem_config",
            distance: null,
            latitude: null,
            longitude: null,
            accuracy: null,
            message: "Configuração da empresa não encontrada"
        }
    }

    // 3. Tenta pegar a localização do usuário
    const location = await get_current_location()

    // 4. Se não conseguiu
    if (!location.success) {
        return {
            status: "sem_gps",
            distance: null,
            latitude: null,
            longitude: null,
            accuracy: null,
            message: location.message
        }
    }

    // 5. Calcula a distância
    const distance = calculate_distance_meters(
        location.latitude,
        location.longitude,
        company.latitude,
        company.longitude
    )

    const distance_rounded = Math.round(distance)

    // 6. Verifica precisão do GPS
    //    Se accuracy > 100m, o GPS tá muito ruim pra confiar
    if (location.accuracy > 100) {
        return {
            status: "impreciso",
            distance: distance_rounded,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy: Math.round(location.accuracy),
            message: "GPS com precisão baixa"
        }
    }

    // 7. Verifica se está dentro ou fora
    const dentro = distance_rounded <= company.radius_meters

    return {
        status: dentro ? "dentro" : "fora",
        distance: distance_rounded,
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: Math.round(location.accuracy),
        message: dentro
            ? `Dentro da área (${distance_rounded}m)`
            : `Fora da área (${distance_rounded}m)`
    }
}


// =========================================================
// EXPORTAÇÃO
// =========================================================

export {
    verify_location,
    get_company_location,
    calculate_distance_meters
}