import re

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# FEATURE 1: Add "Service Locations" section between Contact Info and Payment & Wallet
# ============================================================
service_locations_html = '''<!-- Service Locations -->
<section id="service-locations-section" class="space-y-4">
<h3 class="font-headline text-lg font-semibold text-on-surface px-2">Service Locations</h3>
<div class="bg-surface-container-lowest rounded-lg p-6 space-y-4 shadow-sm shadow-outline-variant/5">
<div id="saved-addresses-list">
<!-- Default saved address -->
<div class="saved-address-card bg-surface-container-low rounded-xl p-4 flex items-start gap-4" data-address="124 Elegant Way, Apt 4B, Istanbul">
<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-1">
<span class="material-symbols-outlined notranslate" translate="no">home</span>
</div>
<div class="flex-1">
<div class="flex items-center gap-2 mb-1">
<p class="font-body font-semibold text-on-surface text-sm">Home</p>
<span class="bg-primary-fixed/50 text-on-primary-fixed-variant text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Default</span>
</div>
<p class="text-on-surface-variant text-sm">124 Elegant Way, Apt 4B, Istanbul</p>
<p class="text-xs text-primary mt-1 italic">Stylist Note: Ring doorbell, 3rd floor. Parking available behind building.</p>
</div>
<button class="text-on-surface-variant hover:text-primary transition-colors mt-1">
<span class="material-symbols-outlined text-lg notranslate" translate="no">edit</span>
</button>
</div>
</div>
<button id="add-new-location-btn" class="w-full py-3 border border-dashed border-outline-variant/40 rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-lowest transition-colors active:scale-95 transition-all duration-200">
<span class="material-symbols-outlined text-primary text-lg notranslate" translate="no">add_location</span>
<span class="font-body text-sm font-medium text-on-surface-variant">Add new location</span>
</button>
</div>
</section>
'''

# Insert after Contact Information section (line: </section> before Payment & Wallet)
contact_end = '<!-- Payment &amp; Wallet -->'
# Actually, the pattern is: after </section> that closes Contact Info and before <!-- Payment & Wallet -->
# The section closes with </section> at line 2085, then <!-- Payment & Wallet --> at line 2086
old_payment_marker = '''</section>
<!-- Payment &amp; Wallet -->'''

# Need to find the correct location - after Contact Information section ends
# Contact section ends at </section> on line 2085, then Payment starts at line 2086
content = content.replace(
    '</section>\r\n<!-- Payment &amp; Wallet -->',
    '</section>\r\n' + service_locations_html + '\r\n<!-- Payment &amp; Wallet -->',
    1
)
# Also try without \r
content = content.replace(
    '</section>\n<!-- Payment &amp; Wallet -->',
    '</section>\n' + service_locations_html + '\n<!-- Payment &amp; Wallet -->',
    1
)

# ============================================================
# FEATURE 2: Delete static stylist cards from home screen, beauty services, discover
# Replace with dynamic containers
# ============================================================

# --- HOME SCREEN (screen-glamathome_home_screen) ---
# Replace the "Top Rated Stylists" section content (lines 1362-1442)
home_static_stylists = re.compile(
    r'(<!-- Top Rated Stylists \(Vertical List\) -->.*?<div class="flex justify-between items-center mb-6">.*?</div>\s*<div class="space-y-6">).*?(</div>\s*</section>\s*</main>)',
    re.DOTALL
)

home_dynamic_container = r'''\1
<div id="home-stylists-container">
<!-- Dynamic stylists loaded from Firestore -->
<div class="flex items-center justify-center py-12">
<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
<span class="ml-3 text-on-surface-variant text-sm">Loading stylists...</span>
</div>
</div>
\2'''

content = home_static_stylists.sub(home_dynamic_container, content, count=1)

# --- BEAUTY SERVICES (screen-glamathome_beauty_services) ---
beauty_static_stylists = re.compile(
    r'(<!-- Top Rated Stylists \(Vertical List\) -->.*?<div class="flex justify-between items-center mb-6">.*?</div>\s*<div class="space-y-6">).*?(</div>\s*</section>\s*</main>)',
    re.DOTALL
)
# This will match the SECOND occurrence (first was already replaced)
beauty_dynamic_container = r'''\1
<div id="beauty-stylists-container">
<!-- Dynamic stylists loaded from Firestore -->
<div class="flex items-center justify-center py-12">
<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
<span class="ml-3 text-on-surface-variant text-sm">Loading stylists...</span>
</div>
</div>
\2'''

