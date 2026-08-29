const fs = require('fs');
const path = require('path');
const target = `              <a href="pages/kids-wear.html" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon" aria-hidden="true">★</span>
                Kids Wear
              </a>
            </div>
          </li>
        </ul>`;
const replacement = `              <a href="pages/kids-wear.html" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon" aria-hidden="true">★</span>
                Kids Wear
              </a>
              <a href="pages/shop.html?category=Accessories" class="dropdown-item" role="menuitem">
                <span class="dropdown-icon" aria-hidden="true">💎</span>
                Accessories
              </a>
            </div>
          </li>
        </ul>`;
        
const target2 = target.replace(/pages\//g, '');
const replacement2 = replacement.replace(/pages\/shop/g, 'shop').replace(/pages\/kids-wear/g, 'kids-wear');

const files = fs.readdirSync('pages').filter(f => f.endsWith('.html'));
for (const file of files) {
  const p = path.join('pages', file);
  let content = fs.readFileSync(p, 'utf-8');
  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(p, content);
  } else if (content.includes(target2)) {
    content = content.replace(target2, replacement2);
    fs.writeFileSync(p, content);
  }
}
