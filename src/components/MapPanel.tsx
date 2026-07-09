import React, { useState, useEffect, useRef } from "react";
import { Session } from "../types";
import { Layers, Navigation, Crosshair, Pin } from "lucide-react";
import L from "leaflet";

interface MapPanelProps {
  sessions: Session[];
  selectedSessionId: string | null;
  onSelectSession: (id: string | null) => void;
}

export default function MapPanel({ sessions, selectedSessionId, onSelectSession }: MapPanelProps) {
  const [activeLayer, setActiveLayer] = useState<"tactical" | "satellite">("tactical");
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tacticalLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView([10.4229, -75.5422], 14); // Coordinates for Cartagena de Indias

    mapInstanceRef.current = map;

    // Add pre-configured tile layers
    const tacticalLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    });

    tacticalLayerRef.current = tacticalLayer;
    satelliteLayerRef.current = satelliteLayer;

    // Add initial layer depending on state
    if (activeLayer === "tactical") {
      tacticalLayer.addTo(map);
    } else {
      satelliteLayer.addTo(map);
    }

    // Create layer group for dynamic markers
    const markersGroup = L.layerGroup().addTo(map);
    markersGroupRef.current = markersGroup;

    // Invalidate size on container resize
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      markersGroupRef.current = null;
      tacticalLayerRef.current = null;
      satelliteLayerRef.current = null;
    };
  }, []);

  // Sync tiles when active layer changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const tactical = tacticalLayerRef.current;
    const satellite = satelliteLayerRef.current;
    if (!map || !tactical || !satellite) return;

    if (activeLayer === "tactical") {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(tactical)) map.addLayer(tactical);
    } else {
      if (map.hasLayer(tactical)) map.removeLayer(tactical);
      if (!map.hasLayer(satellite)) map.addLayer(satellite);
    }
  }, [activeLayer]);

  // Sync sessions markers and focus on selection
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    // Clear previous markers
    markersGroup.clearLayers();

    sessions.forEach((session) => {
      if (!session.lat || !session.lng) return;

      const isSelected = session.id === selectedSessionId;
      const isCrowley = session.investigatorId.includes("CROWLEY");
      
      const colorClass = session.sessionStatus === "STALLED" 
        ? "bg-lantern-amber shadow-[0_0_12px_#F59E0B]" 
        : isCrowley 
          ? "bg-primary shadow-[0_0_12px_#f2ca50]" 
          : "bg-ariadna-cyan shadow-[0_0_12px_#06B6D4]";

      const markerColor = isCrowley ? '#f2ca50' : '#06B6D4';

      // Custom pulsing HTML marker
      const markerHtml = `
        <div class="relative w-6 h-6 flex items-center justify-center">
          <div class="absolute w-6 h-6 rounded-full border border-${isCrowley ? 'primary' : 'ariadna-cyan'}/40 animate-ping opacity-60"></div>
          <div class="w-3.5 h-3.5 rounded-full status-pulse ${colorClass} border border-black/30"></div>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: "custom-leaflet-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker([session.lat, session.lng], { icon });

      // Handle selection click
      marker.on("click", () => {
        onSelectSession(isSelected ? null : session.id);
      });

      // Bind tactical detail popup
      const popupHtml = `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4; padding: 2px;">
          <p style="font-weight: bold; margin: 0 0 4px 0; color: ${markerColor}">
            📌 EQUIPO: ${session.investigatorId}
          </p>
          <p style="margin: 0 0 2px 0; color: #d4e4fa">
            Capítulo: <i>"${session.currentChapter}"</i>
          </p>
          <p style="margin: 0 0 4px 0; color: #99907c; font-size: 9px">
            Coords: ${session.lat.toFixed(4)}, ${session.lng.toFixed(4)}
          </p>
          <p style="margin: 0; font-weight: bold;">
            Estado: <span style="color: ${session.sessionStatus === 'STALLED' ? '#F59E0B' : '#06B6D4'}">
              ${session.sessionStatus === 'IN PROGRESS' ? 'EN PROCESO' : session.sessionStatus === 'STALLED' ? 'ESTANCADO' : 'COMPLETADO'}
            </span>
          </p>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        closeButton: false,
        offset: L.point(0, -4)
      });

      markersGroup.addLayer(marker);

      // Pan to selected marker and show popup automatically
      if (isSelected) {
        setTimeout(() => {
          marker.openPopup();
          map.panTo([session.lat!, session.lng!], { animate: true });
        }, 80);
      }
    });
  }, [sessions, selectedSessionId]);

  // Recenter map focus
  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedSessionId) {
      const activeSession = sessions.find(s => s.id === selectedSessionId);
      if (activeSession?.lat && activeSession?.lng) {
        map.setView([activeSession.lat, activeSession.lng], 16, { animate: true });
        return;
      }
    }

    // Default center at historical center Cartagena de Indias
    map.setView([10.4229, -75.5422], 14, { animate: true });
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);

  return (
    <div className="lg:col-span-8 glass-panel min-h-[480px] relative overflow-hidden group rounded-lg">
      
      {/* HUD Header Overlay */}
      <div className="absolute top-0 left-0 w-full p-4 z-40 flex justify-between items-start bg-gradient-to-b from-nocturne-blue to-transparent pointer-events-none">
        <div className="pointer-events-auto">
          <h3 className="font-label-caps text-label-caps text-primary tracking-widest text-xs flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '6s' }} />
            SEGUIMIENTO DE INVESTIGADORES EN VIVO (MAPA REAL)
          </h3>
          <p className="font-status-mono text-[10px] text-outline mt-1 uppercase">
            LOC: {selectedSessionId && selectedSession?.lat 
              ? `${selectedSession.lat.toFixed(4)}° N, ${selectedSession.lng?.toFixed(4)}° W`
              : "CORRELACIÓN DE CUADRÍCULA ACTIVA - MULTINODO"}
          </p>
        </div>
        
        <div className="flex gap-2 pointer-events-auto">
          <button 
            onClick={() => setActiveLayer(activeLayer === "tactical" ? "satellite" : "tactical")}
            title="Alternar Capa Táctica"
            className={`bg-nocturne-blue/80 backdrop-blur-sm border ${activeLayer === "satellite" ? "border-primary text-primary" : "border-outline-variant text-on-surface-variant"} p-2 hover:text-primary transition-colors cursor-pointer rounded`}
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
            onClick={handleRecenter}
            title="Recentrar Foco del Mapa"
            className="bg-nocturne-blue/80 backdrop-blur-sm border border-outline-variant p-2 text-on-surface-variant hover:text-primary transition-colors cursor-pointer rounded"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Dynamic Leaflet Map Container */}
      <div className="absolute inset-0 z-0">
        <div 
          ref={mapContainerRef} 
          className={`w-full h-full tactical-leaflet-map ${activeLayer === "tactical" ? "tactical-tiles" : "satellite-tiles"}`}
        />
      </div>

      {/* High-tech overlay elements */}
      {/* Tactical radar grid visual overlay */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-10 bg-[linear-gradient(to_right,rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      {/* CRT scanline effect */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-white/[0.01] to-transparent bg-[size:100%_4px]" />

      {/* Map Legend (Bottom Overlay) */}
      <div className="absolute bottom-4 left-4 glass-panel p-3 flex flex-wrap gap-4 rounded border border-outline-variant/50 z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-primary rounded-full" />
          <span className="font-status-mono text-[9px] text-outline font-bold">INVESTIGADOR</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-lantern-amber rounded-full" />
          <span className="font-status-mono text-[9px] text-outline font-bold">ACTOR (EN VIVO)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-ariadna-cyan rounded-full animate-pulse" />
          <span className="font-status-mono text-[9px] text-outline font-bold">EQUIPO ACTIVO</span>
        </div>
      </div>

      {/* Latency overlay */}
      <div className="absolute bottom-4 right-4 bg-nocturne-blue/90 border border-outline-variant/40 px-2 py-1 rounded text-[8px] font-status-mono text-ariadna-cyan uppercase tracking-widest z-10">
        SATELLITE SYNC: OK | RTT: 31ms
      </div>
    </div>
  );
}
