(() => {
  const resultContent = document.getElementById('resultContent');
  const followUpBox = document.getElementById('followUpBox');
  const followUpInput = document.getElementById('followUpInput');
  const sendFollowUp = document.getElementById('sendFollowUp');

  const HEADING_WORDS = [
    'ملخص', 'الملخص', 'الوقائع', 'الوقائع الأساسية', 'المسائل القانونية',
    'الأدلة', 'الأدلة الموجودة', 'الأدلة الناقصة', 'المعلومات الناقصة',
    'نقاط القوة', 'نقاط الضعف', 'الدفوع المحتملة', 'الدفوع', 'الطلبات',
    'أسباب الطعن', 'الأساس القانوني', 'الخطوة التالية', 'المقترح العملي',
    'أسئلة للموكل', 'المستندات المطلوبة', 'ملاحظات', 'النتيجة'
  ];

  function isHeading(line) {
    const clean = line.replace(/^#{1,4}\s*/, '').replace(/[：:]\s*$/, '').trim();
    if (!clean || clean.length > 80) return false;
    return HEADING_WORDS.some((word) => clean === word || clean.startsWith(`${word} `));
  }

  function formatLegalResult() {
    if (!resultContent) return;
    const box = resultContent.querySelector('.ai-text');
    if (!box || box.dataset.polished === 'true') return;

    const raw = box.textContent || '';
    if (!raw.trim()) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'legal-result-block';

    for (const originalLine of raw.split(/\r?\n/)) {
      const line = originalLine.trim();
      if (!line) continue;

      if (/^#{1,4}\s+/.test(line) || isHeading(line)) {
        const heading = document.createElement('h4');
        heading.className = 'legal-heading';
        heading.textContent = line.replace(/^#{1,4}\s+/, '').replace(/[：:]\s*$/, '');
        wrapper.appendChild(heading);
        continue;
      }

      const bulletMatch = line.match(/^[-•*–]\s+(.+)/);
      if (bulletMatch) {
        const item = document.createElement('p');
        item.className = 'legal-bullet';
        item.textContent = bulletMatch[1];
        wrapper.appendChild(item);
        continue;
      }

      const numberedMatch = line.match(/^(\d{1,2})[.)-]\s+(.+)/);
      if (numberedMatch) {
        const item = document.createElement('p');
        item.className = 'legal-numbered';
        item.dataset.number = numberedMatch[1];
        item.textContent = numberedMatch[2];
        wrapper.appendChild(item);
        continue;
      }

      const paragraph = document.createElement('p');
      paragraph.className = 'legal-paragraph';
      paragraph.textContent = line;
      wrapper.appendChild(paragraph);
    }

    box.textContent = '';
    box.appendChild(wrapper);
    box.dataset.polished = 'true';
  }

  if (resultContent) {
    const observer = new MutationObserver(() => requestAnimationFrame(formatLegalResult));
    observer.observe(resultContent, { childList: true, subtree: true });
  }

  if (followUpBox && followUpInput && !followUpBox.querySelector('.followup-presets')) {
    const presets = document.createElement('div');
    presets.className = 'followup-presets';
    presets.setAttribute('aria-label', 'طلبات سريعة');

    const prompts = [
      'قوّي الحجج القانونية',
      'اختصر النتيجة',
      'استخرج النواقص فقط',
      'حوّلها إلى صياغة رسمية',
      'اكتب أسئلة للموكل'
    ];

    prompts.forEach((prompt) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'followup-chip';
      button.textContent = prompt;
      button.addEventListener('click', () => {
        followUpInput.value = prompt;
        followUpInput.focus({ preventScroll: true });
      });
      presets.appendChild(button);
    });

    const row = followUpBox.querySelector('.follow-up-row');
    if (row) followUpBox.insertBefore(presets, row);
  }

  document.addEventListener('pointerdown', (event) => {
    const target = event.target.closest('.tool-card, .specialty-tile, .ai-submit');
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  }, { passive: true });

  function syncOnlineState() {
    document.body.classList.toggle('is-offline', !navigator.onLine);
  }

  syncOnlineState();
  window.addEventListener('online', syncOnlineState);
  window.addEventListener('offline', syncOnlineState);

  const localSecureHost = ['localhost', '127.0.0.1'].includes(location.hostname);
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || localSecureHost)) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

  let deferredInstallPrompt = null;
  let installButton = null;

  function hideInstallButton() {
    installButton?.remove();
    installButton = null;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;

    if (installButton) return;
    installButton = document.createElement('button');
    installButton.type = 'button';
    installButton.className = 'install-app-pill';
    installButton.textContent = 'ثبّت المساعد كتطبيق';
    installButton.addEventListener('click', async () => {
      if (!deferredInstallPrompt) return;
      deferredInstallPrompt.prompt();
      try { await deferredInstallPrompt.userChoice; } catch {}
      deferredInstallPrompt = null;
      hideInstallButton();
    });
    document.body.appendChild(installButton);
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    hideInstallButton();
  });

  if (sendFollowUp && followUpInput) {
    followUpInput.addEventListener('input', () => {
      sendFollowUp.classList.toggle('has-text', Boolean(followUpInput.value.trim()));
    });
  }
})();
