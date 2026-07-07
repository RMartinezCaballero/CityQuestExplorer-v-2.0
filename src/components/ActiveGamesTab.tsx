import React, { useState, useEffect } from "react";
import { 
  Play, 
  Clock, 
  MapPin, 
  CheckCircle, 
  Plus, 
  ShieldAlert, 
  RefreshCw, 
  Activity, 
  Calendar,
  Info
} from "lucide-react";
import { ActiveGameSession, City, Team } from "../types";

interface ActiveGamesTabProps {
  onTriggerLogTerminal: (cmd: string) => void;
}

export default function ActiveGamesTab({ onTriggerLogTerminal }: ActiveGamesTabProps) {
  const [activeGames, setActiveGames] = useState<ActiveGameSession[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Create State
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [difficulty, setDifficulty] = useState<"Fácil" | "Medium" | "Difícil">("Fácil");
  const [showAddSession, setShowAddSession] = useState(false);

  // Challenge and QR Scan Simulation States
  const [gameAnswers, setGameAnswers] = useState<Record<string, string>>({});
  const [scanningGameId, setScanningGameId] = useState<string | null>(null);
  const [showAnswersHelp, setShowAnswersHelp] = useState(false);

  // Errors / Success messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchState = async () => {
    try {
      const [gRes, cRes, tRes] = await Promise.all([
        fetch("/api/active-games"),
        fetch("/api/cities"),
        fetch("/api/teams")
      ]);
      if (gRes.ok) setActiveGames(await gRes.json());
      if (cRes.ok) setCities(await cRes.json());
      if (tRes.ok) setTeams(await tRes.json());
    } catch (err) {
      console.error("Error fetching games state:", err);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  const allStories = cities.flatMap(c => c.stories);

  // Helper to find full mission details
  const getFullMissionDetails = (missionId: string) => {
    for (const c of cities) {
      for (const s of c.stories) {
        const m = s.missions.find(x => x.id === missionId);
        if (m) return m;
      }
    }
    return null;
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedStoryId || !selectedTeamId || !bookingTime) {
      setErrorMessage("Por favor complete todos los datos requeridos.");
      return;
    }

    try {
      const res = await fetch("/api/active-games", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storyId: selectedStoryId,
          playerOrTeamId: selectedTeamId,
          isTeam: true,
          bookingTime: new Date(bookingTime).toISOString(),
          difficulty
        })
      });

      if (res.ok) {
        const created = await res.json();
        setSuccessMessage(`Sesión reservada exitosamente para la Escuadra ${created.name}.`);
        onTriggerLogTerminal(`Programado juego: ${created.storyTitle} para Escuadra ${created.name}`);
        
        // Reset
        setSelectedStoryId("");
        setSelectedTeamId("");
        setBookingTime("");
        setShowAddSession(false);
        
        await fetchState();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "No se pudo agendar el juego.");
      }
    } catch (err) {
      setErrorMessage("Error de conexión satelital.");
    }
  };

  const handleActivateGame = async (gameId: string, teamName: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const game = activeGames.find(g => g.id === gameId);
    if (!game) return;

    try {
      const res = await fetch(`/api/active-games/${gameId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: game.accessCode })
      });

      if (res.ok) {
        setSuccessMessage(`¡DESPLIEGUE EN CAMPO ACTIVADO! El enlace satelital con el equipo "${teamName}" está activo.`);
        onTriggerLogTerminal(`ACTIVADO EN CAMPO: Juego de Escuadra [${teamName}] en línea.`);
        await fetchState();
      } else {
        const errData = await res.json();
        setErrorMessage(`ERROR DE ACTIVACIÓN: ${errData.error}`);
        onTriggerLogTerminal(`FALLO DE ENLACE: Escuadra [${teamName}] intentó activar fuera del margen de 15 minutos.`);
      }
    } catch (err) {
      setErrorMessage("Error al activar la sesión de juego.");
    }
  };

  const handleValidateChallenge = async (gameId: string, teamName: string, missionId: string, customAnswer?: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    
    const ans = customAnswer || gameAnswers[gameId] || "";
    if (!ans.trim()) {
      setErrorMessage("Por favor introduzca el código QR leído o resuelva la respuesta del enigma.");
      return;
    }

    try {
      const res = await fetch(`/api/active-games/${gameId}/validate-mission-challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          answer: ans.trim(),
          hintsUsed: 0,
          timeSpent: 15,
          points: 100
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedGame = data.game as ActiveGameSession;
        
        // Clear answer field
        setGameAnswers(prev => ({ ...prev, [gameId]: "" }));

        if (updatedGame.status === "COMPLETED") {
          setSuccessMessage(`¡CÓDIGO QR CORRECTO! La Escuadra ${teamName} ha completado exitosamente la secuencia satelital de la aventura.`);
          onTriggerLogTerminal(`JUEGO COMPLETADO: Escuadra [${teamName}] validó el QR final descifrando el Manuscrito.`);
        } else {
          setSuccessMessage(`¡CÓDIGO QR CORRECTO! Baluarte superado con éxito por ${teamName}.`);
          onTriggerLogTerminal(`TELEMETRÍA: Escuadra [${teamName}] escaneó código QR válido.`);
        }
        await fetchState();
      } else {
        const errData = await res.json();
        setErrorMessage(errData.error || "Código QR o respuesta incorrecta para este baluarte.");
      }
    } catch (err) {
      setErrorMessage("Error de enlace con el validador satelital.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="border-b border-outline-variant/60 pb-4">
        <h1 className="font-serif text-4xl text-on-surface font-bold">Sesiones de Juegos Activos y Telemetría</h1>
        <p className="text-outline text-xs mt-1">Monitorea los despliegues reales en el mapa urbano de Cartagena. Valida reservas dentro del rango de 15 minutos y realiza seguimiento satelital de pistas en vivo.</p>
      </div>

      {/* Message Notifications */}
      {successMessage && (
        <div className="bg-emerald-950/20 border-l-2 border-emerald-400 text-emerald-300 p-4 text-xs font-status-mono rounded shadow flex justify-between items-center">
          <span>✓ {successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-400 hover:text-white p-1">✕</button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/20 border-l-2 border-error text-error p-4 text-xs font-status-mono rounded shadow flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-error shrink-0" />
            <span>&gt; RESTRICCIÓN DE SEGURIDAD: {errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-error hover:text-white p-1">✕</button>
        </div>
      )}

      {/* Main Grid: Control / Creation & Sessions table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Creation panel (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50 space-y-4">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                PROGRAMAR DESPLIEGUE
              </h3>
              <button
                onClick={() => setShowAddSession(!showAddSession)}
                className="bg-primary/10 hover:bg-primary border border-primary/30 hover:text-nocturne-blue px-2 py-1 rounded text-[10px] font-bold uppercase cursor-pointer"
              >
                {showAddSession ? "Ocultar" : "Nueva Reserva"}
              </button>
            </div>

            {showAddSession ? (
              <form onSubmit={handleCreateSession} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-outline font-semibold">Seleccionar Historia / Juego *</label>
                  <select
                    value={selectedStoryId}
                    onChange={(e) => setSelectedStoryId(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded font-medium"
                    required
                  >
                    <option value="">-- Elige aventura --</option>
                    {allStories.map(s => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-outline font-semibold">Seleccionar Escuadra de Campo *</label>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-serif uppercase font-bold"
                    required
                  >
                    <option value="">-- Elige escuadra --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>Escuadra {t.name} (Miembros: {t.memberIds.length})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-outline font-semibold">Fecha y Hora de la Reserva (Booking) *</label>
                  <input
                    type="datetime-local"
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-status-mono font-bold"
                    required
                  />
                  <span className="text-[10px] text-outline block mt-1">El juego solo podrá activarse en campo en una ventana de 15 minutos antes/después de esta hora.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-outline font-semibold">Nivel de Dificultad *</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded font-medium"
                  >
                    <option value="Fácil">Fácil (5-7 misiones)</option>
                    <option value="Medium">Medium (8-10 misiones)</option>
                    <option value="Difícil">Difícil (10+ misiones)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-nocturne-blue font-bold py-2.5 rounded uppercase tracking-wider text-xs cursor-pointer shadow-md"
                >
                  Registrar Reserva
                </button>
              </form>
            ) : (
              <div className="p-4 bg-black/40 border border-outline-variant/20 rounded text-center text-xs text-outline space-y-1.5">
                <p className="font-serif font-bold text-on-surface">Reglas de Activación Horaria</p>
                <p className="leading-relaxed text-[11px]">Para garantizar el orden de los baluartes y que los actores de campo se encuentren listos, el sistema valida que el equipo inicie sesión dentro de un margen estricto de **15 minutos** respecto a su hora agendada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Live sessions monitor (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-panel p-6 rounded-lg border border-outline-variant/50 space-y-6">
            <div className="flex justify-between items-center border-b border-outline-variant/30 pb-3">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary animate-pulse" />
                CENTRAL DE MONITOREO DE DESPLIEGUES DE CAMPO
              </h3>
              <button 
                onClick={fetchState}
                className="text-outline hover:text-primary transition-colors p-1"
                title="Actualizar Satélite"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {activeGames.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-8">No hay reservas de juegos agendados en la base de datos.</p>
            ) : (
              <div className="space-y-6">
                {activeGames.map((game) => {
                  const currentMissionIndex = game.missions.findIndex(m => !m.completed);
                  const activeIdx = currentMissionIndex === -1 ? game.missions.length - 1 : currentMissionIndex;
                  const currentMissionSummary = game.missions[activeIdx];
                  const fullDetails = getFullMissionDetails(currentMissionSummary?.missionId);
                  const progressPct = Math.round((game.missions.filter(m => m.completed).length / game.missions.length) * 100);

                  return (
                    <div 
                      key={game.id} 
                      className={`p-5 rounded-lg border transition-all space-y-4 ${
                        game.status === "ACTIVE" 
                          ? "bg-[#021224]/70 border-ariadna-cyan shadow-[0_0_15px_rgba(6,182,212,0.12)]"
                          : game.status === "COMPLETED"
                            ? "bg-emerald-950/15 border-emerald-500/30 opacity-75"
                            : "bg-surface-container-low border-outline-variant/40"
                      }`}
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-2 border-b border-outline-variant/20 pb-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif text-base text-on-surface font-bold uppercase">
                              ESCUADRA {game.name}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-status-mono font-bold uppercase ${
                              game.status === "ACTIVE" 
                                ? "bg-ariadna-cyan/15 text-ariadna-cyan border border-ariadna-cyan/30 animate-pulse"
                                : game.status === "COMPLETED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                  : "bg-outline-variant/30 text-outline border border-outline-variant/40"
                            }`}>
                              {game.status === "ACTIVE" ? "🛰️ EN CAMPO (ACTIVO)" : game.status === "COMPLETED" ? "✓ EXITOSO (COMPLETADO)" : "⏳ PROGRAMADO"}
                            </span>
                          </div>
                          
                          <p className="text-primary font-serif text-sm font-medium mt-1">{game.storyTitle}</p>
                        </div>

                        <div className="font-status-mono text-right text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 justify-end text-outline">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            <span>Reserva: {new Date(game.bookingTime).toLocaleString()}</span>
                          </div>
                          <div className="text-lantern-amber font-bold font-sans">Dificultad: {game.difficulty}</div>
                        </div>
                      </div>

                      {/* Scheduled -> Inactive view with Launch Trigger */}
                      {game.status === "PENDING" && (
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-black/35 p-4 rounded-lg border border-outline-variant/20 gap-4">
                          <div>
                            <p className="text-[11px] text-outline leading-relaxed">
                              Esta aventura está agendada para el equipo. Código de Activación: <strong className="text-primary font-status-mono text-xs">{game.accessCode}</strong>
                            </p>
                            <p className="text-[10px] text-outline/80 mt-1">Para simular el inicio, presione "Activar Sesión" a continuación.</p>
                          </div>
                          <button
                            onClick={() => handleActivateGame(game.id, game.name)}
                            className="bg-primary hover:bg-cyan-400 text-nocturne-blue font-bold px-4 py-2.5 text-xs uppercase tracking-wider rounded cursor-pointer shrink-0 shadow-md flex items-center gap-1.5"
                          >
                            <Play className="w-4 h-4 fill-current text-nocturne-blue" />
                            <span>Activar Sesión</span>
                          </button>
                        </div>
                      )}

                      {/* Active Live Telemetry Progress */}
                      {game.status === "ACTIVE" && (
                        <div className="space-y-4">
                          {/* Progress bar */}
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[11px] font-status-mono">
                              <span className="text-ariadna-cyan font-bold">PROGRESO DEL RECORRIDO</span>
                              <span className="text-on-surface">{game.missions.filter(m => m.completed).length} / {game.missions.length} MISIONES</span>
                            </div>
                            <div className="w-full bg-outline-variant/30 h-2 rounded-full overflow-hidden">
                              <div className="bg-ariadna-cyan h-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
                            </div>
                          </div>

                          {/* Current active mission clue box */}
                          {currentMissionSummary ? (
                            <div className="bg-black/50 border border-ariadna-cyan/20 p-4 rounded-lg space-y-3">
                              <div className="flex justify-between items-center border-b border-outline-variant/20 pb-1.5 text-xs">
                                <span className="text-[10px] text-lantern-amber font-status-mono font-bold uppercase tracking-wider">
                                  MISIÓN ACTUAL ACTIVA #0{activeIdx + 1}
                                </span>
                                <span className="text-[10px] text-outline font-status-mono">Código de Pista: {currentMissionSummary.missionId}</span>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="font-serif text-base text-primary font-bold">{currentMissionSummary.name}</h4>
                                <p className="text-xs text-on-surface-variant flex items-center gap-1.5 font-bold">
                                  <MapPin className="w-3.5 h-3.5 text-primary" />
                                  <span>{fullDetails?.location || "Ubicación GPS de Cartagena"}</span>
                                </p>
                                <p className="text-xs text-outline leading-relaxed font-sans">
                                  {fullDetails?.riddle ? `"${fullDetails.riddle}"` : "Cargando coordenadas..."}
                                </p>
                              </div>

                              {/* QR Validation and Challenge Solving Controls */}
                              <div className="pt-3 border-t border-outline-variant/25 space-y-3">
                                <div className="flex justify-between items-center text-[11px]">
                                  <span className="text-outline font-sans">
                                    Esta pista requiere validar el <strong>Código QR del Reto</strong> en terreno para avanzar.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setShowAnswersHelp(!showAnswersHelp)}
                                    className="text-primary hover:underline font-bold"
                                  >
                                    {showAnswersHelp ? "Ocultar pistas de respuesta" : "💡 Mostrar código QR correcto"}
                                  </button>
                                </div>

                                {showAnswersHelp && fullDetails && (
                                  <div className="bg-primary/5 border border-primary/20 p-2.5 rounded text-[11px] text-primary flex justify-between items-center font-status-mono">
                                    <span>Código QR físico en este Baluarte:</span>
                                    <span className="bg-primary/10 px-2 py-0.5 rounded font-bold uppercase select-all border border-primary/20 text-ariadna-cyan">
                                      {fullDetails.answer}
                                    </span>
                                  </div>
                                )}

                                {scanningGameId === game.id ? (
                                  <div className="relative bg-black h-36 rounded-lg overflow-hidden border border-ariadna-cyan flex flex-col items-center justify-center p-4">
                                    <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400 animate-bounce shadow-[0_0_10px_#22d3ee]"></div>
                                    <div className="absolute inset-0 bg-cyan-500/5 pointer-events-none"></div>
                                    <RefreshCw className="w-8 h-8 text-ariadna-cyan animate-spin mb-2" />
                                    <p className="text-[10px] font-status-mono text-ariadna-cyan font-bold tracking-widest uppercase animate-pulse">
                                      🛰️ ESCANEANDO CÓDIGO QR EN BALUARTE...
                                    </p>
                                    <p className="text-[9px] text-outline mt-1 font-status-mono">
                                      Leyendo etiqueta física en {fullDetails?.location}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-2.5">
                                    <div className="relative flex-1">
                                      <input
                                        type="text"
                                        placeholder="Introduce el código QR o solución del enigma..."
                                        value={gameAnswers[game.id] || ""}
                                        onChange={(e) => setGameAnswers(prev => ({ ...prev, [game.id]: e.target.value }))}
                                        className="bg-black/60 border border-outline-variant/60 text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded font-medium uppercase tracking-wider placeholder:normal-case"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            handleValidateChallenge(game.id, game.name, currentMissionSummary.missionId);
                                          }
                                        }}
                                      />
                                    </div>

                                    <div className="flex gap-2 shrink-0">
                                      <button
                                        onClick={async () => {
                                          if (!fullDetails) return;
                                          setScanningGameId(game.id);
                                          setTimeout(() => {
                                            setScanningGameId(null);
                                            handleValidateChallenge(game.id, game.name, currentMissionSummary.missionId, fullDetails.answer);
                                          }, 2500);
                                        }}
                                        className="bg-primary/10 hover:bg-primary/20 text-ariadna-cyan font-bold px-3 py-2 text-xs uppercase tracking-wider rounded border border-ariadna-cyan/30 flex items-center gap-1.5 cursor-pointer"
                                        title="Simular lectura de QR real con cámara de dispositivo"
                                      >
                                        <span>📷 Leer QR</span>
                                      </button>

                                      <button
                                        onClick={() => handleValidateChallenge(game.id, game.name, currentMissionSummary.missionId)}
                                        className="bg-lantern-amber hover:bg-yellow-500 text-nocturne-blue font-bold px-4 py-2 text-xs uppercase tracking-wider rounded cursor-pointer shadow flex items-center gap-1.5 transition-all"
                                      >
                                        <CheckCircle className="w-3.5 h-3.5 text-nocturne-blue" />
                                        <span>Validar</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-error">Fallo de lectura de secuencia de misiones.</p>
                          )}
                        </div>
                      )}

                      {/* Completed summary view */}
                      {game.status === "COMPLETED" && (
                        <div className="bg-emerald-950/10 border border-emerald-500/25 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-status-mono text-emerald-300">
                          <div className="space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              <span>✓ ¡MISIÓN FINALIZADA CON ÉXITO!</span>
                            </p>
                            <p className="text-[11px] text-outline leading-relaxed">
                              La escuadra completó todas las {game.missions.length} misiones asignadas y descifró las letras clave en el centro histórico de Cartagena.
                            </p>
                          </div>
                          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-2 rounded text-right shrink-0">
                            <span className="text-[9px] text-outline font-bold uppercase block font-status-mono">TIEMPO EMPLEADO</span>
                            <span className="text-sm font-bold text-emerald-400">{game.globalTime}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
