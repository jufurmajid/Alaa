(() => {
  if (typeof toolConfig === 'undefined' || typeof callAI !== 'function') return;

  const aiForm = document.getElementById('aiForm');
  const dynamicFields = document.getElementById('dynamicFields');
  if (!aiForm || !dynamicFields || document.getElementById('productiveDefensesAction')) return;

  const DEFENSE_PROMPT = `المطلوب حصراً: استخراج الدفوع المنتجة في هذه الدعوى من الوقائع والمستندات المقدمة، وليس إجراء تحليل عام للقضية.
رتّب الدفوع من الأقوى والأكثر تأثيراً إلى الأضعف، ولا تذكر دفعاً لمجرد الاحتمال إذا لم تسنده الوقائع.
لكل دفع اذكر بصورة منفصلة:
1) عنوان الدفع.
2) نوعه: شكلي أو إجرائي أو موضوعي، وإذا لم يكفِ الملف للتصنيف فاذكر ذلك.
3) الوقائع أو المستندات التي تسنده.
4) لماذا يُعد منتجاً ومؤثراً في نتيجة الدعوى أو سيرها.
5) الأثر المتوقع إذا قُبل.
6) ما يلزم لإثباته أو استكماله من مستند أو واقعة.
7) توقيت أو مرحلة إثارته إذا كان ذلك مؤثراً.
8) درجة الأولوية: عالية أو متوسطة أو ضعيفة مع سبب مختصر.
9) أقوى رد محتمل من الخصم على هذا الدفع.
10) الرد المقترح للمحامي على جواب الخصم.
افصل بين الدفع الذي تدعمه الوقائع الحالية والدفع الذي يحتاج معلومات إضافية. إذا لم يظهر دفع منتج حقيقي من المعطيات فقل ذلك بوضوح وحدد المعلومات الناقصة التي قد تكشفه.
لا تختلق مادة قانونية أو رقم قرار أو سابقة قضائية؛ وإذا كان السند القانوني المحدد غير متأكد منه فاذكر أنه يحتاج إلى تحقق من المحامي.`;

  const card = document.createElement('button');
  card.type = 'button';
  card.id = 'productiveDefensesAction';
  card.className = 'productive-defenses-action-card';
  card.innerHTML = `
    <span class="productive-defenses-icon" aria-hidden="true">⚖</span>
    <span class="productive-defenses-copy">
      <span class="productive-defenses-topline"><strong>الدفوع المنتجة</strong><em>خيار مستقل</em></span>
      <small>يستخرج الدفوع المؤثرة في الدعوى ويرتبها حسب القوة والأولوية والأثر.</small>
    </span>
    <span class="productive-defenses-arrow" aria-hidden="true">‹</span>
  `;

  dynamicFields.insertAdjacentElement('afterend', card);

  card.addEventListener('click', async () => {
    if (typeof validateRequiredFields === 'function' && !validateRequiredFields()) return;

    const fields = typeof collectFields === 'function' ? collectFields() : {};
    const details = typeof caseDetails !== 'undefined' ? caseDetails.value.trim() : '';

    card.disabled = true;
    card.classList.add('is-loading');
    const originalHtml = card.innerHTML;
    card.innerHTML = `
      <span class="productive-defenses-icon defense-spinner" aria-hidden="true">✦</span>
      <span class="productive-defenses-copy"><strong>جاري استخراج الدفوع المنتجة...</strong><small>مراجعة الوقائع والمستندات وترتيب الدفوع حسب الأولوية.</small></span>
    `;

    if (typeof showLoading === 'function') {
      showLoading('جاري تحليل الدفوع المنتجة في الدعوى وترتيبها حسب القوة والأثر...');
    }

    try {
      const attachments = typeof prepareAttachments === 'function' ? await prepareAttachments() : [];
      const baseTitle = typeof getTitleFromFields === 'function' ? getTitleFromFields(fields) : 'الدعوى';
      const payload = {
        tool: typeof activeTool !== 'undefined' ? activeTool : 'analysis',
        title: `${baseTitle} — الدفوع المنتجة`,
        fields,
        details: [details, DEFENSE_PROMPT].filter(Boolean).join('\n\n'),
        attachments
      };

      if (typeof lastSubmission !== 'undefined') lastSubmission = payload;
      const result = await callAI(payload);
      if (typeof renderResult === 'function') renderResult(result.text, result.model);
    } catch (error) {
      if (typeof renderError === 'function') renderError(error?.message || 'تعذر استخراج الدفوع المنتجة.');
    } finally {
      card.disabled = false;
      card.classList.remove('is-loading');
      card.innerHTML = originalHtml;
    }
  });

  const style = document.createElement('style');
  style.textContent = `
    .productive-defenses-action-card {
      width: 100%;
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 2px 0 16px;
      padding: 14px 14px;
      text-align: right;
      font-family: inherit;
      color: #eee3c4;
      border: 1px solid rgba(229,189,89,.30);
      border-radius: 17px;
      background:
        radial-gradient(circle at 15% 20%, rgba(229,189,89,.12), transparent 34%),
        linear-gradient(145deg, rgba(229,189,89,.08), rgba(255,255,255,.018));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 16px 34px rgba(0,0,0,.18);
      cursor: pointer;
      overflow: hidden;
      transition: transform .18s ease, border-color .18s ease, box-shadow .18s ease;
    }
    .productive-defenses-action-card::before {
      content: '';
      position: absolute;
      right: 0;
      top: 16%;
      bottom: 16%;
      width: 2px;
      border-radius: 4px;
      background: linear-gradient(180deg, transparent, #f1cf74, transparent);
      opacity: .85;
    }
    .productive-defenses-action-card:active { transform: scale(.988); }
    .productive-defenses-action-card:disabled { opacity: .72; cursor: wait; }
    .productive-defenses-icon {
      width: 42px;
      height: 42px;
      flex: 0 0 42px;
      display: grid;
      place-items: center;
      border-radius: 13px;
      font-size: 18px;
      color: #f3d478;
      background: rgba(229,189,89,.09);
      border: 1px solid rgba(229,189,89,.23);
      box-shadow: 0 0 24px rgba(229,189,89,.07);
    }
    .productive-defenses-copy { min-width: 0; flex: 1; display: block; }
    .productive-defenses-topline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .productive-defenses-copy strong { display: block; color: #f1cf74; font-size: 13px; font-weight: 800; line-height: 1.7; }
    .productive-defenses-copy small { display: block; margin-top: 3px; color: #9b9281; font-size: 10.5px; line-height: 1.75; }
    .productive-defenses-topline em {
      font-style: normal;
      font-size: 8.5px;
      font-weight: 700;
      color: #bda45f;
      border: 1px solid rgba(229,189,89,.20);
      background: rgba(229,189,89,.05);
      border-radius: 999px;
      padding: 2px 7px;
    }
    .productive-defenses-arrow { color: #cda94f; font-size: 24px; line-height: 1; opacity: .78; }
    .defense-spinner { animation: defenseSpin 1.1s linear infinite; }
    @keyframes defenseSpin { to { transform: rotate(360deg); } }
  `;
  document.head.appendChild(style);
})();