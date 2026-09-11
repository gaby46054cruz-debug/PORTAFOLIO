// Importaciones modulares de Firebase v10+
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configuración provista
const firebaseConfig = {
  apiKey: "AIzaSyCSHWCKnfL531jGJJgG3lfvMUEnH58uX5A",
  authDomain: "tarjeta1-3d3f9.firebaseapp.com",
  projectId: "tarjeta1-3d3f9",
  storageBucket: "tarjeta1-3d3f9.firebasestorage.app",
  messagingSenderId: "46559227030",
  appId: "1:46559227030:web:b9a6a9c5c9760efa53a6b7",
  measurementId: "G-02LJQDV2YJ"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Estado de la Aplicación
let currentAdmin = null;
let activeSectionId = null;
let sectionsData = [];
let subSectionsData = [];

// Elementos DOM
const yearEl = document.getElementById('year');
const sectionsNav = document.getElementById('sectionsNav');
const mainContent = document.getElementById('mainContent');
const adminStatus = document.getElementById('adminStatus');
const adminPanel = document.getElementById('adminPanel');

// Modales y Formularios
const authModal = document.getElementById('authModal');
const sectionModal = document.getElementById('sectionModal');
const subSectionModal = document.getElementById('subSectionModal');
const lightboxModal = document.getElementById('lightboxModal');
const lightboxContent = document.getElementById('lightboxContent');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Escuchar estado de autenticación
  onAuthStateChanged(auth, (user) => {
    currentAdmin = user;
    updateAdminUI();
    loadAllData();
  });

  setupEventListeners();
});

// Event Listeners principales
function setupEventListeners() {
  // Auth
  const btnOpenAuth = document.getElementById('btnOpenAuth');
  if (btnOpenAuth) btnOpenAuth.addEventListener('click', () => authModal.classList.remove('hidden'));

  const closeAuthModal = document.getElementById('closeAuthModal');
  if (closeAuthModal) closeAuthModal.addEventListener('click', () => authModal.classList.add('hidden'));

  const btnLogout = document.getElementById('btnLogout');
  if (btnLogout) btnLogout.addEventListener('click', () => signOut(auth));

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const errorEl = document.getElementById('authError');

      try {
        await signInWithEmailAndPassword(auth, email, pass);
        authModal.classList.add('hidden');
        errorEl.classList.add('hidden');
      } catch (err) {
        errorEl.textContent = "Error al ingresar. Verificá tu correo o contraseña.";
        errorEl.classList.remove('hidden');
      }
    });
  }

  // Modal Sección Principal
  const btnNewSectionModal = document.getElementById('btnNewSectionModal');
  if (btnNewSectionModal) btnNewSectionModal.addEventListener('click', () => openSectionModal());

  const closeSectionModal = document.getElementById('closeSectionModal');
  if (closeSectionModal) closeSectionModal.addEventListener('click', () => sectionModal.classList.add('hidden'));

  const sectionForm = document.getElementById('sectionForm');
  if (sectionForm) sectionForm.addEventListener('submit', handleSectionSubmit);

  // Modal SubSección
  const btnNewSubSectionModal = document.getElementById('btnNewSubSectionModal');
  if (btnNewSubSectionModal) btnNewSubSectionModal.addEventListener('click', () => openSubSectionModal());

  const closeSubSectionModal = document.getElementById('closeSubSectionModal');
  if (closeSubSectionModal) closeSubSectionModal.addEventListener('click', () => subSectionModal.classList.add('hidden'));

  const subSectionForm = document.getElementById('subSectionForm');
  if (subSectionForm) subSectionForm.addEventListener('submit', handleSubSectionSubmit);

  // Lightbox & Cerrar
  const closeLightbox = document.getElementById('closeLightbox');
  if (closeLightbox) {
    closeLightbox.addEventListener('click', closeLightboxModal);
  }
  if (lightboxModal) {
    lightboxModal.addEventListener('click', (e) => {
      if (e.target === lightboxModal) closeLightboxModal();
    });
  }
}

// Carga de Datos desde Firestore
async function loadAllData() {
  try {
    // 1. Obtener Secciones Principales
    const secSnap = await getDocs(query(collection(db, "sections"), orderBy("order", "asc")));
    sectionsData = secSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Garantizar selección activa
    if (sectionsData.length > 0) {
      const exists = sectionsData.find(s => s.id === activeSectionId);
      if (!exists) {
        activeSectionId = sectionsData[0].id;
      }
    } else {
      activeSectionId = null;
    }

    // 2. Obtener Subsecciones / Publicaciones
    const subSnap = await getDocs(collection(db, "subsections"));
    subSectionsData = subSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    renderUI();
  } catch (error) {
    console.error("Error cargando datos:", error);
    mainContent.innerHTML = `<p class="loading-spinner">Error al conectar con la base de datos.</p>`;
  }
}

// Renderizado de Interfaz
function renderUI() {
  renderNavTabs();
  renderContent();
  populateSectionSelect();
}

