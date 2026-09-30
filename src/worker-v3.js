import baseWorker from './worker-v2.js';

const MAX_ATTACHMENTS = 6;
const BASE_WORKER_ATTACHMENTS = 4;
const MAX_EXTRA_TEXT = 50000;

const MARKDOWN_SUPPORTED = new Set([
  'pdf', 'docx', 'odt', 'csv', 'xls', 'xlsx',
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'gif', 'bmp',
  'html', 'htm', 'xml', 'ods', 'numbers'
]);

const CRIMINAL_DRAFT_PROMPT = `المستخدم اختار كتابة لائحة جزائية. المطلوب صياغة مسودة مهنية مخصصة للمحكمة المحددة في حقل «العمل المطلوب».
- إذا كان الاختيار «محكمة الجنح» فاجعل الصياغة مناسبة لمحكمة الجنح.
- إذا كان الاختيار «محكمة الجنايات» فاجعل الصياغة مناسبة لمحكمة الجنايات.
- اعتمد فقط على الوقائع والأطراف والأدلة والدفوع والمرفقات التي قدمها المستخدم.
- رتّب المسودة إلى: عنوان المحكمة، أطراف القضية وصفاتهم إن كانت معلومة، موضوع اللائحة، موجز الوقائع، الدفوع أو أوجه الدفاع ذات الصلة، ثم الطلبات الختامية.
- لا تخترع رقم دعوى أو مادة قانونية أو قراراً قضائياً أو تاريخاً أو اسماً غير موجود في البيانات.
- إذا كانت معلومة لازمة للصياغة مفقودة، ضع مكانها عبارة واضحة مثل «يستكمل من المحامي» بدل اختلاقها.
- اجعل النص صالحاً كمشروع لائحة للمراجعة والتعديل من المحامي علاء الدراجي.`;

function extensionOf(name) {
  const value = String(name || '');
  const index = value.lastIndexOf('.');
  return index === -1 ? '' : value.slice(index + 1).toLowerCase();
}

function dataUrlToBytes(dataUrl) {
  const source = String(dataUrl || '');
  const comma = source.indexOf(',');
  if (!source.startsWith('data:') || comma < 0 || !source.slice(0, comma).includes(';base64')) {
    throw new Error('صيغة أحد المرفقات الإضافية غير صحيحة.');
  }

  const meta = source.slice(5, comma);
  const mime = meta.split(';')[0] || 'application/octet-stream';
  const binary = atob(source.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { bytes, mime };
}

async function extractExtraAttachments(env, attachments) {
  if (!attachments.length) return '';

  const textParts = [];
  const documents = [];
  const skipped = [];

  for (const attachment of attachments) {
    const name = String(attachment?.name || 'مرفق إضافي').slice(0, 180);
    const ext = extensionOf(name);
    const { bytes, mime } = dataUrlToBytes(attachment?.dataUrl);

    if (ext === 'txt' || ext === 'md' || mime.startsWith('text/plain') || mime === 'text/markdown') {
      const text = new TextDecoder('utf-8').decode(bytes).trim();
      if (text) textParts.push(`### ${name}\n${text}`);
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
        textParts.push(`### ${item.name || 'مرفق إضافي'}\nتعذر استخراج محتوى هذا الملف: ${item.error || 'خطأ غير محدد'}`);
      } else if (typeof item?.data === 'string' && item.data.trim()) {
        textParts.push(`### ${item.name || 'مرفق إضافي'}\n${item.data.trim()}`);
      }
    }
  }

  if (skipped.length) {
    textParts.push(`### مرفقات إضافية لم تُقرأ\n${skipped.join('، ')}`);
  }

  return textParts.join('\n\n').slice(0, MAX_EXTRA_TEXT);
}

function json(body, status = 400) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isAiRoute = url.pathname === '/api/ai' || url.pathname === '/api/principles';

    if (!isAiRoute || request.method !== 'POST') {
      return baseWorker.fetch(request, env, ctx);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return baseWorker.fetch(request, env, ctx);
    }

    const attachments = Array.isArray(payload?.attachments) ? payload.attachments : [];
    if (attachments.length > MAX_ATTACHMENTS) {
      return json({
        error: 'TOO_MANY_ATTACHMENTS',
        message: 'يمكن رفع 6 ملفات أو صفحات كحد أقصى في الطلب الواحد.'
      });
    }

    const extraAttachments = attachments.slice(BASE_WORKER_ATTACHMENTS);
    const primaryAttachments = attachments.slice(0, BASE_WORKER_ATTACHMENTS);
    const extraSections = [];

    if (extraAttachments.length) {
      try {
        const extraText = await extractExtraAttachments(env, extraAttachments);
        if (extraText) extraSections.push(`محتوى الصفحات أو المرفقات الإضافية (5 و6):\n${extraText}`);
      } catch (error) {
        extraSections.push(`تعذر استخراج بعض المرفقات الإضافية آلياً: ${error?.message || 'خطأ غير محدد'}`);
      }
    }

    if (url.pathname === '/api/ai' && payload?.tool === 'criminal') {
      const task = String(payload?.fields?.['العمل المطلوب'] || '');
      if (task.includes('كتابة لائحة')) extraSections.push(CRIMINAL_DRAFT_PROMPT);
    }

    const forwardedPayload = {
      ...payload,
      attachments: primaryAttachments,
      details: [String(payload?.details || '').trim(), ...extraSections].filter(Boolean).join('\n\n')
    };

    const headers = new Headers(request.headers);
    headers.delete('content-length');
    headers.set('content-type', 'application/json');

    const forwardedRequest = new Request(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(forwardedPayload)
    });

    return baseWorker.fetch(forwardedRequest, env, ctx);
  }
};
