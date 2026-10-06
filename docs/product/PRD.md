# AI Film Studio Web — Product Requirements Document

**الإصدار:** 1.0.0  
**الحالة:** جاهز للتنفيذ  
**اللغة الأساسية للواجهة:** العربية مع دعم الإنجليزية لاحقًا  
**نوع المنتج:** Web App تفاعلي لتخطيط إنتاج الفيديو وتوليد Workflows وPrompts  
**المصدر المنهجي:** مستودع AI Film Studio الحالي

---

## 1. ملخص المنتج

AI Film Studio Web هو منصة إبداعية تجعل المستخدم يكتب فكرة فيديو بسيطة، ثم تحولها المنصة إلى حزمة إنتاج منظمة وقابلة للتنفيذ. لا يضطر المستخدم إلى فهم مراحل الإنتاج أو كتابة Prompts تقنية؛ يتولى التطبيق تحليل الطلب، اختيار مسار العمل المناسب، بناء الفكرة والـStoryboard، ثم إنتاج Image Prompts وMotion Prompts وخطة الصوت والتسليم.

> **القاعدة الأساسية:** المستخدم يعبّر عن الفكرة، والمنصة تتولى التعقيد الداخلي، وتعرض فقط المخرجات النظيفة القابلة للاستخدام.

المنتج في MVP لا ينفذ توليد الصور أو الفيديو مباشرة. مهمته الأساسية هي **توليد سير العمل والبرومبتات الاحترافية** مع المحافظة على الهوية البصرية، المنتج، الكيانات، الاستمرارية، والمنصة المستهدفة.

---

## 2. المشكلة

المستخدمون يعرفون ما يريدون بصريًا لكنهم يواجهون صعوبة في:

- تحويل الفكرة إلى Concept واضح.
- تقسيم الفيديو إلى مشاهد ولقطات.
- الحفاظ على شكل الشخصيات والمنتج عبر اللقطات.
- كتابة Prompt كامل مناسب لنموذج التوليد.
- اختيار المسار الصحيح بين إعلان، وثائقي، فيلم، Shorts أو Motion Graphics.
- تذكر متطلبات المنصة والنسبة والمدة والصوت.
- تعديل جزء واحد دون إعادة بناء المشروع كاملًا.

الحلول الحالية إما أدوات توليد مباشرة بلا تخطيط، أو ملفات Workflow معقدة تحتاج خبرة تقنية. المنصة تجمع التخطيط الذكي مع واجهة بسيطة.

---

## 3. الرؤية والهدف

### الرؤية
أن تكون المنصة أسهل نقطة دخول لإنتاج فيديو AI احترافي: من فكرة قصيرة إلى حزمة إنتاج جاهزة للنسخ والتنفيذ.

### أهداف MVP

1. إنشاء مشروع فيديو جديد خلال دقائق.
2. جمع الحد الأدنى من المعلومات الضرورية فقط.
3. إنتاج Brief وConcept وStoryboard منظم.
4. إنتاج Prompt كامل واحد لكل Frame/Shot، دون أجزاء تحتاج إلى تجميع.
5. الحفاظ على Style Lock وEntity Ledger وContinuity عبر جميع المخرجات.
6. السماح بتعديل وإعادة توليد مرحلة واحدة دون فقدان بقية المشروع.
7. جعل الناتج قابلًا للنسخ والتصدير والمشاركة.
8. فصل عقل الذكاء الاصطناعي عن الواجهة حتى يمكن استبدال Gemini لاحقًا.

### مؤشرات النجاح

- يستطيع مستخدم جديد إنشاء أول مشروع دون شرح خارجي.
- يصل المستخدم إلى أول Concept قابل للمراجعة خلال أقل من دقيقتين بعد إرسال الفكرة.
- كل Shot يحتوي Prompt مكتملًا قابلًا للنسخ.
- لا توجد روابط أو أزرار تؤدي إلى حالة فارغة بلا تفسير.
- يمكن استعادة المشروع ومتابعته من آخر مرحلة.

---

## 4. المستخدمون المستهدفون

### 4.1 صانع محتوى
يريد إنتاج Reels أو TikTok أو YouTube Shorts بسرعة ولا يعرف كتابة Prompts احترافية.

### 4.2 مسوق أو صاحب علامة تجارية
يريد إعلان منتج بBrief واضح ولقطات متناسقة وEnd Card ومواصفات تسليم.

### 4.3 مخرج أو مصمم
يريد التحكم في الفكرة والهوية البصرية واللقطات، مع استخدام AI لتسريع التخطيط.

