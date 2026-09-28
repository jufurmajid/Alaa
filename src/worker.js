const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_DATA_CHARS = 15_000_000;
const MAX_DOCUMENT_TEXT = 70000;

const TOOL_INSTRUCTIONS = {
  civil: 'أنت في قسم القضايا المدنية العراقية. رتّب الوقائع، حدّد المسائل القانونية، عناصر الإثبات، نقاط القوة والضعف، الدفوع المحتملة، والأسئلة التي ينبغي على المحامي طرحها. إذا طُلبت صياغة، قدّم مسودة مهنية قابلة للمراجعة.',
  criminal: 'أنت في قسم القضايا الجزائية العراقية. افصل بوضوح بين الوقائع والأدلة والادعاءات، وبيّن ما يحتاج إلى تحقق، والدفوع المحتملة، ونقاط القوة والضعف، والأسئلة المهمة. لا تفترض ثبوت واقعة لم يذكرها المستخدم.',
  jaafari: 'أنت في قسم القضاء الشرعي الجعفري في العراق. حلّل الوقائع والطلبات بصورة منظمة، واذكر ما يحتاج إلى مستند أو تحقق، ثم اقترح هيكلاً قانونياً عملياً للمحامي دون اختلاق نصوص أو أحكام أو فتاوى.',
  draft: 'مهمتك إعداد مسودة لائحة قانونية عراقية مرتبة ومهنية من المعلومات المقدمة. استخدم عنواناً مناسباً، بيانات الأطراف، الوقائع، الأساس القانوني بصياغة حذرة، ثم الطلبات. لا تخترع رقم مادة أو قرار قضائي غير متأكد منه؛ وعند الحاجة اكتب صراحةً أن المرجع يحتاج إلى تحقق من المحامي.',
  analysis: 'حلّل القضية تحليلاً عملياً للمحامي. أخرج بالترتيب: ملخصاً موجزاً، الوقائع الأساسية، المسائل القانونية، الأدلة الموجودة، الأدلة أو المعلومات الناقصة، نقاط القوة، نقاط الضعف، الدفوع المحتملة، أسئلة للموكل، والمقترح العملي للخطوة التالية.',
  appeal: 'أعد مسودة لائحة تمييزية عراقية من الوقائع وأسباب الاعتراض المدخلة. رتّبها إلى بيانات القرار المطعون فيه، موجز الوقائع، أسباب الطعن مفصّلة، ثم الطلبات. لا تختلق أرقام مواد أو سوابق قضائية.',
  employees: 'أنت في قسم قضاء الموظفين والقضاء الإداري العراقي. حلّل القرار أو النزاع الوظيفي، رتّب الوقائع، حدّد أوجه الاعتراض المحتملة، المستندات المهمة، والنقاط التي تحتاج تحققاً، ثم اقترح مسودة أو خطوات عملية بحسب طلب المستخدم.'
};

const BASE_INSTRUCTIONS = `أنت مساعد قانوني ذكي مخصص للاستخدام المهني الشخصي للمحامي علاء الدراجي في العراق.
اكتب بالعربية القانونية الواضحة والمهنية وبأسلوب منظم يسهل قراءته على الهاتف.
المخرجات مسودات مساعدة للمحامي وليست بديلاً عن مراجعته المهنية.
لا تختلق مادة قانونية أو رقم قرار أو حكم قضائي أو مصدر أو واقعة. إذا لم تكن متأكداً من مرجع محدد، صرّح بوضوح أن المرجع يحتاج إلى تحقق.
فرّق بين الوقائع التي زوّدك بها المستخدم وبين التحليل أو الاحتمالات.
لا تضف أسماء أو تواريخ أو مبالغ أو وقائع لم يذكرها المستخدم.
إذا كانت المعلومات غير كافية، اذكر النواقص قبل إعطاء نتيجة قطعية.
إذا أرفق المستخدم مستنداً أو صورة، اعتمد فقط على ما تم استخراجه منها بوضوح واذكر أي جزء غير واضح بدلاً من تخمينه.
لا تكرر التنبيهات العامة؛ ركّز على الفائدة العملية للمحامي.`;

