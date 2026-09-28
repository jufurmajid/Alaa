(() => {
  if (typeof toolConfig === 'undefined' || typeof renderToolFields !== 'function') return;

  const defenseField = {
    name: 'productiveDefenses',
    label: 'الدفوع المنتجة في الدعوى',
    type: 'select',
    options: [
      'تحليل شامل وترتيب الدفوع المنتجة حسب الأولوية',
      'الدفوع الشكلية والإجرائية فقط',
      'الدفوع الموضوعية فقط',
      'دفوع الخصم والرد عليها',
      'لا أريد تحليل الدفوع في هذا الطلب'
    ]
  };

  const guidanceText = [
    'عند طلب تحليل الدفوع المنتجة افحص فقط الدفوع التي يمكن أن تؤثر فعلياً في نتيجة الدعوى أو سيرها.',
    'صنّف كل دفع إلى شكلي أو إجرائي أو موضوعي بحسب طبيعته، ولا تجزم بالتصنيف إذا كانت الوقائع غير كافية.',
    'لكل دفع اذكر: عنوان الدفع، أساسه من الوقائع المقدمة، سبب كونه منتجاً، أثره المتوقع إذا قُبل، ما يلزم لإثباته، توقيت أو مرحلة إثارته إن كانت مهمة، أولوية الدفع، وأقوى رد محتمل من الخصم وكيفية مواجهته.',
    'رتّب الدفوع من الأقوى والأكثر تأثيراً إلى الأضعف، وافصل بين دفع مؤكد ودفع محتمل يحتاج مستنداً أو واقعة إضافية.',
    'لا تختلق مادة قانونية أو رقم قرار أو سابقة قضائية. إذا احتاج الدفع إلى سند قانوني محدد ولم تكن متأكداً منه فاكتب أن المرجع يحتاج إلى تحقق من المحامي.',
    'إذا كان نوع الأداة صياغة لائحة أو طعن، استخرج أيضاً الدفوع أو الردود المتوقعة من الطرف المقابل حتى يتمكن المحامي من تحصين الصياغة.'
  ].join(' ');

  Object.values(toolConfig).forEach((config) => {
    if (!Array.isArray(config.fields)) return;
    if (config.fields.some((field) => field?.name === defenseField.name)) return;

    const subjectIndex = config.fields.findIndex((field) => ['subject', 'category', 'pleadingType'].includes(field?.name));
    const insertAt = subjectIndex >= 0 ? subjectIndex + 1 : Math.min(2, config.fields.length);
    config.fields.splice(insertAt, 0, { ...defenseField });
  });

  function decorateDefenseField() {
    const select = document.querySelector('#dynamicFields select[name="productiveDefenses"]');
    if (!select) return;

    const wrapper = select.closest('.field-block');
    if (!wrapper) return;
    wrapper.classList.add('productive-defenses-field');

    if (!select.value && select.options.length > 1) select.selectedIndex = 1;

    if (!wrapper.querySelector('.productive-defenses-info')) {
      const info = document.createElement('div');
      info.className = 'productive-defenses-info';
      info.innerHTML = `
        <span class="defense-badge" aria-hidden="true">⚖</span>
        <div>
          <strong>تحليل دفوع مؤثرة وليست مجرد اعتراضات عامة</strong>
          <small>يرتبها الذكاء الاصطناعي حسب القوة والأولوية والأثر، ويبيّن ما يحتاج إثباتاً أو تحققاً.</small>
        </div>
      `;
      select.insertAdjacentElement('afterend', info);
    }

    let hidden = document.querySelector('#dynamicFields input[name="defenseGuidance"]');
    if (!hidden) {
      hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'defenseGuidance';
      hidden.dataset.fieldLabel = 'تعليمات تحليل الدفوع المنتجة';
      hidden.value = guidanceText;
      document.getElementById('dynamicFields')?.appendChild(hidden);
    }
  }

  const originalRenderToolFields = renderToolFields;
  renderToolFields = function enhancedRenderToolFields(toolName) {
    originalRenderToolFields(toolName);
    decorateDefenseField();
  };

  const clearButton = document.getElementById('clearForm');
  clearButton?.addEventListener('click', () => window.setTimeout(decorateDefenseField, 0));

  const followUpBox = document.getElementById('followUpBox');
  const followUpInput = document.getElementById('followUpInput');
  const sendFollowUp = document.getElementById('sendFollowUp');

  if (followUpBox && followUpInput && sendFollowUp && !followUpBox.querySelector('.productive-defense-action')) {
    const quick = document.createElement('button');
    quick.type = 'button';
    quick.className = 'productive-defense-action';
    quick.innerHTML = '<span>⚖</span><span>استخرج الدفوع المنتجة ورتّبها</span>';
    quick.addEventListener('click', () => {
      followUpInput.value = 'استخرج الدفوع المنتجة في هذه الدعوى فقط، وصنّفها ورتبها حسب القوة والأولوية والأثر، واذكر لكل دفع ما يلزم لإثباته وأقوى رد متوقع من الخصم.';
      followUpInput.dispatchEvent(new Event('input', { bubbles: true }));
      sendFollowUp.click();
    });
    const row = followUpBox.querySelector('.follow-up-row');
    if (row) followUpBox.insertBefore(quick, row);
  }

  const style = document.createElement('style');
  style.textContent = `
    .productive-defenses-field {
      position: relative;
      overflow: hidden;
      border: 1px solid rgba(229, 189, 89, .24);
      border-radius: 17px;
      padding: 14px;
      background: linear-gradient(145deg, rgba(229, 189, 89, .07), rgba(255, 255, 255, .015));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.025), 0 14px 34px rgba(0,0,0,.16);
    }
    .productive-defenses-field::before {
      content: '';
      position: absolute;
      inset: 0 auto 0 0;
      width: 2px;
      background: linear-gradient(180deg, transparent, #e5bd59, transparent);
      opacity: .72;
    }
    .productive-defenses-field .field-label {
      color: #f0ce75;
      font-weight: 800;
    }
    .productive-defenses-field select {
      margin-top: 8px;
    }
    .productive-defenses-info {
      display: flex;
      gap: 10px;
      align-items: flex-start;
      margin-top: 10px;
      padding: 10px 11px;
      border-radius: 12px;
      background: rgba(0, 0, 0, .24);
      border: 1px solid rgba(229, 189, 89, .10);
    }
    .productive-defenses-info .defense-badge {
      width: 28px;
      height: 28px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      flex: 0 0 auto;
      color: #f1cf74;
      background: rgba(229, 189, 89, .09);
      border: 1px solid rgba(229, 189, 89, .18);
    }
    .productive-defenses-info strong,
    .productive-defenses-info small {
      display: block;
    }
    .productive-defenses-info strong {
      color: #eee3c4;
      font-size: 11.5px;
      line-height: 1.75;
    }
    .productive-defenses-info small {
      color: #908878;
      font-size: 10px;
      line-height: 1.75;
      margin-top: 2px;
    }
    .productive-defense-action {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin: 10px 0;
      padding: 10px 12px;
      border-radius: 13px;
      border: 1px solid rgba(229, 189, 89, .28);
      background: linear-gradient(135deg, rgba(229, 189, 89, .10), rgba(184, 123, 35, .05));
      color: #f0ce75;
      font-family: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    .productive-defense-action:active { transform: scale(.985); }
  `;
  document.head.appendChild(style);
})();
