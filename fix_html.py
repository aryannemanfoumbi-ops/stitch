import re

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add meta tag for google notranslate
if '<meta name="google" content="notranslate">' not in content:
    content = content.replace('<head>', '<head>\n    <meta name="google" content="notranslate">')

# Add translate='no' to body
if 'translate="no"' not in content.split('>', 1)[1].split('<body')[1].split('>')[0]:
    content = content.replace('<body class="', '<body translate="no" class="')

# Add translate='no' to all material-symbols-outlined
content = re.sub(r'<span class="([^"]*material-symbols-outlined[^"]*)"(?!.*translate="no")', r'<span class="\1" translate="no"', content)

# Problem 2: Find all headers in the app and make sure their profile images have the user-profile-img class
# Let's find images inside headers
def replace_img_in_header(m):
    img_tag = m.group(0)
    if 'user-profile-img' not in img_tag:
        return img_tag.replace('class="', 'class="user-profile-img ')
    return img_tag

# Only target profile images that have classes like w-10 h-10 rounded-full in headers
content = re.sub(r'<img[^>]*class="[^"]*w-full h-full object-cover[^"]*"[^>]*src="[^"]*"[^>]*>', replace_img_in_header, content)

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('HTML translations and profile images fixed')
