/**
 * Korean presentation labels for O*NET career cards.
 * The English source strings and O*NET-SOC codes must stay unchanged in state/API payloads.
 * This map is intentionally display-only: other configured languages retain their existing behavior.
 * Unmapped source descriptions remain intact rather than being replaced with fabricated text.
 */

type KoreanCareer = { title: string; description?: string };

const KOREAN_CAREERS: Record<string, KoreanCareer> = {
  '11-3021.00': { title: '컴퓨터 및 정보시스템 관리자', description: '조직의 정보기술 활동을 계획하고 조정하며 컴퓨터 시스템과 관련 업무를 관리합니다.' },
  '15-1211.00': { title: '컴퓨터 시스템 분석가', description: '조직의 컴퓨터 시스템을 분석하고 업무 요구에 맞는 시스템 개선 방안을 설계합니다.' },
  '15-1212.00': { title: '정보보안 분석가', description: '정보시스템을 보호하기 위한 보안 조치를 계획하고 실행하며 취약점과 위험을 분석합니다.' },
  '15-1221.00': { title: '컴퓨터 및 정보 연구 과학자', description: '컴퓨팅 기술의 새로운 활용 방법을 연구하고 데이터 처리와 문제 해결을 위한 기술을 개발합니다.' },
  '15-1231.00': { title: '컴퓨터 네트워크 지원 전문가', description: '컴퓨터 네트워크의 문제를 진단하고 사용자가 안정적으로 연결할 수 있도록 기술적으로 지원합니다.' },
  '15-1232.00': { title: '컴퓨터 사용자 지원 전문가', description: '컴퓨터 사용자에게 소프트웨어·하드웨어 문제 해결과 기술 지원을 제공합니다.' },
  '15-1241.00': { title: '컴퓨터 네트워크 설계자', description: '통신 네트워크와 데이터 통신 시스템의 구조를 설계하고 운영 요구에 맞게 개선합니다.' },
  '15-1241.01': { title: '통신공학 전문가' },
  '15-1242.00': { title: '데이터베이스 관리자', description: '데이터베이스의 저장·보안·백업·성능을 관리하고 안정적으로 운영합니다.' },
  '15-1243.00': { title: '데이터베이스 아키텍트', description: '조직의 데이터 요구에 맞는 데이터베이스 구조와 데이터 관리 시스템을 설계합니다.' },
  '15-1243.01': { title: '데이터 웨어하우스 전문가', description: '분석에 필요한 데이터를 통합·정리하고 데이터 웨어하우스 시스템을 구축하고 관리합니다.' },
  '15-1244.00': { title: '네트워크 및 컴퓨터 시스템 관리자', description: '네트워크와 서버 등 컴퓨터 시스템을 설치·구성·운영하고 성능과 보안을 관리합니다.' },
  '15-1251.00': { title: '컴퓨터 프로그래머', description: '소프트웨어 개발에 필요한 코드를 작성·수정·테스트하고 프로그램이 정상 동작하도록 개선합니다.' },
  '15-1252.00': { title: '소프트웨어 개발자', description: '컴퓨터 및 네트워크 소프트웨어를 연구·설계·개발하고 기능을 개선합니다.' },
  '15-1253.00': { title: '소프트웨어 품질보증 분석가 및 테스터', description: '소프트웨어의 오류와 품질 문제를 찾기 위해 테스트를 설계하고 실행합니다.' },
  '15-1254.00': { title: '웹 개발자', description: '웹사이트와 웹 애플리케이션의 구조·기능을 개발하고 성능을 개선합니다.' },
  '15-1255.00': { title: '웹 및 디지털 인터페이스 디자이너', description: '디지털 사용자 인터페이스와 웹사이트를 설계합니다. 레이아웃, 기능, 탐색 메뉴를 개발·테스트하여 호환성과 사용성을 높입니다.' },
  '15-1299.00': { title: '기타 컴퓨터 분야 전문가' },
  '15-1299.01': { title: '웹 관리자', description: '웹사이트의 운영 상태와 콘텐츠를 관리하고 정상적인 서비스를 지원합니다.' },
  '15-1299.02': { title: '지리정보시스템(GIS) 기술 전문가' },
  '15-1299.05': { title: '정보보안 엔지니어', description: '정보시스템을 보호할 보안 아키텍처와 기술적 방어 체계를 설계·구현합니다.' },
  '15-1299.06': { title: '디지털 포렌식 분석가', description: '디지털 장치와 기록에서 증거를 수집·보존·분석하여 보안 사고나 사건을 조사합니다.' },
  '15-1299.07': { title: '블록체인 엔지니어', description: '블록체인 기반 시스템의 구조와 소프트웨어를 설계하고 개발합니다.' },
  '15-1299.08': { title: '컴퓨터 시스템 엔지니어 및 아키텍트', description: '컴퓨터 시스템의 기술 구조를 설계하고 하드웨어와 소프트웨어를 통합합니다.' },
  '15-1299.09': { title: '정보기술(IT) 프로젝트 관리자', description: 'IT 프로젝트의 범위·일정·자원을 관리하고 개발 과정을 조정합니다.' },
  '15-2041.00': { title: '통계학자', description: '통계적 방법으로 데이터를 분석하고 연구·의사결정을 지원합니다.' },
  '15-2041.01': { title: '생물통계학자', description: '생명과학 및 의료 데이터를 통계적으로 분석하고 연구 결과를 해석합니다.' },
  '15-2051.00': { title: '데이터 과학자', description: '대규모 데이터를 수집·분석하고 통계 및 머신러닝 기법으로 문제를 해결합니다.' },
  '15-2051.02': { title: '임상 데이터 관리자' },
  '17-2011.00': { title: '항공우주 엔지니어', description: '항공기와 우주선 등 항공우주 시스템을 설계·개발·시험합니다.' },
  '17-2021.00': { title: '농업공학 엔지니어' },
  '17-2031.00': { title: '생명공학 및 의공학 엔지니어', description: '의료·생명과학 분야의 장비와 시스템을 설계·개발합니다.' },
  '17-2041.00': { title: '화학공학 엔지니어', description: '화학제품과 재료를 생산하는 공정과 장비를 설계·개선합니다.' },
  '17-2051.00': { title: '토목 엔지니어', description: '도로·교량·건물 등 사회기반시설을 계획·설계·관리합니다.' },
  '17-2051.01': { title: '교통공학 엔지니어' },
  '17-2051.02': { title: '상하수도 엔지니어' },
  '17-2061.00': { title: '컴퓨터 하드웨어 엔지니어', description: '컴퓨터와 관련 장치의 하드웨어를 연구·설계·개발하고 시험합니다.' },
  '17-2071.00': { title: '전기공학 엔지니어', description: '전기 장비와 시스템을 설계·개발·시험하고 관련 기술 업무를 관리합니다.' },
  '17-2072.00': { title: '전자공학 엔지니어', description: '전자 부품과 장비 및 시스템을 설계·개발·시험합니다.' },
  '17-2081.00': { title: '환경공학 엔지니어', description: '환경 문제를 해결하고 오염을 줄이기 위한 공학 시스템을 설계합니다.' },
  '17-2112.00': { title: '산업공학 엔지니어', description: '생산·물류·업무 시스템의 효율성과 품질을 개선하는 방법을 설계합니다.' },
  '17-2112.01': { title: '인간공학 및 사용성 엔지니어' },
  '17-2112.02': { title: '검증 엔지니어' },
  '17-2112.03': { title: '제조공학 엔지니어' },
  '17-2131.00': { title: '재료공학 엔지니어', description: '제품에 사용되는 재료의 성질을 연구하고 새로운 소재와 공정을 개발합니다.' },
  '17-2141.00': { title: '기계공학 엔지니어', description: '기계와 기계 시스템을 설계·제작·시험하고 성능을 개선합니다.' },
  '17-2141.01': { title: '연료전지 엔지니어' },
  '17-2141.02': { title: '자동차공학 엔지니어', description: '자동차 부품과 시스템을 설계·개발·시험합니다.' },
  '17-2161.00': { title: '원자력공학 엔지니어' },
  '17-2199.03': { title: '에너지공학 엔지니어' },
  '17-2199.05': { title: '메카트로닉스 엔지니어', description: '기계·전자·제어 기술을 통합한 자동화 시스템을 설계·개발합니다.' },
  '17-2199.06': { title: '마이크로시스템 엔지니어' },
  '17-2199.07': { title: '광학·포토닉스 엔지니어' },
  '17-2199.08': { title: '로봇공학 엔지니어', description: '로봇 시스템과 관련 하드웨어·소프트웨어를 설계·개발·시험합니다.' },
  '17-2199.09': { title: '나노시스템 엔지니어' },
  '17-2199.10': { title: '풍력 에너지 엔지니어' },
  '17-2199.11': { title: '태양광 시스템 엔지니어' },
  '17-3024.00': { title: '전기기계·메카트로닉스 기술 전문가', description: '자동화·로봇·전기기계 시스템을 운용하고 시험합니다.' },
  '17-3024.01': { title: '로봇 기술자' },
  '17-3026.00': { title: '산업공학 기술 전문가', description: '생산 및 품질 관리와 관련된 산업공학 기술 업무를 지원합니다.' },
  // Existing pre-profile fallback cards.
  robotics: { title: '로봇공학 엔지니어' },
  aerospace: { title: '항공우주 추진 시스템 엔지니어' },
  sustainable: { title: '지속가능 에너지 분석가' },
  'ai-hardware': { title: 'AI 하드웨어 설계자' },
  biomedical: { title: '의료기기 개발자' },
  infrastructure: { title: '스마트 인프라 설계자' }
};

