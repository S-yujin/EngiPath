/** Presentation labels for the Reflection Portrait. No API payloads are changed. */
const LOCALES = ['ko','en','zh','es','fr','de'] as const;
const entries: Record<string, readonly [string,string,string,string,string,string]> = {
  'Confirmed Core Anchors': ['확인된 핵심 강점','Confirmed Core Anchors','已证实的核心优势','Fortalezas fundamentales confirmadas','Forces fondamentales confirmées','Bestätigte Kernstärken'],
  'Possible Hidden Strengths': ['숨겨진 성장 가능성','Possible Hidden Strengths','潜在优势','Posibles fortalezas ocultas','Forces potentielles cachées','Mögliche verborgene Stärken'],
  'Enthusiastic Areas to Validate': ['추가 검증이 필요한 관심 분야','Enthusiastic Areas to Validate','有待验证的兴趣领域','Áreas de interés por validar','Domaines d’intérêt à valider','Zu prüfende Interessengebiete'],
  'Developing Picture': ['성장 중인 역량','Developing Picture','正在发展的能力','Competencias en desarrollo','Compétences en développement','Fähigkeiten im Aufbau'],
  'Still Taking Shape': ['아직 탐색 중인 역량','Still Taking Shape','仍在探索的能力','Competencias aún por definir','Compétences encore à explorer','Fähigkeiten in der Erkundung'],
  'Strengths with high confidence supported by demonstrated behavioral evidence across your reflections.': ['자기 탐색 답변에서 확인된 행동 근거로 뒷받침되는 강점입니다.','Strengths with high confidence supported by demonstrated behavioral evidence across your reflections.','由实际行为证据支持的高可信度优势。','Fortalezas respaldadas por evidencia de tu comportamiento.','Forces étayées par des comportements observés.','Stärken, die durch belegte Handlungen gestützt werden.'],
  'Capabilities where your scenario actions demonstrate higher competence than your cautious self-description.': ['스스로 평가한 것보다 실제 상황에서 더 높은 역량을 보여준 영역입니다.','Capabilities where your scenario actions demonstrate higher competence than your cautious self-description.','你在实际情境中的表现优于自我评价的领域。','Áreas donde tu desempeño supera tu propia evaluación.','Domaines où tes actions dépassent ton autoévaluation.','Bereiche, in denen deine Leistung deine Selbsteinschätzung übertrifft.'],
  'Domains where your confidence is high and you are primed to validate through upcoming project milestones.': ['자신감이 있으며 앞으로 프로젝트를 통해 검증할 수 있는 영역입니다.','Domains where your confidence is high and you are primed to validate through upcoming project milestones.','你有信心并可通过后续项目验证的领域。','Áreas que puedes validar con próximos proyectos.','Domaines à confirmer grâce à de futurs projets.','Bereiche, die du durch künftige Projekte prüfen kannst.'],
  'Capabilities where initial experience is emerging and will continue to crystallize with further hands-on challenges.': ['기초 경험이 쌓이고 있으며 추가 실습을 통해 발전할 역량입니다.','Capabilities where initial experience is emerging and will continue to crystallize with further hands-on challenges.','已有初步经验并可通过实践进一步提升的能力。','Competencias que mejorarán con más práctica.','Compétences qui progresseront avec la pratique.','Fähigkeiten, die sich durch weitere Praxis festigen.'],
  'Open growth frontiers with minimal direct evidence so far — representing your upcoming runway for learning.': ['현재 근거가 부족하지만 앞으로 경험을 쌓으며 확인할 수 있는 영역입니다.','Open growth frontiers with minimal direct evidence so far — representing your upcoming runway for learning.','目前证据有限但仍具发展潜力的领域。','Áreas con poca evidencia, pero potencial de aprendizaje.','Domaines encore peu documentés mais prometteurs.','Bereiche mit wenigen Belegen, aber weiterem Lernpotenzial.'],
  'Core Anchor': ['핵심 강점','Core Anchor','核心优势','Fortaleza principal','Point fort principal','Kernstärke'],
  'Hidden Growth Lever': ['숨겨진 성장 가능성','Hidden Growth Lever','潜在成长空间','Potencial de crecimiento','Potentiel de progression','Verborgenes Wachstumspotenzial'],
  'Solid Problem Framing & Troubleshooting': ['문제 정의 및 해결 역량','Solid Problem Framing & Troubleshooting','问题界定与排查能力','Definición y resolución de problemas','Analyse et résolution de problèmes','Problemdefinition und Fehlerbehebung'],
  'Demonstrated dependable engineering fundamentals in scenario diagnostics.': ['상황형 진단에서 안정적인 공학 기초 역량을 보여줬어요.','Demonstrated dependable engineering fundamentals in scenario diagnostics.','情境测评表明你具备扎实的工程基础。','La evaluación muestra fundamentos sólidos de ingeniería.','L’évaluation montre de solides bases en ingénierie.','Die Szenarien zeigen solide technische Grundlagen.'],
  'Adaptive Strategy & Execution': ['유연한 전략 및 실행력','Adaptive Strategy & Execution','灵活策略与执行能力','Estrategia adaptable y ejecución','Stratégie adaptable et mise en œuvre','Anpassungsfähige Strategie und Umsetzung'],
  'Demonstrated capability indicates readiness to tackle real-world project complexity.': ['실제 프로젝트의 복잡한 문제를 다룰 수 있는 역량을 보여줬어요.','Demonstrated capability indicates readiness to tackle real-world project complexity.','已有能力应对实际项目中的复杂问题。','Demuestras capacidad para afrontar proyectos complejos.','Tu expérience montre une capacité à gérer des projets complexes.','Du zeigst die Fähigkeit, komplexe Praxisprojekte anzugehen.'],
  'Your diagnostic confirms strong analytical foundations with an open runway in physical prototyping and systems integration.': ['분석 역량이 강점이며 시제품 제작과 시스템 통합에서도 성장 가능성이 있어요.','Your diagnostic confirms strong analytical foundations with an open runway in physical prototyping and systems integration.','分析能力是你的优势，原型制作和系统集成仍有成长空间。','Destacas en análisis y puedes crecer en prototipado e integración de sistemas.','L’analyse est un point fort; le prototypage et l’intégration restent à développer.','Deine Analysefähigkeiten sind stark; Prototyping und Systemintegration bieten Wachstumspotenzial.'],
  '• Baseline': ['· 초기 진단','• Baseline','· 初始评估','· Evaluación inicial','· Évaluation initiale','· Ausgangsbewertung'],
  '• Evolved': ['· 성장 점검','• Evolved','· 成长评估','· Seguimiento','· Suivi de progression','· Fortschrittsanalyse'],
  'All Dimensions': ['전체 역량','All Dimensions','全部能力','Todas las competencias','Toutes les compétences','Alle Kompetenzen'],
  'Verified Anchors': ['검증된 강점','Verified Anchors','已验证优势','Fortalezas verificadas','Forces vérifiées','Bestätigte Stärken'],
  'Latent Strengths Uncovered': ['발견된 잠재 강점','Latent Strengths Uncovered','发现的潜在优势','Fortalezas latentes descubiertas','Forces latentes découvertes','Entdeckte verborgene Stärken'],
  'Validation Runways': ['추가 검증 영역','Validation Runways','待验证领域','Áreas por validar','Domaines à valider','Prüfbereiche'],
  'Capabilities in Progress': ['발전 중인 역량','Capabilities in Progress','成长中的能力','Competencias en progreso','Compétences en progression','Fähigkeiten in Entwicklung'],
  'Unobserved Runway': ['추가 탐색 영역','Unobserved Runway','尚未评估的领域','Áreas sin evaluar','Domaines non évalués','Noch nicht bewertete Bereiche'],
  'Capability': ['개 역량','Capability','项能力','competencia','compétence','Fähigkeit'],
  'Capabilities': ['개 역량','Capabilities','项能力','competencias','compétences','Fähigkeiten'],
};

export function portraitDisplayText(english: string, language: string): string {
  const index = LOCALES.indexOf(language as typeof LOCALES[number]);
  const variants = entries[english];
  return index >= 0 && variants ? variants[index] : english;
}