function renderNavTabs() {
  sectionsNav.innerHTML = '';

  if (sectionsData.length === 0) {
    sectionsNav.innerHTML = `<p style="font-size: 0.8rem; color: var(--text-muted);">No hay secciones creadas.</p>`;
    return;
  }

  sectionsData.forEach(sec => {
    const btn = document.createElement('button');
    btn.className = `nav-tab ${sec.id === activeSectionId ? 'active' : ''}`;
    btn.textContent = sec.name;
    btn.addEventListener('click', () => {
      activeSectionId = sec.id;
      renderUI();
    });
    sectionsNav.appendChild(btn);
  });
}

function renderContent() {
  mainContent.innerHTML = '';

  if (sectionsData.length === 0) {
    mainContent.innerHTML = `<p class="loading-spinner">No hay secciones guardadas. Usá el Panel de Control para crear la primera.</p>`;
    return;
  }

  const activeSection = sectionsData.find(s => s.id === activeSectionId);
  if (!activeSection) {
    mainContent.innerHTML = `<p class="loading-spinner">Seleccioná una sección para visualizar sus contenidos.</p>`;
    return;
  }

  // Encabezado de la sección activa
  const secHeader = document.createElement('div');
  secHeader.className = 'section-title-container';
  secHeader.innerHTML = `
    <h2 class="section-main-title">${activeSection.name}</h2>
    ${currentAdmin ? `
      <div class="admin-card-controls">
        <button class="btn-neon-sm" onclick="editSection('${activeSection.id}')">✏️ Editar Secc.</button>
        <button class="btn-danger-sm" onclick="deleteSection('${activeSection.id}')">🗑️ Borrar Secc.</button>
      </div>
    ` : ''}
  `;
  mainContent.appendChild(secHeader);

  // Filtrar subsecciones pertenecientes a esta sección
  const items = subSectionsData.filter(sub => sub.parentId === activeSectionId);

  if (items.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.style.cssText = "font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 30px 0;";
    emptyMsg.textContent = "No hay subsecciones o publicaciones registradas dentro de esta sección.";
    mainContent.appendChild(emptyMsg);
    return;
  }

  // Renderizar tarjetas de subsección
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'subsection-card';

    // Generar bloque multimedia
    const mediaHtml = generateMediaMarkup(item.mediaUrls || []);

    card.innerHTML = `
      <div class="card-header-flex">
        <h3 class="card-item-title">${item.title}</h3>
        ${currentAdmin ? `
          <div class="admin-card-controls">
            <button class="btn-neon-sm" onclick="editSubSection('${item.id}')">✏️ Editar</button>
            <button class="btn-danger-sm" onclick="deleteSubSection('${item.id}')">🗑️ Borrar</button>
          </div>
        ` : ''}
      </div>
      ${item.description ? `<p class="card-item-desc">${item.description}</p>` : ''}
      ${mediaHtml}
    `;

    mainContent.appendChild(card);
  });

  setupCarouselLogic();
}

// Generador de Multimedia (1 Foto vs Carrusel)
function generateMediaMarkup(urls) {
  if (!urls || urls.length === 0) return '';

  if (urls.length === 1) {
    return `
      <div class="media-wrapper">
        <img src="${urls[0]}" class="single-media" onclick="openLightbox('${urls[0]}')" alt="Imagen">
      </div>
    `;
  }

  // 2 o más elementos: Carrusel dinámico
  const slidesHtml = urls.map(url => `
    <div class="carousel-slide">
      <img src="${url}" onclick="openLightbox('${url}')" alt="Imagen Carrusel">
    </div>
  `).join('');

  return `
    <div class="media-wrapper carousel-container" data-slides-count="${urls.length}">
      <div class="carousel-track" style="transform: translateX(0%);">
        ${slidesHtml}
      </div>
      <div class="carousel-controls">
        <button class="btn-carousel-nav btn-prev">‹</button>
        <button class="btn-carousel-nav btn-next">›</button>
      </div>
    </div>
  `;
}

// Lógica del Carrusel
function setupCarouselLogic() {
  document.querySelectorAll('.carousel-container').forEach(container => {
    const track = container.querySelector('.carousel-track');
    const prevBtn = container.querySelector('.btn-prev');
    const nextBtn = container.querySelector('.btn-next');
    const total = parseInt(container.getAttribute('data-slides-count')) || 0;
    let current = 0;

    if (prevBtn && nextBtn && track) {
      prevBtn.onclick = (e) => {
        e.stopPropagation();
        current = (current - 1 + total) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
      };

      nextBtn.onclick = (e) => {
        e.stopPropagation();
        current = (current + 1) % total;
        track.style.transform = `translateX(-${current * 100}%)`;
      };
    }
  });
}

// Actualización UI Admin
function updateAdminUI() {
  if (currentAdmin) {
    adminStatus.classList.add('hidden');
    adminPanel.classList.remove('hidden');
  } else {
    adminStatus.classList.remove('hidden');
    adminPanel.classList.add('hidden');
  }
}

