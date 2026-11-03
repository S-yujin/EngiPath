"""Localized user-facing fallback messages. Keep model/database codes unchanged."""
from app.llm.locale import get_language


def msg(variants: dict[str, str], **params) -> str:
    """Select a complete localized template from the six supported languages."""
    return variants.get(get_language(), variants.get("ko", "")).format(**params)


SUMMARY_TEMPLATES = {
    "ko": ("가장 관심 있는 분야는 {v}입니다.", "특히 관심을 두는 활동이나 주제는 {v}입니다.",
           "스스로 강점이라고 생각하는 부분은 {v}입니다.", "상대적으로 자신감이 부족하다고 느끼는 부분은 {v}입니다.",
           "선호하는 학습 방식은 {v}입니다.", "답변을 보면 {v}에서 스스로 생각하는 것보다 많은 경험이 있을 수 있습니다."),
    "en": ("You're most curious about {v}.", "You tend to enjoy {v}.",
           "You currently see {v} as one of your stronger areas.", "You feel less confident about {v}.",
           "You prefer learning through {v}.", "Your answers suggest you may have more experience in {v} than you realize."),
    "zh": ("你最感兴趣的领域是{v}。", "你通常喜欢与{v}相关的活动。",
           "你认为{v}是自己的优势之一。", "你对{v}还不太有信心。",
           "你更喜欢通过{v}来学习。", "根据你的回答，你在{v}方面的经验可能比你认为的更多。"),
    "es": ("Los campos que más te interesan son {v}.", "Sueles disfrutar de {v}.",
           "Tus fortalezas percibidas incluyen {v}.", "Tienes menos confianza en {v}.",
           "Prefieres aprender mediante {v}.", "Tus respuestas sugieren que puedes tener más experiencia en {v} de la que crees."),
    "fr": ("Les domaines qui t'intéressent le plus sont {v}.", "Tu apprécies {v}.",
           "Parmi tes points forts, tu cites {v}.", "Tu te sens moins à l'aise avec {v}.",
           "Tu préfères apprendre grâce à {v}.", "Tes réponses suggèrent que tu as peut-être plus d'expérience en {v} que tu ne le penses."),
    "de": ("Du interessierst dich besonders für {v}.", "Du beschäftigst dich gerne mit {v}.",
           "Zu deinen Stärken zählst du {v}.", "Bei {v} fühlst du dich noch unsicher.",
           "Du lernst am liebsten durch {v}.", "Deine Antworten zeigen, dass du mit {v} möglicherweise mehr Erfahrung hast, als du denkst."),
}


SIGNAL_NAMES = {
    "PS1": ("문제 정의", "Problem Framing", "问题界定", "Definición de problemas", "Cadrage des problèmes", "Problemdefinition"),
    "PS2": ("문제 해결 및 원인 분석", "Troubleshooting", "故障排查", "Resolución de problemas", "Dépannage", "Fehleranalyse"),
    "LEARN1": ("학습 주도성", "Learning Initiative", "学习主动性", "Iniciativa de aprendizaje", "Initiative d'apprentissage", "Lerninitiative"),
    "LEARN2": ("학습 전략 조정", "Strategy Adaptation", "策略调整", "Adaptación de estrategias", "Adaptation des stratégies", "Strategieanpassung"),
    "EXEC1": ("독립적 실행", "Independence", "独立执行", "Autonomía", "Autonomie", "Selbstständigkeit"),
    "EXEC2": ("주도성과 책임감", "Initiative & Ownership", "主动性与责任感", "Iniciativa y responsabilidad", "Initiative et responsabilité", "Initiative und Verantwortung"),
    "COM1": ("아이디어 전달", "Idea Communication", "想法表达", "Comunicación de ideas", "Communication des idées", "Ideenkommunikation"),
    "COM2": ("팀 기여", "Team Contribution", "团队贡献", "Contribución al equipo", "Contribution à l'équipe", "Teambeitrag"),
    "MGMT1": ("우선순위 설정", "Prioritisation", "优先级管理", "Priorización", "Hiérarchisation", "Priorisierung"),
    "MGMT2": ("실패에 대한 대응", "Response to Setbacks", "应对挫折", "Respuesta a contratiempos", "Réaction aux échecs", "Umgang mit Rückschlägen"),
}
_LANG_POS = {"ko": 0, "en": 1, "zh": 2, "es": 3, "fr": 4, "de": 5}


