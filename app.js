const toolSheet = document.getElementById('toolSheet');
const sheetTitle = document.getElementById('sheetTitle');
const sheetSubtitle = document.getElementById('sheetSubtitle');
const submitLabel = document.getElementById('submitLabel');
const aiForm = document.getElementById('aiForm');
const aiResult = document.getElementById('aiResult');
const resultContent = document.getElementById('resultContent');
const resultModel = document.getElementById('resultModel');
const dynamicFields = document.getElementById('dynamicFields');
const caseDetails = document.getElementById('caseDetails');
const caseFiles = document.getElementById('caseFiles');
const clearFormButton = document.getElementById('clearForm');
const followUpBox = document.getElementById('followUpBox');
const followUpInput = document.getElementById('followUpInput');
const sendFollowUp = document.getElementById('sendFollowUp');
const toast = document.getElementById('toast');

const API_ENDPOINT = window.ALAA_AI_ENDPOINT || '/api/ai';
const MAX_TEXT_ATTACHMENT_CHARS = 45000;

const toolConfig = {
  civil: {
    title: 'المساعد المدني',
    subtitle: 'حلّل الدعوى المدنية، رتّب الوقائع والأدلة والدفوع، أو اطلب مسودة قانونية من نفس المساحة.',
    action: 'تحليل القضية المدنية',
    fields: [
      { name: 'subject', label: 'موضوع الدعوى', placeholder: 'مثال: مطالبة بدين، فسخ عقد، تعويض', required: true },
      { name: 'court', label: 'المحكمة', placeholder: 'اسم المحكمة إن وجد' },
      { name: 'parties', label: 'أطراف الدعوى', placeholder: 'المدعي والمدعى عليه وصفة كل طرف' },
      { name: 'evidence', label: 'الأدلة والمستندات', type: 'textarea', placeholder: 'العقد، الوصولات، الشهود، المراسلات...' },
      { name: 'request', label: 'ما المطلوب من الذكاء الاصطناعي؟', type: 'select', options: ['تحليل شامل', 'استخراج الدفوع', 'ترتيب الأدلة', 'صياغة مسودة', 'أسئلة للموكل'] }
    ]
  },
  criminal: {
    title: 'المساعد الجزائي',
    subtitle: 'رتّب الوقائع والأدلة والادعاءات والدفوع المحتملة بصورة منفصلة وواضحة.',
    action: 'تحليل القضية الجزائية',
    fields: [
      { name: 'subject', label: 'موضوع القضية', placeholder: 'مثال: شكوى، تحقيق، جنحة، جناية', required: true },
      { name: 'stage', label: 'مرحلة القضية', type: 'select', options: ['تحقيق', 'محكمة جنح', 'محكمة جنايات', 'طعن', 'غير محدد'] },
      { name: 'parties', label: 'الأطراف والصفات', placeholder: 'المشتكي، المتهم، المدعي بالحق المدني...' },
      { name: 'evidence', label: 'الأدلة المتوفرة', type: 'textarea', placeholder: 'أقوال، تقارير، شهود، تسجيلات، مستندات...' },
      { name: 'defenses', label: 'الدفوع أو الملاحظات الحالية', type: 'textarea', placeholder: 'اكتب أي دفع أو نقطة تريد فحصها' }
    ]
  },
  jaafari: {
    title: 'المساعد الشرعي الجعفري',
    subtitle: 'مساحة منظمة لتحليل الوقائع والطلبات في القضايا الشرعية الجعفرية وصياغة المسودات.',
    action: 'بدء الاستشارة الشرعية',
    fields: [
      { name: 'subject', label: 'نوع الدعوى', type: 'select', options: ['نفقة', 'حضانة', 'تفريق', 'طلاق', 'إرث', 'مهر', 'دعوى أخرى'] },
      { name: 'court', label: 'المحكمة', placeholder: 'المحكمة أو المنطقة إن وجدت' },
      { name: 'parties', label: 'بيانات الأطراف', placeholder: 'صفة كل طرف دون الحاجة لذكر بيانات حساسة غير لازمة' },
      { name: 'facts', label: 'الوقائع الأساسية', type: 'textarea', placeholder: 'رتّب أهم الوقائع والتواريخ والطلبات' },
      { name: 'request', label: 'الطلب', placeholder: 'ما النتيجة أو الصياغة التي تريدها؟' }
    ]
  },
  draft: {
    title: 'كتابة لائحة',
    subtitle: 'أدخل بيانات الدعوى بشكل منظم ليُنشئ الذكاء الاصطناعي مسودة لائحة عراقية قابلة للمراجعة.',
    action: 'إنشاء اللائحة بالذكاء الاصطناعي',
    fields: [
      { name: 'pleadingType', label: 'نوع اللائحة', type: 'select', options: ['لائحة دعوى', 'لائحة جوابية', 'مذكرة', 'طلب', 'استئناف', 'اعتراض', 'لائحة أخرى'] },
      { name: 'court', label: 'المحكمة', placeholder: 'مثال: محكمة بداءة ...', required: true },
      { name: 'caseNumber', label: 'رقم الدعوى', placeholder: 'إن وجد' },
      { name: 'plaintiff', label: 'المدعي / الطالب', placeholder: 'الاسم أو الصفة' },
      { name: 'defendant', label: 'المدعى عليه / المطلوب ضده', placeholder: 'الاسم أو الصفة' },
      { name: 'subject', label: 'موضوع الدعوى', placeholder: 'موضوع اللائحة بإيجاز', required: true },
      { name: 'facts', label: 'الوقائع', type: 'textarea', placeholder: 'اكتب الوقائع بتسلسل واضح', required: true },
      { name: 'requests', label: 'الطلبات', type: 'textarea', placeholder: 'ما الذي تريد طلبه من المحكمة؟', required: true }
    ]
  },
  analysis: {
    title: 'تحليل قضية',
    subtitle: 'تحليل شامل للوقائع والمسائل القانونية والأدلة ونقاط القوة والضعف وما ينقص الملف.',
    action: 'حلّل القضية بالذكاء الاصطناعي',
    fields: [
      { name: 'subject', label: 'عنوان القضية', placeholder: 'مثال: نزاع عقد بيع', required: true },
      { name: 'category', label: 'تصنيف القضية', type: 'select', options: ['مدني', 'جزائي', 'شرعي جعفري', 'إداري / موظفين', 'تجاري', 'أخرى'] },
      { name: 'court', label: 'المحكمة أو الجهة', placeholder: 'إن وجدت' },
      { name: 'parties', label: 'الأطراف', placeholder: 'صفّة كل طرف في القضية' },
      { name: 'facts', label: 'الوقائع الرئيسية', type: 'textarea', placeholder: 'أهم الوقائع بالترتيب', required: true },
      { name: 'evidence', label: 'الأدلة والمستندات', type: 'textarea', placeholder: 'ما المتوفر حالياً من أدلة أو مستندات؟' }
    ]
  },
  appeal: {
    title: 'لائحة تمييزية',
    subtitle: 'رتّب القرار المطعون فيه وأسباب الاعتراض ليُنشئ الذكاء الاصطناعي مسودة تمييزية منظمة.',
    action: 'إنشاء اللائحة التمييزية',
    fields: [
      { name: 'court', label: 'المحكمة التي أصدرت القرار', placeholder: 'اسم المحكمة', required: true },
      { name: 'decision', label: 'رقم وتاريخ القرار', placeholder: 'إن وجد' },
      { name: 'subject', label: 'موضوع القرار', placeholder: 'موضوع الدعوى والحكم بإيجاز', required: true },
      { name: 'ruling', label: 'منطوق القرار', type: 'textarea', placeholder: 'ما الذي قررت به المحكمة؟' },
      { name: 'grounds', label: 'أسباب الطعن', type: 'textarea', placeholder: 'اكتب أسباب الاعتراض أو الأخطاء التي تراها', required: true },
      { name: 'requests', label: 'الطلب النهائي', placeholder: 'مثال: نقض القرار وإعادة الدعوى...' }
    ]
  },
  employees: {
    title: 'قضاء الموظفين',
    subtitle: 'حلّل القرار الإداري أو النزاع الوظيفي وحدد المستندات وأوجه الاعتراض والخطوات المناسبة.',
    action: 'تحليل القضية الإدارية',
    fields: [
      { name: 'subject', label: 'موضوع النزاع', placeholder: 'مثال: عقوبة انضباطية، ترقية، راتب، إحالة للتقاعد', required: true },
      { name: 'entity', label: 'جهة العمل / الجهة الإدارية', placeholder: 'اسم الجهة' },
      { name: 'decision', label: 'القرار أو الإجراء', placeholder: 'رقم القرار وتاريخه إن وجد' },
      { name: 'grievance', label: 'التظلم أو المراجعات السابقة', type: 'textarea', placeholder: 'اكتب ما تم تقديمه سابقاً والنتيجة' },
      { name: 'facts', label: 'الوقائع', type: 'textarea', placeholder: 'رتّب ما حصل زمنياً', required: true },
      { name: 'documents', label: 'المستندات', type: 'textarea', placeholder: 'الأوامر الإدارية، كتب الشكر، العقوبات، المراسلات...' }
    ]
  }
};

