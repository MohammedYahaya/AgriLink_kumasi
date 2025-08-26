function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._t);
  el._t = setTimeout(() => el.style.display = 'none', 1600);
}

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}

// Local storage keys
const LS_USERS = 'agrilink_users', LS_AUTH = 'agrilink_auth', LS_PRODUCTS = 'agrilink_products';

// Utility functions
function saveUsers(l) { localStorage.setItem(LS_USERS, JSON.stringify(l)) }
function getUsers() { try { return JSON.parse(localStorage.getItem(LS_USERS)) || [] } catch(e) { return [] } }
function setAuth(u) { localStorage.setItem(LS_AUTH, JSON.stringify(u)) }
function getAuth() { try { return JSON.parse(localStorage.getItem(LS_AUTH)) } catch(e) { return null } }
function ensureAuth(onFail=true) {
  const u = getAuth();
  if (!u && onFail && location.pathname.endsWith('dashboard.html')) {
    location.href='./login.html';
  }
  return u;
}

// ========== LANGUAGE HANDLING ==========
const translations = {
  en: {
    welcome: "Welcome to AgriLink",
    desc: "A clean, offline-ready marketplace for farmers and buyers. Install it as an app!",
    local: "Local-first",
    localDesc: "Optimized for Kumasi markets and connectivity.",
    pwa: "PWA",
    pwaDesc: "Works offline, installable on phone and desktop.",
    onboarding: "Simple Onboarding",
    onboardingDesc: "Register and manage listings quickly.",
    getStarted: "Get Started",
    already: "I already have an account",
    footer: "Pilot build for your supervisor"
  },
  tw: {
    welcome: "Akwaaba kɔ AgriLink",
    desc: "Ɛyɛ fɛ, ɛyɛ mmerɛ na ɔfline, ama akuafoɔ ne atɔfoɔ. Tɔ app no!",
    local: "Ɛfiri Kumasi",
    localDesc: "Ayɛ no pɛ Kumasi sɔre ne intanɛt ho.",
    pwa: "PWA",
    pwaDesc: "Ɛyɛ adwuma wɔ ɔfline, na wubetumi ato no wɔ fon ne kɔmputa so.",
    onboarding: "Mmerɛw sɛ wobɛyɛ aba",
    onboardingDesc: "Kyerɛw wo din na hwɛ wo nneɛma ntɔn ntɛm.",
    getStarted: "Hyɛ ase",
    already: "Me wɔ akawnt dada",
    footer: "Ɔsom boɔma wo supervisor"
  }
};

// Make available globally
window.switchLanguage = function(lang) {
  const t = translations[lang];
  if (!t) return;

  const h1 = document.querySelector("h1");
  const desc = document.querySelector(".hero p.muted");
  const cards = document.querySelectorAll(".card");
  const buttons = document.querySelectorAll(".hero a");
  const footer = document.querySelector(".footer p");

  if (h1) h1.innerText = t.welcome;
  if (desc) desc.innerText = t.desc;

  if (cards.length >= 3) {
    cards[0].querySelector("strong").innerText = t.local;
    cards[0].querySelector("p").innerText = t.localDesc;
    cards[1].querySelector("strong").innerText = t.pwa;
    cards[1].querySelector("p").innerText = t.pwaDesc;
    cards[2].querySelector("strong").innerText = t.onboarding;
    cards[2].querySelector("p").innerText = t.onboardingDesc;
  }

  if (buttons.length >= 2) {
    buttons[0].innerText = t.getStarted;
    buttons[1].innerText = t.already;
  }

  if (footer) footer.innerText = t.footer;
};

// Persist language across reloads
document.addEventListener("DOMContentLoaded", () => {
  const langSelector = document.getElementById("languageSelector");
  if (langSelector) {
    const savedLang = localStorage.getItem("agrilink_lang") || "en";
    langSelector.value = savedLang;
    switchLanguage(savedLang);

    langSelector.addEventListener("change", (e) => {
      localStorage.setItem("agrilink_lang", e.target.value);
      switchLanguage(e.target.value);
    });
  }
});

// ========== AUTH & DASHBOARD ==========
document.addEventListener('DOMContentLoaded', () => {
  const regForm = document.getElementById('regForm');
  if (regForm) {
    regForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = {
        name: fullName.value.trim(),
        email: email.value.trim().toLowerCase(),
        phone: phone.value.trim(),
        role: role.value,
        password: password.value
      };
      if (!user.name || !user.email || !user.phone || !user.role || !user.password) {
        toast('Please fill all fields'); return;
      }
      const users = getUsers();
      if (users.some(u => u.email === user.email)) {
        toast('Email already registered'); return;
      }
      users.push(user); saveUsers(users);
      toast('Registration successful');
      setTimeout(() => location.href='./login.html', 800);
    });
  }

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();
      const email = loginEmail.value.trim().toLowerCase(),
            pass = loginPassword.value;
      const user = getUsers().find(u => u.email===email && u.password===pass);
      if (!user) { toast('Invalid credentials'); return; }
      setAuth({name:user.name, email:user.email, role:user.role});
      toast('Welcome '+user.name.split(' ')[0]);
      setTimeout(()=>location.href='./dashboard.html', 600);
    });
  }

  if (location.pathname.endsWith('dashboard.html')) {
    const me = ensureAuth(true);
    const who = document.getElementById('whoami');
    if (me && who) who.textContent = me.name+' • '+me.role.toUpperCase();

    const logoutBtn=document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', e=>{
      e.preventDefault(); localStorage.removeItem(LS_AUTH);
      location.href='./index.html';
    });

    const tbody=document.getElementById('productsTbody');
    const form=document.getElementById('productForm');

    function loadP(){try{return JSON.parse(localStorage.getItem(LS_PRODUCTS))||[]}catch(e){return []}}
    function saveP(l){localStorage.setItem(LS_PRODUCTS,JSON.stringify(l))}
    function render(){
      const list=loadP().filter(p=>p.owner===(me?.email||''));
      tbody.innerHTML=list.map(p=>`
        <tr>
          <td>${p.img?`<img src="${p.img}" style="width:80px;height:60px;object-fit:cover;border-radius:8px">`:'-'}</td>
          <td>${p.name}</td>
          <td>${Number(p.price).toFixed(2)}</td>
          <td>${p.desc||''}</td>
          <td><button class="btn" data-del="${p.id}">Delete</button></td>
        </tr>`).join('')
        || `<tr><td colspan="5" class="muted">No products yet</td></tr>`;
    }

    tbody?.addEventListener('click', e=>{
      const id=e.target?.getAttribute?.('data-del');
      if(!id)return;
      const list=loadP().filter(p=>p.id!==id);
      saveP(list); render(); toast('Deleted');
    });

    form?.addEventListener('submit', asyn
