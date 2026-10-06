# استوديو أفلام AI — AI Film Studio Web

<div dir="rtl">

منصة إبداعية عربية (RTL) تجعل المستخدم يكتب فكرة فيديو بسيطة، فتتولى المنصة تحويلها إلى **حزمة إنتاج منظمة قابلة للتنفيذ**: برييف إبداعي، فكرة كبرى، سرد، جدول إيقاع، هوية بصرية مقفلة، ستوري بورد، بطاقات لقطات، وبرومبت صورة وحركة **كامل واحد لكل فريم/لقطة**، مع خطة صوت وملخص تسليم.

> **القاعدة الأساسية:** المستخدم يعبّر عن الفكرة، والمنصة تتولى التعقيد الداخلي، وتعرض فقط المخرجات النظيفة القابلة للاستخدام.

المنتج في MVP لا يولّد الصور أو الفيديو مباشرة؛ مهمته توليد **سير العمل والبرومبتات الاحترافية** مع الحفاظ على الهوية البصرية والمنتج والكيانات والاستمرارية والمنصة المستهدفة.

---

## ✨ الميزات

- **واجهة عربية RTL** بتصميم سينمائي داكن (Creative Production OS) تعمل على الهاتف وسطح المكتب.
- **تدفق إنتاج كامل**: فكرة → تحليل نية وتوجيه → 11 مرحلة إنتاج → مساحة عمل → تصدير.
- **موجّه نوايا (Intent Router)**: يختار أصغر مسار كافٍ — إعلان / وثائقي / فيلم / موشن / سلسلة / برومبت سريع.
- **برومبت واحد كامل لكل فريم**: كتلة LTR قابلة للنسخ بضغطة، تتضمن Identity Strings + Style Lock + الكاميرا والإضاءة — بلا أي تجميع يدوي.
- **أقفال الاستمرارية**: Style Lock وEntity Ledger وProduct Anchor تُمرر حرفيًا إلى كل مرحلة متأثرة.
- **إعادة توليد مرحلة واحدة** مع حفظ النسخة السابقة في سجل الإصدارات — دون إعادة بناء المشروع.
- **تصدير Markdown وJSON** مع الحالات والتبعيات وأسماء ملفات تدعم العربية.
- **طبقة مزود ذكاء اصطناعي قابلة للاستبدال** (`AIProvider`) خلف الخادم فقط — Gemini هو المزود الأساسي، ولا توجد أي مفاتيح في الواجهة.

## 🧱 خط الإنتاج (Pipeline)

```
intake → intent-analysis → brief → concept → narrative → beats
       → style-entities → storyboard → shot-cards → image-prompts
       → motion-prompts → audio → delivery-and-quality
```

لكل مرحلة: عقد إخراج JSON (Zod)، سياق تدريجي من مخرجات المراحل المعتمدة فقط، حالة (`pending | running | completed | failed | approved`)، وإصدارات.

## 🛠️ الحزمة التقنية

- **Next.js 16** (App Router) + **TypeScript** صارم
- **Tailwind CSS 4** + **shadcn/ui** + خط IBM Plex Sans Arabic
- **Prisma ORM** (SQLite للتطوير؛ قابلة للترقية إلى Postgres/Neon/Turso بتغيير سطر واحد)
- **Zod** لعقود الـAPI ومخرجات النموذج (سياسة إصلاح JSON بمحاولة واحدة)
- **Zustand** لحالة الواجهة

## 🚀 التشغيل محليًا

```bash
# 1) التبعيات
npm install        # أو bun install

# 2) متغيرات البيئة
cp .env.example .env
# ثم ضع GEMINI_API_KEY من Google AI Studio

# 3) قاعدة البيانات المحلية
npm run db:push

# 4) التشغيل
npm run dev        # http://localhost:3000
```

## ☁️ النشر على Vercel

1. اربط المستودع بمشروع Vercel.
2. أضف متغيرات البيئة:
   - `GEMINI_API_KEY` (مطلوب)
   - `GEMINI_MODEL` (اختياري — الافتراضي `gemini-3.8-flash`)
   - `DATABASE_URL` — `file:/tmp/ai-film-studio.db` للتشغيل الفوري؛ **للثبات الدائم** استخدم رابط Postgres (Neon/Vercel Postgres) مع تحويل `provider` في `prisma/schema.prisma` إلى `postgresql` ثم `npx prisma db push`.
