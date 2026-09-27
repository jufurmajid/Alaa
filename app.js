const toolSheet = document.getElementById('toolSheet');
const sheetTitle = document.getElementById('sheetTitle');
const sheetSubtitle = document.getElementById('sheetSubtitle');
const submitLabel = document.getElementById('submitLabel');
const aiForm = document.getElementById('aiForm');
const aiResult = document.getElementById('aiResult');
const resultContent = document.getElementById('resultContent');
const caseTitle = document.getElementById('caseTitle');
const caseDetails = document.getElementById('caseDetails');
const caseFiles = document.getElementById('caseFiles');
const toast = document.getElementById('toast');

const toolConfig = {
  civil: {
    title: 'المساعد المدني',
    subtitle: 'اكتب وقائع القضية المدنية ليحللها الذكاء الاصطناعي ويستخرج المسائل القانونية والأدلة والدفوع المحتملة.',
    action: 'تحليل القضية المدنية',
    titlePlaceholder: 'مثال: مطالبة بدين أو فسخ عقد',
    detailsPlaceholder: 'اكتب الوقائع، أطراف الدعوى، المحكمة، المستندات المتوفرة والطلبات...'
  },
  criminal: {
    title: 'المساعد الجزائي',
    subtitle: 'أدخل الوقائع والأدلة والدفوع المتوفرة للحصول على تحليل جزائي منظم ومخصص للمحامي.',
    action: 'تحليل القضية الجزائية',
    titlePlaceholder: 'مثال: شكوى جزائية أو قضية تحقيق',
    detailsPlaceholder: 'اكتب الوقائع، التهمة أو موضوع الشكوى، الأدلة، أقوال الأطراف وأي دفوع متوفرة...'
  },
  jaafari: {
    title: 'المساعد الشرعي الجعفري',
    subtitle: 'أدخل تفاصيل الدعوى الشرعية والطلبات ليقدّم الذكاء الاصطناعي تحليلاً ومسودة أولية مرتبة.',
    action: 'بدء الاستشارة الشرعية',
    titlePlaceholder: 'مثال: دعوى نفقة أو حضانة أو تفريق',
    detailsPlaceholder: 'اكتب بيانات الأطراف، الوقائع، الطلبات، المستندات وأي تفاصيل شرعية أو قضائية مهمة...'
  },
  draft: {
    title: 'كتابة لائحة',
    subtitle: 'أدخل بيانات الدعوى والوقائع والطلبات ليعدّ الذكاء الاصطناعي مسودة لائحة قانونية قابلة للمراجعة.',
    action: 'إنشاء اللائحة بالذكاء الاصطناعي',
    titlePlaceholder: 'مثال: لائحة دعوى مطالبة بدين',
    detailsPlaceholder: 'اسم المحكمة، المدعي، المدعى عليه، الوقائع، موضوع الدعوى، الأدلة والطلبات...'
  },
  analysis: {
    title: 'تحليل قضية',
    subtitle: 'أدخل تفاصيل القضية ليخرج الذكاء الاصطناعي الوقائع والمسائل القانونية والأدلة ونقاط القوة والضعف والخطوة التالية.',
    action: 'حلّل القضية بالذكاء الاصطناعي',
    titlePlaceholder: 'مثال: نزاع عقد بيع',
    detailsPlaceholder: 'اكتب كل ما تعرفه عن القضية: الوقائع، الأطراف، المحكمة، المستندات، الطلبات وما تريد التركيز عليه...'
  },
  appeal: {
    title: 'لائحة تمييزية',
    subtitle: 'أدخل بيانات الحكم وأسباب الاعتراض والوقائع ليعدّ الذكاء الاصطناعي مسودة طعن تمييزي منظمة.',
    action: 'إنشاء اللائحة التمييزية',
    titlePlaceholder: 'مثال: تمييز حكم دعوى مدنية',
    detailsPlaceholder: 'اكتب المحكمة، رقم وتاريخ القرار إن وجد، منطوق الحكم، أسباب الاعتراض، الوقائع والطلب النهائي...'
  },
  employees: {
    title: 'قضاء الموظفين',
    subtitle: 'أدخل تفاصيل النزاع الوظيفي أو القرار الإداري ليحلله الذكاء الاصطناعي ويقترح أوجه الاعتراض والخطوات المناسبة.',
    action: 'تحليل القضية الإدارية',
    titlePlaceholder: 'مثال: اعتراض على عقوبة انضباطية',
    detailsPlaceholder: 'اكتب جهة العمل، القرار أو الإجراء، تاريخه، الوقائع، التظلمات السابقة والمستندات المتوفرة...'
  }
};

let activeTool = 'analysis';
let toastTimer;
let currentResultText = '';

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function openTool(toolName) {
  activeTool = toolConfig[toolName] ? toolName : 'analysis';
  const config = toolConfig[activeTool];

  sheetTitle.textContent = config.title;
  sheetSubtitle.textContent = config.subtitle;
  submitLabel.textContent = config.action;
  caseTitle.placeholder = config.titlePlaceholder;
  caseDetails.placeholder = config.detailsPlaceholder;
  aiResult.hidden = true;
  resultContent.textContent = '';
  currentResultText = '';

  toolSheet.classList.add('is-open');
  toolSheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('sheet-open');

  window.setTimeout(() => caseTitle.focus({ preventScroll: true }), 280);
}

