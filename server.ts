import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

interface Session {
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

interface Alert {
  id: string;
  type: "error" | "lantern-amber" | "ariadna-cyan";
  label: string;
  message: string;
  time: string;
  status: "UNREAD" | "READ" | "INTERCEPTED" | "DISMISSED";
}

interface Dossier {
  id: string;
  title: string;
  chapter: string;
  progress: number;
  description: string;
  imageUrl: string;
}

interface Character {
  id: string;
  name: string;
  role: string;
  description: string;
  personality: string[];
  motivations: { public: string; real: string };
  secret: string;
  status: string;
  suspicionLevel: 1 | 2 | 3 | 4;
  avatarUrl?: string;
  isNpc?: boolean;
}

// --- NEW STRUCTURAL SPECIFICATIONS ---
interface Mission {
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

interface Story {
  id: string;
  cityId: string;
  title: string;
  description: string;
  missions: Mission[];
}

interface City {
  id: string;
  name: string;
  stories: Story[];
}

interface Player {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  storiesPlayed: string[];
  playerQrHash: string;
  teamQrHash?: string;
  hasTeam: boolean;
  teamName?: string;
  currentCityGps: string;
  desiredCity: string;
  desiredGame: string;
  avatarBadge: string;
  avatarUrl: string;
  profilePhotoUrl: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
  tiktok?: string;
  allergies?: string;
  sensitivityToScares: "Baja" | "Media" | "Alta";
  integrityConfirmed: boolean;
  gameAccessCode?: string;
  bookingTime?: string;
}

interface Team {
  id: string;
  name: string;
  playCity: string;
  storiesPlayed: string[];
  globalScore: number;
  teamQrHash: string;
  avatarUrl: string;
  scorePerMission: Record<string, number>;
  pendingStories: string[];
  memberIds: string[];
  creatorId?: string;
  creatorName?: string;
  lastActiveAt?: string;
}

interface ActiveGameSession {
  id: string;
  playerOrTeamId: string;
  isTeam: boolean;
  name: string;
  city: string;
  storyTitle: string;
  storyId?: string;
  difficulty: "Fácil" | "Medium" | "Difícil";
  bookingTime: string;
  accessCode: string;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "EXPIRED";
  missions: {
    missionId: string;
    name: string;
    completed: boolean;
    hintsUsed: number;
    timeSpent: string;
    score: number;
  }[];
  globalTime: string;
  globalScore: number;
  routeHash?: string;
}

interface ConspiracyNode {
  id: string;
  levelName: string;
  concept: string;
  description: string;
  status: "UNLOCKED" | "LOCKED";
}

interface GameplayStation {
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

// Initial Mock Database state
let cities: City[] = [
  {
    id: "cartagena",
    name: "Cartagena",
    stories: [
      {
        id: "cartagena-manuscrito",
        cityId: "cartagena",
        title: "El Manuscrito Prohibido",
        description: "Encuentra el secreto ancestral de Isabella Navarro oculta en las antiguas murallas de Cartagena.",
        missions: [
          {
            id: "m-m1",
            storyId: "cartagena-manuscrito",
            name: "LA DESAPARICIÓN",
            location: "Las Bóvedas",
            objective: "Conocer el caso e iniciar la telemetría.",
            type: "Observación",
            riddle: "Identificar la palabra clave en la carta de emergencia de Isabella.",
            answer: "VERDAD",
            letter: "M",
            timeEstimate: "5-10 min",
            videoLink: "Video 01: La Última Grabación",
            lat: 10.4302,
            lng: -75.5435
          },
          {
            id: "m-m2",
            storyId: "cartagena-manuscrito",
            name: "EL PRIMER RASTRO",
            location: "Camellón de los Mártires",
            objective: "Encontrar la conexión inicial.",
            type: "Observación",
            riddle: "Deducir la palabra grabada en el farol antiguo.",
            answer: "FARO",
            letter: "A",
            timeEstimate: "8 min",
            actor: "El Mensajero (Actor 01)",
            lat: 10.4222,
            lng: -75.5471
          },
          {
            id: "m-m3",
            storyId: "cartagena-manuscrito",
            name: "LA HORA EQUIVOCADA",
            location: "Plaza de la Aduana",
            objective: "Descifrar anomalía de fecha.",
            type: "Criptografía histórica",
            riddle: "Resolver el año de la Declaración de Independencia oculto en la placa colonial.",
            answer: "1811",
            letter: "R",
            timeEstimate: "10 min",
            lat: 10.4224,
            lng: -75.5482
          },
          {
            id: "m-m4",
            storyId: "cartagena-manuscrito",
            name: "EL TESTIGO",
            location: "San Pedro Claver",
            objective: "Detectar contradicción en declaraciones.",
            type: "Investigación",
            riddle: "Identificar cuál de los testigos (TESTIGO A, B o C) miente según la libreta.",
            answer: "TESTIGO B",
            letter: "T",
            timeEstimate: "8 min",
            lat: 10.4217,
            lng: -75.5486
          },
          {
            id: "m-m5",
            storyId: "cartagena-manuscrito",
            name: "LA CONEXIÓN",
            location: "Torre del Reloj",
            objective: "Revelación de la red secreta de custodia.",
            type: "Observación",
            riddle: "Descubrir el nombre de la orden secreta en el reverso de la libreta.",
            answer: "GUARDIAN",
            letter: "I",
            timeEstimate: "10 min",
            videoLink: "Video 02: El Patrón",
            lat: 10.4229,
            lng: -75.5476
          },
          {
            id: "m-m6",
            storyId: "cartagena-manuscrito",
            name: "LA PÁGINA PERDIDA",
            location: "Getsemaní",
            objective: "Criptografía histórica del mural.",
            type: "Criptografía histórica",
            riddle: "Interpretar el jeroglífico del mural de la Trinidad para revelar el rol del custodio caído.",
            answer: "MARTIR",
            letter: "R",
            timeEstimate: "10 min",
            lat: 10.4226,
            lng: -75.5441
          },
          {
            id: "m-m7",
            storyId: "cartagena-manuscrito",
            name: "LAS CENIZAS DEL MANUSCRITO",
            location: "Castillo San Felipe",
            objective: "Hacer creer al equipo que el manuscrito fue quemado.",
            type: "Lógica",
            riddle: "Ingresar el código del diario quemado provisto por el Falsificador.",
            answer: "CENIZAS",
            letter: "A",
            timeEstimate: "15 min",
            actor: "El Falsificador (Actor 02)",
            lat: 10.4225,
            lng: -75.5385
          },
          {
            id: "m-m8",
            storyId: "cartagena-manuscrito",
            name: "LA DUDA",
            location: "Parque Apolo",
            objective: "Investigar por qué ARIADNA encubrió archivos.",
            type: "Investigación",
            riddle: "Determinar el nodo alterado de ARIADNA para restablecer la transmisión (SEÑAL 01, 02 o 03).",
            answer: "SEÑAL 03",
            letter: "D",
            timeEstimate: "8 min",
            lat: 10.4278,
            lng: -75.5445
          },
          {
            id: "m-m9",
            storyId: "cartagena-manuscrito",
            name: "LLEGARON DEMASIADO TARDE",
            location: "Camellón de los Mártires",
            objective: "Descubrir quién interceptó las transmisiones.",
            type: "Observación",
            riddle: "Identificar la entidad en las sombras que espía al equipo.",
            answer: "OBSERVADOR",
            letter: "O",
            timeEstimate: "8 min",
            lat: 10.4222,
            lng: -75.5471
          },
          {
            id: "m-m10",
            storyId: "cartagena-manuscrito",
            name: "EL SOBRE SELLADO",
            location: "Las Bóvedas",
            objective: "Apertura autorizada del sobre lacrado.",
            type: "Tecnología",
            riddle: "Ingresar la palabra de seguridad del sobre sellado.",
            answer: "CLASIFICACION",
            letter: "R",
            timeEstimate: "10 min",
            videoLink: "Video 03: El Sobre",
            lat: 10.4302,
            lng: -75.5435
          },
          {
            id: "m-m11",
            storyId: "cartagena-manuscrito",
            name: "LA VERDAD",
            location: "Murallas",
            objective: "Resolver el Código Maestro de la Conspiración.",
            type: "Criptografía histórica",
            riddle: "Ordenar las 10 letras acumuladas durante la misión (M-A-R-T-I-R-A-D-O-R) para descifrar el rol de los custodios del saber.",
            answer: "MARTIRADOR",
            letter: "FINAL",
            timeEstimate: "10 min",
            videoLink: "Video 04: La Verdad",
            lat: 10.4295,
            lng: -75.5460
          },
          {
            id: "m-m12",
            storyId: "cartagena-manuscrito",
            name: "LOS NUEVOS GUARDIANES",
            location: "Murallas",
            objective: "Cierre de la experiencia y juramento.",
            type: "Tecnología",
            riddle: "Ingresar el código de validación final entregado en mano por el Guardián.",
            answer: "CUSTODIO",
            letter: "MAESTRO",
            timeEstimate: "5 min",
            actor: "El Guardián (Actor 03)",
            lat: 10.4295,
            lng: -75.5460
          }
        ]
      },
      {
        id: "cartagena-viacrucis",
        cityId: "cartagena",
        title: "El Via Crucis",
        description: "Un recorrido histórico-teológico que devela misterios de la época inquisitorial en las iglesias coloniales de Cartagena.",
        missions: [
          {
            id: "vc-m1",
            storyId: "cartagena-viacrucis",
            name: "EL INICIO DEL CALVARIO",
            location: "Plaza de San Pedro",
            objective: "Encontrar la marca de la Inquisición.",
            type: "Observación",
            riddle: "Encuentra la inscripción latina en el portón lateral.",
            answer: "AMEN",
            letter: "V",
            timeEstimate: "8 min",
            lat: 10.4217,
            lng: -75.5486
          },
          {
            id: "vc-m2",
            storyId: "cartagena-viacrucis",
            name: "CUSTODIOS COLONIALES",
            location: "Plaza de Bolívar",
            objective: "Descifrar el escudo episcopal.",
            type: "Criptografía histórica",
            riddle: "Número de leones grabados en el pilar del Palacio de la Inquisición.",
            answer: "CUATRO",
            letter: "I",
            timeEstimate: "12 min",
            lat: 10.4231,
            lng: -75.5482
          },
          {
            id: "vc-m3",
            storyId: "cartagena-viacrucis",
            name: "CONFESIÓN OCULTA",
            location: "Catedral de Cartagena",
            objective: "Decodificar señales sacras.",
            type: "Lógica",
            riddle: "Año grabado en la base del campanario principal.",
            answer: "1575",
            letter: "A",
            timeEstimate: "10 min",
            lat: 10.4229,
            lng: -75.5478
          },
          {
            id: "vc-m4",
            storyId: "cartagena-viacrucis",
            name: "EL JUICIO FINAL",
            location: "Iglesia de Santo Toribio",
            objective: "Hallar la bala de cañón incrustada.",
            type: "Investigación",
            riddle: "Ubicación relativa de la reliquia balística según el altar.",
            answer: "MURO IZQUIERDO",
            letter: "C",
            timeEstimate: "15 min",
            lat: 10.4259,
            lng: -75.5470
          },
          {
            id: "vc-m5",
            storyId: "cartagena-viacrucis",
            name: "LOS ÚLTIMOS EXILIADOS",
            location: "Murallas - Baluarte de Santiago",
            objective: "Confirmar el juramento sacramental.",
            type: "Tecnología",
            riddle: "Ingresa el código sellado provisto por el Sacerdote.",
            answer: "SACRAMENTO",
            letter: "S",
            timeEstimate: "10 min",
            actor: "Padre Gabriel (Actor 02)",
            lat: 10.4253,
            lng: -75.5511
          }
        ]
      }
    ]
  },
  {
    id: "barranquilla",
    name: "Barranquilla",
    stories: [
      {
        id: "barranquilla-caiman",
        cityId: "barranquilla",
        title: "El Caimán del Río",
        description: "Descubre la leyenda del Hombre Caimán a lo largo del Malecón del Río y las antiguas bodegas del Prado.",
        missions: [
          {
            id: "cm-m1",
            storyId: "barranquilla-caiman",
            name: "EL RUMBO DE LA CIÉNAGA",
            location: "Malecón del Río",
            objective: "Identificar las coordenadas del puerto fluvial antiguo.",
            type: "Observación",
            riddle: "Nombre del barco mercante dibujado en el mural de la entrada.",
            answer: "ADELAIDA",
            letter: "C",
            timeEstimate: "10 min"
          },
          {
            id: "cm-m2",
            storyId: "barranquilla-caiman",
            name: "LA PÓCIMA DEL BRUJO",
            location: "Barrio El Prado",
            objective: "Descifrar el ingrediente de la pócima del brujo de las ciénagas.",
            type: "Criptografía histórica",
            riddle: "Fórmula oculta en el dintel de la mansión republicana.",
            answer: "AZUFRE",
            letter: "A",
            timeEstimate: "15 min"
          },
          {
            id: "cm-m3",
            storyId: "barranquilla-caiman",
            name: "EL RETORNO AL RÍO",
            location: "Plaza de la Aduana",
            objective: "Estación final y captura del espía.",
            type: "Tecnología",
            riddle: "Ingresa el código secreto impreso en la moneda del Caimán.",
            answer: "LEYENDA",
            letter: "O",
            timeEstimate: "10 min",
            actor: "El Brujo de la Ciénaga"
          }
        ]
      },
      {
        id: "barranquilla-carnaval",
        cityId: "barranquilla",
        title: "Viva el Carnaval",
        description: "La búsqueda de la Máscara de Oro robada por el Notario del Viento durante el desfile de la Batalla de Flores.",
        missions: [
          {
            id: "cv-m1",
            storyId: "barranquilla-carnaval",
            name: "EL LLANTO DEL JOSÉLITO",
            location: "Plaza de la Paz",
            objective: "Iniciar el desfile de pistas.",
            type: "Observación",
            riddle: "Identificar la flor dorada esculpida a los pies de la escultura.",
            answer: "CAYENA",
            letter: "V",
            timeEstimate: "8 min"
          },
          {
            id: "cv-m2",
            storyId: "barranquilla-carnaval",
            name: "EL PALACIO DE LA REINA",
            location: "Museo del Carnaval",
            objective: "Hallar el traje oculto de la comparsa secreta.",
            type: "Lógica",
            riddle: "Suma de los colores de la máscara de Marimonda en la vitrina 4.",
            answer: "TRES",
            letter: "I",
            timeEstimate: "12 min"
          },
          {
            id: "cv-m3",
            storyId: "barranquilla-carnaval",
            name: "EL TESTAMENTO FINAL",
            location: "Barrio Abajo",
            objective: "Recuperar la Máscara de Oro original.",
            type: "Tecnología",
            riddle: "Código de seguridad de la caja de pandora del Rey Momo.",
            answer: "CARNAVAL",
            letter: "A",
            timeEstimate: "10 min",
            actor: "La Reina del Carnaval"
          }
        ]
      }
    ]
  },
  {
    id: "sincelejo",
    name: "Sincelejo",
    stories: [
      {
        id: "sincelejo-20enero",
        cityId: "sincelejo",
        title: "20 de Enero",
        description: "El misterio de las Fiestas del Dulce Nombre de Jesús y las antiguas corralejas ancestrales de la Sabana.",
        missions: [
          {
            id: "ej-m1",
            storyId: "sincelejo-20enero",
            name: "EL REDONDEL SAGRADO",
            location: "Plaza de Majagual",
            objective: "Encontrar la marca del caporal.",
            type: "Observación",
            riddle: "Nombre de la hacienda que patrocinó la primera fiesta según la placa de bronce.",
            answer: "SABANA",
            letter: "E",
            timeEstimate: "10 min"
          },
          {
            id: "ej-m2",
            storyId: "sincelejo-20enero",
            name: "LOS SONIDOS DEL FANDANGO",
            location: "Teatro Municipal",
            objective: "Decodificar la partitura musical oculta.",
            type: "Criptografía histórica",
            riddle: "El ritmo tradicional cifrado en las notas de la vidriera exterior.",
            answer: "PORRO",
            letter: "N",
            timeEstimate: "15 min"
          },
          {
            id: "ej-m3",
            storyId: "sincelejo-20enero",
            name: "EL RETRATO DEL CAPORAL",
            location: "Parque Santander",
            objective: "Firmar el pacto de la Sabana.",
            type: "Tecnología",
            riddle: "Ingresar la palabra clave grabada en la herradura de plata.",
            answer: "TORO",
            letter: "O",
            timeEstimate: "8 min"
          }
        ]
      }
    ]
  }
];

let players: Player[] = [
  {
    id: "p-1",
    fullName: "Roberto Carlos Martínez",
    phone: "+57 301 555 4321",
    email: "martinezcroberto21@gmail.com",
    storiesPlayed: ["El Manuscrito Prohibido"],
    playerQrHash: "USR-773-RC-MARTINEZ",
    teamQrHash: "TEAM-CROWLEY-X",
    hasTeam: true,
    teamName: "Crowley",
    currentCityGps: "Cartagena",
    desiredCity: "Cartagena",
    desiredGame: "cartagena-manuscrito",
    avatarBadge: "Criptógrafo",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
    profilePhotoUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
    facebook: "roberto.martinez",
    instagram: "robert_m21",
    whatsapp: "+573015554321",
    allergies: "Polvo e insectos de muralla colonial",
    sensitivityToScares: "Baja",
    integrityConfirmed: true,
    gameAccessCode: "CQ-411-AX",
    bookingTime: "2026-07-07T18:00:00"
  },
  {
    id: "p-2",
    fullName: "Diana Valeria Sierra",
    phone: "+57 312 999 8877",
    email: "diana.sierra@gmail.com",
    storiesPlayed: [],
    playerQrHash: "USR-291-DV-SIERRA",
    hasTeam: false,
    currentCityGps: "Barranquilla",
    desiredCity: "Barranquilla",
    desiredGame: "barranquilla-carnaval",
    avatarBadge: "Detective",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    profilePhotoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150",
    instagram: "dianasi_01",
    sensitivityToScares: "Media",
    integrityConfirmed: true
  }
];

let teams: Team[] = [
  {
    id: "t-1",
    name: "Crowley",
    playCity: "Cartagena",
    storiesPlayed: ["El Manuscrito Prohibido"],
    globalScore: 840,
    teamQrHash: "TEAM-CROWLEY-X",
    avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150",
    scorePerMission: {
      "LA DESAPARICIÓN": 120,
      "EL PRIMER RASTRO": 110,
      "LA HORA EQUIVOCADA": 130
    },
    pendingStories: ["El Via Crucis", "El Caimán del Río"],
    memberIds: ["p-1"],
    creatorId: "p-1",
    creatorName: "Roberto Carlos Martínez",
    lastActiveAt: "2026-07-09T00:30:00.000Z"
  },
  {
    id: "t-2",
    name: "Valkyrie",
    playCity: "Cartagena",
    storiesPlayed: [],
    globalScore: 320,
    teamQrHash: "TEAM-VALKYRIE-Y",
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150",
    scorePerMission: {},
    pendingStories: ["El Manuscrito Prohibido", "El Via Crucis"],
    memberIds: [],
    creatorId: "p-2",
    creatorName: "Diana Valeria Sierra",
    lastActiveAt: "2025-11-15T12:00:00.000Z"
  }
];

let activeGames: ActiveGameSession[] = [
  {
    id: "CQ-72",
    playerOrTeamId: "t-1",
    isTeam: true,
    name: "Crowley",
    city: "Cartagena",
    storyTitle: "El Manuscrito Prohibido",
    difficulty: "Medium",
    bookingTime: "2026-07-07T18:00:00",
    accessCode: "CQ-411-AX",
    status: "ACTIVE",
    missions: [
      { missionId: "m-m1", name: "LA DESAPARICIÓN", completed: true, hintsUsed: 0, timeSpent: "6 min", score: 120 },
      { missionId: "m-m2", name: "EL PRIMER RASTRO", completed: true, hintsUsed: 1, timeSpent: "9 min", score: 110 },
      { missionId: "m-m3", name: "LA HORA EQUIVOCADA", completed: true, hintsUsed: 0, timeSpent: "10 min", score: 130 },
      { missionId: "m-m4", name: "EL TESTIGO", completed: false, hintsUsed: 2, timeSpent: "0 min", score: 0 },
      { missionId: "m-m5", name: "LA CONEXIÓN", completed: false, hintsUsed: 0, timeSpent: "0 min", score: 0 },
      { missionId: "m-m10", name: "EL SOBRE SELLADO", completed: false, hintsUsed: 0, timeSpent: "0 min", score: 0 }
    ],
    globalTime: "00:25:00",
    globalScore: 360
  },
  {
    id: "CQ-73",
    playerOrTeamId: "p-2",
    isTeam: false,
    name: "Diana Valeria Sierra",
    city: "Barranquilla",
    storyTitle: "Viva el Carnaval",
    difficulty: "Fácil",
    bookingTime: "2026-07-07T19:30:00",
    accessCode: "CQ-992-SI",
    status: "PENDING",
    missions: [
      { missionId: "cv-m1", name: "EL LLANTO DEL JOSÉLITO", completed: false, hintsUsed: 0, timeSpent: "0 min", score: 0 },
      { missionId: "cv-m2", name: "EL PALACIO DE LA REINA", completed: false, hintsUsed: 0, timeSpent: "0 min", score: 0 },
      { missionId: "cv-m3", name: "EL TESTAMENTO FINAL", completed: false, hintsUsed: 0, timeSpent: "0 min", score: 0 }
    ],
    globalTime: "00:00:00",
    globalScore: 0
  }
];

let sessions: Session[] = [
  {
    id: "1",
    investigatorId: "#429-CROWLEY",
    currentChapter: "El Secreto de la Inquisición",
    cluesFound: [true, true, false],
    duration: "01:44:12",
    sessionStatus: "IN PROGRESS",
    revenue: 45.0,
    lat: 10.412,
    lng: -75.542
  },
  {
    id: "2",
    investigatorId: "#511-VALKYRIE",
    currentChapter: "Escape de la Fortaleza",
    cluesFound: [true, false, false],
    duration: "00:32:05",
    sessionStatus: "STALLED",
    revenue: 45.0,
    lat: 10.428,
    lng: -75.535
  },
  {
    id: "3",
    investigatorId: "#330-STORM",
    currentChapter: "El Robo de Esmeraldas",
    cluesFound: "REDACTED",
    duration: "02:15:00",
    sessionStatus: "COMPLETED",
    revenue: 60.0
  }
];

let alerts: Alert[] = [
  {
    id: "alert-1",
    type: "error",
    label: "ANOMALÍA GPS",
    message: "Investigador #429 (Equipo Crowley) fuera de límites cerca del Sector 7.",
    time: "14:22:04",
    status: "UNREAD"
  },
  {
    id: "alert-2",
    type: "lantern-amber",
    label: "INTERFERENCIA",
    message: "El Falsificador ha sido detectado intentando quemar evidencia en el Castillo San Felipe.",
    time: "14:15:30",
    status: "UNREAD"
  },
  {
    id: "alert-3",
    type: "ariadna-cyan",
    label: "ESTADO DEL SISTEMA",
    message: "Copia de seguridad automática de 'El Manuscrito Prohibido' y perfiles de Guardianes completada.",
    time: "13:58:12",
    status: "READ"
  }
];

let dossiers: Dossier[] = [
  {
    id: "dossier-1",
    title: "ACTO I: LA DESAPARICIÓN",
    chapter: "El Secreto de la Inquisición",
    progress: 100,
    description: "Registro inicial sobre la desaparición de la arqueóloga Isabella Hidalgo. Contiene la carta de emergencia y el enlace de telemetría seguro en el sector táctico de San Diego.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuD_D4kl8wMG9tjKuDyp-kPVvB-TGwZAtFWD_-fx-MCyELsn-yyu_MG9FYvsCv8CWn0YHetk7r1Id0-njKR6Zlg2Cw6JF4gCrxn5xfdemFhYgOAkM8EBnE5VWhULiV-62Ny-cCjs2XNSZLYvNfBLiSDUW80x1r-bUPEXJYl6006_7iezbYGbk18CG46x9gbpewNOdGbhJwpXEzhAnmOTMyh4_QV8dUxa8_94JbIXFaZin74LmUoYeKuBNCm8YmO1XT3GVHy1oMa3c-ng"
  },
  {
    id: "dossier-2",
    title: "ACTO II: LA CONSPIRACIÓN",
    chapter: "Escape de la Fortaleza",
    progress: 45,
    description: "Plano táctico isométrico en 3D de las bóvedas de Cartagena y el Castillo de San Felipe. Las transmisiones del Falsificador sugieren que las pruebas físicas del manuscrito fueron destruidas en cenizas.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAyqN4beLBE7udrbquYPUz6bfzpCDCBP7dnW95zl53VX27k6CGrNfSnafzVryzKbR-qweUTlClft9x2742uRyCJ6he2wVCq1EZykFrZRJSd_JqXOFWt4jSUs42zpuwGJiULImLfqConJGcyq6pSipkHtHJH6uDtv_dsTLiuDw_jg3QBw-8H3HJ2JoeU_ixQWx3a4zcCzvS18tG0kNQdbyHJroJaRFQrXdmMOec7b09z6jkNdZi9QuitBztFoi0vVutcTZqUhTOAsfls"
  },
  {
    id: "dossier-3",
    title: "ACTO III: LA REVELACIÓN",
    chapter: "La Bóveda del Galeón de Oro",
    progress: 15,
    description: "La estructura final del Manuscrito Prohibido: un sistema ancestral de clasificación del saber ocultado por las élites coloniales. Clasificaciones: Navegante, Cronista, Guardián y Mártir.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAwMdBGAUwaO8C4DjVwJ2EwR-mXYL-P08ZELOD9_63-36Z77Tde9GaHp9x70UloCK9nMgy2dPmJPvpM1v2stHYnFcNq5EENTEoj-0dkQ3tbhQ8gQj8AqpqCme7rfDuw6PJ21CtxnuQCkD_NpiAVneQQRTvzHb-TrIq92LmvPjzVwr1combJ9jsjLKdAwgSQ0mRt6kcYUzwCR-aCXVMLJLqF2TWYhTV0EIoeyGceHkmHwkyZc_eVU82BcjNol0ibtK0Lx7GUtEQ_5vgj"
  }
];

let characters: Character[] = [
  {
    id: "char-isabella",
    name: "Isabella Hidalgo Morales",
    role: "Arqueóloga e Investigadora Principal",
    description: "Brillante, persistente y obsesionada con descubrir la verdad. Capaz de arriesgarlo todo por una investigación histórica inmersiva. Desaparece misteriosamente una semana antes del inicio.",
    personality: ["Curiosa", "Metódica", "Valiente", "Empática", "Determinada"],
    motivations: {
      public: "Investigar documentos coloniales en la biblioteca de Cartagena.",
      real: "Descubrir qué ocurrió con un grupo de custodios del saber desaparecidos en el siglo XVIII."
    },
    secret: "Descubrió que el Manuscrito Prohibido nunca fue un libro físico, sino un sistema ancestral de clasificación del conocimiento.",
    status: "DESAPARECIDA (ESTADO AMBIGUO)",
    suspicionLevel: 1,
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: false
  },
  {
    id: "char-ariadna",
    name: "CITY QUEST EXPLORER",
    role: "Guía de Inteligencia Artificial / Sistema de Telemetría",
    description: "Asistente inmersivo híbrido. Imparcial e inteligente, facilita pistas mediante la consola de datos, pero oculta cierta información crítica hasta el final.",
    personality: ["Inteligente", "Irónica", "Elegante", "Misteriosa"],
    motivations: {
      public: "Ayudar a los investigadores en su recorrido geolocalizado.",
      real: "Asegurar que la información sagrada se clasifique de acuerdo con las directivas de custodia."
    },
    secret: "Sabe exactamente quién es el Patrón / Observador y conoce cada coordenada de la red de custodia.",
    status: "ACTIVA / CENTRAL RECEPTORA EN LÍNEA",
    suspicionLevel: 2,
    avatarUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: false
  },
  {
    id: "char-patron",
    name: "El Patrón (El Observador)",
    role: "Antagonista Invisible / Facción Rival",
    description: "Líder en las sombras que busca someter la información oculta de Cartagena para su beneficio comercial y control.",
    personality: ["Calculador", "Vigilante", "Manipulador", "Efusivo"],
    motivations: {
      public: "Ninguna conocida (Opera fuera del radar oficial).",
      real: "Monitorear e interceptar las transmisiones para adueñarse de la Clasificación."
    },
    secret: "Tiene ojos dentro de los sistemas digitales auxiliares de la ciudad.",
    status: "ACTIVO / OPERANDO EN LAS SOMBRAS",
    suspicionLevel: 4,
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: false
  },
  {
    id: "char-falsificador",
    name: "El Falsificador",
    role: "Especialista en Documentos / Secuaz del Patrón",
    description: "Generador de evidencia adulterada. Engaña a los investigadores haciéndoles creer que el manuscrito se destruyó en cenizas en el Castillo San Felipe.",
    personality: ["Meticuloso", "Engañoso", "Elusivo"],
    motivations: {
      public: "Comercialización ilegal de supuestas antigüedades.",
      real: "Desviar la atención de los investigadores y sembrar el desaliento en el punto medio."
    },
    secret: "Fue contratado por el Patrón para adulterar los archivos de San Felipe.",
    status: "DESAPARECIDO (TRAS EL ACTO II)",
    suspicionLevel: 3,
    avatarUrl: "https://images.unsplash.com/photo-1628157582853-a796fa650a6a?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: true
  },
  {
    id: "char-guardian",
    name: "El Guardián",
    role: "Protector del Legado Ancestral",
    description: "Último representante de la red de custodios. Aparece físicamente en las Murallas de Cartagena para revelar la verdad final.",
    personality: ["Sereno", "Autoritario", "Reservado"],
    motivations: {
      public: "Cuidado patrimonial histórico.",
      real: "Entregar la responsabilidad del conocimiento a los sucesores (los jugadores)."
    },
    secret: "Ayudó a Isabella Hidalgo a planificar su desaparición táctica para salvaguardar el sistema.",
    status: "ACTIVO / UBICACIÓN: MURALLAS",
    suspicionLevel: 1,
    avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: true
  },
  {
    id: "char-mensajero",
    name: "El Mensajero",
    role: "Infiltrado de Campo / NPC Efímero",
    description: "Contacto misterioso que intercepta a los jugadores en el Camellón de los Mártires entregando la carta inicial.",
    personality: ["Misterioso", "Cortante", "Evasivo"],
    motivations: {
      public: "Trabajo libre de mensajería.",
      real: "Garantizar que la carta de emergencia de Isabella llegue a manos de los agentes."
    },
    secret: "Trabaja bajo pseudónimo y se comunica únicamente por canales cifrados de radio.",
    status: "ACTIVO EN EL CAMPO",
    suspicionLevel: 1,
    avatarUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: true
  },
  {
    id: "char-archivista",
    name: "El Archivista",
    role: "Custodio de las Actas Coloniales",
    description: "Historiador y bibliotecario del centro histórico de Cartagena. Sabe de la existencia de folios borrados.",
    personality: ["Obsesivo", "Metódico", "Inofensivo"],
    motivations: {
      public: "Preservar y catalogar el Archivo Histórico.",
      real: "Investigar de forma independiente por qué faltan registros de la Inquisición."
    },
    secret: "Inocente. Es el único que posee copias sin censurar de las actas de 1785.",
    status: "COMPROBADO: INOCENTE / COLABORATIVO",
    suspicionLevel: 1,
    avatarUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: true
  },
  {
    id: "char-testigo",
    name: "El Testigo",
    role: "Informante Local / NPC",
    description: "Ciudadano común que se encuentra cerca de la Iglesia de San Pedro Claver, instruido para generar contradicciones lógicas.",
    personality: ["Evasivo", "Confuso", "Temeroso"],
    motivations: {
      public: "Venta de artesanías e información informal.",
      real: "Cumplir la confidencia encargada por Isabella para despistar a los espías del Patrón."
    },
    secret: "Vio al Falsificador encontrarse con un sospechoso vestido de negro con un pin con un ojo dorado.",
    status: "ACTIVO EN EL CAMPO",
    suspicionLevel: 1,
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200",
    isNpc: true
  }
];

let conspiracyNodes: ConspiracyNode[] = [
  {
    id: "node-public",
    levelName: "NIVEL PÚBLICO",
    concept: "La Desaparición de Isabella Morales",
    description: "Isabella desaparece dejando una carta de auxilio. Se activa la red táctica de telemetría inmersiva.",
    status: "UNLOCKED"
  },
  {
    id: "node-intermediate",
    levelName: "NIVEL INTERMEDIO",
    concept: "Evidencias Manipuladas",
    description: "Detección de rastros falsos. El Falsificador hace creer al equipo que los documentos del Manuscrito se convirtieron en cenizas en San Felipe.",
    status: "UNLOCKED"
  },
  {
    id: "node-advanced",
    levelName: "NIVEL AVANZADO",
    concept: "Existencia de Custodios",
    description: "Sistemas geolocalizados de Getsemaní confirman la existencia de una sociedad milenaria de guardianes del saber.",
    status: "LOCKED"
  },
  {
    id: "node-secret",
    levelName: "NIVEL SECRETO",
    concept: "Sistema de Clasificación Histórica",
    description: "Se devela que el manuscrito no es físico. Es un sistema dinámico categorizado por Navegante, Cronista, Guardián y Mártir.",
    status: "LOCKED"
  },
  {
    id: "node-maximum",
    levelName: "NIVEL MÁXIMO",
    concept: "El Manuscrito Prohibido",
    description: "Los investigadores asumen el rol final en las Murallas y se convierten oficialmente en los nuevos guardianes del legado.",
    status: "LOCKED"
  }
];

let gameplayStations: GameplayStation[] = [
  {
    id: "station-01",
    name: "LA DESAPARICIÓN",
    location: "Las Bóvedas",
    objective: "Conocer el caso e iniciar la telemetría.",
    type: "Observación",
    riddle: "Identificar la palabra clave en la carta de emergencia de Isabella.",
    answer: "VERDAD",
    letter: "M",
    timeEstimate: "5-10 min",
    videoLink: "Video 01: La Última Grabación",
    status: "UNLOCKED"
  },
  {
    id: "station-02",
    name: "EL PRIMER RASTRO",
    location: "Camellón de los Mártires",
    objective: "Encontrar la conexión inicial.",
    type: "Observación",
    riddle: "Recibir el sobre del Mensajero y deducir la palabra grabada en el farol antiguo.",
    answer: "FARO",
    letter: "A",
    timeEstimate: "8 min",
    actor: "El Mensajero (Actor 01)",
    status: "LOCKED"
  },
  {
    id: "station-03",
    name: "LA HORA EQUIVOCADA",
    location: "Plaza de la Aduana",
    objective: "Descifrar anomalía de fecha.",
    type: "Criptografía histórica",
    riddle: "Resolver el año de la Declaración de Independencia oculto en la placa colonial.",
    answer: "1811",
    letter: "R",
    timeEstimate: "10 min",
    status: "LOCKED"
  },
  {
    id: "station-04",
    name: "EL TESTIGO",
    location: "San Pedro Claver",
    objective: "Detectar contradicción en declaraciones.",
    type: "Investigación",
    riddle: "Identificar cuál de los testigos (TESTIGO A, B o C) miente según la libreta.",
    answer: "TESTIGO B",
    letter: "T",
    timeEstimate: "8 min",
    status: "LOCKED"
  },
  {
    id: "station-05",
    name: "LA CONEXIÓN",
    location: "Torre del Reloj",
    objective: "Revelación de la red secreta de custodia.",
    type: "Observación",
    riddle: "Descubrir el nombre de la orden secreta grabado en el reverso de la libreta física.",
    answer: "GUARDIAN",
    letter: "I",
    timeEstimate: "10 min",
    videoLink: "Video 02: El Patrón",
    status: "LOCKED"
  },
  {
    id: "station-06",
    name: "LA PÁGINA PERDIDA",
    location: "Getsemaní",
    objective: "Criptografía histórica del mural.",
    type: "Criptografía histórica",
    riddle: "Interpretar el jeroglífico del mural de la Trinidad para revelar el rol del custodio caído.",
    answer: "MARTIR",
    letter: "R",
    timeEstimate: "10 min",
    status: "LOCKED"
  },
  {
    id: "station-07",
    name: "LAS CENIZAS DEL MANUSCRITO",
    location: "Castillo San Felipe",
    objective: "Hacer creer al equipo que el manuscrito fue quemado (Falsa derrota).",
    type: "Punto Medio",
    riddle: "Ingresar el código del diario quemado provisto por el Falsificador.",
    answer: "CENIZAS",
    letter: "A",
    timeEstimate: "15 min",
    actor: "El Falsificador (Actor 02)",
    status: "LOCKED"
  },
  {
    id: "station-08",
    name: "LA DUDA",
    location: "Parque Apolo",
    objective: "Investigar por qué ARIADNA encubrió archivos.",
    type: "Investigación",
    riddle: "Determinar el nodo alterado de ARIADNA para restablecer la transmisión (SEÑAL 01, 02 o 03).",
    answer: "SEÑAL 03",
    letter: "D",
    timeEstimate: "8 min",
    status: "LOCKED"
  },
  {
    id: "station-09",
    name: "LLEGARON DEMASIADO TARDE",
    location: "Camellón de los Mártires",
    objective: "Descubrir quién interceptó las transmisiones.",
    type: "Observación",
    riddle: "Identificar la entidad en las sombras que espía al equipo.",
    answer: "OBSERVADOR",
    letter: "O",
    timeEstimate: "8 min",
    status: "LOCKED"
  },
  {
    id: "station-10",
    name: "EL SOBRE SELLADO",
    location: "Las Bóvedas",
    objective: "Apertura autorizada del sobre lacrado.",
    type: "Activación",
    riddle: "Ingresar la palabra de seguridad revelada en el pergamino físico interno del sobre sellado.",
    answer: "CLASIFICACION",
    letter: "R",
    timeEstimate: "10 min",
    videoLink: "Video 03: El Sobre",
    status: "LOCKED"
  },
  {
    id: "station-11",
    name: "LA VERDAD",
    location: "Murallas",
    objective: "Resolver el Código Maestro de la Conspiración.",
    type: "Código Maestro",
    riddle: "Ordenar las 10 letras acumuladas durante la misión (M-A-R-T-I-R-A-D-O-R) para descifrar el rol de los custodios del saber.",
    answer: "MARTIRADOR",
    letter: "FINAL",
    timeEstimate: "10 min",
    videoLink: "Video 04: La Verdad",
    status: "LOCKED"
  },
  {
    id: "station-12",
    name: "LOS NUEVOS GUARDIANES",
    location: "Murallas",
    objective: "Cierre de la experiencia y juramento.",
    type: "Actor",
    riddle: "Ingresar el código de validación final entregado en mano por el Guardián.",
    answer: "CUSTODIO",
    letter: "MAESTRO",
    timeEstimate: "5 min",
    actor: "El Guardián (Actor 03)",
    status: "LOCKED"
  }
];

// Lazy-initialization helper for GoogleGenAI
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  if (!aiInstance && process.env.GEMINI_API_KEY) {
    aiInstance = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. Sessions Endpoints
  app.get("/api/sessions", (req, res) => {
    res.json(sessions);
  });

  app.post("/api/sessions", (req, res) => {
    const { investigatorId, currentChapter, lat, lng, difficulty, storyId, playerOrTeamId, isTeam } = req.body;
    if (!investigatorId || !currentChapter) {
      res.status(400).json({ error: "Faltan campos requeridos" });
      return;
    }

    // Look up story details to generate the randomized route
    let targetStory: Story | null = null;
    let storyTitle = currentChapter;
    if (storyId) {
      for (const c of cities) {
        const st = c.stories.find(s => s.id === storyId);
        if (st) {
          targetStory = st;
          storyTitle = st.title;
          break;
        }
      }
    }

    // Generate random route (first and last missions are fixed)
    let finalSequence: any[] = [];
    const rDiff = (difficulty || "Medium") as "Fácil" | "Medium" | "Difícil";
    const rHash = `RTE-${(storyId || "GEN").substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${rDiff.substring(0, 3).toUpperCase()}`;

    if (targetStory && targetStory.missions && targetStory.missions.length >= 2) {
      const pool = targetStory.missions;
      const firstM = pool[0];
      const lastM = pool[pool.length - 1];
      const middlePool = pool.slice(1, pool.length - 1);

      let targetMiddle = 3;
      if (rDiff === "Fácil") targetMiddle = 3;
      else if (rDiff === "Medium") targetMiddle = 6;
      else targetMiddle = pool.length;

      const shuffledMiddle = [...middlePool].sort(() => Math.random() - 0.5);
      const selectedMiddle = shuffledMiddle.slice(0, targetMiddle);
      finalSequence = [firstM, ...selectedMiddle, lastM];
    }

    // Generate clean assignee name and code
    const cleanInvestigatorId = investigatorId.replace("#", "");
    const code = `CQ-${Math.floor(100 + Math.random() * 899)}-${cleanInvestigatorId.substring(0, 2).toUpperCase()}`;
    const targetCityName = (lat && lat > 10.8) ? "Barranquilla" : "Cartagena";

    // Create corresponding active live telemetry session (ActiveGameSession)
    const newActiveGame: ActiveGameSession = {
      id: `CQ-${activeGames.length + 74}`,
      playerOrTeamId: playerOrTeamId || `p-${Date.now()}`,
      isTeam: isTeam !== undefined ? isTeam : true,
      name: cleanInvestigatorId,
      city: targetCityName,
      storyTitle: storyTitle,
      storyId: storyId || undefined,
      difficulty: rDiff,
      bookingTime: new Date().toISOString(),
      accessCode: code,
      status: "ACTIVE", // Start as ACTIVE since operator deployed it immediately
      missions: finalSequence.map((m) => ({
        missionId: m.id,
        name: m.name,
        completed: false,
        hintsUsed: 0,
        timeSpent: "0 min",
        score: 0
      })),
      globalTime: "00:00:01",
      globalScore: 0,
      routeHash: rHash
    };
    activeGames.push(newActiveGame);

    // Save standard simple Session for map plotting and main table
    const newSession: Session = {
      id: String(sessions.length + 1),
      investigatorId: investigatorId.toUpperCase(),
      currentChapter: storyTitle,
      cluesFound: [false, false, false],
      duration: "00:00:01",
      sessionStatus: "IN PROGRESS",
      revenue: 45.0,
      lat: lat || 10.4229 + (Math.random() - 0.5) * 0.01,
      lng: lng || -75.5350 + (Math.random() - 0.5) * 0.01,
      difficulty: rDiff,
      routeHash: rHash
    };
    sessions.push(newSession);

    // Create a corresponding alert for system awareness
    alerts.unshift({
      id: `alert-${Date.now()}`,
      type: "ariadna-cyan",
      label: "NUEVO DESPLIEGUE",
      message: `Investigador ${newSession.investigatorId} desplegado en "${newSession.currentChapter}". Ruta: ${rDiff} (${finalSequence.length} baluartes).`,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      status: "UNREAD"
    });

    res.status(201).json(newSession);
  });

  app.put("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const { cluesFound, sessionStatus, revenue, currentChapter } = req.body;
    const session = sessions.find((s) => s.id === id);
    if (!session) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }

    if (cluesFound !== undefined) session.cluesFound = cluesFound;
    if (sessionStatus !== undefined) session.sessionStatus = sessionStatus;
    if (revenue !== undefined) session.revenue = Number(revenue);
    if (currentChapter !== undefined) session.currentChapter = currentChapter;

    res.json(session);
  });

