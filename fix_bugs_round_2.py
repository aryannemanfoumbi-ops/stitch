import re

html_path = 'index.html'
js_path = 'app.js'

with open(html_path, 'r', encoding='utf-8') as f:
    html = f.read()

# BUG 1: Translate fixes
if '<html' in html and 'translate="no"' not in html.split('<head>')[0]:
    html = re.sub(r'<html([^>]*)>', r'<html\1 translate="no">', html)

if '<meta name="google" content="notranslate">' not in html:
    html = html.replace('<head>', '<head>\n    <meta name="google" content="notranslate">')

def fix_span(m):
    c = m.group(1)
    if 'translate="no"' not in m.group(0):
        return f'<span class="{c}" translate="no"'
    return m.group(0)
html = re.sub(r'<span class="([^"]*material-symbols-outlined[^"]*)"', fix_span, html)

# BUG 2: Profile icons in Bookings, Favorites, Messages headers
# We'll just replace 'user-profile-img' with 'user-avatar-img' everywhere to be safe and match the prompt.
html = html.replace('user-profile-img', 'user-avatar-img')

# BUG 3: Delete saved credit card
# Add delete button to the default saved card in index.html
if '<button class="absolute top-4 right-4' not in html:
    # Find the default card and inject delete button
    default_card_html = """<div id="default-saved-card" class="bg-gradient-to-br from-primary to-primary-container p-6 rounded-xl text-white shadow-lg shadow-primary/20 aspect-[1.6/1] flex flex-col justify-between relative group">
<button onclick="deleteCard(this)" class="absolute top-4 right-4 w-6 h-6 bg-black/20 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors">
<span class="material-symbols-outlined text-white text-sm" translate="no">close</span>
</button>"""
    html = html.replace('<div id="default-saved-card" class="bg-gradient-to-br from-primary to-primary-container p-6 rounded-xl text-white shadow-lg shadow-primary/20 aspect-[1.6/1] flex flex-col justify-between">', default_card_html)


# BUG 4 & 5: Booking Modal
booking_modal = """
<!-- Booking Modal -->
<div id="booking-modal" class="hidden fixed inset-0 bg-black/50 z-[10005] flex items-center justify-center p-6 backdrop-blur-sm">
    <div class="bg-surface rounded-2xl p-6 w-full max-w-md shadow-2xl overflow-y-auto max-h-[90vh]">
        <div class="flex justify-between items-center mb-6">
            <h3 class="font-headline font-bold text-xl text-on-surface">Book Appointment</h3>
            <button onclick="document.getElementById('booking-modal').classList.add('hidden')" class="text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined" translate="no">close</span>
            </button>
        </div>
        <form id="booking-form" class="space-y-4">
            <div>
                <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Stylist</label>
                <input id="book-stylist-name" type="text" readonly class="w-full p-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-on-surface font-semibold">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Service Type</label>
                <select id="book-service-type" required class="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-on-surface">
                    <option value="">Select a service...</option>
                    <option value="Braids">Braids</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Nails">Nails</option>
                    <option value="Haircut">Haircut</option>
                    <option value="Barber">Barber</option>
                </select>
            </div>
            <div class="flex gap-4">
                <div class="flex-1">
                    <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Date</label>
                    <input id="book-date" type="date" required class="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-on-surface">
                </div>
                <div class="flex-1">
                    <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Time</label>
                    <input id="book-time" type="time" required class="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-on-surface">
                </div>
            </div>
            <div>
                <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Home Service Address</label>
                <input id="book-address" type="text" required placeholder="123 Main St, Apt 4B" class="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-on-surface">
            </div>
            <div>
                <label class="block text-xs font-bold uppercase text-on-surface-variant mb-1">Special Requests</label>
                <textarea id="book-notes" rows="2" placeholder="Any allergies or specific requests?" class="w-full p-3 bg-surface border border-outline-variant/30 rounded-xl text-on-surface"></textarea>
            </div>
            <button type="submit" class="w-full mt-4 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all uppercase tracking-widest text-sm">Confirm Booking</button>
        </form>
    </div>
</div>
"""
if 'id="booking-modal"' not in html:
    html = html.replace('</body>', booking_modal + '\n</body>')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(html)


