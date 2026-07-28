const fs = require('fs');
let content = fs.readFileSync('pages/product-details.html', 'utf8');

// Use regex to catch \r\n differences
const regex = /const client = document\.createElement\('script'\);\s+client\.type = 'module';\s+client\.src = 'http:\/\/localhost:3000\/@vite\/client';\s+document\.body\.appendChild\(client\);\s+recommender\.appendChild\(item\);\s+\}\);/g;

const replacement = `const client = document.createElement('script');
            client.type = 'module';
            client.src = 'http://localhost:3000/@vite/client';
            document.body.appendChild(client);

            const main = document.createElement('script');
            main.type = 'module';
            main.src = 'http://localhost:3000/src/main.tsx';
            document.body.appendChild(main);
          })
          .catch(() => {
            console.info('React Address Picker dev server not running.');
          });`;

content = content.replace(regex, replacement);
fs.writeFileSync('pages/product-details.html', content);
console.log('Fixed');