let activeTool = 'analysis';
let toastTimer;
let currentResultText = '';
let currentModel = '';
let lastSubmission = null;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function createField(field) {
  const wrapper = document.createElement('label');
  wrapper.className = `field-block${field.type === 'textarea' ? ' full-width' : ''}`;

  const label = document.createElement('span');
  label.className = 'field-label';
  label.textContent = field.label;
  if (field.required) {
    const required = document.createElement('em');
    required.textContent = ' مطلوب';
    label.appendChild(required);
  }

  let control;
  if (field.type === 'textarea') {
    control = document.createElement('textarea');
    control.rows = 4;
  } else if (field.type === 'select') {
    control = document.createElement('select');
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = `اختر ${field.label}`;
    control.appendChild(placeholder);
    for (const optionText of field.options || []) {
      const option = document.createElement('option');
      option.value = optionText;
      option.textContent = optionText;
      control.appendChild(option);
    }
  } else {
    control = document.createElement('input');
    control.type = 'text';
    control.autocomplete = 'off';
  }

  control.name = field.name;
  control.dataset.fieldLabel = field.label;
  control.placeholder = field.placeholder || '';
  if (field.required) control.required = true;

  wrapper.append(label, control);
  return wrapper;
}

function renderToolFields(toolName) {
  dynamicFields.innerHTML = '';
  const config = toolConfig[toolName];
  for (const field of config.fields) {
    dynamicFields.appendChild(createField(field));
  }
}

