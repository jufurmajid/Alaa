(() => {
  if (typeof toolConfig === 'undefined' || !toolConfig.criminal) return;

  const criminal = toolConfig.criminal;
  criminal.subtitle = 'حلّل القضية الجزائية أو اطلب كتابة لائحة مخصصة لمحكمة الجنح أو محكمة الجنايات من نفس القسم.';
  criminal.action = 'تشغيل المساعد الجزائي';

  if (!criminal.fields.some((field) => field?.name === 'criminalTask')) {
    const subjectIndex = criminal.fields.findIndex((field) => field?.name === 'subject');
    const insertAt = subjectIndex >= 0 ? subjectIndex + 1 : 0;
    criminal.fields.splice(insertAt, 0, {
      name: 'criminalTask',
      label: 'العمل المطلوب',
      type: 'select',
      options: [
        'تحليل القضية الجزائية',
        'كتابة لائحة أمام محكمة الجنح',
        'كتابة لائحة أمام محكمة الجنايات'
      ],
      required: true
    });
  }

  const SIX_FILES = 6;
  const TOTAL_BYTES = 18 * 1024 * 1024;

  updateFileLabel = function updateSixFileLabel() {
    const fieldLabel = caseFiles.closest('.field-block')?.querySelector('.field-label');
    const title = document.querySelector('.file-copy strong');
    const subtitle = document.querySelector('.file-copy small');
    const count = caseFiles.files.length;

    if (fieldLabel) fieldLabel.innerHTML = 'مستندات وصور القضية <small>اختياري — حتى 6 ملفات / صفحات</small>';
    caseFiles.accept = '.pdf,.doc,.docx,.rtf,.odt,.txt,.md,.csv,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.webp';

    if (!count) {
      if (title) title.textContent = 'إضافة مستند أو صورة';
      if (subtitle) subtitle.textContent = 'يمكن رفع حتى 6 صفحات أو ملفات — PDF / Word / Excel / صور';
      return;
    }

    if (title) title.textContent = count === 1 ? caseFiles.files[0].name : `تم اختيار ${count} ملفات`;
    const totalMB = [...caseFiles.files].reduce((sum, file) => sum + file.size, 0) / (1024 * 1024);
    if (subtitle) subtitle.textContent = `الحجم الكلي ${totalMB.toFixed(1)} MB — الحد الأقصى 18 MB`;
  };

  prepareAttachments = async function prepareSixAttachments() {
    const files = [...caseFiles.files];
    if (!files.length) return [];
    if (files.length > SIX_FILES) throw new Error(`يمكن إرفاق ${SIX_FILES} ملفات أو صفحات كحد أقصى في الطلب الواحد.`);

    let total = 0;
    for (const file of files) {
      const ext = extensionOf(file.name);
      if (!ACCEPTED_EXTENSIONS.has(ext)) throw new Error(`صيغة الملف ${file.name} غير مدعومة حالياً.`);
      if (file.size > MAX_SINGLE_FILE_BYTES) throw new Error(`الملف ${file.name} أكبر من 8 MB. قلّل حجمه ثم حاول مرة أخرى.`);
      total += file.size;
    }

    if (total > TOTAL_BYTES) {
      throw new Error('الحجم الكلي للمرفقات أكبر من 18 MB. قلّل حجم الصور أو الملفات ثم حاول مرة أخرى.');
    }

    const attachments = [];
    for (const file of files) {
      attachments.push({
        name: file.name,
        type: guessMime(file),
        dataUrl: await fileToDataUrl(file)
      });
    }
    return attachments;
  };

  const originalRenderToolFields = renderToolFields;
  renderToolFields = function renderWithCriminalTask(toolName) {
    originalRenderToolFields(toolName);
    if (toolName !== 'criminal') return;

    const task = dynamicFields.querySelector('select[name="criminalTask"]');
    if (!task) return;

    const updateTaskHint = () => {
      const existing = dynamicFields.querySelector('.criminal-task-hint');
      existing?.remove();
      if (!task.value.includes('كتابة لائحة')) return;

      const hint = document.createElement('div');
      hint.className = 'criminal-task-hint';
      hint.innerHTML = '<span>✦</span><p>عند اختيار كتابة لائحة، سيستخدم المساعد وقائع القضية والأدلة والدفوع والمرفقات لصياغة مسودة مناسبة للمحكمة المختارة.</p>';
      task.closest('.field-block')?.insertAdjacentElement('afterend', hint);
    };

    task.addEventListener('change', updateTaskHint);
    updateTaskHint();
  };

  updateFileLabel();

  const style = document.createElement('style');
  style.textContent = `
    .criminal-task-hint {
      grid-column: 1 / -1;
      display: flex;
      gap: 9px;
      align-items: flex-start;
      margin-top: -2px;
      padding: 10px 12px;
      border: 1px solid rgba(229,189,89,.16);
      border-radius: 13px;
      background: rgba(229,189,89,.055);
      color: #bfb49a;
      font-size: 10px;
      line-height: 1.8;
    }
    .criminal-task-hint span { color: #e5bd59; flex: 0 0 auto; }
    .criminal-task-hint p { margin: 0; }
  `;
  document.head.appendChild(style);
})();
