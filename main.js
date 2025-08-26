// Toast notification function
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
    navigator.serviceWorker.register('./service-worker.js').catch(() => { });
  });
}

// Local Storage Keys
const LS_USERS = 'agrilink_users',
      LS_AUTH = 'agrilink_auth',
      LS_PRODUCTS = 'agrilink_products';

// Local Storage Helpers
function saveUsers(list) {
  localStorage.setItem(LS_USERS, JSON.stringify(list));
}

function getUsers() {
  try {
    return JSON.parse(localStorage.getItem(LS_USERS)) || [];
  } catch (e) {
    return [];
  }
}

function setAuth(user) {
  localStorage.setItem(LS_AUTH, JSON.stringify(user));
}

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(LS_AUTH));
  } catch (e) {
    return null;
  }
}

function ensureAuth(onFail = true) {
  const u = getAuth();
  if (!u && onFail && location.pathname.endsWith('dashboard.html')) {
    location.href = './login.html';
  }
  return u;
}

// DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  
  // Registration
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
        toast('Please fill all fields');
        return;
      }

      const users = getUsers();
      if (users.some(u => u.email === user.email)) {
        toast('Email already registered');
        return;
      }

      users.push(user);
      saveUsers(users);

      toast('Registration successful');
      setTimeout(() => location.href = './login.html', 800);
    });
  }

  // Login
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', e => {
      e.preventDefault();

      const email = loginEmail.value.trim().toLowerCase(),
            pass = loginPassword.value;

      const user = getUsers().find(u => u.email === email && u.password === pass);

      if (!user) {
        toast('Invalid credentials');
        return;
      }

      setAuth({ name: user.name, email: user.email, role: user.role });
      toast('Welcome ' + user.name.split(' ')[0]);
      setTimeout(() => location.href = './dashboard.html', 600);
    });
  }

  // Dashboard
  if (location.pathname.endsWith('dashboard.html')) {
    const me = ensureAuth(true);

    // Show user info
    const who = document.getElementById('whoami');
    if (me && who) {
      who.textContent = me.name + ' • ' + me.role.toUpperCase();
    }

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn?.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem(LS_AUTH);
      location.href = './index.html';
    });

    // Product management
    const tbody = document.getElementById('productsTbody');
    const form = document.getElementById('productForm');

    function loadP() {
      try {
        return JSON.parse(localStorage.getItem(LS_PRODUCTS)) || [];
      } catch (e) {
        return [];
      }
    }

    function saveP(list) {
      localStorage.setItem(LS_PRODUCTS, JSON.stringify(list));
    }

    function render() {
      const list = loadP().filter(p => p.owner === (me?.email || ''));

      tbody.innerHTML =
        list.map(p => `
          <tr>
            <td>${p.img ? `<img src="${p.img}" style="width:80px;height:60px;object-fit:cover;border-radius:8px">` : '-'}</td>
            <td>${p.name}</td>
            <td>${Number(p.price).toFixed(2)}</td>
            <td>${p.desc || ''}</td>
            <td><button class="btn" data-del="${p.id}">Delete</button></td>
          </tr>
        `).join('') ||
        `<tr><td colspan="5" class="muted">No products yet</td></tr>`;
    }

    // Delete product
    tbody?.addEventListener('click', e => {
      const id = e.target?.getAttribute?.('data-del');
      if (!id) return;

      const list = loadP().filter(p => p.id !== id);
      saveP(list);
      render();
      toast('Deleted');
    });

    // Add product
    form?.addEventListener('submit', async e => {
      e.preventDefault();

      const name = pName.value.trim(),
            desc = pDesc.value.trim(),
            price = pPrice.value,
            file = pImage.files[0];

      let img = '';
      if (file) {
        img = await new Promise(res => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result);
          fr.readAsDataURL(file);
        });
      }

      const product = {
        id: String(Date.now()),
        owner: me.email,
        name,
        desc,
        price,
        img
      };

      const all = loadP();
      all.unshift(product);
      saveP(all);

      form.reset();
      render();
      toast('Product added');
    });

    render();
  }

  // Dictionary for translations
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

  // Function to switch languages
  function switchLanguage(lang) {
    document.querySelector("h1").innerText = translations[lang].welcome;
    document.querySelector(".hero p.muted").innerText = translations[lang].desc;

    // Cards
    const cards = document.querySelectorAll(".card");
    cards[0].querySelector("strong").innerText = translations[lang].local;
    cards[0].querySelector("p").innerText = translations[lang].localDesc;
    cards[1].querySelector("strong").innerText = translations[lang].pwa;
    cards[1].querySelector("p").innerText = translations[lang].pwaDesc;
    cards[2].querySelector("strong").innerText = translations[lang].onboarding;
    cards[2].querySelector("p").innerText = translations[lang].onboardingDesc;

    // Buttons
    const buttons = document.querySelectorAll(".hero a");
    buttons[0].innerText = translations[lang].getStarted;
    buttons[1].innerText = translations[lang].already;

    // Footer
    document.querySelector(".footer p").innerText = translations[lang].footer;
  }

});