### 4.4 وكالات ومشاريع متكررة
تحتاج حفظ Style Locks وشخصيات ومنتجات وقوالب سلاسل.

---

## 5. نطاق MVP

### داخل النطاق

- إنشاء مشروع من فكرة نصية.
- اختيار نوع المشروع: إعلان، فيلم قصير، وثائقي/Essay، Motion Graphics، سلسلة، Prompt سريع.
- جمع المنصة والمدة والنسبة واللغة والنبرة والنموذج المفضل اختياريًا.
- Intent Routing لاختيار أقصر Workflow مناسب.
- توليد المراحل التالية:
  - Creative Brief.
  - Concept / Big Idea.
  - Narrative أو Script مختصر.
  - Beat Table.
  - Style DNA وStyle Lock.
  - Entity Ledger وProduct Anchor عند الحاجة.
  - Storyboard.
  - Shot Cards.
  - Image Prompts.
  - Motion Prompts.
  - Audio Plan.
  - Delivery/Quality Summary.
- عرض النتائج في Workspace منظم.
- إعادة توليد مرحلة واحدة مع حفظ النسخة السابقة.
- نسخ Prompt أو Shot أو الحزمة كاملة.
- تصدير Markdown وJSON في MVP.
- واجهة عربية RTL responsive.
- Gemini Adapter خلف الخادم مع طبقة Provider قابلة للاستبدال.

### خارج النطاق في MVP

- توليد الصور أو الفيديو داخل المنصة.
- محرر فيديو زمني.
- الدفع والاشتراكات.
- فريق تعاوني وصلاحيات متعددة.
- Marketplace للنماذج.
- رفع ملفات Media وتحليلها.
- ضمان أن المخرجات الوسائطية صالحة؛ MVP يولد خططًا ونصوصًا فقط.

---

## 6. تجربة المستخدم الأساسية

### المسار الرئيسي

1. يفتح المستخدم الصفحة الرئيسية.
2. يضغط **ابدأ مشروعًا جديدًا**.
3. يكتب فكرته في مربع كبير.
4. يحدد أو يراجع: نوع المشروع، المنصة، المدة، النسبة، اللغة، النبرة.
5. يضغط **حلّل الفكرة**.
6. يعرض AI ملخص النية والأسئلة الضرورية فقط إن وجدت.
7. يوافق المستخدم على الاتجاه أو يعدله.
8. يبدأ توليد الحزمة على مراحل مع Progress واضح.
9. تظهر النتائج داخل Workspace في تبويبات أو مراحل.
10. ينسخ Prompt أو يصدر الحزمة.

### مسار Prompt سريع

إذا كان الطلب لقطة واحدة أو Prompt واحد، يجب ألا يشغل النظام M0–M11 كاملًا. يوجهه إلى Shortcut ويعرض Prompt نهائيًا سريعًا.

### مسار إعادة التوليد

1. يفتح المستخدم مرحلة محددة.
2. يضغط **إعادة توليد**.
3. يحدد سببًا أو يكتب ملاحظة.
4. يرسل النظام السياق المعتمد للمشروع مع الملاحظة فقط.
5. يحفظ النسخة السابقة كـVersion.
6. يعرض الناتج الجديد مع إمكانية الرجوع.

---

## 7. أنواع المشاريع والتوجيه

| النوع | المسار الافتراضي | المخرجات الرئيسية |
|---|---|---|
| Prompt أو لقطة واحدة | Shortcut | Prompt صورة/حركة كامل |
| إعلان منتج | Commercial Engine | Brief، Big Idea، Product Anchor، Shots، Prompts، End Card |
| وثائقي أو Essay | Documentary Engine | Research Notes، Narrative، Beats، Prompts، Thumbnails |
| فيلم قصير | Full M0–M11 | Concept، Script، Beats، Storyboard، Shots، Audio، Delivery |
| Motion Graphics | Motion Shortcut/Engine | Scene Structure، Text، Motion Direction، Export Notes |
| سلسلة | Series Engine | Series Bible، Episode Template، Continuity |

يجب أن يكون `intent-router` هو مصدر القرار، وليس الواجهة وحدها. الواجهة تعرض القرار للمستخدم بلغة مفهومة.

---

## 8. متطلبات وظيفية

### FR-01 — إنشاء مشروع
- يجب أن يستطيع المستخدم إنشاء مشروع بعنوان وفكرة.
- إذا لم يكتب عنوانًا، يولد النظام عنوانًا مؤقتًا قابلًا للتعديل.
- يحفظ المشروع بحالة `draft` قبل بدء التوليد.

