import { mostrarNotificacao,confirmNotificacao } from './alerts.js';
function showPassword(){

    const img_eye = document.getElementById('olhinhos-azuis');
    const password = document.getElementById('password_login');

    if(password.type === 'password'){
        password.type = 'text';
        img_eye.src = './src/img/eye.png';
    }
    else{
        password.type = 'password';
        img_eye.src = './src/img/closed_eye.png';
    }
}

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault(); 
    login();
});

function login(){
    
    const email = document.getElementById('email_login').value;
    const password = document.getElementById('password_login').value;

    firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => { 
        mostrarNotificacao('success','Login efetuado com sucesso!','Login');
        window.location.href = "./src/pages/main_screen.html";
    })
    .catch((error) => {
        console.error('Erro ao autenticar usuário:', error);
        console.error('Código de erro:', error.code);
        mostrarNotificacao('error','Erro ao autenticar usuário: ' + error.message,'Login');
    });
}




