const fs = require('fs');
const path = require('path');

const directories = [
    path.join(__dirname, 'frontend', 'src', 'pages', 'public'),
    path.join(__dirname, 'frontend', 'src', 'components', 'public'),
    path.join(__dirname, 'frontend', 'src', 'pages'),
    path.join(__dirname, 'frontend')
];

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    // Replace "CRRFAS Cloud" -> "ZencampuZ"
    content = content.replace(/CRRFAS Cloud/g, 'ZencampuZ');

    // Replace "CRRFAS Is Born" -> "ZencampuZ Is Born"
    content = content.replace(/CRRFAS Is Born/g, 'ZencampuZ Is Born');

    // Replace "CRRFAS" -> "ZencampuZ" in standard text
    content = content.replace(/CRRFAS/g, 'ZencampuZ');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${filePath}`);
    }
}

function traverse(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && (fullPath.endsWith('.jsx') || fullPath.endsWith('.html'))) {
            replaceInFile(fullPath);
        }
    }
}

for (const dir of directories) {
    traverse(dir);
}
console.log('Done.');
