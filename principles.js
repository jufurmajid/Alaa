(() => {
  if (typeof toolConfig === 'undefined' || typeof openTool !== 'function' || typeof callAI !== 'function') return;

  toolConfig.principles = {
    title: 'مبادئ تمييزية',
    subtitle: 'أدخل الواقعة أو الحدث وحدد نوع المبدأ ليبحث المساعد عن أقرب مبدأ منشور في موقع مجلس القضاء الأعلى.',
    action: 'ابحث عن مبدأ تمييزي',
    fields: [
      {
        name: 'principleCategory',
        label: 'نوع المبدأ',
        type: 'select',
        options: ['مدني', 'شرعي / أحوال شخصية', 'جزاء'],
        required: true
      },
      {
        name: 'facts',
        label: 'الواقعة أو الحدث',
        type: 'textarea',
        placeholder: 'اكتب الواقعة القانونية بوضوح، مثلاً: بيع عقار بعقد خارجي، حضانة، نفقة، أدلة جزائية، اختصاص المحكمة...',
        required: true
      },
      {
        name: 'focus',
        label: 'النقطة القانونية المراد البحث عنها',
        placeholder: 'اختياري — مثال: الاختصاص، الإثبات، التعويض، الحضانة، الطعن...'
      }
    ]
  };

  const toolsGrid = document.querySelector('.tools-grid');
  if (toolsGrid && !document.querySelector('[data-tool="principles"]')) {
    const button = document.createElement('button');
    button.className = 'tool-card principles-main-card';
    button.dataset.tool = 'principles';
    button.type = 'button';
    button.innerHTML = `
      <span class="tool-number">06</span>
      <span class="tool-glow" aria-hidden="true"></span>
      <span class="tool-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
          <path d="M8 7h7M8 11h7M8 15h4" />
          <path d="M18 8h2v9a3 3 0 0 1-3 3" />
        </svg>
      </span>
      <span class="tool-copy">
        <strong>مبادئ تمييزية</strong>
        <small>بحث عن مبدأ شرعي أو مدني أو جزائي من الوقائع</small>
      </span>
      <span class="card-arrow" aria-hidden="true">‹</span>
    `;
    button.addEventListener('click', () => openTool('principles'));
    toolsGrid.appendChild(button);
  }

  function getField(payload, labels) {
    const fields = payload?.fields || {};
    for (const label of labels) {
      const value = String(fields[label] || '').trim();
      if (value) return value;
    }
    return '';
  }

  async function searchPrinciples(payload) {
    const category = getField(payload, ['نوع المبدأ']);
    const facts = getField(payload, ['الواقعة أو الحدث']);
    const focus = getField(payload, ['النقطة القانونية المراد البحث عنها']);
    const details = String(payload?.details || '').trim();

    let response;
    try {
      response = await fetch('/api/principles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          facts,
          focus,
          details,
          attachments: payload?.attachments || []
        })
      });
    } catch {
      throw new Error('تعذر الوصول إلى خدمة البحث في المبادئ التمييزية. حاول مرة أخرى.');
    }

    let data = {};
    try { data = await response.json(); } catch { data = {}; }

    if (!response.ok) {
      throw new Error(data?.message || data?.error || 'تعذر البحث عن المبدأ التمييزي حالياً.');
    }

    const text = String(data?.text || '').trim();
    if (!text) throw new Error('لم تصل نتيجة من خدمة البحث في المبادئ التمييزية.');
    return { text, model: String(data?.model || 'بحث تمييزي') };
  }

  const originalCallAI = callAI;
  callAI = async function cassationPrinciplesAwareCall(payload) {
    if (payload?.tool !== 'principles') return originalCallAI(payload);

    if (payload?.followUp && payload?.previousResult) {
      return originalCallAI({
        ...payload,
        tool: 'analysis',
        title: 'متابعة نتيجة البحث في المبادئ التمييزية',
        details: [
          payload.details,
          'تعامل مع النتيجة السابقة كمبادئ وقرارات تم العثور عليها من المصدر الرسمي. لا تضف أرقام قرارات أو مبادئ جديدة غير موجودة فيها إلا إذا صرحت بأنها تحتاج إلى بحث جديد.'
        ].filter(Boolean).join('\n\n')
      });
    }

    return searchPrinciples(payload);
  };

  const style = document.createElement('style');
  style.textContent = `
    .principles-main-card {
      border-color: rgba(229,189,89,.34) !important;
      background:
        radial-gradient(circle at 82% 18%, rgba(229,189,89,.13), transparent 38%),
        linear-gradient(145deg, rgba(15,15,15,.98), rgba(229,189,89,.055)) !important;
    }
    .principles-main-card .tool-copy strong { color: #f2cf73; }
    .principles-main-card .tool-icon { box-shadow: 0 0 28px rgba(229,189,89,.10); }
    .principles-main-card::after {
      content: 'بحث رسمي';
      position: absolute;
      left: 14px;
      bottom: 12px;
      padding: 3px 8px;
      border-radius: 999px;
      border: 1px solid rgba(229,189,89,.22);
      background: rgba(229,189,89,.07);
      color: #d9b65c;
      font-size: 8px;
      font-weight: 800;
      letter-spacing: .3px;
    }
  `;
  document.head.appendChild(style);
})();
