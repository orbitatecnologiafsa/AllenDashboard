import { } from './firebase_config.js';

//Consumir firebase

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
//Preencher dados

const listaCompleta = []
const elementosPorPagina = 10;
let paginaAtual = 1;


async function preencherDadosExistentes() {
    try {
        
        const delivery = firebase.firestore().collection('delivery');

        const condominio = await getCondominio();

        const deliveryData = delivery.where('cod_cond', '==', condominio);

        const informacoes = await deliveryData.get();

        listaCompleta.length = 0;

        informacoes.forEach(doc => {
            const deliveryData = doc.data();
            console.log(deliveryData);
            listaCompleta.push(deliveryData);
        });
        exibirElementos(listaCompleta, paginaAtual);
        exibirPaginacao(listaCompleta);
        console.log(listaCompleta);
    } catch (error) {
        console.error('Erro ao preencher dados existentes:', error);
    }
}

function exibirElementos(lista, pagina) {
  
    const startIndex = (pagina - 1) * elementosPorPagina;
    const endIndex = startIndex + elementosPorPagina;
  
    //console.log("Lista:", lista);
    console.log("startIndex:", startIndex);
    console.log("endIndex:", endIndex);
    const elementosDaPagina = lista.slice(startIndex, endIndex);
  
    console.log("elementos da pagina: ", elementosDaPagina);
  
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 
  
    elementosDaPagina.forEach(morador => {
  
        if(morador.status == 'ativo'){
            const moradorItem = document.createElement('li');
            moradorItem.setAttribute('id','moradorItem');
            moradorItem.setAttribute('class','item-list');

            const moradorNome = document.createElement('p');
            moradorNome.setAttribute('class','item');
            moradorNome.textContent = morador.nome;

            const moradorCasa = document.createElement('p');
            moradorCasa.setAttribute('class','item');
            moradorCasa.textContent = morador.casa;
            
            const moradorEstabelecimento = document.createElement('p');
            moradorEstabelecimento.setAttribute('class','item');
            moradorEstabelecimento.textContent = morador.estabelecimento;

            const moradorCodigo = document.createElement('p');
            moradorCodigo.setAttribute('class','item');
            moradorCodigo.textContent = morador.cod_delivery;
    
            const img_div = document.createElement('div');
            img_div.setAttribute('class','img_div');

            const moradorChegou = document.createElement('img');
            moradorChegou.setAttribute('class','icon');
            moradorChegou.setAttribute('id','moradorChegou' + morador.cod_delivery);
            moradorChegou.style.cursor = 'pointer';
            moradorChegou.src = '../img/accept.png';

            moradorChegou.addEventListener('click',() => {
                mudarStatus(morador.cod_delivery);
            });

            img_div.appendChild(moradorChegou);

            moradorItem.appendChild(moradorNome);
            moradorItem.appendChild(moradorCasa);
            moradorItem.appendChild(moradorEstabelecimento);
            moradorItem.appendChild(moradorCodigo);
            moradorItem.appendChild(img_div);
            moradorLista.appendChild(moradorItem);
        }          
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
   
    console.log("Pagina:", pagina);
    paginaAtual = pagina;
    exibirElementos(listaCompleta, pagina);
    atualizarPaginacao();
}

function atualizarPaginacao() {
  const botoesPaginacao = document.querySelectorAll('#pagination button');
  botoesPaginacao.forEach((botao, indice) => {
      if (indice + 1 === paginaAtual) {
          botao.classList.add('ativo');
      } else {
          botao.classList.remove('ativo');
      }
  });
}

async function mudarStatus(cod_pedido){

    console.log(cod_pedido);
    if(confirm('O pedido chegou? ')) {
        const imagem_gif = document.getElementById('moradorChegou' + cod_pedido);
        imagem_gif.src = '../img/chegou.gif'
    
        const delivery = firebase.firestore().collection('delivery');
    
        const deliveryData = delivery.where('cod_delivery', '==', cod_pedido);
    
        const informacoes = await deliveryData.get();

        console.log(informacoes);
    
        informacoes.forEach(doc => {
            console.log(doc.id);
            delivery.doc(doc.id).update({ status: 'entregue' });
        });

        setTimeout(() => {
            preencherDadosExistentes();
        }, 3000);
    }
    
}

preencherDadosExistentes();
setInterval(() => {
    preencherDadosExistentes();
}, 20000);
