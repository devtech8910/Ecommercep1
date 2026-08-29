const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'index.html',
  'pages/contact-us.html',
  'pages/returns-exchanges.html',
  'pages/size-guide.html',
  'pages/track-order.html'
];

const target = 'Crafted with ♥ by <strong>Purna Sai &amp; Prabhas</strong>';
const replacement = 'Crafted with ♥ by <strong><a href="https://www.linkedin.com/in/purna-sai-badithala-96a00a32a" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">Purna Sai</a> &amp; <a href="https://www.linkedin.com/in/prabhas-bangarugari-35494232a" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none;" onmouseover="this.style.textDecoration=\'underline\'" onmouseout="this.style.textDecoration=\'none\'">Prabhas</a></strong>';

for (const file of filesToUpdate) {
  const p = path.resolve(file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf-8');
    if (content.includes(target)) {
      content = content.replace(target, replacement);
      fs.writeFileSync(p, content);
      console.log(`Updated ${file}`);
    } else {
      console.log(`Target not found in ${file}`);
    }
  }
}
