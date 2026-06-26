// ============================================================
// GlamAtHome — Main Application Logic (app.js)
// Single source of truth for navigation, auth guard, and AI.
// ============================================================

// ----------------------------------------------------------
// 0. AUTH GUARD — Redirect to login.html if no user found
// ----------------------------------------------------------
(function authGuard() {
    const userStr = sessionStorage.getItem('glamathome_user');
    if (!userStr && !window.location.pathname.endsWith('login.html')) {
        window.location.href = 'login.html';
        return;
    }
    
    if (userStr) {
        const user = JSON.parse(userStr);
        window.glamathomeUser = user;
        document.addEventListener('DOMContentLoaded', () => {
            updateUserUI(user);
        });
    }
})();

function updateUserUI(user) {
    const name = user.displayName || 'Guest';
    const firstName = name.split(' ')[0];
    
    // Update all elements with class 'user-full-name' and 'user-first-name'
    document.querySelectorAll('.user-full-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.user-first-name').forEach(el => el.textContent = firstName);
    
    // Update photos
    const photoURL = user.photoURL;
    document.querySelectorAll('.user-avatar-img').forEach(img => {
        if (photoURL) {
            img.src = photoURL;
        } else {
            // Generate initials placeholder
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            img.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%238d4d3b" /><text x="50" y="50" font-family="sans-serif" font-size="40" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
        }
    });
}

window.toggleFavorite = function(id, type, name, specialty, image) {
  const KEY = 'glamathome_favorites';
  let favs = JSON.parse(localStorage.getItem(KEY) || '[]');
  const idx = favs.findIndex(f => f.id === id);
  const icon = document.getElementById('fav-icon-' + id);
  
  if (idx === -1) {
    favs.push({ id, type, name, specialty, image });
    if (icon) {
      icon.textContent = 'favorite';
      icon.style.fontVariationSettings = "'FILL' 1";
      icon.style.color = '#e11d48';
    }
    showToast('Added to favorites');
  } else {
    favs.splice(idx, 1);
    if (icon) {
      icon.textContent = 'favorite_border';
      icon.style.fontVariationSettings = '';
      icon.style.color = '';
    }
    showToast('Removed from favorites');
  }
  localStorage.setItem(KEY, JSON.stringify(favs));
  renderFavorites();
};

