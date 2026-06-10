import re

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Bug 5: Translate
content = re.sub(r'<html([^>]*)>', r'<html\1 translate="no">', content)
if 'translate="no" translate="no"' in content:
    content = content.replace('translate="no" translate="no"', 'translate="no"')

# Ensure notranslate in head
if '<meta name="google" content="notranslate">' not in content:
    content = content.replace('<head>', '<head>\n    <meta name="google" content="notranslate">')

# material-symbols-outlined
def replace_material(m):
    c = m.group(1)
    if 'notranslate' not in c:
        return f'<span class="{c} notranslate"'
    return m.group(0)

content = re.sub(r'<span class="([^"]*material-symbols-outlined[^"]*)"', replace_material, content)

# Bug 2: Upcoming / Past tabs
content = content.replace('Upcoming\n            </button>', 'Upcoming\n            </button>').replace('<button class="flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 bg-white text-primary shadow-sm active:scale-95 transition-all duration-200">\n                Upcoming', '<button id="tab-upcoming" class="flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 bg-white text-primary shadow-sm active:scale-95 transition-all duration-200">\n                Upcoming')
content = content.replace('<button class="flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200">\n                Past', '<button id="tab-past" class="flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-300 text-on-surface-variant hover:text-primary active:scale-95 transition-all duration-200">\n                Past')

# Add upcoming-apt class to existing cards
content = content.replace('<!-- Appointment Card 1: Specialist Spotlight Layout -->\n<div class="relative pt-6">', '<!-- Appointment Card 1: Specialist Spotlight Layout -->\n<div class="relative pt-6 upcoming-apt apt-card">')
content = content.replace('<!-- Appointment Card 2 -->\n<div class="relative pt-6">', '<!-- Appointment Card 2 -->\n<div class="relative pt-6 upcoming-apt apt-card">')

# Add a dummy past appointment
dummy_past = """
<!-- Appointment Card Past -->
<div class="relative pt-6 past-apt apt-card" style="display:none;">
<div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm relative z-10 opacity-70">
<div class="flex flex-col md:flex-row gap-6">
<div class="flex-1 space-y-3">
<div class="flex justify-between items-start">
<div>
<h3 class="font-headline text-xl font-bold text-on-surface">Alex Smith</h3>
<p class="text-primary font-medium">Classic Haircut</p>
</div>
<div class="bg-outline-variant/20 px-3 py-1 rounded-full">
<span class="text-[10px] font-bold text-on-surface-variant uppercase">Completed</span>
</div>
</div>
<div class="flex flex-wrap gap-4 pt-2">
<div class="flex items-center gap-2 text-on-surface-variant">
<span class="material-symbols-outlined text-lg notranslate" data-icon="calendar_today">calendar_today</span>
<span class="text-sm">Sep 15, 2023</span>
</div>
</div>
</div>
</div>
</div>
</div>
"""
content = content.replace('<!-- Appointment Card 2 -->', dummy_past + '\n<!-- Appointment Card 2 -->')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Translations and tabs HTML setup done.")
