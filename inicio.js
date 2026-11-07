import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// CONFIGURACIÓN DE FIREBASE DIRECTA
const firebaseConfig = {
  apiKey: "AIzaSyDih3egk9LegaaiY3hAZvYYA7Omvbx05qk",
  authDomain: "camaras-1d9c8.firebaseapp.com",
  projectId: "camaras-1d9c8",
  storageBucket: "camaras-1d9c8.firebasestorage.app",
  messagingSenderId: "554283714612",
  appId: "1:554283714612:web:bcacc46747d77a0ccae261",
  measurementId: "G-N7MKML5Z2D"
};

// INICIALIZACIÓN
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ELEMENTOS DOM
const loaderScreen = document.getElementById('loader-screen');
const lockBtn = document.getElementById('admin-trigger-btn');
const loginModal = document.getElementById('login-modal');
const closeLogin = document.getElementById('close-login');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');

let initialLoadDone = false;

// VALORES POR DEFECTO
let portfolioData = {
  profile: {
    name: "José Gabriel Cruz",
    image: "https://via.placeholder.com/160",
    fields: [
      { icon: "fa-cake-candles", label: "Edad", value: "18 años" },
      { icon: "fa-location-dot", label: "Ubicación", value: "Alderetes, Tucumán, Argentina" },
      { icon: "fa-envelope", label: "Correo", value: "contacto@gcdesarrollo.com" },
      { icon: "fa-phone", label: "Teléfono", value: "+54 381 000-0000" },
      { icon: "fa-graduation-cap", label: "Título", value: "Técnico en Computación y Redes" }
    ],
    headerButtons: [
      { label: "Contacto", url: "#", icon: "fa-paper-plane" },
      { label: "Acerca de mí", url: "#", icon: "fa-user" }
    ]
  },
  boxes: [
    {
      id: "box-1",
      section: "Técnico en Redes y Computación",
      title: "Infraestructura de Redes y Sistemas",
      desc: "Especialista en instalación, subneteo VLAN, administración de servidores, configuración de router Cisco, QoS y despliegues de cámaras de seguridad CCTV.",
      images: [],
      buttons: [
        { label: "Ver Certificados", url: "#" },
        { label: "Contactar por Proyecto", url: "#" }
      ]
    }
  ],
  styles: {
    bgUrl: "",
    cardBg: "#12141a",
    footerBg: "#0a0b0e",
    textColor: "#e6e8ec",
    goldColor: "#d4af37",
    btnColor: "#d4af37"
  }
};

// 1. ESCUCHAR CAMBIOS EN FIRESTORE EN TIEMPO REAL
const docRef = doc(db, "portfolio", "main_content");
onSnapshot(docRef, (docSnap) => {
  if (docSnap.exists()) {
    portfolioData = docSnap.data();
    renderPortfolio();
  } else {
    setDoc(docRef, portfolioData);
    renderPortfolio();
  }

  if (!initialLoadDone) {
    initialLoadDone = true;
    document.body.classList.add('loaded');
    setTimeout(() => {
      loaderScreen.classList.add('hidden');
    }, 200);
  }
});

