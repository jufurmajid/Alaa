const TOOL_INSTRUCTIONS = {
  civil: `أنت في قسم القضايا المدنية العراقية. رتّب الوقائع، حدّد المسائل القانونية، عناصر الإثبات، نقاط القوة والضعف، الدفوع المحتملة، والأسئلة التي ينبغي على المحامي طرحها. إذا طُلبت صياغة، قدّم مسودة مهنية قابلة للمراجعة.`,
  criminal: `أنت في قسم القضايا الجزائية العراقية. افصل بوضوح بين الوقائع والأدلة والادعاءات، وبيّن ما يحتاج إلى تحقق، والدفوع المحتملة، ونقاط القوة والضعف، والأسئلة المهمة. لا تفترض ثبوت واقعة لم يذكرها المستخدم.`,
  jaafari: `أنت في قسم القضاء الشرعي الجعفري في العراق. حلّل الوقائع والطلبات بصورة منظمة، واذكر ما يحتاج إلى مستند أو تحقق، ثم اقترح هيكلاً قانونياً عملياً للمحامي دون اختلاق نصوص أو أحكام أو فتاوى.`,
  draft: `مهمتك إعداد مسودة لائحة قانونية عراقية مرتبة ومهنية من المعلومات المقدمة. استخدم عنواناً مناسباً، بيانات الأطراف، الوقائع، الأساس القانوني بصياغة حذرة، ثم الطلبات. لا تخترع رقم مادة أو قرار قضائي غير متأكد منه؛ وعند الحاجة اكتب صراحةً أن المرجع يحتاج إلى تحقق من المحامي.`,
  analysis: `حلّل القضية تحليلاً عملياً للمحامي. أخرج بالترتيب: ملخصاً موجزاً، الوقائع الأساسية، المسائل القانونية، الأدلة الموجودة، الأدلة أو المعلومات الناقصة، نقاط القوة، نقاط الضعف، الدفوع المحتملة، أسئلة للموكل، والمقترح العملي للخطوة التالية.`,
  appeal: `أعد مسودة لائحة تمييزية عراقية من الوقائع وأسباب الاعتراض المدخلة. رتّبها إلى بيانات القرار المطعون فيه، موجز الوقائع، أسباب الطعن مفصّلة، ثم الطلبات. لا تختلق أرقام مواد أو سوابق قضائية.`,
  employees: `أنت في قسم قضاء الموظفين والقضاء الإداري العراقي. حلّل القرار أو النزاع الوظيفي، رتّب الوقائع، حدّد أوجه الاعتراض المحتملة، المستندات المهمة، والنقاط التي تحتاج تحققاً، ثم اقترح مسودة أو خطوات عملية بحسب طلب المستخدم.`
};

const BASE_INSTRUCTIONS = `أنت مساعد قانوني ذكي مخصص للاستخدام المهني الشخصي للمحامي علاء الدراجي في العراق.
اكتب بالعربية القانونية الواضحة والمهنية وبأسلوب منظم يسهل قراءته على الهاتف.
المخرجات مسودات مساعدة للمحامي وليست بديلاً عن مراجعته المهنية.
لا تختلق مادة قانونية أو رقم قرار أو حكم قضائي أو مصدر أو واقعة. إذا لم تكن متأكداً من مرجع محدد، صرّح بوضوح أن المرجع يحتاج إلى تحقق.
فرّق بين الوقائع التي زوّدك بها المستخدم وبين التحليل أو الاحتمالات.
لا تضف أسماء أو تواريخ أو مبالغ أو وقائع لم يذكرها المستخدم.
إذا كانت المعلومات غير كافية، اذكر النواقص قبل إعطاء نتيجة قطعية.
إذا أرفق المستخدم مستنداً أو صورة، اعتمد فقط على ما يمكن قراءته بوضوح واذكر أي جزء غير واضح بدلاً من تخمينه.
لا تكرر تنبيهات عامة كثيرة؛ ركّز على الفائدة العملية للمحامي.`;

const MAX_ATTACHMENT_DATA_CHARS = 15_000_000;
const MAX_ATTACHMENTS = 4;

export class AIServiceError extends Error {
  constructor(message, code = 'AI_ERROR', status = 500) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.status = status;
  }
}

function clean(value, maxLength = 12000) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function extractText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        parts.push(content.text);
      }
    }
  }
  return parts.join('\n').trim();
}

function serializeFields(fields) {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) return '';

  const lines = [];
  for (const [label, rawValue] of Object.entries(fields)) {
    const value = clean(rawValue, 8000);
    if (value) lines.push(`${clean(label, 120)}: ${value}`);
  }
  return lines.join('\n');
}

