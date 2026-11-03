// Presentation-only localization: IDs and answers always stay in the original backend protocol.
import type { DynamicQuestion } from '../types';
const questions: Record<string,{ en: string; ko: string }> = {
  "Q01": {
    "en": "Which areas are you currently most curious about?",
    "ko": "지금 가장 궁금하거나 관심이 가는 분야는 무엇인가요?"
  },
  "Q02": {
    "en": "When you're working on a project, which parts do you usually enjoy most?",
    "ko": "프로젝트를 진행할 때 어떤 과정이 가장 즐겁나요?"
  },
  "Q03": {
    "en": "Think about a project, module, or activity you genuinely enjoyed. What part made it enjoyable?",
    "ko": "정말 재미있게 참여했던 프로젝트나 활동을 떠올려 보세요. 어떤 점이 좋았나요?"
  },
  "Q04": {
    "en": "If you could choose your next project, which would sound most interesting to you?",
    "ko": "다음 프로젝트를 직접 선택한다면 어떤 주제가 가장 흥미로울까요?"
  },
  "Q05": {
    "en": "At the end of a project, which outcome would feel most satisfying to you?",
    "ko": "프로젝트를 마쳤을 때 어떤 결과가 가장 뿌듯할까요?"
  },
  "Q06": {
    "en": "Which currently feels most like a strength for you?",
    "ko": "현재 자신의 강점이라고 생각하는 것은 무엇인가요?"
  },
  "Q07": {
    "en": "Which area would you most like to feel more confident in?",
    "ko": "어떤 영역에서 자신감을 더 키우고 싶나요?"
  },
  "Q08": {
    "en": "When you're given a task you haven't done before, how do you usually feel at the beginning?",
    "ko": "처음 해 보는 과제를 받으면 처음에 어떤 기분이 드나요?"
  },
  "Q09": {
    "en": "What makes you feel that this is one of your strengths?",
    "ko": "그것이 자신의 강점이라고 생각하는 이유는 무엇인가요?"
  },
  "Q10": {
    "en": "What makes you feel this is something you need to improve?",
    "ko": "그 부분을 개선해야 한다고 생각하는 이유는 무엇인가요?"
  },
  "Q11": {
    "en": "When you reflect on engineering domains where you feel confident, what has contributed most to building that confidence?",
    "ko": "자신 있는 공학 분야를 떠올려 보세요. 그 자신감을 쌓는 데 가장 도움이 된 것은 무엇인가요?"
  },
  "Q12": {
    "en": "When you have hands-on experience in an engineering domain but still don't feel fully confident, which of these feels closest to why?",
    "ko": "직접 경험해 본 공학 분야인데도 아직 자신감이 부족하다면, 그 이유는 무엇인가요?"
  },
  "Q13": {
    "en": "You're given a problem you haven't seen before. What are you most likely to do first?",
    "ko": "처음 보는 문제를 받으면 무엇부터 할 것 같나요?"
  },
  "Q14": {
    "en": "Something you built isn't working as expected. What are you most likely to do first?",
    "ko": "만든 것이 예상대로 동작하지 않으면 가장 먼저 무엇을 하나요?"
  },
  "Q15": {
    "en": "Think about the last time something in a project went wrong. How did you eventually figure it out?",
    "ko": "최근 프로젝트에서 문제가 발생했던 경험을 떠올려 보세요. 결국 어떻게 원인을 찾았나요?"
  },
  "Q16": {
    "en": "You're given a problem with a lot of information, but you're not sure which parts actually matter. What are you most likely to do first?",
    "ko": "정보는 많지만 어떤 내용이 중요한지 알 수 없는 문제를 받는다면 무엇부터 할 건가요?"
  },
  "Q17": {
    "en": "You have limited time and several reasonable ways to approach a problem. What would most influence which one you try first?",
    "ko": "시간이 부족하고 여러 해결 방법이 가능하다면 무엇을 기준으로 먼저 시도할 방법을 고르나요?"
  },
  "Q18": {
    "en": "When you think about the troubleshooting you've done, which kind of situation have you handled most often?",
    "ko": "지금까지 어떤 유형의 문제 해결 상황을 가장 자주 경험했나요?"
  },
  "Q19": {
    "en": "You've successfully worked through several difficult problems. Does the difficulty come more from finding the answer, or from feeling unsure while you're finding it?",
    "ko": "여러 어려운 문제를 해결해 본 경험이 있군요. 더 어려운 것은 답을 찾는 과정인가요, 답을 찾는 동안 느끼는 불확실함인가요?"
  },
  "Q20": {
    "en": "When a project requires something you haven't learned before, what do you usually try first?",
    "ko": "프로젝트에 아직 배우지 않은 기술이 필요하다면 무엇부터 시도하나요?"
  },
  "Q21": {
    "en": "If your first approach clearly isn't working, what are you most likely to do?",
    "ko": "처음 시도한 방법이 잘 안 된다면 주로 어떻게 하나요?"
  },
  "Q22": {
    "en": "Think about the last useful thing you taught yourself because you needed it. What kind of thing was it?",
    "ko": "필요해서 스스로 배운 가장 최근의 유용한 기술이나 지식은 무엇이었나요?"
  },
  "Q23": {
    "en": "You're trying to learn something new, but the resource you're using isn't making sense. What do you usually try next?",
    "ko": "새로운 내용을 배우는 중인데 학습 자료가 이해되지 않는다면 어떻게 하나요?"
  },
  "Q24": {
    "en": "Think of a time feedback changed how you approached something. What happened next?",
    "ko": "피드백을 받아 작업 방식을 바꿨던 경험을 떠올려 보세요. 이후 어떻게 했나요?"
  },
  "Q25": {
    "en": "Which signs make you feel that you understand something well enough to move on?",
    "ko": "어떤 상태가 되면 내용을 충분히 이해했다고 느끼고 다음으로 넘어가나요?"
  },
  "Q26": {
    "en": "Sometimes we stay with an approach even when progress is slow. When that happens for you, what is usually the main reason?",
    "ko": "진척이 느린데도 같은 접근 방식을 고수하는 경우가 있어요. 그럴 때 주된 이유는 무엇인가요?"
  },
  "Q27": {
    "en": "For the project or piece of work you're most proud of, how much guidance did you need?",
    "ko": "가장 자랑스러운 프로젝트나 작업을 진행할 때 어느 정도의 도움이 필요했나요?"
  },
  "Q28": {
    "en": "Think about the last time you noticed something important that wasn't clearly assigned to anyone. What did you do?",
    "ko": "담당자가 명확하지 않지만 중요한 일을 발견했던 최근 경험을 떠올려 보세요. 어떻게 행동했나요?"
  },
  "Q29": {
    "en": "In your most recent team project, where did you contribute most?",
    "ko": "최근 팀 프로젝트에서 가장 많이 기여한 부분은 무엇이었나요?"
  },
  "Q30": {
    "en": "You've completed the main requirements of your task and still have some time left. What are you most likely to do?",
    "ko": "맡은 과제의 필수 조건을 모두 완료하고 시간이 남았다면 무엇을 할 것 같나요?"
  },
  "Q31": {
    "en": "When instructions are incomplete, what most influences whether you decide what to do next yourself or ask for clarification?",
    "ko": "지시가 불명확할 때 혼자 다음 행동을 정할지, 추가 설명을 요청할지는 무엇에 따라 결정하나요?"
  },
  "Q32": {
    "en": "A decision about your part of a project could affect someone else's work. What would most influence whether you decide independently or discuss it first?",
    "ko": "내 결정이 다른 팀원의 작업에 영향을 줄 때 혼자 결정할지 논의할지 판단하는 기준은 무엇인가요?"
  },
  "Q33": {
    "en": "You mentioned that taking the lead doesn't feel like a strength for you, but you've also described situations where you took responsibility for getting things done. How do those two ideas feel to you?",
    "ko": "주도하는 것이 강점은 아니라고 했지만, 직접 책임지고 일을 끝낸 경험도 이야기했어요. 이 두 가지를 어떻게 생각하나요?"
  },
  "Q34": {
    "en": "When someone doesn't understand an idea you're explaining, what are you most likely to try next?",
    "ko": "상대방이 내 설명을 이해하지 못한다면 다음에는 어떤 방법을 시도하나요?"
  },
  "Q35": {
    "en": "In group projects, where do you usually contribute most naturally?",
    "ko": "팀 프로젝트에서 가장 자연스럽게 기여하는 역할은 무엇인가요?"
  },
  "Q36": {
    "en": "When you give teammates an update on your work, what do you naturally focus on most?",
    "ko": "팀원에게 진행 상황을 공유할 때 주로 어떤 내용을 강조하나요?"
  },
  "Q37": {
    "en": "Several people in your team have different ideas about how to proceed. What role do you naturally tend to take in the discussion?",
    "ko": "팀원들의 의견이 서로 다를 때 토론에서 어떤 역할을 맡는 편인가요?"
  },
  "Q38": {
    "en": "Which communication situation feels easiest for you?",
    "ko": "어떤 의사소통 상황이 가장 편한가요?"
  },
  "Q39": {
    "en": "When you say communication is difficult for you, which part are you mostly thinking about?",
    "ko": "의사소통이 어렵다고 느낄 때, 특히 어떤 부분이 어려운가요?"
  },
  "Q40": {
    "en": "You seem to prefer working independently. When teamwork goes well for you, what usually makes it work?",
    "ko": "혼자 일하는 것을 선호하는 것 같네요. 그래도 팀워크가 잘 이루어질 때는 어떤 조건이 있나요?"
  },
  "Q41": {
    "en": "It's two days before a deadline and you realise the original plan probably won't be completed in full. What are you most likely to do first?",
    "ko": "마감 이틀 전, 원래 계획을 전부 끝내기 어렵다는 사실을 알았다면 무엇부터 할 건가요?"
  },
  "Q42": {
    "en": "When you realise you're significantly behind your original plan, what do you usually do first?",
    "ko": "계획보다 상당히 뒤처졌다고 느낄 때 가장 먼저 무엇을 하나요?"
  },
  "Q43": {
    "en": "When you start a task that will take several weeks, what kind of plan do you usually make?",
    "ko": "몇 주 동안 진행해야 할 과제를 시작할 때 보통 어떤 계획을 세우나요?"
  },
  "Q44": {
    "en": "Think about a project where time became tight. Did you change the scope or priorities?",
    "ko": "시간이 부족했던 프로젝트를 떠올려 보세요. 범위나 우선순위를 바꾼 적이 있나요?"
  },
  "Q45": {
    "en": "When something you've worked hard on doesn't succeed, what are you usually most interested in doing afterwards?",
    "ko": "열심히 한 일이 실패했다면 그다음에 가장 하고 싶은 일은 무엇인가요?"
  },
  "Q46": {
    "en": "When a result doesn't go the way you expected, what usually helps you decide what to change next?",
    "ko": "결과가 예상과 다르게 나왔을 때 다음에 무엇을 바꿀지 판단하는 데 가장 도움이 되는 것은 무엇인가요?"
  },
  "Q47": {
    "en": "When learning something new, which feels closer to you?\n\nA: I want to understand how it works before I start using it.\n\nB: I prefer trying it first and understanding more as I go.",
    "ko": "새로운 것을 배울 때 어느 쪽에 더 가깝나요? 먼저 작동 원리를 이해한 뒤 활용하고 싶나요, 일단 해 보면서 배우는 편인가요?"
  },
  "Q48": {
    "en": "If you had six weeks to learn a new skill, which would you naturally choose?",
    "ko": "새로운 기술을 배울 시간이 6주 있다면 어떤 학습 방법을 선택할 것 같나요?"
  },
  "Q49": {
    "en": "When you have limited time to learn a broad topic, which approach feels more natural to you?\n\nA: Get a basic understanding of many parts first.\n\nB: Understand one important part deeply before expanding.",
    "ko": "넓은 주제를 짧은 시간에 배워야 한다면 어느 쪽에 가깝나요? 여러 부분을 먼저 훑어보나요, 중요한 한 부분을 깊게 이해하나요?"
  },
  "Q50": {
    "en": "If I suggested something for you to work on next, what would make you most likely to actually follow through with it?",
    "ko": "다음에 할 일을 추천받는다면 어떤 조건일 때 실제로 실천할 가능성이 가장 높을까요?"
  }
};
const optionLabels: Record<string,string> = {
  "Software and computing": "소프트웨어 및 컴퓨팅",
  "AI and data": "AI 및 데이터",
  "Robotics and automation": "로봇공학 및 자동화",
  "Electronics and embedded systems": "전자공학 및 임베디드 시스템",
  "Mechanical design and engineering": "기계 설계 및 공학",
  "Manufacturing and production": "제조 및 생산",
  "Energy and sustainability": "에너지 및 지속가능성",
  "Infrastructure and cities": "인프라 및 도시",
  "Materials and chemical engineering": "재료 및 화학공학",
  "Science and research": "과학 및 연구",
  "Business and product development": "비즈니스 및 제품 개발",
  "Something else": "기타",
  "I'm still exploring": "아직 탐색 중이에요",
  "Understanding the problem": "문제 이해하기",
  "Coming up with ideas": "아이디어 떠올리기",
  "Building or implementing something": "직접 만들고 구현하기",
  "Analysing information": "정보 분석하기",
  "Testing and improving": "테스트하고 개선하기",
  "Fixing things that aren't working": "작동하지 않는 부분 수정하기",
  "Organising the team": "팀 운영 및 조율하기",
  "Explaining or presenting the result": "결과 설명 및 발표하기",
  "Learning something new along the way": "과정에서 새로운 것을 배우기",
  "The topic itself interested me": "주제 자체가 흥미로웠어요",
  "I enjoyed solving the problem": "문제를 해결하는 과정이 좋았어요",
  "I liked creating something tangible": "실제로 결과물을 만드는 게 좋았어요",
  "I enjoyed working with the people involved": "함께 일하는 사람들이 좋았어요",
  "I liked learning something difficult": "어려운 것을 배우는 게 즐거웠어요",
  "I enjoyed seeing a clear result": "명확한 결과를 보는 것이 좋았어요",
  "Building a useful product or application": "유용한 제품이나 앱 만들기",
  "Investigating why something happens": "어떤 현상이 발생하는 원인 연구하기",
  "Improving an existing system": "기존 시스템 개선하기",
  "Designing something from scratch": "처음부터 새로 설계하기",
  "Analysing data to find patterns": "데이터에서 패턴 찾기",
  "Solving a practical real-world problem": "현실의 문제 해결하기",
  "Exploring a new technology or idea": "새로운 기술이나 아이디어 탐색하기",
  "I'm not sure yet": "아직 잘 모르겠어요",
  "Something useful actually works": "유용한 결과물이 실제로 동작하는 것",
  "I understand the topic much better": "주제를 더 깊게 이해한 것",
  "We solved a difficult problem": "어려운 문제를 해결한 것",
  "The final result is well designed and polished": "완성도 높은 결과물을 만든 것",
  "The team worked well together": "팀이 원활하게 협력한 것",
  "I can clearly explain what we learned": "배운 내용을 명확하게 설명할 수 있는 것",
  "The project opens up something new to explore": "새롭게 탐구할 주제가 생긴 것",
  "It depends on the project": "프로젝트에 따라 달라요",
  "Solving unfamiliar problems": "새로운 문제 해결하기",
  "Learning new things quickly": "새로운 것을 빠르게 배우기",
  "Getting things done": "맡은 일 끝내기",
  "Working with others": "다른 사람과 협력하기",
  "Explaining ideas": "아이디어 설명하기",
  "Organising my work": "내 작업 정리하기",
  "Technical/domain knowledge": "전공 및 기술 지식",
  "Very unsure where to start": "어디서 시작해야 할지 전혀 모르겠어요",
  "Slightly unsure, but I can usually work it out": "조금 막막하지만 대체로 해결할 수 있어요",
  "Fairly confident": "꽤 자신 있어요",
  "Very confident": "매우 자신 있어요",
  "It depends heavily on the situation": "상황에 따라 많이 달라요",
  "I've done it successfully many times": "여러 번 성공적으로 해 본 적이 있어요",
  "I usually perform well academically in it": "관련 수업에서 좋은 성과를 내는 편이에요",
  "Other people often rely on me for it": "다른 사람들이 이 부분을 자주 저에게 맡겨요",
  "Teachers or mentors have told me I'm good at it": "교수님이나 멘토에게 잘한다는 피드백을 받았어요",
  "It feels natural to me": "저에게 자연스럽고 익숙해요",
  "I enjoy it, so I assume I'm good at it": "즐겁게 느껴져서 잘한다고 생각해요",
  "I'm not completely sure": "아직 확신은 없어요",
  "I've struggled with it repeatedly": "반복해서 어려움을 겪었어요",
  "I haven't had much experience with it": "경험이 충분하지 않아요",
  "My results haven't been strong": "결과가 기대에 못 미쳤어요",
  "Other people seem better at it": "다른 사람들이 더 잘하는 것 같아요",
  "I feel uncomfortable doing it": "그 일을 할 때 불편하거나 부담스러워요",
  "I've received feedback about it": "그 부분을 개선하라는 피드백을 받았어요",
  "I'm not really sure — I just don't feel confident": "이유는 잘 모르지만 자신감이 부족해요",
  "Choose up to 5.": "최대 5개까지 선택하세요.",
  "Choose up to 3.": "최대 3개까지 선택하세요.",
  "Coursework": "수업이나 과제",
  "A project": "프로젝트",
  "Internship or work": "인턴십 또는 업무",
  "Competition or research": "대회 또는 연구",
  "Feedback from others": "다른 사람의 피드백",
  "Mostly my own feeling": "주로 스스로 느낀 확신",
  "I haven't had much direct experience yet": "아직 직접 경험이 많지 않아요",
  "I tend to compare myself with people who are much more experienced": "경험이 훨씬 많은 사람과 자신을 비교하는 편이에요",
  "I can usually do it, but I still don't feel comfortable doing it": "대체로 할 수 있지만 아직 편하지는 않아요",
  "I often need more help than others may realise": "다른 사람들이 생각하는 것보다 도움이 많이 필요해요",
  "A few difficult experiences affected my confidence": "어려웠던 몇 가지 경험이 자신감에 영향을 줬어요",
  "I don't feel that my experience has been advanced enough yet": "아직 충분히 높은 수준의 경험을 쌓지 못한 것 같아요",
  "I'm still not sure how capable I am in this area": "이 분야에서 제 실력이 어느 정도인지 모르겠어요",
  "Break it into smaller parts": "작은 문제로 나누기",
  "Search for a similar example": "유사 사례 찾기",
  "Start experimenting": "직접 실험해 보기",
  "Learn the underlying concepts first": "기초 개념부터 공부하기",
  "Ask someone to help me understand the problem": "다른 사람에게 문제 이해를 도와달라고 하기",
  "I'm usually unsure where to begin": "어디서 시작해야 할지 잘 모르겠어요",
  "Check whether anything changed recently": "최근 변경된 사항 확인하기",
  "Try to reproduce the problem and observe what happens": "문제를 재현하고 동작을 관찰하기",
  "Search for similar problems or examples": "비슷한 문제나 사례 검색하기",
  "Test one possible cause at a time": "가능한 원인을 하나씩 검증하기",
  "Ask someone else for another perspective": "다른 사람의 관점 물어보기",
  "Step away briefly and come back with a fresh look": "잠시 쉬었다가 새로운 관점에서 다시 보기",
  "It depends on the problem": "문제에 따라 달라요",
  "Someone showed me the solution": "다른 사람이 해결 방법을 알려 줬어요",
  "I found an example and adapted it": "예시를 찾아 상황에 맞게 수정했어요",
  "I tried several things until something worked": "해결될 때까지 여러 방법을 시도했어요",
  "I isolated the problem step by step": "문제를 단계별로 분리해서 원인을 찾았어요",
  "I changed the overall approach": "전체 접근 방식을 바꿨어요",
  "I don't remember a situation like this": "그런 경험이 잘 기억나지 않아요",
  "Identify the main goal or question": "주요 목표나 질문부터 파악하기",
  "Organise the information into smaller groups": "정보를 작은 그룹으로 정리하기",
  "Look for examples of similar problems": "비슷한 문제의 사례 찾기",
  "Start working with the information and see what becomes important": "먼저 다뤄 보면서 중요한 정보를 찾아가기",
  "Ask someone which parts deserve the most attention": "어떤 부분이 중요한지 다른 사람에게 물어보기",
  "Discuss different interpretations with others": "다른 사람과 가능한 해석을 논의하기",
  "It depends on the situation": "상황에 따라 달라요",
  "How simple it is to implement": "구현이 얼마나 간단한지",
  "How familiar I am with the approach": "그 방법에 얼마나 익숙한지",
  "How interesting it is to explore": "탐색하는 과정이 얼마나 흥미로운지",
  "How well it fits what the project needs": "프로젝트의 요구사항에 얼마나 맞는지",
  "How easily I can test whether it works": "동작 여부를 쉽게 검증할 수 있는지",
  "How much I can learn from trying it": "시도하며 얼마나 배울 수 있는지",
  "I would probably compare a few options before deciding": "몇 가지 방법을 비교한 뒤 결정할 것 같아요",
  "Finding mistakes in my own work": "내 작업에서 실수 찾기",
  "Understanding why an existing solution behaves unexpectedly": "기존 해결책이 예상과 다르게 동작하는 이유 파악하기",
  "Adapting a solution I've seen before": "전에 본 해결 방법 응용하기",
  "Comparing several possible causes of a problem": "문제의 여러 원인 비교하기",
  "Testing different fixes to see what changes": "여러 해결책을 테스트하며 변화 살펴보기",
  "Helping someone else think through a problem": "다른 사람의 문제 해결 돕기",
  "I haven't had many opportunities to troubleshoot yet": "아직 문제 해결 경험이 많지 않아요",
  "Finding the answer itself": "답 자체를 찾는 일",
  "Knowing where to start": "어디서 시작할지 결정하는 일",
  "Not knowing whether my approach is correct": "내 접근 방식이 맞는지 알 수 없는 것",
  "I usually solve it eventually but don't feel confident": "결국 해결하지만 자신감은 부족해요",
  "Find a tutorial or worked example": "튜토리얼이나 예제 찾기",
  "Read about the underlying concept first": "먼저 기초 개념 읽기",
  "Look at official documentation or reference material": "공식 문서나 참고 자료 확인하기",
  "Ask someone who has experience with it": "해당 경험이 있는 사람에게 물어보기",
  "Try using it directly and learn from what happens": "직접 사용해 보며 배우기",
  "Compare a few different resources before deciding how to proceed": "여러 자료를 비교한 후 학습 방법 정하기",
  "It depends on what I need to learn": "배워야 할 내용에 따라 달라요",
  "Keep trying because I may just need more time": "시간이 더 필요할 뿐이라고 생각하고 계속 시도해요",
  "Look for a different implementation": "다른 구현 방법을 찾아요",
  "Ask someone whether I should change direction": "방향을 바꿔야 할지 다른 사람에게 물어봐요",
  "Step back and reconsider my assumptions": "한발 물러서서 기존 가정을 다시 검토해요",
  "Try a completely different approach": "완전히 다른 방법을 시도해요",
  "It depends how close the deadline is": "마감까지 남은 시간에 따라 달라요",
  "A programming language or software tool": "프로그래밍 언어 또는 소프트웨어 도구",
  "An engineering or technical concept": "공학·기술 개념",
  "A design, modelling, or analysis tool": "설계·모델링·분석 도구",
  "A research or data skill": "연구 또는 데이터 처리 기술",
  "A communication or presentation skill": "의사소통 또는 발표 기술",
  "A project or organisational skill": "프로젝트 또는 조직 운영 기술",
  "Nothing comes to mind yet": "아직 떠오르는 것이 없어요",
  "Find another explanation of the same topic": "같은 주제를 다르게 설명하는 자료를 찾아요",
  "Look for a practical example": "실제 예제를 찾아요",
  "Try using it and learn through experimentation": "실험하며 직접 사용해 봐요",
  "Ask someone to explain the confusing part": "이해되지 않는 부분을 다른 사람에게 물어봐요",
  "Go back and review the prerequisite knowledge": "선행 개념을 다시 공부해요",
  "Stay with the same resource a little longer": "같은 자료로 조금 더 공부해요",
  "It depends on what I'm learning": "배우는 내용에 따라 달라요",
  "I made the specific change requested": "요청받은 부분만 수정했어요",
  "I changed several related parts too": "연관된 부분도 함께 수정했어요",
  "I reconsidered the overall approach": "전체 접근 방식을 다시 검토했어요",
  "I disagreed with the feedback and kept my approach": "피드백에 동의하지 않아 기존 방법을 유지했어요",
  "I can't think of a situation like this": "그런 경험이 떠오르지 않아요",
  "I can complete the task I needed it for": "원래 목적이었던 과제를 완수할 수 있을 때",
  "I can explain the main idea in my own words": "주요 개념을 내 말로 설명할 수 있을 때",
  "I know where to look if I get stuck again": "다시 막혀도 어디서 찾아봐야 할지 알 때",
  "I can use it without constantly following an example": "예제를 계속 보지 않고 활용할 수 있을 때",
  "I can use it in a slightly different situation": "조금 다른 상황에도 적용할 수 있을 때",
  "Feedback from someone else suggests I'm on the right track": "다른 사람에게 긍정적인 피드백을 받았을 때",
  "I still think the approach can work": "아직 이 방법으로 해결할 수 있다고 생각해서",
  "I've already invested a lot of time in it": "이미 많은 시간을 들여서",
  "I'm not sure what a better alternative would be": "더 나은 대안을 모르겠어서",
  "Changing direction feels risky": "방향을 바꾸는 것이 위험하게 느껴져서",
  "There isn't enough time to start again": "다시 시작할 시간이 부족해서",
  "I want to understand why it isn't working before changing it": "방향을 바꾸기 전에 왜 안 되는지 알고 싶어서",
  "I followed detailed instructions": "상세한 지시를 따라 진행했어요",
  "I adapted examples or existing work": "예시나 기존 작업을 응용했어요",
  "I completed most of my part independently": "맡은 부분은 대부분 스스로 수행했어요",
  "I decided how to approach most of it myself": "대부분의 접근 방법을 직접 결정했어요",
  "The amount of guidance changed depending on the part of the project": "프로젝트의 단계에 따라 필요한 지도가 달랐어요",
  "I haven't had a suitable opportunity to demonstrate this yet": "아직 이런 역량을 보여 줄 기회가 없었어요",
  "I waited until responsibilities became clearer": "역할이 명확해질 때까지 기다렸어요",
  "I pointed it out to the group": "그룹에 이 문제를 알렸어요",
  "I asked whether someone should take responsibility for it": "누군가 담당해야 하는지 물어봤어요",
  "I offered to take responsibility for it": "제가 맡겠다고 제안했어요",
  "I started working on it because it seemed necessary": "필요해 보여서 먼저 시작했어요",
  "We discussed it and decided together who should handle it": "함께 논의해 담당자를 정했어요",
  "Building or completing technical/task work": "기술 구현 및 맡은 작업 완수",
  "Researching or analysing information": "조사 및 자료 분석",
  "Generating ideas or designing the approach": "아이디어 제안 및 접근 방식 설계",
  "Planning tasks or keeping track of progress": "작업 계획 및 진행 상황 관리",
  "Connecting different parts of the project": "프로젝트의 여러 부분 연결 및 통합",
  "Checking or improving the quality of the work": "결과물 품질 검토 및 개선",
  "Explaining, documenting, or presenting the result": "결과 설명·문서화·발표",
  "Supporting teammates when they needed help": "팀원 지원",
  "I haven't done a significant team project yet": "아직 큰 팀 프로젝트 경험이 없어요",
  "Improve the quality of what I've already completed": "완성한 결과물의 품질을 개선해요",
  "Explore an additional feature or idea": "추가 기능이나 아이디어를 탐색해요",
  "Check whether anything important was missed": "빠뜨린 중요한 부분이 없는지 확인해요",
  "Ask what the next priority should be": "다음 우선순위를 물어봐요",
  "Use the time on another responsibility": "남은 시간에 다른 일을 처리해요",
  "Finish early and leave it as it is": "일찍 끝내고 그대로 둬요",
  "How important the decision is": "결정이 얼마나 중요한지",
  "How reversible the decision is": "나중에 되돌릴 수 있는 결정인지",
  "How familiar I am with the situation": "상황에 얼마나 익숙한지",
  "How much the decision could affect other people": "다른 사람에게 미치는 영향이 얼마나 큰지",
  "How much time is available": "시간이 얼마나 남았는지",
  "Whether the expected outcome is clear": "예상 결과가 명확한지",
  "How much the decision could affect their work": "그들의 업무에 미치는 영향의 크기",
  "How urgent the decision is": "결정이 얼마나 급한지",
  "Whether the decision can easily be changed later": "나중에 쉽게 변경할 수 있는지",
  "Whether we already have an agreed way of handling it": "이미 합의한 처리 방식이 있는지",
  "Whether I have enough information to decide confidently": "결정할 충분한 정보가 있는지",
  "Whether I can test a small version before committing": "작은 버전으로 먼저 시험해 볼 수 있는지",
  "Taking responsibility feels different from leading people": "일을 책임지는 것과 사람들을 이끄는 것은 다르게 느껴져요",
  "I can take ownership of my work, but I don't usually want to direct others": "내 일은 책임질 수 있지만 다른 사람을 지휘하고 싶지는 않아요",
  "I sometimes take the lead without thinking of it as leadership": "리더십이라고 생각하지 않으면서도 주도하는 경우가 있어요",
  "They feel mostly the same to me": "둘이 거의 같다고 느껴져요",
  "I'm not sure — I haven't really thought about the difference": "아직 차이를 깊이 생각해 보지 않았어요",
  "Explain it using different words": "다른 표현으로 설명해요",
  "Give a concrete example": "구체적인 예시를 들어요",
  "Draw, show, or demonstrate it": "그림이나 시연으로 보여 줘요",
  "Ask which part is unclear": "어느 부분이 이해되지 않는지 물어봐요",
  "Ask them how they are currently understanding it": "상대방이 어떻게 이해했는지 물어봐요",
  "Break the idea into smaller parts": "아이디어를 작은 부분으로 나눠 설명해요",
  "It depends on what I'm explaining": "설명하는 내용에 따라 달라요",
  "Technical or task work": "기술 및 실무 작업",
  "Generating ideas": "아이디어 내기",
  "Organising the work": "작업 정리하기",
  "Keeping everyone aligned": "팀원 간 진행 방향 맞추기",
  "Checking quality": "품질 확인하기",
  "Explaining or presenting": "설명 및 발표하기",
  "I don't think I have a consistent role": "일정한 역할이 있는 것 같지는 않아요",
  "What I've completed": "완료한 작업",
  "What I'm currently working on": "지금 진행 중인 작업",
  "Problems or blockers I've encountered": "발생한 문제나 장애 요소",
  "Why I made certain decisions": "특정 결정을 내린 이유",
  "What I need from other people": "다른 사람에게 필요한 도움",
  "What I plan to do next": "앞으로 할 일",
  "I usually keep updates very brief unless someone asks": "질문받지 않으면 보통 아주 간단히 공유해요",
  "Explain and defend the idea I think will work": "효과적이라고 생각하는 아이디어를 설명하고 근거를 제시해요",
  "Ask questions to understand the different ideas": "각 아이디어를 이해하기 위한 질문을 해요",
  "Compare the ideas against the project needs": "프로젝트 요구사항에 맞춰 아이디어를 비교해요",
  "Look for a way to combine parts of different ideas": "서로 다른 아이디어의 장점을 결합해요",
  "Help summarise where everyone agrees and disagrees": "서로 동의하거나 이견이 있는 부분을 정리해요",
  "Listen first before deciding what I think": "먼저 듣고 나서 의견을 정해요",
  "It depends on the topic": "주제에 따라 달라요",
  "Explaining something one-to-one": "일대일로 설명하기",
  "Small group discussion": "소규모 그룹 토론",
  "Writing things down clearly": "글로 명확하게 정리하기",
  "Presenting to a group": "여러 사람 앞에서 발표하기",
  "Coordinating people": "사람들 사이에서 조율하기",
  "None feel particularly easy": "특별히 편한 상황은 없어요",
  "Speaking in front of people": "사람들 앞에서 말하기",
  "Explaining complicated ideas": "복잡한 아이디어 설명하기",
  "Starting conversations": "대화 시작하기",
  "Disagreeing with people": "다른 사람과 의견이 다를 때 표현하기",
  "Working in groups": "그룹에서 함께 일하기",
  "Writing clearly": "명확하게 글쓰기",
  "Everyone has clear individual responsibilities": "각자의 역할이 명확해요",
  "We discuss ideas often": "아이디어를 자주 논의해요",
  "I trust the people I'm working with": "함께 일하는 사람을 신뢰해요",
  "Someone keeps the team organised": "누군가 팀을 체계적으로 관리해요",
  "I can still control my own part": "내 담당 부분을 독립적으로 진행할 수 있어요",
  "I generally still prefer working alone": "그래도 대체로 혼자 일하는 게 좋아요",
  "Keep the plan and increase the amount of time I spend on it": "기존 계획을 유지하고 시간을 더 투자해요",
  "Review which parts matter most": "가장 중요한 부분을 다시 확인해요",
  "Make sure my own responsibilities are completed first": "내 담당 작업부터 완료해요",
  "Discuss with the team how the remaining work should be divided": "남은 작업의 분담을 팀원들과 논의해요",
  "Reduce the scope so the main idea can still be completed": "핵심 기능을 완성하도록 범위를 줄여요",
  "Ask a teacher, mentor, or supervisor what should be prioritised": "교수님·멘토·담당자에게 우선순위를 물어봐요",
  "It would depend on what caused the delay": "지연 원인에 따라 달라요",
  "Keep the original plan but put more time into it": "기존 계획을 유지하고 시간을 더 투자해요",
  "Rework the schedule": "일정을 다시 짜요",
  "Reduce what I'm trying to complete": "완료할 작업의 범위를 줄여요",
  "Focus first on the parts that matter most": "중요한 부분부터 집중해서 처리해요",
  "Ask someone for help or feedback": "다른 사람에게 도움이나 피드백을 요청해요",
  "Pause and work out why I'm behind before changing the plan": "계획을 바꾸기 전에 지연 원인을 먼저 파악해요",
  "It depends on why I'm behind": "뒤처진 이유에 따라 달라요",
  "A fairly detailed plan from the beginning": "시작할 때부터 상세한 계획을 세워요",
  "A few major milestones and deadlines": "몇 개의 주요 목표와 마감일을 정해요",
  "A rough direction, then adjust as I learn more": "대략적인 방향을 정하고 진행하며 조정해요",
  "I start working and plan the next steps along the way": "먼저 시작한 뒤 다음 단계를 계획해요",
  "I mostly organise my work around upcoming deadlines": "주로 마감일을 중심으로 계획해요",
  "My planning style depends strongly on the project": "프로젝트 성격에 따라 계획 방식이 달라요",
  "Yes, I decided what could be reduced": "네, 줄일 작업을 제가 결정했어요",
  "Yes, but someone else made that decision": "네, 하지만 다른 사람이 결정했어요",
  "No, we tried to complete everything": "아니요, 모든 작업을 완료하려고 했어요",
  "No, the original plan still worked": "아니요, 기존 계획대로 잘 진행됐어요",
  "I haven't encountered this yet": "아직 이런 경험은 없어요",
  "Moving on quickly": "빠르게 다음 단계로 넘어가기",
  "Finding out exactly what went wrong": "무엇이 잘못됐는지 정확히 파악하기",
  "Trying again": "다시 시도하기",
  "Getting feedback": "피드백 받기",
  "Changing direction": "방향 바꾸기",
  "I usually need some time before thinking about it again": "보통 다시 생각하기 전에 시간이 좀 필요해요",
  "Looking closely at what went wrong": "잘못된 부분을 자세히 살펴보기",
  "Comparing the result with what I expected": "실제 결과와 예상 결과 비교하기",
  "Asking someone else for feedback": "다른 사람에게 피드백 요청하기",
  "Trying a smaller or simpler version": "더 작거나 단순한 버전으로 시도하기",
  "Trying a different approach": "다른 접근 방식 시도하기",
  "Taking some time before deciding what to do next": "다음 행동을 정하기 전에 생각할 시간 갖기",
  "It depends on why it didn't work": "실패 원인에 따라 달라요",
  "Strongly A": "A에 매우 가까워요",
  "Slightly A": "A에 조금 더 가까워요",
  "Somewhere in between": "둘의 중간이에요",
  "Slightly B": "B에 조금 더 가까워요",
  "Strongly B": "B에 매우 가까워요",
  "A structured course with weekly lessons": "주차별 수업이 있는 체계적인 강의",
  "A guided project": "안내에 따라 진행하는 프로젝트",
  "A project I design myself": "직접 설계하는 프로젝트",
  "Learning from different resources as needed": "필요한 자료를 그때그때 찾아 학습하기",
  "Learning together with other people": "다른 사람들과 함께 배우기",
  "I'm not sure": "잘 모르겠어요",
  "A clear step-by-step plan": "명확한 단계별 계획",
  "A project with a useful final outcome": "실용적인 결과물이 나오는 프로젝트",
  "Freedom to choose how I approach it": "접근 방법을 자유롭게 정할 수 있는 것",
  "Regular checkpoints": "정기적인 진행 상황 점검",
  "Working with someone else": "다른 사람과 함께 진행하는 것",
  "A visible challenge or goal": "명확하게 보이는 도전 과제나 목표",
  "Choose up to 2.": "최대 2개까지 선택하세요.",
  "Optional: If you'd like, tell us briefly what you learned.": "선택 사항: 배운 점을 간단히 작성해도 좋아요."
};

export function localizeQuestion(question: DynamicQuestion | null, language: string): DynamicQuestion | null {
  if (!question || language !== 'ko') return question;
  const known = questions[question.id];
  // Only translate vetted bank text. Personalized AI wording must be localized by the server.
  const text = known && known.en.trim() === question.text.trim() ? known.ko : question.text;
  return {
    ...question,
    text,
    instruction: question.instruction ? (optionLabels[question.instruction] || question.instruction) : question.instruction,
    options: question.options.map((option) => ({ ...option, text: optionLabels[option.text] || option.text })),
  };
}