// 2. RENDERIZAR TODO EL PORTAFOLIO CON ESTILOS
function renderPortfolio() {
  document.getElementById('year').textContent = new Date().getFullYear();

  // Encabezado
  document.getElementById('user-name').textContent = portfolioData.profile.name || "José Gabriel Cruz";
  if (portfolioData.profile.image) {
    document.getElementById('profile-img').src = portfolioData.profile.image;
  }

  // Campos personales
  const grid = document.getElementById('info-grid');
  grid.innerHTML = '';
  (portfolioData.profile.fields || []).forEach(f => {
    const item = document.createElement('div');
    item.className = 'info-item';
    item.innerHTML = `<i class="fa-solid ${f.icon}"></i> <div><strong>${f.label}:</strong> <span>${f.value}</span></div>`;
    grid.appendChild(item);
  });

  // Botones de Cabecera Centrados
  const headerBtnsDiv = document.getElementById('header-quick-buttons');
  headerBtnsDiv.innerHTML = '';
  (portfolioData.profile.headerButtons || []).forEach(b => {
    const iconHTML = b.icon ? `<i class="fa-solid ${b.icon}"></i> ` : '';
    const link = document.createElement('a');
    link.className = 'btn-header-custom';
    link.href = b.url || '#';
    link.target = '_blank';
    link.innerHTML = `${iconHTML}${b.label}`;
    headerBtnsDiv.appendChild(link);
  });

  // Estilos y Colores
  if (portfolioData.styles) {
    const s = portfolioData.styles;
    if (s.bgUrl) document.body.style.backgroundImage = `url('${s.bgUrl}')`;
    document.documentElement.style.setProperty('--card-bg', s.cardBg || 'rgba(18, 20, 26, 0.85)');
    document.documentElement.style.setProperty('--footer-bg', s.footerBg || '#07080a');
    document.documentElement.style.setProperty('--text-main', s.textColor || '#e6e8ec');
    document.documentElement.style.setProperty('--gold', s.goldColor || '#d4af37');
    document.documentElement.style.setProperty('--gold-glow', `${s.btnColor || '#d4af37'}55`);
  }

  // Renderizar Secciones Dinámicas
  const container = document.getElementById('dynamic-sections');
  const navContainer = document.getElementById('nav-container');
  container.innerHTML = '';
  navContainer.innerHTML = '';

  const boxesBySection = {};
  (portfolioData.boxes || []).forEach(box => {
    const sec = box.section || "General";
    if (!boxesBySection[sec]) boxesBySection[sec] = [];
    boxesBySection[sec].push(box);
  });

  Object.keys(boxesBySection).forEach((secName, idx) => {
    const secId = `section-${idx}`;
    
    // Link de Navegación
    const navLink = document.createElement('a');
    navLink.className = 'nav-link';
    navLink.href = `#${secId}`;
    navLink.textContent = secName;
    navContainer.appendChild(navLink);

    // Bloque de Sección
    const secBlock = document.createElement('div');
    secBlock.className = 'section-block';
    secBlock.id = secId;

    let boxesHTML = `<h2 class="section-title">${secName}</h2>`;
    boxesBySection[secName].forEach(b => {
      boxesHTML += `
        <div class="box-item">
          <h3 class="box-title">${b.title}</h3>
          <p class="box-desc">${b.desc}</p>
      `;

      // Carrusel / Imágenes
      if (b.images && b.images.length > 0) {
        boxesHTML += `<div class="box-carousel">`;
        b.images.forEach(imgUrl => {
          if (imgUrl.trim()) {
            boxesHTML += `<img src="${imgUrl.trim()}" class="carousel-img" onclick="window.open('${imgUrl.trim()}', '_blank')">`;
          }
        });
        boxesHTML += `</div>`;
      }

      // Botones Palpitantes
      if (b.buttons && b.buttons.length > 0) {
        boxesHTML += `<div class="buttons-grid">`;
        b.buttons.forEach(btn => {
          boxesHTML += `<a href="${btn.url}" target="_blank" class="btn-pulsing"><i class="fa-solid fa-arrow-up-right-from-square"></i> ${btn.label}</a>`;
        });
        boxesHTML += `</div>`;
      }

      boxesHTML += `</div>`;
    });

    secBlock.innerHTML = boxesHTML;
    container.appendChild(secBlock);
  });
}

// 3. AUTENTICACIÓN FIREBASE
lockBtn.addEventListener('click', () => {
  if (auth.currentUser) {
    adminPanel.classList.add('active');
    populateAdminForm();
  } else {
    loginModal.classList.add('active');
  }
});

closeLogin.addEventListener('click', () => loginModal.classList.remove('active'));

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    loginModal.classList.remove('active');
    adminPanel.classList.add('active');
    populateAdminForm();
  } catch (err) {
    loginError.textContent = 'Credenciales incorrectas o error de conexión.';
  }
});

logoutBtn.addEventListener('click', () => {
  signOut(auth);
  adminPanel.classList.remove('active');
});

// 4. PANEL ADMINISTRATIVO - TABS
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

// 5. LLENAR FORMULARIOS DE ADMINISTRACIÓN
function populateAdminForm() {
  // Perfil
  document.getElementById('edit-profile-name').value = portfolioData.profile.name || '';
  document.getElementById('edit-profile-img').value = portfolioData.profile.image || '';

  const fieldsContainer = document.getElementById('personal-fields-container');
  fieldsContainer.innerHTML = '';
  (portfolioData.profile.fields || []).forEach((f) => {
    addFieldInput(f.icon, f.label, f.value);
  });

  // Botones de Cabecera en el Admin
  const headerBtnsContainer = document.getElementById('header-buttons-container');
  headerBtnsContainer.innerHTML = '';
  (portfolioData.profile.headerButtons || []).forEach((hb) => {
    addHeaderButtonInput(hb.label, hb.url, hb.icon);
  });

  // Lista Recuadros Existentes
  renderAdminBoxesList();
}

