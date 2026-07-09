import React, { useState, useEffect } from "react";
import { X, Radio, MapPin, ShieldAlert, Navigation, Users, User } from "lucide-react";
import { City, Story } from "../types";

interface NewMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (missionData: { 
    investigatorId: string; 
    currentChapter: string; 
    lat: number; 
    lng: number;
    difficulty?: string;
    storyId?: string;
    playerOrTeamId?: string;
    isTeam?: boolean;
  }) => void;
}

export default function NewMissionModal({ isOpen, onClose, onDeploy }: NewMissionModalProps) {
  if (!isOpen) return null;

  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  
  // Players and Teams assignments
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [assignType, setAssignType] = useState<"TEAM" | "PLAYER" | "CUSTOM">("TEAM");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [customAssigneeName, setCustomAssigneeName] = useState("");

  const [chapter, setChapter] = useState("");
  const [customChapter, setCustomChapter] = useState("");
  const [difficulty, setDifficulty] = useState<"Fácil" | "Medium" | "Difícil">("Medium");

  useEffect(() => {
    if (isOpen) {
      fetch("/api/cities")
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed to load cities");
        })
        .then((data: City[]) => {
          setCities(data);
          if (data.length > 0) {
            setSelectedCityId(data[0].id);
            const firstCityStories = data[0].stories || [];
            if (firstCityStories.length > 0) {
              setChapter(firstCityStories[0].title);
            } else {
              setChapter("El Secreto de la Inquisición");
            }
          } else {
            setChapter("El Secreto de la Inquisición");
          }
        })
        .catch((err) => {
          console.error("Error loading operational cities/stories:", err);
        });

      // Fetch players and teams
      fetch("/api/players")
        .then(res => res.json())
        .then(data => {
          setPlayers(data);
          if (assignType === "PLAYER" && data.length > 0) {
            setSelectedAssigneeId(data[0].id);
          }
        })
        .catch(err => console.error("Error loading players:", err));

      fetch("/api/teams")
        .then(res => res.json())
        .then(data => {
          setTeams(data);
          if (assignType === "TEAM" && data.length > 0) {
            setSelectedAssigneeId(data[0].id);
          }
        })
        .catch(err => console.error("Error loading teams:", err));
    }
  }, [isOpen]);

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const selected = cities.find((c) => c.id === cityId);
    const stories = selected ? (selected.stories || []) : [];
    if (stories.length > 0) {
      setChapter(stories[0].title);
    } else {
      setChapter("CUSTOM");
    }
  };

  const handleAssignTypeChange = (type: "TEAM" | "PLAYER" | "CUSTOM") => {
    setAssignType(type);
    if (type === "PLAYER" && players.length > 0) {
      setSelectedAssigneeId(players[0].id);
    } else if (type === "TEAM" && teams.length > 0) {
      setSelectedAssigneeId(teams[0].id);
    } else {
      setSelectedAssigneeId("");
    }
  };

  const selectedCity = cities.find((c) => c.id === selectedCityId);
  const cityStories = selectedCity ? (selectedCity.stories || []) : [];
  const selectedStory = cityStories.find((s) => s.title === chapter);

  // Derive assigneeName
  let assigneeName = "INVITADO";
  if (assignType === "PLAYER") {
    const p = players.find(x => x.id === selectedAssigneeId);
    assigneeName = p ? p.fullName : "INVITADO";
  } else if (assignType === "TEAM") {
    const t = teams.find(x => x.id === selectedAssigneeId);
    assigneeName = t ? t.name : "STORM";
  } else {
    assigneeName = customAssigneeName.trim() || "CUSTOM";
  }

  const finalChapter = chapter === "CUSTOM" ? (customChapter.trim() || "Sector Inexplorado") : chapter;

  // Generate route sequence helper for preview
  const getGeneratedRouteMissions = () => {
    if (!selectedStory || !selectedStory.missions || selectedStory.missions.length < 2) {
      return [];
    }
    const pool = selectedStory.missions;
    const firstM = pool[0];
    const lastM = pool[pool.length - 1];
    const middlePool = pool.slice(1, pool.length - 1);
    
    let targetMiddle = 3;
    if (difficulty === "Fácil") targetMiddle = 3;
    else if (difficulty === "Medium") targetMiddle = 6;
    else targetMiddle = pool.length;

    // Stable sub-selection or shuffling (we can just slice them)
    const selectedMiddle = middlePool.slice(0, targetMiddle);
    return [firstM, ...selectedMiddle, lastM];
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy({
      investigatorId: `#${assigneeName.toUpperCase()}`,
      currentChapter: finalChapter,
      lat: selectedCityId === "barranquilla" ? 10.9639 : 10.4229,
      lng: selectedCityId === "barranquilla" ? -74.7964 : -75.5350,
      difficulty,
      storyId: selectedStory?.id,
      playerOrTeamId: selectedAssigneeId || undefined,
      isTeam: assignType === "TEAM"
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="glass-panel border-2 border-primary/40 p-6 max-w-md w-full relative rounded shadow-[0_0_50px_rgba(242,202,80,0.15)]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-outline hover:text-primary transition-colors cursor-pointer p-1.5 rounded-full hover:bg-surface-variant/30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/50 pb-3">
          <Radio className="w-6 h-6 text-primary animate-pulse" />
          <div>
            <h2 className="font-headline-md text-primary text-xl font-bold tracking-tight">PROTOCOLO DE DESPLIEGUE</h2>
            <p className="font-status-mono text-[9px] text-outline tracking-wider">SE REQUIERE AUTORIZACIÓN DEL COMANDANTE</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Asignación del Investigador (Jugador o Equipo) */}
          <div className="space-y-2">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary" />
              Asignar Juego / Indicativo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "TEAM", label: "EQUIPO" },
                { id: "PLAYER", label: "JUGADOR" },
                { id: "CUSTOM", label: "OTRO" }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => handleAssignTypeChange(opt.id as any)}
                  className={`py-2 px-1 text-center border text-[11px] font-bold rounded transition-all cursor-pointer ${
                    assignType === opt.id 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-outline-variant/50 hover:bg-surface-variant/20 text-on-surface-variant"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {assignType === "TEAM" && (
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none rounded uppercase font-bold"
              >
                {teams.length > 0 ? (
                  teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      ESCUADRA {t.name.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <option value="">Cargando equipos...</option>
                )}
              </select>
            )}

            {assignType === "PLAYER" && (
              <select
                value={selectedAssigneeId}
                onChange={(e) => setSelectedAssigneeId(e.target.value)}
                className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none rounded uppercase font-bold"
              >
                {players.length > 0 ? (
                  players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <option value="">Cargando jugadores...</option>
                )}
              </select>
            )}

            {assignType === "CUSTOM" && (
              <input
                type="text"
                placeholder="INGRESE NOMBRE DE JUGADOR O EQUIPO"
                value={customAssigneeName}
                onChange={(e) => setCustomAssigneeName(e.target.value)}
                className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary placeholder-outline/50 focus:ring-1 focus:ring-primary focus:outline-none rounded uppercase font-bold"
                required
              />
            )}
          </div>

          {/* City selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold">Ciudad Operativa</label>
            <select
              value={selectedCityId}
              onChange={(e) => handleCityChange(e.target.value)}
              className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none rounded"
            >
              {cities.length > 0 ? (
                cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              ) : (
                <option value="">Cargando ciudades...</option>
              )}
            </select>
          </div>

          {/* Chapter selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold">Dossier Histórico / Capítulo</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none rounded"
            >
              {cityStories.length > 0 ? (
                cityStories.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))
              ) : (
                <>
                  <option value="El Secreto de la Inquisición">El Secreto de la Inquisición</option>
                  <option value="Escape de la Fortaleza">Escape de la Fortaleza</option>
                  <option value="El Robo de las Esmeraldas">El Robo de las Esmeraldas</option>
                  <option value="La Bóveda del Galeón de Oro">La Bóveda del Galeón de Oro</option>
                </>
              )}
              <option value="CUSTOM">Capítulo Personalizado...</option>
            </select>
            {chapter === "CUSTOM" && (
              <input
                type="text"
                placeholder="INGRESE EL NOMBRE DEL CAPÍTULO"
                value={customChapter}
                onChange={(e) => setCustomChapter(e.target.value)}
                className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary placeholder-outline/50 focus:ring-1 focus:ring-primary focus:outline-none rounded"
                required
              />
            )}
          </div>

          {/* Dificultad de la Ruta */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-primary rotate-45" />
              Dificultad de la Ruta escogida por el jugador
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Fácil", desc: "5-7 Misiones" },
                { id: "Medium", desc: "8-10 Misiones" },
                { id: "Difícil", desc: "Todas" }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDifficulty(opt.id as any)}
                  className={`py-2 px-2 border text-xs font-bold rounded transition-all cursor-pointer text-center ${
                    difficulty === opt.id 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-outline-variant/50 hover:bg-surface-variant/20 text-on-surface-variant"
                  }`}
                >
                  <div>{opt.id.toUpperCase()}</div>
                  <div className="text-[9px] font-status-mono text-outline/85 font-normal mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Vista Previa de la Ruta Generada */}
          {selectedStory && selectedStory.missions && selectedStory.missions.length >= 2 && (
            <div className="bg-surface-container-low/60 border border-outline-variant/20 p-3 rounded space-y-2 max-h-48 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-outline-variant/15 pb-1">
                <span className="text-[9px] font-status-mono text-primary font-bold uppercase">
                  VISTA PREVIA DE SECUENCIA DE RUTA (ALEATORIA)
                </span>
                <span className="text-[9px] font-status-mono text-outline font-bold">
                  {getGeneratedRouteMissions().length} Baluartes
                </span>
              </div>
              
              <div className="space-y-1.5">
                {getGeneratedRouteMissions().map((m, idx, arr) => {
                  const isFirst = idx === 0;
                  const isLast = idx === arr.length - 1;
                  return (
                    <div key={idx} className="flex gap-2 items-center text-[10px] font-status-mono">
                      <span className={`w-4 h-4 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        isFirst ? "bg-primary text-nocturne-blue animate-pulse" : isLast ? "bg-lantern-amber text-nocturne-blue" : "bg-outline-variant/40 text-on-surface"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="flex-1 truncate">
                        <span className="font-bold text-on-surface uppercase">{m.name}</span>
                        <span className="text-outline text-[8px] block truncate">📍 {m.location}</span>
                      </div>
                      {isFirst && (
                        <span className="text-[8px] text-primary bg-primary/10 border border-primary/20 px-1 py-0.2 rounded font-sans uppercase font-bold shrink-0">
                          Inicio
                        </span>
                      )}
                      {isLast && (
                        <span className="text-[8px] text-lantern-amber bg-lantern-amber/10 border border-lantern-amber/20 px-1 py-0.2 rounded font-sans uppercase font-bold shrink-0">
                          Fin
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Warnings & confirmation */}
          <div className="bg-red-950/15 border border-red-900/30 p-2.5 flex gap-2.5 rounded">
            <ShieldAlert className="w-5 h-5 text-lantern-amber shrink-0 mt-0.5" />
            <p className="text-[10px] text-outline leading-normal font-sans">
              El despliegue establece un enlace de telemetría en vivo con el nodo táctico. Cualquier pérdida de señal satelital debe informarse al Centro de Mando de City Quest Explorer de inmediato.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-variant text-on-surface hover:bg-surface-variant/70 border border-outline-variant/30 py-2.5 text-xs font-bold cursor-pointer rounded uppercase transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-primary text-nocturne-blue hover:opacity-90 font-bold py-2.5 text-xs cursor-pointer rounded uppercase flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-[0_0_15px_rgba(242,202,80,0.2)]"
            >
              <Navigation className="w-4 h-4 fill-current rotate-45" />
              Desplegar Protocolo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
