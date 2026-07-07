import React, { useState, useEffect } from "react";
import { 
  Bell, 
  Settings, 
  Search, 
  Plus, 
  HelpCircle, 
  Archive, 
  MapPin, 
  Layers, 
  TrendingUp, 
  Clock, 
  Wallet,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  BookOpen,
  Wifi,
  Workflow,
  X,
  RefreshCw,
  Zap,
  Globe,
  Lock,
  Unlock,
  RotateCcw,
  CheckCircle,
  Video
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { Session, Alert, Dossier, ActiveTab, Character, ConspiracyNode, GameplayStation } from "./types";
import MapPanel from "./components/MapPanel";
import AriadnaTerminal from "./components/AriadnaTerminal";
import SessionTable from "./components/SessionTable";
import NewMissionModal from "./components/NewMissionModal";
import CityRoutesTab from "./components/CityRoutesTab";
import PlayersTeamsTab from "./components/PlayersTeamsTab";
import ActiveGamesTab from "./components/ActiveGamesTab";

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("DASHBOARD");
  const [storySubTab, setStorySubTab] = useState<"ACTS" | "CHARACTERS" | "CONSPIRACY" | "STATIONS">("ACTS");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [conspiracyNodes, setConspiracyNodes] = useState<ConspiracyNode[]>([]);
  const [stations, setStations] = useState<GameplayStation[]>([]);
  const [riddleAnswers, setRiddleAnswers] = useState<{ [stationId: string]: string }>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Modals / Overlays
  const [isNewMissionOpen, setIsNewMissionOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [emergencyAlertActive, setEmergencyAlertActive] = useState(false);

  // Stats Counters
  const [totalRevenue, setTotalRevenue] = useState(12840.00);
  const [activeTeamsCount, setActiveTeamsCount] = useState(8);
  const [systemSearch, setSystemSearch] = useState("");

  // Communication hub for trigger text to feed terminal input directly
  const [terminalShortcutCommand, setTerminalShortcutCommand] = useState<string | null>(null);

  // 1. Fetch initial states from database server
  const fetchState = async () => {
    try {
      const [sessionsRes, alertsRes, dossiersRes, charactersRes, conspiracyRes, stationsRes] = await Promise.all([
        fetch("/api/sessions"),
        fetch("/api/alerts"),
        fetch("/api/dossiers"),
        fetch("/api/characters"),
        fetch("/api/conspiracy"),
        fetch("/api/stations")
      ]);
      const sessionsData = await sessionsRes.json();
      const alertsData = await alertsRes.json();
      const dossiersData = await dossiersRes.json();
      const charactersData = await charactersRes.json();
      const conspiracyData = await conspiracyRes.json();
      const stationsData = await stationsRes.json();
      
      setSessions(sessionsData);
      setAlerts(alertsData);
      setDossiers(dossiersData);
      setCharacters(charactersData);
      setConspiracyNodes(conspiracyData);
      setStations(stationsData);
      setActiveTeamsCount(sessionsData.length);
    } catch (err) {
      console.error("Error communicating with Ariadna database nodes:", err);
    }
  };

  const handleValidateStationAnswer = async (stationId: string) => {
    const answer = riddleAnswers[stationId]?.trim();
    if (!answer) return;
    
    setValidationError(null);
    setValidationSuccess(null);
    
    try {
      const response = await fetch(`/api/stations/${stationId}/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: answer })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        setValidationError(errData.error || "Código o respuesta incorrecta.");
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        setValidationSuccess(`¡Excelente! Estación superada con éxito. Letra revelada: "${data.station.letter}"`);
        // Clean text field
        setRiddleAnswers(prev => ({ ...prev, [stationId]: "" }));
        // Refresh states
        fetchState();
      }
    } catch (err) {
      setValidationError("Error de conexión con el nodo satelital.");
    }
  };

  const handleResetStations = async () => {
    if (!confirm("¿Está seguro de reiniciar la simulación del recorrido? Se bloquearán todas las estaciones excepto la primera.")) return;
    try {
      const response = await fetch("/api/stations/reset", { method: "POST" });
      if (response.ok) {
        setValidationError(null);
        setValidationSuccess("Recorrido de estaciones de Cartagena de Indias reiniciado correctamente.");
        fetchState();
      }
    } catch (err) {
      console.error("Error resetting stations:", err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // 2. Periodic Live Updates Simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Minor incremental revenue simulation to feel super real & live
      setTotalRevenue((prev) => prev + (Math.random() > 0.65 ? Math.random() * 5.25 : 0));
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // 3. Command dispatcher - logs command event directly into the terminal feed
  const handleTriggerTerminal = (commandString: string) => {
    setTerminalShortcutCommand(commandString);
    // Auto-reset
    setTimeout(() => setTerminalShortcutCommand(null), 100);
  };

  // 4. Mission Deployment API call
  const handleDeployMission = async (missionData: { investigatorId: string; currentChapter: string; lat: number; lng: number }) => {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(missionData)
      });
      if (res.ok) {
        const newSess = await res.json();
        setSessions(prev => [...prev, newSess]);
        setSelectedSessionId(newSess.id);
        setActiveTeamsCount((prev) => prev + 1);
        
        // Re-pull alerts to show the new deployment log
        const alertsRes = await fetch("/api/alerts");
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);

        handleTriggerTerminal(`/locate ${newSess.investigatorId}`);
      }
    } catch (err) {
      console.error("Deployment failed:", err);
    }
  };

  // 5. Clues update or status change API call
  const handleUpdateSession = async (id: string, updatedData: Partial<Session>) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData)
      });
      if (res.ok) {
        const updated = await res.json();
        setSessions(prev => prev.map(s => s.id === id ? updated : s));
      }
    } catch (err) {
      console.error("Session update failed:", err);
    }
  };

  // 6. Delete Session API call
  const handleDeleteSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
        if (selectedSessionId === id) setSelectedSessionId(null);
        setActiveTeamsCount((prev) => Math.max(0, prev - 1));
        handleTriggerTerminal(`System link severed with session ID reference ${id}.`);
      }
    } catch (err) {
      console.error("Deletion failed:", err);
    }
  };

  // 7. Action trigger on alert cards
  const handleAlertAction = async (alertId: string, action: "INTERCEPT" | "DISMISS" | "RESPOND") => {
    try {
      const res = await fetch(`/api/alerts/${alertId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        const updatedAlert = await res.json();
        setAlerts(prev => prev.map(a => a.id === alertId ? updatedAlert : a));
        
        // Output result message to terminal
        handleTriggerTerminal(`Alert reference: ${updatedAlert.label}. Protocol Action: ${action} executed.`);
        
        // If intercepting crowley GPS error, sync the sessions
        if (action === "INTERCEPT") {
          fetchState();
        }
      }
    } catch (err) {
      console.error("Alert action execution failed:", err);
    }
  };

  // 8. Story Architect chapter progression update
  const handleDossierProgressBump = async (dossierId: string) => {
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: 10 })
      });
      if (res.ok) {
        const updated = await res.json();
        setDossiers(prev => prev.map(d => d.id === dossierId ? updated : d));
        setSelectedDossier(updated);
        handleTriggerTerminal(`Story Architect File: [${updated.title}] sync progress bumped to ${updated.progress}%.`);
      }
    } catch (err) {
      console.error("Dossier update failed:", err);
    }
  };

  // 8b. Character suspicion level adjustment
  const handleUpdateCharacterSuspicion = async (characterId: string, level: number) => {
    try {
      const res = await fetch(`/api/characters/${characterId}/suspicion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspicionLevel: level })
      });
      if (res.ok) {
        const updated = await res.json();
        setCharacters(prev => prev.map(c => c.id === characterId ? updated : c));
        handleTriggerTerminal(`Nivel de sospecha de ${updated.name} ajustado a Nivel ${level} en el Árbol de Sospechosos.`);
      }
    } catch (err) {
      console.error("Character suspicion update failed:", err);
    }
  };

  // 8c. Conspiracy node status toggle (unlocked/locked)
  const handleToggleConspiracyNode = async (nodeId: string) => {
    try {
      const res = await fetch(`/api/conspiracy/${nodeId}/toggle`, {
        method: "POST"
      });
      if (res.ok) {
        const updated = await res.json();
        setConspiracyNodes(prev => prev.map(n => n.id === nodeId ? updated : n));
        handleTriggerTerminal(`Estado del nodo de conspiración [${updated.concept}] cambiado a: ${updated.status === 'UNLOCKED' ? 'DESBLOQUEADO' : 'BLOQUEADO'}.`);
      }
    } catch (err) {
      console.error("Conspiracy node toggle failed:", err);
    }
  };

  // Search filter
  const handleGlobalSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (systemSearch.trim() !== "") {
      handleTriggerTerminal(`Querying system registry for: "${systemSearch}"`);
    }
  };

  return (
    <div className="bg-nocturne-blue text-on-surface font-sans min-h-screen relative selection:bg-primary/30 selection:text-white">
      
      {/* Top Navbar Header */}
      <header className="fixed top-0 w-full z-50 bg-nocturne-blue/95 backdrop-blur-md border-b border-outline-variant/60 flex justify-between items-center px-6 h-16 shadow-md">
        <div className="flex items-center gap-4">
          <span 
            onClick={() => setActiveTab("DASHBOARD")}
            className="font-serif text-2xl font-bold text-primary tracking-tighter cursor-pointer hover:opacity-90 flex items-center gap-2"
          >
            <Globe className="w-5 h-5 text-primary animate-pulse" />
            ARIADNA CORE
          </span>
          <div className="hidden md:flex gap-6 ml-8">
            {(["DASHBOARD", "CITY_ROUTES", "STORY_ARCHITECT"] as ActiveTab[]).map((tab) => {
              const tabLabels: Record<ActiveTab, string> = {
                "DASHBOARD": "PANEL DE CONTROL",
                "CITY_ROUTES": "CIUDADES Y RUTAS",
                "STORY_ARCHITECT": "ARQUITECTO DE HISTORIAS",
                "PLAYERS_TEAMS": "JUGADORES Y EQUIPOS",
                "ACTIVE_GAMES": "JUEGOS ACTIVOS",
                "FINANCIALS": "FINANZAS"
              };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer font-label-caps text-xs px-1 py-4 transition-all uppercase tracking-widest font-bold border-b-2 ${
                    activeTab === tab 
                      ? "text-primary border-primary" 
                      : "text-on-surface-variant hover:text-primary border-transparent"
                  }`}
                >
                  {tabLabels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Global actions and search input */}
        <div className="flex items-center gap-6">
          <form onSubmit={handleGlobalSearchSubmit} className="relative hidden sm:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text"
              value={systemSearch}
              onChange={(e) => setSystemSearch(e.target.value)}
              className="bg-surface-container-low border border-outline-variant/60 text-status-mono text-xs pl-10 pr-4 py-1.5 w-64 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none rounded text-primary placeholder-outline/50" 
              placeholder="CONSULTAR REGISTRO DEL SISTEMA..."
            />
          </form>

          {/* Quick Trigger System Check */}
          <button 
            onClick={() => {
              handleTriggerTerminal("/status");
              alert("ENLACE DE TRANSMISIÓN SEGURO DE ARIADNA VERIFICADO (EN LÍNEA)");
            }}
            className="relative cursor-pointer hover:text-primary transition-colors text-on-surface-variant"
            title="Estado de Alerta de Diagnóstico del Sistema"
          >
            <Bell className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-error rounded-full status-pulse" />
          </button>

          <button 
            onClick={() => {
              handleTriggerTerminal("Abrir panel de consola de configuración principal");
              alert("PANEL DE CONTROL DE CONFIGURACIÓN: Permisos estándar de nivel de autorización 4 inyectados.");
            }}
            className="cursor-pointer text-on-surface-variant hover:text-primary transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/50 shrink-0">
            <img 
              className="w-full h-full object-cover" 
              alt="Avatar del perfil de administrador" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwMdBGAUwaO8C4DjVwJ2EwR-mXYL-P08ZELOD9_63-36Z77Tde9GaHp9x70UloCK9nMgy2dPmJPvpM1v2stHYnFcNq5EENTEoj-0dkQ3tbhQ8gQj8AqpqCme7rfDuw6PJ21CtxnuQCkD_NpiAVneQQRTvzHb-TrIq92LmvPjzVwr1combJ9jsjLKdAwgSQ0mRt6kcYUzwCR-aCXVMLJLqF2TWYhTV0EIoeyGceHkmHwkyZc_eVU82BcjNol0ibtK0Lx7GUtEQ_5vgj"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* Side Navigation Sidebar - Desktop Only */}
      <aside className="hidden md:flex h-screen w-64 fixed left-0 top-0 bg-surface border-r border-outline-variant/60 flex-col py-4 z-40 pt-20">
        <div className="px-6 mb-8">
          <h2 className="font-label-caps text-[11px] text-primary mb-1 uppercase tracking-wider font-bold">RED DE OPERACIONES</h2>
          <p className="font-status-mono text-[10px] text-outline tracking-widest flex items-center gap-1.5 font-bold">
            <Wifi className="w-3.5 h-3.5 text-ariadna-cyan animate-pulse" />
            AUTORIZACIÓN DE NIVEL 4
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 text-xs font-semibold">
          {[
            { id: "DASHBOARD", label: "PANEL DE CONTROL" },
            { id: "CITY_ROUTES", label: "CIUDADES Y RUTAS" },
            { id: "STORY_ARCHITECT", label: "ARQUITECTO DE HISTORIAS" },
            { id: "PLAYERS_TEAMS", label: "JUGADORES Y EQUIPOS" },
            { id: "ACTIVE_GAMES", label: "JUEGOS ACTIVOS" },
            { id: "FINANCIALS", label: "FINANZAS" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-sm transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary-container text-on-primary-container font-bold shadow-[0_4px_10px_rgba(242,202,80,0.15)]"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-primary"
              }`}
            >
              <span className="font-label-caps uppercase text-[10px] tracking-wider">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Deploy Mission CTA Trigger */}
        <div className="px-4 py-4 mt-auto">
          <button 
            onClick={() => setIsNewMissionOpen(true)}
            className="w-full bg-lantern-amber text-nocturne-blue font-bold py-3 flex items-center justify-center gap-2 hover:brightness-115 active:scale-95 cursor-pointer rounded transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)] uppercase tracking-wider text-xs"
          >
            <Plus className="w-4 h-4 text-nocturne-blue stroke-[3px]" />
            <span>NUEVA MISIÓN</span>
          </button>
        </div>

        {/* Sidebar Footer Support widgets */}
        <div className="px-4 border-t border-outline-variant/50 pt-4 pb-2 space-y-1.5">
          <button 
            onClick={() => {
              handleTriggerTerminal("Solicitando guías estándar de soporte de operaciones");
              alert("MANUAL DE OPERACIONES:\n- Conjuntos de coordenadas de nodos objetivo.\n- Borrar la caché del navegador restablece las pistas.\n- Gemini AI responde a los comandos de ayuda.");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-variant/50 text-[10px] rounded-sm transition-colors cursor-pointer text-left font-bold"
          >
            <HelpCircle className="w-4 h-4 text-outline" />
            <span className="font-label-caps uppercase tracking-wider">SOPORTE</span>
          </button>
          <button 
            onClick={() => {
              handleTriggerTerminal("Abrir nodo de registros de archivo");
              alert("ARCHIVOS:\nAcceso completado a las bases de datos históricas de registro de misiones.");
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-on-surface-variant hover:bg-surface-variant/50 text-[10px] rounded-sm transition-colors cursor-pointer text-left font-bold"
          >
            <Archive className="w-4 h-4 text-outline" />
            <span className="font-label-caps uppercase tracking-wider">ARCHIVO</span>
          </button>
        </div>
      </aside>

      {/* Main Container Canvas */}
      <main className="md:ml-64 pt-24 pb-28 md:pb-12 px-6 min-h-screen">
        
        {/* Active Tab Screen Content Routing */}
        <AnimatePresence mode="wait">
          {activeTab === "DASHBOARD" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Header section with Stats boxes */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h1 className="font-serif text-4xl text-on-surface tracking-tight font-bold">Centro de Mando</h1>
                  <p className="font-status-mono text-ariadna-cyan text-xs flex items-center gap-2 mt-1.5 uppercase tracking-wider font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-ariadna-cyan status-pulse shadow-[0_0_8px_#06B6D4]" />
                    DESPLIEGUE ACTIVO: CARTAGENA DE INDIAS
                  </p>
                </div>
                <div className="flex gap-4 w-full md:w-auto font-status-mono">
                  <div className="bg-slate-surface border border-outline-variant/50 p-4 flex flex-col min-w-[150px] shadow rounded">
                    <span className="font-label-caps text-outline text-[9px] font-bold uppercase tracking-wider">INGRESOS TOTALES (WOMPI)</span>
                    <span className="font-serif text-2xl text-primary font-bold mt-1">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="bg-slate-surface border border-outline-variant/50 p-4 flex flex-col min-w-[150px] shadow rounded">
                    <span className="font-label-caps text-outline text-[9px] font-bold uppercase tracking-wider">EQUIPOS DE ESCUADRA ACTIVOS</span>
                    <span className="font-serif text-2xl text-ariadna-cyan font-bold mt-1">0{activeTeamsCount}</span>
                  </div>
                </div>
              </div>

              {/* Bento Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Live map panel (8 columns) */}
                <MapPanel 
                  sessions={sessions} 
                  selectedSessionId={selectedSessionId} 
                  onSelectSession={setSelectedSessionId} 
                />

                {/* Right side widgets (4 columns): Alerts & Terminal */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* Alerts Panel widget */}
                  <div className="glass-panel p-5 flex flex-col h-[280px] rounded-lg">
                    <div className="flex justify-between items-center mb-4 border-b border-outline-variant/40 pb-2 shrink-0">
                      <h3 className="font-label-caps text-xs text-error flex items-center gap-1.5 font-bold uppercase tracking-widest">
                        <ShieldAlert className="w-4 h-4 text-error animate-bounce" />
                        ALERTAS RECIENTES
                      </h3>
                      <span className="font-status-mono text-[9px] text-outline font-bold">
                        0{alerts.filter(a => a.status === "UNREAD").length} NO LEÍDAS
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar text-xs">
                      {alerts.map((alert) => (
                        <div 
                           key={alert.id}
                           className={`border-l-2 p-3 rounded-r transition-all ${
                            alert.status === "DISMISSED" ? "opacity-35 line-through" : ""
                          } ${
                            alert.type === "error" 
                              ? "border-error bg-error/5" 
                              : alert.type === "lantern-amber"
                                ? "border-lantern-amber bg-lantern-amber/5"
                                : "border-ariadna-cyan bg-ariadna-cyan/5"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1.5 font-status-mono">
                            <span className={`text-[10px] font-bold ${
                              alert.type === 'error' ? 'text-error' : alert.type === 'lantern-amber' ? 'text-lantern-amber' : 'text-ariadna-cyan'
                            }`}>
                              {alert.label}
                            </span>
                            <span className="text-[9px] text-outline/60">{alert.time}</span>
                          </div>
                          <p className="text-[11px] text-on-surface leading-normal">{alert.message}</p>
                          
                          {/* Alert actionable controls */}
                          {alert.status === "UNREAD" && (
                            <div className="flex gap-2.5 mt-2.5">
                              {alert.type === "error" ? (
                                <button 
                                  onClick={() => handleAlertAction(alert.id, "INTERCEPT")}
                                  className="text-[9px] font-label-caps text-error border border-error/30 bg-error/10 px-2 py-1 hover:bg-error hover:text-nocturne-blue rounded cursor-pointer transition-all font-bold"
                                >
                                  INTERCEPTAR
                                </button>
                              ) : alert.type === "lantern-amber" ? (
                                <button 
                                  onClick={() => handleAlertAction(alert.id, "RESPOND")}
                                  className="text-[9px] font-label-caps text-lantern-amber border border-lantern-amber/30 bg-lantern-amber/10 px-2 py-1 hover:bg-lantern-amber hover:text-nocturne-blue rounded cursor-pointer transition-all font-bold"
                                >
                                  RESPONDER
                                </button>
                              ) : null}
                              <button 
                                onClick={() => handleAlertAction(alert.id, "DISMISS")}
                                className="text-[9px] font-label-caps text-outline hover:text-on-surface hover:bg-surface-variant/30 px-2.5 py-1 rounded cursor-pointer transition-colors"
                              >
                                DESCARTAR
                              </button>
                            </div>
                          )}
                          {alert.status === "INTERCEPTED" && (
                            <span className="inline-block mt-2 text-[9px] font-status-mono text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase">
                              INTERCEPTADO CON ÉXITO
                            </span>
                          )}
                          {alert.status === "DISMISSED" && (
                            <span className="inline-block mt-2 text-[9px] font-status-mono text-outline uppercase font-medium">
                              Archivado/Descartado
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ariadna Terminal micro-panel (communicating with Gemini OS) */}
                  <AriadnaTerminal 
                    onExecuteCommand={(cmd) => {
                      // If the operator typed /locate CROWLEY or similar, highlight that session on the map
                      if (cmd.toLowerCase().includes("/locate")) {
                        const callsignMatch = cmd.toUpperCase().match(/CROWLEY|VALKYRIE|STORM/);
                        if (callsignMatch) {
                          const matchingSess = sessions.find(s => s.investigatorId.includes(callsignMatch[0]));
                          if (matchingSess) setSelectedSessionId(matchingSess.id);
                        }
                      }
                    }}
                  />

                </div>
              </div>

              {/* Active operational Sessions table component */}
              <SessionTable 
                sessions={sessions}
                selectedSessionId={selectedSessionId}
                onSelectSession={setSelectedSessionId}
                onUpdateSession={handleUpdateSession}
                onDeleteSession={handleDeleteSession}
                onTriggerLogTerminal={handleTriggerTerminal}
              />

              {/* bottom segment grid: story dossiers (4 cols) & performance metrics (8 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Story Dossiers list (4 cols) */}
                <div className="lg:col-span-4 glass-panel p-5 border-t-2 border-primary rounded-lg">
                  <h3 className="font-label-caps text-xs text-primary mb-4 font-bold uppercase tracking-widest flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    ACCESO RÁPIDO AL ARQUITECTO DE HISTORIAS
                  </h3>
                  <div className="space-y-4">
                    {dossiers.map((dossier) => (
                      <div 
                        key={dossier.id}
                        onClick={() => setSelectedDossier(dossier)}
                        className="flex items-center gap-4 bg-surface-container-low p-3 hover:bg-surface-container transition-colors cursor-pointer group border border-outline-variant/30 rounded"
                      >
                        <div 
                          className="w-12 h-16 bg-cover bg-center border border-outline-variant/50 shrink-0" 
                          style={{ backgroundImage: `url('${dossier.imageUrl}')` }} 
                        />
                        <div className="flex-1 overflow-hidden text-xs">
                          <p className="font-label-caps text-[10px] text-primary font-bold uppercase">{dossier.title}</p>
                          <p className="text-on-surface font-medium truncate mt-0.5">{dossier.chapter}</p>
                          <div className="w-full bg-outline-variant/50 h-1.5 mt-2 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all" style={{ width: `${dossier.progress}%` }} />
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-outline group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Analytics metrics box (8 cols) */}
                <div className="lg:col-span-8 glass-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-6 rounded-lg font-status-mono">
                  
                  <div className="p-4 bg-slate-surface border border-outline-variant/50 rounded flex flex-col justify-between shadow">
                    <div>
                      <p className="font-label-caps text-[10px] text-outline font-bold uppercase flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-ariadna-cyan" />
                        TASA DE CONVERSIÓN
                      </p>
                      <span className="font-serif text-3xl text-on-surface font-bold inline-block mt-3">12.4%</span>
                    </div>
                    <span className="text-[10px] text-ariadna-cyan font-bold mt-2">+2.1% CICLO ANTERIOR</span>
                  </div>

                  <div className="p-4 bg-slate-surface border border-outline-variant/50 rounded flex flex-col justify-between shadow">
                    <div>
                      <p className="font-label-caps text-[10px] text-outline font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-error" />
                        TIEMPO PROMEDIO DE SESIÓN
                      </p>
                      <span className="font-serif text-3xl text-on-surface font-bold inline-block mt-3">
                        78<span className="text-sm font-sans font-bold">MIN</span>
                      </span>
                    </div>
                    <span className="text-[10px] text-error font-bold mt-2">-5% PRECISIÓN DE DESVIACIÓN DE SINCRO</span>
                  </div>

                  <div className="p-4 bg-slate-surface border border-outline-variant/50 rounded flex flex-col justify-between shadow">
                    <div>
                      <p className="font-label-caps text-[10px] text-outline font-bold uppercase flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5 text-primary" />
                        LIQUIDACIONES DE WOMPI
                      </p>
                      <span className="font-serif text-3xl text-primary font-bold inline-block mt-3">$4,200</span>
                    </div>
                    <span className="text-[10px] text-outline uppercase font-bold mt-2">PAGOS AUTOMÁTICOS PENDIENTES</span>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* Cities and Routes Management */}
          {activeTab === "CITY_ROUTES" && (
            <motion.div 
              key="city-routes"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <CityRoutesTab onTriggerLogTerminal={handleTriggerTerminal} />
            </motion.div>
          )}

          {activeTab === "STORY ARCHITECT" && (
            <motion.div 
              key="story"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-outline-variant/60 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="font-serif text-4xl text-on-surface font-bold">Arquitecto de Historias y Conspiración</h1>
                  <p className="text-outline text-xs mt-1">Configurar capítulos de pistas híbridas, expedientes de personajes y árbol de sospechosos de El Manuscrito Prohibido.</p>
                </div>
                {/* Sub-tabs Selection */}
                <div className="flex bg-surface-container-low border border-outline-variant/60 p-1 rounded-sm text-xs font-bold font-status-mono self-start md:self-auto shadow-sm overflow-x-auto max-w-full">
                  <button 
                    onClick={() => setStorySubTab("ACTS")}
                    className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${storySubTab === "ACTS" ? "bg-primary text-nocturne-blue" : "text-outline hover:text-primary"}`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>CAPÍTULOS / ACTOS</span>
                  </button>
                  <button 
                    onClick={() => setStorySubTab("CHARACTERS")}
                    className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${storySubTab === "CHARACTERS" ? "bg-primary text-nocturne-blue" : "text-outline hover:text-primary"}`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>EXPEDIENTE PERSONAJES</span>
                  </button>
                  <button 
                    onClick={() => setStorySubTab("CONSPIRACY")}
                    className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${storySubTab === "CONSPIRACY" ? "bg-primary text-nocturne-blue" : "text-outline hover:text-primary"}`}
                  >
                    <Workflow className="w-3.5 h-3.5" />
                    <span>ÁRBOL / CONSPIRACIÓN</span>
                  </button>
                  <button 
                    onClick={() => setStorySubTab("STATIONS")}
                    className={`px-3 py-1.5 rounded-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${storySubTab === "STATIONS" ? "bg-primary text-nocturne-blue" : "text-outline hover:text-primary"}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>ESTACIONES / RECORRIDO</span>
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Dossiers / Acts */}
              {storySubTab === "ACTS" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {dossiers.map((dossier) => (
                    <div key={dossier.id} className="glass-panel p-6 rounded border border-outline-variant/50 shadow flex flex-col md:flex-row gap-5">
                      <div 
                        className="w-24 h-32 bg-cover bg-center border border-outline-variant/50 shrink-0 self-center rounded"
                        style={{ backgroundImage: `url('${dossier.imageUrl}')` }} 
                      />
                      <div className="flex-1 space-y-2 text-xs">
                        <h3 className="font-label-caps text-sm text-primary font-bold uppercase">{dossier.title}</h3>
                        <p className="text-on-surface font-bold italic font-sans">{dossier.chapter}</p>
                        <p className="text-outline text-[11px] leading-relaxed font-sans">{dossier.description}</p>
                        
                        <div className="pt-3">
                          <div className="flex justify-between text-[10px] text-outline mb-1 font-status-mono">
                            <span>Alineación de Finalización de la Historia:</span>
                            <span className="font-bold text-primary">{dossier.progress}%</span>
                          </div>
                          <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full transition-all" style={{ width: `${dossier.progress}%` }} />
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            onClick={() => handleDossierProgressBump(dossier.id)}
                            className="flex-1 text-[10px] font-label-caps bg-primary/10 border border-primary/30 text-primary py-2 hover:bg-primary hover:text-nocturne-blue transition-all rounded cursor-pointer uppercase font-bold"
                          >
                            Avanzar Estado del Capítulo
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedDossier(dossier);
                            }}
                            className="text-[10px] font-label-caps border border-outline-variant px-3 py-2 text-outline hover:text-white rounded cursor-pointer uppercase font-bold"
                          >
                            Inspeccionar Archivo
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-tab 2: Character dossier sheet */}
              {storySubTab === "CHARACTERS" && (
                <div className="space-y-6">
                  <div className="bg-surface-container-low p-4 border border-outline-variant/40 rounded-sm">
                    <p className="text-xs text-outline font-status-mono leading-relaxed">
                      <span className="text-lantern-amber font-bold">FILOSOFÍA NARRATIVA DIRECTA:</span> 1. Nadie conoce toda la verdad. | 2. Todos ocultan algo. | 3. Incluso los aliados pueden parecer sospechosos.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {characters.map((char) => (
                      <div key={char.id} className="glass-panel p-5 rounded border border-outline-variant/50 shadow flex flex-col md:flex-row gap-5 relative overflow-hidden">
                        {/* Suspension badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-status-mono font-bold ${
                            char.suspicionLevel === 4 ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                            char.suspicionLevel === 3 ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" :
                            char.suspicionLevel === 2 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                            "bg-ariadna-cyan/10 text-ariadna-cyan border border-ariadna-cyan/30"
                          }`}>
                            SOSPECHA NIVEL {char.suspicionLevel}
                          </span>
                        </div>

                        {/* Avatar photo */}
                        <div className="w-20 h-20 rounded-full border border-primary/30 overflow-hidden shrink-0 self-start mt-2">
                          <img 
                            src={char.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150"} 
                            alt={char.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="flex-1 space-y-2 text-xs">
                          <div>
                            <h3 className="font-serif text-lg text-primary font-bold">{char.name}</h3>
                            <p className="text-on-surface-variant font-bold text-[10px] font-status-mono uppercase tracking-wider">{char.role}</p>
                          </div>

                          <p className="text-outline text-[11px] leading-relaxed font-sans">{char.description}</p>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {char.personality.map((tag, idx) => (
                              <span key={idx} className="bg-outline-variant/30 text-on-surface text-[9px] px-2 py-0.5 rounded-sm font-sans font-medium uppercase">{tag}</span>
                            ))}
                          </div>

                          <div className="border-t border-outline-variant/30 pt-2.5 mt-2 space-y-1.5 font-sans">
                            <p className="text-[11px] text-outline">
                              <strong className="text-on-surface">Motivación Pública:</strong> {char.motivations.public}
                            </p>
                            <p className="text-[11px] text-outline">
                              <strong className="text-lantern-amber">Motivación Real:</strong> {char.motivations.real}
                            </p>
                            <div className="bg-red-950/10 border border-red-500/25 p-2 rounded-sm text-[11px] text-red-300">
                              <strong className="text-red-400">SECRETO ARCHIVADO:</strong> {char.secret}
                            </div>
                            <p className="text-[10px] text-outline font-status-mono">
                              <strong>ESTADO OPERACIONAL:</strong> <span className="text-primary font-bold">{char.status}</span>
                            </p>
                          </div>

                          <div className="pt-2">
                            <label className="text-[9px] text-outline font-status-mono block mb-1">AJUSTAR ÁRBOL DE SOSPECHAS:</label>
                            <div className="flex gap-1.5">
                              {[1, 2, 3, 4].map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => handleUpdateCharacterSuspicion(char.id, lvl)}
                                  className={`px-2 py-1 text-[9px] font-status-mono rounded cursor-pointer transition-all border ${
                                    char.suspicionLevel === lvl 
                                      ? "bg-primary text-nocturne-blue font-bold border-primary" 
                                      : "bg-surface-container-low text-outline border-outline-variant/50 hover:text-primary"
                                  }`}
                                >
                                  L{lvl}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Conspiracy graph / tree of suspect nodes */}
              {storySubTab === "CONSPIRACY" && (
                <div className="space-y-6">
                  {/* Narrative Blockquote */}
                  <blockquote className="border-l-2 border-lantern-amber pl-4 italic text-on-surface-variant font-serif text-sm bg-lantern-amber/5 p-4 rounded-r">
                    “Durante la experiencia: Todos parecen culpables. Después: Todos parecen víctimas. Finalmente: Nadie es completamente inocente.”
                  </blockquote>

                  {/* Suspicion tree explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-status-mono text-xs">
                    <div className="bg-surface p-4 border border-outline-variant/60 rounded">
                      <h4 className="text-primary font-bold border-b border-outline-variant pb-2 mb-3">NIVEL 1: EN EL CAMPO</h4>
                      <p className="text-outline text-[11px] leading-relaxed">
                        Agentes y testigos iniciales recolectando el mapa y carta de auxilio. Confianza estándar.
                      </p>
                      <div className="mt-3 text-on-surface font-sans font-bold">
                        {characters.filter(c => c.suspicionLevel === 1).map(c => c.name).join(", ") || "Ninguno"}
                      </div>
                    </div>
                    <div className="bg-surface p-4 border border-outline-variant/60 rounded">
                      <h4 className="text-primary font-bold border-b border-outline-variant pb-2 mb-3">NIVEL 2 & 3: INTERMEDIO</h4>
                      <p className="text-outline text-[11px] leading-relaxed">
                        Entidades tácticas y manipuladores de evidencia. Custodia de telemetría y falsificación de cenizas.
                      </p>
                      <div className="mt-3 text-on-surface font-sans font-bold">
                        {characters.filter(c => c.suspicionLevel === 2 || c.suspicionLevel === 3).map(c => c.name).join(", ") || "Ninguno"}
                      </div>
                    </div>
                    <div className="bg-surface p-4 border border-outline-variant/60 rounded">
                      <h4 className="text-error font-bold border-b border-outline-variant pb-2 mb-3">NIVEL 4: AUTOR / EN LAS SOMBRAS</h4>
                      <p className="text-outline text-[11px] leading-relaxed">
                        El núcleo de la interceptación. El Patrón que busca secuestrar el sistema secreto de clasificación.
                      </p>
                      <div className="mt-3 text-error font-sans font-bold">
                        {characters.filter(c => c.suspicionLevel === 4).map(c => c.name).join(", ") || "Ninguno"}
                      </div>
                    </div>
                  </div>

                  {/* Conspiracy Flow Nodes */}
                  <div className="border border-outline-variant/60 rounded p-6 bg-surface-container-low space-y-6 relative">
                    <h3 className="font-serif text-xl text-primary font-bold mb-4">Niveles de Revelación de la Conspiración</h3>
                    
                    <div className="space-y-4">
                      {conspiracyNodes.map((node, index) => {
                        const isUnlocked = node.status === "UNLOCKED";
                        return (
                          <div key={node.id} className="relative flex items-start gap-4">
                            {/* Connective timeline bar */}
                            {index < conspiracyNodes.length - 1 && (
                              <div className={`absolute left-4 top-8 bottom-[-20px] w-0.5 ${isUnlocked ? "bg-primary" : "bg-outline-variant/40"}`} />
                            )}

                            {/* Node icon circle */}
                            <button 
                              onClick={() => handleToggleConspiracyNode(node.id)}
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border cursor-pointer z-10 transition-all ${
                                isUnlocked 
                                  ? "bg-primary border-primary text-nocturne-blue shadow-[0_0_10px_rgba(242,202,80,0.4)]" 
                                  : "bg-surface border-outline-variant text-outline hover:border-primary hover:text-primary"
                              }`}
                            >
                              {isUnlocked ? <Zap className="w-4 h-4 stroke-[2.5px]" /> : <Clock className="w-4 h-4" />}
                            </button>

                            {/* Node Content */}
                            <div className="flex-1 glass-panel p-4 rounded border border-outline-variant/40 hover:border-outline-variant/80 transition-all">
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <span className={`text-[9px] font-status-mono font-bold px-2 py-0.5 rounded-sm ${isUnlocked ? "bg-primary/20 text-primary" : "bg-outline-variant/40 text-outline"}`}>
                                    {node.levelName}
                                  </span>
                                  <h4 className="font-serif text-base text-on-surface font-bold mt-1.5">{node.concept}</h4>
                                </div>
                                <button
                                  onClick={() => handleToggleConspiracyNode(node.id)}
                                  className={`px-3 py-1 rounded text-[10px] font-status-mono font-bold uppercase transition-all cursor-pointer ${
                                    isUnlocked 
                                      ? "bg-primary/10 text-primary border border-primary/30 hover:bg-primary/25" 
                                      : "bg-outline-variant/20 text-outline border border-outline-variant hover:text-white"
                                  }`}
                                >
                                  {isUnlocked ? "DESBLOQUEADO" : "BLOQUEAR / PROTEGER"}
                                </button>
                              </div>
                              <p className="text-outline text-xs mt-2 leading-relaxed font-sans">{node.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Gameplay Stations */}
              {storySubTab === "STATIONS" && (
                <div className="space-y-6">
                  {/* Dashboard Header: Reconstruct key word from decrypted letters */}
                  <div className="glass-panel p-5 rounded border border-primary/20 bg-black/40 flex flex-col lg:flex-row items-center justify-between gap-6 font-status-mono">
                    <div className="space-y-1 text-center lg:text-left">
                      <h3 className="text-primary text-xs font-bold uppercase tracking-widest flex items-center justify-center lg:justify-start gap-1.5">
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        REVELACIÓN DEL CÓDIGO MAESTRO DEL MANUSCRITO
                      </h3>
                      <p className="text-[10px] text-outline uppercase">
                        Suma de letras criptográficas obtenidas al superar estaciones en Cartagena de Indias.
                      </p>
                      <p className="text-[10px] text-ariadna-cyan mt-1">
                        Progreso del Recorrido: {stations.filter(s => s.status === "COMPLETED").length} / {stations.length} Estaciones
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-1.5">
                      {stations.map((s, idx) => {
                        const isComp = s.status === "COMPLETED";
                        return (
                          <div 
                            key={s.id} 
                            className={`w-9 h-11 flex flex-col items-center justify-center border rounded font-bold text-sm transition-all ${
                              isComp 
                                ? "bg-primary/20 border-primary text-primary shadow-[0_0_8px_rgba(242,202,80,0.35)]" 
                                : "bg-surface-container-lowest border-outline-variant text-outline/30"
                            }`}
                          >
                            <span className="text-base font-serif">{isComp ? s.letter : "?"}</span>
                            <span className="text-[7px] text-outline/50 mt-0.5">{String(idx + 1).padStart(2, "0")}</span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      onClick={handleResetStations}
                      className="px-3.5 py-1.5 bg-red-950/25 hover:bg-red-950/50 text-red-400 border border-red-900/40 hover:border-red-500/40 rounded text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 self-center cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                      <span>REINICIAR SIMULACIÓN</span>
                    </button>
                  </div>

                  {/* Feedback Messages */}
                  {validationSuccess && (
                    <div className="bg-[#051a1e] border-l-2 border-ariadna-cyan text-ariadna-cyan p-3 text-xs font-status-mono rounded shadow flex justify-between items-center">
                      <span>&gt; {validationSuccess}</span>
                      <button onClick={() => setValidationSuccess(null)} className="text-ariadna-cyan/60 hover:text-ariadna-cyan p-1 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {validationError && (
                    <div className="bg-[#1f090d] border-l-2 border-error text-error p-3 text-xs font-status-mono rounded shadow flex justify-between items-center">
                      <span>&gt; ANOMALÍA: {validationError}</span>
                      <button onClick={() => setValidationError(null)} className="text-error/60 hover:text-error p-1 rounded">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Vertical Timeline List of 12 Stations */}
                  <div className="space-y-4">
                    {stations.map((station, idx) => {
                      const isCompleted = station.status === "COMPLETED";
                      const isUnlocked = station.status === "UNLOCKED";
                      const isLocked = station.status === "LOCKED";

                      return (
                        <div 
                          key={station.id}
                          className={`relative border rounded transition-all overflow-hidden ${
                            isCompleted 
                              ? "bg-nocturne-blue/15 border-primary/20 shadow-sm" 
                              : isUnlocked 
                                ? "bg-[#041221]/50 border-ariadna-cyan/40 shadow-[0_0_15px_rgba(6,182,212,0.06)]"
                                : "bg-[#020914]/20 border-outline-variant/30 opacity-60"
                          }`}
                        >
                          <div className="p-5 flex flex-col md:flex-row gap-5 items-start">
                            {/* Left Status Pillar */}
                            <div className="flex md:flex-col items-center gap-2 shrink-0">
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center border font-status-mono text-xs font-bold ${
                                  isCompleted 
                                    ? "bg-primary/25 border-primary text-primary" 
                                    : isUnlocked 
                                      ? "bg-ariadna-cyan/20 border-ariadna-cyan text-ariadna-cyan animate-pulse"
                                      : "bg-surface border-outline-variant/50 text-outline"
                                }`}
                              >
                                {String(idx + 1).padStart(2, "0")}
                              </div>
                              <div className="hidden md:block w-0.5 h-10 bg-outline-variant/20" />
                            </div>

                            {/* Center Content */}
                            <div className="flex-1 space-y-2 text-xs">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <span className="font-status-mono text-[9px] uppercase tracking-wider text-outline">
                                  CARTAGENA PEATONAL
                                </span>
                                <span className={`text-[9px] font-bold font-status-mono px-2 py-0.5 rounded-sm uppercase ${
                                  isCompleted 
                                    ? "bg-primary/10 text-primary border border-primary/25" 
                                    : isUnlocked 
                                      ? "bg-ariadna-cyan/10 text-ariadna-cyan border border-ariadna-cyan/35"
                                      : "bg-outline-variant/10 text-outline border border-outline-variant/20"
                                }`}>
                                  {station.type}
                                </span>
                                <span className="text-[10px] text-outline font-semibold bg-surface-container-lowest border border-outline-variant/30 px-2 py-0.5 rounded-sm">
                                  ⏱ {station.timeEstimate}
                                </span>
                              </div>

                              <h3 className="font-serif text-lg text-on-surface font-bold">
                                {station.name}
                              </h3>

                              <p className="text-on-surface-variant text-xs flex items-center gap-1.5 font-bold">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span>{station.location}</span>
                              </p>

                              <p className="text-outline text-xs leading-relaxed font-sans max-w-3xl">
                                <span className="font-semibold text-on-surface">Objetivo:</span> {station.objective}
                              </p>

                              {/* Clue/Actor Context Card */}
                              {(station.actor || station.videoLink) && (
                                <div className="bg-black/40 border border-outline-variant/30 p-2.5 rounded text-[11px] font-status-mono flex flex-wrap gap-4 items-center max-w-2xl">
                                  {station.actor && (
                                    <div className="flex items-center gap-1.5 text-lantern-amber font-bold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-lantern-amber animate-pulse" />
                                      <span>CONTACTO EN VIVO: {station.actor}</span>
                                    </div>
                                  )}
                                  {station.videoLink && (
                                    <div className="flex items-center gap-1.5 text-ariadna-cyan font-bold">
                                      <Video className="w-3.5 h-3.5" />
                                      <span>ELEMENTO DIGITAL: {station.videoLink}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Interactive Mystery Riddle block */}
                              <div className="bg-[#030d17]/40 border border-outline-variant/20 p-4 rounded-sm space-y-3 max-w-2xl mt-3">
                                <div className="text-[11px] text-primary font-bold font-status-mono tracking-widest uppercase flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>ENIGMA DE CAMPO / VALIDACIÓN</span>
                                </div>
                                <p className="text-on-surface text-xs leading-relaxed font-sans italic">
                                  "{station.riddle}"
                                </p>

                                {isUnlocked && (
                                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                    <input 
                                      type="text"
                                      value={riddleAnswers[station.id] || ""}
                                      onChange={(e) => setRiddleAnswers(prev => ({ ...prev, [station.id]: e.target.value }))}
                                      placeholder={`Respuesta correcta para desbloquear la letra...`}
                                      className="bg-black/60 border border-ariadna-cyan/30 text-ariadna-cyan text-xs px-3 py-2 flex-1 focus:ring-1 focus:ring-ariadna-cyan focus:border-ariadna-cyan focus:outline-none uppercase font-status-mono rounded-[2px]"
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") handleValidateStationAnswer(station.id);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleValidateStationAnswer(station.id)}
                                      disabled={!riddleAnswers[station.id]?.trim()}
                                      className="px-4 py-2 bg-ariadna-cyan hover:bg-cyan-400 text-nocturne-blue disabled:opacity-40 disabled:hover:bg-ariadna-cyan font-status-mono text-xs font-bold uppercase cursor-pointer rounded-[2px] transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                                    >
                                      <Zap className="w-3.5 h-3.5" />
                                      <span>VALIDAR ENIGMA</span>
                                    </button>
                                  </div>
                                )}

                                {isCompleted && (
                                  <div className="pt-2 flex items-center gap-2 text-primary font-bold font-status-mono text-[11px] bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-sm">
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                    <span>✓ ESTACIÓN SUPERADA - LETRA REVELADA: [ {station.letter} ]</span>
                                  </div>
                                )}

                                {isLocked && (
                                  <div className="pt-1.5 flex items-center gap-2 text-outline/50 font-status-mono text-[10px]">
                                    <Lock className="w-3.5 h-3.5" />
                                    <span>SECTOR ADYACENTE EN COLA - COMPLETE LA ESTACIÓN ANTERIOR</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Players and Teams Management */}
          {activeTab === "PLAYERS_TEAMS" && (
            <motion.div 
              key="players-teams"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <PlayersTeamsTab onTriggerLogTerminal={handleTriggerTerminal} />
            </motion.div>
          )}

          {/* Active Games and Telemetry */}
          {activeTab === "ACTIVE_GAMES" && (
            <motion.div 
              key="active-games"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <ActiveGamesTab onTriggerLogTerminal={handleTriggerTerminal} />
            </motion.div>
          )}

          {activeTab === "FINANCIALS" && (
            <motion.div 
              key="financials"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="border-b border-outline-variant/60 pb-3">
                <h1 className="font-serif text-4xl text-on-surface font-bold">Liquidaciones de Pagos de Wompi</h1>
                <p className="text-outline text-xs mt-1">Registros de pagos, registros de transacciones y configuraciones de desembolso.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-status-mono">
                <div className="bg-slate-surface border border-outline-variant/50 p-5 rounded shadow">
                  <p className="font-label-caps text-[10px] text-outline font-bold">CUSTODIA TOTAL</p>
                  <p className="font-serif text-2xl text-primary font-bold mt-2">$12,840.00</p>
                </div>
                <div className="bg-slate-surface border border-outline-variant/50 p-5 rounded shadow">
                  <p className="font-label-caps text-[10px] text-outline font-bold">PAGOS PENDIENTES</p>
                  <p className="font-serif text-2xl text-lantern-amber font-bold mt-2">$4,200.00</p>
                </div>
                <div className="bg-slate-surface border border-outline-variant/50 p-5 rounded shadow">
                  <p className="font-label-caps text-[10px] text-outline font-bold">INGRESOS DE CARTAGENA</p>
                  <p className="font-serif text-2xl text-ariadna-cyan font-bold mt-2">$8,540.00</p>
                </div>
                <div className="bg-slate-surface border border-outline-variant/50 p-5 rounded shadow">
                  <p className="font-label-caps text-[10px] text-outline font-bold">BONOS DE SQUAD DESPACHADOS</p>
                  <p className="font-serif text-2xl text-emerald-400 font-bold mt-2">12 Pagos</p>
                </div>
              </div>

              <div className="glass-panel p-6 rounded border border-outline-variant/30 text-xs shadow-md">
                <h3 className="font-label-caps text-primary text-sm font-bold tracking-wider mb-4 uppercase">LOGS DE LA BASE DE DATOS DE PAGOS RECIBIDOS</h3>
                <div className="space-y-3.5 font-status-mono text-outline">
                  {[
                    { id: "TX-4402", team: "CROWLEY", desc: "Compensación por desbloqueo de Pista #1 vía Wompi API", status: "LIQUIDADO", amt: 15.00 },
                    { id: "TX-4401", team: "VALKYRIE", desc: "Compensación por desbloqueo de Pista #1 vía Wompi API", status: "LIQUIDADO", amt: 15.00 },
                    { id: "TX-4399", team: "STORM", desc: "Compensación por desbloqueo de Pista #2 vía Wompi API", status: "LIQUIDADO", amt: 25.00 },
                    { id: "TX-4390", team: "CROWLEY", desc: "Compensación por desbloqueo de Pista #2 vía Wompi API", status: "LIQUIDADO", amt: 30.00 },
                  ].map((tx, idx) => (
                    <div key={idx} className="flex justify-between border-b border-outline-variant/20 pb-2 items-center text-[11px]">
                      <div>
                        <span className="text-primary font-bold">{tx.id}</span>
                        <span className="ml-3 uppercase font-bold text-on-surface">EQUIPO {tx.team}</span>
                        <span className="ml-3 text-outline/80 italic font-sans">({tx.desc})</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-emerald-400 font-bold text-[10px]">{tx.status}</span>
                        <span className="text-primary font-bold">${tx.amt.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Floating Action Bar - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-nocturne-blue/95 backdrop-blur-xl border-t border-primary/20 flex justify-around items-center px-4 pb-6 pt-3 shadow-[0_-4px_20px_rgba(6,182,212,0.15)] rounded-t-xl text-[10px] font-label-caps font-bold">
        <button 
          onClick={() => setActiveTab("DASHBOARD")}
          className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'DASHBOARD' ? 'text-primary scale-110' : 'text-outline opacity-60'}`}
        >
          <Workflow className="w-5 h-5 mb-0.5" />
          <span>MAPA</span>
        </button>
        <button 
          onClick={() => setActiveTab("CITY_ROUTES")}
          className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'CITY_ROUTES' ? 'text-primary scale-110' : 'text-outline opacity-60'}`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span>RUTAS</span>
        </button>
        <button 
          onClick={() => setActiveTab("PLAYERS_TEAMS")}
          className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'PLAYERS_TEAMS' ? 'text-primary scale-110' : 'text-outline opacity-60'}`}
        >
          <BookOpen className="w-5 h-5 mb-0.5" />
          <span>EQUIPOS</span>
        </button>
        <button 
          onClick={() => setActiveTab("ACTIVE_GAMES")}
          className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === 'ACTIVE_GAMES' ? 'text-primary scale-110' : 'text-outline opacity-60'}`}
        >
          <Plus className="w-5 h-5 mb-0.5 animate-pulse" />
          <span>JUEGOS</span>
        </button>
      </nav>

      {/* Floating Emergency Action Button for quick diagnostics/threat escalation */}
      <button 
        onClick={() => {
          setEmergencyAlertActive(true);
          handleTriggerTerminal("Escalar nivel de amenaza de red táctica a ALERTA ROJA ALTA");
        }}
        className="fixed bottom-20 md:bottom-6 right-6 w-14 h-14 bg-lantern-amber hover:bg-lantern-amber/90 text-nocturne-blue shadow-lg flex items-center justify-center active:scale-95 transition-all z-40 rounded-full cursor-pointer border-2 border-nocturne-blue"
        title="Escalar estado de amenaza de red"
      >
        <Zap className="w-6 h-6 text-nocturne-blue fill-current" />
      </button>

      {/* Interactive Dossier Inspector Overlay modal */}
      <AnimatePresence>
        {selectedDossier && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-panel p-6 max-w-lg w-full rounded border-2 border-primary/40 relative shadow-2xl"
            >
              <button 
                onClick={() => setSelectedDossier(null)}
                className="absolute right-4 top-4 text-outline hover:text-primary transition-colors cursor-pointer p-1 rounded-full hover:bg-surface-variant/30"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row gap-6">
                <div 
                  className="w-32 h-44 bg-cover bg-center border border-outline-variant shrink-0 rounded self-center" 
                  style={{ backgroundImage: `url('${selectedDossier.imageUrl}')` }} 
                />
                <div className="flex-1 space-y-4">
                  <span className="font-status-mono text-[9px] bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded uppercase font-bold">
                    ARCHIVO DE INVESTIGACIÓN
                  </span>
                  
                  <div>
                    <h2 className="font-serif text-2xl text-primary font-bold tracking-tight">{selectedDossier.title}</h2>
                    <p className="text-on-surface font-bold italic font-sans mt-0.5">Capítulo actual: "{selectedDossier.chapter}"</p>
                  </div>

                  <p className="text-xs text-outline leading-relaxed font-sans">{selectedDossier.description}</p>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-[10px] font-status-mono text-outline">
                      <span>Progreso de Realineación del Dossier:</span>
                      <span className="font-bold text-primary">{selectedDossier.progress}%</span>
                    </div>
                    <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                      <div className="bg-primary h-full transition-all" style={{ width: `${selectedDossier.progress}%` }} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    {selectedDossier.progress < 100 ? (
                      <button 
                        onClick={() => handleDossierProgressBump(selectedDossier.id)}
                        className="flex-1 bg-primary text-nocturne-blue hover:opacity-90 py-2.5 text-xs font-bold rounded cursor-pointer uppercase transition-all flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar Estado del Progreso
                      </button>
                    ) : (
                      <span className="w-full text-center py-2.5 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 text-xs font-bold rounded uppercase">
                        ✓ Capítulo completamente alineado y completado
                      </span>
                    )}
                    <button 
                      onClick={() => {
                        handleTriggerTerminal(`Revisar planos en el archivo del dossier: ${selectedDossier.title}`);
                        setSelectedDossier(null);
                      }}
                      className="text-xs font-bold border border-outline-variant hover:border-primary px-4 py-2.5 rounded text-outline hover:text-white transition-colors cursor-pointer uppercase"
                    >
                      Descargar Coords de Nodos
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Escalate Warning confirmation Overlay modal */}
      <AnimatePresence>
        {emergencyAlertActive && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-panel p-6 max-w-md w-full rounded border-2 border-error/80 relative text-center space-y-5 shadow-[0_0_80px_rgba(255,180,171,0.25)]"
            >
              <div className="w-16 h-16 bg-error/15 text-error flex items-center justify-center rounded-full mx-auto status-pulse border border-error/50">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-serif text-2xl text-error font-bold tracking-tight uppercase">NIVEL DE AMENAZA CRÍTICO</h2>
                <p className="font-status-mono text-[9px] text-outline tracking-wider uppercase font-bold">PROTOCOLO DE EMERGENCIA ACTIVADO</p>
              </div>
              <p className="text-xs text-outline leading-relaxed font-sans">
                Ha activado la transmisión de escalada de red. Todos los transmisores de equipo pasarán a estado de baliza activa. Las fronteras de seguridad operativa quedan temporalmente suspendidas.
              </p>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setEmergencyAlertActive(false);
                    handleTriggerTerminal("Reconocer alertas de redes críticas");
                  }}
                  className="flex-1 bg-error text-nocturne-blue hover:opacity-90 py-2.5 text-xs font-bold rounded uppercase cursor-pointer transition-all active:scale-95 font-sans"
                >
                  RECONOCER ESTADO DE BALIZA
                </button>
                <button 
                  onClick={() => {
                    setEmergencyAlertActive(false);
                    handleTriggerTerminal("Restablecer advertencias de red a estado mínimo");
                  }}
                  className="border border-outline-variant hover:text-white text-outline px-4 py-2.5 text-xs font-bold rounded uppercase cursor-pointer transition-colors"
                >
                  Restablecer Alertas
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Mission Deployment form overlay modal */}
      <NewMissionModal 
        isOpen={isNewMissionOpen}
        onClose={() => setIsNewMissionOpen(false)}
        onDeploy={handleDeployMission}
      />

    </div>
  );
}