const titleTranslations: Record<string, string> = {
  'Web and Digital Interface Designers': '웹 및 디지털 인터페이스 디자이너',
  'Software Developers': '소프트웨어 개발자',
  'Data Scientists': '데이터 과학자',
  'Information Security Analysts': '정보보안 분석가',
  'Electrical Engineers': '전기공학 엔지니어',
  'Computer and Information Research Scientists': '컴퓨터 및 정보 연구 과학자',
  'Electro-Mechanical and Mechatronics Technologists and Technicians': '전기기계·메카트로닉스 기술 전문가'
};

export function localizeCareerTitle(id: string, title: string, language: string): string {
  if (language !== 'ko') return title;
  // One legacy sample card has an O*NET code that does not match its title. Prefer its real title.
  if (id === '17-3026.00' && title === 'Electro-Mechanical and Mechatronics Technologists and Technicians') {
    return '전기기계·메카트로닉스 기술 전문가';
  }
  return KOREAN_CAREERS[id]?.title || titleTranslations[title] || title;
}

export function localizeCareerDescription(id: string, description: string, language: string): string {
  if (language !== 'ko') return description;
  if (id === '17-3026.00' && description === 'Operate and test unmanned, automated, robotic, or electromechanical systems.') {
    return '무인·자동화·로봇·전기기계 시스템을 운용하고 시험합니다.';
  }
  return KOREAN_CAREERS[id]?.description || description;
}

