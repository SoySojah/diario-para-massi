import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, onValue, push } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyA7XxtWYbv__HCBc1XCXMtQcWSWrntT5qk",
    authDomain: "diariocartas.firebaseapp.com",
    projectId: "diariocartas",
    storageBucket: "diariocartas.firebasestorage.app",
    messagingSenderId: "258104739963",
    appId: "1:258104739963:web:3cc678ff4bc2c93e23bade",
    measurementId: "G-59ZR7FQXMM",
    databaseURL: "https://diariocartas-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let diarioCartas = {}; 
let sorpresasGuardadas = {}; 
let diaActualSeleccionado = null; 
let sorpresaDeHoyMostrada = false; 

const envelope = document.querySelector('.envelope-wrapper');
const letterContent = document.getElementById('letter-content');
const ytFrame = document.getElementById('youtube-frame');
const spFrame = document.getElementById('spotify-frame');
const tkContainer = document.getElementById('tiktok-container');
const tkFrame = document.getElementById('tiktok-frame');
const photoContainer = document.getElementById('photo-container');
const dailyPhoto = document.getElementById('daily-photo');
const fadeTargets = document.querySelectorAll('.fade-target');

function getTikTokId(input) {
    if (!input) return null;
    const matchId = input.match(/data-video-id=["'](\d+)["']/);
    if (matchId) return matchId[1];
    const matchUrl = input.match(/video\/(\d+)/);
    if (matchUrl) return matchUrl[1];
    return null; 
}

function revisarModoOscuro() {
    const hora = new Date().getHours();
    if (hora >= 18 || hora < 6) document.body.classList.add('dark-mode');
    else document.body.classList.remove('dark-mode');
}
revisarModoOscuro();
setInterval(revisarModoOscuro, 60000);

// ==========================================
// EMOJIS CON BASE DE DATOS Y COMENTARIOS
// ==========================================
const emojiBar = document.getElementById('emoji-bar');
const floatEmojiContainer = document.getElementById('floating-emojis-container');
const commentInput = document.getElementById('comment-input');
const btnSendComment = document.getElementById('send-comment');
const commentsList = document.getElementById('comments-list');

emojiBar.addEventListener('click', (e) => {
    if (e.target.classList.contains('emoji-btn')) {
        const emoji = e.target.innerText;
        
        // ¡Magia! Guarda qué emoji se presionó en Firebase
        if (diaActualSeleccionado) {
            push(ref(db, `cartas/${diaActualSeleccionado}/reacciones`), { emoji: emoji, tiempo: Date.now() });
        }

        // Lanza la animación visual
        for (let i = 0; i < 6; i++) {
            setTimeout(() => {
                const el = document.createElement('div');
                el.className = 'floating-emoji';
                el.innerText = emoji;
                el.style.left = (15 + Math.random() * 70) + 'vw';
                el.style.animationDuration = (2 + Math.random() * 2) + 's';
                floatEmojiContainer.appendChild(el);
                setTimeout(() => el.remove(), 4000);
            }, i * 150);
        }
    }
});

btnSendComment.addEventListener('click', () => {
    const txt = commentInput.value.trim();
    if (txt && diaActualSeleccionado) {
        push(ref(db, `cartas/${diaActualSeleccionado}/comentarios`), { txt: txt });
        commentInput.value = '';
    }
});

function renderComentarios(comentariosObj) {
    commentsList.innerHTML = '';
    if (comentariosObj) {
        Object.values(comentariosObj).forEach(c => {
            if(c.txt) {
                const div = document.createElement('div');
                div.className = 'comment-item';
                div.innerText = c.txt;
                commentsList.appendChild(div);
            }
        });
        commentsList.scrollTop = commentsList.scrollHeight;
    }
}

// ==========================================
// LÓGICA DE CARTAS 
// ==========================================
let currentWordleWord = "";
const wordleBtn = document.getElementById('open-wordle-btn');

envelope.addEventListener('click', (e) => { 
    if (e.target.closest('.expand-btn')) return;

    if (!envelope.classList.contains('is-open')) {
        envelope.classList.remove('close-anim');
        envelope.classList.add('open-anim', 'is-open');
    } else {
        envelope.classList.remove('open-anim', 'is-open');
        envelope.classList.add('close-anim');
    }
});

function cargarDia(fechaStr, elementoDia) {
    const datos = diarioCartas[fechaStr];
    diaActualSeleccionado = fechaStr; 

    if (datos) {
        document.querySelectorAll('.days div').forEach(d => d.classList.remove('active'));
        if (elementoDia) elementoDia.classList.add('active');
        else {
            const dElem = document.querySelector(`.days div[data-fecha="${fechaStr}"]`);
            if(dElem) dElem.classList.add('active');
        }

        if (envelope.classList.contains('is-open')) {
            envelope.classList.remove('open-anim', 'is-open');
            envelope.classList.add('close-anim');
        }

        fadeTargets.forEach(el => { el.classList.remove('fade-in'); el.classList.add('fade-out'); });

        setTimeout(() => {
            letterContent.innerHTML = datos.texto;
            ytFrame.src = datos.youtube || "";
            spFrame.src = datos.spotify || "";
            
            renderComentarios(datos.comentarios);

            const tkId = getTikTokId(datos.tiktok);
            if(tkId) {
                tkContainer.style.display = 'block';
                tkFrame.src = `https://www.tiktok.com/embed/v2/${tkId}`; 
            } else {
                tkContainer.style.display = 'none';
                tkFrame.src = "";
            }

            if(datos.palabra && datos.palabra.length === 5) {
                currentWordleWord = datos.palabra.toUpperCase();
                wordleBtn.classList.remove('hidden');
                initWordle(); 
            } else {
                currentWordleWord = "";
                wordleBtn.classList.add('hidden');
            }

            if(datos.imagen) {
                photoContainer.style.display = 'block';
                dailyPhoto.src = datos.imagen;
            } else {
                photoContainer.style.display = 'none';
                dailyPhoto.src = "";
            }

            letterContent.scrollTop = 0;
            fadeTargets.forEach(el => { el.classList.remove('fade-out'); el.classList.add('fade-in'); });
            
            const mesDiaClikeado = fechaStr.substring(5); 
            if (sorpresasGuardadas[mesDiaClikeado]) {
                mostrarSorpresa(sorpresasGuardadas[mesDiaClikeado]);
            } else {
                document.getElementById('surprise-toast').classList.remove('show');
            }

        }, 600); 
    }
}

function generarCalendario() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); 
    
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const todayNum = new Date(year, month, date.getDate()).getTime();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById("month-year").innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysContainer = document.getElementById("calendar-days");
    daysContainer.innerHTML = ""; 

    for (let i = 0; i < firstDay; i++) { daysContainer.innerHTML += `<div></div>`; }

    let ultimaFechaPermitida = null;
    let debeCargarDiaInicial = !diaActualSeleccionado; 

    for (let i = 1; i <= daysInMonth; i++) {
        const fechaIteracion = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const fechaNum = new Date(year, month, i).getTime();
        
        let diaHTML = document.createElement('div');
        diaHTML.innerText = i;
        diaHTML.setAttribute('data-fecha', fechaIteracion);

        if (fechaNum <= todayNum) {
            if (diarioCartas[fechaIteracion]) {
                diaHTML.classList.add('has-letter');
                diaHTML.addEventListener('click', () => { cargarDia(fechaIteracion, diaHTML); });
                ultimaFechaPermitida = fechaIteracion;
                if (fechaIteracion === diaActualSeleccionado) diaHTML.classList.add('active');
            } else {
                diaHTML.classList.add('empty-day');
            }
        } else {
            diaHTML.classList.add('empty-day');
        }

        if (fechaIteracion === todayStr) {
            diaHTML.classList.add('today');
            diaHTML.innerHTML += `<span class="star-today">★</span>`;
            if (diarioCartas[todayStr] && debeCargarDiaInicial) { 
                cargarDia(todayStr, diaHTML); 
                debeCargarDiaInicial = false;
            }
        }
        daysContainer.appendChild(diaHTML);
    }

    if (debeCargarDiaInicial && ultimaFechaPermitida) {
        cargarDia(ultimaFechaPermitida, null);
    } else if (diaActualSeleccionado && diarioCartas[diaActualSeleccionado]) {
        renderComentarios(diarioCartas[diaActualSeleccionado].comentarios);
    }
}

