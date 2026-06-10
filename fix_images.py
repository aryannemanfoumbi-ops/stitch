import re

html_path = 'index.html'
with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove 'user-profile-img' from everywhere
content = content.replace('user-profile-img ', '')
content = content.replace('user-profile-img', '')

# Now let's carefully add 'user-avatar-img' to the right places.
# 1. Sidebar avatar (inside <div id="global-sidebar")
# 2. Profile screen avatar (inside <div id="screen-user_profile_settings")
# 3. Headers of chats, bookings, favorites
# The user profile photo in the sidebar is around line 2150 with a specific google link or just an img inside <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-[#f4a28c]">
# The profile screen avatar is around line 1970
# The header avatars are inside <header ...> ... <img ...> ... </header>

# Let's just find all headers and add user-avatar-img to the images inside them
headers = re.split(r'(?=<header)', content)
for i in range(1, len(headers)):
    if '</header>' in headers[i]:
        header_part, rest = headers[i].split('</header>', 1)
        # Find img in header_part
        header_part = re.sub(r'<img([^>]*)class="([^"]*)"', r'<img\1class="user-avatar-img \2"', header_part)
        headers[i] = header_part + '</header>' + rest

content = ''.join(headers)

# Sidebar avatar
sidebar_split = content.split('<div id="global-sidebar"')
if len(sidebar_split) > 1:
    sidebar_content = sidebar_split[1]
    # find the first img
    sidebar_content = re.sub(r'<img([^>]*)class="([^"]*)"', r'<img\1class="user-avatar-img \2"', sidebar_content, count=1)
    content = sidebar_split[0] + '<div id="global-sidebar"' + sidebar_content

# Profile screen avatar
profile_split = content.split('<div id="screen-user_profile_settings"')
if len(profile_split) > 1:
    profile_content = profile_split[1]
    # find the first img which is the avatar
    profile_content = re.sub(r'<img([^>]*)class="([^"]*)"', r'<img\1class="user-avatar-img \2"', profile_content, count=1)
    content = profile_split[0] + '<div id="screen-user_profile_settings"' + profile_content

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("HTML images fixed.")