export function localizeCareerCategory(category: string, language: string): string {
  if (language !== 'ko') return category;
  const matches: Record<string, string> = {
    High: '매우 높은 적합도',
    Good: '높은 적합도',
    Moderate: '보통 적합도',
    Low: '낮은 적합도'
  };
  const alignment = category.match(/^\s*(High|Good|Moderate|Low) Match Direction\s*$/i);
  if (alignment) {
    const normalized = alignment[1].charAt(0).toUpperCase() + alignment[1].slice(1).toLowerCase();
    return matches[normalized] || category;
  }
  return category === 'Engineering Direction' ? '공학 분야 추천 진로' : category;
}

export function localizeCareerReason(reason: string, language: string): string {
  if (language !== 'ko') return reason;
  const major = reason.match(/^Aligned with your (.+) academic background\.$/i);
  if (major) return `${major[1]} 전공 배경과 연관된 직무예요.`;
  const skills = reason.match(/^Your profile includes skills relevant to (.+): (.+)\.$/i);
  if (skills) return `보유한 기술(${skills[2]})이 이 직무의 요구 역량과 관련돼요.`;
  const experiences = reason.match(/^You have (\d+) experience\(s\) to draw evidence from\.$/i);
  if (experiences) return `제출한 경험 ${experiences[1]}건을 추천 근거로 참고했어요.`;
  if (reason === 'We do not have much direct evidence yet — this is an initial estimate.') {
    return '직접 확인된 근거가 아직 부족해 초기 추정 결과로 제공돼요.';
  }
  if (reason === 'Matches engineering background and foundational competencies.') {
    return '공학 전공 배경과 기초 역량을 바탕으로 추천했어요.';
  }
  if (reason === 'Personalized engineering career direction') return '나의 프로필에 맞춘 공학 분야 추천 진로';
  return reason;
}

