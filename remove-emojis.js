// Remove all Unicode emojis from markdown files
// Replace with ASCII equivalents

const fs = require('fs');
const path = require('path');

const replacements = {
    '✅': '[DONE]',
    '⏳': '[TODO]',
    '🔴': '[CRITICAL]',
    '🟡': '[PARTIAL]',
    '🟢': '[OK]',
    '✓': '[x]',
    '❌': '[FAILED]',
    '⚠': '[!]',
    '📋': '[PLANNED]',
    '🔬': '[RESEARCH]',
    '💡': '[NOTE]',
    '🎯': '[TARGET]',
    '🚀': '[LAUNCH]',
    '📊': '[STATS]',
    '📁': '[FOLDER]',
    '🔒': '[SECURE]',
    '🔐': '[LOCKED]',
    '🔄': '[IN PROGRESS]'
};

function getAllMdFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules and .git
            if (file !== 'node_modules' && file !== '.git') {
                getAllMdFiles(filePath, fileList);
            }
        } else if (file.endsWith('.md')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

function replaceEmojis(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let replacementCount = 0;
    
    for (const [emoji, replacement] of Object.entries(replacements)) {
        const regex = new RegExp(emoji, 'g');
        const matches = (content.match(regex) || []).length;
        if (matches > 0) {
            content = content.replace(regex, replacement);
            replacementCount += matches;
        }
    }
    
    if (replacementCount > 0) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`${path.basename(filePath)}: ${replacementCount} replacements`);
    }
    
    return replacementCount;
}

// Main execution
console.log('Finding all markdown files...');
const mdFiles = getAllMdFiles('.');
console.log(`Found ${mdFiles.length} markdown files`);
console.log('Processing...\n');

let totalReplacements = 0;
mdFiles.forEach(file => {
    totalReplacements += replaceEmojis(file);
});

console.log(`\nComplete! Total replacements: ${totalReplacements}`);
console.log('All markdown files now use ASCII-only characters.');
