//Configuração Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js"
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js"
import { getFirestore, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js"

const firebaseConfig = {
    apiKey: "AIzaSyDS-AfrZ6ORzH6dvEo5WP1Yjwz8PaeS0GA",
    authDomain: "rh-virtual-rv.firebaseapp.com",
    projectId: "rh-virtual-rv",
    storageBucket: "rh-virtual-rv.firebasestorage.app",
    messagingSenderId: "266794278171",
    appId: "1:266794278171:web:acad7f4e27a73d78a387be"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)


const clock_in_register = document.getElementById("clock-in-register")
const actual_time_screen = document.getElementById("actual-time-screen")
const actual_date_screen = document.getElementById("actual-date-screen")
const clock_in_message = document.getElementById("clock-in-message")
const actual_week_day_screen = document.getElementById("actual-week-day-screen")

const entry_clock_in_register = document.getElementById("entry-clock-in-register")
const begin_dinner_clock_in_register = document.getElementById("begin-dinner-clock-in-register")
const ending_dinner_clock_in_register = document.getElementById("ending-dinner-clock-in-register")
const exit_clock_in_register = document.getElementById("exit-clock-in-register")


import {discover_actual_clock_in_period } from "./clock_in_verification.js"

let entry_registered = false
let begin_dinner_registered = false
let ending_dinner_registered = false
let exit_registered = false
let registered_something = false

document.addEventListener("DOMContentLoaded", function(){

    //Exibição da hora quando aba é aberta usando as informações da função register_the_clock().
    const actual_time = register_the_clock()
    
    const time_element = document.createElement("output")
    time_element.textContent = actual_time
    actual_time_screen.append(time_element)

    //A cada 1 seg esse setInterval é acionado e atualiza na tela a hora.
    setInterval( function(){
        actual_time_screen.textContent = register_the_clock()
    }, 1000)


    //Exibição da data usando as informações da função register_the_date().
    const actual_date = register_the_date()

    const date_element = document.createElement("output")
    date_element.textContent = actual_date
    actual_date_screen.append(date_element)


    //Exibição do dia da semana usando as informações da função register_the_week_date().
    const actual_week_date = register_the_week_date()

    const week_date_element = document.createElement("output")
    week_date_element.textContent = actual_week_date
    actual_week_day_screen.append(week_date_element)

    //Execução da função de verificação
    verify_exist_clock_in_local_storage()
})

//Função para verificar se o ponto já foi salvo no local_storage, caso esteja permanece no histórico de pontos do usuario.

function verify_exist_clock_in_local_storage(){
    
    
    const actual_date_day = new Date().toLocaleDateString("pt-BR")
    const verify_date_saved_in_local_storage = localStorage.getItem("date_saved_in_local_storage")

//Caso seja um novo de dia de registro de ponto e haja pontos do dia anterior todos serão removidos apenas do histórico, no banco de dados continuará.
    if (verify_date_saved_in_local_storage !== actual_date_day){
        
        localStorage.removeItem("entry_saved")
        localStorage.removeItem("beggin_dinner_saved")
        localStorage.removeItem("ending_dinner_saved")
        localStorage.removeItem("exit_saved")
 
//Caso não, se você ainda está no mesmo dia, a função apenas acresentará os registros restantes sem sobscrever os já registrados.       
    } else {
        
        
        const entry_saved = localStorage.getItem("entry_saved")
        if (entry_saved){
            entry_clock_in_register.textContent = entry_saved
            entry_registered = true

        }
        
        const beggin_dinner_saved = localStorage.getItem("beggin_dinner_saved")
        if (beggin_dinner_saved){
            begin_dinner_clock_in_register.textContent = beggin_dinner_saved
            begin_dinner_registered = true
        }
        
        const ending_dinner_saved = localStorage.getItem("ending_dinner_saved")
        if (ending_dinner_saved){
            ending_dinner_clock_in_register.textContent = ending_dinner_saved
            ending_dinner_registered = true
        }
        
        const exit_saved = localStorage.getItem("exit_saved")
        if (exit_saved){
            exit_clock_in_register.textContent = exit_saved
            exit_registered = true
        }
    }

    localStorage.setItem("date_saved_in_local_storage", actual_date_day)
}

//Ao apertar o botão o ponto é registrado
clock_in_register.addEventListener("click", async function(){

    const actual_time_formated_hours = register_the_clock()
    const actual_period = discover_actual_clock_in_period()

//Registra o ponto com verificação de hora e tolerância, após a correta verificação, o sistema registra.
    if (actual_period === "periodo_entrada" && entry_registered === false){

//Mensagem de registro OBS:Ainda em manutenção.
        if (localStorage.getItem("entry_saved")){
            clock_in_message.textContent = "❌ Você já registrou a ENTRADA hoje!"
            return
        }

        entry_clock_in_register.replaceChildren()

        const time_element = document.createElement("output")
        time_element.textContent = actual_time_formated_hours
        entry_clock_in_register.append(time_element)
        clock_in_message.textContent = `✅ Entrada registrada ás ${actual_time_formated_hours}`

        await save_the_clock_in_data_base("entrada", actual_time_formated_hours)
        localStorage.setItem("entry_saved", actual_time_formated_hours)
        entry_registered = true
        registered_something = true
    }

    if (actual_period === "periodo_almoco" && begin_dinner_registered === false){

        begin_dinner_clock_in_register.replaceChildren()

        const time_2_element = document.createElement("output")
        time_2_element.textContent = actual_time_formated_hours
        begin_dinner_clock_in_register.append(time_2_element)

        await save_the_clock_in_data_base("inicio_almoco", actual_time_formated_hours)
        localStorage.setItem("beggin_dinner_saved", actual_time_formated_hours)
        begin_dinner_registered = true
    }

    if (actual_period === "periodo_volta" && ending_dinner_registered === false){

        ending_dinner_clock_in_register.replaceChildren()

        const time_3_element = document.createElement("output")
        time_3_element.textContent = actual_time_formated_hours
        ending_dinner_clock_in_register.append(time_3_element)

        await save_the_clock_in_data_base("fim_almoco", actual_time_formated_hours)
        localStorage.setItem("ending_dinner_saved", actual_time_formated_hours)
        ending_dinner_registered = true
    }

    if (actual_period === "periodo_saida" && exit_registered === false){

        exit_clock_in_register.replaceChildren()

        const time_4_element = document.createElement("output")
        time_4_element.textContent = actual_time_formated_hours
        exit_clock_in_register.append(time_4_element)

        await save_the_clock_in_data_base("saida", actual_time_formated_hours)
        localStorage.setItem("exit_saved", actual_time_formated_hours)
        exit_registered = true
    }

//Mensagem de registro OBS:Ainda em manutenção.
    if (!registered_something) {
        clock_in_message.textContent = "❌ Não é possível registrar agora!"
    }
})

//Função para registrar e coletar a hora atual, no formato brasileiro, com apenas horas e digitos, para ser exibido na tela.
function register_the_clock() {

    const actual_time = new Date()
    const time_formated = actual_time.toLocaleTimeString([],{
        hour :"2-digit",
        minute : "2-digit"
    })

    return time_formated
}

//Função para registrar e coletar a data atual, apenas para ser exibido na tela.
function register_the_date() {

    const actual_date = new Date()
    const date_formated = actual_date.toLocaleDateString()

    return date_formated
}

//Função para registrar e coletar o dia da semana atual, apenas para ser exibido na tela, Exemplo: sexta-feira.
function register_the_week_date() {
    const actual_week_date = new Date()
    const day_of_the_week_formated = actual_week_date.toLocaleDateString("pt-BR", {weekday: "long"})

    return day_of_the_week_formated
}


//Toda a função e métodos para comunicar a função de registro e verficação com o banco de dados Firebase,-
// ou seja, a função para salvar no banco de dados o registro de ponto do dia do funcionário, caso seja -
// um novo dia um novo registro é criado em formato de documento, pois é um banco de dados não -
// relacional, cada documento comporta o registro diário, possibilitando o RH de resgatar esses dados -
//facilmente.
async function save_the_clock_in_data_base(clock_in_register_type, time) {
    
//Verifica se o funcionário está logado, somente logado é permitido salvar no banco de dados os registros
//de ponto, nas regras do Firebase também tem a mesma verificação.
    const user = auth.currentUser

    if (!user){
        alert("Você precisa estar logado!")
        return
    }

//Variáveis para a criação dos documentos por dia, separando os registros em diários.
    const actual_date_formated_to_id = new Date().toISOString().split('T')[0]
    const document_id_user = actual_date_formated_to_id + "_" + user.uid
    const document_reference = doc(db, "Clock_in_registers_day", document_id_user)
    const verify_exist_document = await getDoc(document_reference)

//Verificação se já existe o documento daquele dia, caso haja ele é atualizado com os novos registros, -
//caso não um novo registro é criado com seu nome da data atual e o id único de cada usuário.
    try {

        if (verify_exist_document.exists()) {

            await updateDoc(document_reference, {

                [clock_in_register_type] : time
            })
        } else {

            await setDoc(document_reference, {

                employee_id: user.uid,
                employee_email: user.email,
                date: actual_date_formated_to_id,

                [clock_in_register_type] : time

            })
        }

    } catch(error){
        

    }

}