function openTool(toolName) {
  activeTool = toolConfig[toolName] ? toolName : 'analysis';
  const config = toolConfig[activeTool];

  sheetTitle.textContent = config.title;
  sheetSubtitle.textContent = config.subtitle;
  submitLabel.textContent = config.action;
  renderToolFields(activeTool);
  resetResultOnly();
  caseDetails.value = '';
  caseFiles.value = '';
  updateFileLabel();

  toolSheet.classList.add('is-open');
  toolSheet.setAttribute('aria-hidden', 'false');
  document.body.classList.add('sheet-open');

  const firstControl = dynamicFields.querySelector('input, select, textarea');
  window.setTimeout(() => firstControl?.focus({ preventScroll: true }), 320);
}

function closeTool() {
  toolSheet.classList.remove('is-open');
  toolSheet.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('sheet-open');
}

function resetResultOnly() {
  aiResult.hidden = true;
  resultContent.innerHTML = '';
  followUpBox.hidden = true;
  followUpInput.value = '';
  currentResultText = '';
  currentModel = '';
  lastSubmission = null;
  resultModel.textContent = 'AI';
}

function clearForm() {
  aiForm.reset();
  updateFileLabel();
  resetResultOnly();
  const firstControl = dynamicFields.querySelector('input, select, textarea');
  firstControl?.focus({ preventScroll: true });
  showToast('تم مسح الحقول');
}

function collectFields() {
  const fields = {};
  for (const control of dynamicFields.querySelectorAll('input, select, textarea')) {
    const value = control.value.trim();
    if (value) fields[control.dataset.fieldLabel || control.name] = value;
  }
  return fields;
}

