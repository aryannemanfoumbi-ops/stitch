$tailwindConfig = @"
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "on-secondary-fixed": "#3a0915",
              "primary-container": "#f4a28c",
              "on-error-container": "#93000a",
              "on-secondary-container": "#7a3c46",
              "error-container": "#ffdad6",
              "surface-variant": "#e3e2e0",
              "surface-container-high": "#e9e8e5",
              "inverse-primary": "#ffb5a1",
              "on-primary-fixed-variant": "#703626",
              "on-secondary-fixed-variant": "#70343e",
              "background": "#faf9f6",
              "on-error": "#ffffff",
              "surface-container": "#efeeeb",
              "secondary-fixed-dim": "#ffb2bc",
              "surface-container-low": "#f4f3f1",
              "outline": "#86736e",
              "on-background": "#1a1c1a",
              "on-tertiary": "#ffffff",
              "on-tertiary-container": "#5b422a",
              "on-secondary": "#ffffff",
              "on-primary-container": "#713726",
              "secondary-container": "#feaab6",
              "primary": "#8d4d3b",
              "secondary": "#8c4b55",
              "primary-fixed": "#ffdbd1",
              "on-primary-fixed": "#390c02",
              "surface-tint": "#8d4d3b",
              "error": "#ba1a1a",
              "tertiary": "#74593f",
              "on-tertiary-fixed": "#2a1704",
              "surface-container-highest": "#e3e2e0",
              "secondary-fixed": "#ffd9dd",
              "surface-bright": "#faf9f6",
              "on-surface": "#1a1c1a",
              "on-surface-variant": "#53433f",
              "inverse-surface": "#2f312f",
              "surface-container-lowest": "#ffffff",
              "tertiary-fixed": "#ffdcbe",
              "inverse-on-surface": "#f2f1ee",
              "outline-variant": "#d8c2bc",
              "surface": "#faf9f6",
              "primary-fixed-dim": "#ffb5a1",
              "on-tertiary-fixed-variant": "#5a422a",
              "tertiary-container": "#d2b091",
              "tertiary-fixed-dim": "#e3c0a0",
              "on-primary": "#ffffff",
              "surface-dim": "#dbdad7"
            },
            fontFamily: {
              "headline": ["Manrope"],
              "body": ["Be Vietnam Pro"],
              "label": ["Be Vietnam Pro"]
            },
            borderRadius: {"DEFAULT": "1rem", "lg": "2rem", "xl": "3rem", "full": "9999px"},
          },
        },
"@

$headContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8"/>
    <meta content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" name="viewport"/>
    <title>GlamAtHome - Luxury Beauty Services</title>
    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Be+Vietnam+Pro:wght@300;400;500;600&display=swap" rel="stylesheet"/>
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
    <link rel="stylesheet" href="velvet_rose/styles.css">
    <script id="tailwind-config">
      tailwind.config = {
$tailwindConfig
      }
    </script>
    <style>
        .app-screen { display: none; width: 100%; min-height: 100vh; position: absolute; top:0; left:0; right:0; backface-visibility: hidden;}
        .app-screen.active { display: block; animation: fadeInCustom 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; position: relative;}
        @keyframes fadeInCustom { from { opacity: 0; transform: translateY(12px) scale(0.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { background: #faf9f6; overflow-x: hidden; }
        .discover-item { transition: opacity 0.3s ease; }
        .discover-item.hidden-item { display: none !important; }
        
        /* Disable scale animations on parent elements when we want to handle the specific ones manually */
        .app-screen button, .app-screen a { cursor: pointer; }
    </style>
</head>
<body class="bg-background text-on-surface font-body antialiased">
<div id="app-container" class="relative w-full min-h-screen">
"@

$folders = Get-ChildItem -Path "stitch" -Directory
$screensHtml = ""

foreach ($folder in $folders) {
    if ($folder.Name -eq "velvet_rose") { continue }
    
    $codePath = Join-Path $folder.FullName "code.html"
    if (Test-Path $codePath) {
        $html = Get-Content -Path $codePath -Raw -Encoding UTF8
        
        if ($html -match '(?si)<body[^>]*>(.*?)</body>') {
            $bodyContent = $matches[1]
            
            # Remove raw nav blocks and script tags
            $bodyContent = [regex]::Replace($bodyContent, '(?si)<nav.*?</nav>', '')
            $bodyContent = [regex]::Replace($bodyContent, '(?si)<script.*?</script>', '')
            
            # Remove Floating Message Buttons permanently globally
            $bodyContent = [regex]::Replace($bodyContent, '(?si)<div[^>]*class="[^"]*fixed bottom-[0-9]+\s+right-[0-9]+[^"]*"[^>]*>.*?</div>', '')
            
            # Global Interactive scaling explicitly on all standard interactive bounds inside app screens
            $bodyContent = [regex]::Replace($bodyContent, '(?si)<([aA|button])([^>]*)class="([^"]*)"', '<$1$2class="$3 active:scale-95 transition-all duration-200"')
            # Also handle elements without class
            # Ensure elements inside .bg-surface-container-low which are mostly clickable also get tactile feedback dynamically
            $bodyContent = [regex]::Replace($bodyContent, '(?si)class="([^"]*bg-surface-container-low[^"]*rounded-xl[^"]*)"', 'class="$1 active:scale-[0.98] transition-transform"')
            
            # Inject Filter Pills directly into 'discover_styles_stylists' HTML after Main tags or before Category trending styles.
            if ($folder.Name -eq "discover_styles_stylists") {
                $pillInjection = @"
                <div class="mb-8 mt-2 px-1">
                    <div id="discover-pill-filter" class="flex gap-3 overflow-x-auto no-scrollbar pb-2 pt-1">
                        <button class="filter-pill active whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs bg-stone-800 text-white shadow-md active:scale-95 transition-all" data-filter="all">All Styles</button>
                        <button class="filter-pill whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs bg-surface-container-high text-stone-500 hover:bg-stone-200 hover:text-stone-700 active:scale-95 transition-all outline-none" data-filter="women">Women's Hair & Beauty</button>
                        <button class="filter-pill whitespace-nowrap px-6 py-2.5 rounded-full font-bold text-xs bg-surface-container-high text-stone-500 hover:bg-stone-200 hover:text-stone-700 active:scale-95 transition-all outline-none" data-filter="men">Men's Grooming & Barber</button>
                    </div>
                </div>
"@
                # Prepend to the <main> block right after its opening
                $bodyContent = [regex]::Replace($bodyContent, '(?si)(<main[^>]*>)', "`$1 $pillInjection")
                
                # Tag articles/divs explicitly so the JS loop can find them easily for display none toggling
                $bodyContent = [regex]::Replace($bodyContent, '(?si)<div class="flex-none', '<div class="flex-none discover-item')
                # Second fallback for other possible wrappers identifying items in discovering UI
                $bodyContent = [regex]::Replace($bodyContent, '(?si)<div class="relative bg-surface-container-lowest', '<div class="relative bg-surface-container-lowest discover-item')
            }

            $screenId = "screen-" + $folder.Name
            $activeClass = if ($folder.Name -eq "glamathome_home_screen") { "active" } else { "hidden" }
            
            $screensHtml += "`n<!-- Screen: $($folder.Name) -->`n"
            $screensHtml += "<div id=`"$screenId`" class=`"app-screen $activeClass w-full min-h-[100dvh]`">`n"
            $screensHtml += $bodyContent
            $screensHtml += "`n</div>`n"
        }
    }
}

$sidebarHtml = @"
<!-- Hamburger Overlay Sidebar -->
<div id="global-sidebar-overlay" class="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10001] hidden transition-opacity opacity-0"></div>
<div id="global-sidebar" class="fixed inset-y-0 left-0 w-72 bg-[#faf9f6] z-[10002] shadow-2xl transform -translate-x-full transition-transform duration-300 ease-in-out">
    <div class="p-6 h-full flex flex-col pt-16 relative">
        <button id="close-sidebar" class="absolute top-6 right-6 text-stone-500 hover:text-[#8d4d3b] active:scale-95 transition-all outline-none">
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>
        <div class="flex items-center gap-4 mb-10 pb-6 border-b border-stone-200">
            <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-[#f4a28c]">
                <!-- Static avatar referencing previous URL injected -->
                <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6A_JS07M-ZP7ljSBOGtaZgfCTolnvGsOGvQWnyFfLGmFYA07rMfUjRubvtVECOl7ZP7aeoO9Kt6yB6F_iu4sqHmGbhvzvu0cFgbzkPaYYq33JvoBJuahhuHYFmfiBQDbC9B3WKwmr-BPKsMY4c8kH5tgZ-0HoW7Ls7_TG6WTyRbh94zIXwkwD0K9tjAtqg64h3v9xGc3DhhHJ8yvKCzyh6u1_VrosTKRA7LP0nY4YKuXaXjzGlb1Zy3yvyw6WwIxmM8I8QKELBbWs" class="w-full h-full object-cover">
            </div>
            <div>
                <h3 class="font-headline font-bold text-lg text-[#8d4d3b] leading-tight">Sarah J.</h3>
                <p class="text-[10px] text-stone-500 uppercase tracking-widest font-bold mt-0.5">Premium Member</p>
            </div>
        </div>
        <div class="flex flex-col gap-2 flex-grow">
            <button class="sidebar-link flex items-center gap-4 p-4 rounded-xl hover:bg-[#f4a28c]/10 text-stone-600 hover:text-[#8d4d3b] transition-colors text-left active:scale-95 outline-none" data-target="user_profile_settings">
                <span class="material-symbols-outlined">person</span>
                <span class="font-bold text-sm tracking-wide">Profile</span>
            </button>
            <button class="sidebar-link flex items-center gap-4 p-4 rounded-xl hover:bg-[#f4a28c]/10 text-stone-600 hover:text-[#8d4d3b] transition-colors text-left active:scale-95 outline-none" data-target="user_profile_settings">
                <span class="material-symbols-outlined">settings</span>
                <span class="font-bold text-sm tracking-wide">Settings</span>
            </button>
            <div class="mt-auto border-t border-stone-200 pt-4">
                <button class="flex items-center gap-4 p-4 w-full text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left active:scale-95 outline-none">
                    <span class="material-symbols-outlined">logout</span>
                    <span class="font-bold text-sm tracking-wide">Logout</span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Notifications Dropdown -->
<div id="global-notifications-dropdown" class="fixed top-16 right-4 w-80 bg-white rounded-2xl shadow-2xl z-[10000] hidden border border-stone-100 overflow-hidden transform origin-top-right transition-all scale-95 opacity-0">
    <div class="bg-gradient-to-r from-[#8d4d3b] to-[#f4a28c] p-4 text-white flex justify-between items-center">
        <h3 class="font-headline font-bold">Notifications</h3>
        <span class="text-[10px] uppercase font-bold bg-white/20 px-2 py-1 rounded-full text-white">3 New</span>
    </div>
    <div class="max-h-80 overflow-y-auto">
        <div class="p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer active:scale-[0.98]">
            <p class="font-bold text-sm text-stone-800">Booking Confirmed</p>
            <p class="text-xs text-stone-500 mt-1">Your appointment with Elena is set for tomorrow at 2 PM.</p>
        </div>
        <div class="p-4 border-b border-stone-100 hover:bg-stone-50 transition-colors cursor-pointer active:scale-[0.98]">
            <p class="font-bold text-sm text-[#8d4d3b]">New Stylist Match</p>
            <p class="text-xs text-stone-500 mt-1">Based on your recent AI analysis, we found 2 local specialists.</p>
        </div>
        <div class="p-4 hover:bg-stone-50 transition-colors cursor-pointer active:scale-[0.98]">
            <p class="font-bold text-sm text-stone-800">Payment Processed</p>
            <p class="text-xs text-stone-500 mt-1">Receipt for `$85.00 has been sent to your email.</p>
        </div>
    </div>
</div>
"@

$navHtml = @"
<!-- Fixed Universal Bottom Navigation -->
<nav class="fixed bottom-0 left-0 w-full flex justify-around items-end px-4 pb-4 pt-3 bg-[#faf9f6]/95 backdrop-blur-xl z-[9999] shadow-[0_-8px_30px_rgba(183,110,121,0.15)] border-t border-[#f4a28c]/20 rounded-t-[2.5rem]">
    <a href="#" id="nav-btn-home" onclick="navigate('glamathome_home_screen'); return false;" class="group flex flex-col items-center justify-center text-[#86736e] hover:text-[#8d4d3b] p-2 transition-all active:scale-95 duration-200 outline-none">
        <span class="material-symbols-outlined pb-1 group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1;">home</span>
        <span class="font-['Be_Vietnam_Pro'] text-[9px] font-bold uppercase tracking-widest mt-1">Home</span>
    </a>
    <a href="#" id="nav-btn-discover" onclick="navigate('discover_styles_stylists'); return false;" class="group flex flex-col items-center justify-center text-[#86736e] hover:text-[#8d4d3b] p-2 transition-all active:scale-95 duration-200 outline-none">
        <span class="material-symbols-outlined pb-1 group-hover:scale-110 transition-transform">search</span>
        <span class="font-['Be_Vietnam_Pro'] text-[9px] font-bold uppercase tracking-widest mt-1">Discover</span>
    </a>
    <a href="#" id="nav-btn-bookings" onclick="navigate('my_appointments'); return false;" class="group flex flex-col items-center justify-center text-[#86736e] hover:text-[#8d4d3b] p-2 transition-all active:scale-95 duration-200 outline-none">
        <span class="material-symbols-outlined pb-1 group-hover:scale-110 transition-transform">calendar_month</span>
        <span class="font-['Be_Vietnam_Pro'] text-[9px] font-bold uppercase tracking-widest mt-1">Bookings</span>
    </a>
    <a href="#" id="nav-btn-favorites" onclick="navigate('saved_styles_stylists'); return false;" class="group flex flex-col items-center justify-center text-[#86736e] hover:text-[#8d4d3b] p-2 transition-all active:scale-95 duration-200 outline-none">
        <span class="material-symbols-outlined pb-1 group-hover:scale-110 transition-transform">favorite</span>
        <span class="font-['Be_Vietnam_Pro'] text-[9px] font-bold uppercase tracking-widest mt-1">Favorites</span>
    </a>
    <a href="#" id="nav-btn-chats" onclick="navigate('chats'); return false;" class="group flex flex-col items-center justify-center bg-gradient-to-br from-[#8d4d3b] to-[#f4a28c] text-white rounded-full p-3 mb-2 scale-[1.12] shadow-lg shadow-[#8d4d3b]/30 active:scale-[0.98] transition-all duration-300 outline-none hover:opacity-90">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">chat_bubble</span>
        <span class="font-['Be_Vietnam_Pro'] text-[8px] font-extrabold uppercase tracking-widest mt-1">Messages</span>
    </a>
</nav>
</div>
<script src="app.js"></script>
</body>
</html>
"@

$finalHtml = $headContent + $screensHtml + $sidebarHtml + $navHtml
[System.IO.File]::WriteAllText("$PWD\index.html", $finalHtml, [System.Text.Encoding]::UTF8)
Write-Output "Successfully compiled unified SPA, injected sidebar, notification, and filters."
