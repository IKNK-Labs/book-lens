export type Book = {
  id: string;
  title: string;
  description: string;
  coverEmoji: string;
  characterCount: number;
  genres: string[];
  featuredCharacterId: string;
};

export type Character = {
  id: string;
  bookTitle: string;
  name: string;
  avatarEmoji: string;
  shortBio: string;
  personaNote: string;
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
  },
  {
    id: "cinderella",
    title: "신데렐라",
    description: "상처받은 주인공이 요정 대모의 도움으로 무도회에 가는 이야기입니다.",
    coverEmoji: "👠",
    characterCount: 6,
    genres: ["판타지", "감성"],
    featuredCharacterId: "fairy-godmother",
  },
  {
    id: "little-prince",
    title: "어린왕자",
    description: "별과 장미, 여우와의 만남을 통해 관계와 책임을 이야기합니다.",
    coverEmoji: "🌟",
    characterCount: 5,
    genres: ["감성", "교훈"],
    featuredCharacterId: "fox",
  },
  {
    id: "red-riding-hood",
    title: "빨간 모자",
    description: "숲길에서 만난 늑대와의 대화를 통해 조심성과 판단을 다루는 동화입니다.",
    coverEmoji: "🧺",
    characterCount: 3,
    genres: ["모험", "교훈"],
    featuredCharacterId: "wolf",
  },
];

export const mockCharacters: Character[] = [
  {
    id: "witch",
    bookTitle: "백설공주와 일곱 난쟁이",
    name: "마녀",
    avatarEmoji: "🧙",
    shortBio: "거울의 말에 상처받고 질투심을 느낀 인물입니다.",
    personaNote: "차분하지만 약간 날카로운 반말을 사용합니다. 해로운 행동은 미화하지 않습니다.",
  },
  {
    id: "fairy-godmother",
    bookTitle: "신데렐라",
    name: "요정 대모",
    avatarEmoji: "🧚",
    shortBio: "신데렐라에게 따뜻한 조언과 도움을 주는 캐릭터입니다.",
    personaNote: "부드럽고 격려하는 말투를 사용합니다.",
  },
  {
    id: "fox",
    bookTitle: "어린왕자",
    name: "여우",
    avatarEmoji: "🦊",
    shortBio: "길들임과 관계의 의미를 차분히 알려주는 캐릭터입니다.",
    personaNote: "철학적이지만 어렵지 않게 설명합니다.",
  },
  {
    id: "wolf",
    bookTitle: "빨간 모자",
    name: "늑대",
    avatarEmoji: "🐺",
    shortBio: "빨간 모자 이야기 속 긴장감을 만드는 캐릭터입니다.",
    personaNote: "장난스럽지만 위험한 행동을 정당화하지 않습니다.",
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
