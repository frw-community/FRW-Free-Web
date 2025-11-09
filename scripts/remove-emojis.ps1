# Remove all emojis from markdown files

# List of common emojis used in docs
$emojis = @(
    '🎯', '🚀', '✅', '❌', '⚠️', '💪', '🌍', '🔥', '💡', '📊',
    '🎉', '🏆', '📜', '⭐', '🗳️', '💰', '🎓', '🤔', '📋', '🛠️',
    '🔧', '🧪', '📈', '💻', '🖥️', '🐧', '🪟', '🇨🇭', '🇪🇺', '🇺🇸',
    '🇸🇬', '🇯🇵', '🇧🇷', '🇮🇳', '🇩🇪', '🇫🇷', '🇳🇱', '🇦🇸', '☕',
    '🔄', '🆘', '💾', '🔒', '🔍', '🌐', '🎬', '🛡️', '📅', '📞',
    '🤝', '🌟', '💎', '📝', '🙏', '🔑', '📚', '💸', '🎁', '🎨',
    '⏰', '🗄️', '🎵', '📷', '🎥', '📱', '🖱️', '⌨️', '🖨️', '📡'
)

# Get all markdown files
$mdFiles = Get-ChildItem -Path "C:\Projects\FRW - Free Web Modern" -Filter "*.md" -Recurse -File

foreach ($file in $mdFiles) {
    Write-Host "Processing: $($file.FullName)"
    
    $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remove each emoji
    foreach ($emoji in $emojis) {
        $content = $content -replace [regex]::Escape($emoji), ''
    }
    
    # Clean up multiple spaces left by emoji removal
    $content = $content -replace '  +', ' '
    
    # Clean up space at beginning of lines
    $content = $content -replace '(?m)^# ', '# '
    $content = $content -replace '(?m)^## ', '## '
    $content = $content -replace '(?m)^### ', '### '
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "  Updated!" -ForegroundColor Green
    } else {
        Write-Host "  No changes" -ForegroundColor Gray
    }
}

Write-Host "`nDone! All emojis removed from markdown files." -ForegroundColor Green