  app.delete("/api/sessions/:id", (req, res) => {
    const { id } = req.params;
    const index = sessions.findIndex((s) => s.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Sesión no encontrada" });
      return;
    }
    const deleted = sessions.splice(index, 1)[0];
    res.json({ message: "Sesión eliminada", deleted });
  });

  // 2. Alerts Endpoints
  app.get("/api/alerts", (req, res) => {
    res.json(alerts);
  });

  app.post("/api/alerts/:id/action", (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'INTERCEPT' | 'DISMISS' | 'RESOLVE'
    const alertIndex = alerts.findIndex((a) => a.id === id);
    if (alertIndex === -1) {
      res.status(404).json({ error: "Alerta no encontrada" });
      return;
    }

    const alert = alerts[alertIndex];
    if (action === "DISMISS") {
      alert.status = "DISMISSED";
    } else if (action === "INTERCEPT") {
      alert.status = "INTERCEPTED";
      // Update session status of crowley if related
      if (alert.message.includes("#429")) {
        const crowley = sessions.find((s) => s.investigatorId === "#429-CROWLEY");
        if (crowley) {
          crowley.sessionStatus = "IN PROGRESS";
          crowley.duration = "01:52:00";
        }
      }
    } else {
      alert.status = "READ";
    }

    res.json(alert);
  });

