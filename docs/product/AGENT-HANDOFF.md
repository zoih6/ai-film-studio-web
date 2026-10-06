# AI Film Studio Web — Agent Handoff

## المهمة

حوّل مستودع AI Film Studio الحالي إلى Web App تفاعلي. المنتج ليس صفحة توثيق ولا عارض ملفات؛ هو منصة يدخل فيها المستخدم فكرة فيديو، ثم يحصل على Workflow إنتاج وبرومبتات جاهزة.

## اقرأ بالترتيب

1. `docs/product/PRD.md` — المتطلبات وسلوك المنتج.
2. `docs/product/FILE-STRUCTURE.md` — المعمارية ومسار الملفات.
3. `SKILL.md` — قواعد AI Film Studio الأساسية.
4. `workflows/intent-router.md` — اختيار المسار.
5. المراجع والـSchemas المطلوبة للمسار فقط.
6. `INSTALL.md` و`AGENTS.md` — قواعد المستودع والاختبارات.

## أول تسليم مطلوب

ابنِ MVP يعمل من البداية إلى النهاية:

1. Home عربية RTL فيها Idea Input.
2. Project Intake.
3. Intent Review.
4. Project Workspace.
5. Gemini Provider server-side.
6. Pipeline واحدة على الأقل للإعلان وPipeline واحدة للوثائقي.
7. Brief → Concept → Storyboard → Image Prompts → Motion Prompts.
8. Copy وRegenerate وExport Markdown/JSON.
9. حالات loading/error/empty واضحة.
10. `manus-routes.json` صحيح ومحدث.

## لا تفعل

- لا تبدأ بمحرر فيديو أو توليد Media مباشر.
- لا تضع Gemini API Key في المتصفح.
- لا تعرض أسماء الوكلاء أو تفاصيل التفكير الداخلي للمستخدم.
- لا تجعل المستخدم يجمع Prompt من أجزاء متعددة.
- لا تكتب كل التطبيق في ملف واحد.
- لا تستخدم mock output ثابتًا في المسار الأساسي بعد ربط Gemini.
- لا تعيد توليد المشروع كاملًا عند فشل مرحلة واحدة.

## Definition of Done

اعتبر MVP مكتملًا فقط عندما:

- يكتب مستخدم عربي فكرة وينشئ مشروعًا.
- يعرض النظام route مناسبًا وقابلًا للتعديل.
- يعمل توليد حقيقي عبر طبقة `AIProvider` مع Gemini adapter.
- ينتج Storyboard قبل Prompts.
- ينتج Prompt كاملًا واحدًا لكل Shot/Frame.
- يحفظ حالة كل مرحلة وإصداراتها.
- يمكن إعادة توليد مرحلة واحدة.
- يمكن نسخ Prompt وتصدير Markdown وJSON.
- يمر TypeScript/lint/build واختبارات الـAPI والـPipeline.
- لا توجد أسرار في client bundle.
- جميع مسارات الموقع موجودة في `manus-routes.json`.

## أسلوب التنفيذ

- استخدم TypeScript ومكونات صغيرة واضحة.
- افصل domain logic عن UI.
- اعتمد Zod أو ما يعادله لعقود API ومخرجات Gemini.
- استخدم Server Actions أو API Routes وفق بنية المشروع، لكن حافظ على نفس العقود المذكورة في PRD.
- صمم أولًا على Desktop وMobile responsive، مع RTL كاتجاه افتراضي.
- اختر تصميمًا سينمائيًا داكنًا حديثًا، لكن لا تضحي بالوضوح أو سهولة القراءة.
- استخدم بيانات fixture فقط للاختبارات وحالات preview، وسمها بوضوح.

## قرار provider

ابدأ بـ`GeminiProvider` خلف الخادم. لا تربط مكونات React مباشرة بـGemini. كل provider يجب أن يلتزم بواجهة موحدة قابلة للاستبدال.

## متغيرات البيئة

استخدم `.env.example` فقط لتوثيق الأسماء، مثل:

```text
GEMINI_API_KEY=
GEMINI_MODEL=
DATABASE_URL=
```

لا تضع قيمًا حقيقية في Git، ولا تطلب من المستخدم إرسال مفاتيحه داخل المحادثة.

## تسلسل التنفيذ المقترح

1. أنشئ هيكل التطبيق والـdesign system.
2. أنشئ contracts وProject state.
3. ابنِ Home وIntake وWorkspace ببيانات typed.
4. أضف Gemini Provider وIntent Router.
5. أضف stages والمخرجات المنظمة.
6. أضف copy/regenerate/export.
7. شغّل diagnostics والاختبارات.
8. أصلح مشاكل UX الأساسية قبل إضافة ميزات Phase 2.

## ملاحظة مهمة

المستودع يحتوي منطقًا ومراجع إنتاجية كثيرة. لا تحمل كل الملفات في كل طلب AI. استخدم Progressive Disclosure: router أولًا، ثم workflow المختار، ثم schema/reference الضروري.