function showToast(msg) {
  let t = document.getElementById('glam-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'glam-toast';
    t.style.cssText = `
      position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
      background:#1a1c1a; color:#fff; padding:10px 20px;
      border-radius:999px; font-size:13px; font-weight:600;
      z-index:99999; opacity:0; transition:opacity 0.3s;
      white-space:nowrap; pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.style.opacity = '0', 2500);
}

function renderFavorites(filter = 'all') {
  const grid = document.getElementById('favorites-grid');
  const empty = document.getElementById('favorites-empty-state');
  if (!grid) return;

  let favs = JSON.parse(
    localStorage.getItem('glamathome_favorites') || '[]'
  );
  
  if (filter === 'styles') 
    favs = favs.filter(f => f.type === 'style');
  else if (filter === 'stylists') 
    favs = favs.filter(f => f.type === 'stylist');

  if (!favs.length) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  if (empty) empty.classList.add('hidden');

  grid.innerHTML = favs.map(f => `
    <div class="bg-surface-container-lowest rounded-xl overflow-hidden 
                shadow-sm border border-outline-variant/10 relative group">
      <div class="relative h-48">
        <img src="${f.image}" alt="${f.name}"
             class="w-full h-full object-cover"
             onerror="this.src='https://placehold.co/400x200/f4ede8/8d4d3b?text=No+Image'"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
        <span class="absolute top-3 left-3 text-[10px] font-bold uppercase 
                     tracking-widest bg-primary/90 text-white px-2 py-1 
                     rounded-full">${f.type}</span>
      </div>
      <div class="p-4 flex justify-between items-start">
        <div>
          <h3 class="font-headline font-bold text-on-surface">${f.name}</h3>
          <p class="text-xs text-on-surface-variant mt-1">${f.specialty || ''}</p>
        </div>
        <button onclick="toggleFavorite('${f.id}','${f.type}',
          '${f.name.replace(/'/g,"\\\\'")}',
          '${(f.specialty||'').replace(/'/g,"\\\\'")}',
          '${f.image}')"
          class="w-9 h-9 rounded-full bg-red-50 flex items-center 
                 justify-center text-red-500 hover:bg-red-100 
                 active:scale-90 transition-all flex-shrink-0">
          <span class="material-symbols-outlined text-lg notranslate" 
                translate="no" style="font-variation-settings:'FILL' 1">
            favorite
          </span>
        </button>
      </div>
    </div>
  `).join('');
}

// ----------------------------------------------------------
// 1. CORE NAVIGATION — Single canonical navigate() function
//    All other definitions have been removed from index.html.
// ----------------------------------------------------------
window.navigate = function navigate(screenId) {
    const screens = document.querySelectorAll('.app-screen');
    screens.forEach(screen => {
        screen.style.display = 'none';
        screen.classList.remove('active');
    });

    const target = document.getElementById('screen-' + screenId);
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        localStorage.setItem('currentScreen', screenId);

        // Close side panels on navigate
        closeSidebar();
        closeNotifications();

        // Update bottom nav active state
        updateBottomNav(screenId);

        if (screenId === 'saved_styles_stylists') {
            renderFavorites('all');
        }
    }
};

// ----------------------------------------------------------
// 2. BOTTOM NAV ACTIVE STATE
// ----------------------------------------------------------
const NAV_MAP = {
    'glamathome_home_screen': 'nav-btn-home',
    'discover_styles_stylists': 'nav-btn-discover',
    'my_appointments': 'nav-btn-bookings',
    'saved_styles_stylists': 'nav-btn-favorites',
    'chats': 'nav-btn-messages'
};

function updateBottomNav(screenId) {
    // Reset all nav buttons
    document.querySelectorAll('#bottom-nav a').forEach(btn => {
        btn.classList.remove('text-[#8d4d3b]');
        btn.classList.add('text-[#86736e]');
        const icon = btn.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "";
    });

    // Highlight the active one
    const activeId = NAV_MAP[screenId];
    if (activeId) {
        const activeBtn = document.getElementById(activeId);
        if (activeBtn) {
            activeBtn.classList.remove('text-[#86736e]');
            activeBtn.classList.add('text-[#8d4d3b]');
            const icon = activeBtn.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        }
    }
}

// ----------------------------------------------------------
// 3. SIDEBAR & NOTIFICATIONS
// ----------------------------------------------------------
function closeSidebar() {
    const sidebar = document.getElementById('global-sidebar');
    const overlay = document.getElementById('global-sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) {
        overlay.classList.add('opacity-0');
        overlay.classList.add('pointer-events-none');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
}

function toggleSidebar() {
    const sidebar = document.getElementById('global-sidebar');
    const overlay = document.getElementById('global-sidebar-overlay');
    if (sidebar && sidebar.classList.contains('-translate-x-full')) {
        sidebar.classList.remove('-translate-x-full');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.classList.remove('pointer-events-none');
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
        }
    } else {
        closeSidebar();
    }
}

function closeNotifications() {
    const dropdown = document.getElementById('global-notifications-dropdown');
    if (dropdown) {
        dropdown.classList.remove('scale-100', 'opacity-100');
        dropdown.classList.add('scale-95', 'opacity-0');
        setTimeout(() => dropdown.classList.add('hidden'), 200);
    }
}

function toggleNotifications() {
    const dropdown = document.getElementById('global-notifications-dropdown');
    if (dropdown && dropdown.classList.contains('hidden')) {
        dropdown.classList.remove('hidden');
        setTimeout(() => {
            dropdown.classList.remove('scale-95', 'opacity-0');
            dropdown.classList.add('scale-100', 'opacity-100');
        }, 10);
    } else {
        closeNotifications();
    }
}

// ----------------------------------------------------------
// 4. AI STYLE ANALYSIS — Anthropic claude-sonnet-4-20250514 via server proxy
// ----------------------------------------------------------
window.runAI = async function runAI(btnElement) {
    const photoInput = document.getElementById('photoInput');
    const preview = document.getElementById('preview');
    const resultDiv = document.getElementById('ai-result');
    const analyzeBtn = btnElement || document.getElementById('analyzeBtn');

    const file = photoInput?.files[0];
    if (!file) {
        alert('Please select a photo first!');
        return;
    }

    // UI loading state
    const originalText = analyzeBtn.innerText;
    analyzeBtn.innerText = '⏳ Generating...';
    analyzeBtn.disabled = true;
    analyzeBtn.style.opacity = '0.7';

    if (resultDiv) {
        resultDiv.innerHTML = `
            <div class="flex items-center gap-3 p-6 bg-surface-container-low rounded-xl mt-4">
                <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span class="text-on-surface-variant font-medium">AI is generating your new hairstyle...</span>
            </div>`;
    }

    try {
        // Read file as Base64
        const userImageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = (err) => reject(err);
            reader.readAsDataURL(file);
        });

        // Get style prompt from input
        const promptInput = document.getElementById('ai-style-prompt-input');
        const stylePrompt = promptInput?.value?.trim() || "Transform the hairstyle to long beautiful african knotless box braids with beads, keep the exact same face, skin tone and background, high quality photorealistic result";

        const response = await fetch('/api/try-hairstyle', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userImageBase64,
                stylePrompt
            })
        });

        const data = await response.json();

        if (response.ok && data.imageUrl) {
            // Update preview image src and remove hidden class
            if (preview) {
                preview.src = data.imageUrl;
                preview.classList.remove('hidden');
                preview.style.display = 'block';
            }

            if (resultDiv) {
                resultDiv.innerHTML = `
                <div class="mt-6 p-6 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-lg">auto_awesome</span>
                        </div>
                        <div>
                            <h3 class="font-headline font-bold text-on-surface">Hairstyle Generated!</h3>
                            <p class="text-xs text-on-surface-variant">Powered by InstructPix2Pix</p>
                        </div>
                    </div>
                    <p class="text-xs text-on-surface-variant mb-2">Prompt used: "${stylePrompt}"</p>
                    <div class="rounded-lg overflow-hidden border border-outline-variant/10">
                        <img src="${data.imageUrl}" class="w-full object-cover" />
                    </div>
                </div>`;
            }
            analyzeBtn.innerText = '✨ Style Applied!';
        } else {
            const errMsg = data.error || 'Failed to generate hairstyle. Please try again.';
            if (resultDiv) {
                resultDiv.innerHTML = `
                <div class="mt-4 p-4 bg-error-container/30 rounded-xl border border-error/20">
                    <p class="text-on-error-container text-sm font-medium">⚠️ ${errMsg}</p>
                </div>`;
            }
        }
    } catch (err) {
        console.error('AI try-on error:', err);
        if (resultDiv) {
            resultDiv.innerHTML = `
            <div class="mt-4 p-4 bg-error-container/30 rounded-xl border border-error/20">
                <p class="text-on-error-container text-sm font-medium">⚠️ Error connecting to server. Please try again.</p>
            </div>`;
        }
    } finally {
        analyzeBtn.disabled = false;
        analyzeBtn.style.opacity = '1';
        setTimeout(() => { analyzeBtn.innerText = originalText; }, 5000);
    }
};

// ----------------------------------------------------------
// 5. DOM READY — Initializations
// ----------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {

    // --- Restore heart states on page load ---
    const savedFavs = JSON.parse(
      localStorage.getItem('glamathome_favorites') || '[]'
    );
    savedFavs.forEach(f => {
      const icon = document.getElementById('fav-icon-' + f.id);
      if (icon) {
        icon.textContent = 'favorite';
        icon.style.fontVariationSettings = "'FILL' 1";
        icon.style.color = '#e11d48';
      }
    });

    // --- Tab buttons in screen-saved_styles_stylists ---
    document.querySelectorAll('#screen-saved_styles_stylists button')
      .forEach(btn => {
        btn.addEventListener('click', () => {
          // reset all tabs
          document.querySelectorAll(
            '#screen-saved_styles_stylists button'
          ).forEach(b => {
            b.className = 'px-8 py-3 bg-surface-container-high ' +
              'text-on-surface-variant rounded-full font-semibold ' +
              'whitespace-nowrap active:scale-95 transition-all';
          });
          // activate clicked tab
          btn.className = 'px-8 py-3 bg-primary text-white ' +
            'rounded-full font-semibold shadow-lg whitespace-nowrap ' +
            'active:scale-95 transition-all';
          
          const label = btn.textContent.trim().toLowerCase();
          if (label.includes('styles')) renderFavorites('styles');
          else if (label.includes('stylists')) renderFavorites('stylists');
          else renderFavorites('all');
        });
      });

    // --- Send button listener for "Describe your vibe" input ---
    const vibeSendBtn = document.getElementById('ai-vibe-send-btn');
    if (vibeSendBtn) {
        vibeSendBtn.addEventListener('click', async () => {
            const promptInput = document.getElementById('ai-style-prompt-input');
            const photoInput = document.getElementById('photoInput');
            const preview = document.getElementById('preview');
            const resultDiv = document.getElementById('ai-result');

            const typedText = promptInput?.value?.trim();
            if (!typedText) return;

            if (!photoInput?.files?.length) {
                alert('Please upload a photo first');
                return;
            }

            // Disable send button while processing
            vibeSendBtn.disabled = true;
            vibeSendBtn.style.opacity = '0.5';

            if (resultDiv) {
                resultDiv.innerHTML = `
                    <div class="flex items-center gap-3 p-6 bg-surface-container-low rounded-xl mt-4">
                        <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-on-surface-variant font-medium">AI is generating your new hairstyle...</span>
                    </div>`;
            }

            try {
                const file = photoInput.files[0];
                const userImageBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(file);
                });

                const response = await fetch('/api/try-hairstyle', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userImageBase64,
                        stylePrompt: typedText
                    })
                });

                const data = await response.json();

                if (response.ok && data.imageUrl) {
                    if (preview) {
                        preview.src = data.imageUrl;
                        preview.classList.remove('hidden');
                        preview.style.display = 'block';
                    }
                    if (resultDiv) {
                        resultDiv.innerHTML = `
                        <div class="mt-6 p-6 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div class="flex items-center gap-3 mb-4">
                                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
                                    <span class="material-symbols-outlined text-white text-lg">auto_awesome</span>
                                </div>
                                <div>
                                    <h3 class="font-headline font-bold text-on-surface">Hairstyle Generated!</h3>
                                    <p class="text-xs text-on-surface-variant">Powered by InstructPix2Pix</p>
                                </div>
                            </div>
                            <p class="text-xs text-on-surface-variant mb-2">Prompt used: "${typedText}"</p>
                            <div class="rounded-lg overflow-hidden border border-outline-variant/10">
                                <img src="${data.imageUrl}" class="w-full object-cover" />
                            </div>
                        </div>`;
                    }
                } else {
                    const errMsg = data.error || 'Failed to generate hairstyle. Please try again.';
                    if (resultDiv) {
                        resultDiv.innerHTML = `
                        <div class="mt-4 p-4 bg-error-container/30 rounded-xl border border-error/20">
                            <p class="text-on-error-container text-sm font-medium">⚠️ ${errMsg}</p>
                        </div>`;
                    }
                }
            } catch (err) {
                console.error('Vibe send error:', err);
                if (resultDiv) {
                    resultDiv.innerHTML = `
                    <div class="mt-4 p-4 bg-error-container/30 rounded-xl border border-error/20">
                        <p class="text-on-error-container text-sm font-medium">⚠️ Error connecting to server. Please try again.</p>
                    </div>`;
                }
            } finally {
                vibeSendBtn.disabled = false;
                vibeSendBtn.style.opacity = '1';
            }
        });
    }

    // Sidebar overlay click
    const sidebarOverlay = document.getElementById('global-sidebar-overlay');
    if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

    const closeBtn = document.getElementById('close-sidebar');
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

    // Sidebar routing links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (target) navigate(target);
        });
    });

    // ----- Filter Logic for Discover Page -----
    const initFilters = () => {
        const pills = document.querySelectorAll('.filter-pill');
        if (!pills.length) return;

        const filterContent = (filterType) => {
            const items = document.querySelectorAll('.discover-item');
            items.forEach(item => {
                const textContent = item.textContent.toLowerCase();
                const htmlContent = item.innerHTML.toLowerCase();
                const hasMenContext = textContent.includes('barber') || htmlContent.includes('barber') || textContent.includes('fade') || textContent.includes('grooming') || textContent.includes('men') || textContent.includes('beard') || textContent.includes('taper') || textContent.includes('executive');

                if (filterType === 'all') {
                    item.classList.remove('hidden-item');
                } else if (filterType === 'women') {
                    item.classList.toggle('hidden-item', hasMenContext);
                } else if (filterType === 'men') {
                    item.classList.toggle('hidden-item', !hasMenContext);
                }
            });
        };

        pills.forEach(pill => {
            pill.addEventListener('click', (e) => {
                e.preventDefault();
                pills.forEach(p => {
                    p.classList.remove('bg-stone-800', 'text-white');
                    p.classList.add('bg-surface-container-high', 'text-stone-500');
                });
                pill.classList.remove('bg-surface-container-high', 'text-stone-500');
                pill.classList.add('bg-stone-800', 'text-white');

                const filter = pill.getAttribute('data-filter');
                filterContent(filter);
            });
        });
    };

    initFilters();

    // ----- Photo preview for AI screen -----
    const photoInput = document.getElementById('photoInput');
    const preview = document.getElementById('preview');
    photoInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && preview) {
            const reader = new FileReader();
            reader.onload = (event) => {
                preview.src = event.target.result;
                preview.classList.remove('hidden');
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    // ----- Gender buttons for AI screen -----
    const btnFemale = document.getElementById('btn-female');
    const btnMale = document.getElementById('btn-male');
    const updateGenderUI = (active, inactive) => {
        active?.classList.add('bg-primary', 'text-white', 'border-primary');
        active?.classList.remove('border-outline-variant/30', 'text-on-surface-variant');
        inactive?.classList.remove('bg-primary', 'text-white', 'border-primary');
        inactive?.classList.add('border-outline-variant/30', 'text-on-surface-variant');
    };
    btnFemale?.addEventListener('click', () => updateGenderUI(btnFemale, btnMale));
    btnMale?.addEventListener('click', () => updateGenderUI(btnMale, btnFemale));

    // ----- Custom Profile Photo Upload -----
    const profilePhotoUpload = document.getElementById('profile-photo-upload');
    profilePhotoUpload?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64Image = event.target.result;
                const userStr = sessionStorage.getItem('glamathome_user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    user.photoURL = base64Image;
                    sessionStorage.setItem('glamathome_user', JSON.stringify(user));
                    updateUserUI(user);
                    alert("Profile photo updated successfully!");
                }
            };
            reader.readAsDataURL(file);
        }
    });

    // ----- Freelance Stylist Application Submit -----
    const freelancerForm = document.getElementById('freelancer-form');
    freelancerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('stylist-submit');
        submitBtn.innerText = 'Submitting...';
        submitBtn.disabled = true;

        const specs = Array.from(document.querySelectorAll('.spec-cb:checked')).map(cb => cb.value);

        const applicationData = {
            fullName: document.getElementById('stylist-name').value,
            email: document.getElementById('stylist-email').value,
            phone: document.getElementById('stylist-phone').value,
            city: document.getElementById('stylist-city').value,
            specialties: specs,
            yearsOfExperience: document.getElementById('stylist-exp').value,
            portfolio: document.getElementById('stylist-portfolio').value,
            bio: document.getElementById('stylist-bio').value,
            submittedAt: new Date().toISOString()
        };

        try {
            // Import Firestore dynamically from the Firebase SDK (matching login.html version 10.12.2)
            const { getFirestore, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
            const app = window.firebaseApp; // We need to expose the initialized app in index.html, or we can just initialize it here since it's idempotent.
            // Wait, we don't have window.firebaseApp. Let's just re-initialize using the config.
            const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
            const firebaseConfig = {
                apiKey: "AIzaSyBQlgAINBRM3YvG_GGGF4J2gsEstoBDe6k",
                authDomain: "glamathome-30bfd.firebaseapp.com",
                projectId: "glamathome-30bfd",
                storageBucket: "glamathome-30bfd.firebasestorage.app",
                messagingSenderId: "126884062776",
                appId: "1:126884062776:web:24a303108fbb611af0e8cd"
            };
            // initializeApp returns existing instance if already initialized, but to be safe:
            const { getApps } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
            const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
            const db = getFirestore(fbApp);

            await addDoc(collection(db, "stylist_applications"), applicationData);
            
            alert('Application submitted successfully! We will contact you soon.');
            freelancerForm.reset();
            navigate('glamathome_home_screen');
        } catch (err) {
            console.error('Error saving application:', err);
            alert('Failed to submit application. Please try again.');
        } finally {
            submitBtn.innerText = 'Submit Application';
            submitBtn.disabled = false;
        }
    });

    // ----- Global Event Delegation for Deep Links -----
    document.body.addEventListener('click', (e) => {
        const span = e.target.closest('span');
        const btn = e.target.closest('button');
        const a = e.target.closest('a');

        // Allow nav links to work via onclick
        if (a && a.id && a.id.startsWith('nav-btn')) return;

        // Hamburger Menu
        if (span && span.textContent.trim().toLowerCase() === 'menu') {
            e.preventDefault();
            toggleSidebar();
            return;
        }

        // Notification Bell
        if (span && span.textContent.trim().toLowerCase() === 'notifications') {
            e.preventDefault();
            toggleNotifications();
            return;
        }

        // Barber Section mapping
        if (span && span.textContent.trim().toLowerCase() === 'barber') {
            e.preventDefault();
            navigate('men_s_styling_gallery');
            return;
        }

        // AI Style Assistant mapping
        const isAIText = (el) => el && (
            el.textContent.toLowerCase().includes('ai style assistant') ||
            el.textContent.toLowerCase().includes('try ai stylist') ||
            el.textContent.toLowerCase().includes('ai stylist') ||
            el.textContent.toLowerCase().includes('try ai')
        );
        if (isAIText(span) || isAIText(btn) || isAIText(a)) {
            e.preventDefault();
            navigate('ai_style_assistant_unisex_update');
            return;
        }

        // Back arrows
        if (span && span.textContent.trim() === 'arrow_back') {
            const btnContainer = span.closest('button') || span.closest('a');
            if (btnContainer) {
                e.preventDefault();
                const currentId = localStorage.getItem('currentScreen');
                if (currentId === 'ai_style_assistant_unisex_update' || currentId === 'men_s_styling_gallery') {
                    navigate('glamathome_home_screen');
                } else {
                    navigate('glamathome_home_screen');
                }
                return;
            }
        }
    });

    // ----- My Appointments Tabs -----
    const tabUpcoming = document.getElementById('tab-upcoming');
    const tabPast = document.getElementById('tab-past');
    if (tabUpcoming && tabPast) {
        tabUpcoming.addEventListener('click', () => {
            tabUpcoming.classList.replace('text-on-surface-variant', 'text-primary');
            tabUpcoming.classList.add('bg-white', 'shadow-sm');
            tabPast.classList.replace('text-primary', 'text-on-surface-variant');
            tabPast.classList.remove('bg-white', 'shadow-sm');
            document.querySelectorAll('.upcoming-apt').forEach(el => el.style.display = 'block');
            document.querySelectorAll('.past-apt').forEach(el => el.style.display = 'none');
        });
        tabPast.addEventListener('click', () => {
            tabPast.classList.replace('text-on-surface-variant', 'text-primary');
            tabPast.classList.add('bg-white', 'shadow-sm');
            tabUpcoming.classList.replace('text-primary', 'text-on-surface-variant');
            tabUpcoming.classList.remove('bg-white', 'shadow-sm');
            document.querySelectorAll('.upcoming-apt').forEach(el => el.style.display = 'none');
            document.querySelectorAll('.past-apt').forEach(el => el.style.display = 'block');
        });
    }

    // ----- Service Area Location -----
    const serviceAreaInput = document.getElementById('service-area-input');
    if (serviceAreaInput) {
        serviceAreaInput.value = sessionStorage.getItem('glamathome_service_area') || '';
        serviceAreaInput.addEventListener('change', (e) => {
            sessionStorage.setItem('glamathome_service_area', e.target.value);
        });
    }

    // ----- Saved Cards -----
    const saveNewCardBtn = document.getElementById('save-new-card-btn');
    if (saveNewCardBtn) {
        saveNewCardBtn.addEventListener('click', () => {
            const num = document.getElementById('new-card-number').value;
            const exp = document.getElementById('new-card-expiry').value;
            const cvc = document.getElementById('new-card-cvc').value;
            
            if (!num || !exp || !cvc) {
                alert("Please fill in all card details.");
                return;
            }
            
            const userStr = sessionStorage.getItem('glamathome_user');
            const userName = userStr ? JSON.parse(userStr).displayName || "User" : "User";
            const last4 = num.slice(-4) || "0000";

            const cardHTML = `
            <div class="payment-card-item bg-gradient-to-br from-surface-container-high to-surface-container p-6 rounded-xl text-on-surface shadow-md aspect-[1.6/1] flex flex-col justify-between relative group cursor-pointer active:scale-95 transition-transform" onclick="openCardOptionsModal(this)" data-last4="${last4}" data-expiry="${exp}" data-holder="${userName}">
            <div class="flex justify-between items-start">
            <span class="material-symbols-outlined text-3xl opacity-80" translate="no">contactless</span>
            <p class="font-headline font-bold italic tracking-widest text-lg">CARD</p>
            </div>
            <div class="space-y-4">
            <p class="font-body tracking-[0.2em] text-lg card-display-number">•••• •••• •••• ${last4}</p>
            <div class="flex justify-between items-end">
            <div class="space-y-1">
            <p class="text-[8px] uppercase tracking-widest opacity-60">Card Holder</p>
            <p class="text-xs font-medium uppercase tracking-wider card-display-holder">${userName}</p>
            </div>
            <div class="space-y-1 text-right">
            <p class="text-[8px] uppercase tracking-widest opacity-60">Expires</p>
            <p class="text-xs font-medium card-display-expiry">${exp}</p>
            </div>
            </div>
            </div>
            </div>`;
            
            const container = document.getElementById('payment-cards-container');
            if (container) {
                const btn = container.lastElementChild;
                btn.insertAdjacentHTML('beforebegin', cardHTML);
            }
            
            document.getElementById('add-card-modal').classList.add('hidden');
            document.getElementById('new-card-number').value = '';
            document.getElementById('new-card-expiry').value = '';
            document.getElementById('new-card-cvc').value = '';
            
            const savedCards = JSON.parse(sessionStorage.getItem('glamathome_cards') || '[]');
            savedCards.push(cardHTML);
            sessionStorage.setItem('glamathome_cards', JSON.stringify(savedCards));
        });
        
        const savedCards = JSON.parse(sessionStorage.getItem('glamathome_cards') || '[]');
        if (savedCards.length > 0) {
            const container = document.getElementById('payment-cards-container');
            if (container) {
                const btn = container.lastElementChild;
                savedCards.forEach(card => {
                    btn.insertAdjacentHTML('beforebegin', card);
                });
            }
        }
    }

    // ----- Restore last screen or default -----
    const startScreen = localStorage.getItem('currentScreen') || 'glamathome_home_screen';
    if (document.getElementById('screen-' + startScreen)) {
        navigate(startScreen);
    } else {
        navigate('glamathome_home_screen');
    }

    // Call dynamic loaders
    loadApprovedStylists();
    loadAppointments();

    // ----- Phone Verification Flow (Twilio SMS) -----
    const btnSendCode = document.getElementById('btn-send-phone-code');
    const btnConfirmCode = document.getElementById('btn-confirm-phone-code');
    const phoneInput = document.getElementById('profile-phone-input');
    const otpRow = document.getElementById('phone-otp-row');
    const otpInput = document.getElementById('phone-otp-input');
    const otpMessage = document.getElementById('phone-otp-message');
    const verifiedBadge = document.getElementById('phone-verified-badge');

    if (btnSendCode) {
        btnSendCode.addEventListener('click', async () => {
            const phone = phoneInput?.value?.trim();
            if (!phone || phone.length < 7) {
                alert('Please enter a valid phone number.');
                return;
            }

            // Disable button, show loading
            btnSendCode.textContent = 'Sending...';
            btnSendCode.disabled = true;
            btnSendCode.style.opacity = '0.5';

            try {
                const resp = await fetch('/api/send-verification', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone })
                });
                const data = await resp.json();

                // Show OTP row
                if (otpRow) otpRow.classList.remove('hidden');

                if (resp.ok) {
                    if (otpMessage) {
                        otpMessage.classList.remove('hidden');
                        otpMessage.textContent = `📱 Verification code sent to ${phone}.`;
                        otpMessage.className = 'mt-2 text-xs text-green-600 font-medium';
                    }
                } else {
                    // Twilio failed, show fallback code if available
                    if (otpMessage) {
                        otpMessage.classList.remove('hidden');
                        if (data.fallbackCode) {
                            otpMessage.textContent = `⚠️ SMS failed. Use demo code: ${data.fallbackCode}`;
                        } else {
                            otpMessage.textContent = `⚠️ ${data.error || 'Failed to send SMS.'}`;
                        }
                        otpMessage.className = 'mt-2 text-xs text-amber-600 font-medium';
                    }
                }

                btnSendCode.textContent = 'Code Sent';
                setTimeout(() => {
                    btnSendCode.textContent = 'Resend';
                    btnSendCode.disabled = false;
                    btnSendCode.style.opacity = '1';
                }, 30000);

            } catch (err) {
                console.error('Send verification error:', err);
                if (otpMessage) {
                    otpMessage.classList.remove('hidden');
                    otpMessage.textContent = '⚠️ Network error. Please try again.';
                    otpMessage.className = 'mt-2 text-xs text-red-600 font-medium';
                }
                btnSendCode.textContent = 'Verify';
                btnSendCode.disabled = false;
                btnSendCode.style.opacity = '1';
            }
        });
    }

    if (btnConfirmCode) {
        btnConfirmCode.addEventListener('click', async () => {
            const entered = otpInput?.value?.trim();
            const phone = phoneInput?.value?.trim();
            if (!entered) {
                alert('Please enter the verification code.');
                return;
            }

            btnConfirmCode.textContent = 'Checking...';
            btnConfirmCode.disabled = true;

            try {
                const resp = await fetch('/api/verify-code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, code: entered })
                });
                const data = await resp.json();

                if (resp.ok && data.verified) {
                    // Success
                    if (otpRow) otpRow.classList.add('hidden');
                    if (otpMessage) {
                        otpMessage.textContent = '✅ Phone number verified successfully!';
                        otpMessage.className = 'mt-2 text-xs text-green-600 font-medium';
                        otpMessage.classList.remove('hidden');
                    }
                    // Save verified phone to session
                    const user = JSON.parse(sessionStorage.getItem('glamathome_user') || '{}');
                    user.verifiedPhone = phone;
                    sessionStorage.setItem('glamathome_user', JSON.stringify(user));
                    // Show verified UI with edit/delete buttons
                    setTimeout(() => setPhoneVerifiedUI(phone), 1500);
                } else {
                    if (otpMessage) {
                        otpMessage.textContent = `❌ ${data.error || 'Incorrect code.'}`;
                        otpMessage.className = 'mt-2 text-xs text-red-600 font-medium';
                        otpMessage.classList.remove('hidden');
                    }
                    if (otpInput) {
                        otpInput.value = '';
                        otpInput.focus();
                    }
                }
            } catch (err) {
                console.error('Verify code error:', err);
                if (otpMessage) {
                    otpMessage.textContent = '⚠️ Network error. Please try again.';
                    otpMessage.className = 'mt-2 text-xs text-red-600 font-medium';
                    otpMessage.classList.remove('hidden');
                }
            } finally {
                btnConfirmCode.textContent = 'Confirm';
                btnConfirmCode.disabled = false;
            }
        });
    }

    // Check if phone was already verified
    const savedUser = JSON.parse(sessionStorage.getItem('glamathome_user') || '{}');
    const btnEditPhone = document.getElementById('btn-edit-phone');
    const btnDeletePhone = document.getElementById('btn-delete-phone');

    function setPhoneVerifiedUI(phone) {
        if (phoneInput) {
            phoneInput.value = phone;
            phoneInput.disabled = true;
            phoneInput.classList.add('opacity-60');
        }
        if (btnSendCode) btnSendCode.classList.add('hidden');
        if (verifiedBadge) verifiedBadge.classList.remove('hidden');
        if (btnEditPhone) btnEditPhone.classList.remove('hidden');
        if (btnDeletePhone) btnDeletePhone.classList.remove('hidden');
        if (otpRow) otpRow.classList.add('hidden');
        if (otpMessage) otpMessage.classList.add('hidden');
    }

    function setPhoneUnverifiedUI() {
        if (phoneInput) {
            phoneInput.disabled = false;
            phoneInput.classList.remove('opacity-60');
        }
        if (btnSendCode) {
            btnSendCode.classList.remove('hidden');
            btnSendCode.textContent = 'Verify';
            btnSendCode.disabled = false;
            btnSendCode.style.opacity = '1';
        }
        if (verifiedBadge) verifiedBadge.classList.add('hidden');
        if (btnEditPhone) btnEditPhone.classList.add('hidden');
        if (btnDeletePhone) btnDeletePhone.classList.add('hidden');
        if (otpRow) otpRow.classList.add('hidden');
        if (otpMessage) otpMessage.classList.add('hidden');
    }

    if (savedUser.verifiedPhone) {
        setPhoneVerifiedUI(savedUser.verifiedPhone);
    }

    // Edit phone — unlock for re-verification
    if (btnEditPhone) {
        btnEditPhone.addEventListener('click', () => {
            setPhoneUnverifiedUI();
            phoneInput?.focus();
        });
    }

    // Delete phone — clear entirely
    if (btnDeletePhone) {
        btnDeletePhone.addEventListener('click', () => {
            if (confirm('Remove your verified phone number?')) {
                const user = JSON.parse(sessionStorage.getItem('glamathome_user') || '{}');
                delete user.verifiedPhone;
                sessionStorage.setItem('glamathome_user', JSON.stringify(user));
                if (phoneInput) phoneInput.value = '';
                setPhoneUnverifiedUI();
            }
        });
    }

    // ----- Address Save/Load with Card Display -----
    const streetInput = document.getElementById('profile-address-street');
    const cityInput = document.getElementById('profile-address-city');
    const postalInput = document.getElementById('profile-address-postal');
    const btnSaveAddr = document.getElementById('btn-save-address');
    const btnCancelEdit = document.getElementById('btn-cancel-edit-address');
    const btnEditAddr = document.getElementById('btn-edit-address');
    const btnDeleteAddr = document.getElementById('btn-delete-address');
    const addressCard = document.getElementById('address-display-card');
    const addressForm = document.getElementById('address-edit-form');

    function showAddressCard(address) {
        const displayStreet = document.getElementById('address-display-street');
        const displayCity = document.getElementById('address-display-city');
        const displayComma = document.getElementById('address-display-comma');
        const displayPostal = document.getElementById('address-display-postal');

        if (displayStreet) displayStreet.textContent = address.street;
        if (displayCity) displayCity.textContent = address.city || '';
        if (displayComma) displayComma.textContent = (address.city && address.postal) ? ', ' : '';
        if (displayPostal) displayPostal.textContent = address.postal || '';

        if (addressCard) addressCard.classList.remove('hidden');
        if (addressForm) addressForm.classList.add('hidden');
    }

    function showAddressForm() {
        if (addressCard) addressCard.classList.add('hidden');
        if (addressForm) addressForm.classList.remove('hidden');
        if (btnCancelEdit) btnCancelEdit.classList.remove('hidden');
    }

    // Load saved address on init
    const savedAddress = JSON.parse(localStorage.getItem('glamathome_address') || 'null');
    if (savedAddress && savedAddress.street) {
        if (streetInput) streetInput.value = savedAddress.street || '';
        if (cityInput) cityInput.value = savedAddress.city || '';
        if (postalInput) postalInput.value = savedAddress.postal || '';
        showAddressCard(savedAddress);
        // Auto-populate booking form
        const bookingAddr = document.querySelector('#booking-form input[placeholder*="address"], #booking-form input[name="address"]');
        if (bookingAddr) bookingAddr.value = `${savedAddress.street}, ${savedAddress.city} ${savedAddress.postal}`.trim();
    }

    // Save
    if (btnSaveAddr) {
        btnSaveAddr.addEventListener('click', () => {
            const address = {
                street: streetInput?.value?.trim() || '',
                city: cityInput?.value?.trim() || '',
                postal: postalInput?.value?.trim() || ''
            };
            if (!address.street) {
                alert('Please enter at least a street address.');
                return;
            }
            localStorage.setItem('glamathome_address', JSON.stringify(address));
            showAddressCard(address);
            // Auto-populate booking form
            const bookingAddr = document.querySelector('#booking-form input[placeholder*="address"], #booking-form input[name="address"]');
            if (bookingAddr) bookingAddr.value = `${address.street}, ${address.city} ${address.postal}`.trim();
        });
    }

    // Edit
    if (btnEditAddr) {
        btnEditAddr.addEventListener('click', () => {
            const addr = JSON.parse(localStorage.getItem('glamathome_address') || 'null');
            if (addr) {
                if (streetInput) streetInput.value = addr.street || '';
                if (cityInput) cityInput.value = addr.city || '';
                if (postalInput) postalInput.value = addr.postal || '';
            }
            showAddressForm();
        });
    }

    // Cancel edit
    if (btnCancelEdit) {
        btnCancelEdit.addEventListener('click', () => {
            const addr = JSON.parse(localStorage.getItem('glamathome_address') || 'null');
            if (addr && addr.street) {
                showAddressCard(addr);
            }
        });
    }

    // Delete
    if (btnDeleteAddr) {
        btnDeleteAddr.addEventListener('click', () => {
            if (confirm('Remove this address?')) {
                localStorage.removeItem('glamathome_address');
                if (streetInput) streetInput.value = '';
                if (cityInput) cityInput.value = '';
                if (postalInput) postalInput.value = '';
                if (addressCard) addressCard.classList.add('hidden');
                if (addressForm) addressForm.classList.remove('hidden');
                if (btnCancelEdit) btnCancelEdit.classList.add('hidden');
            }
        });
    }
});


// ----- Bug 2: Profile Icon Navigation -----
document.addEventListener('click', (e) => {
    if (e.target.closest('.user-avatar-img')) {
        navigate('user_profile_settings');
    }
});

// ----- Bug 3: Delete Saved Card -----
window.deleteCard = function(btn) {
    if (confirm("Delete this card?")) {
        const cardElement = btn.closest('.payment-card-item');
        if (cardElement) {
            // Animate out then remove
            cardElement.style.transition = 'opacity 0.3s, transform 0.3s';
            cardElement.style.opacity = '0';
            cardElement.style.transform = 'scale(0.95)';
            setTimeout(() => cardElement.remove(), 300);

            // Update sessionStorage
            const savedCards = JSON.parse(sessionStorage.getItem('glamathome_cards') || '[]');
            const cardIndex = [...document.querySelectorAll('.payment-card-item')].indexOf(cardElement);
            if (cardIndex >= 0) savedCards.splice(cardIndex, 1);
            sessionStorage.setItem('glamathome_cards', JSON.stringify(savedCards));
        }
    }
};

// ----- Bug 4 & 5: Booking Modal Logic -----
window.openBookingModal = function(stylistName) {
    document.getElementById('book-stylist-name').value = stylistName;
    document.getElementById('booking-modal').classList.remove('hidden');
};

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (btn) {
        const text = btn.textContent.trim().toLowerCase();
        if (text === 'book now' || text === 'book' || text === 'book appointment') {
            e.preventDefault();
            let stylistName = 'Stylist';
            if (btn.closest('#screen-stylist_profile_portfolio')) {
                stylistName = 'Amara Vance';
            } else {
                const card = btn.closest('.relative, .bg-surface-container-lowest, .group');
                if (card) {
                    const nameEl = card.querySelector('h3, .font-headline');
                    if (nameEl) stylistName = nameEl.textContent.trim();
                }
            }
            openBookingModal(stylistName);
        }
    }
});

const bookingForm = document.getElementById('booking-form');
if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userStr = sessionStorage.getItem('glamathome_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user || !user.uid) {
            alert("Please sign in to book an appointment.");
            return;
        }

        const db = window._glamDB;
        const fs = window._glamFirestore;
        if (!db || !fs) {
            alert("Database not ready yet, please try again.");
            return;
        }

        const stylist = document.getElementById('book-stylist-name').value;
        const service = document.getElementById('book-service-type').value;
        const date = document.getElementById('book-date').value;
        const time = document.getElementById('book-time').value;
        const address = document.getElementById('book-address').value;
        const notes = document.getElementById('book-notes').value;

        const booking = {
            userId: user.uid,
            stylistId: stylist,
            service: service,
            dateRendezVous: `${date}T${time}`,
            price: 50, // default
            status: "en attente",
            dateDemande: fs.Timestamp.now(),
            address: address,
            specialRequests: notes
        };
        
        try {
            await fs.addDoc(fs.collection(db, "bookings"), booking);
            alert('Booking request sent!');
            document.getElementById('booking-modal').classList.add('hidden');
            bookingForm.reset();
            
            // Reload appointments to reflect new booking
            appointmentsLoaded = false;
            loadAppointments();
            
            navigate('my_appointments');
            setTimeout(() => document.getElementById('tab-upcoming')?.click(), 100);
        } catch (err) {
            console.error("Error creating booking:", err);
            alert("Failed to save booking.");
        }
    });
}

// ----- Dynamic Approved Stylists Loader -----
let approvedStylistsLoaded = false;
async function loadApprovedStylists() {
    if (approvedStylistsLoaded) return;
    const db = window._glamDB;
    const fs = window._glamFirestore;
    if (!db || !fs) {
        window.addEventListener('firestore-ready', loadApprovedStylists);
        return;
    }
    approvedStylistsLoaded = true;

    try {
        const q = fs.query(fs.collection(db, "stylistes"), fs.where("statut", "==", "approuvé"));
        const querySnapshot = await fs.getDocs(q);

        const containers = [
            document.getElementById('dynamic-stylists-container'),
            document.getElementById('dynamic-stylists-container-grooming'),
            document.getElementById('discover-stylists-container'),
            document.getElementById('beauty-stylists-container')
        ].filter(el => el !== null);

        if (containers.length === 0) return;

        containers.forEach(container => {
            container.innerHTML = '';
        });

        if (querySnapshot.empty) {
            containers.forEach(container => {
                container.innerHTML = '<p class="text-on-surface-variant text-center py-6 text-sm">No approved stylists available at the moment.</p>';
            });
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            const nom = data.nom || 'Unknown';
            const specialite = data.specialite || 'Beauty Stylist';
            const tarif = data.tarif || '0';
            const photo = data.photo || data.image || data.photoURL || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrLdrhFjKuz7KlcTcEYCdvsLIu_M--KTcqqwyWoKTUmbsN3KzIHdW3i5EZ7Y3uBuK6P0PzO5yp_88JOtNw_vaNCVLOx4Xf1aX8V7ikH-FiT4tUFT0PE-XvRyuBndSLZL03tEWplp7pU7JeVxVMSAytCkYHz548t5g3nU0maX3creuJvQTPjE1aLIbNYmSJB4LLxxH_UJnRDaGIOgk2AH2TLyJMb-GHlLnnufSNQOsLUuuBup_Zr90OgHtyGrvrwoM1ajcZ3NEMVAZx';

            const isFavorite = (JSON.parse(sessionStorage.getItem('glamathome_favorites') || '[]')).some(f => f.id === doc.id);
            const favIcon = isFavorite ? 'favorite' : 'favorite_border';
            const favStyle = isFavorite ? "font-variation-settings: 'FILL' 1;" : "";

            const cardHTML = `
            <div class="relative pt-6">
                <div class="bg-surface-container-low rounded-xl p-6 pl-32 relative shadow-sm active:scale-[0.98] transition-transform">
                    <button class="absolute top-3 right-3 bg-white/80 dark:bg-stone-800/80 backdrop-blur-sm p-1.5 rounded-full text-primary active:scale-95 transition-all duration-200 z-30" onclick="toggleFavorite('${doc.id}', 'stylist', '${nom.replace(/'/g, "\\'")}', '${specialite.replace(/'/g, "\\'")}', '${photo}')">
                        <span id="fav-icon-${doc.id}" class="material-symbols-outlined text-lg notranslate" translate="no" style="${favStyle}">${favIcon}</span>
                    </button>
                    <div class="absolute -top-4 left-6 w-24 h-32 rounded-lg overflow-hidden shadow-xl z-20 cursor-pointer" onclick="navigate('stylist_profile_portfolio')">
                        <img class="w-full h-full object-cover" src="${photo}" alt="${nom}"/>
                    </div>
                    <div class="flex flex-col h-full justify-between">
                        <div>
                            <div class="flex justify-between items-start">
                                <h4 class="font-headline font-bold text-lg text-on-surface cursor-pointer" onclick="navigate('stylist_profile_portfolio')">${nom}</h4>
                                <div class="flex items-center gap-1 bg-white/80 dark:bg-stone-800/80 px-2 py-0.5 rounded-full">
                                    <span class="material-symbols-outlined text-amber-500 text-sm notranslate" translate="no" style="font-variation-settings: 'FILL' 1;">star</span>
                                    <span class="text-[11px] font-bold">5.0</span>
                                </div>
                            </div>
                            <p class="text-xs text-stone-500 dark:text-stone-400 mb-4">${specialite}</p>
                        </div>
                        <div class="flex justify-between items-center gap-2">
                            <span class="text-primary font-bold text-sm">$${tarif}/hr</span>
                            <div class="flex gap-2">
                                <button onclick="navigate('stylist_profile_portfolio')" class="border border-primary text-primary px-3 py-1.5 rounded-full text-[11px] font-bold hover:bg-primary/10 transition-colors active:scale-95">View Details</button>
                                <button onclick="openBookingModal('${nom.replace(/'/g, "\\'")}')" class="bg-primary text-white px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md hover:opacity-90 active:scale-95 transition-all">Book Now</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

            containers.forEach(container => {
                container.insertAdjacentHTML('beforeend', cardHTML);
            });
        });
    } catch (err) {
        console.error('Error fetching approved stylists:', err);
    }
}

