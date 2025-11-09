# Replace emojis with ASCII equivalents in markdown files

# Emoji to ASCII mapping
$replacements = @{
    # Goals and targets
    '🎯' = '[TARGET]'
    '🚀' = '[LAUNCH]'
    '⭐' = '[STAR]'
    '🌟' = '[STAR]'
    '💎' = '[GEM]'
    
    # Status indicators
    '✅' = '[OK]'
    '❌' = '[NO]'
    '⚠️' = '[WARNING]'
    '🔄' = '[REFRESH]'
    '⏰' = '[TIME]'
    
    # Actions
    '💪' = '[STRONG]'
    '🔥' = '[HOT]'
    '💡' = '[IDEA]'
    '🔧' = '[TOOL]'
    '🛠️' = '[TOOLS]'
    '🔒' = '[SECURE]'
    '🔑' = '[KEY]'
    '🔍' = '[SEARCH]'
    
    # Celebration
    '🎉' = '[SUCCESS]'
    '🏆' = '[WINNER]'
    '🎁' = '[GIFT]'
    '🎨' = '[ART]'
    
    # Communication
    '📊' = '[CHART]'
    '📈' = '[GROWTH]'
    '📋' = '[LIST]'
    '📜' = '[SCROLL]'
    '📝' = '[NOTE]'
    '📚' = '[DOCS]'
    '📅' = '[CALENDAR]'
    '📞' = '[PHONE]'
    '💬' = '[CHAT]'
    
    # Web and tech
    '🌍' = '[WORLD]'
    '🌐' = '[GLOBE]'
    '💻' = '[COMPUTER]'
    '🖥️' = '[DESKTOP]'
    '📱' = '[MOBILE]'
    '🖱️' = '[MOUSE]'
    '⌨️' = '[KEYBOARD]'
    '🖨️' = '[PRINTER]'
    '📡' = '[SATELLITE]'
    '💾' = '[SAVE]'
    '🗄️' = '[DATABASE]'
    
    # OS and systems
    '🐧' = '[LINUX]'
    '🪟' = '[WINDOWS]'
    
    # Countries/flags
    '🇨🇭' = '[CH]'
    '🇪🇺' = '[EU]'
    '🇺🇸' = '[US]'
    '🇸🇬' = '[SG]'
    '🇯🇵' = '[JP]'
    '🇧🇷' = '[BR]'
    '🇮🇳' = '[IN]'
    '🇩🇪' = '[DE]'
    '🇫🇷' = '[FR]'
    '🇳🇱' = '[NL]'
    '🇦🇸' = '[AS]'
    
    # Misc
    '🎓' = '[GRADUATE]'
    '🤔' = '[THINK]'
    '🧪' = '[TEST]'
    '☕' = '[COFFEE]'
    '🆘' = '[SOS]'
    '🎬' = '[ACTION]'
    '🛡️' = '[SHIELD]'
    '🤝' = '[HANDSHAKE]'
    '🙏' = '[THANKS]'
    '💰' = '[MONEY]'
    '💸' = '[CASH]'
    '🗳️' = '[VOTE]'
    '🎵' = '[MUSIC]'
    '📷' = '[PHOTO]'
    '🎥' = '[VIDEO]'
}

Write-Host "Emoji to ASCII Replacement Tool" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Get all markdown files
$mdFiles = Get-ChildItem -Path "C:\Projects\FRW - Free Web Modern" -Filter "*.md" -Recurse -File

$totalFiles = 0
$totalReplacements = 0

foreach ($file in $mdFiles) {
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    # Replace each emoji with its ASCII equivalent
    foreach ($emoji in $replacements.Keys) {
        $ascii = $replacements[$emoji]
        $count = ([regex]::Matches($content, [regex]::Escape($emoji))).Count
        if ($count -gt 0) {
            $content = $content -replace [regex]::Escape($emoji), $ascii
            $fileReplacements += $count
        }
    }
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "✓ $($file.Name): $fileReplacements replacements" -ForegroundColor Green
        $totalFiles++
        $totalReplacements += $fileReplacements
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Done!" -ForegroundColor Green
Write-Host "Files updated: $totalFiles" -ForegroundColor Yellow
Write-Host "Total replacements: $totalReplacements" -ForegroundColor Yellow