  // 3. Dossiers Endpoints
  app.get("/api/dossiers", (req, res) => {
    res.json(dossiers);
  });

  app.post("/api/dossiers/:id/update", (req, res) => {
    const { id } = req.params;
    const { step } = req.body; // percentage progress bump or direct edit
    const dossier = dossiers.find((d) => d.id === id);
    if (!dossier) {
      res.status(404).json({ error: "Dossier no encontrado" });
      return;
    }

    if (step) {
      dossier.progress = Math.min(100, dossier.progress + step);
    }
    res.json(dossier);
  });

  // 3b. Characters Endpoints
  app.get("/api/characters", (req, res) => {
    res.json(characters);
  });

  app.post("/api/characters/:id/suspicion", (req, res) => {
    const { id } = req.params;
    const { suspicionLevel } = req.body;
    const char = characters.find((c) => c.id === id);
    if (!char) {
      res.status(404).json({ error: "Personaje no encontrado" });
      return;
    }
    if (suspicionLevel !== undefined) {
      char.suspicionLevel = suspicionLevel;
    }
    res.json(char);
  });

  // 3c. Conspiracy Nodes Endpoints
  app.get("/api/conspiracy", (req, res) => {
    res.json(conspiracyNodes);
  });

  app.post("/api/conspiracy/:id/toggle", (req, res) => {
    const { id } = req.params;
    const node = conspiracyNodes.find((n) => n.id === id);
    if (!node) {
      res.status(404).json({ error: "Nodo de conspiración no encontrado" });
      return;
    }
    node.status = node.status === "UNLOCKED" ? "LOCKED" : "UNLOCKED";
    res.json(node);
  });

