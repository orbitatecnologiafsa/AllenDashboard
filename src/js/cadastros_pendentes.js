import { } from './firebase_config.js';


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

async function exibirElementos(lista, pagina) {
    const startIndex = (pagina - 1) * elementosPorPagina;
    const endIndex = startIndex + elementosPorPagina;
    const elementosDaPagina = lista.slice(startIndex, endIndex);
    const moradorLista = document.getElementById('moradorLista');
    moradorLista.innerHTML = ''; 

    for (const morador of elementosDaPagina) {
        const moradorItem = document.createElement('li');
        moradorItem.setAttribute('id', 'moradorItem');
        moradorItem.setAttribute('class', 'item-list');

        const moradorNome = document.createElement('p');
        moradorNome.setAttribute('class', 'item');
        moradorNome.textContent = morador.nome;

        const moradorCasa = document.createElement('p');
        moradorCasa.setAttribute('class', 'item');
        moradorCasa.textContent = morador.casa;
           
        const moradorCPF = document.createElement('p');
        moradorCPF.setAttribute('class', 'item');
        moradorCPF.textContent = morador.cpf;

        const moradorWhasapp = document.createElement('p');
        moradorWhasapp.setAttribute('class', 'item');
        moradorWhasapp.textContent = morador.whatsapp;

        const moradorFotoDiv = document.createElement('div');
        moradorFotoDiv.setAttribute('class', 'img-div-morador');

        const moradorFoto = document.createElement('img');
        moradorFoto.setAttribute('class', 'item foto_pendente');
        moradorFoto.src = ''; // Inicialmente vazio

        // Aguarda a URL da foto antes de definir o src
        try {
            const url = await baixarFoto(morador.email);
            moradorFoto.src = url;
            moradorFotoDiv.appendChild(moradorFoto);
        } catch (error) {
            console.error('Erro ao carregar a foto:', error);
            moradorFoto.alt = 'Imagem não disponível'; // Exibir um texto alternativo se a imagem não puder ser carregada
        }

        const imgDiv = document.createElement('div');
        imgDiv.setAttribute('class', 'img-div');

        const deleteImg = document.createElement('img');
        deleteImg.setAttribute('class', 'icon');
        deleteImg.setAttribute('id', 'btn_deletar');
        deleteImg.setAttribute('src', '../img/remover.svg');
        deleteImg.setAttribute('onclick', 'deleteClient(' + morador.ids + ')');
        deleteImg.setAttribute('style', 'cursor: pointer;');
        deleteImg.addEventListener('click', function() {
            deleteClient(morador.cpf);
        });

        const aprovarImg = document.createElement('img');
        aprovarImg.setAttribute('class', 'icon');
        aprovarImg.setAttribute('id', 'btn_editar');
        aprovarImg.setAttribute('src', '../img/check.png');
        aprovarImg.setAttribute('onclick', 'aprovar(' + morador.ids + ')');
        aprovarImg.setAttribute('style', 'cursor: pointer;');
        aprovarImg.addEventListener('click', function() {
            aprovar(morador);
        });

        imgDiv.appendChild(aprovarImg);
        imgDiv.appendChild(deleteImg);

        moradorItem.appendChild(moradorNome);
        moradorItem.appendChild(moradorCasa);
        moradorItem.appendChild(moradorCPF);
        moradorItem.appendChild(moradorWhasapp);
        moradorItem.appendChild(moradorFotoDiv);
        moradorItem.appendChild(imgDiv);
        moradorLista.appendChild(moradorItem);
    }
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

async function cod_sindico() {
    const userEmail = await getEmail();
    const userDb = await firebase.firestore().collection('condominio');
    const sindico = await userDb.where('email', '==', userEmail).get();
    const sindicoData = sindico.docs[0].data();
    const codigoSindico = sindicoData.cod_Condominio;

    return codigoSindico;
}

let cod_cond = await cod_sindico();
firebase.firestore().collection("moradores").onSnapshot(async (snapshot) => {
    const novosMoradores = [];
    snapshot.docChanges().forEach((change) => {
        if (change.type === "added" && change.doc.data().status === 'pendente' && change.doc.data().tipo === 'Com chat' && change.doc.data().condominio === cod_cond) {
            console.log("Novo documento adicionado: ", change.doc.data());
            const morador = {
                nome: change.doc.data().nome,
                casa: change.doc.data().casa,
                cpf: formatarCPF(change.doc.data().cpf),
                whatsapp: formatarWhasapp(change.doc.data().whatsapp),
                tipo: change.doc.data().tipo,
                email: change.doc.data().email,
                ids: change.doc.id
            };
            novosMoradores.push(morador);
        }
        if (change.type === "modified") {
            console.log("Documento modificado: ", change.doc.data());
        }
        if (change.type === "removed") {
            console.log("Documento removido: ", change.doc.data());
        }
    });
    
    // Adiciona os novos moradores à lista e atualiza a interface
    listaCompleta.push(...novosMoradores);
    await exibirElementos(listaCompleta, paginaAtual);
    exibirPaginacao(listaCompleta);
});

async function baixarFoto(email) {
    try {
        // Obtém o serviço de storage (compat)
        const storage = await firebase.storage();
    
        // Define o caminho da foto
        const path = `${cod_cond}/${email}`;
        console.log(path);
    
        // Cria uma referência ao arquivo no storage
        const photoRef = storage.ref(path);
    
        // Obtém a URL de download da foto
        const url = await photoRef.getDownloadURL();
    
        return url;
      } catch (error) {
        console.error("Erro ao baixar a foto, sem url:", error);
      }
}

async function aprovar(morador) {

    const popup = document.querySelector('.popup');
    popup.style.display = 'block';
}
window.addEventListener("click", (event) => {
    const popup = document.querySelector(".popup");
    if (event.target === popup) {
        popup.style.display = "none";
    }
});
document.getElementById("close").addEventListener("click", () => {
    const popups = document.getElementsByClassName("popup");
    for (let i = 0; i < popups.length; i++) {
        popups[i].style.display = "none";
    }
});
