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
    subtitle: 'اكتب وقائع القضية المدنية، وسيكون هذا القسم مخصصاً لتحليلها وصياغة الرأي القانوني.',
    action: 'تحليل القضية المدنية'
  },
  criminal: {
    title: 'المساعد الجزائي',
    subtitle: 'أدخل الوقائع والأدلة والدفوع المتوفرة لإعداد تحليل منظم للقضية الجزائية.',
    action: 'تحليل القضية الجزائية'
  },
  jaafari: {
    title: 'المساعد الشرعي الجعفري',
    subtitle: 'أدخل تفاصيل الدعوى الشرعية والطلبات ليتم إعداد تحليل وصياغة أولية.',
    action: 'بدء الاستشارة الشرعية'
  },
  draft: {
    title: 'كتابة لائحة',
    subtitle: 'أدخل بيانات الدعوى والوقائع والطلبات لإعداد مسودة لائحة قانونية احترافية.',
    action: 'إنشاء اللائحة بالذكاء الاصطناعي'
  },
  analysis: {
    title: 'تحليل قضية',
    subtitle: 'أدخل تفاصيل القضية ومستنداتها لاستخراج الوقائع والحجج ونقاط القوة والضعف.',
    action: 'حلّل القضية بالذكاء الاصطناعي'
  },
  appeal: {
    title: 'لائحة تمييزية',
    subtitle: 'أدخل الحكم وأسباب الاعتراض والوقائع لصياغة مسودة طعن تمييزي مرتبة.',
    action: 'إنشاء اللائحة التمييزية'
  },
  employees: {
    title: 'قضاء الموظفين',
    subtitle: 'أدخل تفاصيل النزاع الوظيفي أو الإداري ليتم تحليل القضية وإعداد المسودة المناسبة.',
    action: 'تحليل القضية الإدارية'
  }
};

let activeTool = 'analysis';
let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function openTool(toolName) {
  activeTool = toolConfig[toolName] ? toolName : 'analysis';
  const config = toolConfig[activeTool];

  sheetTitle.textContent = config.title;
  sheetSubtitle.textContent = config.subtitle;
  submitLabel.textContent = config.action;
  aiResult.hidden = true;
  resultContent.textContent = '';

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
});

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const title = caseTitle.value.trim();
  const details = caseDetails.value.trim();

  if (!title && !details && caseFiles.files.length === 0) {
    showToast('أدخل تفاصيل القضية أولاً');
    caseDetails.focus();
    return;
  }

  const config = toolConfig[activeTool];
  const submitButton = aiForm.querySelector('.ai-submit');
  const originalLabel = submitLabel.textContent;

  submitButton.disabled = true;
  submitLabel.textContent = 'جاري التحضير...';

  // نقطة الربط الآمنة مع الذكاء الاصطناعي ستكون عبر Backend في المرحلة التالية.
  // لا يتم وضع API Key داخل المتصفح أو داخل هذا المستودع.
  await new Promise((resolve) => setTimeout(resolve, 550));

  aiResult.hidden = false;
  resultContent.innerHTML = `
    <p style="margin:0 0 6px;color:#e7dcc0"><strong>${escapeHtml(config.title)}</strong></p>
    <p style="margin:0">واجهة الأداة جاهزة. سيتم في خطوة الربط إرسال البيانات إلى الخادم الآمن للذكاء الاصطناعي ثم عرض النتيجة هنا، بدون كشف مفتاح الخدمة داخل الموقع.</p>
  `;

  submitButton.disabled = false;
  submitLabel.textContent = originalLabel;
  aiResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