onValue(ref(db, 'cartas'), (snapshot) => {
    const data = snapshot.val();
    if (data) { diarioCartas = data; generarCalendario(); } 
});

const expandBtn = document.getElementById('expand-btn');
const modal = document.getElementById('letter-modal');
const modalTextContent = document.getElementById('modal-text-content');
expandBtn.addEventListener('click', () => {
    modalTextContent.innerHTML = letterContent.innerHTML;
    modal.classList.add('show');
});
document.getElementById('close-modal').addEventListener('click', () => modal.classList.remove('show'));

// ==========================================
// WORDLE
// ==========================================
const wordleModal = document.getElementById('wordle-modal');
document.getElementById('close-wordle').addEventListener('click', () => wordleModal.classList.remove('show'));
wordleBtn.addEventListener('click', () => wordleModal.classList.add('show'));

let w_intentos = 0; let w_letras = []; const W_MAX_INTENTOS = 6;

function initWordle() {
    w_intentos = 0; w_letras = [];
    const grid = document.getElementById('wordle-grid'); grid.innerHTML = '';
    
    for (let i = 0; i < W_MAX_INTENTOS; i++) {
        const row = document.createElement('div'); row.className = 'wordle-row';
        for (let j = 0; j < 5; j++) {
            const box = document.createElement('div'); box.className = 'wordle-box'; box.id = `box-${i}-${j}`;
            row.appendChild(box);
        }
        grid.appendChild(row);
    }

    const keyboardLayout = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
    const kb = document.getElementById('wordle-keyboard'); kb.innerHTML = '';
    
    keyboardLayout.forEach((filaStr, index) => {
        const row = document.createElement('div'); row.className = 'keyboard-row';
        
        if(index === 2) {
            const btnEnter = document.createElement('button');
            btnEnter.className = 'key large'; btnEnter.innerHTML = '✓';
            btnEnter.onclick = checkWordle; row.appendChild(btnEnter);
        }

        filaStr.split('').forEach(letra => {
            const btn = document.createElement('button');
            btn.className = 'key'; btn.innerText = letra; btn.id = `key-${letra}`;
            btn.onclick = () => typeLetter(letra); row.appendChild(btn);
        });

        if(index === 2) {
            const btnDel = document.createElement('button');
            btnDel.className = 'key large'; btnDel.innerHTML = '⌫';
            btnDel.onclick = deleteLetter; row.appendChild(btnDel);
        }
        kb.appendChild(row);
    });
}

