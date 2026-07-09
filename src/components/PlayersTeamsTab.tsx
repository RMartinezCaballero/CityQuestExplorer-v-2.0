import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  QrCode, 
  ShieldCheck, 
  Plus, 
  UserCheck, 
  CheckCircle,
  Edit2,
  Save,
  X,
  Calendar,
  Zap,
  RefreshCw,
  AlertTriangle,
  Clipboard,
  Info
} from "lucide-react";
import { Player, Team } from "../types";
import QRCodeVisual from "./QRCodeVisual";

interface PlayersTeamsTabProps {
  onTriggerLogTerminal: (cmd: string) => void;
}

export default function PlayersTeamsTab({ onTriggerLogTerminal }: PlayersTeamsTabProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
  // Creation States
  const [pName, setPName] = useState("");
  const [pEmail, setPEmail] = useState("");
  const [pPhone, setPPhone] = useState("");
  const [pBadge, setPBadge] = useState("Detective");
  const [pCity, setPCity] = useState("Cartagena");
  const [pHealthAccepted, setPHealthAccepted] = useState(false);
  const [pTermsAccepted, setPTermsAccepted] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);

  const [tName, setTName] = useState("");
  const [tCity, setTCity] = useState("Cartagena");
  const [tCreatorId, setTCreatorId] = useState("");
  const [showAddTeam, setShowAddTeam] = useState(false);

  // Edit States
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editPlayerState, setEditPlayerState] = useState<Partial<Player>>({});

  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamState, setEditTeamState] = useState<Partial<Team>>({});

  // QR Scanning Simulation State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanPlayerId, setScanPlayerId] = useState("");
  const [scanTeamId, setScanTeamId] = useState("");
  const [scanStep, setScanStep] = useState<"select" | "confirm" | "success">("select");

  // Inactive Cleanup Logs
  const [cleanupResult, setCleanupResult] = useState<{ deletedCount: number; deleted: any[] } | null>(null);

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

  // Player Handlers
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
        body: JSON.stringify({ 
          fullName: pName,
          email: pEmail || undefined,
          phone: pPhone || undefined,
          avatarBadge: pBadge,
          desiredCity: pCity,
          integrityConfirmed: true
        })
      });

      if (res.ok) {
        const created = await res.json();
        setPName("");
        setPEmail("");
        setPPhone("");
        setPBadge("Detective");
        setPCity("Cartagena");
        setPHealthAccepted(false);
        setPTermsAccepted(false);
        setShowAddPlayer(false);
        onTriggerLogTerminal(`Registrado nuevo jugador: ${created.fullName} con insignia [${created.avatarBadge}] y código QR Hash [${created.playerQrHash}]`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditPlayer = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditPlayerState({ ...player });
  };

  const handleSavePlayer = async (id: string) => {
    if (!editPlayerState.fullName?.trim()) return;
    try {
      const res = await fetch(`/api/players/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editPlayerState)
      });
      if (res.ok) {
        onTriggerLogTerminal(`Actualizado perfil del jugador: ${editPlayerState.fullName}`);
        setEditingPlayerId(null);
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
        onTriggerLogTerminal(`Removido jugador de la base de datos: ${name}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Team Handlers
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim() || !tCreatorId) {
      alert("Debes indicar el nombre de la escuadra y seleccionar al jugador creador.");
      return;
    }

    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: tName, 
          playCity: tCity,
          creatorId: tCreatorId
        })
      });

      if (res.ok) {
        const created = await res.json();
        setTName("");
        setTCreatorId("");
        setShowAddTeam(false);
        onTriggerLogTerminal(`Creada escuadra: ${created.name} por el jugador id [${tCreatorId}]. Creador asignado automáticamente como primer miembro.`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditTeam = (team: Team) => {
    setEditingTeamId(team.id);
    setEditTeamState({ ...team });
  };

  const handleSaveTeam = async (id: string) => {
    if (!editTeamState.name?.trim() || !editTeamState.playCity?.trim()) return;
    try {
      const res = await fetch(`/api/teams/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editTeamState)
      });
      if (res.ok) {
        onTriggerLogTerminal(`Actualizado equipo "${editTeamState.name}" (Ciudad: ${editTeamState.playCity}, Último Uso: ${editTeamState.lastActiveAt})`);
        setEditingTeamId(null);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`¿Está seguro de eliminar la escuadra "${name}"?\n(Los jugadores de este equipo serán liberados y podrán unirse a otro equipo)`)) return;
    try {
      const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
      if (res.ok) {
        onTriggerLogTerminal(`Eliminado equipo: ${name}. Jugadores liberados.`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Join Team Handler
  const handleVincularJugador = async (teamId: string, playerId: string) => {
    if (!playerId) return;
    const p = players.find(x => x.id === playerId);
    const t = teams.find(x => x.id === teamId);
    try {
      const res = await fetch(`/api/teams/${teamId}/add_member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId })
      });

      if (res.ok) {
        onTriggerLogTerminal(`Sincronización QR exitosa: El jugador [${p?.fullName}] se unió a la escuadra [${t?.name}]`);
        await fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "No se pudo vincular.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // QR Join Simulation flow
  const handleOpenScanner = (teamId?: string) => {
    setScanTeamId(teamId || "");
    setScanPlayerId("");
    setScanStep("select");
    setScannerOpen(true);
  };

  const handleSimulateScanAction = () => {
    if (!scanPlayerId || !scanTeamId) return;
    setScanStep("confirm");
  };

  const handleConfirmScanJoin = async () => {
    const p = players.find(x => x.id === scanPlayerId);
    const t = teams.find(x => x.id === scanTeamId);
    if (!p || !t) return;

    try {
      const res = await fetch(`/api/teams/${scanTeamId}/add_member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId: scanPlayerId })
      });

      if (res.ok) {
        onTriggerLogTerminal(`[ESCÁNER QR] Jugador ${p.fullName} escaneó el código QR de ${t.name} y se unió exitosamente.`);
        setScanStep("success");
        await fetchData();
      } else {
        const errData = await res.json();
        alert(errData.error || "Error al unirse mediante QR.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Inactive Cleanup Sweep (> 6 months)
  const handleCleanupInactive = async () => {
    if (!confirm("¿Deseas iniciar el barrido automático de escuadras sin uso por más de 6 meses?\nLas escuadras que califiquen serán eliminadas y sus jugadores quedarán liberados.")) return;
    try {
      const res = await fetch("/api/teams/cleanup-inactive", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCleanupResult(data);
        onTriggerLogTerminal(`[SISTEMA DE MANTENIMIENTO] Barrido completado. Escuadras eliminadas por inactividad (> 6 meses): ${data.deletedCount}`);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isExpired = (lastActiveDateStr?: string) => {
    if (!lastActiveDateStr) return false;
    const lastActive = new Date(lastActiveDateStr);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return lastActive < sixMonthsAgo;
  };

  const getTeamMembers = (memberIds: string[]) => {
    return players.filter(p => memberIds.includes(p.id));
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="border-b border-outline-variant/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-serif text-4xl text-on-surface font-bold flex items-center gap-2">
            <Users className="text-primary w-9 h-9" />
            Consola de Jugadores y Escuadras
          </h1>
          <p className="text-outline text-xs mt-1">
            Administra perfiles, vincula jugadores a escuadras creadas por ellos mismos, simula el emparejamiento por escaneo de códigos QR y realiza limpieza automática de equipos inactivos.
          </p>
        </div>

        <button
          onClick={handleCleanupInactive}
          className="bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 hover:border-red-500/60 transition-all px-4 py-2 text-xs font-bold uppercase rounded cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.05)] shrink-0"
        >
          <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          <span>Limpieza Inactivos (&gt; 6 meses)</span>
        </button>
      </div>

      {cleanupResult && (
        <div className="bg-red-950/15 border border-red-500/30 p-4 rounded-lg text-xs space-y-2 animate-fadeIn">
          <div className="flex justify-between items-center">
            <span className="font-bold text-red-400 flex items-center gap-1.5 uppercase font-status-mono">
              <AlertTriangle className="w-4 h-4 animate-bounce" />
              RESULTADO DEL BARRIDO SATELITAL DE INACTIVIDAD
            </span>
            <button 
              onClick={() => setCleanupResult(null)} 
              className="text-outline hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-on-surface-variant">
            Se han identificado y depurado automáticamente <strong>{cleanupResult.deletedCount} escuadras</strong> que no registraban telemetría ni actividad de misiones en los últimos 6 meses.
          </p>
          {cleanupResult.deleted.length > 0 && (
            <div className="bg-black/45 p-2.5 rounded border border-red-900/20 font-status-mono text-[11px] text-red-300 space-y-1 max-h-[100px] overflow-y-auto">
              {cleanupResult.deleted.map((t: any) => (
                <div key={t.id} className="flex justify-between">
                  <span>❌ Escuadra: {t.name}</span>
                  <span className="text-outline">Último uso: {new Date(t.lastActiveAt).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Players Database (5 columns) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                BASE DE JUGADORES ({players.length})
              </h3>
              <button 
                onClick={() => setShowAddPlayer(!showAddPlayer)}
                className="bg-primary/10 border border-primary/30 text-primary hover:bg-primary hover:text-nocturne-blue transition-all px-2.5 py-1 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>NUEVO JUGADOR</span>
              </button>
            </div>

            {showAddPlayer && (
              <form onSubmit={handleCreatePlayer} className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-4 mb-4 text-xs">
                <h4 className="text-primary font-bold uppercase tracking-wider text-[11px] border-b border-outline-variant/20 pb-1 flex justify-between items-center">
                  <span>Registrar Jugador</span>
                  <button type="button" onClick={() => setShowAddPlayer(false)} className="text-outline hover:text-on-surface">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
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

                  <div className="space-y-1">
                    <label className="text-outline font-semibold block">Clase / Insignia</label>
                    <select
                      value={pBadge}
                      onChange={(e) => setPBadge(e.target.value)}
                      className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                    >
                      <option value="Detective">Detective</option>
                      <option value="Criptógrafo">Criptógrafo</option>
                      <option value="Historiador">Historiador</option>
                      <option value="Explorador">Explorador</option>
                      <option value="Infiltrador">Infiltrador</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-outline font-semibold block">Correo Electrónico</label>
                    <input 
                      type="email" 
                      placeholder="sofia@gmail.com" 
                      value={pEmail}
                      onChange={(e) => setPEmail(e.target.value)}
                      className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-outline font-semibold block">Teléfono Móvil</label>
                    <input 
                      type="text" 
                      placeholder="+57 301..." 
                      value={pPhone}
                      onChange={(e) => setPPhone(e.target.value)}
                      className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-outline font-semibold block">Ciudad de Operación</label>
                  <input 
                    type="text" 
                    placeholder="Cartagena" 
                    value={pCity}
                    onChange={(e) => setPCity(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                  />
                </div>

                {/* Safety Questionnaire Checklist */}
                <div className="space-y-2 bg-black/35 p-3 rounded border border-outline-variant/30">
                  <span className="text-[10px] text-lantern-amber font-bold font-status-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    DECLARACIÓN DE EXONERACIÓN Y SEGURIDAD
                  </span>
                  
                  <label className="flex items-start gap-2 cursor-pointer text-[10px] text-on-surface-variant">
                    <input 
                      type="checkbox" 
                      checked={pHealthAccepted}
                      onChange={(e) => setPHealthAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-outline bg-black focus:ring-primary text-primary"
                    />
                    <span>Exoneración física firmada (recorrido peatonal). *</span>
                  </label>

                  <label className="flex items-start gap-2 cursor-pointer text-[10px] text-on-surface-variant">
                    <input 
                      type="checkbox" 
                      checked={pTermsAccepted}
                      onChange={(e) => setPTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-outline bg-black focus:ring-primary text-primary"
                    />
                    <span>Acepto reglas de seguridad de Ariadna Core. *</span>
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
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1.5 custom-scrollbar">
                {players.map((player) => {
                  const isEditing = editingPlayerId === player.id;
                  return (
                    <div 
                      key={player.id} 
                      className={`p-3.5 rounded-lg border transition-all text-xs relative group ${
                        isEditing 
                          ? "bg-surface-container border-primary" 
                          : "bg-surface-container-low border-outline-variant/30 hover:border-outline-variant"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-3">
                          <div className="text-primary font-bold uppercase text-[10px]">EDITANDO PERFIL DE JUGADOR</div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-[10px] text-outline">Nombre Completo</label>
                              <input 
                                type="text"
                                value={editPlayerState.fullName || ""}
                                onChange={(e) => setEditPlayerState({ ...editPlayerState, fullName: e.target.value })}
                                className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-outline">Correo</label>
                                <input 
                                  type="text"
                                  value={editPlayerState.email || ""}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, email: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-outline">Teléfono</label>
                                <input 
                                  type="text"
                                  value={editPlayerState.phone || ""}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, phone: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-outline">Clase insignia</label>
                                <select 
                                  value={editPlayerState.avatarBadge || "Detective"}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, avatarBadge: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary"
                                >
                                  <option value="Detective">Detective</option>
                                  <option value="Criptógrafo">Criptógrafo</option>
                                  <option value="Historiador">Historiador</option>
                                  <option value="Explorador">Explorador</option>
                                  <option value="Infiltrador">Infiltrador</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] text-outline">Ciudad</label>
                                <input 
                                  type="text"
                                  value={editPlayerState.desiredCity || ""}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, desiredCity: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-outline">Código Acceso</label>
                                <input 
                                  type="text"
                                  value={editPlayerState.gameAccessCode || ""}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, gameAccessCode: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary font-status-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-outline">Hash QR único</label>
                                <input 
                                  type="text"
                                  value={editPlayerState.playerQrHash || ""}
                                  onChange={(e) => setEditPlayerState({ ...editPlayerState, playerQrHash: e.target.value })}
                                  className="bg-black/50 border border-outline-variant/60 p-2 text-xs w-full rounded text-primary font-status-mono"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button 
                              type="button" 
                              onClick={() => handleSavePlayer(player.id)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-nocturne-blue font-bold uppercase py-1.5 px-3 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>GUARDAR</span>
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setEditingPlayerId(null)}
                              className="border border-outline-variant text-outline hover:text-on-surface py-1.5 px-3 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>CANCELAR</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-bold text-on-surface flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-sm">{player.fullName}</span>
                                <span className="text-[9px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold font-status-mono">
                                  {player.avatarBadge || "Detective"}
                                </span>
                              </div>
                              <p className="text-outline text-[10px]">{player.email} | {player.phone}</p>
                            </div>
                            
                            <div className="flex gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => handleStartEditPlayer(player)}
                                className="text-outline hover:text-primary p-1 rounded hover:bg-primary/5 cursor-pointer"
                                title="Editar Jugador"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeletePlayer(player.id, player.fullName)}
                                className="text-outline hover:text-error p-1 rounded hover:bg-error/5 cursor-pointer"
                                title="Eliminar Jugador"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Show Player QR code beautifully similar to team QR codes */}
                          <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded border border-outline-variant/10 mt-2">
                            <div className="space-y-1">
                              <span className="text-[9px] text-outline uppercase block">Identificación QR del Jugador</span>
                              <span className="text-[10px] font-status-mono font-bold text-lantern-amber select-all block">{player.playerQrHash}</span>
                              <span className="text-[9px] text-outline block italic">Escanea este código para unir al jugador a un equipo</span>
                            </div>
                            <QRCodeVisual 
                              value={player.playerQrHash} 
                              size={60} 
                            />
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-outline-variant/10">
                            {player.hasTeam ? (
                              <div className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase font-status-mono">
                                🛡️ {player.teamName}
                              </div>
                            ) : (
                              <div className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-2 py-0.5 rounded font-bold uppercase font-status-mono flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-ping"></span>
                                SIN EQUIPO
                              </div>
                            )}

                            {player.gameAccessCode && (
                              <div className="text-[9px] text-outline font-status-mono bg-surface-container px-2 py-0.5 rounded border border-outline-variant/10">
                                CÓDIGO: {player.gameAccessCode}
                              </div>
                            )}
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

        {/* Right: Teams list & Assignments (7 columns) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                ESCUADRAS Y EQUIPOS ACTIVOS ({teams.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenScanner()}
                  className="bg-ariadna-cyan/15 border border-ariadna-cyan/40 text-ariadna-cyan hover:bg-ariadna-cyan hover:text-nocturne-blue px-3 py-1 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1 transition-all shadow-[0_0_10px_rgba(34,211,238,0.1)] animate-pulse"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>SIMULAR ESCÁNER QR</span>
                </button>

                <button 
                  onClick={() => setShowAddTeam(!showAddTeam)}
                  className="bg-lantern-amber border border-lantern-amber/30 text-nocturne-blue px-3 py-1 text-[10px] font-bold uppercase rounded cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>NUEVO EQUIPO</span>
                </button>
              </div>
            </div>

            {showAddTeam && (
              <form onSubmit={handleCreateTeam} className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-4 mb-4 text-xs animate-fadeIn">
                <h4 className="text-primary font-bold uppercase tracking-wider text-[11px] border-b border-outline-variant/20 pb-1 flex justify-between items-center">
                  <span>Crear Nueva Escuadra</span>
                  <button type="button" onClick={() => setShowAddTeam(false)} className="text-outline hover:text-on-surface">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-outline font-semibold block">Nombre de la Escuadra *</label>
                    <input 
                      type="text" 
                      placeholder="Ej. CROWLEY, VALKYRIE, STORM" 
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-serif uppercase font-bold"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-outline font-semibold block">Ciudad de Operación</label>
                    <input 
                      type="text" 
                      placeholder="Cartagena" 
                      value={tCity}
                      onChange={(e) => setTCity(e.target.value)}
                      className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-outline font-semibold block">Jugador Creador de la Escuadra *</label>
                  <select
                    value={tCreatorId}
                    onChange={(e) => setTCreatorId(e.target.value)}
                    className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-bold"
                    required
                  >
                    <option value="">Seleccionar jugador creador...</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.hasTeam ? `Ya tiene equipo: ${p.teamName}` : "Sin equipo"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-outline italic">
                    Regla de Negocio: Las escuadras son creadas por los jugadores. Al crear una, el jugador se asigna automáticamente como su primer miembro.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-nocturne-blue px-3 py-2 font-bold uppercase rounded cursor-pointer flex-1">
                    Crear y Sincronizar Equipo
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
                  const isTeamExpired = isExpired(team.lastActiveAt);
                  const isEditing = editingTeamId === team.id;
                  
                  // Allow joining only if not already in team
                  const assignablePlayers = players.filter(p => !team.memberIds.includes(p.id));

                  return (
                    <div 
                      key={team.id} 
                      className={`p-4 rounded-xl border flex flex-col justify-between space-y-4 relative overflow-hidden transition-all ${
                        isTeamExpired 
                          ? "bg-red-950/10 border-red-500/20 hover:border-red-500/40" 
                          : isEditing
                            ? "bg-surface-container border-primary"
                            : "bg-black/35 border-outline-variant/30 hover:border-outline-variant/60"
                      }`}
                    >
                      {isTeamExpired && (
                        <div className="absolute top-0 right-0 bg-red-500 text-nocturne-blue font-bold font-status-mono text-[8px] px-2.5 py-0.5 rounded-bl uppercase tracking-widest animate-pulse z-10">
                          CADUCADO (&gt;6M SIN USO)
                        </div>
                      )}

                      <div className="space-y-3">
                        {isEditing ? (
                          <div className="space-y-2 text-xs">
                            <span className="text-primary font-bold uppercase text-[9px]">Editar Atributos de Escuadra</span>
                            
                            <div className="space-y-1">
                              <label className="text-[10px] text-outline">Nombre del Equipo</label>
                              <input 
                                type="text"
                                value={editTeamState.name || ""}
                                onChange={(e) => setEditTeamState({ ...editTeamState, name: e.target.value })}
                                className="bg-black/50 border border-outline-variant p-2 w-full text-xs rounded text-primary uppercase font-bold"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-outline">Ciudad de Juego</label>
                              <input 
                                type="text"
                                value={editTeamState.playCity || ""}
                                onChange={(e) => setEditTeamState({ ...editTeamState, playCity: e.target.value })}
                                className="bg-black/50 border border-outline-variant p-2 w-full text-xs rounded text-primary"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] text-outline">Última Actividad (Simular Fecha)</label>
                              <input 
                                type="date"
                                value={editTeamState.lastActiveAt ? editTeamState.lastActiveAt.substring(0, 10) : ""}
                                onChange={(e) => setEditTeamState({ ...editTeamState, lastActiveAt: new Date(e.target.value).toISOString() })}
                                className="bg-black/50 border border-outline-variant p-2 w-full text-xs rounded text-primary"
                              />
                              <p className="text-[9px] text-outline-variant">Modifica este campo para probar el barrido de 6 meses (ej. escoge una fecha de 2025).</p>
                            </div>

                            <div className="flex gap-2 pt-1.5">
                              <button 
                                type="button" 
                                onClick={() => handleSaveTeam(team.id)}
                                className="bg-emerald-500 hover:bg-emerald-400 text-nocturne-blue font-bold uppercase py-1 px-2.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>GUARDAR</span>
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setEditingTeamId(null)}
                                className="border border-outline-variant text-outline py-1 px-2.5 rounded text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>CANCELAR</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex justify-between items-start border-b border-outline-variant/20 pb-2">
                              <div>
                                <span className="text-[10px] text-outline font-bold font-status-mono uppercase">ESCUADRA • {team.playCity}</span>
                                <h4 className="font-serif text-lg text-primary font-bold uppercase">{team.name}</h4>
                                {team.creatorName && (
                                  <p className="text-[9px] text-outline">Creador: <strong className="text-on-surface-variant">{team.creatorName}</strong></p>
                                )}
                              </div>
                              
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleStartEditTeam(team)}
                                  className="text-outline hover:text-primary p-1 rounded hover:bg-primary/5 cursor-pointer"
                                  title="Editar Atributos de Escuadra"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteTeam(team.id, team.name)}
                                  className="text-outline hover:text-error p-1 rounded hover:bg-error/5 cursor-pointer"
                                  title="Eliminar Escuadra"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Show QR code beautifully inside the card */}
                            <div className="flex items-center justify-between gap-3 bg-black/40 p-2.5 rounded border border-outline-variant/10">
                              <div className="space-y-1">
                                <span className="text-[9px] text-outline uppercase block">Identificación QR de Escuadra</span>
                                <span className="text-[10px] font-status-mono font-bold text-lantern-amber select-all block">{team.teamQrHash}</span>
                                <span className="text-[9px] text-outline block italic">Los jugadores pueden unirse escaneando este QR</span>
                              </div>
                              <QRCodeVisual 
                                value={team.teamQrHash} 
                                size={70} 
                              />
                            </div>

                            {/* Inactivity Telemetry */}
                            <div className="flex items-center justify-between text-[10px] font-status-mono bg-surface-container/30 px-2 py-1 rounded">
                              <span className="text-outline">ÚLTIMA TRANSMISIÓN:</span>
                              <span className={`font-bold ${isTeamExpired ? "text-red-400" : "text-emerald-400"}`}>
                                {team.lastActiveAt ? new Date(team.lastActiveAt).toLocaleDateString() : "No Registrada"}
                              </span>
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
                        )}
                      </div>

                      {/* Manual Assignment and QR Trigger */}
                      {!isEditing && (
                        <div className="border-t border-outline-variant/20 pt-3 space-y-2">
                          <div className="flex justify-between items-center text-[9px] text-outline uppercase font-bold">
                            <span>Vincular Jugador</span>
                            <button
                              onClick={() => handleOpenScanner(team.id)}
                              className="text-ariadna-cyan hover:underline font-status-mono font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <QrCode className="w-3 h-3 text-ariadna-cyan" />
                              Simular Escaneo QR
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <select
                              id={`select-join-${team.id}`}
                              className="bg-black/60 border border-outline-variant text-[10px] px-2 py-1.5 flex-1 focus:outline-none focus:border-primary text-on-surface rounded"
                              defaultValue=""
                            >
                              <option value="">Seleccionar de la lista...</option>
                              {assignablePlayers.map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.fullName} {p.hasTeam ? `(Pertenece a: ${p.teamName})` : "(Sin Equipo)"}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => {
                                const selectEl = document.getElementById(`select-join-${team.id}`) as HTMLSelectElement;
                                if (selectEl && selectEl.value) {
                                  handleVincularJugador(team.id, selectEl.value);
                                  selectEl.value = "";
                                }
                              }}
                              className="bg-primary hover:bg-cyan-400 text-nocturne-blue text-[10px] px-3.5 py-1.5 font-bold uppercase rounded cursor-pointer"
                            >
                              Vincular
                            </button>
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

      {/* Simulator Modal for Team QR Scanning */}
      {scannerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[#0a0f1d] border border-ariadna-cyan/30 rounded-xl max-w-md w-full overflow-hidden shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col">
            {/* Modal Header */}
            <div className="bg-black/80 px-4 py-3 border-b border-ariadna-cyan/20 flex justify-between items-center">
              <span className="text-xs font-status-mono text-ariadna-cyan font-bold flex items-center gap-2">
                <QrCode className="w-4 h-4 text-ariadna-cyan animate-pulse" />
                SISTEMA DE EMPAREJAMIENTO DE ESCUADRAS (QR)
              </span>
              <button 
                onClick={() => setScannerOpen(false)}
                className="text-outline hover:text-on-surface cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-center text-xs">
              
              {scanStep === "select" && (
                <div className="space-y-4">
                  <p className="text-on-surface-variant">
                    Para simular que un jugador escanea con su smartphone el <strong>Código QR de la Escuadra</strong> para solicitar unirse, configure los parámetros a continuación:
                  </p>

                  <div className="space-y-3 text-left">
                    <div>
                      <label className="text-outline block mb-1 font-bold">1. Seleccionar Escuadra Destino</label>
                      <select
                        value={scanTeamId}
                        onChange={(e) => setScanTeamId(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-serif uppercase font-bold"
                      >
                        <option value="">-- Escoger Escuadra --</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>
                            Escuadra: {t.name} (QR: {t.teamQrHash})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-outline block mb-1 font-bold">2. Seleccionar Jugador que Escanea</label>
                      <select
                        value={scanPlayerId}
                        onChange={(e) => setScanPlayerId(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-bold"
                      >
                        <option value="">-- Escoger Jugador --</option>
                        {players.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} {p.hasTeam ? `(Ya está en equipo: ${p.teamName})` : "(Libre, sin equipo)"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleSimulateScanAction}
                    disabled={!scanPlayerId || !scanTeamId}
                    className="bg-ariadna-cyan hover:bg-cyan-400 text-nocturne-blue font-bold py-3 px-5 rounded uppercase tracking-wider w-full disabled:opacity-40 disabled:hover:bg-ariadna-cyan cursor-pointer transition-all flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-nocturne-blue" />
                    <span>SIMULAR CAPTURA QR</span>
                  </button>
                </div>
              )}

              {scanStep === "confirm" && (() => {
                const p = players.find(x => x.id === scanPlayerId);
                const t = teams.find(x => x.id === scanTeamId);
                return (
                  <div className="space-y-5 animate-scaleUp">
                    {/* Visual Holographic QR and scanning animation */}
                    <div className="flex justify-center py-2 relative">
                      <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444] z-10"></div>
                      {t && <QRCodeVisual value={t.teamQrHash} size={110} />}
                    </div>

                    <div className="bg-primary/5 border border-primary/25 p-4 rounded-lg space-y-2.5 text-left">
                      <div className="font-status-mono text-primary font-bold uppercase tracking-widest text-center text-[10px]">
                        SOLICITUD DE INGRESO TELEMÉTRICO
                      </div>
                      <p className="text-on-surface font-sans text-center text-xs leading-relaxed">
                        El terminal del jugador <strong className="text-primary">{p?.fullName}</strong> ha escaneado la llave holográfica <strong className="text-lantern-amber">{t?.teamQrHash}</strong> correspondiente a la Escuadra <strong className="text-primary">{t?.name}</strong>.
                      </p>
                      <p className="text-[11px] text-outline text-center italic">
                        ¿Desea confirmar y permitir al jugador unirse formalmente a este equipo?
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={handleConfirmScanJoin}
                        className="bg-emerald-500 hover:bg-emerald-400 text-nocturne-blue font-bold py-2.5 px-4 rounded uppercase flex-1 cursor-pointer transition-all"
                      >
                        CONFIRMAR UNIÓN
                      </button>
                      <button
                        onClick={() => setScanStep("select")}
                        className="border border-outline-variant text-outline hover:text-on-surface py-2.5 px-4 rounded uppercase flex-1 cursor-pointer transition-all"
                      >
                        DECLINAR
                      </button>
                    </div>
                  </div>
                );
              })()}

              {scanStep === "success" && (() => {
                const p = players.find(x => x.id === scanPlayerId);
                const t = teams.find(x => x.id === scanTeamId);
                return (
                  <div className="space-y-4 animate-scaleUp text-center">
                    <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-emerald-400 text-base font-bold uppercase tracking-wide">¡Sincronización Exitosa!</h4>
                      <p className="text-on-surface-variant text-xs">
                        El jugador <strong>{p?.fullName}</strong> ha sido vinculado de forma segura y exitosa a la escuadra <strong>{t?.name}</strong>.
                      </p>
                    </div>

                    <div className="text-[10px] bg-black/45 p-3 rounded border border-outline-variant/25 text-outline text-left space-y-1 font-status-mono">
                      <div>✔️ JUGADOR: {p?.fullName} ({p?.playerQrHash})</div>
                      <div>✔️ ESCUADRA: {t?.name} ({t?.teamQrHash})</div>
                      <div>✔️ ESTADO DE RED: MIEMBRO CONFIRMADO</div>
                    </div>

                    <button
                      onClick={() => setScannerOpen(false)}
                      className="bg-primary text-nocturne-blue font-bold py-2 w-full rounded uppercase text-xs cursor-pointer"
                    >
                      Cerrar Panel
                    </button>
                  </div>
                );
              })()}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