export function localizeCareerSalary(metric: string, language: string): string {
  if (language !== 'ko') return metric;
  // UI has a fixed example value per media category; preserve the number and dollar unit.
  return metric.replace(/^\s*\$([\d,]+)\s*\/\s*yr\s*$/i, (_all, amount: string) => `연 $${amount}`);
}

// Exact English O*NET source text → Korean display text. Keeps later screens localized too.
const KNOWN_TITLE_TRANSLATIONS: Record<string, string> = {
  "Computer and Information Systems Managers": "컴퓨터 및 정보시스템 관리자",
  "Computer Systems Analysts": "컴퓨터 시스템 분석가",
  "Information Security Analysts": "정보보안 분석가",
  "Computer and Information Research Scientists": "컴퓨터 및 정보 연구 과학자",
  "Computer Network Support Specialists": "컴퓨터 네트워크 지원 전문가",
  "Computer User Support Specialists": "컴퓨터 사용자 지원 전문가",
  "Computer Network Architects": "컴퓨터 네트워크 설계자",
  "Telecommunications Engineering Specialists": "통신공학 전문가",
  "Database Administrators": "데이터베이스 관리자",
  "Database Architects": "데이터베이스 아키텍트",
  "Data Warehousing Specialists": "데이터 웨어하우스 전문가",
  "Network and Computer Systems Administrators": "네트워크 및 컴퓨터 시스템 관리자",
  "Computer Programmers": "컴퓨터 프로그래머",
  "Software Developers": "소프트웨어 개발자",
  "Software Quality Assurance Analysts and Testers": "소프트웨어 품질보증 분석가 및 테스터",
  "Web Developers": "웹 개발자",
  "Web and Digital Interface Designers": "웹 및 디지털 인터페이스 디자이너",
  "Computer Occupations, All Other": "기타 컴퓨터 분야 전문가",
  "Web Administrators": "웹 관리자",
  "Geographic Information Systems Technologists and Technicians": "지리정보시스템(GIS) 기술 전문가",
  "Information Security Engineers": "정보보안 엔지니어",
  "Digital Forensics Analysts": "디지털 포렌식 분석가",
  "Blockchain Engineers": "블록체인 엔지니어",
  "Computer Systems Engineers/Architects": "컴퓨터 시스템 엔지니어 및 아키텍트",
  "Information Technology Project Managers": "정보기술(IT) 프로젝트 관리자",
  "Statisticians": "통계학자",
  "Biostatisticians": "생물통계학자",
  "Data Scientists": "데이터 과학자",
  "Clinical Data Managers": "임상 데이터 관리자",
  "Aerospace Engineers": "항공우주 엔지니어",
  "Agricultural Engineers": "농업공학 엔지니어",
  "Bioengineers and Biomedical Engineers": "생명공학 및 의공학 엔지니어",
  "Chemical Engineers": "화학공학 엔지니어",
  "Civil Engineers": "토목 엔지니어",
  "Transportation Engineers": "교통공학 엔지니어",
  "Water/Wastewater Engineers": "상하수도 엔지니어",
  "Computer Hardware Engineers": "컴퓨터 하드웨어 엔지니어",
  "Electrical Engineers": "전기공학 엔지니어",
  "Electronics Engineers, Except Computer": "전자공학 엔지니어",
  "Environmental Engineers": "환경공학 엔지니어",
  "Industrial Engineers": "산업공학 엔지니어",
  "Human Factors Engineers and Ergonomists": "인간공학 및 사용성 엔지니어",
  "Validation Engineers": "검증 엔지니어",
  "Manufacturing Engineers": "제조공학 엔지니어",
  "Materials Engineers": "재료공학 엔지니어",
  "Mechanical Engineers": "기계공학 엔지니어",
  "Fuel Cell Engineers": "연료전지 엔지니어",
  "Automotive Engineers": "자동차공학 엔지니어",
  "Nuclear Engineers": "원자력공학 엔지니어",
  "Energy Engineers, Except Wind and Solar": "에너지공학 엔지니어",
  "Mechatronics Engineers": "메카트로닉스 엔지니어",
  "Microsystems Engineers": "마이크로시스템 엔지니어",
  "Photonics Engineers": "광학·포토닉스 엔지니어",
  "Robotics Engineers": "로봇공학 엔지니어",
  "Nanosystems Engineers": "나노시스템 엔지니어",
  "Wind Energy Engineers": "풍력 에너지 엔지니어",
  "Solar Energy Systems Engineers": "태양광 시스템 엔지니어",
  "Electro-Mechanical and Mechatronics Technologists and Technicians": "전기기계·메카트로닉스 기술 전문가",
  "Robotics Technicians": "로봇 기술자",
  "Industrial Engineering Technologists and Technicians": "산업공학 기술 전문가"
};
const KNOWN_DESCRIPTION_TRANSLATIONS: Record<string, string> = {
  "Plan, direct, or coordinate activities in such fields as electronic data processing, information systems, systems analysis, and computer programming.": "조직의 정보기술 활동을 계획하고 조정하며 컴퓨터 시스템과 관련 업무를 관리합니다.",
  "Analyze science, engineering, business, and other data processing problems to develop and implement solutions to complex applications problems, system administration issues, or network concerns. Perform systems management and integration functions, improve existing computer systems, and review computer system capabilities, workflow, and schedule limitations. May analyze or recommend commercially available software.": "조직의 컴퓨터 시스템을 분석하고 업무 요구에 맞는 시스템 개선 방안을 설계합니다.",
  "Plan, implement, upgrade, or monitor security measures for the protection of computer networks and information. Assess system vulnerabilities for security risks and propose and implement risk mitigation strategies. May ensure appropriate security controls are in place that will safeguard digital files and vital electronic infrastructure. May respond to computer security breaches and viruses.": "정보시스템을 보호하기 위한 보안 조치를 계획하고 실행하며 취약점과 위험을 분석합니다.",
  "Conduct research into fundamental computer and information science as theorists, designers, or inventors. Develop solutions to problems in the field of computer hardware and software.": "컴퓨팅 기술의 새로운 활용 방법을 연구하고 데이터 처리와 문제 해결을 위한 기술을 개발합니다.",
  "Analyze, test, troubleshoot, and evaluate existing network systems, such as local area networks (LAN), wide area networks (WAN), cloud networks, servers, and other data communications networks. Perform network maintenance to ensure networks operate correctly with minimal interruption.": "컴퓨터 네트워크의 문제를 진단하고 사용자가 안정적으로 연결할 수 있도록 기술적으로 지원합니다.",
  "Provide technical assistance to computer users. Answer questions or resolve computer problems for clients in person, via telephone, or electronically. May provide assistance concerning the use of computer hardware and software, including printing, installation, word processing, electronic mail, and operating systems.": "컴퓨터 사용자에게 소프트웨어·하드웨어 문제 해결과 기술 지원을 제공합니다.",
  "Design and implement computer and information networks, such as local area networks (LAN), wide area networks (WAN), intranets, extranets, and other data communications networks. Perform network modeling, analysis, and planning, including analysis of capacity needs for network infrastructures. May also design network and computer security measures. May research and recommend network and data communications hardware and software.": "통신 네트워크와 데이터 통신 시스템의 구조를 설계하고 운영 요구에 맞게 개선합니다.",
  "Administer, test, and implement computer databases, applying knowledge of database management systems. Coordinate changes to computer databases. Identify, investigate, and resolve database performance issues, database capacity, and database scalability. May plan, coordinate, and implement security measures to safeguard computer databases.": "데이터베이스의 저장·보안·백업·성능을 관리하고 안정적으로 운영합니다.",
  "Design strategies for enterprise databases, data warehouse systems, and multidimensional networks. Set standards for database operations, programming, query processes, and security. Model, design, and construct large relational databases or data warehouses. Create and optimize data models for warehouse infrastructure and workflow. Integrate new systems with existing warehouse structure and refine system performance and functionality.": "조직의 데이터 요구에 맞는 데이터베이스 구조와 데이터 관리 시스템을 설계합니다.",
  "Design, model, or implement corporate data warehousing activities. Program and configure warehouses of database information and provide support to warehouse users.": "분석에 필요한 데이터를 통합·정리하고 데이터 웨어하우스 시스템을 구축하고 관리합니다.",
  "Install, configure, and maintain an organization's local area network (LAN), wide area network (WAN), data communications network, operating systems, and physical and virtual servers. Perform system monitoring and verify the integrity and availability of hardware, network, and server resources and systems. Review system and application logs and verify completion of scheduled jobs, including system backups. Analyze network and server resource consumption and control user access. Install and upgrade software and maintain software licenses. May assist in network modeling, analysis, planning, and coordination between network and data communications hardware and software.": "네트워크와 서버 등 컴퓨터 시스템을 설치·구성·운영하고 성능과 보안을 관리합니다.",
  "Create, modify, and test the code and scripts that allow computer applications to run. Work from specifications drawn up by software and web developers or other individuals. May develop and write computer programs to store, locate, and retrieve specific documents, data, and information.": "소프트웨어 개발에 필요한 코드를 작성·수정·테스트하고 프로그램이 정상 동작하도록 개선합니다.",
  "Research, design, and develop computer and network software or specialized utility programs. Analyze user needs and develop software solutions, applying principles and techniques of computer science, engineering, and mathematical analysis. Update software or enhance existing software capabilities. May work with computer hardware engineers to integrate hardware and software systems, and develop specifications and performance requirements. May maintain databases within an application area, working individually or coordinating database development as part of a team.": "컴퓨터 및 네트워크 소프트웨어를 연구·설계·개발하고 기능을 개선합니다.",
  "Develop and execute software tests to identify software problems and their causes. Test system modifications to prepare for implementation. Document software and application defects using a bug tracking system and report defects to software or web developers. Create and maintain databases of known defects. May participate in software design reviews to provide input on functional requirements, operational characteristics, product designs, and schedules.": "소프트웨어의 오류와 품질 문제를 찾기 위해 테스트를 설계하고 실행합니다.",
  "Develop and implement websites, web applications, application databases, and interactive web interfaces. Evaluate code to ensure that it is properly structured, meets industry standards, and is compatible with browsers and devices. Optimize website performance, scalability, and server-side code and processes. May develop website infrastructure and integrate websites with other computer applications.": "웹사이트와 웹 애플리케이션의 구조·기능을 개발하고 성능을 개선합니다.",
  "Design digital user interfaces or websites. Develop and test layouts, interfaces, functionality, and navigation menus to ensure compatibility and usability across browsers or devices. May use web framework applications as well as client-side code and processes. May evaluate web design following web and accessibility standards, and may analyze web use metrics and optimize websites for marketability and search engine ranking. May design and test interfaces that facilitate the human-computer interaction and maximize the usability of digital devices, websites, and software with a focus on aesthetics and design. May create graphics used in websites and manage website content and links.": "디지털 사용자 인터페이스와 웹사이트를 설계합니다. 레이아웃, 기능, 탐색 메뉴를 개발·테스트하여 호환성과 사용성을 높입니다.",
  "Manage web environment design, deployment, development and maintenance activities. Perform testing and quality assurance of web sites and web applications.": "웹사이트의 운영 상태와 콘텐츠를 관리하고 정상적인 서비스를 지원합니다.",
  "Develop and oversee the implementation of information security procedures and policies. Build, maintain and upgrade security technology, such as firewalls, for the safe use of computer networks and the transmission and retrieval of information. Design and implement appropriate security controls to identify vulnerabilities and protect digital files and electronic infrastructures. Monitor and respond to computer security breaches, viruses, and intrusions, and perform forensic investigation. May oversee the assessment of information security systems.": "정보시스템을 보호할 보안 아키텍처와 기술적 방어 체계를 설계·구현합니다.",
  "Conduct investigations on computer-based crimes establishing documentary or physical evidence, such as digital media and logs associated with cyber intrusion incidents. Analyze digital evidence and investigate computer security incidents to derive information in support of system and network vulnerability mitigation. Preserve and present computer-related evidence in support of criminal, fraud, counterintelligence, or law enforcement investigations.": "디지털 장치와 기록에서 증거를 수집·보존·분석하여 보안 사고나 사건을 조사합니다.",
  "Maintain and support distributed and decentralized blockchain-based networks or block-chain applications such as cryptocurrency exchange, payment processing, document sharing, and digital voting. Design and deploy secure block-chain design patterns and solutions over geographically distributed networks using advanced technologies. May assist with infrastructure setup and testing for application transparency and security.": "블록체인 기반 시스템의 구조와 소프트웨어를 설계하고 개발합니다.",
  "Design and develop solutions to complex applications problems, system administration issues, or network concerns. Perform systems management and integration functions.": "컴퓨터 시스템의 기술 구조를 설계하고 하드웨어와 소프트웨어를 통합합니다.",
  "Plan, initiate, and manage information technology (IT) projects. Lead and guide the work of technical staff. Serve as liaison between business and technical aspects of projects. Plan project stages and assess business implications for each stage. Monitor progress to assure deadlines, standards, and cost targets are met.": "IT 프로젝트의 범위·일정·자원을 관리하고 개발 과정을 조정합니다.",
  "Develop or apply mathematical or statistical theory and methods to collect, organize, interpret, and summarize numerical data to provide usable information. May specialize in fields such as biostatistics, agricultural statistics, business statistics, or economic statistics. Includes mathematical and survey statisticians.": "통계적 방법으로 데이터를 분석하고 연구·의사결정을 지원합니다.",
  "Develop and apply biostatistical theory and methods to the study of life sciences.": "생명과학 및 의료 데이터를 통계적으로 분석하고 연구 결과를 해석합니다.",
  "Develop and implement a set of techniques or analytics applications to transform raw data into meaningful information using data-oriented programming languages and visualization software. Apply data mining, data modeling, natural language processing, and machine learning to extract and analyze information from large structured and unstructured datasets. Visualize, interpret, and report data findings. May create dynamic data reports.": "대규모 데이터를 수집·분석하고 통계 및 머신러닝 기법으로 문제를 해결합니다.",
  "Perform engineering duties in designing, constructing, and testing aircraft, missiles, and spacecraft. May conduct basic and applied research to evaluate adaptability of materials and equipment to aircraft design and manufacture. May recommend improvements in testing equipment and techniques.": "항공기와 우주선 등 항공우주 시스템을 설계·개발·시험합니다.",
  "Apply knowledge of engineering, biology, chemistry, computer science, and biomechanical principles to the design, development, and evaluation of biological, agricultural, and health systems and products, such as artificial organs, prostheses, instrumentation, medical information systems, and health management and care delivery systems.": "의료·생명과학 분야의 장비와 시스템을 설계·개발합니다.",
  "Design chemical plant equipment and devise processes for manufacturing chemicals and products, such as gasoline, synthetic rubber, plastics, detergents, cement, paper, and pulp, by applying principles and technology of chemistry, physics, and engineering.": "화학제품과 재료를 생산하는 공정과 장비를 설계·개선합니다.",
  "Perform engineering duties in planning, designing, and overseeing construction and maintenance of building structures and facilities, such as roads, railroads, airports, bridges, harbors, channels, dams, irrigation projects, pipelines, power plants, and water and sewage systems.": "도로·교량·건물 등 사회기반시설을 계획·설계·관리합니다.",
  "Research, design, develop, or test computer or computer-related equipment for commercial, industrial, military, or scientific use. May supervise the manufacturing and installation of computer or computer-related equipment and components.": "컴퓨터와 관련 장치의 하드웨어를 연구·설계·개발하고 시험합니다.",
  "Research, design, develop, test, or supervise the manufacturing and installation of electrical equipment, components, or systems for commercial, industrial, military, or scientific use.": "전기 장비와 시스템을 설계·개발·시험하고 관련 기술 업무를 관리합니다.",
  "Research, design, develop, or test electronic components and systems for commercial, industrial, military, or scientific use employing knowledge of electronic theory and materials properties. Design electronic circuits and components for use in fields such as telecommunications, aerospace guidance and propulsion control, acoustics, or instruments and controls.": "전자 부품과 장비 및 시스템을 설계·개발·시험합니다.",
  "Research, design, plan, or perform engineering duties in the prevention, control, and remediation of environmental hazards using various engineering disciplines. Work may include waste treatment, site remediation, or pollution control technology.": "환경 문제를 해결하고 오염을 줄이기 위한 공학 시스템을 설계합니다.",
  "Design, develop, test, and evaluate integrated systems for managing industrial production processes, including human work factors, quality control, inventory control, logistics and material flow, cost analysis, and production coordination.": "생산·물류·업무 시스템의 효율성과 품질을 개선하는 방법을 설계합니다.",
  "Evaluate materials and develop machinery and processes to manufacture materials for use in products that must meet specialized design and performance specifications. Develop new uses for known materials. Includes those engineers working with composite materials or specializing in one type of material, such as graphite, metal and metal alloys, ceramics and glass, plastics and polymers, and naturally occurring materials. Includes metallurgists and metallurgical engineers, ceramic engineers, and welding engineers.": "제품에 사용되는 재료의 성질을 연구하고 새로운 소재와 공정을 개발합니다.",
  "Perform engineering duties in planning and designing tools, engines, machines, and other mechanically functioning equipment. Oversee installation, operation, maintenance, and repair of equipment such as centralized heat, gas, water, and steam systems.": "기계와 기계 시스템을 설계·제작·시험하고 성능을 개선합니다.",
  "Develop new or improved designs for vehicle structural members, engines, transmissions, or other vehicle systems, using computer-assisted design technology. Direct building, modification, or testing of vehicle or components.": "자동차 부품과 시스템을 설계·개발·시험합니다.",
  "Research, design, develop, or test automation, intelligent systems, smart devices, or industrial systems control.": "기계·전자·제어 기술을 통합한 자동화 시스템을 설계·개발합니다.",
  "Research, design, develop, or test robotic applications.": "로봇 시스템과 관련 하드웨어·소프트웨어를 설계·개발·시험합니다.",
  "Operate, test, maintain, or adjust unmanned, automated, servomechanical, or electromechanical equipment. May operate unmanned submarines, aircraft, or other equipment to observe or record visual information at sites such as oil rigs, crop fields, buildings, or for similar infrastructure, deep ocean exploration, or hazardous waste removal. May assist engineers in testing and designing robotics equipment.": "자동화·로봇·전기기계 시스템을 운용하고 시험합니다.",
  "Apply engineering theory and principles to problems of industrial layout or manufacturing production, usually under the direction of engineering staff. May perform time and motion studies on worker operations in a variety of industries for purposes such as establishing standard production rates or improving efficiency.": "생산 및 품질 관리와 관련된 산업공학 기술 업무를 지원합니다."
};
export function localizeKnownCareerText(text: string, language: string): string {
  if (language !== 'ko') return text;
  return KNOWN_TITLE_TRANSLATIONS[text] || KNOWN_DESCRIPTION_TRANSLATIONS[text] || text;
}
