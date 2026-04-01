iyimport os
import re

screens = {
    'home': 'stitch/glamathome_home_men_s_grooming_update/code.html',
    'discover': 'stitch/discover_styles_stylists/code.html',
    'bookings': 'stitch/my_appointments/code.html',
    'favorites': 'stitch/saved_styles_stylists/code.html',
    'messages': 'stitch/chats/code.html',
    'barber': 'stitch/men_s_styling_gallery/code.html',
    'ai_stylist': 'stitch/ai_style_assistant_unisex_update/code.html',
    'profile': 'stitch/user_profile_settings/code.html',
    'freelancer': 'stitch/freelancer_dashboard/code.html'
}

base_dir = r"c:\Users\HP\Downloads\stitch"

# Get base head from home
try:
    with open(os.path.join(base_dir, screens['home']), 'r', encoding='utf-8') as f:
        home_content = f.read()
except FileNotFoundError:
    print("Files not found. Make sure you are in the correct directory.")
    exit(1)

head_match = re.search(r'<head>(.*?)</head>', home_content, re.DOTALL)
head_content = head_match.group(1) if head_match else ""

# Add our custom styles.css link to head
if "styles.css" not in head_content:
    head_content += '\n<link rel="stylesheet" href="styles.css">\n'

combined_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
{head_content}
</head>
<body class="bg-background text-on-surface font-body antialiased">
<div id="app-container" class="relative w-full min-h-screen">
"""

for key, rel_path in screens.items():
    file_path = os.path.join(base_dir, rel_path)
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract body classes and contents
            body_match = re.search(r'<body([^>]*)>(.*?)</body>', content, re.DOTALL)
            if body_match:
                body_classes = body_match.group(1).replace('class="', '').replace('"', '')
                body_inner = body_match.group(2)
                
                hidden_class = "" if key == 'home' else "hidden"
                combined_html += f"""
<!-- ====== SCREEN: {key.upper()} ====== -->
<div id="screen-{key}" class="app-screen {hidden_class} w-full min-h-[100dvh]">
    <div class="screen-content {body_classes}">
        {body_inner}
    </div>
</div>
"""
    else:
        print(f"Warning: {file_path} not found.")

combined_html += """
</div>
<script src="app.js"></script>
</body>
</html>
"""

# Write final index.html
with open(os.path.join(base_dir, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(combined_html)

print("index.html combined successfully.")