function closeTool() {
  toolSheet.classList.remove('is-open');
  toolSheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('sheet-open');
}

document.querySelectorAll('.js-open-tool').forEach((button) => {
  button.addEventListener('click', () => openTool(button.dataset.tool));
});

document.querySelectorAll('[data-close-sheet]').forEach((element) => {
  element.addEventListener('click', closeTool);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toolSheet.classList.contains('is-open')) {
    closeTool();
  }
});

caseFiles.addEventListener('change', () => {
  const count = caseFiles.files.length;
  const label = document.querySelector('.file-box span:last-child');
  if (!count) {
    label.textContent = 'إضافة ملفات أو صور';
    return;
  }

  label.textContent = count === 1 ? caseFiles.files[0].name : `تم اختيار ${count} ملفات`;
  showToast('رفع الملفات ظاهر بالواجهة، وقراءة محتواها ستُفعّل في مرحلة المستندات. اكتب أهم التفاصيل بالنص حالياً.');
});

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = caseTitle.value.trim();
  const details = caseDetails.value.trim();

  if (!title && !details) {
    showToast('اكتب عنواناً أو تفاصيل القضية أولاً');
    caseDetails.focus();
    return;
  }

  const config = toolConfig[activeTool];
  const submitButton = aiForm.querySelector('.ai-submit');
  const originalLabel = config.action;

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitLabel.textContent = 'جاري التحليل...';
  aiResult.hidden = false;
  resultContent.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;color:#c9b36b;line-height:1.8">
      <span style="font-size:20px;animation:pulse 1.3s infinite">✦</span>
      <span>الذكاء الاصطناعي يراجع التفاصيل ويجهّز النتيجة...</span>
    </div>
  `;
  aiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: activeTool,
        title,
        details
      })
    });

    let data = {};
    try {
      data = await response.json();
    } catch (_) {
      data = {};
    }

    if (!response.ok) {
      if (data?.error === 'AI_NOT_CONFIGURED') {
        throw new Error('الواجهة جاهزة، لكن مفتاح الذكاء الاصطناعي بعده ما مضاف في إعدادات الاستضافة.');
      }
      throw new Error(data?.message || data?.error || 'تعذر تشغيل الذكاء الاصطناعي حالياً.');
    }

    currentResultText = String(data.text || '').trim();
    if (!currentResultText) {
      throw new Error('وصل رد فارغ من خدمة الذكاء الاصطناعي. حاول مرة أخرى.');
    }

    resultContent.innerHTML = `
      <div style="white-space:pre-wrap;line-height:2;color:#eee5cf;font-size:13px">${escapeHtml(currentResultText)}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;padding-top:14px;border-top:1px solid rgba(229,189,89,.15)">
        <button type="button" id="copyAiResult" style="border:1px solid rgba(229,189,89,.32);background:rgba(229,189,89,.07);color:#f1cf74;border-radius:12px;padding:9px 14px;cursor:pointer">نسخ النتيجة</button>
        <button type="button" id="newAiRequest" style="border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.035);color:#d7d0be;border-radius:12px;padding:9px 14px;cursor:pointer">طلب جديد</button>
      </div>
      <p style="margin:14px 0 0;color:#817a69;font-size:10.5px;line-height:1.8">هذه مسودة مساعدة للمحامي وتحتاج إلى مراجعة الوقائع والمراجع القانونية قبل اعتمادها.</p>
    `;

    document.getElementById('copyAiResult')?.addEventListener('click', copyResult);
    document.getElementById('newAiRequest')?.addEventListener('click', resetCurrentTool);
  } catch (error) {
    currentResultText = '';
    resultContent.innerHTML = `
      <div style="border:1px solid rgba(229,189,89,.2);background:rgba(229,189,89,.04);border-radius:14px;padding:14px;color:#e4d8bb;line-height:1.9">
        <strong style="display:block;color:#f1cf74;margin-bottom:4px">تعذر إكمال الطلب</strong>
        ${escapeHtml(error.message || 'حدث خطأ غير متوقع.')}
      </div>
    `;
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitLabel.textContent = originalLabel;
  }
});

async function copyResult() {
  if (!currentResultText) return;
  try {
    await navigator.clipboard.writeText(currentResultText);
    showToast('تم نسخ النتيجة');
  } catch (_) {
    showToast('تعذر النسخ تلقائياً');
  }
}

function resetCurrentTool() {
  aiResult.hidden = true;
  resultContent.textContent = '';
  currentResultText = '';
  caseTitle.value = '';
  caseDetails.value = '';
  caseFiles.value = '';
  const label = document.querySelector('.file-box span:last-child');
  if (label) label.textContent = 'إضافة ملفات أو صور';
  caseTitle.focus({ preventScroll: true });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
