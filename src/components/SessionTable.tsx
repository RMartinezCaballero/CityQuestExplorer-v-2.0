import React, { useState } from "react";
import { Session } from "../types";
import { Activity, Trash2, Check, RefreshCw, Eye, EyeOff, Search } from "lucide-react";

interface SessionTableProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
  onUpdateSession: (id: string, updatedData: Partial<Session>) => void;
  onDeleteSession: (id: string) => void;
  onTriggerLogTerminal: (message: string) => void;
}

export default function SessionTable({
  sessions,
  selectedSessionId,
  onSelectSession,
  onUpdateSession,
  onDeleteSession,
  onTriggerLogTerminal
}: SessionTableProps) {
  const [regionFilter, setRegionFilter] = useState("TODAS LAS REGIONES");
  const [searchQuery, setSearchQuery] = useState("");
  const [revealedRedacted, setRevealedRedacted] = useState<Record<string, boolean>>({});

  const handleClueToggle = (session: Session, index: number) => {
    if (session.cluesFound === "REDACTED") return;
    const nextClues = [...(session.cluesFound as boolean[])];
    nextClues[index] = !nextClues[index];
    onUpdateSession(session.id, { cluesFound: nextClues });
    onTriggerLogTerminal(`Pistas actualizadas para ${session.investigatorId}. Pista ${index + 1} establecida como ${nextClues[index] ? 'ASEGURADA' : 'PERDIDA'}.`);
  };

  const handleStatusCycle = (session: Session) => {
    const statuses: Session["sessionStatus"][] = ["IN PROGRESS", "STALLED", "COMPLETED"];
    const currentIndex = statuses.indexOf(session.sessionStatus);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onUpdateSession(session.id, { sessionStatus: nextStatus });
    
    const translatedStatusMap: Record<Session["sessionStatus"], string> = {
      "IN PROGRESS": "EN PROCESO",
      "STALLED": "ESTANCADO",
      "COMPLETED": "COMPLETADO"
    };
    onTriggerLogTerminal(`El estado operativo de ${session.investigatorId} cambió a: ${translatedStatusMap[nextStatus]}`);
  };

  const toggleRedacted = (sessionId: string) => {
    setRevealedRedacted(prev => ({
      ...prev,
      [sessionId]: !prev[sessionId]
    }));
    onTriggerLogTerminal(`Clave de descifrado inyectada en el nodo CENSURADO para referencia de sesión.`);
  };

  // Filter based on region dropdown & search query
  const filteredSessions = sessions.filter((s) => {
    // Simulated region filtering (Valkyrie & Crowley are in Cartagena, other custom ones can match)
    if (regionFilter === "CARTAGENA" && !s.investigatorId.includes("CROWLEY") && !s.investigatorId.includes("VALKYRIE")) {
      return false;
    }
    if (regionFilter === "BOGOTA" && (s.investigatorId.includes("CROWLEY") || s.investigatorId.includes("VALKYRIE"))) {
      return false;
    }

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        s.investigatorId.toLowerCase().includes(q) ||
        s.currentChapter.toLowerCase().includes(q) ||
        s.sessionStatus.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="glass-panel p-6 rounded-lg border border-outline-variant/30 shadow-lg">
      
      {/* Table Header Filter controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h3 className="font-label-caps text-label-caps text-primary text-sm tracking-wider font-bold">
          SESIONES OPERATIVAS ACTIVAS
        </h3>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Quick Search */}
          <div className="relative w-full sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline" />
            <input 
              type="text"
              placeholder="BUSCAR SESIONES..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container/60 border border-outline-variant/50 text-[10px] text-primary font-status-mono pl-8 pr-2.5 py-1.5 w-full focus:outline-none focus:ring-1 focus:ring-primary rounded"
            />
          </div>

          {/* Region selector */}
          <select 
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="bg-surface-container border border-outline-variant text-[10px] font-label-caps py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-primary text-primary rounded cursor-pointer"
          >
            <option value="TODAS LAS REGIONES">TODAS LAS REGIONES</option>
            <option value="CARTAGENA">CARTAGENA</option>
            <option value="BOGOTA">BOGOTÁ</option>
          </select>

          {/* View All logs triggers helper */}
          <button 
            onClick={() => {
              onTriggerLogTerminal("/status");
              onTriggerLogTerminal("Volcar registros de escuadrones activos");
            }}
            className="bg-primary/10 border border-primary/30 text-primary text-[10px] font-label-caps px-4 py-1.5 hover:bg-primary hover:text-nocturne-blue transition-all cursor-pointer rounded uppercase font-bold"
          >
            VER TODOS LOS LOGS
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-outline-variant text-[10px] font-label-caps text-outline">
              <th className="pb-3 px-4 font-bold">ID DE INVESTIGADOR</th>
              <th className="pb-3 px-4 font-bold">CAPÍTULO ACTUAL</th>
              <th className="pb-3 px-4 font-bold">PISTAS ENCONTRADAS</th>
              <th className="pb-3 px-4 font-bold">DURACIÓN</th>
              <th className="pb-3 px-4 font-bold">ESTADO DE LA SESIÓN</th>
              <th className="pb-3 px-4 font-bold">INGRESOS</th>
              <th className="pb-3 px-4 text-right font-bold">ACCIONES</th>
            </tr>
          </thead>
          <tbody className="text-xs font-status-mono">
            {filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-outline italic">
                  NINGÚN DESPLIEGUE DE MISIÓN ACTIVO COINCIDE CON LOS CRITERIOS
                </td>
              </tr>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = session.id === selectedSessionId;
                const isRedacted = session.cluesFound === "REDACTED";
                const isRevealed = revealedRedacted[session.id];

                return (
                  <tr 
                    key={session.id} 
                    className={`border-b border-outline-variant/30 hover:bg-surface-variant/30 transition-all cursor-pointer ${
                      isSelected ? "bg-primary-container/10 border-l-2 border-l-primary" : ""
                    }`}
                    onClick={() => onSelectSession(isSelected ? null : session.id)}
                  >
                    {/* Investigator ID */}
                    <td className="py-4 px-4 font-bold text-on-surface flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${session.sessionStatus === 'STALLED' ? 'bg-lantern-amber animate-pulse' : 'bg-ariadna-cyan'}`} />
                      {session.investigatorId}
                    </td>

                    {/* Current Chapter */}
                    <td className="py-4 px-4 text-on-surface-variant italic font-sans font-medium">
                      {session.currentChapter}
                    </td>

                    {/* Clues */}
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      {isRedacted ? (
                        <div 
                          onClick={() => toggleRedacted(session.id)}
                          className="redaction-block inline-block px-2.5 py-0.5 rounded text-[10px] font-bold select-none border border-red-950"
                          title="Clic para descifrar datos censurados"
                        >
                          {isRevealed ? "CONJUNTO_GLIFOS_A, CONJUNTO_GLIFOS_B" : "CENSURADO"}
                        </div>
                      ) : (
                        <div className="flex gap-1.5">
                          {Array.isArray(session.cluesFound) && session.cluesFound.map((found, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleClueToggle(session, idx)}
                              className={`w-5.5 h-5.5 flex items-center justify-center text-[10px] font-bold rounded border cursor-pointer transition-all ${
                                found 
                                  ? "bg-primary text-nocturne-blue border-primary shadow-[0_0_8px_rgba(242,202,80,0.3)]" 
                                  : "border-outline-variant/60 text-outline hover:border-primary/50"
                              }`}
                              title={`Alternar Pista ${idx + 1}`}
                            >
                              {found ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Duration */}
                    <td className="py-4 px-4 text-outline font-bold">
                      {session.duration}
                    </td>

                    {/* Session status badge */}
                    <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleStatusCycle(session)}
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border cursor-pointer uppercase transition-all ${
                          session.sessionStatus === "IN PROGRESS"
                            ? "bg-ariadna-cyan/10 text-ariadna-cyan border-ariadna-cyan/30 shadow-[0_0_8px_rgba(6,182,212,0.1)]"
                            : session.sessionStatus === "STALLED"
                              ? "bg-lantern-amber/10 text-lantern-amber border-lantern-amber/30 shadow-[0_0_8px_rgba(245,158,11,0.1)]"
                              : "bg-outline/10 text-outline border-outline/30"
                        }`}
                      >
                        {session.sessionStatus === "IN PROGRESS" 
                          ? "EN PROCESO" 
                          : session.sessionStatus === "STALLED" 
                            ? "ESTANCADO" 
                            : "COMPLETADO"}
                      </button>
                    </td>

                    {/* Revenue */}
                    <td className="py-4 px-4 text-primary font-bold">
                      ${session.revenue.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2.5">
                        <button 
                          onClick={() => {
                            onSelectSession(session.id);
                            onTriggerLogTerminal(`/locate ${session.investigatorId}`);
                          }}
                          className="text-outline hover:text-primary transition-colors cursor-pointer p-1 rounded hover:bg-surface-variant/30"
                          title="Monitorear transmisión del investigador"
                        >
                          <Activity className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`¿ESTÁ SEGURO DE QUE DESEA TERMINAR EL ENLACE DE TELEMETRÍA EN VIVO CON ${session.investigatorId}?`)) {
                              onDeleteSession(session.id);
                            }
                          }}
                          className="text-outline hover:text-red-400 transition-colors cursor-pointer p-1 rounded hover:bg-surface-variant/30"
                          title="Terminar Telemetría"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
