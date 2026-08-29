const fs = require('fs');

const scriptPath = 'js/script.js';
let content = fs.readFileSync(scriptPath, 'utf8');

const injection = `
/* ============================================================
   LEGAL PDF VIEWER MODAL
   ============================================================ */
(function initLegalPdfViewer() {
  const getBasePath = () => {
    return window.location.pathname.includes('/pages/') ? '../' : './';
  };

  const pdfMap = {
    'privacy-policy.html': 'assets/pdf/privacy_policy.pdf',
    'terms-of-service.html': 'assets/pdf/terms_of_service.pdf',
    'cookie-policy.html': 'assets/pdf/cookie_policy.pdf'
  };

  document.addEventListener('click', function(e) {
    const link = e.target.closest('a.footer-legal-link, a[href*="privacy-policy.html"], a[href*="terms-of-service.html"], a[href*="cookie-policy.html"]');
    if (link) {
      const href = link.getAttribute('href');
      if (!href) return;
      let pdfPath = null;
      
      for (const [key, value] of Object.entries(pdfMap)) {
        if (href.includes(key)) {
          pdfPath = getBasePath() + value;
          break;
        }
      }
      
      if (pdfPath) {
        e.preventDefault();
        openPdfModal(pdfPath, link.textContent.trim() || 'Document');
      }
    }
  });

  function openPdfModal(pdfUrl, title) {
    let modal = document.getElementById('legal-pdf-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'legal-pdf-modal';
      modal.style.cssText = \`
        position: fixed;
        top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      \`;

      modal.innerHTML = \`
        <div style="background: var(--bg-card, #ffffff); width: 90%; max-width: 900px; height: 90vh; border-radius: 16px; border: 1px solid var(--border, rgba(255,255,255,0.1)); display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); transform: translateY(20px); transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
          <div style="padding: 16px 24px; border-bottom: 1px solid var(--border, rgba(0,0,0,0.1)); display: flex; justify-content: space-between; align-items: center; background: var(--bg-surface, #f8fafc);">
            <h3 id="legal-pdf-title" style="margin: 0; font-size: 1.1rem; font-weight: 700; color: var(--text-primary, #0f172a);">Document</h3>
            <button id="legal-pdf-close" style="background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-secondary, #64748b); line-height: 1; padding: 0 4px; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.color='var(--accent-red, #ef4444)';" onmouseout="this.style.color='var(--text-secondary, #64748b)';">&times;</button>
          </div>
          <iframe id="legal-pdf-iframe" style="flex: 1; width: 100%; border: none; background: #e2e8f0;" src=""></iframe>
        </div>
      \`;

      document.body.appendChild(modal);

      modal.querySelector('#legal-pdf-close').addEventListener('click', () => {
        closeModal(modal);
      });
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
      });
    }

    modal.querySelector('#legal-pdf-title').textContent = title;
    modal.querySelector('#legal-pdf-iframe').src = pdfUrl;
    
    // Animate in
    modal.style.visibility = 'visible';
    modal.style.opacity = '1';
    modal.querySelector('div').style.transform = 'translateY(0)';
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    modal.style.opacity = '0';
    modal.querySelector('div').style.transform = 'translateY(20px)';
    setTimeout(() => {
      modal.style.visibility = 'hidden';
      modal.querySelector('#legal-pdf-iframe').src = '';
      document.body.style.overflow = '';
    }, 300);
  }
})();
`;

if (!content.includes('LEGAL PDF VIEWER MODAL')) {
  fs.writeFileSync(scriptPath, content + '\n' + injection);
}