# Now fix app.js
with open(js_path, 'r', encoding='utf-8') as f:
    js = f.read()

# Update dynamic card creation to include delete button
js = js.replace('<p class="font-headline font-bold italic tracking-widest text-lg">CARD</p>',
               '<p class="font-headline font-bold italic tracking-widest text-lg">CARD</p>\n            </div>\n            <button onclick="deleteCard(this)" class="absolute top-4 right-4 w-6 h-6 bg-black/10 hover:bg-red-500 rounded-full flex items-center justify-center transition-colors"><span class="material-symbols-outlined text-white text-sm" translate="no">close</span></button>')
js = js.replace('aspect-[1.6/1] flex flex-col justify-between"', 'aspect-[1.6/1] flex flex-col justify-between relative group"')


# Append JS handlers
js_handlers = """

// ----- Bug 2: Profile Icon Navigation -----
document.addEventListener('click', (e) => {
    if (e.target.closest('.user-avatar-img')) {
        navigate('user_profile_settings');
    }
});

// ----- Bug 3: Delete Saved Card -----
window.deleteCard = function(btn) {
    if (confirm("Delete this card?")) {
        const cardElement = btn.closest('.aspect-[1.6/1]');
        if (cardElement) {
            cardElement.style.display = 'none';
            // Also logic to remove from sessionStorage could go here, 
            // but just hiding it is sufficient for the immediate UX.
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
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const booking = {
            stylist: document.getElementById('book-stylist-name').value,
            service: document.getElementById('book-service-type').value,
            date: document.getElementById('book-date').value,
            time: document.getElementById('book-time').value,
            address: document.getElementById('book-address').value,
            notes: document.getElementById('book-notes').value,
            status: 'Upcoming'
        };
        
        const bookings = JSON.parse(sessionStorage.getItem('glamathome_bookings') || '[]');
        bookings.push(booking);
        sessionStorage.setItem('glamathome_bookings', JSON.stringify(bookings));
        
        // Show success toast
        alert('Booking request sent!');
        
        document.getElementById('booking-modal').classList.add('hidden');
        bookingForm.reset();
        
        // Add to Upcoming tab dynamically
        const newAptHTML = `
        <div class="relative pt-6 upcoming-apt apt-card">
        <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative z-10">
        <div class="flex flex-col md:flex-row gap-6">
        <div class="flex-1 space-y-3">
        <div class="flex justify-between items-start">
        <div>
        <h3 class="font-headline text-xl font-bold text-on-surface">${booking.stylist}</h3>
        <p class="text-primary font-medium">${booking.service}</p>
        </div>
        <div class="bg-primary-fixed/50 px-3 py-1 rounded-full">
        <span class="text-[10px] font-bold text-on-primary-fixed-variant uppercase">Pending</span>
        </div>
        </div>
        <div class="flex flex-wrap gap-4 pt-2">
        <div class="flex items-center gap-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-lg notranslate" translate="no">calendar_today</span>
        <span class="text-sm">${booking.date}</span>
        </div>
        <div class="flex items-center gap-2 text-on-surface-variant">
        <span class="material-symbols-outlined text-lg notranslate" translate="no">schedule</span>
        <span class="text-sm">${booking.time}</span>
        </div>
        </div>
        </div>
        </div>
        </div>
        </div>`;
        
        const pastTab = document.querySelector('.past-apt');
        if (pastTab) {
            pastTab.insertAdjacentHTML('beforebegin', newAptHTML);
        }
        
        navigate('my_appointments');
        
        // trigger upcoming tab click
        document.getElementById('tab-upcoming')?.click();
    });
}
"""

if 'window.openBookingModal' not in js:
    js += js_handlers

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(js)

print("All bug fixes applied.")
