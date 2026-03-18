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
// 💌 3. LÓGICA DE APERTURA (NUEVA ANIMACIÓN)
// ==========================================
envelope.addEventListener('click', () => { 
    if (!envelope.classList.contains('is-open')) {
        // Abrir
        envelope.classList.remove('close-anim');
        envelope.classList.add('open-anim', 'is-open');
    } else {
        // Cerrar
        envelope.classList.remove('open-anim', 'is-open');
        envelope.classList.add('close-anim');
    }
});

function cargarDia(fechaStr, elementoDia) {
    const datos = diarioCartas[fechaStr];
    if (datos) {
        // Si estaba abierto, cerramos con la animación suave
        if (envelope.classList.contains('is-open')) {
            envelope.classList.remove('open-anim', 'is-open');
            envelope.classList.add('close-anim');
        }
        
        document.querySelectorAll('.days div').forEach(d => d.classList.remove('active'));
        if (elementoDia) elementoDia.classList.add('active');

        // Espera 1 segundo (lo que dura la animación de guardado) para cambiar el texto
        setTimeout(() => {
            letterContent.className = 'text'; 
            const cantidadLetras = datos.texto.length;
            if (cantidadLetras < 200) { letterContent.classList.add('size-normal'); } 
            else if (cantidadLetras < 400) { letterContent.classList.add('size-medium'); } 
            else { letterContent.classList.add('size-small'); }

            letterContent.innerHTML = datos.texto;
            ytFrame.src = datos.youtube || "";
            spFrame.src = datos.spotify || "";
            
            // Regresa el scroll del texto arriba del todo
            letterContent.scrollTop = 0;
        }, 1000);
    }
}

// ==========================================
// 📅 4. CALENDARIO Y EXTRAS
// ==========================================
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