// ----- Bookings Fetch Loader -----
let appointmentsLoaded = false;
async function loadAppointments() {
    if (appointmentsLoaded) return;
    const db = window._glamDB;
    const fs = window._glamFirestore;
    if (!db || !fs) {
        window.addEventListener('firestore-ready', loadAppointments);
        return;
    }
    appointmentsLoaded = true;

    try {
        const userStr = sessionStorage.getItem('glamathome_user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user || !user.uid) {
            return;
        }

        // Fetch bookings for this user
        const q = fs.query(fs.collection(db, "bookings"), fs.where("userId", "==", user.uid));
        const querySnapshot = await fs.getDocs(q);
        
        const container = document.getElementById('appointments-container');
        if (!container) return;
        
        let upcomingHTML = '';
        let pastHTML = '';
        const now = new Date();

        if (querySnapshot.empty) {
            container.innerHTML = '<p class="text-on-surface-variant text-center py-6 text-sm">No appointments found.</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const data = doc.data();
            
            // Only show "en attente" or "approuvé" (or assume others are completed/cancelled)
            if (data.status !== 'en attente' && data.status !== 'approuvé') {
                // optionally filter them out or just display them with a default label
            }
            
            const dateStr = data.dateRendezVous; // e.g. "2026-06-24T16:01"
            const aptDate = new Date(dateStr);
            const isPast = aptDate < now;
            
            const stylistName = data.stylistId || data.stylist || 'Stylist';
            const serviceName = data.service || 'Service';
            // Parse date to readable format
            const formattedDate = !isNaN(aptDate) ? aptDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : dateStr;
            const formattedTime = !isNaN(aptDate) ? aptDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '';

            let statusDisplay = isPast ? 'Completed' : 'Pending';
            if (!isPast && data.status === 'approuvé') statusDisplay = 'Approved';
            if (!isPast && data.status === 'en attente') statusDisplay = 'Pending';

            const aptCard = `
            <div class="relative pt-6 ${isPast ? 'past-apt' : 'upcoming-apt'} apt-card" ${isPast ? 'style="display:none;"' : ''}>
                <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative z-10 ${isPast ? 'opacity-70' : ''}">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="flex-1 space-y-3">
                            <div class="flex justify-between items-start">
                                <div>
                                    <h3 class="font-headline text-xl font-bold text-on-surface">${stylistName}</h3>
                                    <p class="text-primary font-medium">${serviceName}</p>
                                </div>
                                <div class="bg-primary-fixed/50 px-3 py-1 rounded-full">
                                    <span class="text-[10px] font-bold text-on-primary-fixed-variant uppercase">${statusDisplay}</span>
                                </div>
                            </div>
                            <div class="flex flex-wrap gap-4 pt-2">
                                <div class="flex items-center gap-2 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg notranslate" translate="no">calendar_today</span>
                                    <span class="text-sm">${formattedDate !== 'Invalid Date' ? formattedDate : dateStr}</span>
                                </div>
                                <div class="flex items-center gap-2 text-on-surface-variant">
                                    <span class="material-symbols-outlined text-lg notranslate" translate="no">schedule</span>
                                    <span class="text-sm">${formattedTime !== 'Invalid Date' ? formattedTime : ''}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;

            if (isPast) pastHTML += aptCard;
            else upcomingHTML += aptCard;
        });

        if (!upcomingHTML && !pastHTML) {
            container.innerHTML = '<p class="text-on-surface-variant text-center py-6 text-sm">No approved appointments found.</p>';
        } else {
            container.innerHTML = upcomingHTML + pastHTML;
        }

    } catch (err) {
        console.error('Error fetching appointments:', err);
        const container = document.getElementById('appointments-container');
        if (container) container.innerHTML = '<p class="text-red-500 text-center py-6 text-sm">Failed to load appointments.</p>';
    }
}

// ----- Card Management -----
window.currentActiveCard = null;

window.openCardOptionsModal = function(cardElement) {
    window.currentActiveCard = cardElement;
    document.getElementById('card-options-modal').classList.remove('hidden');
};

document.getElementById('btn-edit-card')?.addEventListener('click', () => {
    if (!window.currentActiveCard) return;
    document.getElementById('card-options-modal').classList.add('hidden');
    window.editCard(window.currentActiveCard);
});

document.getElementById('btn-delete-card')?.addEventListener('click', () => {
    if (!window.currentActiveCard) return;
    document.getElementById('card-options-modal').classList.add('hidden');
    window.deleteCard(window.currentActiveCard);
});

// ----- Edit Card -----
window.editCard = function(cardElement) {
    if (!cardElement) return;
    
    // Get stored data
    const last4 = cardElement.getAttribute('data-last4') || '';
    const expiry = cardElement.getAttribute('data-expiry') || '';
    const holder = cardElement.getAttribute('data-holder') || '';

    // Pre-fill modal
    document.getElementById('new-card-number').value = '';
    document.getElementById('new-card-number').placeholder = `•••• •••• •••• ${last4}`;
    document.getElementById('new-card-expiry').value = expiry;
    document.getElementById('new-card-cvc').value = '';

    // Show modal
    document.getElementById('add-card-modal').classList.remove('hidden');

    // Remove the old card when they hit save
    const saveBtn = document.getElementById('save-new-card-btn');
    const newSaveHandler = () => {
        deleteCard(cardElement, true); 
        saveBtn.removeEventListener('click', newSaveHandler);
    };
    saveBtn.addEventListener('click', newSaveHandler);
};

// Update deleteCard to accept a silent flag to skip confirm
window.deleteCard = function(cardElement, silent = false) {
    if (!cardElement) return;
    if (silent || confirm("Are you sure you want to delete this card?")) {
        cardElement.style.transition = 'opacity 0.3s, transform 0.3s';
        cardElement.style.opacity = '0';
        cardElement.style.transform = 'scale(0.95)';
        setTimeout(() => cardElement.remove(), 300);

        const savedCards = JSON.parse(sessionStorage.getItem('glamathome_cards') || '[]');
        const cardIndex = [...document.querySelectorAll('.payment-card-item')].indexOf(cardElement);
        if (cardIndex >= 0) savedCards.splice(cardIndex, 1);
        sessionStorage.setItem('glamathome_cards', JSON.stringify(savedCards));
    }
};