def signal_name(key: str) -> str:
    value = SIGNAL_NAMES.get(key)
    return value[_LANG_POS[get_language()]] if value else key


# Questionnaire signal values. These are labels for display ONLY; original values stay in DB.
# Format: id|ko|zh|es|fr|de. Missing terms fall back to a readable identifier.
_VALUE_ROWS = r"""
software_computing|소프트웨어 및 컴퓨팅|软件与计算|software e informática|logiciels et informatique|Software und Informatik
ai_data|인공지능 및 데이터|人工智能与数据|IA y datos|IA et données|KI und Daten
robotics_automation|로봇공학 및 자동화|机器人与自动化|robótica y automatización|robotique et automatisation|Robotik und Automatisierung
electronics_embedded|전자공학 및 임베디드 시스템|电子与嵌入式系统|electrónica y sistemas integrados|électronique et systèmes embarqués|Elektronik und eingebettete Systeme
mechanical_engineering|기계공학|机械工程|ingeniería mecánica|génie mécanique|Maschinenbau
manufacturing_production|제조 및 생산|制造与生产|fabricación y producción|fabrication et production|Fertigung und Produktion
energy_sustainability|에너지 및 지속가능성|能源与可持续发展|energía y sostenibilidad|énergie et durabilité|Energie und Nachhaltigkeit
infrastructure_cities|인프라 및 도시|基础设施与城市|infraestructura y ciudades|infrastructures et villes|Infrastruktur und Städte
materials_chemical|재료 및 화학공학|材料与化学工程|materiales e ingeniería química|matériaux et génie chimique|Werkstoff- und Chemietechnik
science_research|과학 및 연구|科学与研究|ciencia e investigación|science et recherche|Wissenschaft und Forschung
business_product|비즈니스 및 제품 개발|商业与产品开发|negocios y desarrollo de productos|commerce et développement produit|Wirtschaft und Produktentwicklung
other_domain|기타 분야|其他领域|otros campos|autres domaines|andere Bereiche
still_exploring|진로 탐색 중|仍在探索|exploración de opciones|encore en exploration|noch in der Orientierung
problem_understanding|문제 이해|问题理解|comprensión del problema|compréhension du problème|Problemverständnis
ideation_concept|아이디어 및 구상|创意与构思|ideas y conceptos|idéation et concepts|Ideenfindung und Konzeption
building_implementation|제작 및 구현|构建与实现|construcción e implementación|construction et mise en œuvre|Aufbau und Implementierung
data_analysis|데이터 분석|数据分析|análisis de datos|analyse des données|Datenanalyse
testing_optimization|테스트 및 최적화|测试与优化|pruebas y optimización|tests et optimisation|Testen und Optimierung
troubleshooting|문제 해결|故障排查|resolución de problemas|résolution de problèmes|Fehlerbehebung
team_coordination|팀 조율|团队协调|coordinación del equipo|coordination d'équipe|Teamkoordination
communication_presentation|소통 및 발표|沟通与展示|comunicación y presentación|communication et présentation|Kommunikation und Präsentation
learning_exploration|학습 및 탐색|学习与探索|aprendizaje y exploración|apprentissage et exploration|Lernen und Erkunden
domain_subject_matter|전공 분야의 주제와 내용|领域专业知识|materia del campo elegido|contenu du domaine|Fachinhalte
domain_knowledge|전공 지식|专业知识|conocimientos del campo|connaissances du domaine|Fachwissen
problem_solving|문제 해결 활동|问题解决|resolución de problemas|résolution de problèmes|Problemlösung
tangible_creation|실제 결과물 제작|实物创造|creación tangible|création concrète|praktische Umsetzung
social_collaboration|협업 및 교류|社交协作|colaboración social|collaboration sociale|soziale Zusammenarbeit
mastering_difficulty|어려운 과제 극복|攻克难题|superación de dificultades|surmonter des difficultés|Bewältigung schwieriger Aufgaben
clear_impact_outcome|명확한 성과와 영향|明确成果与影响|resultados e impacto claros|résultats et impact clairs|klare Ergebnisse und Wirkung
other_aspect|기타 활동|其他方面|otros aspectos|autres aspects|andere Aspekte
product_development|제품 개발|产品开发|desarrollo de productos|développement produit|Produktentwicklung
scientific_investigation|과학적 탐구|科学探究|investigación científica|investigation scientifique|wissenschaftliche Untersuchung
systems_optimization|시스템 최적화|系统优化|optimización de sistemas|optimisation des systèmes|Systemoptimierung
greenfield_design|새로운 설계|从零设计|diseño desde cero|conception à partir de zéro|Neuentwicklung
data_analytics|데이터 분석 업무|数据分析工作|analítica de datos|analytique de données|Datenanalytik
real_world_application|실생활 적용|实际应用|aplicación práctica|application pratique|praktische Anwendung
emerging_tech_exploration|신기술 탐색|新技术探索|exploración de nuevas tecnologías|exploration des technologies émergentes|Erkundung neuer Technologien
conceptual_depth|개념의 깊이 있는 이해|深入理解概念|profundidad conceptual|approfondissement conceptuel|vertieftes Konzeptverständnis
craftsmanship_polish|완성도 향상|精益求精|perfeccionamiento del trabajo|perfectionnement du travail|Sorgfalt und Feinschliff
team_cohesion|팀워크 강화|团队凝聚力|cohesión del equipo|cohésion d'équipe|Teamzusammenhalt
knowledge_articulation|지식 설명 및 표현|知识表达|explicación de conocimientos|explication des connaissances|Wissensvermittlung
future_exploration|미래 진로 탐색|未来探索|exploración futura|exploration de l'avenir|Zukunftserkundung
unfamiliar_problem_solving|낯선 문제 해결|解决陌生问题|resolución de problemas nuevos|résolution de problèmes inconnus|Lösen unbekannter Probleme
rapid_learning|빠른 학습|快速学习|aprendizaje rápido|apprentissage rapide|schnelles Lernen
execution_delivery|계획 실행과 완수|执行与交付|ejecución y entrega|exécution et livraison|Umsetzung und Fertigstellung
teamwork_collaboration|팀워크와 협업|团队合作|trabajo en equipo|travail en équipe|Teamarbeit und Zusammenarbeit
idea_communication|아이디어 전달|想法表达|comunicación de ideas|communication des idées|Ideenkommunikation
work_organisation|업무 정리 및 관리|工作组织|organización del trabajo|organisation du travail|Arbeitsorganisation
repeated_success|반복적인 성과|反复取得成功|éxitos repetidos|réussites répétées|wiederholte Erfolge
academic_performance|학업 성과|学业表现|rendimiento académico|résultats scolaires|Studienleistungen
peer_reliance|동료의 신뢰|同伴信任|confianza de compañeros|confiance des pairs|Vertrauen von Mitstudierenden
mentor_endorsement|멘토의 인정|导师认可|reconocimiento del mentor|reconnaissance du mentor|Anerkennung durch Mentoren
intuitive_ease|자연스럽게 잘함|得心应手|facilidad intuitiva|aisance intuitive|intuitive Leichtigkeit
enjoyment_heuristic|즐거움에 대한 직감|基于兴趣的直觉|intuición basada en el disfrute|intuition fondée sur le plaisir|Freude als Anhaltspunkt
repeated_difficulty|반복되는 어려움|反复遇到困难|dificultades repetidas|difficultés récurrentes|wiederholte Schwierigkeiten
opportunity_deficit|경험 기회 부족|缺少机会|falta de oportunidades|manque d'occasions|fehlende Gelegenheiten
weak_outcomes|부족한 성과|成果不足|resultados débiles|résultats insuffisants|schwache Ergebnisse
peer_comparison|동료와의 비교|与同伴比较|comparación con compañeros|comparaison avec les pairs|Vergleich mit anderen
critical_feedback|개선이 필요한 피드백|批评性反馈|comentarios críticos|retours critiques|kritisches Feedback
general_unease|전반적인 불안감|普遍不安|inquietud general|malaise général|allgemeine Unsicherheit
peer_comparison_benchmark|동료 기준 비교|同伴比较基准|referencia entre compañeros|comparaison aux pairs|Vergleichsmaßstab von Mitstudierenden
affective_comfort_gap|심리적 편안함의 차이|心理舒适度差异|brecha de comodidad emocional|écart de confort émotionnel|Unterschied im Wohlbefinden
perceived_dependency|의존성에 대한 인식|对依赖性的感知|dependencia percibida|dépendance perçue|wahrgenommene Abhängigkeit
setback_vulnerability|좌절에 대한 취약성|挫折敏感性|vulnerabilidad ante reveses|vulnérabilité aux revers|Anfälligkeit für Rückschläge
perceived_scope_gap|인식하는 역량 범위 차이|感知范围差距|brecha de alcance percibida|écart de portée perçue|wahrgenommene Kompetenzlücke
self_appraisal_uncertainty|자기 평가의 불확실성|自我评估不确定性|incertidumbre de autoevaluación|incertitude de l'autoévaluation|Unsicherheit bei Selbsteinschätzung
other_factor|기타 요인|其他因素|otro factor|autre facteur|anderer Faktor
exploratory_interest|탐색적 관심|探索性兴趣|interés exploratorio|intérêt exploratoire|erkundendes Interesse
individual_responsibility|개인의 책임감|个人责任感|responsabilidad individual|responsabilité individuelle|Eigenverantwortung
autonomous_individual_contributor|독립적 기여자|自主贡献者|contribuidor autónomo|contributeur autonome|selbstständige Fachkraft
emergent_initiative|새롭게 나타나는 주도성|逐渐展现的主动性|iniciativa emergente|initiative émergente|entstehende Eigeninitiative
conventional_leadership_view|전통적인 리더십 인식|传统领导观|visión tradicional del liderazgo|vision traditionnelle du leadership|traditionelles Führungsverständnis
one_to_one_explanation|일대일 설명|一对一解释|explicación individual|explication individuelle|Erklärung im Einzelgespräch
small_group_discussion|소그룹 토론|小组讨论|debate en grupos pequeños|discussion en petit groupe|Diskussion in Kleingruppen
written_communication|글쓰기 소통|书面沟通|comunicación escrita|communication écrite|schriftliche Kommunikation
formal_presentation|공식 발표|正式演示|presentación formal|présentation formelle|formelle Präsentation
interpersonal_coordination|대인 조율|人际协调|coordinación interpersonal|coordination interpersonnelle|Abstimmung mit anderen
public_speaking|대중 앞 발표|公开演讲|hablar en público|prise de parole en public|öffentliches Sprechen
explaining_complex_ideas|복잡한 아이디어 설명|解释复杂概念|explicar ideas complejas|expliquer des idées complexes|komplexe Ideen erklären
initiating_conversations|대화 주도|主动发起对话|iniciar conversaciones|engager la conversation|Gespräche beginnen
navigating_disagreements|의견 차이 조율|处理分歧|gestionar desacuerdos|gérer les désaccords|Meinungsverschiedenheiten klären
group_collaboration|그룹 협업|小组协作|colaboración grupal|collaboration en groupe|Gruppenzusammenarbeit
written_clarity|명확한 글쓰기|书面表达清晰|claridad escrita|clarté de l'écrit|schriftliche Klarheit
other_communication_aspect|기타 소통 방식|其他沟通方面|otros aspectos comunicativos|autres aspects de communication|andere Kommunikationsaspekte
modular_ownership|모듈 단위 책임|模块责任|responsabilidad por módulos|responsabilité par module|Modulverantwortung
collaborative_ideation|공동 아이디어 발상|协作创意|ideación colaborativa|idéation collaborative|gemeinsame Ideenfindung
relational_trust|관계에서의 신뢰|关系信任|confianza interpersonal|confiance relationnelle|zwischenmenschliches Vertrauen
structured_coordination|체계적인 조율|结构化协调|coordinación estructurada|coordination structurée|strukturierte Koordination
autonomous_component_control|구성 요소의 독립적 관리|自主组件管理|control autónomo de componentes|gestion autonome des composants|eigenständige Komponentensteuerung
individual_work|개인 작업|独立工作|trabajo individual|travail individuel|Einzelarbeit
theory_first|이론 우선 학습|理论优先|teoría primero|théorie d'abord|zuerst Theorie
theory_leaning|이론 중심 학습|偏重理论|enfoque teórico|orientation théorique|theorieorientiert
hands_on_leaning|실습 중심 학습|偏重实践|enfoque práctico|orientation pratique|praxisorientiert
hands_on|직접 실습|动手实践|aprendizaje práctico|apprentissage pratique|praktisches Arbeiten
structured|체계적 학습|结构化学习|aprendizaje estructurado|apprentissage structuré|strukturiertes Lernen
guided_project|지도받는 프로젝트|指导项目|proyecto guiado|projet accompagné|angeleitetes Projekt
independent_project|독립 프로젝트|独立项目|proyecto independiente|projet indépendant|eigenständiges Projekt
exploratory|탐색형 학습|探索式学习|aprendizaje exploratorio|apprentissage exploratoire|erkundendes Lernen
collaborative_learning|협업 학습|协作学习|aprendizaje colaborativo|apprentissage collaboratif|gemeinsames Lernen
breadth_first|넓게 먼저 학습|先广后深|primero amplitud|d'abord la largeur|zuerst Breite
breadth_leaning|폭넓은 학습 선호|倾向广度学习|preferencia por amplitud|préférence pour la largeur|breitenorientiert
depth_leaning|깊이 있는 학습 선호|倾向深入学习|preferencia por profundidad|préférence pour la profondeur|tiefenorientiert
depth_first|깊이부터 학습|先深后广|primero profundidad|d'abord la profondeur|zuerst Tiefe
structured_guidance|체계적인 지도|结构化指导|orientación estructurada|accompagnement structuré|strukturierte Anleitung
outcome_oriented|성과 중심|结果导向|orientado a resultados|orienté résultats|ergebnisorientiert
autonomous_execution|자율적 수행|自主执行|ejecución autónoma|exécution autonome|eigenständige Durchführung
regular_checkpoints|정기적인 점검|定期检查|revisiones periódicas|points réguliers|regelmäßige Überprüfung
collaborative_partnership|협력적 파트너십|合作伙伴关系|colaboración en equipo|partenariat collaboratif|partnerschaftliche Zusammenarbeit
challenge_driven|도전 중심|挑战驱动|impulsado por desafíos|motivé par les défis|herausforderungsorientiert
functional_utility|실용적 가치|实用价值|utilidad funcional|utilité fonctionnelle|praktischer Nutzen
conquering_complexity|복잡한 문제 해결|克服复杂性|superar la complejidad|surmonter la complexité|Komplexität bewältigen
context_dependent|상황에 따라 다름|取决于情境|depende del contexto|selon le contexte|kontextabhängig
unclear|아직 명확하지 않음|尚不明确|aún no está claro|encore incertain|noch unklar
low|낮음|较低|bajo|faible|niedrig
moderate|보통|中等|moderado|modéré|mittel
high|높음|较高|alto|élevé|hoch
balanced|균형형|均衡|equilibrado|équilibré|ausgewogen
affective_discomfort|정서적 불편감|情绪不适|incomodidad emocional|inconfort émotionnel|emotionales Unbehagen
"""
VALUE_LABELS = {}
for _row in _VALUE_ROWS.strip().splitlines():
    _parts = _row.split("|")
    if len(_parts) != 6:
        raise ValueError(f"Invalid signal translation row: {_row}")
    VALUE_LABELS[_parts[0]] = dict(zip(("ko", "zh", "es", "fr", "de"), _parts[1:]))


def term(value: str) -> str:
    if not isinstance(value, str):
        return str(value)
    if get_language() == "en":
        return value.replace("_", " ")
    row = VALUE_LABELS.get(value)
    return row.get(get_language(), value.replace("_", " ")) if row else value.replace("_", " ")


def heard_sentence(index: int, values: list[str]) -> str:
    vals = ", ".join(term(v) for v in values)
    return SUMMARY_TEMPLATES[get_language()][index].format(v=vals)