function typeLetter(letra) {
    if (w_letras.length < 5 && w_intentos < W_MAX_INTENTOS) {
        w_letras.push(letra);
        for (let i = 0; i < 5; i++) { document.getElementById(`box-${w_intentos}-${i}`).innerText = w_letras[i] || ""; }
    }
}
function deleteLetter() {
    if (w_letras.length > 0) {
        w_letras.pop();
        for (let i = 0; i < 5; i++) { document.getElementById(`box-${w_intentos}-${i}`).innerText = w_letras[i] || ""; }
    }
}
function checkWordle() {
    if (w_letras.length !== 5) return;
    const guess = w_letras.join(''); const correctArr = currentWordleWord.split(''); let remaining = [...correctArr];

    for (let i = 0; i < 5; i++) {
        const box = document.getElementById(`box-${w_intentos}-${i}`);
        const keyBtn = document.getElementById(`key-${w_letras[i]}`);
        
        setTimeout(() => {
            if (guess[i] === correctArr[i]) {
                box.classList.add('correct'); keyBtn.style.background = 'var(--w-correct)'; keyBtn.style.color = 'white'; remaining[i] = null;
            } else if (remaining.includes(guess[i])) {
                box.classList.add('present');
                if(keyBtn.style.background !== 'var(--w-correct)') { keyBtn.style.background = 'var(--w-present)'; keyBtn.style.color = 'white'; }
                remaining[remaining.indexOf(guess[i])] = null;
            } else {
                box.classList.add('absent');
                if(keyBtn.style.background !== 'var(--w-correct)' && keyBtn.style.background !== 'var(--w-present)') { keyBtn.style.background = 'var(--w-absent)'; keyBtn.style.color = 'white';}
            }
            if(i === 4 && guess === currentWordleWord) {
                setTimeout(() => alert("¡Adivinaste la palabra secreta! Eres increíble ❤️"), 600);
            }
        }, i * 300); 
    }
    w_intentos++; w_letras = [];
}

