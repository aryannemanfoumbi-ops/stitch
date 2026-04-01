$screens = @{
    "home" = "stitch/glamathome_home_men_s_grooming_update/code.html"
    "discover" = "stitch/discover_styles_stylists/code.html"
    "bookings" = "stitch/my_appointments/code.html"
    "favorites" = "stitch/saved_styles_stylists/code.html"
    "messages" = "stitch/chats/code.html"
    "barber" = "stitch/men_s_styling_gallery/code.html"
    "ai_stylist" = "stitch/ai_style_assistant_unisex_update/code.html"
    "profile" = "stitch/user_profile_settings/code.html"
    "freelancer" = "stitch/freelancer_dashboard/code.html"
}

$baseDir = "c:\Users\HP\Downloads\stitch"
$homePath = Join-Path $baseDir $screens["home"]

if (-Not (Test-Path $homePath)) {
    Write-Host "Home file not found."
    exit
}

$homeContent = Get-Content $homePath -Raw

# Extract <head>
$headContent = ""
if ($homeContent -match "(?s)<head>(.*?)</head>") {
    $headContent = $matches[1]
}

# Add styles.css link if missing
if (-not ($headContent -match "styles.css")) {
    $headContent += "`n<link rel=`"stylesheet`" href=`"styles.css`">`n"
}

$combinedHtml = @"
<!DOCTYPE html>
<html lang="en">
<head>
$headContent
<style>
/* Base overrides for velvet_rose style */
.app-screen { display: none; width: 100%; min-height: 100vh; }
.app-screen.active { display: block; animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
/* Force hide all default nav bars in child screens if we want one global nav, 
   or we just hide them specific to IDs. Let's keep specific per-screen navs 
   and rely on JS to update them. */
</style>
</head>
<body class="bg-background text-on-surface font-body antialiased">
<div id="app-container" class="relative w-full min-h-screen">
"@

foreach ($key in $screens.Keys) {
    # Ordered keys workaround in PS:
    # PowerShell hash tables are unordered, but order doesn't matter for independent divs.
    $relPath = $screens[$key]
    $filePath = Join-Path $baseDir $relPath
    
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        $bodyClasses = ""
        $bodyInner = ""
        
        if ($content -match "(?is)<body([^>]*)>(.*?)</body>") {
            $bodyClasses = $matches[1] -replace 'class="', '' -replace '"', ''
            $bodyInner = $matches[2]
            
            # Sub-id the divs for nav switching
            $hiddenClass = ""
            if ($key -ne "home") {
                $hiddenClass = "hidden"
            } else {
                $hiddenClass = "active"
            }
            
            # We must rename ID conflicts or just wrap in an isolated div. 
            $combinedHtml += @"

<!-- ====== SCREEN: $($key.ToUpper()) ====== -->
<div id="screen-$key" class="app-screen $hiddenClass w-full min-h-[100dvh]">
    <div class="screen-content $bodyClasses">
$bodyInner
    </div>
</div>
"@
        }
    } else {
        Write-Host "Warning: $filePath not found."
    }
}

$combinedHtml += @"

</div>
<script src="app.js"></script>
</body>
</html>
"@

Set-Content -Path (Join-Path $baseDir "index.html") -Value $combinedHtml -Encoding UTF8
Write-Host "index.html successfully built."
