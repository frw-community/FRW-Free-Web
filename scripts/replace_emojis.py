#!/usr/bin/env python3
"""Replace emojis with ASCII equivalents in markdown files"""

import os
import re
from pathlib import Path

# Emoji to ASCII mapping
EMOJI_MAP = {
    # Goals and targets
    '🎯': '[TARGET]',
    '🚀': '[LAUNCH]',
    '⭐': '[STAR]',
    '🌟': '[STAR]',
    '💎': '[GEM]',
    
    # Status indicators
    '✅': '[OK]',
    '❌': '[NO]',
    '⚠️': '[WARNING]',
    '🔄': '[REFRESH]',
    '⏰': '[TIME]',
    
    # Actions
    '💪': '[STRONG]',
    '🔥': '[HOT]',
    '💡': '[IDEA]',
    '🔧': '[TOOL]',
    '🛠️': '[TOOLS]',
    '🔒': '[SECURE]',
    '🔑': '[KEY]',
    '🔍': '[SEARCH]',
    
    # Celebration
    '🎉': '[SUCCESS]',
    '🏆': '[WINNER]',
    '🎁': '[GIFT]',
    '🎨': '[ART]',
    
    # Communication
    '📊': '[CHART]',
    '📈': '[GROWTH]',
    '📋': '[LIST]',
    '📜': '[SCROLL]',
    '📝': '[NOTE]',
    '📚': '[DOCS]',
    '📅': '[CALENDAR]',
    '📞': '[PHONE]',
    '💬': '[CHAT]',
    
    # Web and tech
    '🌍': '[WORLD]',
    '🌐': '[GLOBE]',
    '💻': '[COMPUTER]',
    '🖥️': '[DESKTOP]',
    '📱': '[MOBILE]',
    '🖱️': '[MOUSE]',
    '⌨️': '[KEYBOARD]',
    '🖨️': '[PRINTER]',
    '📡': '[SATELLITE]',
    '💾': '[SAVE]',
    '🗄️': '[DATABASE]',
    
    # OS
    '🐧': '[LINUX]',
    '🪟': '[WINDOWS]',
    
    # Countries
    '🇨🇭': '[CH]',
    '🇪🇺': '[EU]',
    '🇺🇸': '[US]',
    '🇸🇬': '[SG]',
    '🇯🇵': '[JP]',
    '🇧🇷': '[BR]',
    '🇮🇳': '[IN]',
    '🇩🇪': '[DE]',
    '🇫🇷': '[FR]',
    '🇳🇱': '[NL]',
    '🇦🇸': '[AS]',
    
    # Misc
    '🎓': '[GRADUATE]',
    '🤔': '[THINK]',
    '🧪': '[TEST]',
    '☕': '[COFFEE]',
    '🆘': '[SOS]',
    '🎬': '[ACTION]',
    '🛡️': '[SHIELD]',
    '🤝': '[HANDSHAKE]',
    '🙏': '[THANKS]',
    '💰': '[MONEY]',
    '💸': '[CASH]',
    '🗳️': '[VOTE]',
    '🎵': '[MUSIC]',
    '📷': '[PHOTO]',
    '🎥': '[VIDEO]',
}

def replace_emojis_in_file(filepath):
    """Replace emojis with ASCII in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original = content
        replacements = 0
        
        # Replace each emoji
        for emoji, ascii_rep in EMOJI_MAP.items():
            count = content.count(emoji)
            if count > 0:
                content = content.replace(emoji, ascii_rep)
                replacements += count
        
        # Only write if changed
        if content != original:
            with open(filepath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            return replacements
        
        return 0
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return 0

def main():
    """Main function"""
    root_dir = Path('.')
    total_files = 0
    total_replacements = 0
    
    print("Emoji to ASCII Replacement Tool")
    print("=" * 40)
    print()
    
    # Find all markdown files
    for md_file in root_dir.rglob('*.md'):
        replacements = replace_emojis_in_file(md_file)
        if replacements > 0:
            print(f"✓ {md_file.name}: {replacements} replacements")
            total_files += 1
            total_replacements += replacements
    
    print()
    print("=" * 40)
    print(f"Done! Updated {total_files} files")
    print(f"Total replacements: {total_replacements}")

if __name__ == '__main__':
    main()
