const MODEL = '@cf/google/gemma-4-26b-a4b-it';
const MAX_ATTACHMENTS = 4;
const MAX_ATTACHMENT_DATA_CHARS = 15_000_000;
const MAX_DOCUMENT_TEXT = 70000;
const SJC_ROOT = 'https://www.sjc.iq/';
const SJC_PRINCIPLES_HOME = 'https://www.sjc.iq/indexqanoun-ar.php';

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

const DEFENSE_INSTRUCTIONS = `إذا كان طلب المستخدم متعلقاً بالدفوع المنتجة فركّز على الدفع الذي يمكن أن يؤثر فعلياً في قبول الدعوى أو ردها أو نطاقها أو الإثبات أو النتيجة. صنّف كل دفع بحسب ما تسمح به الوقائع، واذكر أثره ودليله وتوقيت إثارته وأولوية الدفع والرد المتوقع من الخصم. لا تختلق مادة قانونية أو رقم قرار أو سابقة.`;

const MARKDOWN_SUPPORTED = new Set([
  'pdf', 'docx', 'odt', 'csv', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp',
  'html', 'htm', 'xml', 'ods', 'numbers'
]);

const PRINCIPLE_CATEGORIES = {
  'مدني': { path: 'qanoun/civilian/', labels: ['مدني'], display: 'مدني' },
  'شرعي / أحوال شخصية': { path: 'qanoun/family/', labels: ['احوال شخصية', 'أحوال شخصية', 'مواد شخصية', 'شرعي'], display: 'شرعي / أحوال شخصية' },
  'جزاء': { path: 'qanoun/disciplinary/', labels: ['جزائي', 'جنائي'], display: 'جزاء' }
};