const DEFENSE_INSTRUCTIONS = `إذا احتوت البيانات على حقل باسم «الدفوع المنتجة في الدعوى» أو طلب المستخدم استخراج الدفوع المنتجة، طبّق الآتي بدقة:
- لا تذكر اعتراضات عامة لا تغيّر مركز الخصوم؛ ركّز على الدفع الذي يمكن أن يؤثر فعلياً في قبول الدعوى أو ردها أو نطاقها أو الإثبات أو النتيجة.
- صنّف كل دفع، بحسب ما تسمح به الوقائع، إلى شكلي أو إجرائي أو موضوعي، وصرّح إذا كان التصنيف يحتاج تحققاً.
- لكل دفع اذكر: عنوان الدفع، الوقائع التي تسنده، لماذا يعد منتجاً، أثره المتوقع إذا قُبل، المستند أو الدليل اللازم، توقيت أو مرحلة إثارته إذا كانت مهمة، درجة الأولوية، وأقوى رد متوقع من الخصم وطريقة مواجهته.
- رتّب الدفوع من الأقوى والأكثر تأثيراً إلى الأضعف، وافصل بوضوح بين دفع مدعوم بالوقائع ودفع محتمل يحتاج معلومات إضافية.
- لا تختلق مادة قانونية أو رقم قرار أو سابقة. إذا احتاج الدفع إلى سند قانوني محدد ولم تكن متأكداً منه، قل إن المرجع يحتاج إلى تحقق من المحامي.
- في أدوات الصياغة والطعن، استخرج أيضاً دفوع الطرف المقابل المتوقعة والردود الممكنة عليها لتحصين اللائحة أو الطعن.
- إذا اختار المستخدم «لا أريد تحليل الدفوع في هذا الطلب»، فلا تضف قسم الدفوع إلا إذا كان ضرورياً لفهم طلبه.`;

const MARKDOWN_SUPPORTED = new Set([
  'pdf', 'docx', 'odt', 'csv', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp',
  'html', 'htm', 'xml', 'ods', 'numbers'
]);

function clean(value, maxLength = 12000) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function extensionOf(name) {
  const value = String(name || '');
  const index = value.lastIndexOf('.');
  return index === -1 ? '' : value.slice(index + 1).toLowerCase();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    }
  });
}

function dataUrlToBytes(dataUrl) {
  const source = String(dataUrl || '');
  const comma = source.indexOf(',');
  if (!source.startsWith('data:') || comma < 0 || !source.slice(0, comma).includes(';base64')) {
    throw new Error('صيغة أحد المرفقات غير صحيحة.');
  }

  if (source.length > MAX_ATTACHMENT_DATA_CHARS) {
    throw new Error('أحد المرفقات أكبر من الحد المسموح في هذه النسخة.');
  }

  const meta = source.slice(5, comma);
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const binary = atob(source.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { bytes, mime };
}

function serializeFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return '';
  const lines = [];
  for (const [label, raw] of Object.entries(fields)) {
    const value = clean(raw, 8000);
    if (value) lines.push(`${clean(label, 120)}: ${value}`);
  }
  return lines.join('\n');
}