// ==========================================
// 🤫 7. SORPRESAS MAGICAS (FLORES Y ESTRELLAS)
// ==========================================

// El jardín completo en HTML sin los corazones
const htmlJardinFlores = `
  <div class="flowers">
    <div class="flower flower--1"><div class="flower__leafs flower__leafs--1"><div class="flower__leaf flower__leaf--1"></div><div class="flower__leaf flower__leaf--2"></div><div class="flower__leaf flower__leaf--3"></div><div class="flower__leaf flower__leaf--4"></div><div class="flower__white-circle"></div><div class="flower__light flower__light--1"></div><div class="flower__light flower__light--2"></div><div class="flower__light flower__light--3"></div><div class="flower__light flower__light--4"></div><div class="flower__light flower__light--5"></div><div class="flower__light flower__light--6"></div><div class="flower__light flower__light--7"></div><div class="flower__light flower__light--8"></div></div><div class="flower__line"><div class="flower__line__leaf flower__line__leaf--1"></div><div class="flower__line__leaf flower__line__leaf--2"></div><div class="flower__line__leaf flower__line__leaf--3"></div><div class="flower__line__leaf flower__line__leaf--4"></div><div class="flower__line__leaf flower__line__leaf--5"></div><div class="flower__line__leaf flower__line__leaf--6"></div></div></div>
    <div class="flower flower--2"><div class="flower__leafs flower__leafs--2"><div class="flower__leaf flower__leaf--1"></div><div class="flower__leaf flower__leaf--2"></div><div class="flower__leaf flower__leaf--3"></div><div class="flower__leaf flower__leaf--4"></div><div class="flower__white-circle"></div><div class="flower__light flower__light--1"></div><div class="flower__light flower__light--2"></div><div class="flower__light flower__light--3"></div><div class="flower__light flower__light--4"></div><div class="flower__light flower__light--5"></div><div class="flower__light flower__light--6"></div><div class="flower__light flower__light--7"></div><div class="flower__light flower__light--8"></div></div><div class="flower__line"><div class="flower__line__leaf flower__line__leaf--1"></div><div class="flower__line__leaf flower__line__leaf--2"></div><div class="flower__line__leaf flower__line__leaf--3"></div><div class="flower__line__leaf flower__line__leaf--4"></div></div></div>
    <div class="flower flower--3"><div class="flower__leafs flower__leafs--3"><div class="flower__leaf flower__leaf--1"></div><div class="flower__leaf flower__leaf--2"></div><div class="flower__leaf flower__leaf--3"></div><div class="flower__leaf flower__leaf--4"></div><div class="flower__white-circle"></div><div class="flower__light flower__light--1"></div><div class="flower__light flower__light--2"></div><div class="flower__light flower__light--3"></div><div class="flower__light flower__light--4"></div><div class="flower__light flower__light--5"></div><div class="flower__light flower__light--6"></div><div class="flower__light flower__light--7"></div><div class="flower__light flower__light--8"></div></div><div class="flower__line"><div class="flower__line__leaf flower__line__leaf--1"></div><div class="flower__line__leaf flower__line__leaf--2"></div><div class="flower__line__leaf flower__line__leaf--3"></div><div class="flower__line__leaf flower__line__leaf--4"></div></div></div>
    <div class="grow-ans" style="--d:1.2s"><div class="flower__g-long"><div class="flower__g-long__top"></div><div class="flower__g-long__bottom"></div></div></div>
    <div class="growing-grass"><div class="flower__grass flower__grass--1"><div class="flower__grass--top"></div><div class="flower__grass--bottom"></div><div class="flower__grass__leaf flower__grass__leaf--1"></div><div class="flower__grass__leaf flower__grass__leaf--2"></div><div class="flower__grass__leaf flower__grass__leaf--3"></div><div class="flower__grass__leaf flower__grass__leaf--4"></div><div class="flower__grass__leaf flower__grass__leaf--5"></div><div class="flower__grass__leaf flower__grass__leaf--6"></div><div class="flower__grass__leaf flower__grass__leaf--7"></div><div class="flower__grass__leaf flower__grass__leaf--8"></div><div class="flower__grass__overlay"></div></div></div>
    <div class="growing-grass"><div class="flower__grass flower__grass--2"><div class="flower__grass--top"></div><div class="flower__grass--bottom"></div><div class="flower__grass__leaf flower__grass__leaf--1"></div><div class="flower__grass__leaf flower__grass__leaf--2"></div><div class="flower__grass__leaf flower__grass__leaf--3"></div><div class="flower__grass__leaf flower__grass__leaf--4"></div><div class="flower__grass__leaf flower__grass__leaf--5"></div><div class="flower__grass__leaf flower__grass__leaf--6"></div><div class="flower__grass__leaf flower__grass__leaf--7"></div><div class="flower__grass__leaf flower__grass__leaf--8"></div><div class="flower__grass__overlay"></div></div></div>
    <div class="grow-ans" style="--d:2.4s"><div class="flower__g-right flower__g-right--1"><div class="leaf"></div></div></div>
    <div class="grow-ans" style="--d:2.8s"><div class="flower__g-right flower__g-right--2"><div class="leaf"></div></div></div>
    <div class="grow-ans" style="--d:2.8s"><div class="flower__g-front"><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--1"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--2"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--3"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--4"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--5"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__leaf-wrapper flower__g-front__leaf-wrapper--6"><div class="flower__g-front__leaf"></div></div><div class="flower__g-front__line"></div></div></div>
    <div class="grow-ans" style="--d:3.2s"><div class="flower__g-fr"><div class="leaf"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--1"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--2"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--3"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--4"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--5"></div><div class="flower__g-fr__leaf flower__g-fr__leaf--6"></div></div></div>
  </div>
`;

