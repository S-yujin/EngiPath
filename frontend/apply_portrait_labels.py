"""Apply minimal UI-label changes in-place, keeping other frontend edits intact.
Run this file inside C:\\pj-Engipath\\frontend. Creates .bak backups.
"""
from pathlib import Path
import shutil

root=Path.cwd()
screen=root/'src/components/screens/Screen4_Portrait.tsx'
card=root/'src/components/feedback/CategoryGroupCard.tsx'
uitext=root/'src/i18n/uiText.tsx'
translation_src=Path(__file__).with_name('portraitLabels.ts')
translation_dst=root/'src/i18n/portraitLabels.ts'
for p in (screen,card,uitext,translation_src):
    if not p.exists(): raise SystemExit(f'File not found: {p}')

patches={}
s=screen.read_text(encoding='utf8')
def once(text,old,new):
    if new in text: return text
    if old not in text: raise RuntimeError(f'Missing expected text: {old[:85]!r}')
    return text.replace(old,new,1)
s=once(s,"import { LocalizedText, uiAttr } from '../../i18n/uiText';", "import { LocalizedText, uiAttr } from '../../i18n/uiText';\nimport { portraitDisplayText } from '../../i18n/portraitLabels';\nimport { localizeKnownCareerText } from '../../i18n/careerLocalization';")
s=once(s,'    selectedJob,\n    setCurrentStep','    selectedJob,\n    language,\n    setCurrentStep')
for title in ('Confirmed Core Anchors','Possible Hidden Strengths','Enthusiastic Areas to Validate','Developing Picture','Still Taking Shape'):
    s=once(s,f"title: '{title}',",f"title: portraitDisplayText('{title}', language),")
descs=(
'Strengths with high confidence supported by demonstrated behavioral evidence across your reflections.',
'Capabilities where your scenario actions demonstrate higher competence than your cautious self-description.',
'Domains where your confidence is high and you are primed to validate through upcoming project milestones.',
'Capabilities where initial experience is emerging and will continue to crystallize with further hands-on challenges.',
'Open growth frontiers with minimal direct evidence so far — representing your upcoming runway for learning.',
)
for desc in descs:
    s=once(s, f"description: '{desc}',", f"description: portraitDisplayText('{desc}', language),")
for text in (
'Solid Problem Framing & Troubleshooting',
'Demonstrated dependable engineering fundamentals in scenario diagnostics.',
'Adaptive Strategy & Execution',
'Demonstrated capability indicates readiness to tackle real-world project complexity.',
'Your diagnostic confirms strong analytical foundations with an open runway in physical prototyping and systems integration.',
):
    s=once(s,f"|| '{text}'",f"|| portraitDisplayText('{text}', language)")
s=once(s,"currentCycle > 1 ? '• Evolved' : '• Baseline'","currentCycle > 1 ? portraitDisplayText('• Evolved', language) : portraitDisplayText('• Baseline', language)")
s=once(s,"{selectedJob?.title || 'Target Role'}","{selectedJob?.title ? localizeKnownCareerText(selectedJob.title, language) : 'Target Role'}")
s=once(s,"{selectedJob?.title || 'Target Job'}","{selectedJob?.title ? localizeKnownCareerText(selectedJob.title, language) : 'Target Job'}")
patches[screen]=s
s=card.read_text(encoding='utf8')
s=once(s,"import { LocalizedText, uiAttr } from '../../i18n/uiText';", "import { LocalizedText, uiAttr } from '../../i18n/uiText';\nimport { portraitDisplayText } from '../../i18n/portraitLabels';\nimport { useApp } from '../../context/AppContext';")
s=once(s,"  const [expandedIndices, setExpandedIndices] = useState", "  const { language } = useApp();\n  const [expandedIndices, setExpandedIndices] = useState")
s=once(s,'{items.length} {items.length === 1 ? \'Capability\' : \'Capabilities\'}', "{items.length} {portraitDisplayText(items.length === 1 ? 'Capability' : 'Capabilities', language)}")
patches[card]=s
s=uitext.read_text(encoding='utf8')
s=once(s,"import { localizeKnownCareerText } from './careerLocalization';", "import { localizeKnownCareerText } from './careerLocalization';\nimport { portraitDisplayText } from './portraitLabels';")
s=once(s,"  return language === 'ko' ? (KOREAN_UI[text] || localizeKnownCareerText(text, language)) : text;", "  const portraitText = portraitDisplayText(text, language);\n  if (portraitText !== text) return portraitText;\n  return language === 'ko' ? (KOREAN_UI[text] || localizeKnownCareerText(text, language)) : text;")
patches[uitext]=s
for p,new in patches.items():
    if p.read_text(encoding='utf8') != new:
        bak=p.with_suffix(p.suffix+'.bak')
        shutil.copy2(p,bak)
        p.write_text(new,encoding='utf8')
        print('Updated:',p.relative_to(root),'(backup:',bak.name,')')
if translation_dst.exists():
    shutil.copy2(translation_dst,translation_dst.with_suffix('.ts.bak'))
shutil.copy2(translation_src,translation_dst)
print('Done. Existing layout classes, data IDs and API calls were left unchanged.')