function validateRequiredFields() {
  const required = [...dynamicFields.querySelectorAll('[required]')];
  const missing = required.find((control) => !control.value.trim());
  if (!missing) return true;

  missing.focus();
  missing.closest('.field-block')?.classList.add('field-error');
  window.setTimeout(() => missing.closest('.field-block')?.classList.remove('field-error'), 1600);
  showToast(`أكمل حقل: ${missing.dataset.fieldLabel || 'مطلوب'}`);
  return false;
}

function updateFileLabel() {
  const title = document.querySelector('.file-copy strong');
  const subtitle = document.querySelector('.file-copy small');
  const count = caseFiles.files.length;

  if (!count) {
    title.textContent = 'إضافة ملف نصي';
    subtitle.textContent = 'TXT / MD / CSV — يقرأه المتصفح عند إرسال الطلب فقط';
    return;
  }

  title.textContent = count === 1 ? caseFiles.files[0].name : `تم اختيار ${count} ملفات`;
  subtitle.textContent = 'سيتم تضمين النص مع الطلب دون حفظه في المتصفح';
}

async function readTextAttachments() {
  if (!caseFiles.files.length) return '';

  let combined = '';
  for (const file of [...caseFiles.files].slice(0, 6)) {
    const text = await file.text();
    const remaining = MAX_TEXT_ATTACHMENT_CHARS - combined.length;
    if (remaining <= 0) break;
    combined += `\n\n--- ملف: ${file.name} ---\n${text.slice(0, remaining)}`;
  }

  if (combined.length >= MAX_TEXT_ATTACHMENT_CHARS) {
    showToast('تم اختصار محتوى الملفات حتى لا يصبح الطلب كبيراً جداً');
  }

  return combined.trim();
}

function getTitleFromFields(fields) {
  return fields['موضوع الدعوى'] ||
    fields['موضوع القضية'] ||
    fields['عنوان القضية'] ||
    fields['نوع الدعوى'] ||
    fields['موضوع القرار'] ||
    fields['موضوع النزاع'] ||
    toolConfig[activeTool].title;
}

async function callAI(payload) {
  let response;
  try {
    response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch {
    throw new Error('تعذر الوصول إلى خادم الذكاء الاصطناعي. الواجهة تعمل، لكن الربط يحتاج استضافة تدعم الخادم عند اختيارها.');
  }

  let data = {};
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try { data = await response.json(); } catch { data = {}; }
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('الواجهة جاهزة، لكن مسار الذكاء الاصطناعي غير موجود على الاستضافة الحالية. سنربطه عند اختيار الاستضافة النهائية.');
    }
    if (data?.error === 'AI_NOT_CONFIGURED') {
      throw new Error(data.message || 'خدمة الذكاء الاصطناعي تحتاج إلى مفتاح API على الخادم.');
    }
    throw new Error(data?.message || data?.error || 'تعذر تشغيل الذكاء الاصطناعي حالياً.');
  }

  const text = String(data.text || '').trim();
  if (!text) throw new Error('وصل رد فارغ من خدمة الذكاء الاصطناعي. حاول مرة أخرى.');
  return { text, model: String(data.model || 'AI') };
}

