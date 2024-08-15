import { } from './firebase_config.js';
import { } from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';

function getEmail() {
    return new Promise((resolve, reject) => {
        firebase.auth().onAuthStateChanged(function(user) {
            if (user) {
                const userEmail = user.email;
                //console.log("Email do usuário autenticado:", userEmail);
                resolve(userEmail);
            } else {
                //console.log("Nenhum usuário autenticado.");
                reject("Nenhum usuário autenticado.");
            }
        });
    });
}

const listaCompleta = []
const elementosPorPagina = 5;
let paginaAtual = 1;

function formatarWhasapp(whatsapp) {
    console.log(whatsapp);
    return whatsapp.replace(/(\d{2})(\d{2})(\d{4})(\d{4})/, '+$1 ($2) $3-$4');

}
function formatarCPF(cpf) {
    console.log(cpf);
    let moradorCpf = cpf.replace(/\D/g, ''); 
    return moradorCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

async function mostrarMorador() {

    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const codigoSindico = sindicoData.cod_Condominio;
    const moradorRef = await firebase.firestore().collection('moradores');
    const moradorCond = await moradorRef.where('condominio', '==', codigoSindico).get();

    try {
        moradorCond.forEach(doc => {

        if(doc.data().tipo == 'Com chat' && doc.data().status == 'pendente') {
            const morador = {
                nome: doc.data().nome,
                cpf: formatarCPF(doc.data().cpf),
                casa: doc.data().casa,
                tipo: doc.data().tipo,
                whatsapp: formatarWhasapp(doc.data().whatsapp),
                condominio: doc.data().condominio,
                status: doc.data().status
            };
            listaCompleta.push(morador); 
        } 
        exibirElementos(listaCompleta, paginaAtual);
        exibirPaginacao(listaCompleta);
    });
    } catch(error) {
        console.log("A lista está vazia, erro: " + error);
    }
}

function exibirElementos(lista, pagina) {
  
    const startIndex = (pagina - 1) * elementosPorPagina;
    const endIndex = startIndex + elementosPorPagina;
  
    //console.log("Lista:", lista);
    //.log("startIndex:", startIndex);
    //console.log("endIndex:", endIndex);
    const elementosDaPagina = lista.slice(startIndex, endIndex);
  
    //console.log("elementos da pagina: ", elementosDaPagina);
  
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 
  
    elementosDaPagina.forEach(morador => {
  
      //console.log(morador);

        
        const moradorItem = document.createElement('li');
        moradorItem.setAttribute('id','moradorItem');
        moradorItem.setAttribute('class','item-list');


        const moradorNome = document.createElement('p');
        moradorNome.setAttribute('class','item');
        moradorNome.textContent = morador.nome;

        const moradorCasa = document.createElement('p');
        moradorCasa.setAttribute('class','item');
        moradorCasa.textContent = morador.casa;
           
        const moradorCPF = document.createElement('p');
        moradorCPF.setAttribute('class', 'item');
        moradorCPF.textContent = morador.cpf;
  
        const moradorWhasapp = document.createElement('p');
        moradorWhasapp.setAttribute('class','item');
        moradorWhasapp.textContent = morador.whatsapp;
  
        const moradorTipo = document.createElement('p');
        moradorTipo.setAttribute('class','item');
        moradorTipo.textContent = morador.tipo;
  
        const imgDiv = document.createElement('div');
        imgDiv.setAttribute('class','img-div');
  
        const deleteImg = document.createElement('img');
        deleteImg.setAttribute('class','icon');
        deleteImg.setAttribute('id','btn_deletar');
        deleteImg.setAttribute('src', '../img/remover.svg');
        deleteImg.setAttribute('onclick', 'deleteClient(' + morador.ids + ')');
        deleteImg.setAttribute('style', 'cursor: pointer;');
        deleteImg.addEventListener('click', function() {
            deleteClient(morador.cpf);
        })
  
      
        const aprovarImg = document.createElement('img');
        aprovarImg.setAttribute('class','icon');
        aprovarImg.setAttribute('id','btn_editar');
        aprovarImg.setAttribute('src', '../img/check.png');
        aprovarImg.setAttribute('onclick', 'aprovar(' + morador.ids + ')');
        aprovarImg.setAttribute('style', 'cursor: pointer;');
        aprovarImg.addEventListener('click', function() {
            aprovar(morador);
        })


        imgDiv.appendChild(aprovarImg);
        imgDiv.appendChild(deleteImg);


        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorCPF);
        moradorItem.appendChild(moradorWhasapp);
        moradorItem.appendChild(moradorTipo);
        moradorItem.appendChild(imgDiv);
        moradorLista.appendChild(moradorItem);
    });
  }

function exibirPaginacao(lista) {
    const numeroDePaginas = Math.ceil(lista.length / elementosPorPagina);
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = ''; 

    for (let i = 1; i <= numeroDePaginas; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        if (i === 1) { 
            button.setAttribute('class', 'botao-paginacao ativo');
        }
        button.classList.add('botao-paginacao');
        button.addEventListener('click', () => irParaPagina(i));
        paginationContainer.appendChild(button);
    }
}

function irParaPagina(pagina) {
   
    //console.log("Pagina:", pagina);
    paginaAtual = pagina;
    exibirElementos(listaCompleta, pagina);
    atualizarPaginacao();
}

async function aprovar(morador) {

    if(confirm('Tem certeza que deseja aprovar o cadastro?')) {
        const morador = await firebase.firestore().collection('moradores').where('cpf', '==', morador.cpf).get();
        const id = morador.docs[0].id;
        await firebase.firestore().collection('moradores').doc(id).update({
            status: 'ativo'
        });
        cadastrarNoLeitorSemFoto();
        mostrarMorador();
    }
}

//leitor 
mostrarMorador();