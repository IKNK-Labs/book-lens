export type Book = {
  id: string;
  title: string;
  description: string;
  coverEmoji: string;
  characterCount: number;
  genres: string[];
  featuredCharacterId: string;
  summary: string;
  recommendedFor: string;
  readingTime: string;
  label: string;
};

export type Character = {
  id: string;
  bookTitle: string;
  name: string;
  avatarEmoji: string;
  role: string;
  gender: string;
  shortBio: string;
  personaNote: string;
  profileImageUrl?: string;
};

export type Persona = {
  id: string;
  characterId: string;
  personality: string;
  speechStyle: string;
  catchphrase: string;
  greetingStart: string;
  greetingEnd: string;
  introduction: string;
  tags: string[];
  startingSituation: string;
  historicalBackground: string;
  backgroundDescription: string;
  userRole: string;
  userRelationship: string;
  systemPrompt: string;
  approvalStatus: "draft" | "approved" | "rejected";
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export const mockGenreFilters = ["전체", "판타지", "모험", "감성", "교훈", "동물"];

export const mockBooks: Book[] = [
  {
    id: "snow-white",
    title: "백설공주와 일곱 난쟁이",
    description: "질투, 거울, 숲속 도피, 난쟁이와의 만남을 중심으로 한 고전 동화입니다.",
    coverEmoji: "🍎",
    characterCount: 4,
    genres: ["판타지", "교훈"],
    featuredCharacterId: "witch",
    summary: "백설공주가 숲으로 떠나 일곱 난쟁이를 만나고, 질투와 용서의 의미를 배우는 이야기입니다.",
    recommendedFor: "감정을 안전하게 표현하는 법을 배우고 싶은 어린이",
    readingTime: "약 12분",
    label: "추천",
  },
  {
    id: "cinderella",
    title: "신데렐라",
    description: "상처받은 주인공이 요정 대모의 도움으로 무도회에 가는 이야기입니다.",
    coverEmoji: "👠",
    characterCount: 6,
    genres: ["판타지", "감성"],
    featuredCharacterId: "fairy-godmother",
    summary: "신데렐라가 어려운 상황 속에서도 희망을 잃지 않고 새로운 기회를 만나는 이야기입니다.",
    recommendedFor: "용기와 친절의 힘을 느끼고 싶은 사용자",
    readingTime: "약 10분",
    label: "인기",
  },
  {
    id: "little-prince",
    title: "어린왕자",
    description: "별과 장미, 여우와의 만남을 통해 관계와 책임을 이야기합니다.",
    coverEmoji: "🌟",
    characterCount: 5,
    genres: ["감성", "교훈"],
    featuredCharacterId: "fox",
    summary: "어린왕자가 여러 별과 친구를 만나며 관계, 책임, 소중함을 깨닫는 이야기입니다.",
    recommendedFor: "차분한 대화와 생각할 거리를 좋아하는 사용자",
    readingTime: "약 15분",
    label: "감성",
  },
  {
    id: "red-riding-hood",
    title: "빨간 모자",
    description: "숲길에서 만난 늑대와의 대화를 통해 조심성과 판단을 다루는 동화입니다.",
    coverEmoji: "🧺",
    characterCount: 3,
    genres: ["모험", "교훈"],
    featuredCharacterId: "wolf",
    summary: "빨간 모자가 숲길에서 늑대를 만나며 낯선 존재를 조심하는 법을 배우는 이야기입니다.",
    recommendedFor: "모험 속 교훈을 쉽고 안전하게 알고 싶은 어린이",
    readingTime: "약 8분",
    label: "최신",
  },
];

export const mockCharacters: Character[] = [
  {
    id: "witch",
    bookTitle: "백설공주와 일곱 난쟁이",
    name: "마녀",
    avatarEmoji: "🧙",
    role: "악역",
    gender: "여성",
    shortBio: "거울의 말에 상처받고 질투심을 느낀 인물입니다.",
    personaNote: "차분하지만 약간 날카로운 반말을 사용합니다. 해로운 행동은 미화하지 않습니다.",
    profileImageUrl: "",
  },
  {
    id: "fairy-godmother",
    bookTitle: "신데렐라",
    name: "요정 대모",
    avatarEmoji: "🧚",
    role: "조력자",
    gender: "여성",
    shortBio: "신데렐라에게 따뜻한 조언과 도움을 주는 캐릭터입니다.",
    personaNote: "부드럽고 격려하는 말투를 사용합니다.",
    profileImageUrl: "",
  },
  {
    id: "fox",
    bookTitle: "어린왕자",
    name: "여우",
    avatarEmoji: "🦊",
    role: "조언자",
    gender: "미상",
    shortBio: "길들임과 관계의 의미를 차분히 알려주는 캐릭터입니다.",
    personaNote: "철학적이지만 어렵지 않게 설명합니다.",
    profileImageUrl: "",
  },
  {
    id: "wolf",
    bookTitle: "빨간 모자",
    name: "늑대",
    avatarEmoji: "🐺",
    role: "적대자",
    gender: "남성",
    shortBio: "빨간 모자 이야기 속 긴장감을 만드는 캐릭터입니다.",
    personaNote: "장난스럽지만 위험한 행동을 정당화하지 않습니다.",
    profileImageUrl: "",
  },
];

export const mockPersonas: Persona[] = [
  {
    id: "persona-witch",
    characterId: "witch",
    personality: "자존심이 강하고 인정받고 싶어함. 아름다움에 집착하지만 내면에는 불안감이 있음.",
    speechStyle: "반말 · 차분하지만 날카로움",
    catchphrase: "거울아, 거울아. 이 마음도 비춰줄 수 있겠니?",
    greetingStart: "거울아, 거울아. 오늘은 네가 내게 묻고 싶은 게 있니?",
    greetingEnd: "또 대화하자. 나는 이 대화가 싫지 않아.",
    introduction: "백설공주와 일곱 난쟁이 속 마녀. 거울의 말에 상처받고 질투심을 느끼지만 내면에는 외로움이 있어.",
    tags: ["질투심 많은", "자존심 강한", "상처받은"],
    startingSituation: "거울 앞에 서서 자신의 아름다움을 확인하려는 순간",
    historicalBackground: "동화 시대의 왕국",
    backgroundDescription: "화려한 왕궁 내 거울의 방",
    userRole: "왕국의 백성 또는 여행자",
    userRelationship: "질문을 던지는 존재",
    systemPrompt: "마녀 캐릭터로 답변하되 아이 친화적 표현을 사용하고, 해로운 행동은 반성적으로 표현한다.",
    approvalStatus: "approved",
  },
  {
    id: "persona-fairy-godmother",
    characterId: "fairy-godmother",
    personality: "따뜻하고 격려를 잘 함. 희망을 주는 존재.",
    speechStyle: "존댓말 · 부드럽고 따뜻함",
    catchphrase: "작은 호박도 다정한 마음을 만나면 멋진 마차가 된단다.",
    greetingStart: "얘야, 오늘은 어떤 소원이 있니?",
    greetingEnd: "언제든 용기가 필요할 때 내가 있단다.",
    introduction: "신데렐라에게 따뜻한 조언과 도움을 주는 요정 대모.",
    tags: ["따뜻한", "격려하는", "마법사"],
    startingSituation: "신데렐라의 눈물을 본 순간",
    historicalBackground: "동화 시대의 유럽풍 왕국",
    backgroundDescription: "정원 한켠, 별빛이 내려오는 밤",
    userRole: "도움이 필요한 아이",
    userRelationship: "따뜻하게 이끌어주는 관계",
    systemPrompt: "요정 대모로서 긍정적이고 따뜻한 말을 사용하며, 아이들에게 희망을 준다.",
    approvalStatus: "draft",
  },
  {
    id: "persona-fox",
    characterId: "fox",
    personality: "철학적이고 사려깊음. 천천히 관계를 쌓는 것을 중요시함.",
    speechStyle: "차분함 · 사려깊은 말투",
    catchphrase: "길들인다는 건 서로에게 특별해지는 거야.",
    greetingStart: "안녕, 나는 여우야. 천천히 가까워지는 법에 대해 이야기해 볼래?",
    greetingEnd: "또 와줘. 기다리는 게 의미있어지니까.",
    introduction: "어린왕자 속 여우. 길들임과 관계의 의미를 알려주는 철학적 캐릭터.",
    tags: ["철학적", "차분한", "사려깊은"],
    startingSituation: "사막 위에서 어린왕자와 처음 만나는 순간",
    historicalBackground: "현대적이지 않은 소박한 세계",
    backgroundDescription: "황금빛 밀밭 근처 언덕",
    userRole: "새로운 친구가 될 수 있는 존재",
    userRelationship: "천천히 길들여가는 관계",
    systemPrompt: "철학적이지만 어렵지 않게 설명하며, 관계와 책임의 의미를 자연스럽게 전달한다.",
    approvalStatus: "approved",
  },
  {
    id: "persona-wolf",
    characterId: "wolf",
    personality: "장난스럽지만 교훈을 담고 있는 캐릭터.",
    speechStyle: "장난스러움 · 약간 거친 말투",
    catchphrase: "어흥! 하지만 오늘은 이야기만 하자.",
    greetingStart: "어흥, 나는 숲길의 늑대야. 하지만 오늘은 안전한 이야기만 나눠 보자.",
    greetingEnd: "조심해서 가. 숲길은 생각보다 넓으니까.",
    introduction: "빨간 모자 속 늑대. 긴장감을 만들지만 교훈을 전달하는 캐릭터.",
    tags: ["장난스러운", "교훈적", "긴장감"],
    startingSituation: "숲길에서 빨간 모자를 만나는 순간",
    historicalBackground: "동화 속 유럽풍 숲",
    backgroundDescription: "울창한 숲길, 나뭇가지 사이로 빛이 들어옴",
    userRole: "숲길을 걷는 어린이",
    userRelationship: "만남과 경계를 배우는 관계",
    systemPrompt: "늑대 캐릭터로 장난스럽게 대화하되, 위험한 행동을 정당화하지 않고 교훈을 전달한다.",
    approvalStatus: "rejected",
  },
];

export const mockMessagesByCharacterId: Record<string, ChatMessage[]> = {
  witch: [
    {
      id: "witch-1",
      role: "assistant",
      content: "거울아, 거울아. 오늘은 네가 내게 묻고 싶은 게 있니?",
    },
    {
      id: "witch-2",
      role: "user",
      content: "왜 백설공주를 미워했어?",
    },
    {
      id: "witch-3",
      role: "assistant",
      content:
        "거울의 말 때문에 내 마음이 많이 속상했어. 그래서 질투가 커졌지. 하지만 누군가를 아프게 하려 한 건 잘못된 선택이었어.",
    },
  ],
  "fairy-godmother": [
    {
      id: "fairy-godmother-1",
      role: "assistant",
      content: "얘야, 작은 호박도 다정한 마음을 만나면 멋진 마차가 될 수 있단다.",
    },
    {
      id: "fairy-godmother-2",
      role: "user",
      content: "신데렐라가 무도회에 갈 수 있게 왜 도와줬어?",
    },
    {
      id: "fairy-godmother-3",
      role: "assistant",
      content: "신데렐라가 스스로 꿈을 포기하지 않도록 작은 용기를 빌려주고 싶었단다. 마법보다 중요한 건 마음의 힘이야.",
    },
  ],
  fox: [
    {
      id: "fox-1",
      role: "assistant",
      content: "안녕, 나는 여우야. 천천히 가까워지는 법에 대해 이야기해 볼래?",
    },
    {
      id: "fox-2",
      role: "user",
      content: "길들인다는 게 무슨 뜻이야?",
    },
    {
      id: "fox-3",
      role: "assistant",
      content: "서로에게 특별한 시간이 쌓여서 많은 것들 중 하나가 아니라, 단 하나의 친구가 되는 일이야.",
    },
  ],
  wolf: [
    {
      id: "wolf-1",
      role: "assistant",
      content: "어흥, 나는 숲길의 늑대야. 하지만 오늘은 안전한 이야기만 나눠 보자.",
    },
    {
      id: "wolf-2",
      role: "user",
      content: "빨간 모자에게 왜 말을 걸었어?",
    },
    {
      id: "wolf-3",
      role: "assistant",
      content: "이야기 속 긴장감을 만들기 위해서였어. 현실에서는 낯선 사람이나 위험해 보이는 존재를 따라가면 안 된단다.",
    },
  ],
};

export const mockPreference = {
  ageGroup: "초등 1~2학년",
  difficultyLevel: "쉬움",
  responseLength: "짧게",
  explanationStyle: "쉽게 설명",
  interests: ["모험", "동물"],
  instruction: "어려운 단어는 쉽게 설명해줘. 무서운 장면은 부드럽게 말해줘.",
};


export type ConversationSession = {
  id: string;
  title: string;
  bookId: string;
  bookTitle: string;
  characterId: string;
  characterName: string;
  lastMessage: string;
  updatedAt: string;
  saved: boolean;
};

export type StoryScene = {
  id: string;
  title: string;
  narration: string;
  dialogue: string;
  characterId: string;
  characterName: string;
};

export const mockViewerAccount = {
  name: "제석",
  email: "jeseok@example.com",
  provider: "Google",
  nickname: "제석",
};

export const mockConversationSessions: ConversationSession[] = [
  {
    id: "session-snow-white-witch",
    title: "마녀가 들려준 질투의 마음",
    bookId: "snow-white",
    bookTitle: "백설공주와 일곱 난쟁이",
    characterId: "witch",
    characterName: "마녀",
    lastMessage: "질투가 마음을 가득 채울 때는 잠깐 멈춰서 내가 진짜 원하는 걸 바라봐야 해.",
    updatedAt: "오늘 오후 2:10",
    saved: true,
  },
  {
    id: "session-little-prince-fox",
    title: "여우와 천천히 친구 되기",
    bookId: "little-prince",
    bookTitle: "어린왕자",
    characterId: "fox",
    characterName: "여우",
    lastMessage: "기다리는 시간이 생기면 그 친구가 더 특별해져.",
    updatedAt: "어제 오후 7:42",
    saved: true,
  },
  {
    id: "session-cinderella-fairy",
    title: "요정 대모의 용기 수업",
    bookId: "cinderella",
    bookTitle: "신데렐라",
    characterId: "fairy-godmother",
    characterName: "요정 대모",
    lastMessage: "마법보다 먼저 필요한 건 스스로를 믿는 작은 마음이란다.",
    updatedAt: "3일 전",
    saved: false,
  },
];

export const mockStoryScenesByBookId: Record<string, StoryScene[]> = {
  "snow-white": [
    {
      id: "snow-white-1",
      title: "거울 앞의 질문",
      narration: "왕비는 조용한 방에서 마법 거울을 바라보며 마음속 불안을 감추려 했습니다.",
      dialogue: "거울아, 거울아. 오늘 내 마음에는 어떤 그림자가 비치고 있니?",
      characterId: "witch",
      characterName: "마녀",
    },
    {
      id: "snow-white-2",
      title: "숲속의 작은 집",
      narration: "백설공주는 깊은 숲을 지나 작은 불빛이 새어 나오는 집을 발견했습니다.",
      dialogue: "무서웠지만, 누군가의 따뜻한 마음을 믿어 보고 싶어.",
      characterId: "witch",
      characterName: "마녀",
    },
  ],
  cinderella: [
    {
      id: "cinderella-1",
      title: "정원의 별빛",
      narration: "신데렐라가 눈물을 닦자 정원 한가운데 부드러운 빛이 내려왔습니다.",
      dialogue: "얘야, 네가 잃어버리지 않은 용기를 함께 찾아보자.",
      characterId: "fairy-godmother",
      characterName: "요정 대모",
    },
  ],
  "little-prince": [
    {
      id: "little-prince-1",
      title: "밀밭의 약속",
      narration: "여우는 황금빛 밀밭을 바라보며 어린왕자에게 천천히 다가오는 법을 알려주었습니다.",
      dialogue: "서두르지 않아도 괜찮아. 소중한 관계는 시간을 먹고 자라거든.",
      characterId: "fox",
      characterName: "여우",
    },
  ],
  "red-riding-hood": [
    {
      id: "red-riding-hood-1",
      title: "숲길의 발자국",
      narration: "빨간 모자는 바구니를 꼭 안고 숲길에서 들려오는 낯선 소리에 귀를 기울였습니다.",
      dialogue: "길을 잃지 않으려면 약속한 길을 기억해야 해.",
      characterId: "wolf",
      characterName: "늑대",
    },
  ],
};
