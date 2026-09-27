# النشر النهائي — Cloudflare Workers

المشروع صار مهيأ للنشر على **Cloudflare Workers** مع **Workers AI** وStatic Assets، من دون Vercel ومن دون مفتاح OpenAI أو Groq.

## الطريقة المفضلة من GitHub

1. افتح Cloudflare ثم **Workers & Pages**.
2. اختر **Create application**.
3. اختر **Import a repository**.
4. اربط GitHub واختر المستودع `jufurmajid/Alaa`.
5. اختر الفرع `main`.
6. اترك Deploy command على `npx wrangler deploy`.
7. اضغط **Save and Deploy**.

ملف `wrangler.jsonc` يحتوي على:

- Worker entry: `src/worker.js`.
- Static Assets من جذر المشروع.
- تشغيل Worker أولاً لمسارات `/api/*` فقط.
- Workers AI binding باسم `AI`.

لا يحتاج المشروع أي Secret أو API key حتى يعمل الذكاء الاصطناعي على Workers AI.

## الذكاء الاصطناعي

الموديل الافتراضي:

```text
@cf/google/gemma-4-26b-a4b-it
```

والمسار المستخدم من الواجهة:

```text
POST /api/ai
```

المرفقات المدعومة في مسار Cloudflare تشمل PDF وDOCX وODT وExcel/CSV والصور والملفات النصية. يقوم Worker بتحويل الملفات القابلة للتحويل إلى نص عبر `env.AI.toMarkdown()` ثم يرسل النص المستخرج إلى الموديل.

## الحدود المجانية

Workers AI يملك حصة مجانية يومية. إذا تم تجاوزها تتوقف طلبات AI حتى إعادة ضبط الحصة اليومية أو الترقية. الموقع الثابت نفسه يبقى متاحاً.

## التشغيل المحلي

لرؤية الموقع فقط عبر Termux:

```bash
npm start
```

ولتجربة نسخة Cloudflare محلياً:

```bash
npm install
npm run dev
```

Wrangler قد يطلب تسجيل الدخول إلى Cloudflare حتى يتمكن من استخدام الخدمات المرتبطة بالحساب.

## أمان الملفات

`.assetsignore` يمنع ملفات المصدر والخادم والإعدادات من الظهور ضمن الملفات العامة للموقع عند نشر Static Assets.