function showLoading(message = 'الذكاء الاصطناعي يراجع التفاصيل ويجهّز النتيجة...') {
  aiResult.hidden = false;
  followUpBox.hidden = true;
  resultModel.textContent = 'يعمل الآن';
  resultContent.innerHTML = '';

  const loading = document.createElement('div');
  loading.className = 'ai-loading';
  loading.innerHTML = '<span>✦</span><p></p>';
  loading.querySelector('p').textContent = message;
  resultContent.appendChild(loading);
  aiResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderResult(text, model) {
  currentResultText = text;
  currentModel = model || 'AI';
  resultModel.textContent = currentModel.replace(/^gpt-/i, 'GPT ');
  resultContent.innerHTML = '';

  const textBox = document.createElement('div');
  textBox.className = 'ai-text';
  textBox.textContent = text;

  const actions = document.createElement('div');
  actions.className = 'result-actions';
  actions.innerHTML = `
    <button type="button" data-result-action="copy">نسخ النتيجة</button>
    <button type="button" data-result-action="download">حفظ كنص</button>
    <button type="button" data-result-action="new">طلب جديد</button>
  `;

  const disclaimer = document.createElement('p');
  disclaimer.className = 'result-disclaimer';
  disclaimer.textContent = 'مسودة مساعدة للمحامي — يجب التحقق من الوقائع والمراجع القانونية قبل الاعتماد.';

  resultContent.append(textBox, actions, disclaimer);
  followUpBox.hidden = false;
  followUpInput.value = '';

  actions.querySelector('[data-result-action="copy"]').addEventListener('click', copyResult);
  actions.querySelector('[data-result-action="download"]').addEventListener('click', downloadResult);
  actions.querySelector('[data-result-action="new"]').addEventListener('click', clearForm);
}

function renderError(message) {
  currentResultText = '';
  resultModel.textContent = 'تعذر الاتصال';
  resultContent.innerHTML = '';

  const box = document.createElement('div');
  box.className = 'error-box';
  const title = document.createElement('strong');
  title.textContent = 'تعذر إكمال الطلب';
  const text = document.createElement('p');
  text.textContent = message;
  box.append(title, text);
  resultContent.appendChild(box);
  followUpBox.hidden = true;
}

aiForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateRequiredFields()) return;

  const submitButton = aiForm.querySelector('.ai-submit');
  const config = toolConfig[activeTool];
  const fields = collectFields();
  const details = caseDetails.value.trim();

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitLabel.textContent = 'جاري التحليل...';
  showLoading();

  try {
    const attachmentText = await readTextAttachments();
    if (attachmentText) fields['محتوى الملفات النصية المرفقة'] = attachmentText;

    lastSubmission = {
      tool: activeTool,
      title: getTitleFromFields(fields),
      fields,
      details
    };

    const result = await callAI(lastSubmission);
    renderResult(result.text, result.model);
  } catch (error) {
    renderError(error.message || 'حدث خطأ غير متوقع.');
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitLabel.textContent = config.action;
  }
});

sendFollowUp.addEventListener('click', async () => {
  const followUp = followUpInput.value.trim();
  if (!followUp || !currentResultText || !lastSubmission) {
    showToast('اكتب طلب التعديل أو المتابعة أولاً');
    followUpInput.focus();
    return;
  }

  sendFollowUp.disabled = true;
  showLoading('جاري تعديل النتيجة حسب طلبك...');

  try {
    const result = await callAI({
      ...lastSubmission,
      previousResult: currentResultText,
      followUp
    });
    renderResult(result.text, result.model);
  } catch (error) {
    renderError(error.message || 'تعذر تنفيذ طلب المتابعة.');
  } finally {
    sendFollowUp.disabled = false;
  }
});

followUpInput.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault();
    sendFollowUp.click();
  }
});

async function copyResult() {
  if (!currentResultText) return;
  try {
    await navigator.clipboard.writeText(currentResultText);
    showToast('تم نسخ النتيجة');
  } catch {
    showToast('تعذر النسخ تلقائياً');
  }
}

function downloadResult() {
  if (!currentResultText) return;
  const blob = new Blob([currentResultText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `alaa-legal-${activeTool}-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('تم تجهيز الملف النصي');
}

document.querySelectorAll('.js-open-tool').forEach((button) => {
  button.addEventListener('click', () => openTool(button.dataset.tool));
});

document.querySelectorAll('[data-close-sheet]').forEach((element) => {
  element.addEventListener('click', closeTool);
});

clearFormButton.addEventListener('click', clearForm);
caseFiles.addEventListener('change', updateFileLabel);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toolSheet.classList.contains('is-open')) closeTool();
});

window.addEventListener('online', () => showToast('عاد الاتصال بالإنترنت'));
window.addEventListener('offline', () => showToast('أنت حالياً بدون اتصال — الواجهة تبقى متاحة لكن الذكاء الاصطناعي يحتاج الإنترنت'));

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