content = beauty_static_stylists.sub(beauty_dynamic_container, content, count=1)

# --- DISCOVER (screen-discover_styles_stylists) ---
# Replace the Featured Stylists section
discover_static = re.compile(
    r'(<!-- Featured Stylists Section -->.*?<div class="space-y-10">).*?(</div>\s*</section>\s*</main>)',
    re.DOTALL
)
discover_dynamic_container = r'''\1
<div id="discover-stylists-container">
<!-- Dynamic stylists loaded from Firestore -->
<div class="flex items-center justify-center py-12">
<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
<span class="ml-3 text-on-surface-variant text-sm">Loading stylists...</span>
</div>
</div>
\2'''

content = discover_static.sub(discover_dynamic_container, content, count=1)


# ============================================================
# FEATURE 5: Delete static appointment cards from My Appointments
# Replace with dynamic containers
# ============================================================
appointments_static = re.compile(
    r'(<!-- Booking List -->\s*<div class="space-y-8">).*?(<!-- Empty Space/Editorial Tip -->)',
    re.DOTALL
)
appointments_dynamic = r'''\1
<div id="appointments-container">
<!-- Dynamic appointments loaded from Firestore -->
<div class="flex items-center justify-center py-12">
<div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
<span class="ml-3 text-on-surface-variant text-sm">Loading appointments...</span>
</div>
</div>
\2'''

content = appointments_static.sub(appointments_dynamic, content, count=1)


# ============================================================
# FEATURE 6: Remove hardcoded default-saved-card
# ============================================================
# Remove the default saved card div
default_card_pattern = re.compile(
    r'<!-- Saved Card -->\s*<div id="default-saved-card".*?</div>\s*</div>\s*</div>\s*</div>',
    re.DOTALL
)
# More targeted: find the #default-saved-card element
content = re.sub(
    r'<!-- Saved Card -->\s*<div id="default-saved-card"[^>]*>.*?</div>\s*</div>\s*</div>\s*</div>',
    '<!-- Cards will be added dynamically -->',
    content,
    count=1,
    flags=re.DOTALL
)

# ============================================================
# Add Firebase Firestore script imports before </body>
# ============================================================
firebase_scripts = '''
<!-- Firebase SDK for Firestore -->
<script type="module">
    import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
    import { getFirestore, collection, query, where, getDocs, addDoc, orderBy, Timestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
    
    const firebaseConfig = {
        apiKey: "AIzaSyBQlgAINBRM3YvG_GGGF4J2gsEstoBDe6k",
        authDomain: "glamathome-30bfd.firebaseapp.com",
        projectId: "glamathome-30bfd",
        storageBucket: "glamathome-30bfd.firebasestorage.app",
        messagingSenderId: "126884062776",
        appId: "1:126884062776:web:24a303108fbb611af0e8cd"
    };
    
    const fbApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const db = getFirestore(fbApp);
    
    // Expose globally for app.js
    window._glamDB = db;
    window._glamFirestore = { collection, query, where, getDocs, addDoc, orderBy, Timestamp };
    
    // Dispatch event to signal Firestore is ready
    window.dispatchEvent(new Event('firestore-ready'));
</script>
'''

content = content.replace('</body>', firebase_scripts + '\n<script src="app.js"></script>\n</body>')

# Remove any existing <script src="app.js"> that's NOT in the newly added block
# Check if app.js is already loaded somewhere
existing_appjs_count = content.count('<script src="app.js">')
if existing_appjs_count > 1:
    # Remove the first occurrence (keep the last one we just added)
    content = content.replace('<script src="app.js"></script>\n', '', existing_appjs_count - 1)


with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ All HTML changes applied successfully!")
print("  - Feature 1: Service Locations section added")
print("  - Feature 2: Static stylist cards replaced with dynamic containers")
print("  - Feature 5: Static appointment cards replaced with dynamic containers")
print("  - Feature 6: Default credit card removed")
print("  - Firebase Firestore SDK imported")
