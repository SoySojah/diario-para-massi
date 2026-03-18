// ==========================================
// ☁️ 1. CONEXIÓN A FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-database.js";

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

// ==========================================
// ⚙️ 2. ELEMENTOS DEL DOM
// ==========================================
const envelope = document.querySelector('.envelope-wrapper');
const letterContent = document.getElementById('letter-content');
const ytFrame = document.getElementById('youtube-frame');
const spFrame = document.getElementById('spotify-frame');

const expandBtn = document.getElementById('expand-btn');
const modal = document.getElementById('letter-modal');
const closeModal = document.getElementById('close-modal');
const modalTextContent = document.getElementById('modal-text-content');

// ==========================================
// 💌 3. LÓGICA DE LA CARTA MAGICA
// ==========================================
envelope.addEventListener('click', () => { 
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
    if (datos) {
        if (envelope.classList.contains('is-open')) {
            envelope.classList.remove('open-anim', 'is-open');
            envelope.classList.add('close-anim');
        }
        
        document.querySelectorAll('.days div').forEach(d => d.classList.remove('active'));
        if (elementoDia) elementoDia.classList.add('active');

        setTimeout(() => {
            letterContent.className = 'text'; 
            const cantidadLetras = datos.texto.length;
            if (cantidadLetras < 200) { letterContent.classList.add('size-normal'); } 
            else if (cantidadLetras < 400) { letterContent.classList.add('size-medium'); } 
            else { letterContent.classList.add('size-small'); }

            letterContent.innerHTML = datos.texto;
            ytFrame.src = datos.youtube || "";
            spFrame.src = datos.spotify || "";
            letterContent.scrollTop = 0;
        }, 1000);
    }
}

function generarCalendario() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth(); 
    const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    document.getElementById("month-year").innerText = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysContainer = document.getElementById("calendar-days");
    daysContainer.innerHTML = ""; 

    for (let i = 0; i < firstDay; i++) { daysContainer.innerHTML += `<div></div>`; }

    for (let i = 1; i <= daysInMonth; i++) {
        const fechaActual = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        let diaHTML = document.createElement('div');
        diaHTML.innerText = i;

        if (diarioCartas[fechaActual]) {
            diaHTML.classList.add('has-letter');
            diaHTML.addEventListener('click', () => { cargarDia(fechaActual, diaHTML); });
        } else {
            diaHTML.classList.add('empty-day');
        }

        if (fechaActual === todayStr) {
            diaHTML.classList.add('today');
            diaHTML.innerHTML += `<span class="star-today">★</span>`;
            if (diarioCartas[todayStr]) { cargarDia(todayStr, diaHTML); }
        }
        daysContainer.appendChild(diaHTML);
    }

    if (!diarioCartas[todayStr]) {
        const fechasConCarta = Object.keys(diarioCartas).sort();
        if (fechasConCarta.length > 0) {
            const ultimaFecha = fechasConCarta[fechasConCarta.length - 1];
            cargarDia(ultimaFecha, null);
        }
    }
}

expandBtn.addEventListener('click', (e) => {
    e.stopPropagation(); 
    modalTextContent.innerHTML = letterContent.innerHTML;
    modalTextContent.className = 'text size-normal'; 
    modal.classList.add('show');
});

closeModal.addEventListener('click', () => { modal.classList.remove('show'); });
modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.remove('show'); } });

const dbRef = ref(db, 'cartas');
onValue(dbRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        diarioCartas = data; 
        generarCalendario(); 
    } else {
        diarioCartas = {};
        generarCalendario(); 
    }
});

// ==========================================
// 🤫 4. SORPRESAS Y EFECTOS VISUALES
// ==========================================
const svgFlorAmarilla = `
<svg viewBox="0 0 100 100" class="vector-flower header-flower" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="12" fill="#f5cc3f"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(0 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(45 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(90 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(135 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(180 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(225 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(270 50 50)"/>
  <path d="M50 0 C60 20, 80 20, 100 0 C80 -20, 60 -20, 50 0 Z" fill="#ffe066" transform="rotate(315 50 50)"/>
</svg>
`;

const surpriseToast = document.getElementById('surprise-toast');
const flowerShower = document.getElementById('flower-shower');

function iniciarLluviaFlores() {
    for (let i = 0; i < 30; i++) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = svgFlorAmarilla.trim();
        const svgElement = tempDiv.firstChild;
        svgElement.style.left = Math.random() * 100 + 'vw';
        const size = Math.random() * 25 + 20 + 'px';
        svgElement.style.width = size;
        svgElement.style.height = size;
        const duration = Math.random() * 4 + 4 + 's';
        const delay = Math.random() * 3 + 's';
        svgElement.style.animation = `floatFlower ${duration} linear ${delay} forwards`;
        flowerShower.appendChild(svgElement);
        setTimeout(() => { svgElement.remove(); }, (parseFloat(duration) + parseFloat(delay)) * 1000);
    }
}

const dbSorpresasRef = ref(db, 'sorpresas');
onValue(dbSorpresasRef, (snapshot) => {
    const sorpresasEnLaNube = snapshot.val();
    
    if (sorpresasEnLaNube) {
        const hoyFecha = new Date();
        const mesDiaHoy = String(hoyFecha.getMonth() + 1).padStart(2, '0') + '-' + String(hoyFecha.getDate()).padStart(2, '0');
        const sorpresaDeHoy = sorpresasEnLaNube[mesDiaHoy];

        if (sorpresaDeHoy) {
            surpriseToast.innerHTML = '<button id="close-toast" class="close-toast" title="Cerrar">✖</button>';
            const toastHeader = document.createElement('div');
            toastHeader.className = 'toast-header';
            
            if (sorpresaDeHoy.esDiaDeFlores) {
                toastHeader.innerHTML = svgFlorAmarilla + `<h3>${sorpresaDeHoy.titulo}</h3>` + svgFlorAmarilla;
            } else {
                toastHeader.innerHTML = `<h3>${sorpresaDeHoy.titulo}</h3>`;
            }
            
            surpriseToast.appendChild(toastHeader);
            const toastMessageElement = document.createElement('p');
            toastMessageElement.innerText = sorpresaDeHoy.mensaje;
            surpriseToast.appendChild(toastMessageElement);

            document.getElementById('close-toast').addEventListener('click', () => {
                surpriseToast.classList.remove('show');
            });
            
            setTimeout(() => {
                surpriseToast.classList.add('show');
                if (sorpresaDeHoy.esDiaDeFlores) { iniciarLluviaFlores(); }
            }, 1500);
        }
    }
});
