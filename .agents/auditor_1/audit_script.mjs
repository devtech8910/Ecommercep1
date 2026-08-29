import fs from 'fs';
import path from 'path';

console.log('--- FORENSIC AUDITOR 1: CODE INTEGRITY CHECKS ---');

const filesToCheck = [
  'css/mobile.css',
  'css/style.css',
  'pages/product-details.html',
  'pages/shop.html',
  'pages/mens-wear.html',
  'pages/womens-wear.html',
  'pages/kids-wear.html',
  'pages/wishlist.html',
  'index.html'
];

let violationCount = 0;
let checkCount = 0;

function check(desc, pass, detail) {
  checkCount++;
  if (pass) {
    console.log('[PASS]', desc);
  } else {
    violationCount++;
    console.error('[FAIL]', desc, '->', detail);
  }
}

// 1. Check file existence
filesToCheck.forEach(f => {
  const exists = fs.existsSync(f);
  check('File exists: ' + f, exists, 'File missing');
});

// 2. Scan for hardcoded test bypass patterns, fake stubs, facade implementations
const facadePatterns = [
  /return\s+(true|false|'PASS'|'FAIL')\s*;\s*\/\/\s*mock/i,
  /NotImplementedError/i,
  /\/\*.*dummy implementation.*\*\//i,
  /\/\*.*mock bypass.*\*\//i,
  /window\.__MOCK_TEST_OVERRIDE__/i
];

filesToCheck.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  facadePatterns.forEach(pattern => {
    const match = pattern.test(content);
    check('No facade pattern ' + pattern + ' in ' + f, !match, 'Matched prohibited facade pattern');
  });
});

// 3. Verify CSS properties in css/mobile.css
const mobileCss = fs.readFileSync('css/mobile.css', 'utf8');
check('mobile.css removed max-height: 200px !important', !mobileCss.includes('max-height: 200px !important'), 'Found max-height: 200px in mobile.css');
check('mobile.css contains object-fit: cover !important', mobileCss.includes('object-fit: cover !important'), 'Missing object-fit: cover in mobile.css');
check('mobile.css contains aspect-ratio: 3 / 4 !important', mobileCss.includes('aspect-ratio: 3 / 4 !important'), 'Missing aspect-ratio: 3 / 4 in mobile.css');

// 4. Verify CSS in css/style.css
const styleCss = fs.readFileSync('css/style.css', 'utf8');
check('style.css defines .product-card-img-wrap', styleCss.includes('.product-card-img-wrap'), 'Missing .product-card-img-wrap in style.css');
check('style.css defines aspect-ratio: 3 / 4', styleCss.includes('aspect-ratio: 3 / 4'), 'Missing aspect-ratio: 3 / 4 in style.css');
check('style.css defines object-position: center top', styleCss.includes('object-position: center top'), 'Missing object-position: center top in style.css');

// 5. Verify product-details.html carousel and gallery rules
const prodDetails = fs.readFileSync('pages/product-details.html', 'utf8');
check('product-details.html uses flex: 0 0 100% on .gallery-slide', prodDetails.includes('flex: 0 0 100%'), 'Missing flex: 0 0 100%');
check('product-details.html uses width: 100% and height: 100% on #image-carousel-container img', prodDetails.includes('#image-carousel-container img'), 'Missing selector #image-carousel-container img');
check('product-details.html uses object-fit: cover on #image-carousel-container img', prodDetails.includes('object-fit: cover') && prodDetails.includes('object-position: center center'), 'Missing object-fit / object-position');
check('product-details.html uses object-fit: cover on .thumb-btn img', prodDetails.includes('.thumb-btn img') && prodDetails.includes('object-fit: cover;'), 'Missing .thumb-btn img object-fit: cover');
check('product-details.html keeps object-fit: contain on #lightbox-img', prodDetails.includes('#lightbox-img') && prodDetails.includes('object-fit: contain;'), 'Missing #lightbox-img object-fit: contain');
check('product-details.html uses minmax(0, 1fr) on .product-main-layout', prodDetails.includes('grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr)'), 'Missing fluid grid columns');

// 6. Verify listing pages have standardized card image wrappers and object-position: center top
const listingPages = [
  'pages/shop.html',
  'pages/mens-wear.html',
  'pages/womens-wear.html',
  'pages/kids-wear.html',
  'pages/wishlist.html',
  'index.html'
];

listingPages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  check(p + ' has aspect-ratio: 3 / 4', content.includes('aspect-ratio: 3 / 4'), 'Missing aspect-ratio: 3 / 4');
  check(p + ' has object-position: center top', content.includes('object-position: center top'), 'Missing object-position: center top');
  check(p + ' has object-fit: cover', content.includes('object-fit: cover'), 'Missing object-fit: cover');
});

console.log('\nTotal Checks:', checkCount, '| Violations:', violationCount);
if (violationCount === 0) {
  console.log('AUDIT RESULT: CLEAN');
} else {
  console.log('AUDIT RESULT: INTEGRITY VIOLATION');
}