### FR-02 — Brief Intake
- يجب أن يقبل النظام فكرة عربية أو إنجليزية.
- الحقول: projectType، platform، duration، aspectRatio، language، tone، targetAudience، preferredModel، visualStyle، notes.
- لا يفرض أسئلة غير ضرورية.
- يعرض القيم المستنتجة مع إمكانية تعديلها.

### FR-03 — Intent Routing
- يختار المسار الأصغر الكافي.
- يسجل route وسبب الاختيار.
- يتيح للمستخدم تغيير نوع المشروع قبل التوليد.

### FR-04 — AI Generation Pipeline
- ينفذ المراحل بالترتيب.
- كل مرحلة تستقبل مخرجات المراحل السابقة كـContext منظم.
- لا يرسل كامل المستودع أو كامل المشروع إلى النموذج بلا حاجة.
- يحفظ status لكل مرحلة: `pending`, `running`, `completed`, `failed`, `approved`.

### FR-05 — جودة واستمرارية
- يجب أن يتضمن المشروع Style DNA.
- يجب أن يثبت Identity String للكيانات المتكررة.
- يجب أن ينشئ Reference/Entity Ledger عند وجود شخصية أو منتج أو مكان متكرر.
- يجب أن يطبق Hard Gates قبل اعتبار الحزمة `qualified`.
- لا يجوز اعتبار فحص النص دليلًا على صلاحية ملف فيديو أو صورة فعلية.

### FR-06 — مخرجات قابلة للاستخدام
- كل Prompt في كتلة واحدة قابلة للنسخ.
- لا تعرض أجزاء Prompt تحتاج دمجًا يدويًا.
- كل Shot يحتوي: ID، المدة، الهدف، الصورة، الكاميرا، الحركة، الصوت/النص عند الحاجة، والمراجع.
- تدعم الحزمة Markdown وJSON.

### FR-07 — التحرير والنسخ
- تعديل مرحلة لا يحذف النسخة السابقة.
- إعادة التوليد تحتاج سببًا أو ملاحظة.
- يجب إظهار تاريخ آخر تحديث وحالة المرحلة.
- عند تغير Style Lock أو Product Truth، يجب تنبيه المستخدم إلى اللقطات المتأثرة.

### FR-08 — الأخطاء
- عرض خطأ مفهوم للمستخدم.
- توفير زر إعادة المحاولة للمرحلة الفاشلة فقط.
- عدم إعادة تشغيل كامل المشروع تلقائيًا.
- حفظ سجل داخلي يتضمن provider/model وسبب الفشل دون عرضه كضوضاء للمستخدم.

### FR-09 — النسخ والتصدير
- نسخ Prompt منفرد.
- نسخ كل Prompts في المرحلة.
- تصدير Markdown منظم.
- تصدير JSON يحافظ على IDs والحالات والتبعيات.
- اسم الملف يتضمن slug المشروع وإصدار الحزمة.

### FR-10 — اللغة والاتجاه
- الواجهة العربية RTL من البداية.
- دعم نصوص إنجليزية داخل Prompts دون كسر RTL.
- جميع الأزرار والحالات والرسائل مترجمة ومفهومة.

---

## 9. تجربة الواجهة والتصميم

### اتجاه التصميم
**Creative Production OS**: واجهة استوديو إبداعي داكنة، سينمائية، هادئة، مع تباين واضح ومكونات عملية.

### مبادئ التصميم

1. **التركيز:** كل شاشة لها إجراء أساسي واضح.
2. **التدرج:** لا يظهر التعقيد إلا عند الحاجة.
3. **الملموسية:** حالة المشروع والمراحل مرئية دائمًا.
4. **التحكم:** المستخدم يستطيع تعديل أو إعادة توليد أي مرحلة.

### لوحة الألوان المقترحة

- Background: `#0B0D12`
- Surface: `#131722`
- Elevated Surface: `#1A2030`
- Text Primary: `#F5F7FA`
- Text Muted: `#9AA4B2`
- Brand Violet: `#8B5CF6`
- Brand Cyan: `#22D3EE`
- Success: `#34D399`
- Warning: `#FBBF24`
- Error: `#FB7185`

### الخطوط

- Arabic UI: IBM Plex Sans Arabic أو Noto Sans Arabic.
- Latin/Code: Inter أو Geist.
- Prompt blocks: خط monospace واضح مع اتجاه LTR.

