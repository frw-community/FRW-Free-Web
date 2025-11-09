# Replace common emojis with ASCII equivalents
# Using unicode ranges to avoid encoding issues

$files = Get-ChildItem -Path "." -Filter "*.md" -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -match '[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]') {
        # Replace common emojis
        $content = $content -replace '\u{1F3AF}', '[TARGET]'  # 🎯
        $content = $content -replace '\u{1F680}', '[LAUNCH]'  # 🚀
        $content = $content -replace '\u{2705}', '[OK]'       # ✅
        $content = $content -replace '\u{274C}', '[NO]'       # ❌
        $content = $content -replace '\u{26A0}\u{FE0F}?', '[WARNING]'  # ⚠️
        $content = $content -replace '\u{1F4AA}', '[STRONG]'  # 💪
        $content = $content -replace '\u{1F30D}', '[WORLD]'   # 🌍
        $content = $content -replace '\u{1F525}', '[HOT]'     # 🔥
        $content = $content -replace '\u{1F4A1}', '[IDEA]'    # 💡
        $content = $content -replace '\u{1F4CA}', '[CHART]'   # 📊
        $content = $content -replace '\u{1F389}', '[SUCCESS]' # 🎉
        $content = $content -replace '\u{1F3C6}', '[WINNER]'  # 🏆
        
        # Remove any remaining emojis
        $content = $content -replace '[\u{1F300}-\u{1F9FF}]', ''
        $content = $content -replace '[\u{2600}-\u{26FF}]', ''
        $content = $content -replace '[\u{2700}-\u{27BF}]', ''
        
        Set-Content $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)" -ForegroundColor Green
    }
}

Write-Host "Done!" -ForegroundColor Cyan
