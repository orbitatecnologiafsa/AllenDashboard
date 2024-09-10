import { mostrarNotificacao } from './alerts.js';
import { } from './firebase_config.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                resolve(userEmail);
            } else {
                console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

async function getCondominio() {
    try {
        const userEmail = await getEmail();
        const userDb = firebase.firestore().collection('condominio');
        const sindico = await userDb.where('email', '==', userEmail).get();
        const sindicoData = sindico.docs[0].data();
        const cod_condominio = sindicoData.cod_Condominio;
        return cod_condominio;
    } catch (error) {
        return null;
    }
}

// data inicio e data fim


let [startDate, endDate] = [,];

const datePicker = flatpickr("#date-picker", {
    mode: "range",
    dateFormat: "d/m/Y",
    onChange: function(selectedDates) {
        [startDate, endDate] = selectedDates;
        if (startDate && endDate) {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
            let startTimestamp = startDate.getTime();
            let endTimestamp = endDate.getTime();
            
            console.log("Start Timestamp:", startTimestamp);
            console.log("End Timestamp:", endTimestamp);

            filterPoints(startTimestamp, endTimestamp);
        } else {
            console.error("Start date or end date is not selected.");
        }
    }
});

// Cards
const cod_cond = await getCondominio();
firebase.firestore().collection("eventos-manutencao")
    .where('tipo', '==', 'evento')  
    .orderBy('data_inicio', 'desc') 
    .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added" && change.doc.data().status == 'Ativo' && change.doc.data().cod_condominio == cod_cond) {
                createCard(change.doc.data());
            }
            if (change.type === "modified") {
                console.log("Documento modificado: ", change.doc.data());
                createCard(null); 
            }
            if (change.type === "removed") {
                console.log("Documento removido: ", change.doc.data());
                createCard(null); 
            }
        });
    });
async function createCard(doc) {
    
    const ticket_ul = document.querySelector('#tickets-ativos-ul');
    const ticket = document.createElement('li');
    ticket.setAttribute('class', 'ticket');

    ticket.innerHTML = `
                <div class="ticket-header">
                    <p class="ticket-id">Local: <span>${doc.local}</span></p>
                    <p class="ticket-status">Status: <span>${doc.status}</span></p>
                </div>
                <div class="ticket-body">
                    <p>Nome do morador: <span class="ticket-description">${doc.morador}</span></p>
                    <p>Tipo: <span class="ticket-description">Evento</span></p>
                </div>
                <div class="ticket-footer">
                    <span class="ticket-creation-date" style="font-weight:bold">Inicio da reserva: <br>${convertTimestampToDate(doc.data_inicio)}</span>
                    <span class="ticket-creation-date" style="font-weight:bold">Fim da reserva:  <br>${convertTimestampToDate(doc.data_fim)}</span>
                </div>   
    `;
    ticket_ul.appendChild(ticket);
 
}

function convertTimestampToDate(timestamp) {
    
    console.log("NOVO: " + timestamp)
    const date = new Date(timestamp.seconds * 1000);

    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); 
    const year = date.getFullYear();

   
    return `${day}/${month}/${year}`;
}

async function filterPoints(startTimestamp, endTimestamp) {
    const ticket_ul = document.querySelector('#tickets-ativos-ul');
    ticket_ul.innerHTML = '';

    const eventosDb = firebase.firestore().collection('eventos-manutencao');

    const eventos = await eventosDb
        .where('data_inicio', '>=', new firebase.firestore.Timestamp(startTimestamp / 1000, 0))
        .where('data_inicio', '<=', new firebase.firestore.Timestamp(endTimestamp / 1000, 0))
        .where('status','==','Ativo')
        .where('cod_condominio','==',cod_cond)
        .get();

    if (!eventos.empty) {
        const docs = eventos.docs;

        docs.forEach(doc => {
            createCard(doc.data());
        });
    } else {
        mostrarNotificacao('error', 'Não tem reservas nesse período', 'Reservas');
        loadAllCards();
    }
}
const clearDatesButton = document.getElementById("clear-dates");
clearDatesButton.addEventListener('click',clearDates);

function clearDates() {

    if (datePicker) {
        datePicker.clear();
    }

    const ticket_ul = document.querySelector('#tickets-ativos-ul');
    if (ticket_ul) {
        ticket_ul.innerHTML = ''; 
    }

    loadAllCards(); 
}

async function loadAllCards() {
    const eventosDb = firebase.firestore().collection('eventos-manutencao');

    const eventos = await eventosDb
        .where('status', '==', 'Ativo')
        .where('cod_condominio', '==', cod_cond)
        .get();

    if (!eventos.empty) {
        const docs = eventos.docs;

        docs.forEach(doc => {
            createCard(doc.data());
        });
    } else {
        mostrarNotificacao('error', 'Não tem reservas nesse período', 'Reservas');
    }
}