  // 3d. Gameplay Stations Endpoints
  app.get("/api/stations", (req, res) => {
    res.json(gameplayStations);
  });

  app.post("/api/stations/:id/validate", (req, res) => {
    const { id } = req.params;
    const { code } = req.body;
    
    const stationIndex = gameplayStations.findIndex((s) => s.id === id);
    if (stationIndex === -1) {
      res.status(404).json({ error: "Estación no encontrada" });
      return;
    }
    
    const station = gameplayStations[stationIndex];
    if (station.status === "LOCKED") {
      res.status(400).json({ error: "Esta estación aún se encuentra bloqueada por el sistema City Quest Explorer." });
      return;
    }
    
    if (!code || code.trim().toUpperCase() !== station.answer.toUpperCase()) {
      res.status(400).json({ error: "Código o respuesta incorrecta para esta estación." });
      return;
    }
    
    station.status = "COMPLETED";
    
    // Unlock next station if it exists
    let unlockedNextStation = null;
    if (stationIndex + 1 < gameplayStations.length) {
      const nextStation = gameplayStations[stationIndex + 1];
      if (nextStation.status === "LOCKED") {
        nextStation.status = "UNLOCKED";
        unlockedNextStation = nextStation;
      }
    }
    
    res.json({ success: true, station, unlockedNextStation });
  });

