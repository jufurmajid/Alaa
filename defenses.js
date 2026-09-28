(() => {
  if (typeof toolConfig === 'undefined' || typeof openTool !== 'function' || typeof callAI !== 'function') return;

  const DEFENSE_PROMPT = `المطلوب حصراً: استخراج الدفوع المنتجة في الدعوى من الوقائع والمستندات المقدمة، وليس إجراء تحليل عام للقضية.
رتّب الدفوع من الأقوى والأكثر تأثيراً إلى الأضعف، ولا تذكر دفعاً لمجرد الاحتمال إذا لم تسنده الوقائع.
لكل دفع اذكر بصورة منفصلة:
1) عنوان الدفع.
2) نوعه: شكلي أو إجرائي أو موضوعي، وإذا لم تكفِ المعطيات للتصنيف فاذكر ذلك.
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

  toolConfig.defenses = {
    title: 'الدفوع المنتجة',
    subtitle: 'أداة مستقلة لاستخراج الدفوع المؤثرة في الدعوى وترتيبها حسب القوة والأولوية والأثر.',
    action: 'استخرج الدفوع المنتجة',
    fields: [
      { name: 'category', label: 'نوع الدعوى', type: 'select', options: ['مدني', 'جزائي', 'شرعي جعفري', 'قضاء موظفين / إداري', 'تجاري', 'أخرى'], required: true },
      { name: 'subject', label: 'موضوع الدعوى', placeholder: 'اكتب موضوع الدعوى بإيجاز', required: true },
      { name: 'clientSide', label: 'صفة الموكل', type: 'select', options: ['مدعي / طالب', 'مدعى عليه / مطلوب ضده', 'مشتكي', 'متهم', 'طاعن / مميز', 'مطعون ضده / مميز عليه', 'جهة إدارية', 'موظف', 'صفة أخرى'] },
      { name: 'court', label: 'المحكمة أو الجهة', placeholder: 'اسم المحكمة أو الجهة إن وجدت' },
      { name: 'parties', label: 'أطراف الدعوى', placeholder: 'اذكر الأطراف وصفة كل طرف' },
      { name: 'facts', label: 'الوقائع الرئيسية', type: 'textarea', placeholder: 'اكتب الوقائع والتواريخ المهمة بتسلسل واضح', required: true },
      { name: 'evidence', label: 'الأدلة والمستندات', type: 'textarea', placeholder: 'اذكر ما يتوفر من عقود، وصولات، تقارير، أقوال، كتب رسمية أو غيرها' },
      { name: 'currentDefense', label: 'دفوع أو ملاحظات حالية', type: 'textarea', placeholder: 'اكتب أي دفع أو ملاحظة تريد من الذكاء الاصطناعي فحصها' }
    ]
  };

  const toolsGrid = document.querySelector('.tools-grid');
  if (toolsGrid && !document.querySelector('[data-tool="defenses"]')) {
    const button = document.createElement('button');
    button.className = 'tool-card productive-defenses-main-card';
    button.dataset.tool = 'defenses';
    button.type = 'button';
    button.innerHTML = `
      <span class="tool-number">05</span>
      <span class="tool-glow" aria-hidden="true"></span>
      <span class="tool-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7Zm10 0-4 7h8l-4-7ZM8 21h8" /></svg>
      </span>
      <span class="tool-copy">
        <strong>الدفوع المنتجة</strong>
        <small>استخراج الدفوع المؤثرة وترتيبها حسب القوة والأولوية</small>
      </span>
      <span class="card-arrow" aria-hidden="true">‹</span>
    `;
    button.addEventListener('click', () => openTool('defenses'));
    toolsGrid.appendChild(button);
  }

  const originalCallAI = callAI;
  callAI = async function productiveDefensesAwareCall(payload) {
    if (payload?.tool !== 'defenses') return originalCallAI(payload);

    return originalCallAI({
      ...payload,
      tool: 'analysis',
      title: `${payload.title || 'الدعوى'} — الدفوع المنتجة`,
      details: [payload.details, DEFENSE_PROMPT].filter(Boolean).join('\n\n')
    });
  };

  const style = document.createElement('style');
  style.textContent = `
    .productive-defenses-main-card {
      border-color: rgba(229, 189, 89, .38) !important;
      background:
        radial-gradient(circle at 15% 20%, rgba(229,189,89,.14), transparent 38%),
        linear-gradient(145deg, rgba(229,189,89,.08), rgba(13,13,13,.96)) !important;
    }
    .productive-defenses-main-card .tool-icon {
      box-shadow: 0 0 28px rgba(229,189,89,.12);
    }
    .productive-defenses-main-card .tool-copy strong {
      color: #f0ce75;
    }
    .productive-defenses-main-card::after {
      content: 'مستقل';
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
      letter-spacing: .4px;
    }
  `;
  document.head.appendChild(style);
})();