3. انشر — البناء يقوم بـ `prisma generate` تلقائيًا عبر `postinstall`.

> **ملاحظة:** SQLite في `/tmp` على Vercel مؤقتة لكل نسخة lambda (تكفي للتجربة والاستخدام الخفيف). للإنتاج الجاد اربط قاعدة Postgres كما في الخطوة 2.

## 🔌 عقود الـAPI

| المسار | الطرق | الوظيفة |
|---|---|---|
| `/api/projects` | `POST` `GET` | إنشاء مشروع / قائمة المشاريع |
| `/api/projects/:id` | `GET` `PATCH` | قراءة المشروع وحالات المراحل / تعديل intake |
| `/api/projects/:id/analyze` | `POST` | تحليل النية والتوجيه |
| `/api/projects/:id/generate` | `POST` | توليد المرحلة التالية أو مرحلة محددة |
| `/api/projects/:id/stages/:stageId/regenerate` | `POST` | إعادة توليد مرحلة (يتطلب ملاحظة) |
| `/api/projects/:id/stages/:stageId/approve` | `POST` | اعتماد مرحلة |
| `/api/projects/:id/events` | `GET` | أحداث تقدم المراحل |
| `/api/projects/:id/export?format=markdown\|json` | `GET` | تصدير الحزمة |

كل الأخطاء تعود بغلاف موحد:

```json
{ "error": { "code": "AI_PROVIDER_ERROR", "message": "…", "retryable": true, "requestId": "req_x" } }
```

## 🗺️ خريطة الكود

```
src/
├── app/
│   ├── page.tsx                 # SPA: landing → intake → review → progress → workspace
│   ├── layout.tsx               # RTL + IBM Plex Sans Arabic
│   ├── globals.css              # design tokens (لوحة Creative Production OS)
│   ├── manus-routes.json        # بيان مسارات الموقع
│   └── api/projects/…           # عقود REST كاملة
├── components/
│   ├── landing/ intake/ review/ progress/   # شاشات التدفق
│   ├── workspace/               # Sidebar + عارضات المراحل + Inspector
│   └── common/prompt-block.tsx  # كتلة برومبت LTR قابلة للنسخ
├── lib/
│   ├── ai/                      # AIProvider + GeminiProvider + Pipeline + Prompt builders
│   ├── routing/intent-router.ts # شجرة قرار المحركات E1–E5
│   ├── validation/schemas.ts    # عقود Zod لكل مرحلة
│   ├── export/exporters.ts      # Markdown / JSON
│   ├── security/rate-limit.ts   # تحديد معدل الطلبات
│   └── db.ts                    # Prisma + تهيئة ذاتية للجداول في serverless
├── store/app-store.ts           # Zustand + حلقة توليد client-driven
└── types/index.ts               # أنواع المشروع والمراحل والأخطاء
```

## 📚 الوثائق المرجعية

- [`docs/product/PRD.md`](docs/product/PRD.md) — متطلبات المنتج الكاملة
- [`docs/product/FILE-STRUCTURE.md`](docs/product/FILE-STRUCTURE.md) — المعمارية ومسار الملفات
- [`docs/product/AGENT-HANDOFF.md`](docs/product/AGENT-HANDOFF.md) — تعليمات التسليم
- المنهجية المصدر: [ai-film-studio](https://github.com/zoih6/ai-film-studio) (SKILL.md + workflows + schemas)

## 🛡️ الأمان

- كل استدعاءات النموذج تمر عبر الخادم — لا مفاتيح في client bundle إطلاقًا.
- التحقق من مدخلات المستخدم وحجمها قبل إرسالها للنموذج (Zod + حدود طول).
- تحديد معدل الطلبات لكل مشروع وعنوان IP.
- معاملة محتوى المستخدم كبيانات لا كتعليمات نظام.

## 🗺️ خارطة الطريق (خارج MVP)

- المصادقة والتخزين السحابي الدائم
- توليد الصور/الفيديو المباشر داخل المنصة
- مزودون إضافون (OpenAI/Anthropic) عبر نفس واجهة `AIProvider`
- تعاون الفرق والقوالب وmarketplace الأساليب

## 📄 الترخيص

MIT — انظر [LICENSE](LICENSE).

</div>