function renderAdminBoxesList() {
  const boxesList = document.getElementById('admin-boxes-list');
  boxesList.innerHTML = '';
  (portfolioData.boxes || []).forEach((b, i) => {
    const item = document.createElement('div');
    item.style.display = 'flex';
    item.style.justifyContent = 'space-between';
    item.style.alignItems = 'center';
    item.style.padding = '10px 0';
    item.style.borderBottom = '1px solid rgba(212,175,55,0.2)';
    item.innerHTML = `
      <span><strong>[${b.section}]</strong> ${b.title}</span>
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="editBox(${i})"><i class="fa-solid fa-pen"></i> Editar</button>
        <button class="btn btn-danger-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="deleteBox(${i})"><i class="fa-solid fa-trash"></i> Eliminar</button>
      </div>
    `;
    boxesList.appendChild(item);
  });
}

// CAMPO DINÁMICO DE DATOS PERSONALES
function addFieldInput(icon = 'fa-info-circle', label = '', value = '') {
  const container = document.getElementById('personal-fields-container');
  const div = document.createElement('div');
  div.className = 'inline-input mt-20';
  div.innerHTML = `
    <input type="text" placeholder="Icono (ej: fa-phone)" value="${icon}" class="field-icon">
    <input type="text" placeholder="Etiqueta" value="${label}" class="field-label">
    <input type="text" placeholder="Valor" value="${value}" class="field-value">
  `;
  container.appendChild(div);
}
document.getElementById('add-field-btn').addEventListener('click', () => addFieldInput());

// CAMPO DINÁMICO DE BOTONES DE CABECERA
function addHeaderButtonInput(label = '', url = '', icon = 'fa-envelope') {
  const container = document.getElementById('header-buttons-container');
  const div = document.createElement('div');
  div.className = 'inline-input mt-20';
  div.innerHTML = `
    <input type="text" placeholder="Texto (ej: Contacto)" value="${label}" class="header-btn-label">
    <input type="url" placeholder="URL Destino" value="${url}" class="header-btn-url">
    <input type="text" placeholder="Icono (ej: fa-paper-plane)" value="${icon}" class="header-btn-icon">
  `;
  container.appendChild(div);
}
document.getElementById('add-header-btn').addEventListener('click', () => addHeaderButtonInput());

// GENERAR CAMPOS DE BOTONES PARA RECUADROS
document.getElementById('gen-buttons-btn').addEventListener('click', () => {
  const count = parseInt(document.getElementById('box-btn-count').value) || 0;
  generateBoxButtonsInputs(count);
});

function generateBoxButtonsInputs(count, existingButtons = []) {
  const container = document.getElementById('dynamic-buttons-inputs');
  container.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const btn = existingButtons[i] || { label: '', url: '' };
    const div = document.createElement('div');
    div.className = 'inline-input mt-20';
    div.innerHTML = `
      <input type="text" placeholder="Nombre del Botón ${i+1}" value="${btn.label}" class="btn-name-input">
      <input type="url" placeholder="URL Destino https://..." value="${btn.url}" class="btn-url-input">
    `;
    container.appendChild(div);
  }
}

// GUARDAR PERFIL EN FIRESTORE
document.getElementById('profile-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('edit-profile-name').value;
  const image = document.getElementById('edit-profile-img').value;

  // Recoger Datos
  const icons = document.querySelectorAll('.field-icon');
  const labels = document.querySelectorAll('.field-label');
  const values = document.querySelectorAll('.field-value');
  const fields = [];
  icons.forEach((ic, idx) => {
    if (labels[idx].value.trim()) {
      fields.push({ icon: ic.value.trim(), label: labels[idx].value.trim(), value: values[idx].value.trim() });
    }
  });

  // Recoger Botones de Cabecera
  const hLabels = document.querySelectorAll('.header-btn-label');
  const hUrls = document.querySelectorAll('.header-btn-url');
  const hIcons = document.querySelectorAll('.header-btn-icon');
  const headerButtons = [];
  hLabels.forEach((hl, idx) => {
    if (hl.value.trim()) {
      headerButtons.push({ label: hl.value.trim(), url: hUrls[idx].value.trim(), icon: hIcons[idx].value.trim() });
    }
  });

  portfolioData.profile = { name, image, fields, headerButtons };
  await setDoc(docRef, portfolioData);
  alert('¡Perfil y botones de cabecera guardados!');
});

