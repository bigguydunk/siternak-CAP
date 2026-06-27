const fs = require('fs');

const data = JSON.parse(fs.readFileSync('figma_data_utf8.json', 'utf8'));
const page1 = data.document.children.find(p => p.name === 'Page 1');
const loginScreen = page1.children.find(c => c.name === 'LOGIN PETERNAK');

function extractNodes(node, depth = 0) {
    let result = '';
    const indent = '  '.repeat(depth);
    result += `${indent}- ${node.name} (${node.type})\n`;
    if (node.type === 'TEXT') {
        result += `${indent}  Text: "${node.characters}"\n`;
    }
    if (node.fills && node.fills.length > 0 && node.fills[0].color) {
        const c = node.fills[0].color;
        result += `${indent}  Color: rgba(${Math.round(c.r*255)}, ${Math.round(c.g*255)}, ${Math.round(c.b*255)}, ${c.a})\n`;
    }
    if (node.children) {
        node.children.forEach(child => {
            result += extractNodes(child, depth + 1);
        });
    }
    return result;
}

console.log(extractNodes(loginScreen));