function populateSectionSelect() {
  const select = document.getElementById('subSectionParentId');
  if (!select) return;

  select.innerHTML = '';
  sectionsData.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = s.name;
    if (s.id === activeSectionId) opt.selected = true;
    select.appendChild(opt);
  });
}

// OPERACIONES CRUD FIRESTORE
async function handleSectionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('sectionId').value;
  const name = document.getElementById('sectionName').value;
  const order = parseInt(document.getElementById('sectionOrder').value) || 1;

  try {
    if (id) {
      await updateDoc(doc(db, "sections", id), { name, order });
    } else {
      const docRef = await addDoc(collection(db, "sections"), { name, order });
      activeSectionId = docRef.id;
    }
    sectionModal.classList.add('hidden');
    await loadAllData();
  } catch (err) {
    alert("Error al guardar sección: " + err.message);
  }
}

async function handleSubSectionSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('subSectionId').value;
  const parentId = document.getElementById('subSectionParentId').value;
  const title = document.getElementById('subSectionTitle').value;
  const description = document.getElementById('subSectionDesc').value;
  const rawUrls = document.getElementById('subSectionMediaUrls').value;

  const mediaUrls = rawUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0);

  try {
    if (id) {
      await updateDoc(doc(db, "subsections", id), { parentId, title, description, mediaUrls });
    } else {
      await addDoc(collection(db, "subsections"), { parentId, title, description, mediaUrls });
    }
    activeSectionId = parentId;
    subSectionModal.classList.add('hidden');
    await loadAllData();
  } catch (err) {
    alert("Error al guardar publicación: " + err.message);
  }
}

// VISOR DE IMAGEN A PANTALLA COMPLETA Y LIMPIA
window.openLightbox = (url) => {
  lightboxContent.innerHTML = `
    <div style="
      width: 95vw; 
      height: 92vh; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      overflow: hidden;
    ">
      <img src="${url}" alt="Vista previa" style="
        width: 100%;
        height: 100%;
        object-fit: contain;
        border: 2px solid var(--neon-cyan);
        border-radius: 8px;
        box-shadow: 0 0 25px var(--neon-cyan-glow);
      ">
    </div>
  `;

  lightboxModal.classList.remove('hidden');
};

function closeLightboxModal() {
  lightboxModal.classList.add('hidden');
  lightboxContent.innerHTML = '';
}

// Funciones globales expuestas para botones dinámicos
window.editSection = (id) => {
  const sec = sectionsData.find(s => s.id === id);
  if (!sec) return;
  document.getElementById('sectionId').value = sec.id;
  document.getElementById('sectionName').value = sec.name;
  document.getElementById('sectionOrder').value = sec.order || 1;
  document.getElementById('sectionModalTitle').textContent = "Editar Sección Principal";
  sectionModal.classList.remove('hidden');
};

window.deleteSection = async (id) => {
  if (confirm("¿Estás seguro de eliminar esta sección principal y sus subsecciones asociadas?")) {
    try {
      await deleteDoc(doc(db, "sections", id));
      
      const childSubs = subSectionsData.filter(s => s.parentId === id);
      for (const sub of childSubs) {
        await deleteDoc(doc(db, "subsections", sub.id));
      }

      activeSectionId = null;
      await loadAllData();
    } catch (err) {
      alert("Error al borrar sección: " + err.message);
    }
  }
};

window.editSubSection = (id) => {
  const sub = subSectionsData.find(s => s.id === id);
  if (!sub) return;
  populateSectionSelect();
  document.getElementById('subSectionId').value = sub.id;
  document.getElementById('subSectionParentId').value = sub.parentId;
  document.getElementById('subSectionTitle').value = sub.title;
  document.getElementById('subSectionDesc').value = sub.description || '';
  document.getElementById('subSectionMediaUrls').value = (sub.mediaUrls || []).join('\n');
  document.getElementById('subSectionModalTitle').textContent = "Editar Subsección / Publicación";
  subSectionModal.classList.remove('hidden');
};

window.deleteSubSection = async (id) => {
  if (confirm("¿Eliminar esta subsección/publicación?")) {
    try {
      await deleteDoc(doc(db, "subsections", id));
      await loadAllData();
    } catch (err) {
      alert("Error al borrar subsección: " + err.message);
    }
  }
};

function openSectionModal() {
  document.getElementById('sectionId').value = '';
  document.getElementById('sectionName').value = '';
  document.getElementById('sectionOrder').value = '1';
  document.getElementById('sectionModalTitle').textContent = "Nueva Sección Principal";
  sectionModal.classList.remove('hidden');
}

function openSubSectionModal() {
  populateSectionSelect();
  document.getElementById('subSectionId').value = '';
  document.getElementById('subSectionTitle').value = '';
  document.getElementById('subSectionDesc').value = '';
  document.getElementById('subSectionMediaUrls').value = '';
  document.getElementById('subSectionModalTitle').textContent = "Nueva Subsección / Publicación";
  subSectionModal.classList.remove('hidden');
}