// EDITAR RECUADRO EXISTENTE
window.editBox = (index) => {
  const b = portfolioData.boxes[index];
  if (!b) return;

  document.getElementById('editing-box-index').value = index;
  document.getElementById('box-section').value = b.section || '';
  document.getElementById('box-title').value = b.title || '';
  document.getElementById('box-desc').value = b.desc || '';
  document.getElementById('box-images').value = (b.images || []).join(', ');

  const btnCount = (b.buttons || []).length;
  document.getElementById('box-btn-count').value = btnCount;
  generateBoxButtonsInputs(btnCount, b.buttons || []);

  document.getElementById('box-form-title').textContent = 'Editar Recuadro Existente';
  document.getElementById('save-box-btn').textContent = 'Guardar Cambios';
  document.getElementById('cancel-edit-box-btn').style.display = 'inline-block';

  // Desplazar arriba al formulario
  document.getElementById('tab-boxes').scrollTop = 0;
};

// CANCELAR EDICIÓN
document.getElementById('cancel-edit-box-btn').addEventListener('click', resetBoxForm);

function resetBoxForm() {
  document.getElementById('box-form').reset();
  document.getElementById('editing-box-index').value = "-1";
  document.getElementById('dynamic-buttons-inputs').innerHTML = '';
  document.getElementById('box-form-title').textContent = 'Nuevo Recuadro / Sección';
  document.getElementById('save-box-btn').textContent = 'Guardar Recuadro';
  document.getElementById('cancel-edit-box-btn').style.display = 'none';
}

// GUARDAR / CREAR RECUADRO EN FIRESTORE
document.getElementById('box-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editIndex = parseInt(document.getElementById('editing-box-index').value);
  const section = document.getElementById('box-section').value;
  const title = document.getElementById('box-title').value;
  const desc = document.getElementById('box-desc').value;
  const rawImages = document.getElementById('box-images').value;
  const images = rawImages ? rawImages.split(',').map(s => s.trim()) : [];

  const btnNames = document.querySelectorAll('.btn-name-input');
  const btnUrls = document.querySelectorAll('.btn-url-input');
  const buttons = [];
  btnNames.forEach((b, idx) => {
    if (b.value.trim()) {
      buttons.push({ label: b.value.trim(), url: btnUrls[idx].value.trim() });
    }
  });

  const boxObject = {
    id: editIndex >= 0 ? portfolioData.boxes[editIndex].id : `box-${Date.now()}`,
    section, title, desc, images, buttons
  };

  if (!portfolioData.boxes) portfolioData.boxes = [];

  if (editIndex >= 0) {
    portfolioData.boxes[editIndex] = boxObject;
  } else {
    portfolioData.boxes.push(boxObject);
  }

  await setDoc(docRef, portfolioData);
  resetBoxForm();
  renderAdminBoxesList();
  alert(editIndex >= 0 ? '¡Recuadro editado correctamente!' : '¡Recuadro creado exitosamente!');
});

// ELIMINAR RECUADRO
window.deleteBox = async (index) => {
  if (confirm('¿Deseas eliminar este recuadro?')) {
    portfolioData.boxes.splice(index, 1);
    await setDoc(docRef, portfolioData);
    resetBoxForm();
    renderAdminBoxesList();
  }
};

// GUARDAR DISEÑO / ESTILOS
document.getElementById('style-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  portfolioData.styles = {
    bgUrl: document.getElementById('style-bg-url').value,
    cardBg: document.getElementById('style-card-bg').value,
    footerBg: document.getElementById('style-footer-bg').value,
    textColor: document.getElementById('style-text-color').value,
    goldColor: document.getElementById('style-gold-color').value,
    btnColor: document.getElementById('style-btn-color').value
  };
  await setDoc(docRef, portfolioData);
  alert('¡Estilos aplicados correctamente!');
});
