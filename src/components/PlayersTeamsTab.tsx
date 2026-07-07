import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  UserCheck,
  CheckCircle
} from "lucide-react";
import { Player, Team } from "../types";

interface PlayersTeamsTabProps {
  onTriggerLogTerminal: (cmd: string) => void;
}

export default function PlayersTeamsTab({ onTriggerLogTerminal }: PlayersTeamsTabProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Creation States
  const [pName, setPName] = useState("");
  const [pHealthAccepted, setPHealthAccepted] = useState(false);
  const [pTermsAccepted, setPTermsAccepted] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const [tName, setTName] = useState("");
  const [showAddTeam, setShowAddTeam] = useState(false);

  // Assignment State
  const [assignPlayerId, setAssignPlayerId] = useState<Record<string, string>>({});

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        fetch("/api/players"),
        fetch("/api/teams")
      ]);
      if (pRes.ok) setPlayers(await pRes.json());
      if (tRes.ok) setTeams(await tRes.json());
    } catch (err) {
      console.error("Error fetching players/teams:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName.trim()) return;
    if (!pHealthAccepted || !pTermsAccepted) {
      alert("El jugador debe aceptar el cuestionario de exoneración y seguridad física.");
      return;
    }

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: pName })
      });

      if (res.ok) {
        const created = await res.json();
        setPName("");
        setPHealthAccepted(false);
        setPTermsAccepted(false);
        setShowAddPlayer(false);
        onTriggerLogTerminal(`Registrado nuevo jugador: ${created.fullName} con código QR Hash [${created.playerQrHash}]`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlayer = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar al jugador "${name}"?`)) return;
    try {
      const res = await fetch(`/api/players/${id}`, { method: "DELETE" });
      if (res.ok) {
        onTriggerLogTerminal(`Removido jugador: ${name}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tName, playCity: "Cartagena" })
      });

      if (res.ok) {
        const created = await res.json();
        setTName("");
        setShowAddTeam(false);
        onTriggerLogTerminal(`Creado nuevo equipo: Escuadra ${created.name} con Código QR Hash [${created.teamQrHash}]`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddMember = async (teamId: string) => {
    const playerId = assignPlayerId[teamId];
    if (!playerId) return;

    const p = players.find(x => x.id === playerId);
    try {
      const res = await fetch(`/api/teams/${teamId}/add_member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });

      if (res.ok) {
        onTriggerLogTerminal(`Asignado jugador [${p?.fullName}] al equipo`);
        setAssignPlayerId(prev => ({ ...prev, [teamId]: "" }));
        await fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "No se pudo asignar el miembro.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper function to resolve players for each team
  const getTeamMembers = (memberIds: string[]) => {
    return players.filter(p => memberIds.includes(p.id));
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="border-b border-outline-variant/60 pb-4">
        <h1 className="font-serif text-4xl text-on-surface font-bold">Gestión de Jugadores y Equipos</h1>
        <p className="text-outline text-xs mt-1">Registra y administra los jugadores del juego de rol real. Garantiza la exoneración de seguridad y asócialos a escuadras con llaves de identificación QR únicas.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Players Database (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                BASE DE JUGADORES
              </h3>
              <button 
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-nocturne-blue transition-all px-2.5 py-1 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>NUEVO</span>
              </button>
            </div>

            {showAddPlayer && (
              <form onSubmit={handleCreatePlayer} className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-4 mb-4 text-xs">
                <h4 className="text-primary font-bold uppercase tracking-wider text-[11px] border-b border-outline-variant/20 pb-1">
                  Registrar Jugador en el Sistema
                </h4>
                <div className="space-y-1.5">
                  <label className="text-outline font-semibold block">Nombre Completo *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Sofia Gomez" 
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                    required
                  />
                </div>

                {/* Safety Questionnaire Checklist */}
                <div className="space-y-2.5 bg-black/35 p-3 rounded border border-outline-variant/30">
                  <span className="text-[10px] text-lantern-amber font-bold font-status-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DECLARACIÓN DE EXONERACIÓN Y SEGURIDAD
                  </span>
                  
                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-on-surface-variant">
                    <input 
                      type="checkbox" 
                      checked={pHealthAccepted}
                      onChange={(e) => setPHealthAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-outline bg-black focus:ring-primary text-primary"
                    />
                    <span>Confirmo que me encuentro en perfectas condiciones físicas y de salud para el recorrido peatonal urbano. *</span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-on-surface-variant">
                    <input 
                      type="checkbox" 
                      checked={pTermsAccepted}
                      onChange={(e) => setPTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-outline bg-black focus:ring-primary text-primary"
                    />
                    <span>He leído, comprendido y acepto la exoneración de responsabilidad civil y las reglas de seguridad de Ariadna Core. *</span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-nocturne-blue px-3 py-2 font-bold uppercase rounded cursor-pointer flex-1">
                    Guardar Jugador
                  </button>
                  <button type="button" onClick={() => setShowAddPlayer(false)} className="border border-outline-variant text-outline px-3 py-2 font-bold uppercase rounded cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {players.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-6">No hay jugadores registrados.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                {players.map((player) => (
                  <div key={player.id} className="bg-surface-container-low p-3.5 rounded border border-outline-variant/30 flex justify-between items-start text-xs relative group hover:border-outline-variant transition-colors">
                    <div className="space-y-1">
                      <div className="font-bold text-on-surface flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-primary shrink-0" />
                        <span>{player.fullName}</span>
                      </div>
                      
                      {/* Unique QR Hash mockup code */}
                      <div className="flex items-center gap-1 text-[10px] text-ariadna-cyan font-status-mono bg-ariadna-cyan/5 px-2 py-0.5 rounded border border-ariadna-cyan/15 w-fit">
                        <QrCode className="w-3 h-3 text-ariadna-cyan" />
                        <span>HASH QR: {player.playerQrHash}</span>
                      </div>

                      <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold font-status-mono pt-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>EXONERACIÓN COMPLETADA Y FIRMADA</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeletePlayer(player.id, player.fullName)}
                      className="text-outline hover:text-error p-1 rounded hover:bg-error/5 cursor-pointer opacity-70 group-hover:opacity-100 transition-opacity"
                      title="Eliminar Jugador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Teams list & Assignments (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                ESCUADRAS Y EQUIPOS ACTIVOS
              </h3>
              <button 
                onClick={() => setShowAddTeam(!showAddTeam)}
                className="bg-lantern-amber border border-lantern-amber/30 text-nocturne-blue px-3 py-1 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>NUEVO EQUIPO</span>
              </button>
            </div>

            {showAddTeam && (
              <form onSubmit={handleCreateTeam} className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-4 mb-4 text-xs">
                <h4 className="text-primary font-bold uppercase tracking-wider text-[11px] border-b border-outline-variant/20 pb-1">
                  Crear Nueva Escuadra
                </h4>
                <div className="space-y-1.5">
                  <label className="text-outline font-semibold block">Nombre de la Escuadra *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. CROWLEY, VALKYRIE, STORM" 
                    value={tName}
                    onChange={(e) => setTName(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-serif uppercase text-sm font-bold"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-nocturne-blue px-3 py-2 font-bold uppercase rounded cursor-pointer flex-1">
                    Crear Equipo
                  </button>
                  <button type="button" onClick={() => setShowAddTeam(false)} className="border border-outline-variant text-outline px-3 py-2 font-bold uppercase rounded cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {teams.length === 0 ? (
              <p className="text-xs text-outline italic text-center py-6">No hay escuadras creadas en la base de datos.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {teams.map((team) => {
                  const teamMembers = getTeamMembers(team.memberIds);
                  const teamMemberIds = new Set(team.memberIds);
                  const assignablePlayers = players.filter(p => !teamMemberIds.has(p.id));

                  return (
                    <div key={team.id} className="bg-black/35 p-4 rounded-lg border border-outline-variant/30 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-outline-variant/20 pb-2">
                          <div>
                            <span className="text-[10px] text-outline font-bold font-status-mono">ESCUADRA</span>
                            <h4 className="font-serif text-lg text-primary font-bold uppercase">{team.name}</h4>
                          </div>
                          
                          <div className="flex items-center gap-1 text-[9px] text-lantern-amber font-status-mono bg-lantern-amber/10 border border-lantern-amber/20 px-2 py-0.5 rounded">
                            <QrCode className="w-3 h-3 text-lantern-amber" />
                            <span>QR: {team.teamQrHash}</span>
                          </div>
                        </div>

                        {/* Members list */}
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-outline uppercase font-bold block">Miembros Activos ({teamMembers.length}):</span>
                          {teamMembers.length === 0 ? (
                            <span className="text-[10px] text-outline italic block pl-1">Sin miembros asignados</span>
                          ) : (
                            <div className="space-y-1">
                              {teamMembers.map(m => (
                                <div key={m.id} className="bg-surface-container-lowest border border-outline-variant/15 px-2 py-1 rounded text-[11px] text-on-surface flex justify-between items-center">
                                  <span>{m.fullName}</span>
                                  <span className="text-[8px] text-outline font-status-mono">{m.playerQrHash.substring(0, 6)}...</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Assign member tool */}
                      <div className="border-t border-outline-variant/20 pt-3 space-y-1.5">
                        <span className="text-[9px] text-outline uppercase font-bold block">Vincular Jugador:</span>
                        <div className="flex gap-2">
                          <select
                            value={assignPlayerId[team.id] || ""}
                            onChange={(e) => setAssignPlayerId(prev => ({ ...prev, [team.id]: e.target.value }))}
                            className="bg-black/60 border border-outline-variant text-[10px] px-2 py-1.5 flex-1 focus:outline-none focus:border-primary text-on-surface rounded"
                          >
                            <option value="">Seleccionar jugador...</option>
                            {assignablePlayers.map(p => (
                              <option key={p.id} value={p.id}>{p.fullName}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAddMember(team.id)}
                            disabled={!assignPlayerId[team.id]}
                            className="bg-primary hover:bg-cyan-400 text-nocturne-blue text-[10px] px-3.5 py-1.5 font-bold uppercase rounded cursor-pointer disabled:opacity-40 disabled:hover:bg-primary"
                          >
                            Vincular
                          </button>
                        </div>
                      </div>

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
