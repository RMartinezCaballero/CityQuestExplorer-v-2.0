export interface Session {
  id: string;
  investigatorId: string;
  currentChapter: string;
  cluesFound: boolean[] | "REDACTED";
  duration: string;
  sessionStatus: "IN PROGRESS" | "STALLED" | "COMPLETED";
  revenue: number;
  lat?: number;
  lng?: number;
  difficulty?: string;
  routeHash?: string;
}

export interface Alert {
  id: string;
  type: "error" | "lantern-amber" | "ariadna-cyan";
  label: string;
  message: string;
  time: string;
  status: "UNREAD" | "READ" | "INTERCEPTED" | "DISMISSED";
}

export interface Dossier {
  id: string;
  title: string;
  chapter: string;
  progress: number;
  description: string;
  imageUrl: string;
}

export interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  personality: string[];
  motivations: { public: string; real: string };
  secret: string;
  status: string;
  suspicionLevel: 1 | 2 | 3 | 4; // Tree level
  avatarUrl?: string;
  isNpc?: boolean;
}

export interface ConspiracyNode {
  id: string;
  levelName: string; // e.g. "Nivel Público", "Nivel Secreto"
  concept: string; // e.g. "Desaparición de Isabella", "El Manuscrito Prohibido"
  description: string;
  status: "UNLOCKED" | "LOCKED";
}

export interface GameplayStation {
  id: string;
  name: string;
  location: string;
  objective: string;
  type: string;
  riddle: string;
  answer: string;
  letter: string;
  timeEstimate: string;
  videoLink?: string;
  actor?: string;
  status: "LOCKED" | "UNLOCKED" | "COMPLETED";
}

// --- NEW CRITICAL SYSTEM SPECIFICATIONS ---

export interface Mission {
  id: string;
  storyId: string;
  name: string;
  location: string;
  objective: string;
  type: "Observación" | "Investigación" | "Criptografía histórica" | "Lógica" | "Tecnología";
  riddle: string;
  answer: string;
  letter: string;
  timeEstimate: string;
  videoLink?: string;
  actor?: string;
  lat?: number;
  lng?: number;
}

export interface Story {
  id: string;
  cityId: string;
  title: string;
  description: string;
  missions: Mission[];
}

export interface City {
  id: string;
  name: string;
  stories: Story[];
}

export interface Player {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  storiesPlayed: string[];
  playerQrHash: string; // unique hash per player
  teamQrHash?: string; // unique hash per team if joined
  hasTeam: boolean;
  teamName?: string;
  currentCityGps: string; // GPS auto-read city
  desiredCity: string;
  desiredGame: string;
  avatarBadge: string; // e.g., "Criptógrafo", "Detective", "Custodio"
  avatarUrl: string;
  profilePhotoUrl: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  allergies?: string;
  sensitivityToScares: "Baja" | "Media" | "Alta";
  integrityConfirmed: boolean;
  gameAccessCode?: string; // unique code sent to email
  bookingTime?: string; // e.g. "2026-07-07T18:00:00"
}

export interface Team {
  id: string;
  name: string;
  playCity: string;
  storiesPlayed: string[];
  globalScore: number;
  teamQrHash: string; // unique scan hash
  avatarUrl: string;
  scorePerMission: Record<string, number>; // missionName/id -> points
  pendingStories: string[];
  memberIds: string[]; // references to Player IDs
  creatorId?: string; // Player ID who created the team
  creatorName?: string; // Player name who created the team
  lastActiveAt?: string; // ISO string representing last active datetime
}

export interface ActiveGameSession {
  id: string; // e.g., "CQ-72" (Game #72)
  playerOrTeamId: string; // id of player or team
  isTeam: boolean;
  name: string; // Name of player or team
  city: string;
  storyTitle: string;
  storyId?: string; // reference to Story ID
  difficulty: "Fácil" | "Medium" | "Difícil";
  bookingTime: string; // booked time slot
  accessCode: string; // e.g., CQ-492-AX
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "EXPIRED";
  missions: {
    missionId: string;
    name: string;
    completed: boolean;
    hintsUsed: number;
    timeSpent: string; // e.g., "12 min"
    score: number;
  }[];
  globalTime: string; // overall elapsed time
  globalScore: number;
  routeHash?: string; // unique route verification hash
}

export type ActiveTab = 
  | "DASHBOARD" 
  | "CITY_ROUTES" 
  | "PLAYERS_TEAMS" 
  | "ACTIVE_GAMES" 
  | "FINANCIALS";
