const TOOL_INSTRUCTIONS = {
  civil: `أنت في قسم القضايا المدنية. رتّب الوقائع، حدّد المسائل القانونية، عناصر الإثبات، نقاط القوة والضعف، الدفوع المحتملة، والأسئلة التي ينبغي على المحامي طرحها. إذا طُلبت صياغة، قدّم مسودة مهنية قابلة للمراجعة.`,
  criminal: `أنت في قسم القضايا الجزائية. افصل بين الوقائع والأدلة والادعاءات، وبيّن المسائل التي تحتاج تحققاً، والدفوع المحتملة، ونقاط القوة والضعف، والأسئلة المهمة. لا تفترض ثبوت أي واقعة لم يذكرها المستخدم.`,
  jaafari: `أنت في قسم القضاء الشرعي الجعفري. حلّل الوقائع والطلبات بصورة منظمة، واذكر ما يحتاج إلى مستند أو تحقق، ثم اقترح هيكلاً قانونياً عملياً للمحامي دون اختلاق نصوص أو أحكام.`,
  draft: `مهمتك إعداد مسودة لائحة قانونية عراقية مرتبة ومهنية من المعلومات المقدمة. استخدم عناوين واضحة، الوقائع، الأساس القانوني بصياغة حذرة، ثم الطلبات. لا تخترع رقم مادة أو قرار قضائي غير متأكد منه؛ عند الحاجة اكتب بوضوح أن المرجع يحتاج إلى تحقق من المحامي.`,
  analysis: `حلّل القضية تحليلاً عملياً للمحامي. أخرج: ملخصاً موجزاً، الوقائع الأساسية، المسائل القانونية، الأدلة الموجودة، الأدلة أو المعلومات الناقصة، نقاط القوة، نقاط الضعف، الدفوع المحتملة، أسئلة للموكل، والخطوة التالية المقترحة.`,
  appeal: `أعد مسودة لائحة تمييزية عراقية من الوقائع وأسباب الاعتراض المدخلة. رتّبها إلى بيانات القرار المطعون فيه، موجز الوقائع، أسباب الطعن مفصّلة، ثم الطلبات. لا تختلق أرقام مواد أو سوابق قضائية.`,
  employees: `أنت في قسم قضاء الموظفين والقضاء الإداري العراقي. حلّل القرار أو النزاع الوظيفي، رتّب الوقائع، حدّد أوجه الاعتراض المحتملة، المستندات المهمة، والنقاط التي تحتاج تحققاً، ثم اقترح مسودة أو خطوات عملية بحسب طلب المستخدم.`
};

const BASE_INSTRUCTIONS = `أنت مساعد قانوني ذكي مخصص للاستخدام المهني الشخصي للمحامي علاء الدراجي في العراق.
اكتب بالعربية القانونية الواضحة والمهنية، مع الحفاظ على تنسيق سهل القراءة على الهاتف.
المخرجات مسودات مساعدة للمحامي وليست بديلاً عن مراجعته المهنية.
لا تختلق مادة قانونية أو رقم قرار أو حكم قضائي أو مصدر. إذا لم تكن متأكداً من مرجع محدد، صرّح بأنه يحتاج إلى تحقق.
فرّق بوضوح بين الوقائع التي أعطاها المستخدم وبين التحليل أو الاحتمالات.
لا تضف أسماء أو تواريخ أو وقائع لم يذكرها المستخدم.`;

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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'AI_NOT_CONFIGURED',
      message: 'خدمة الذكاء الاصطناعي تحتاج إلى إضافة OPENAI_API_KEY في إعدادات الاستضافة.'
    });
  }

  try {
    const { tool, title = '', details = '' } = req.body || {};
    const normalizedTitle = String(title).trim().slice(0, 500);
    const normalizedDetails = String(details).trim().slice(0, 30000);
    const toolInstruction = TOOL_INSTRUCTIONS[tool] || TOOL_INSTRUCTIONS.analysis;

    if (!normalizedTitle && !normalizedDetails) {
      return res.status(400).json({ error: 'أدخل تفاصيل القضية أولاً.' });
    }

    const input = [
      normalizedTitle ? `العنوان أو الوصف المختصر:\n${normalizedTitle}` : '',
      normalizedDetails ? `تفاصيل القضية:\n${normalizedDetails}` : ''
    ].filter(Boolean).join('\n\n');

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5.6',
        instructions: `${BASE_INSTRUCTIONS}\n\n${toolInstruction}`,
        input,
        store: false,
        reasoning: { effort: 'medium' },
        max_output_tokens: 5000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const upstreamMessage = data?.error?.message || 'تعذر تشغيل خدمة الذكاء الاصطناعي.';
      return res.status(response.status).json({ error: 'AI_REQUEST_FAILED', message: upstreamMessage });
    }

    const text = extractText(data);
    if (!text) {
      return res.status(502).json({ error: 'AI_EMPTY_RESPONSE', message: 'لم تُرجع الخدمة نصاً قابلاً للعرض.' });
    }

    return res.status(200).json({ text });
  } catch (error) {
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'حدث خطأ أثناء معالجة الطلب. حاول مرة أخرى.'
    });
  }
}