const surpriseToast = document.getElementById('surprise-toast');
const flowerShower = document.getElementById('flower-shower');

function iniciarJardinFlores() {
    flowerShower.innerHTML = htmlJardinFlores;
    // Ocultar jardín después de 15 segundos
    setTimeout(()=> { flowerShower.innerHTML = ''; }, 15000);
}

function iniciarLluviaEstrellas() {
    flowerShower.innerHTML = '';
    const items = ['✨', '⭐', '🌟'];
    for (let i=0; i<30; i++) {
        const el = document.createElement('div');
        el.innerText = items[Math.floor(Math.random() * items.length)];
        el.style.position = 'absolute';
        el.style.fontSize = (Math.random() * 20 + 15) + 'px';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.bottom = '-50px';
        el.style.animation = `floatUpEmoji ${Math.random() * 4 + 3}s linear ${Math.random() * 2}s forwards`;
        flowerShower.appendChild(el);
        setTimeout(()=>el.remove(), 7000);
    }
}

function mostrarSorpresa(sorpresa) {
    surpriseToast.classList.remove('show'); 
    setTimeout(() => {
        surpriseToast.innerHTML = `<button id="close-toast" class="close-toast">✖</button>
        <div class="toast-header"><h3 class="calistoga-regular">${sorpresa.titulo}</h3></div>
        <p>${sorpresa.mensaje}</p>`;
        
        document.getElementById('close-toast').onclick = () => {
            surpriseToast.classList.remove('show');
            flowerShower.innerHTML = ''; // Detiene la lluvia al cerrar
        };
        
        surpriseToast.classList.add('show');
        
        // Dependiendo de si es el día de las flores o no
        if(sorpresa.esDiaDeFlores) {
            iniciarJardinFlores();
        } else {
            iniciarLluviaEstrellas();
        }
    }, 100); 
}

onValue(ref(db, 'sorpresas'), (snapshot) => {
    sorpresasGuardadas = snapshot.val() || {};
    if (!sorpresaDeHoyMostrada && sorpresasGuardadas) {
        const d = new Date();
        const hoyStr = String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        if (sorpresasGuardadas[hoyStr]) {
            setTimeout(() => { mostrarSorpresa(sorpresasGuardadas[hoyStr]); }, 1500); 
        }
        sorpresaDeHoyMostrada = true; 
    }
});