async function extractAttachments(env, attachments) {
  if (!Array.isArray(attachments) || !attachments.length) return '';
  const selected = attachments.slice(0, MAX_ATTACHMENTS);
  const directText = [];
  const documents = [];
  const skipped = [];

  for (const attachment of selected) {
    if (!attachment || typeof attachment !== 'object') continue;
    const name = clean(attachment.name, 180) || 'document';
    const ext = extensionOf(name);
    const { bytes, mime } = dataUrlToBytes(attachment.dataUrl);

    if (ext === 'txt' || ext === 'md' || mime.startsWith('text/plain') || mime === 'text/markdown') {
      const text = new TextDecoder('utf-8').decode(bytes).trim();
      if (text) directText.push(`### ${name}\n${text}`);
      continue;
    }

    if (MARKDOWN_SUPPORTED.has(ext)) {
      documents.push({ name, blob: new Blob([bytes], { type: mime }) });
      continue;
    }

    skipped.push(name);
  }

  if (documents.length) {
    const converted = await env.AI.toMarkdown(documents, {
      conversionOptions: {
        output: { format: 'text' },
        pdf: { metadata: false }
      }
    });

    const results = Array.isArray(converted) ? converted : [converted];
    for (const item of results) {
      if (item?.format === 'error') {
        directText.push(`### ${item.name || 'مرفق'}\nتعذر استخراج محتوى هذا الملف آلياً: ${item.error || 'خطأ غير محدد'}`);
      } else if (typeof item?.data === 'string' && item.data.trim()) {
        directText.push(`### ${item.name || 'مرفق'}\n${item.data.trim()}`);
      }
    }
  }

  if (skipped.length) {
    directText.push(`### مرفقات لم تُقرأ\nالصيغ التالية غير مدعومة حالياً في التحويل المجاني: ${skipped.join('، ')}`);
  }

  return directText.join('\n\n').slice(0, MAX_DOCUMENT_TEXT);
}

function extractModelText(result) {
  if (typeof result === 'string') return result.trim();
  if (typeof result?.response === 'string') return result.response.trim();
  if (typeof result?.result === 'string') return result.result.trim();
  if (typeof result?.output_text === 'string') return result.output_text.trim();
  if (Array.isArray(result?.choices)) {
    const value = result.choices[0]?.message?.content;
    if (typeof value === 'string') return value.trim();
  }
  return '';
}

async function handleAI(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED', message: 'هذا المسار يقبل POST فقط.' }, 405);
  }

  if (!env.AI) {
    return json({ error: 'AI_BINDING_MISSING', message: 'ربط Workers AI غير مفعّل في إعدادات Cloudflare.' }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'INVALID_JSON', message: 'صيغة الطلب غير صحيحة.' }, 400);
  }

  try {
    const tool = TOOL_INSTRUCTIONS[payload?.tool] ? payload.tool : 'analysis';
    const title = clean(payload?.title, 500);
    const details = clean(payload?.details, 30000);
    const fields = serializeFields(payload?.fields);
    const followUp = clean(payload?.followUp, 4000);
    const previousResult = clean(payload?.previousResult, 18000);
    const attachmentText = await extractAttachments(env, payload?.attachments);

    if (!title && !details && !fields && !followUp && !attachmentText) {
      return json({ error: 'EMPTY_INPUT', message: 'أدخل تفاصيل القضية أو أرفق مستنداً أولاً.' }, 400);
    }

    const sections = [];
    if (title) sections.push(`عنوان الطلب:\n${title}`);
    if (fields) sections.push(`البيانات المدخلة:\n${fields}`);
    if (details) sections.push(`تفاصيل إضافية:\n${details}`);
    if (attachmentText) sections.push(`محتوى المرفقات المستخرج آلياً:\n${attachmentText}`);
    if (followUp) {
      sections.push(`النتيجة السابقة:\n${previousResult || '(لا توجد نتيجة سابقة)'}\n\nطلب المتابعة:\n${followUp}`);
    }

    const result = await env.AI.run(MODEL, {
      messages: [
        { role: 'system', content: `${BASE_INSTRUCTIONS}\n\n${TOOL_INSTRUCTIONS[tool]}\n\n${DEFENSE_INSTRUCTIONS}` },
        { role: 'user', content: sections.join('\n\n') }
      ],
      max_completion_tokens: 4500,
      temperature: 0.2,
      chat_template_kwargs: { enable_thinking: false }
    });

    const text = extractModelText(result);
    if (!text) {
      return json({ error: 'EMPTY_AI_RESPONSE', message: 'وصل رد فارغ من الذكاء الاصطناعي. حاول مرة أخرى.' }, 502);
    }

    return json({
      text,
      model: 'Gemma 4 • Cloudflare AI',
      provider: 'cloudflare-workers-ai'
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'حدث خطأ غير متوقع.';
    return json({ error: 'AI_ERROR', message }, 500);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/ai') {
      return handleAI(request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};
