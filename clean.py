import re
import os

src = 'styles.css'
dest_dir = 'velvet_rose'
dest = os.path.join(dest_dir, 'styles.css')

if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

current_file = src if os.path.exists(src) else dest

if os.path.exists(current_file):
    with open(current_file, 'r', encoding='utf-8') as f:
        css = f.read()

    prev_len = -1
    while len(css) != prev_len:
        prev_len = len(css)
        css = re.sub(r'[^\}\{]+?\{\s*\}', '', css)

    with open(dest, 'w', encoding='utf-8') as f:
        f.write(css)
    
    if current_file == src and current_file != dest:
        os.remove(src)
    print("CSS ruleset cleanup done and saved to velvet_rose/styles.css")
else:
    print("File not found")