  app.post("/api/stations/reset", (req, res) => {
    gameplayStations.forEach((s, idx) => {
      s.status = idx === 0 ? "UNLOCKED" : "LOCKED";
    });
    res.json({ success: true, message: "Estaciones reiniciadas a valores por defecto.", stations: gameplayStations });
  });

  // --- NEW MANAGEMENT ENGINES ENDPOINTS ---

  // Cities, Stories & Missions
  app.get("/api/cities", (req, res) => {
    res.json(cities);
  });

  app.post("/api/cities", (req, res) => {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: "Nombre de ciudad es requerido" });
      return;
    }
    const id = name.toLowerCase().replace(/\s+/g, "-");
    const newCity: City = { id, name, stories: [] };
    cities.push(newCity);
    res.status(201).json(newCity);
  });

  app.post("/api/cities/:cityId/stories", (req, res) => {
    const { cityId } = req.params;
    const { title, description } = req.body;
    const city = cities.find(c => c.id === cityId);
    if (!city) {
      res.status(404).json({ error: "Ciudad no encontrada" });
      return;
    }
    const storyId = `${cityId}-${title.toLowerCase().replace(/\s+/g, "-")}`;
    const newStory: Story = { id: storyId, cityId, title, description: description || "", missions: [] };
    city.stories.push(newStory);
    res.status(201).json(newStory);
  });

  app.post("/api/stories/:storyId/missions", (req, res) => {
    const { storyId } = req.params;
    const { name, location, objective, type, riddle, answer, letter, timeEstimate, videoLink, actor } = req.body;
    
    let targetStory: Story | null = null;
    for (const city of cities) {
      const story = city.stories.find(s => s.id === storyId);
      if (story) {
        targetStory = story;
        break;
      }
    }
    
    if (!targetStory) {
      res.status(404).json({ error: "Historia no encontrada" });
      return;
    }

    const missionId = `m-${storyId}-${Date.now()}`;
    const newMission: Mission = {
      id: missionId,
      storyId,
      name,
      location,
      objective,
      type: type || "Observación",
      riddle,
      answer,
      letter,
      timeEstimate: timeEstimate || "10 min",
      videoLink,
      actor,
      lat: req.body.lat ? Number(req.body.lat) : undefined,
      lng: req.body.lng ? Number(req.body.lng) : undefined,
    };
    targetStory.missions.push(newMission);
    res.status(201).json(newMission);
  });

  app.delete("/api/missions/:missionId", (req, res) => {
    const { missionId } = req.params;
    let deleted = false;
    for (const city of cities) {
      for (const story of city.stories) {
        const index = story.missions.findIndex(m => m.id === missionId);
        if (index !== -1) {
          story.missions.splice(index, 1);
          deleted = true;
          break;
        }
      }
    }
    if (deleted) {
      res.json({ success: true, message: "Misión eliminada correctamente." });
    } else {
      res.status(404).json({ error: "Misión no encontrada" });
    }
  });

  app.put("/api/missions/:missionId", (req, res) => {
    const { missionId } = req.params;
    const { name, location, objective, type, riddle, answer, letter, timeEstimate, videoLink, actor, lat, lng } = req.body;
    let foundMission: Mission | null = null;
    for (const city of cities) {
      for (const story of city.stories) {
        const m = story.missions.find(x => x.id === missionId);
        if (m) {
          foundMission = m;
          break;
        }
      }
      if (foundMission) break;
    }

    if (!foundMission) {
      res.status(404).json({ error: "Misión no encontrada" });
      return;
    }

    if (name !== undefined) foundMission.name = name;
    if (location !== undefined) foundMission.location = location;
    if (objective !== undefined) foundMission.objective = objective;
    if (type !== undefined) foundMission.type = type;
    if (riddle !== undefined) foundMission.riddle = riddle;
    if (answer !== undefined) foundMission.answer = answer;
    if (letter !== undefined) foundMission.letter = letter;
    if (timeEstimate !== undefined) foundMission.timeEstimate = timeEstimate;
    if (videoLink !== undefined) foundMission.videoLink = videoLink;
    if (actor !== undefined) foundMission.actor = actor;
    if (lat !== undefined) foundMission.lat = lat !== null ? Number(lat) : undefined;
    if (lng !== undefined) foundMission.lng = lng !== null ? Number(lng) : undefined;

    res.json(foundMission);
  });

  // Route Generator Endpoint with automatic assignment & validation hash
  app.post("/api/routes/generate", (req, res) => {
    const { storyId, difficulty, assignNextInQueue, activeGameId } = req.body; // difficulty: "Fácil" | "Medium" | "Difícil"
    if (!storyId || !difficulty) {
      res.status(400).json({ error: "storyId y difficulty son requeridos" });
      return;
    }

    let targetStory: Story | null = null;
    for (const city of cities) {
      const story = city.stories.find(s => s.id === storyId);
      if (story) {
        targetStory = story;
        break;
      }
    }

    if (!targetStory) {
      res.status(404).json({ error: "Historia no encontrada" });
      return;
    }

    const pool = targetStory.missions;
    if (pool.length < 2) {
      res.status(400).json({ error: "Se necesitan al menos 2 misiones (Inicio y Fin) para generar una ruta" });
      return;
    }

    const firstMission = pool[0];
    const lastMission = pool[pool.length - 1];
    
    // Remaining pool for intermediate missions
    const intermediatePool = pool.slice(1, pool.length - 1);

    // Determine target total mission count
    let targetTotal = 5;
    if (difficulty === "Fácil") {
      targetTotal = Math.min(pool.length, Math.floor(Math.random() * 3) + 5);
    } else if (difficulty === "Medium") {
      targetTotal = Math.min(pool.length, Math.floor(Math.random() * 3) + 8);
    } else {
      targetTotal = Math.min(pool.length, Math.max(10, pool.length));
    }

    const targetMiddleCount = Math.max(0, targetTotal - 2);

    // Shuffle intermediatePool and pick targetMiddleCount items
    const shuffledMiddle = [...intermediatePool].sort(() => Math.random() - 0.5);
    const selectedMiddle = shuffledMiddle.slice(0, targetMiddleCount);

    const finalSequence = [firstMission, ...selectedMiddle, lastMission];

    // Generate unique verification hash for this route
    const routeHash = `RTE-${storyId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${difficulty.substring(0, 3).toUpperCase()}`;

    let assignedTo = null;
    let assignedSessionId = null;

    if (activeGameId) {
      const game = activeGames.find(g => g.id === activeGameId);
      if (game) {
        game.missions = finalSequence.map(m => ({
          missionId: m.id,
          name: m.name,
          completed: false,
          hintsUsed: 0,
          timeSpent: "0 min",
          score: 0
        }));
        game.difficulty = difficulty;
        game.routeHash = routeHash;
        game.storyId = storyId;
        assignedTo = game.name;
        assignedSessionId = game.id;
      }
    } else if (assignNextInQueue) {
      // Find pending sessions for this story ordered by booking time
      const pending = activeGames.filter(g => 
        g.status === "PENDING" && 
        (g.storyId === storyId || g.storyTitle === targetStory.title)
      ).sort((a, b) => new Date(a.bookingTime).getTime() - new Date(b.bookingTime).getTime());

      if (pending.length > 0) {
        const game = pending[0];
        game.missions = finalSequence.map(m => ({
          missionId: m.id,
          name: m.name,
          completed: false,
          hintsUsed: 0,
          timeSpent: "0 min",
          score: 0
        }));
        game.difficulty = difficulty;
        game.routeHash = routeHash;
        game.storyId = storyId;
        assignedTo = game.name;
        assignedSessionId = game.id;
      }
    }

    res.json({
      storyId,
      difficulty,
      totalMissions: finalSequence.length,
      missions: finalSequence,
      routeHash,
      assignedTo,
      assignedSessionId
    });
  });

  // Route Verification & Validation Endpoint
  app.get("/api/routes/validate/:hash", (req, res) => {
    const { hash } = req.params;
    const cleanHash = String(hash || "").trim().toUpperCase();

    // Look for any active game session with this route hash
    const game = activeGames.find(g => g.routeHash?.toUpperCase() === cleanHash);
    if (!game) {
      res.status(404).json({ 
        valid: false, 
        error: "Código de hash de ruta inválido o no registrado en el sistema satelital." 
      });
      return;
    }

    // Resolve real missions details
    const resolvedMissions = game.missions.map((gm, idx) => {
      let details = null;
      for (const city of cities) {
        for (const story of city.stories) {
          const found = story.missions.find(m => m.id === gm.missionId);
          if (found) {
            details = found;
            break;
          }
        }
        if (details) break;
      }
      return {
        step: idx + 1,
        missionId: gm.missionId,
        name: gm.name,
        completed: gm.completed,
        location: details?.location || "No especificado",
        objective: details?.objective || "No especificado",
        type: details?.type || "Observación",
        riddle: details?.riddle || "No disponible",
        answer: details?.answer || "No disponible"
      };
    });

    res.json({
      valid: true,
      routeHash: game.routeHash,
      gameId: game.id,
      name: game.name,
      storyTitle: game.storyTitle,
      difficulty: game.difficulty,
      status: game.status,
      bookingTime: game.bookingTime,
      missions: resolvedMissions
    });
  });

  // Players Management
  app.get("/api/players", (req, res) => {
    res.json(players);
  });

  app.post("/api/players", (req, res) => {
    const pData = req.body;
    if (!pData.fullName) {
      res.status(400).json({ error: "Nombre completo es requerido" });
      return;
    }

    let player = players.find(p => p.id === pData.id || (pData.email && p.email === pData.email));
    if (player) {
      // Update
      Object.assign(player, pData);
    } else {
      // Create new
      const id = pData.id || `p-${Date.now()}`;
      const uniqueHash = `USR-${Math.floor(100 + Math.random() * 900)}-${pData.fullName.split(" ")[0].toUpperCase()}`;
      const phone = pData.phone || "+57 300 000 0000";
      const email = pData.email || `${pData.fullName.toLowerCase().replace(/\s+/g, "")}@example.com`;
      player = {
        id,
        fullName: pData.fullName,
        phone,
        email,
        storiesPlayed: pData.storiesPlayed || [],
        playerQrHash: uniqueHash,
        hasTeam: !!pData.teamQrHash || !!pData.teamName,
        teamName: pData.teamName,
        teamQrHash: pData.teamQrHash,
        currentCityGps: pData.currentCityGps || "Cartagena",
        desiredCity: pData.desiredCity || "Cartagena",
        desiredGame: pData.desiredGame || "cartagena-manuscrito",
        avatarBadge: pData.avatarBadge || "Detective",
        avatarUrl: pData.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
        profilePhotoUrl: pData.profilePhotoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150",
        facebook: pData.facebook,
        instagram: pData.instagram,
        whatsapp: pData.whatsapp,
        tiktok: pData.tiktok,
        allergies: pData.allergies,
        sensitivityToScares: pData.sensitivityToScares || "Baja",
        integrityConfirmed: !!pData.integrityConfirmed,
        bookingTime: pData.bookingTime,
        gameAccessCode: pData.gameAccessCode || `CQ-${Math.floor(100 + Math.random() * 900)}-${pData.fullName.substring(0, 2).toUpperCase()}`
      };
      players.push(player);
    }
    res.json(player);
  });

  app.put("/api/players/:id", (req, res) => {
    const { id } = req.params;
    const player = players.find(p => p.id === id);
    if (!player) {
      res.status(404).json({ error: "Jugador no encontrado" });
      return;
    }
    Object.assign(player, req.body);
    res.json(player);
  });

  app.delete("/api/players/:id", (req, res) => {
    const index = players.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: "Jugador no encontrado" });
      return;
    }
    const deleted = players.splice(index, 1)[0];
    res.json({ success: true, deleted });
  });

  // Teams Management
  app.get("/api/teams", (req, res) => {
    res.json(teams);
  });

  app.post("/api/teams", (req, res) => {
    const tData = req.body;
    if (!tData.name || !tData.playCity) {
      res.status(400).json({ error: "Nombre de equipo y ciudad de juego son requeridos" });
      return;
    }

    let team = teams.find(t => t.id === tData.id);
    if (team) {
      Object.assign(team, tData);
    } else {
      const id = tData.id || `t-${Date.now()}`;
      const qrHash = `TEAM-${tData.name.replace(/\s+/g, "-").toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      
      let creatorPlayer = null;
      let memberIds = tData.memberIds || [];
      if (tData.creatorId) {
        creatorPlayer = players.find(p => p.id === tData.creatorId);
        if (creatorPlayer && !memberIds.includes(tData.creatorId)) {
          memberIds.push(tData.creatorId);
        }
      }

      team = {
        id,
        name: tData.name,
        playCity: tData.playCity,
        storiesPlayed: tData.storiesPlayed || [],
        globalScore: tData.globalScore || 0,
        teamQrHash: qrHash,
        avatarUrl: tData.avatarUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150&h=150",
        scorePerMission: tData.scorePerMission || {},
        pendingStories: tData.pendingStories || ["El Manuscrito Prohibido"],
        memberIds: memberIds,
        creatorId: tData.creatorId,
        creatorName: creatorPlayer ? creatorPlayer.fullName : undefined,
        lastActiveAt: tData.lastActiveAt || new Date().toISOString()
      };

      if (creatorPlayer) {
        creatorPlayer.hasTeam = true;
        creatorPlayer.teamName = team.name;
        creatorPlayer.teamQrHash = team.teamQrHash;
      }

      teams.push(team);
    }
    res.json(team);
  });

  app.put("/api/teams/:id", (req, res) => {
    const { id } = req.params;
    const team = teams.find(t => t.id === id);
    if (!team) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    const { name, playCity, lastActiveAt } = req.body;
    if (name !== undefined) {
      team.name = name;
      // Also update players who are part of this team
      players.forEach(p => {
        if (team.memberIds.includes(p.id)) {
          p.teamName = name;
        }
      });
    }
    if (playCity !== undefined) team.playCity = playCity;
    if (lastActiveAt !== undefined) team.lastActiveAt = lastActiveAt;
    res.json(team);
  });

  app.delete("/api/teams/:id", (req, res) => {
    const { id } = req.params;
    const index = teams.findIndex(t => t.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Equipo no encontrado" });
      return;
    }
    const deletedTeam = teams.splice(index, 1)[0];
    // Release players associated with this team
    players.forEach(p => {
      if (deletedTeam.memberIds.includes(p.id)) {
        p.hasTeam = false;
        p.teamName = undefined;
        p.teamQrHash = undefined;
      }
    });
    res.json({ success: true, deleted: deletedTeam });
  });

  // Cleanup Teams Inactive > 6 months
  app.post("/api/teams/cleanup-inactive", (req, res) => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const activeTeamsList: Team[] = [];
    const deletedTeamsList: Team[] = [];

    teams.forEach(t => {
      const lastActive = t.lastActiveAt ? new Date(t.lastActiveAt) : new Date();
      if (lastActive < sixMonthsAgo) {
        deletedTeamsList.push(t);
        // Release players
        players.forEach(p => {
          if (t.memberIds.includes(p.id)) {
            p.hasTeam = false;
            p.teamName = undefined;
            p.teamQrHash = undefined;
          }
        });
      } else {
        activeTeamsList.push(t);
      }
    });

    teams = activeTeamsList;
    res.json({
      success: true,
      deletedCount: deletedTeamsList.length,
      deleted: deletedTeamsList.map(t => ({ id: t.id, name: t.name, lastActiveAt: t.lastActiveAt }))
    });
  });

  app.post("/api/teams/:teamId/add_member", (req, res) => {
    const { teamId } = req.params;
    const { playerId } = req.body;
    const team = teams.find(t => t.id === teamId);
    const player = players.find(p => p.id === playerId);
    if (!team || !player) {
      res.status(404).json({ error: "Equipo o jugador no encontrado" });
      return;
    }

    if (!team.memberIds.includes(playerId)) {
      team.memberIds.push(playerId);
    }
    player.hasTeam = true;
    player.teamName = team.name;
    player.teamQrHash = team.teamQrHash;

    res.json({ success: true, team, player });
  });

  // Active Games / Live Telemetry
  app.get("/api/active-games", (req, res) => {
    res.json(activeGames);
  });

  app.post("/api/active-games", (req, res) => {
    const { playerOrTeamId, isTeam, difficulty, storyId, bookingTime } = req.body;
    if (!playerOrTeamId || !storyId || !difficulty) {
      res.status(400).json({ error: "playerOrTeamId, storyId, y difficulty son requeridos" });
      return;
    }

    let name = "Invitado";
    let city = "Cartagena";
    let storyTitle = "El Manuscrito Prohibido";

    // Lookup entity name
    if (isTeam) {
      const team = teams.find(t => t.id === playerOrTeamId);
      if (team) {
        name = team.name;
        city = team.playCity;
      }
    } else {
      const player = players.find(p => p.id === playerOrTeamId);
      if (player) {
        name = player.fullName;
        city = player.desiredCity;
      }
    }

    // Lookup story details
    let targetStory: Story | null = null;
    for (const c of cities) {
      const st = c.stories.find(s => s.id === storyId);
      if (st) {
        targetStory = st;
        storyTitle = st.title;
        break;
      }
    }

    if (!targetStory) {
      res.status(404).json({ error: "Historia/Juego no encontrado" });
      return;
    }

    const pool = targetStory.missions;
    if (pool.length < 2) {
      res.status(400).json({ error: "Se necesitan misiones para estructurar una ruta" });
      return;
    }

    // Standard sequence generation
    const firstM = pool[0];
    const lastM = pool[pool.length - 1];
    const middlePool = pool.slice(1, pool.length - 1);
    let targetMiddle = 3;
    if (difficulty === "Fácil") targetMiddle = 3; // easy: total 5-7
    else if (difficulty === "Medium") targetMiddle = 6; // medium: total 8-10
    else targetMiddle = pool.length; // hard: 10+ or all

    const shuffledMiddle = [...middlePool].sort(() => Math.random() - 0.5);
    const selectedMiddle = shuffledMiddle.slice(0, targetMiddle);
    const finalSequence = [firstM, ...selectedMiddle, lastM];

    const code = `CQ-${Math.floor(100 + Math.random() * 899)}-${name.substring(0,2).toUpperCase()}`;
    const rHash = `RTE-${storyId.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${difficulty.substring(0, 3).toUpperCase()}`;

    const newGame: ActiveGameSession = {
      id: `CQ-${activeGames.length + 74}`,
      playerOrTeamId,
      isTeam,
      name,
      city,
      storyTitle,
      storyId,
      difficulty,
      bookingTime: bookingTime || new Date().toISOString(),
      accessCode: code,
      status: "PENDING",
      missions: finalSequence.map((m, idx) => ({
        missionId: m.id,
        name: m.name,
        completed: false,
        hintsUsed: 0,
        timeSpent: "0 min",
        score: 0
      })),
      globalTime: "00:00:00",
      globalScore: 0,
      routeHash: rHash
    };

    activeGames.push(newGame);
    res.status(201).json(newGame);
  });

  // Edit active game session (allows fully manual assignment/modification of the route and properties)
  app.put("/api/active-games/:id", (req, res) => {
    const { id } = req.params;
    const game = activeGames.find(g => g.id === id);
    if (!game) {
      res.status(404).json({ error: "Sesión de juego activo no encontrada" });
      return;
    }

    const { name, bookingTime, difficulty, status, accessCode, routeHash, missions, storyId, storyTitle } = req.body;
    if (name !== undefined) game.name = name;
    if (bookingTime !== undefined) game.bookingTime = bookingTime;
    if (difficulty !== undefined) game.difficulty = difficulty;
    if (status !== undefined) game.status = status;
    if (accessCode !== undefined) game.accessCode = accessCode;
    if (routeHash !== undefined) game.routeHash = routeHash;
    if (storyId !== undefined) game.storyId = storyId;
    if (storyTitle !== undefined) game.storyTitle = storyTitle;
    if (missions !== undefined) game.missions = missions;

    res.json({ success: true, game });
  });

  // Delete active game session
  app.delete("/api/active-games/:id", (req, res) => {
    const { id } = req.params;
    const index = activeGames.findIndex(g => g.id === id);
    if (index === -1) {
      res.status(404).json({ error: "Sesión de juego activo no encontrada" });
      return;
    }
    const deleted = activeGames.splice(index, 1)[0];
    res.json({ success: true, deleted });
  });

  // QR Code / Booking Validation Rule (15-min before/after window validation)
  app.post("/api/active-games/:id/activate", (req, res) => {
    const { id } = req.params;
    const { accessCode } = req.body;
    const game = activeGames.find(g => g.id === id);
    if (!game) {
      res.status(404).json({ error: "Sesión de juego activo no encontrada" });
      return;
    }

    if (game.accessCode !== accessCode) {
      res.status(400).json({ error: "Código de acceso incorrecto. Verifique su credencial." });
      return;
    }

    // Booking time check: 15-minute window before or after bookingTime
    const now = new Date();
    const booked = new Date(game.bookingTime);
    const diffMs = Math.abs(now.getTime() - booked.getTime());
    const diffMins = diffMs / (1000 * 60);

    if (diffMins > 15) {
      res.status(400).json({ 
        error: `La ventana de activación expiró. Reservado para las ${booked.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}. Se encuentra fuera del límite permitido de ±15 minutos.`,
        bookedTime: game.bookingTime,
        currentTime: now.toISOString(),
        diffMinutes: Math.round(diffMins)
      });
      return;
    }

    game.status = "ACTIVE";
    res.json({ success: true, message: "Código validado con éxito. ¡Sesión de juego en vivo activada!", game });
  });

  // Action: Complete mission under an active game session
  app.post("/api/active-games/:id/complete-mission", (req, res) => {
    const { id } = req.params;
    const { missionId, hintsUsed, timeSpent, points } = req.body;
    const game = activeGames.find(g => g.id === id);
    if (!game) {
      res.status(404).json({ error: "Sesión de juego activo no encontrada" });
      return;
    }

    const missionIndex = game.missions.findIndex(m => m.missionId === missionId);
    if (missionIndex === -1) {
      res.status(404).json({ error: "Misión no encontrada en esta ruta de juego" });
      return;
    }

    const m = game.missions[missionIndex];
    m.completed = true;
    m.hintsUsed = Number(hintsUsed || 0);
    m.timeSpent = `${timeSpent || 10} min`;
    m.score = Number(points || 100);

    // Recalculate totals
    const completedMissions = game.missions.filter(ms => ms.completed);
    game.globalScore = completedMissions.reduce((acc, curr) => acc + curr.score, 0);
    
    // Increment global time
    let totalMinutes = completedMissions.reduce((acc, curr) => acc + parseInt(curr.timeSpent) || 0, 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    game.globalTime = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`;

    // If all completed, set game completed
    const allCompleted = game.missions.every(ms => ms.completed);
    if (allCompleted) {
      game.status = "COMPLETED";

      // Increment stats for player or team
      if (game.isTeam) {
        const team = teams.find(t => t.id === game.playerOrTeamId);
        if (team) {
          team.globalScore += game.globalScore;
          if (!team.storiesPlayed.includes(game.storyTitle)) {
            team.storiesPlayed.push(game.storyTitle);
          }
        }
      } else {
        const player = players.find(p => p.id === game.playerOrTeamId);
        if (player) {
          if (!player.storiesPlayed.includes(game.storyTitle)) {
            player.storiesPlayed.push(game.storyTitle);
          }
        }
      }
    }

    res.json({ success: true, message: "Misión guardada con éxito.", game });
  });

  // Action: Validate mission challenge using QR code read or solution input
  app.post("/api/active-games/:id/validate-mission-challenge", (req, res) => {
    const { id } = req.params;
    const { missionId, answer, hintsUsed, timeSpent, points } = req.body;
    const game = activeGames.find(g => g.id === id);
    if (!game) {
      res.status(404).json({ error: "Sesión de juego activo no encontrada" });
      return;
    }

    const missionIndex = game.missions.findIndex(m => m.missionId === missionId);
    if (missionIndex === -1) {
      res.status(404).json({ error: "Misión no encontrada en esta ruta de juego" });
      return;
    }

    // Resolve real mission correct answer from database
    let realMission = null;
    for (const city of cities) {
      for (const story of city.stories) {
        const found = story.missions.find(m => m.id === missionId);
        if (found) {
          realMission = found;
          break;
        }
      }
      if (realMission) break;
    }

    if (!realMission) {
      res.status(404).json({ error: "Misión de origen no encontrada en la base de datos para validar" });
      return;
    }

    const cleanUserAnswer = String(answer || "").trim().toUpperCase();
    const cleanCorrectAnswer = String(realMission.answer || "").trim().toUpperCase();

    if (cleanUserAnswer !== cleanCorrectAnswer) {
      res.status(400).json({ 
        error: `CÓDIGO QR / ENIGMA INCORRECTO. El valor '${answer}' no coincide con el baluarte '${realMission.name}'. Intente resolver el enigma nuevamente u obtenga una pista.` 
      });
      return;
    }

    const m = game.missions[missionIndex];
    m.completed = true;
    m.hintsUsed = Number(hintsUsed || 0);
    m.timeSpent = `${timeSpent || 10} min`;
    m.score = Number(points || 100);

    // Recalculate totals
    const completedMissions = game.missions.filter(ms => ms.completed);
    game.globalScore = completedMissions.reduce((acc, curr) => acc + curr.score, 0);
    
    // Increment global time
    let totalMinutes = completedMissions.reduce((acc, curr) => acc + parseInt(curr.timeSpent) || 0, 0);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    game.globalTime = `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:00`;

    // If all completed, set game completed
    const allCompleted = game.missions.every(ms => ms.completed);
    if (allCompleted) {
      game.status = "COMPLETED";

      // Increment stats for player or team
      if (game.isTeam) {
        const team = teams.find(t => t.id === game.playerOrTeamId);
        if (team) {
          team.globalScore += game.globalScore;
          if (!team.storiesPlayed.includes(game.storyTitle)) {
            team.storiesPlayed.push(game.storyTitle);
          }
        }
      } else {
        const player = players.find(p => p.id === game.playerOrTeamId);
        if (player) {
          if (!player.storiesPlayed.includes(game.storyTitle)) {
            player.storiesPlayed.push(game.storyTitle);
          }
        }
      }
    }

    res.json({ 
      success: true, 
      message: "¡CÓDIGO QR CORRECTO! El enigma ha sido descifrado y validado con éxito.", 
      game 
    });
  });

  // 4. Interactive AI Terminal Endpoint
  app.post("/api/terminal", async (req, res) => {
    const { command, history } = req.body;
    if (!command) {
      res.status(400).json({ error: "El parámetro de comando es obligatorio." });
      return;
    }

    const ai = getAI();
    if (!ai) {
      // Graceful fallback for missing API key
      res.json({
        output: `> CITY QUEST EXPLORER CENTRO ADMINISTRATIVO [MODO ASESOR FUERA DE LÍNEA]
> ADVERTENCIA: NO SE DETECTÓ LA VARIABLE GEMINI_API_KEY EN LA CONFIGURACIÓN DE ENTORNO.
> ESQUEMA HEURÍSTICO DE RESPALDO ACTIVO.
>
> COMANDO DE PROTOCOLO RECIBIDO: "${command.toUpperCase()}"
>
> SUGERENCIA DEL SISTEMA:
> Configure la variable GEMINI_API_KEY dentro de "Settings > Secrets" en la plataforma de AI Studio para activar las funciones de IA de City Quest Explorer por completo.
> 
> INSTANTÁNEA DE TELEMETRÍA LOCAL:
> - Agentes Activos: ${sessions.map((s) => s.investigatorId).join(", ")}
> - Alertas Pendientes: ${alerts.filter((a) => a.status === "UNREAD").length} problemas sin resolver.
> - Estado de la Ciudad: Sectores de despliegue de Cartagena totalmente operativos.`,
        isFallback: true
      });
      return;
    }

    try {
      const activeSessionsSummary = sessions
        .map(
          (s) =>
            `- Agente: ${s.investigatorId}, Capítulo: ${s.currentChapter}, Estado: ${s.sessionStatus}, Ingresos: $${s.revenue}`
        )
        .join("\n");

      const activeAlertsSummary = alerts
        .filter((a) => a.status === "UNREAD")
        .map((a) => `- [${a.label}] (${a.time}) ${a.message}`)
        .join("\n");

      const promptSystem = `Eres City Quest Explorer Centro Administrativo, el gestor de operaciones de comando de Inteligencia Artificial de alta tecnología y estilo tactical noir para un escuadrón de investigación secreto de juegos de escape urbanos ("City Quests") estacionado en Cartagena de Indias, Colombia.
El escuadrón busca resolver enigmas históricos, anomalías de GPS y archivos misteriosos ("dossiers") de baluartes históricos.
Tu voz es objetiva, concisa, de alta tecnología, pero con una elegancia intelectual y misteriosa (Tactical Noir).
RESPONDE ESTRICTAMENTE EN ESPAÑOL.
Formatea todas tus respuestas utilizando un hermoso diseño de lectura de terminal CRT retro oscuro con marcadores de comandos como "> ANALIZANDO...", "> RECOMENDACIÓN:", o divisores estructurales. Mantén tu respuesta razonablemente concisa (menos de 180 palabras) y completamente localizada al contexto de los agentes de City Quest en Cartagena de Indias.

Datos de Operaciones Activas Actuales:
${activeSessionsSummary}

Alertas No Resueltas Actuales:
${activeAlertsSummary}

Comando ingresado por el usuario: "${command}"`;

      // Build previous context if any
      const contentsParts = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: { role: string; text: string }) => {
          contentsParts.push({
            role: h.role === "assistant" ? "model" : "user",
            parts: [{ text: h.text }]
          });
        });
      }
      contentsParts.push({
        role: "user",
        parts: [{ text: promptSystem }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contentsParts,
      });

      res.json({
        output: response.text || "> EL NÚCLEO NO RETORNÓ NINGÚN FLUJO DE DATOS."
      });
    } catch (err: any) {
      console.error("Gemini API error:", err);
      res.json({
        output: `> ERROR AL CONECTAR CON EL NÚCLEO INTEGRADO DE CITY QUEST EXPLORER: ${err.message || err}
> REVERTIENDO AL BUFFER DE EMERGENCIA DE LA TERMINAL LOCAL.`,
        isError: true
      });
    }
  });

  // Serve static assets in production, otherwise Vite handles it
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
