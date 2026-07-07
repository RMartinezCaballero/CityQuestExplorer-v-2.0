import React, { useState } from "react";
import { Session } from "../types";
import { Map, Layers, Navigation, Crosshair, Pin } from "lucide-react";

interface MapPanelProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export default function MapPanel({ sessions, selectedSessionId, onSelectSession }: MapPanelProps) {
  const [activeLayer, setActiveLayer] = useState<"tactical" | "satellite">("tactical");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredPoint, setHoveredPoint] = useState<Session | null>(null);

  // Map limits mapping
  const mapCenterLat = 10.412;
  const mapCenterLng = -75.542;

  // Convert lat/lng to percentage coordinates on the mock image
  const getXY = (lat?: number, lng?: number) => {
    if (!lat || !lng) return { x: 50, y: 50 };
    // Map bounds approximation for Cartagena area
    const minLat = 10.370;
    const maxLat = 10.450;
    const minLng = -75.580;
    const maxLng = -75.500;

    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = 100 - ((lat - minLat) / (maxLat - minLat)) * 100; // Flip Y for screen space
    return {
      x: Math.min(95, Math.max(5, x)),
      y: Math.min(95, Math.max(5, y))
    };
  };

  return (
    <div className="lg:col-span-8 glass-panel min-h-[480px] relative overflow-hidden group rounded-lg">
      {/* Header overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-10 flex justify-between items-start bg-gradient-to-b from-nocturne-blue to-transparent">
        <div>
          <h3 className="font-label-caps text-label-caps text-primary tracking-widest text-xs flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '6s' }} />
            SEGUIMIENTO DE INVESTIGADORES EN VIVO
          </h3>
          <p className="font-status-mono text-[10px] text-outline mt-1 uppercase">
            LOC: {selectedSessionId 
              ? `${sessions.find(s => s.id === selectedSessionId)?.lat?.toFixed(4) || "10.3910"}° N, ${sessions.find(s => s.id === selectedSessionId)?.lng?.toFixed(4) || "-75.4794"}° W`
              : "CORRELACIÓN DE CUADRÍCULA ACTIVA - MULTINODO"}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveLayer(activeLayer === "tactical" ? "satellite" : "tactical")}
            title="Alternar Capa Táctica"
            className={`bg-nocturne-blue/80 backdrop-blur-sm border ${activeLayer === "satellite" ? "border-primary text-primary" : "border-outline-variant text-on-surface-variant"} p-2 hover:text-primary transition-colors cursor-pointer rounded`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoomLevel(prev => prev === 1.5 ? 1 : 1.5)}
            title="Recentrar Foco del Mapa"
            className="bg-nocturne-blue/80 backdrop-blur-sm border border-outline-variant p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Map area */}
      <div className="absolute inset-0 z-0 transition-transform duration-500 overflow-hidden bg-[#020d1c]">
        {/* Background Map Image */}
        <div 
          className="w-full h-full grayscale contrast-125 brightness-50 opacity-45 bg-cover bg-center transition-all duration-700"
          style={{ 
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA_XHaFOMwfqYLYQveu4-UopVlpleTVmJadugIe0oDj4oDDd62KXYZBRH5bNuFV-HdSRewbrEZ2YtkRQUNjKhCG5-tR0TLxWgrnOTuSL5NZQZGFFX_O904KdfFLeRIGK6feKDCnFXHzGwSQFrMSDipk-jajhH950Vx_sbuP5zD-qZ8uHw4B5lfoT2cH7ZdEfmJAulNVtXo-agivchDcSV7PFi4OfCmmka4cfUzvXzT_FWxwc30DAWH8s74GtzA-fDcKuXmjEY_HnDBo')",
            transform: `scale(${zoomLevel})`,
            filter: activeLayer === "satellite" ? "none" : "grayscale(1) contrast(1.25) brightness(0.55)"
          }}
        />

        {/* Tactical grid overlay */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[linear-gradient(to_right,rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Dynamic target reticle for selected investigator */}
        {selectedSessionId && (() => {
          const sel = sessions.find(s => s.id === selectedSessionId);
          if (sel?.lat) {
            const { x, y } = getXY(sel.lat, sel.lng);
            return (
              <div 
                className="absolute transition-all duration-500 ease-out pointer-events-none z-10"
                style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-12 h-12 border border-ariadna-cyan/40 rounded-full animate-ping" />
                <div className="w-6 h-6 border-2 border-dashed border-primary/60 rounded-full animate-spin" style={{ animationDuration: '10s' }} />
              </div>
            );
          }
          return null;
        })()}

        {/* Interactive Session Markers */}
        {sessions.filter(s => s.lat && s.lng).map((session) => {
          const { x, y } = getXY(session.lat, session.lng);
          const isSelected = session.id === selectedSessionId;
          const isCrowley = session.investigatorId.includes("CROWLEY");
          const isValkyrie = session.investigatorId.includes("VALKYRIE");
          
          // Color based on active status
          const markerColorClass = session.sessionStatus === "STALLED" 
            ? "bg-lantern-amber shadow-[0_0_12px_#F59E0B]" 
            : isCrowley 
              ? "bg-primary shadow-[0_0_12px_#f2ca50]" 
              : "bg-ariadna-cyan shadow-[0_0_12px_#06B6D4]";

          return (
            <div
              key={session.id}
              className="absolute cursor-pointer group/marker z-20"
              style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
              onClick={() => onSelectSession(isSelected ? null : session.id)}
              onMouseEnter={() => setHoveredPoint(session)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Outer pulsing ring */}
              <div className={`w-4 h-4 rounded-full status-pulse ${markerColorClass}`} />
              
              {/* Tooltip on marker hover or state focus */}
              {(hoveredPoint?.id === session.id || isSelected) && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 glass-panel p-3 border border-outline/40 whitespace-nowrap z-50 rounded shadow-2xl animate-fade-in text-[11px] font-status-mono">
                  <p className="font-bold flex items-center gap-1.5" style={{ color: isCrowley ? '#f2ca50' : '#06B6D4' }}>
                    <Pin className="w-3.5 h-3.5" />
                    EQUIPO: {session.investigatorId}
                  </p>
                  <p className="text-[10px] text-on-surface mt-1 font-sans">
                    Capítulo: <span className="italic">"{session.currentChapter}"</span>
                  </p>
                  <p className="text-[9px] text-outline mt-0.5">
                    Coords: {session.lat?.toFixed(4)}, {session.lng?.toFixed(4)}
                  </p>
                  <p className="text-[9px] mt-1 text-primary-fixed-dim font-bold">
                    Estado: <span className={session.sessionStatus === 'STALLED' ? 'text-lantern-amber' : 'text-ariadna-cyan'}>
                      {session.sessionStatus === 'IN PROGRESS' ? 'EN PROCESO' : session.sessionStatus === 'STALLED' ? 'ESTANCADO' : 'COMPLETADO'}
                    </span>
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map Legend (Bottom Overlay) */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 flex flex-wrap gap-4 rounded border border-outline-variant/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full" />
          <span className="font-status-mono text-[9px] text-outline font-bold">INVESTIGADOR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-lantern-amber rounded-full" />
          <span className="font-status-mono text-[9px] text-outline font-bold">ACTOR (EN VIVO)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-error rounded-full" />
          <span className="font-status-mono text-[9px] text-outline font-bold">ANOMALÍA GPS</span>
        </div>
      </div>

      {/* Latency overlay */}
      <div className="absolute bottom-4 right-4 bg-nocturne-blue/90 border border-outline-variant/40 px-2 py-1 rounded text-[8px] font-status-mono text-ariadna-cyan uppercase tracking-widest">
        REFRESCO DEL SISTEMA: 44ms
      </div>
    </div>
  );
}
