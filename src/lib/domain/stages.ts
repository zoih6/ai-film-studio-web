// تعريف مراحل الـPipeline — المصدر: docs/product/FILE-STRUCTURE.md §4
// تنظيم مراحل الإنتاج: intake → intent-analysis → route-selection → brief → ... → delivery

export interface StageDefinition {
  id: string
  labelAr: string
  labelEn: string
  descriptionAr: string
  icon: string
}

export const STAGE_DEFINITIONS: StageDefinition[] = [
  {
    id: 'brief',
    labelAr: 'البرييف الإبداعي',
    labelEn: 'Creative Brief',
    descriptionAr: 'هدف الفيديو، الجمهور، الرسالة الأساسية، ومواصفات التسليم.',
    icon: 'clipboard',
  },
  {
    id: 'concept',
    labelAr: 'الفكرة الكبرى',
    labelEn: 'Big Idea',
    descriptionAr: 'الـBig Idea واللوقلاين والاتجاه البصري والخطاف الإبداعي.',
    icon: 'lightbulb',
  },
  {
    id: 'narrative',
    labelAr: 'السرد والسكربت',
    labelEn: 'Narrative',
    descriptionAr: 'بنية السرد والسكربت المختصر ونص التعليق الصوتي.',
    icon: 'scroll',
  },
  {
    id: 'beats',
    labelAr: 'جدول الإيقاع',
    labelEn: 'Beat Table',
    descriptionAr: 'تقسيم المدة إلى Beats محكمة بالثواني مع الانتقالات.',
    icon: 'timer',
  },
  {
    id: 'style-entities',
    labelAr: 'الهوية البصرية والكيانات',
    labelEn: 'Style & Entities',
    descriptionAr: 'Style Lock حرفي، Entity Ledger، وProduct Anchor.',
    icon: 'palette',
  },
  {
    id: 'storyboard',
    labelAr: 'الستوري بورد',
    labelEn: 'Storyboard',
    descriptionAr: 'مشاهد وفريمات مرتبة قبل البرومبتات مع حالات البداية والنهاية.',
    icon: 'layout',
  },
  {
    id: 'shot-cards',
    labelAr: 'بطاقات اللقطات',
    labelEn: 'Shot Cards',
    descriptionAr: 'بطاقة لكل لقطة: المدة، الهدف، الكاميرا، الحركة، الصوت.',
    icon: 'camera',
  },
  {
    id: 'image-prompts',
    labelAr: 'برومبتات الصور',
    labelEn: 'Image Prompts',
    descriptionAr: 'برومبت واحد كامل ومستقل لكل فريم، قابل للنسخ مباشرة.',
    icon: 'image',
  },
  {
    id: 'motion-prompts',
    labelAr: 'برومبتات الحركة',
    labelEn: 'Motion Prompts',
    descriptionAr: 'برومبت تحريك كامل لكل لقطة مع أول وآخر فريم والاستمرارية.',
    icon: 'film',
  },
  {
    id: 'audio',
    labelAr: 'خطة الصوت',
    labelEn: 'Audio Plan',
    descriptionAr: 'التعليق الصوتي، الموسيقى، المؤثرات، وملاحظات المكس.',
    icon: 'audio',
  },
  {
    id: 'delivery',
    labelAr: 'التسليم والجودة',
    labelEn: 'Delivery & Quality',
    descriptionAr: 'مواصفات التصدير، بوابات الجودة، وقائمة الفحص النهائية.',
    icon: 'check',
  },
]

export const SHORTCUT_STAGE: StageDefinition = {
  id: 'final-prompt',
  labelAr: 'البرومبت النهائي',
  labelEn: 'Final Prompt',
  descriptionAr: 'برومبت واحد كامل وجاهز للنسخ من فكرتك مباشرة.',
  icon: 'zap',
}

export function getStageDefinition(stageId: string): StageDefinition | undefined {
  if (stageId === 'final-prompt') return SHORTCUT_STAGE
  return STAGE_DEFINITIONS.find((s) => s.id === stageId)
}

// مسارات القوائم — المصدر: workflows/intent-router.md
export const ROUTE_LABELS: Record<string, string> = {
  'shortcut-prompt': 'برومبت سريع',
  'commercial-engine': 'محرك الإعلانات التجارية',
  'documentary-engine': 'محرك الوثائقي',
  'full-production': 'المسار الكامل M0–M11',
  'motion-engine': 'محرك الموشن جرافيك',
  'series-engine': 'محرك السلاسل',
}

export function stagesForRoute(route: string): string[] {
  if (route === 'shortcut-prompt') return ['final-prompt']
  return STAGE_DEFINITIONS.map((s) => s.id)
}