### الشاشات

1. **Landing / Home**
   - قيمة المنتج في جملة واحدة.
   - مربع فكرة كبير.
   - أمثلة قابلة للاختيار.
   - CTA: ابدأ مشروعًا جديدًا.

2. **Project Intake**
   - Stepper بسيط.
   - الحقول الضرورية فقط.
   - معاينة مختصرة لما سيولد.

3. **Intent Review**
   - بطاقة تلخيص الفكرة.
   - route المقترح.
   - أسئلة ناقصة إن وجدت.
   - زر اعتماد الاتجاه.

4. **Generation Progress**
   - Timeline للمراحل.
   - حالة كل مرحلة.
   - شرح مختصر لما يحدث.
   - عدم عرض نصوص تقنية أو أسماء Agents.

5. **Project Workspace**
   - Sidebar للمراحل.
   - Main Canvas للمحتوى.
   - Inspector جانبي للبيانات الأساسية والنسخ.
   - شريط علوي لاسم المشروع والحالة والتصدير.

6. **Storyboard View**
   - بطاقات لقطات قابلة للتمرير.
   - كل بطاقة تعرض frame description وduration وcamera وcontinuity.

7. **Prompt View**
   - Prompt كامل في Code Block.
   - Copy button.
   - Edit/Regenerate.
   - Model dialect indicator.

8. **Export View**
   - اختيار نوع الحزمة.
   - Markdown/JSON.
   - ملخص quality gates.

### الحركة

- انتقالات قصيرة 150–250ms.
- Progress حقيقي مرتبط بحالة المرحلة.
- لا تستخدم مؤثرات مبالغًا فيها أو خلفيات متحركة تشتت المستخدم.
- استخدم skeleton فقط أثناء تحميل فعلي.

---

## 10. الذكاء الاصطناعي وGemini

### قاعدة أساسية
لا تستدعِ Gemini من المتصفح مباشرة. كل مفاتيح API واستدعاءات النموذج تمر عبر الخادم.

### Provider abstraction

أنشئ واجهة موحدة:

```ts
interface AIProvider {
  generate(input: GenerationRequest): Promise<GenerationResult>;
  stream?(input: GenerationRequest): AsyncIterable<GenerationEvent>;
  healthCheck(): Promise<ProviderHealth>;
}
```

النسخة الأولى: `GeminiProvider`.  
النسخ اللاحقة: OpenAI/Anthropic/Manus أو مزود داخلي دون تغيير الواجهة.

### قواعد Context

- استخدم intent + project state + المرحلة الحالية فقط.
- حمّل المراجع ذات الصلة من مستودع AI Film Studio لا المستودع كله.
- مرر Style Lock وEntity Ledger وProduct Truth إلى كل مرحلة متأثرة.
- اجعل مخرجات كل مرحلة JSON مطابقًا Schema قبل عرضها.
- عند فشل parsing، أعد محاولة إصلاح JSON مرة واحدة فقط ثم أظهر خطأ قابلًا للتشخيص.

### Structured output

كل مرحلة يجب أن تعيد:

```json
{
  "stage": "storyboard",
  "status": "completed",
  "projectId": "proj_x",
  "version": 1,
  "artifacts": [],
  "warnings": [],
  "nextStage": "image-prompts"
}
```

---

## 11. نموذج البيانات الأساسي

### Project

```ts
Project {
  id: string
  title: string
  idea: string
  projectType: ProjectType
  platform?: string
  durationSeconds?: number
  aspectRatio?: string
  language: string
  tone?: string
  status: draft | generating | review | approved | failed
  currentStage: string
  createdAt: string
  updatedAt: string
}
```

### ProjectStage

```ts
ProjectStage {
  id: string
  projectId: string
  stageId: string
  status: pending | running | completed | failed | approved
  version: number
  inputSnapshot: object
  output: object
  error?: object
  createdAt: string
  updatedAt: string
}
```

### Artifact

```ts
Artifact {
  id: string
  projectId: string
  stageId: string
  type: brief | concept | beat_table | storyboard | shot_card | image_prompt | motion_prompt | audio | delivery
  status: candidate | qualified | not_yet_verified
  content: object
  source: string
  dependencies: string[]
}
```

---

## 12. API / Server Contracts

