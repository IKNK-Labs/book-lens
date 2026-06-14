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

export const mockMessages: ChatMessage[] = [
  {
    id: "m1",
    role: "assistant",
    content: "거울아, 거울아. 오늘은 네가 내게 묻고 싶은 게 있니?",
  },
  {
    id: "m2",
    role: "user",
    content: "왜 백설공주를 미워했어?",
  },
  {
    id: "m3",
    role: "assistant",
    content:
      "거울의 말 때문에 내 마음이 많이 속상했어. 그래서 질투가 커졌지. 하지만 누군가를 아프게 하려 한 건 잘못된 선택이었어.",
  },
];

export const mockPreference = {
  ageGroup: "초등 1~2학년",
  difficultyLevel: "쉬움",
  responseLength: "짧게",
  explanationStyle: "쉽게 설명",
  interests: ["모험", "동물"],
  instruction: "어려운 단어는 쉽게 설명해줘. 무서운 장면은 부드럽게 말해줘.",
};
