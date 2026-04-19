/* Toggle Icon Navbar */
let menuIcon = document.querySelector('.menu-btn');
let navbar = document.querySelector('.navbar');

menuIcon.onclick = () => {
    let icon = menuIcon.querySelector('i');
    const isExpanded = menuIcon.getAttribute('aria-expanded') === 'true';
    if (icon) {
        icon.classList.toggle('fa-xmark'); // Using xmark for close
    }
    menuIcon.setAttribute('aria-expanded', String(!isExpanded));
    navbar.classList.toggle('active');
};

/* Scroll Sections Active Link */
let sections = document.querySelectorAll('section');
let navLinks = document.querySelectorAll('header nav a');

window.onscroll = () => {
    let top = window.scrollY;

    sections.forEach(sec => {
        let offset = sec.offsetTop - 150;
        let height = sec.offsetHeight;
        let id = sec.getAttribute('id');

        if (top >= offset && top < offset + height) {
            navLinks.forEach(links => {
                links.classList.remove('active');
            });

            const activeLink = document.querySelector(`header nav a[href*="${id}"]`);
            if (activeLink) activeLink.classList.add('active');
        };
    });

    /* Sticky Navbar style could be enhanced here if needed, but CSS handles fixed position */

    /* Remove toggle icon and navbar when click navbar link (scroll) */
    let icon = menuIcon.querySelector('i');
    if (icon) {
        icon.classList.remove('fa-xmark');
    }
    menuIcon.setAttribute('aria-expanded', 'false');
    navbar.classList.remove('active');
};

/* Scroll Reveal */
ScrollReveal({
    distance: '80px',
    duration: 2000,
    delay: 200
});

ScrollReveal().reveal('.home-content, .heading', { origin: 'top' });
ScrollReveal().reveal('.home-img, .skills-grid-wrapper, .project-card, .contact-card, .bio-panel, .info-grid', { origin: 'bottom' });
ScrollReveal().reveal('.home-content h1, .hero-title', { origin: 'left' });
ScrollReveal().reveal('.home-content p, .bio-text', { origin: 'right' });

/* Typed JS */
const typed = new Typed('.multiple-text', {
    strings: ['Logística Integral', 'Mejora Continua', 'Análisis de Datos'],
    typeSpeed: 100,
    backSpeed: 100,
    backDelay: 1000,
    loop: true
});

/* Particles JS Config */
particlesJS("particles-js", {
    "particles": {
        "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
        "color": { "value": "#60a5fa" }, /* Lighter Blue */
        "shape": { "type": "circle" },
        "opacity": { "value": 0.8, "random": false }, /* Bright dots */
        "size": { "value": 4, "random": true },
        "line_linked": { "enable": true, "distance": 150, "color": "#60a5fa", "opacity": 0.15, "width": 1 }, /* Faint lines */
        "move": { "enable": true, "speed": 1.5, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
    },
    "interactivity": {
        "detect_on": "canvas",
        "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
        "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } } } /* Only bright on hover */
    },
    "retina_detect": true
});

/* Chatbot Logic */
const chatToggle = document.getElementById('chat-toggle');
const chatWidget = document.getElementById('chat-widget');
const closeChat = document.getElementById('close-chat');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatBody = document.getElementById('chat-body');

function openChatWidget() {
    chatWidget.classList.add('active');
    chatWidget.setAttribute('aria-hidden', 'false');
    chatToggle.setAttribute('aria-expanded', 'true');
    chatToggle.style.display = 'none';
    chatInput.focus();
}

function closeChatWidget() {
    chatWidget.classList.remove('active');
    chatWidget.setAttribute('aria-hidden', 'true');
    chatToggle.setAttribute('aria-expanded', 'false');
    chatToggle.style.display = 'flex';
    chatToggle.focus();
}

// State Manager
let isRequesting = false; // Prevent double clicks
let lastMessageTime = 0;
const RATE_LIMIT_MS = 2000; // 2 seconds cool-down

// Toggle Widget
chatToggle.addEventListener('click', () => {
    openChatWidget();
});

closeChat.addEventListener('click', () => {
    closeChatWidget();
});

chatWidget.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && chatWidget.classList.contains('active')) {
        e.preventDefault();
        closeChatWidget();
    }
});

// --- Main Chat Function ---
async function handleUserMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1️⃣ Protección: Rate Limiting (Evitar spam)
    const now = Date.now();
    if (now - lastMessageTime < RATE_LIMIT_MS) {
        // No enviamos nada si escriben muy rápido, o mostramos advertencia sutil
        return;
    }
    lastMessageTime = now;

    // 2️⃣ Protección: Evitar peticiones simultáneas
    if (isRequesting) return;
    isRequesting = true;

    // UI: Add User Message
    addMessage(text, 'user-message');
    chatInput.value = '';

    // UI: Loading Indicator
    const loadingId = 'loading-' + now;
    addMessage('Analizando...', 'bot-message typing-indicator', loadingId);

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
        });

        const data = await response.json();

        // Remove loader
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        if (!response.ok || data.error) {
            console.warn("Backend API Error:", data.error);
            const simReply = getSimulatedReply(text);
            addMessage(simReply, 'bot-message');
        } else {
            addMessage(data.reply, 'bot-message');
        }

    } catch (error) {
        console.error("Network Error:", error);
        const loader = document.getElementById(loadingId);
        if (loader) loader.remove();

        // Fallback final (Offline o error grave)
        addMessage(getSimulatedReply(text), 'bot-message');
    } finally {
        isRequesting = false;
    }
}

// --- Helper UI Function ---
function addMessage(text, className, id = null) {
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerText = text;
    if (id) div.id = id;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// --- Fallback Local Brain (Modo Seguro) --- 
// Se activa si falla la API o para pruebas
function getSimulatedReply(text) {
    const t = text.toLowerCase();
    if (t.match(/hola|buen|hi/)) return "¡Hola! Soy el asistente de Alessandro. ¿Qué te gustaría saber sobre su experiencia en Ingeniería Industrial?";
    if (t.match(/experiencia|primax|trabajo/)) return "En Px Servicios Generales (Primax Ecuador) (2025), Alessandro optimiza la gestión documental y flujos operativos usando herramientas digitales.";
    if (t.match(/habilidad|python|sql|power|excel/)) return "Destaca en Python, SQL y Power BI para análisis de datos, además de metodologías Lean Manufacturing.";
    if (t.match(/contacto|email|llamar/)) return "¡Hablemos! Puedes contactarlo por LinkedIn o descargar su CV aquí mismo.";
    return "Interesante pregunta. Para más detalles específicos, te sugiero revisar la sección de 'Proyectos' o contactar a Alessandro directamente.";
}

// Event Listeners
if (sendBtn) {
    sendBtn.addEventListener('click', handleUserMessage);
}

if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserMessage();
    });
}
