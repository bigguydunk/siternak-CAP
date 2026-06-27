const fs = require('fs');

async function fetchFigma() {
    const token = process.env.FIGMA_TOKEN; // set via: $env:FIGMA_TOKEN="your_token"
    const fileId = 'uyh6xeTIXH4AD9sNb2pHcA';
    
    try {
        const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
            headers: { 'X-Figma-Token': token }
        });
        const data = await response.json();
        
        // Output basic structure
        console.log(`Document: ${data.name}`);
        const pages = data.document.children;
        pages.forEach(p => {
            console.log(`\nPage: ${p.name}`);
            if (p.children) {
                p.children.forEach(c => {
                    console.log(`  Screen: ${c.name} (${c.type})`);
                });
            }
        });
        
        // Save the JSON correctly as UTF-8
        fs.writeFileSync('figma_data_utf8.json', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}

fetchFigma();
