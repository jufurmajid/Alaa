import { AIServiceError, generateLegalResponse } from '../lib/ai-core.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'هذا المسار يقبل POST فقط.'
    });
  }

  try {
    const result = await generateLegalResponse(req.body || {});
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(result);
  } catch (error) {
    const status = error instanceof AIServiceError ? error.status : 500;
    const code = error instanceof AIServiceError ? error.code : 'SERVER_ERROR';
    const message = error instanceof AIServiceError
      ? error.message
      : 'حدث خطأ غير متوقع في الخادم.';

    res.setHeader('Cache-Control', 'no-store');
    return res.status(status).json({ error: code, message });
  }
}
