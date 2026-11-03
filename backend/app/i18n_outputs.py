"""Language-specific *presentation text* for deterministic fallback responses.

Only the natural-language strings are localized. Canonical IDs, O*NET records,
classification keys, scoring logic and persistence are not modified here.
"""
from app.llm.locale import get_language

LANGS = ("ko", "en", "zh", "es", "fr", "de")

# Each row contains a complete template in Korean, English, Simplified Chinese,
# Spanish, French and German (in that order).
_MESSAGES = {
    "career_major": (
        "{major} 전공 배경과 관련이 있는 직무입니다.",
        "Aligned with your {major} academic background.",
        "该职业与你的{major}专业背景相关。",
        "Esta profesión se relaciona con tu formación en {major}.",
        "Ce métier correspond à ta formation en {major}.",
        "Dieser Beruf passt zu deinem Studienhintergrund in {major}."),
    "career_skill": (
        "{role} 직무에 필요한 기술 중 {skills}이(가) 프로필에 포함되어 있습니다.",
        "Your profile includes skills relevant to {role}: {skills}.",
        "你的个人资料包含与{role}相关的技能：{skills}。",
        "Tu perfil incluye habilidades relevantes para {role}: {skills}.",
        "Ton profil comprend des compétences utiles pour {role} : {skills}.",
        "Dein Profil enthält für {role} relevante Kenntnisse: {skills}."),
    "career_experience": (
        "관련성을 판단할 때 참고할 수 있는 경험이 {count}개 있습니다.",
        "You have {count} experience(s) to draw evidence from.",
        "你有{count}项可用于评估的经历。",
        "Tienes {count} experiencias que pueden servir de referencia.",
        "Tu as {count} expériences utiles pour cette évaluation.",
        "Du hast {count} Erfahrungen, die für die Bewertung hilfreich sind."),
    "career_uncertain": (
        "아직 직접적인 근거가 충분하지 않아 초기 추정 결과입니다.",
        "We do not have much direct evidence yet — this is an initial estimate.",
        "目前直接证据还不充分，因此这是初步评估。",
        "Todavía hay pocas pruebas directas; esta es una evaluación inicial.",
        "Les preuves directes sont encore limitées : il s'agit d'une première estimation.",
        "Es liegen noch wenige direkte Belege vor; dies ist eine erste Einschätzung."),
    "career_static": (
        "공학 전공 배경 및 기초 역량과 연관된 진로입니다.",
        "Matches engineering background and foundational competencies.",
        "该职业与你的工程背景和基础能力相符。",
        "Es afín a tu formación en ingeniería y tus competencias básicas.",
        "Ce métier correspond à ta formation en ingénierie et à tes compétences de base.",
        "Dieser Beruf passt zu deinem technischen Hintergrund und deinen Grundlagen."),
    "gap_essential": (
        "{skill}은(는) {role} 직무에 필요한 핵심 역량이며 학생 프로필에 관련 정보가 있습니다.",
        "{skill} is essential for {role} and appears in the student's profile.",
        "{skill}是{role}需要的核心能力，学生资料中有相关信息。",
        "{skill} es esencial para {role} y figura en el perfil del estudiante.",
        "{skill} est essentiel pour {role} et apparaît dans le profil de l'étudiant.",
        "{skill} ist für {role} wichtig und im Profil dokumentiert."),
    "gap_tool_confirmed": (
        "{tool} 사용 경험이 확인되었으며 {role} 직무와 관련이 있습니다.",
        "The student has used {tool}, which matters for {role}.",
        "已确认有使用{tool}的经验，这与{role}岗位相关。",
        "Se ha confirmado experiencia con {tool}, relevante para {role}.",
        "L'utilisation de {tool} est attestée et pertinente pour {role}.",
        "Erfahrung mit {tool} ist belegt und für {role} relevant."),
    "gap_tool_unknown": (
        "아직 {tool} 사용 경험을 확인할 근거가 없습니다.",
        "No evidence yet that the student has used {tool}.",
        "目前尚无证据表明学生使用过{tool}。",
        "Aún no hay pruebas de experiencia con {tool}.",
        "Aucune preuve d'utilisation de {tool} pour le moment.",
        "Bisher liegen keine Nachweise für die Nutzung von {tool} vor."),
    "gap_knowledge_confirmed": (
        "학생의 배경에서 {name} 관련 경험을 확인할 수 있습니다.",
        "Student background touches {name}.",
        "学生的背景涉及{name}。",
        "La trayectoria del estudiante incluye {name}.",
        "Le parcours de l'étudiant comprend {name}.",
        "Der Hintergrund des Studierenden umfasst {name}."),
    "gap_knowledge_develop": (
        "{name}은(는) {role} 직무와 관련이 있지만 직접적인 근거는 아직 부족합니다.",
        "{name} is relevant to {role}; no direct evidence yet.",
        "{name}与{role}相关，但目前缺少直接证据。",
        "{name} es relevante para {role}, pero aún faltan pruebas directas.",
        "{name} est pertinent pour {role}, mais les preuves directes manquent.",
        "{name} ist für {role} relevant, aber direkte Nachweise fehlen noch."),
    "gap_uncertain": (
        "학생이 이 영역에 대해 아직 확신하지 못한다고 응답했습니다.",
        "The student indicated this area is uncertain.",
        "学生表示对这一领域尚不确定。",
        "El estudiante indicó que aún tiene dudas sobre esta área.",
        "L'étudiant a indiqué avoir des doutes sur ce domaine.",
        "Der Studierende hat diesen Bereich als unsicher eingestuft."),
    "gap_note_confirmed": (
        "{role} 직무와 관련된 {count}개 영역에서 직접적인 근거가 확인되었습니다.",
        "You have direct evidence for {count} areas relevant to {role}.",
        "已找到{count}项与{role}相关的直接证据。",
        "Se han encontrado pruebas directas en {count} áreas relacionadas con {role}.",
        "Des preuves directes sont disponibles dans {count} domaines liés à {role}.",
        "Für {count} Bereiche im Beruf {role} liegen direkte Nachweise vor."),
    "gap_note_develop": (
        "관련성이 있는 {count}개 영역에서 직접적인 근거가 아직 부족합니다.",
        "{count} relevant areas still lack direct evidence.",
        "仍有{count}个相关领域缺乏直接证据。",
        "Aún faltan pruebas directas en {count} áreas relevantes.",
        "Des preuves directes manquent encore dans {count} domaines pertinents.",
        "In {count} relevanten Bereichen fehlen noch direkte Nachweise."),
    "gap_note_unknown": (
        "{count}개 영역은 정보가 부족해 판단할 수 없습니다. 근거가 없다는 것이 역량이 없다는 뜻은 아닙니다.",
        "{count} areas remain unknown — absence of evidence is not evidence of absence.",
        "有{count}个领域信息不足；缺少证据并不意味着缺少能力。",
        "Hay {count} áreas aún desconocidas; no tener pruebas no implica falta de capacidad.",
        "{count} domaines restent incertains ; l'absence de preuves ne signifie pas l'absence de compétences.",
        "{count} Bereiche bleiben unklar; fehlende Belege bedeuten nicht fehlende Fähigkeiten."),
    "gap_note_empty": (
        "{role} 직무에 대한 비교 자료가 아직 없습니다.",
        "No comparison data available for {role} yet.",
        "目前尚无关于{role}的比较数据。",
        "Todavía no hay datos de comparación para {role}.",
        "Aucune donnée comparative n'est encore disponible pour {role}.",
        "Für {role} liegen noch keine Vergleichsdaten vor."),
    "plan_title": (
        "{area} 역량을 활용하는 소규모 프로젝트 완성하기",
        "Build one small project that exercises {area}",
        "完成一个运用{area}的小型项目",
        "Completar un proyecto pequeño que utilice {area}",
        "Réaliser un petit projet mobilisant {area}",
        "Ein kleines Projekt zu {area} abschließen"),
    "plan_why": (
        "{area}은(는) {role} 직무에 필요하지만 현재 프로필에 직접적인 경험 근거가 부족합니다.",
        "{area} is relevant to {role} but currently has limited direct evidence in your profile.",
        "{area}与{role}有关，但你的资料中直接经验的证据仍然有限。",
        "{area} es relevante para {role}, pero hay pocas pruebas directas en tu perfil.",
        "{area} est pertinent pour {role}, mais ton profil manque encore de preuves directes.",
        "{area} ist für {role} relevant, aber dein Profil enthält bisher wenige direkte Nachweise."),
    "plan_what": (
        "{area}을(를) 실제로 활용할 수 있는 작은 프로젝트를 정해 완성하고 작업 과정을 기록하세요.",
        "Choose a small real project where you apply {area}, finish it and document your work.",
        "选择一个实际运用{area}的小项目，完成并记录过程。",
        "Elige un proyecto pequeño que aplique {area}, termínalo y documenta el proceso.",
        "Choisis un petit projet utilisant {area}, termine-le et documente-le.",
        "Wähle ein kleines Praxisprojekt mit {area}, schließe es ab und dokumentiere es."),
    "plan_evidence": (
        "프로젝트 요약 및 구체적인 결과물 1~2개",
        "Short project write-up + 1–2 concrete outcomes",
        "项目简述和1至2项具体成果",
        "Breve resumen del proyecto y 1 o 2 resultados concretos",
        "Court compte rendu et 1 à 2 réalisations concrètes",
        "Kurze Projektbeschreibung und 1–2 konkrete Ergebnisse"),
    "plan_reflection": (
        "{area}을(를) 활용하면서 가장 흥미로웠던 부분은 무엇이고, 가장 어려웠던 결정은 무엇이었나요?",
        "What did you most enjoy about {area}, and what was your hardest decision?",
        "在应用{area}时，你最喜欢什么？最难的决定是什么？",
        "¿Qué disfrutaste más al usar {area} y cuál fue la decisión más difícil?",
        "Qu'as-tu préféré en utilisant {area} et quelle décision a été la plus difficile ?",
        "Was hat dir an {area} am meisten gefallen, und was war deine schwierigste Entscheidung?"),
    "plan_deliver_label": (
        "{area} 관련 결과물 1개 완성",
        "Complete one {area} deliverable",
        "完成一项与{area}相关的成果",
        "Completar un entregable de {area}",
        "Produire un livrable en {area}",
        "Ein Ergebnis zu {area} fertigstellen"),
    "plan_deliver_detail": (
        "{area}을(를) 활용하는 작은 프로젝트나 실제 작업을 선택하고 완성한 뒤 결과를 기록하세요.",
        "Choose and finish a small project using {area}, then document the result.",
        "选择一个使用{area}的小项目并完成，记录结果。",
        "Elige y completa un proyecto pequeño con {area} y documenta el resultado.",
        "Choisis et termine un petit projet utilisant {area}, puis documente le résultat.",
        "Wähle ein kleines Projekt zu {area}, schließe es ab und dokumentiere es."),
    "plan_collect_label": (
        "증빙 자료 1~2개 모으기", "Collect 1–2 evidence artifacts", "收集1至2份证明材料",
        "Reunir 1 o 2 pruebas", "Rassembler 1 à 2 preuves", "1–2 Nachweise sammeln"),
    "plan_collect_detail": (
        "수행 내용을 보여주는 코드, 사진 또는 짧은 보고서를 정리하세요.",
        "Keep code, photos or a write-up showing what you completed.",
        "保存能展示你完成内容的代码、照片或报告。",
        "Guarda código, fotos o un informe de lo que completaste.",
        "Conserve du code, des photos ou un compte rendu de ce que tu as réalisé.",
        "Bewahre Code, Fotos oder einen Bericht über deine Arbeit auf."),
    "plan_reflect_label": (
        "짧은 회고 작성하기", "Write a short reflection", "写一篇简短的反思",
        "Escribir una breve reflexión", "Rédiger une courte réflexion", "Eine kurze Reflexion schreiben"),
    "plan_reflect_detail": (
        "즐거웠던 점과 가장 어려웠던 의사결정을 짧게 정리하세요.",
        "Write down what you enjoyed and the hardest decision you made.",
        "记录你喜欢的部分以及做过的最困难的决定。",
        "Anota lo que disfrutaste y la decisión más difícil que tomaste.",
        "Note ce que tu as apprécié et la décision la plus difficile que tu as prise.",
        "Notiere, was dir gefallen hat und welche Entscheidung besonders schwierig war."),
    "plan_milestone_title": (
        "{area} 역량 심화", "Strengthen {area}", "深化{area}能力",
        "Profundizar en {area}", "Approfondir {area}", "{area} vertiefen"),
    "plan_milestone_desc": (
        "{area}을(를) 활용하는 프로젝트나 과정을 1개 이상 완료하고 성과를 기록하세요.",
        "Complete a substantial project or course using {area} and document your results.",
        "完成至少一项运用{area}的项目或课程并记录成果。",
        "Completa un proyecto o curso que use {area} y documenta los resultados.",
        "Termine un projet ou un cours utilisant {area} et documente les résultats.",
        "Schließe ein Projekt oder einen Kurs zu {area} ab und dokumentiere das Ergebnis."),
    "plan_milestone_label": (
        "{area} 프로젝트 또는 교육과정 완료",
        "Finish a substantive {area} project or course",
        "完成{area}项目或课程",
        "Terminar un proyecto o curso de {area}",
        "Terminer un projet ou une formation en {area}",
        "Ein Projekt oder einen Kurs zu {area} abschließen"),
    "plan_milestone_detail": (
        "{area} 관련 과정이나 자기주도 프로젝트를 계획부터 결과물까지 완료하세요.",
        "Complete a course or self-directed project using {area} from start to finish.",
        "从头到尾完成一个涉及{area}的课程或自学项目。",
        "Termina un curso o proyecto personal con {area} de principio a fin.",
        "Termine une formation ou un projet autonome utilisant {area}.",
        "Schließe einen Kurs oder ein eigenes Projekt zu {area} vollständig ab."),
    "plan_publish_label": (
        "결과 공유하기", "Share outcomes", "分享成果", "Compartir resultados", "Partager les résultats", "Ergebnisse teilen"),
    "plan_publish_detail": (
        "무엇을 만들고 배웠는지 GitHub, 블로그 또는 포트폴리오에 정리해 공유하세요.",
        "Share what you built or learned in a repository, blog or portfolio.",
        "在代码仓库、博客或作品集中分享制作和学习成果。",
        "Comparte lo que creaste o aprendiste en un repositorio, blog o portafolio.",
        "Présente tes réalisations dans un dépôt, blog ou portfolio.",
        "Teile deine Ergebnisse in einem Repository, Blog oder Portfolio."),
    "plan_vision": (
        "{areas} 분야에서 실질적인 성과를 축적하고, 점차 독립적으로 수행할 수 있는 프로젝트의 범위를 넓혀가세요.",
        "Build a portfolio of increasingly independent real-world work in {areas}.",
        "在{areas}领域积累实际成果，逐步开展更独立的项目。",
        "Crea un portafolio de trabajo cada vez más autónomo en {areas}.",
        "Constitue un portfolio de réalisations de plus en plus autonomes dans {areas}.",
        "Baue ein Portfolio zunehmend eigenständiger Praxisarbeit in {areas} auf."),
    "plan_target_area": (
        "목표 분야", "your target area", "目标领域", "tu área objetivo", "ton domaine visé", "deinem Zielbereich"),
    "duration_short": ("4~8주", "4–8 weeks", "4至8周", "4 a 8 semanas", "4 à 8 semaines", "4–8 Wochen"),
    "duration_vision": ("1~2년", "1–2 years", "1至2年", "1 a 2 años", "1 à 2 ans", "1–2 Jahre"),
    "duration_months": (
        "{count}개월", "{count} months", "{count}个月", "{count} meses", "{count} mois", "{count} Monate"),
    "reflection_core_0": (
        "기억에 남는 프로젝트나 경험에 대해 이야기해 주세요.",
        "Tell me about a meaningful project or experience you have worked on.",
        "请谈谈你参与过的一个有意义的项目或经历。",
        "Cuéntame sobre un proyecto o una experiencia importante para ti.",
        "Parle-moi d'un projet ou d'une expérience qui t'a marqué.",
        "Erzähle mir von einem bedeutsamen Projekt oder einer Erfahrung."),
    "reflection_core_1": (
        "그 경험에서 직접 가장 크게 기여한 부분은 무엇인가요?",
        "What part of that experience did you personally contribute the most to?",
        "在那段经历中，你个人最大的贡献是什么？",
        "¿En qué parte de esa experiencia contribuiste más personalmente?",
        "Quelle a été ta contribution personnelle la plus importante ?",
        "Was war dein wichtigster persönlicher Beitrag dabei?"),
    "reflection_core_2": (
        "어떤 도구, 방법 또는 기술을 사용했나요?",
        "What tools, methods, or technologies did you use?",
        "你使用了哪些工具、方法或技术？",
        "¿Qué herramientas, métodos o tecnologías utilizaste?",
        "Quels outils, méthodes ou technologies as-tu utilisés ?",
        "Welche Werkzeuge, Methoden oder Technologien hast du verwendet?"),
    "reflection_core_3": (
        "어떤 어려움이 있었고 어떻게 해결했나요?",
        "Describe a challenge or problem you faced and how you approached it.",
        "请描述你遇到的困难及其解决方法。",
        "Describe un problema que enfrentaste y cómo lo abordaste.",
        "Décris une difficulté rencontrée et la façon dont tu l'as abordée.",
        "Beschreibe eine Herausforderung und wie du damit umgegangen bist."),
    "reflection_core_4": (
        "가장 즐거웠던 점과 가장 어려웠던 점은 무엇이었나요?",
        "What did you enjoy most about it — and what did you find difficult?",
        "其中最喜欢的部分和最困难的部分分别是什么？",
        "¿Qué fue lo que más disfrutaste y qué te resultó más difícil?",
        "Qu'as-tu préféré, et qu'as-tu trouvé difficile ?",
        "Was hat dir am meisten gefallen und was war schwierig?"),
    "reflection_area": (
        "프로젝트 참여도", "Project engagement", "项目参与程度", "Participación en proyectos", "Participation à un projet", "Projektbeteiligung"),
    "reflection_reason": (
        "학생이 구체적인 경험을 설명했습니다.",
        "The student described an experience in detail.",
        "学生详细描述了一段经历。",
        "El estudiante describió una experiencia en detalle.",
        "L'étudiant a décrit une expérience en détail.",
        "Der Studierende hat eine Erfahrung ausführlich beschrieben."),
    "reflection_unverified": (
        "아직 이 영역을 확인할 정보가 충분하지 않습니다.",
        "Not enough information yet to confirm this area.",
        "目前信息不足，无法确认这一领域。",
        "Aún no hay información suficiente para confirmar esta área.",
        "Les informations sont encore insuffisantes pour confirmer ce domaine.",
        "Die Informationen reichen noch nicht aus, um diesen Bereich zu bestätigen."),
}

for _key, _values in _MESSAGES.items():
    if len(_values) != len(LANGS):
        raise ValueError(f"Missing translations for {_key}: {_values}")


def out(key: str, **params) -> str:
    """Get a fully translated display template without changing any identifiers."""
    return _MESSAGES[key][LANGS.index(get_language())].format(**params)