- `POST /api/projects` — إنشاء مشروع.
- `GET /api/projects/:id` — قراءة المشروع والحالات.
- `PATCH /api/projects/:id` — تعديل بيانات intake.
- `POST /api/projects/:id/analyze` — تحليل النية والتوجيه.
- `POST /api/projects/:id/generate` — بدء Pipeline أو مرحلة محددة.
- `POST /api/projects/:id/stages/:stageId/regenerate` — إعادة توليد مرحلة.
- `POST /api/projects/:id/stages/:stageId/approve` — اعتماد مرحلة.
- `GET /api/projects/:id/events` — أحداث Progress، SSE أو polling مضبوط.
- `GET /api/projects/:id/export?format=markdown|json` — التصدير.
- `GET /manus-routes.json` — قائمة مسارات الموقع المطلوبة للمنصة.

كل Endpoint يعيد Error Envelope موحدًا:

```json
{
  "error": {
    "code": "AI_PROVIDER_ERROR",
    "message": "تعذر توليد هذه المرحلة الآن.",
    "retryable": true,
    "requestId": "req_x"
  }
}
```

---

## 13. الأمان والخصوصية

- عدم وضع Gemini API Key في client bundle.
- التحقق من مدخلات المستخدم وحجمها قبل إرسالها للنموذج.
- عدم تسجيل الأفكار الخاصة في logs العامة.
- تعقيم Markdown/HTML عند العرض.
- تحديد rate limit لكل مشروع وطلب.
- اعتبار Prompts والمحتوى القادم من المستخدم بيانات، لا تعليمات نظامية.
- عدم رفع أو معالجة ملفات Media في MVP.

---

## 14. معايير القبول الرئيسية

- [ ] المستخدم يكتب فكرة عربية وينشئ مشروعًا.
- [ ] النظام يقترح route مناسبًا ويعرض سببًا مفهومًا.
- [ ] الإعلان يمر عبر Commercial Engine، والوثائقي عبر Documentary Engine.
- [ ] Prompt واحد كامل يظهر لكل Shot/Frame.
- [ ] Storyboard يظهر قبل Image Prompts وMotion Prompts.
- [ ] Style Lock وEntity Ledger يظهران في المشروع عند الحاجة.
- [ ] إعادة توليد مرحلة تحفظ النسخة السابقة.
- [ ] فشل Gemini لا يمسح المشروع ويتيح Retry.
- [ ] التصدير Markdown وJSON يعملان.
- [ ] الواجهة تعمل RTL على الهاتف وسطح المكتب.
- [ ] لا توجد مفاتيح سرية في الواجهة.
- [ ] `quick_validate.py` و`verify_package.py` وفحوص المشروع تمر.

---

## 15. مراحل التنفيذ

### Phase 0 — Foundation
- إعداد تطبيق Web.
- إعداد routing وRTL وdesign tokens.
- إنشاء `manus-routes.json`.
- إنشاء طبقة config وenv validation.

### Phase 1 — Intake + Workspace
- Home.
- Project Intake.
- Project state.
- Workspace shell.
- Stage navigation.

### Phase 2 — Gemini Pipeline
- Provider interface.
- Gemini adapter.
- Intent routing.
- Structured stage outputs.
- Progress and retry.

### Phase 3 — Production Outputs
- Brief/Concept.
- Beats/Storyboard.
- Shot Cards.
- Image/Motion Prompts.
- Audio and Delivery summaries.

### Phase 4 — Export + Hardening
- Markdown/JSON export.
- Version history.
- Error states.
- Responsive/accessibility pass.
- Full validation.

### Phase 5 — Later
- Authentication and cloud persistence.
- Direct image/video generation.
- Team collaboration.
- Billing.
- Template and style marketplace.

---

## 16. قواعد مهمة للوكيل المنفذ

1. لا تبنِ Dashboard عام بلا تدفق منتج واضح.
2. لا تعرض تعقيد M0–M11 للمستخدم المبتدئ كقائمة تقنية إجبارية؛ اعرضه كتقدم مفهوم.
3. لا تجعل Gemini مسؤولًا عن اختيار كل شيء بلا Router وSchemas.
4. لا تكتب Prompts قبل تثبيت Brief وBeats وStyle/Continuity عند الحاجة.
5. لا تستخدم بيانات تجريبية ثابتة بدل pipeline حقيقي إلا في حالات loading/empty واضحة.
6. لا تنشئ تكامل توليد Media في MVP إلا بطلب منفصل.
7. عند الاختلاف بين هذا الملف والمستودع، حافظ على مبادئ المنتج وعقود المخرجات، ثم حدّث الوثيقة قبل تغيير السلوك.