const STOP_WORDS = new Set([
  'الذي','التي','الذين','هذا','هذه','ذلك','تلك','هناك','كانت','كان','يكون','تكون','على','إلى','الى','عن','من','في','مع','بعد','قبل','عند','بين','لدى','ضمن','حول','أو','او','ثم','وقد','كما','بسبب','بشأن','موضوع','دعوى','الدعوى','قضية','القضية','واقعة','الواقعة','حدث','الحدث','طلب','المحكمة','محكمة','القانون','قانون','العراق','العراقي','العراقية','المذكور','المذكورة','بحيث','فإن','فان','إن','ان','أنه','انه','أنها','انها','وهو','وهي','وذلك','لذلك','إذا','اذا','حيث','بأن','بان','أيضاً','ايضا'
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

function decodeEntities(value) {
  return String(value || '')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function htmlToText(html, preserveLines = false) {
  let value = String(html || '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<\/(?:p|div|tr|td|th|li|h[1-6]|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');
  value = decodeEntities(value).replace(/\r/g, '');
  if (preserveLines) {
    return value
      .split('\n')
      .map((line) => line.replace(/[\t ]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n');
  }
  return value.replace(/\s+/g, ' ').trim();
}

function getAttr(tag, name) {
  const match = String(tag || '').match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, 'i'));
  if (match) return decodeEntities(match[1]);
  const plain = String(tag || '').match(new RegExp(`${name}\\s*=\\s*([^\\s>]+)`, 'i'));
  return plain ? decodeEntities(plain[1].replace(/["']/g, '')) : '';
}

function normalizeArabic(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeSearch(value) {
  const normalized = normalizeArabic(value);
  const output = [];
  const seen = new Set();
  for (const token of normalized.split(' ')) {
    if (token.length < 3 || STOP_WORDS.has(token) || /^\d+$/.test(token) || seen.has(token)) continue;
    seen.add(token);
    output.push(token);
  }
  return output;
}

function deriveSearchTerms(facts, focus) {
  const focused = tokenizeSearch(focus);
  const factsTokens = tokenizeSearch(facts);
  const merged = [...focused, ...factsTokens];
  return [...new Set(merged)].slice(0, 6);
}

function categoryMatches(text, category) {
  const normalized = normalizeArabic(text);
  return category.labels.some((label) => normalized.includes(normalizeArabic(label)));
}

function normalizeOfficialUrl(href) {
  try {
    const url = new URL(decodeEntities(href), SJC_ROOT);
    if (url.hostname !== 'www.sjc.iq' && url.hostname !== 'sjc.iq') return '';
    return url.href;
  } catch {
    return '';
  }
}

function parsePrincipleRows(html, category) {
  const rows = [...String(html || '').matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)].map((match) => match[0]);
  const candidates = [];

  for (const row of rows) {
    const hrefMatches = [...row.matchAll(/href\s*=\s*["']([^"']+)["']/gi)];
    const detailHref = hrefMatches.map((m) => normalizeOfficialUrl(m[1])).find((url) => /\/qview\./i.test(url));
    if (!detailHref) continue;

    const text = htmlToText(row);
    if (!text || !categoryMatches(text, category)) continue;
    candidates.push({ url: detailHref, text: clean(text, 3500) });
  }

  return candidates;
}

function dedupeCandidates(candidates) {
  const map = new Map();
  for (const item of candidates) {
    if (!item?.url || map.has(item.url)) continue;
    map.set(item.url, item);
  }
  return [...map.values()];
}

function scoreCandidate(candidate, queryTokens) {
  const text = normalizeArabic(candidate.text);
  let score = 0;
  for (const token of queryTokens) {
    const normalized = normalizeArabic(token);
    if (!normalized) continue;
    if (text.includes(normalized)) score += normalized.length >= 6 ? 4 : 2;
  }
  return score;
}

function findKeywordSearchForm(html) {
  const forms = [...String(html || '').matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map((match) => match[0]);
  const form = forms.find((item) => {
    const text = normalizeArabic(htmlToText(item));
    return text.includes('كلمه') && (text.includes('المبدا') || text.includes('الحكم') || text.includes('القرار'));
  });
  if (!form) return null;

  const openTag = form.match(/<form\b[^>]*>/i)?.[0] || '';
  const method = (getAttr(openTag, 'method') || 'get').toLowerCase();
  const action = normalizeOfficialUrl(getAttr(openTag, 'action') || SJC_PRINCIPLES_HOME);
  if (!action) return null;

  const inputs = [...form.matchAll(/<input\b[^>]*>/gi)].map((match) => match[0]);
  const textInput = inputs.find((tag) => {
    const type = (getAttr(tag, 'type') || 'text').toLowerCase();
    return ['text', 'search'].includes(type) && getAttr(tag, 'name');
  });
  if (!textInput) return null;

  const textName = getAttr(textInput, 'name');
  const fixed = [];
  for (const input of inputs) {
    const type = (getAttr(input, 'type') || 'text').toLowerCase();
    const name = getAttr(input, 'name');
    if (!name || name === textName) continue;
    if (type === 'hidden' || type === 'submit') fixed.push([name, getAttr(input, 'value') || 'بحث']);
  }

  return { action, method, textName, fixed };
}

async function fetchOfficialHtml(url, init = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      'accept': 'text/html,application/xhtml+xml',
      'accept-language': 'ar,en;q=0.7',
      'user-agent': 'AlaaLegalAssistant/1.0 (+official-principles-search)',
      ...(init.headers || {})
    }
  });
  if (!response.ok) throw new Error(`تعذر الوصول إلى المصدر القضائي الرسمي (${response.status}).`);
  return response.text();
}

async function officialKeywordSearch(form, keyword, category) {
  const params = new URLSearchParams(form.fixed);
  params.set(form.textName, keyword);

  let html;
  if (form.method === 'post') {
    html = await fetchOfficialHtml(form.action, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
      body: params.toString()
    });
  } else {
    const url = new URL(form.action);
    for (const [key, value] of params) url.searchParams.set(key, value);
    html = await fetchOfficialHtml(url.href);
  }

  return parsePrincipleRows(html, category);
}

async function fallbackCategorySearch(category, queryTokens) {
  const base = new URL(category.path, SJC_ROOT).href;
  const urls = [base];
  for (let page = 0; page <= 8; page += 1) urls.push(new URL(`page_${page}/`, base).href);

  const pages = await Promise.allSettled(urls.map((url) => fetchOfficialHtml(url)));
  const candidates = [];
  for (const page of pages) {
    if (page.status !== 'fulfilled') continue;
    candidates.push(...parsePrincipleRows(page.value, category));
  }

  return dedupeCandidates(candidates)
    .map((item) => ({ ...item, score: scoreCandidate(item, queryTokens) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 14);
}

async function searchOfficialPrinciples(category, facts, focus) {
  const queryTokens = deriveSearchTerms(facts, focus);
  let candidates = [];

  try {
    const home = await fetchOfficialHtml(SJC_PRINCIPLES_HOME);
    const form = findKeywordSearchForm(home);
    if (form) {
      const terms = queryTokens.slice(0, 4);
      const results = await Promise.allSettled(terms.map((term) => officialKeywordSearch(form, term, category)));
      for (const result of results) {
        if (result.status === 'fulfilled') candidates.push(...result.value);
      }
    }
  } catch {
    // Fallback below.
  }

  candidates = dedupeCandidates(candidates)
    .map((item) => ({ ...item, score: scoreCandidate(item, queryTokens) }))
    .sort((a, b) => b.score - a.score);

  if (candidates.length < 5 || (candidates[0]?.score || 0) < 2) {
    const fallback = await fallbackCategorySearch(category, queryTokens);
    candidates = dedupeCandidates([...candidates, ...fallback])
      .map((item) => ({ ...item, score: scoreCandidate(item, queryTokens) }))
      .sort((a, b) => b.score - a.score);
  }

  return candidates.slice(0, 10);
}

function parseDecisionDetail(html, url) {
  const text = htmlToText(html, true);
  const flat = text.replace(/\s+/g, ' ').trim();

  const type = flat.match(/نوع القرار\s*::?\s*(.+?)\s+رقم القرار/i)?.[1]?.trim() || '';
  const number = flat.match(/رقم القرار\s*::?\s*(.+?)\s+تاريخ اصدار القرار/i)?.[1]?.trim() || '';
  const date = flat.match(/تاريخ اصدار القرار\s*::?\s*(.+?)\s+جهة الاصدار/i)?.[1]?.trim() || '';
  const issuer = flat.match(/جهة الاصدار\s*::?\s*(.+?)\s+مبدأ القرار/i)?.[1]?.trim() || '';
  const principle = flat.match(/مبدأ القرار\s*(.+?)\s+نص القرار/i)?.[1]?.trim() || '';

  return {
    url,
    type: clean(type, 160),
    number: clean(number, 240),
    date: clean(date, 120),
    issuer: clean(issuer, 260),
    principle: clean(principle, 5000)
  };
}

async function enrichCandidates(candidates) {
  const selected = candidates.slice(0, 6);
  const results = await Promise.allSettled(selected.map(async (candidate) => {
    const html = await fetchOfficialHtml(candidate.url);
    const detail = parseDecisionDetail(html, candidate.url);
    if (!detail.principle) detail.principle = candidate.text;
    return detail;
  }));

  const output = [];
  for (const result of results) {
    if (result.status === 'fulfilled') output.push(result.value);
  }
  return output;
}

async function handlePrinciples(request, env) {
  if (request.method !== 'POST') {
    return json({ error: 'METHOD_NOT_ALLOWED', message: 'هذا المسار يقبل POST فقط.' }, 405);
  }
  if (!env.AI) {
    return json({ error: 'AI_BINDING_MISSING', message: 'ربط Workers AI غير مفعّل.' }, 503);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'INVALID_JSON', message: 'صيغة الطلب غير صحيحة.' }, 400);
  }

  const categoryName = clean(payload?.category, 80);
  const category = PRINCIPLE_CATEGORIES[categoryName];
  if (!category) {
    return json({ error: 'INVALID_CATEGORY', message: 'اختر نوع المبدأ: مدني أو شرعي / أحوال شخصية أو جزاء.' }, 400);
  }

  const facts = clean(payload?.facts, 24000);
  const focus = clean(payload?.focus, 1000);
  const details = clean(payload?.details, 8000);
  let attachmentText = '';
  try {
    attachmentText = await extractAttachments(env, payload?.attachments);
  } catch (error) {
    return json({ error: 'ATTACHMENT_ERROR', message: error?.message || 'تعذر قراءة المرفقات.' }, 400);
  }

  const fullFacts = [facts, focus ? `النقطة القانونية: ${focus}` : '', details, attachmentText].filter(Boolean).join('\n\n');
  if (!fullFacts.trim()) {
    return json({ error: 'EMPTY_INPUT', message: 'اكتب الواقعة أو الحدث المراد البحث له عن مبدأ تمييزي.' }, 400);
  }

  try {
    const candidates = await searchOfficialPrinciples(category, fullFacts, focus);
    if (!candidates.length) {
      return json({
        text: `لم أعثر على مبدأ مطابق بصورة موثوقة في النتائج التي أمكن الوصول إليها من قاعدة مبادئ محكمة التمييز الاتحادية.\n\nالمصدر الرسمي للبحث اليدوي:\n${SJC_PRINCIPLES_HOME}\n\nجرّب إعادة صياغة الواقعة بكلمات قانونية أدق أو تحديد النقطة القانونية المطلوبة.`,
        model: 'بحث رسمي • مجلس القضاء الأعلى',
        provider: 'sjc-official'
      });
    }

    const detailsList = await enrichCandidates(candidates);
    if (!detailsList.length) {
      return json({
        text: `تم العثور على نتائج أولية لكن تعذر فتح تفاصيل القرارات من المصدر الرسمي حالياً. أعد المحاولة بعد قليل.\n\nالمصدر الرسمي:\n${SJC_PRINCIPLES_HOME}`,
        model: 'بحث رسمي • مجلس القضاء الأعلى',
        provider: 'sjc-official'
      }, 502);
    }

    const sourceBlock = detailsList.map((item, index) => [
      `المرشح ${index + 1}`,
      `النوع: ${item.type || category.display}`,
      `رقم القرار: ${item.number || 'غير ظاهر'}`,
      `التاريخ: ${item.date || 'غير ظاهر'}`,
      `جهة الإصدار: ${item.issuer || 'غير ظاهرة'}`,
      `مبدأ القرار: ${item.principle}`,
      `الرابط الرسمي: ${item.url}`
    ].join('\n')).join('\n\n');

    const prompt = `أمامك واقعة قدمها محامٍ عراقي ونتائج مستخرجة مباشرة من الموقع الرسمي لمجلس القضاء الأعلى العراقي.
مهمتك اختيار المبادئ التمييزية الأقرب فقط من النتائج المرفقة، ولا يجوز لك اختراع أي قرار أو رقم أو تاريخ أو مبدأ من ذاكرتك.
إذا لم يكن أي مرشح مطابقاً بصورة معقولة، قل ذلك صراحة ولا تجبر المطابقة.

نوع البحث: ${category.display}
الواقعة أو الحدث:
${fullFacts}

النتائج الرسمية المتاحة:
${sourceBlock}

أخرج النتيجة بهذا الترتيب:
### المبدأ التمييزي الأقرب
- نوع القرار
- رقم القرار
- تاريخ القرار
- جهة الإصدار
- نص المبدأ كما ورد في المصدر قدر الإمكان دون إضافة حكم غير موجود
- وجه الانطباق على الواقعة
- درجة الصلة: قوية / متوسطة / ضعيفة مع سبب مختصر
- المصدر الرسمي: الرابط نفسه

### مبادئ قريبة أخرى
اذكر بحد أقصى مبدأين من المرشحين إن كانا مفيدين، مع رقم القرار والرابط وسبب الصلة.

### ملاحظة للمحامي
اذكر حدود المطابقة وما يحتاج إلى تحقق من ملف الدعوى. لا تقدّم المبدأ على أنه حاسم للواقعة الجديدة لمجرد التشابه.`;

    const result = await env.AI.run(MODEL, {
      messages: [
        {
          role: 'system',
          content: 'أنت باحث قانوني مساعد للمحامي علاء الدراجي. في هذه المهمة لا تستخدم الذاكرة لإنشاء سوابق قضائية. استخدم حصراً المبادئ والقرارات الرسمية المرفقة في رسالة المستخدم.'
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 3500,
      temperature: 0.1,
      chat_template_kwargs: { enable_thinking: false }
    });

    const text = extractModelText(result);
    if (!text) throw new Error('وصل رد فارغ من محرك مطابقة المبادئ.');

    return json({
      text,
      model: 'بحث رسمي • تمييز اتحادي',
      provider: 'sjc-official+cloudflare-ai',
      source: SJC_PRINCIPLES_HOME
    });
  } catch (error) {
    return json({
      error: 'PRINCIPLES_SEARCH_ERROR',
      message: error?.message || 'تعذر البحث في المبادئ التمييزية حالياً.'
    }, 502);
  }
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

    if (url.pathname === '/api/principles') {
      return handlePrinciples(request, env);
    }

    if (url.pathname === '/api/ai') {
      return handleAI(request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response('Not found', { status: 404 });
  }
};