function normalizeAttachments(input) {
  if (!Array.isArray(input)) return [];

  const output = [];
  for (const raw of input.slice(0, MAX_ATTACHMENTS)) {
    if (!raw || typeof raw !== 'object') continue;

    const name = clean(raw.name, 180) || 'document';
    const type = clean(raw.type, 120).toLowerCase();
    const dataUrl = String(raw.dataUrl || '').trim();

    if (!dataUrl.startsWith('data:') || !dataUrl.includes(';base64,')) continue;
    if (dataUrl.length > MAX_ATTACHMENT_DATA_CHARS) {
      throw new AIServiceError(`الملف ${name} أكبر من الحد المسموح في هذه النسخة.`, 'ATTACHMENT_TOO_LARGE', 413);
    }

    output.push({ name, type, dataUrl });
  }
  return output;
}

function buildResponseInput(text, attachments) {
  if (!attachments.length) return text;

  const content = [];
  for (const attachment of attachments) {
    if (attachment.type.startsWith('image/')) {
      content.push({
        type: 'input_image',
        image_url: attachment.dataUrl,
        detail: 'auto'
      });
      continue;
    }

    const item = {
      type: 'input_file',
      filename: attachment.name,
      file_data: attachment.dataUrl
    };

    if (attachment.type === 'application/pdf' || attachment.name.toLowerCase().endsWith('.pdf')) {
      item.detail = process.env.OPENAI_PDF_DETAIL || 'auto';
    }

    content.push(item);
  }

  content.push({ type: 'input_text', text });
  return [{ role: 'user', content }];
}

export async function generateLegalResponse(payload = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AIServiceError(
      'خدمة الذكاء الاصطناعي غير مفعّلة بعد. أضف OPENAI_API_KEY في متغيرات بيئة الخادم عند اختيار الاستضافة.',
      'AI_NOT_CONFIGURED',
      503
    );
  }

  const tool = TOOL_INSTRUCTIONS[payload.tool] ? payload.tool : 'analysis';
  const title = clean(payload.title, 500);
  const details = clean(payload.details, 30000);
  const fieldText = serializeFields(payload.fields);
  const followUp = clean(payload.followUp, 4000);
  const previousResult = clean(payload.previousResult, 18000);
  const attachments = normalizeAttachments(payload.attachments);

  if (!title && !details && !fieldText && !followUp && !attachments.length) {
    throw new AIServiceError('أدخل تفاصيل القضية أو أرفق مستنداً أولاً.', 'EMPTY_INPUT', 400);
  }

  const sections = [];
  if (title) sections.push(`عنوان الطلب:\n${title}`);
  if (fieldText) sections.push(`البيانات المدخلة:\n${fieldText}`);
  if (details) sections.push(`تفاصيل إضافية:\n${details}`);
  if (attachments.length) {
    sections.push(`المرفقات المرسلة مع الطلب: ${attachments.map((item) => item.name).join('، ')}. اقرأها واربط محتواها بالوقائع المدخلة دون افتراض ما لا يظهر فيها.`);
  }

  if (followUp) {
    sections.push(
      `النتيجة السابقة التي يريد المحامي تحسينها أو الاستفسار عنها:\n${previousResult || '(لا توجد نتيجة سابقة مرفقة)'}\n\nطلب المتابعة:\n${followUp}`
    );
  }

  const inputText = sections.join('\n\n');
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5.6-terra',
      instructions: `${BASE_INSTRUCTIONS}\n\n${TOOL_INSTRUCTIONS[tool]}`,
      input: buildResponseInput(inputText, attachments),
      store: false,
      reasoning: { effort: process.env.OPENAI_REASONING_EFFORT || 'medium' },
      max_output_tokens: Number(process.env.OPENAI_MAX_OUTPUT_TOKENS || 6000)
    })
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    // handled below
  }

  if (!response.ok) {
    const upstreamMessage = data?.error?.message || 'تعذر الاتصال بخدمة الذكاء الاصطناعي.';
    throw new AIServiceError(upstreamMessage, 'UPSTREAM_AI_ERROR', response.status || 502);
  }

  const text = extractText(data);
  if (!text) {
    throw new AIServiceError('وصل رد فارغ من خدمة الذكاء الاصطناعي.', 'EMPTY_AI_RESPONSE', 502);
  }

  return {
    text,
    model: data?.model || process.env.OPENAI_MODEL || 'gpt-5.6-terra'
  };
}
