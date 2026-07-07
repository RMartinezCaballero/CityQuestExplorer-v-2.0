import React, { useState } from "react";
import { X, Radio, MapPin, ShieldAlert, Navigation } from "lucide-react";

interface NewMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeploy: (missionData: { investigatorId: string; currentChapter: string; lat: number; lng: number }) => void;
}

export default function NewMissionModal({ isOpen, onClose, onDeploy }: NewMissionModalProps) {
  const [callsign, setCallsign] = useState("STORM");
  const [customCallsign, setCustomCallsign] = useState("");
  const [chapter, setChapter] = useState("El Secreto de la Inquisición");
  const [customChapter, setCustomChapter] = useState("");
  const [presetCoordinate, setPresetCoordinate] = useState("san_diego");

  if (!isOpen) return null;

  // Preset location coordinate nodes in Cartagena
  const coordinatePresets: Record<string, { name: string; lat: number; lng: number }> = {
    san_diego: { name: "Plaza de San Diego (10.4283° N, -75.5422° W)", lat: 10.4283, lng: -75.5422 },
    san_felipe: { name: "Castillo de San Felipe (10.4229° N, -75.5350° W)", lat: 10.4229, lng: -75.5350 },
    getsemani: { name: "Sector Getsemaní (10.4184° N, -75.5435° W)", lat: 10.4184, lng: -75.5435 },
    bocagrande: { name: "Península Bocagrande (10.3995° N, -75.5582° W)", lat: 10.3995, lng: -75.5582 },
    plaza_bolivar: { name: "Plaza de Bolívar (10.4246° N, -75.5513° W)", lat: 10.4246, lng: -75.5513 }
  };

  const finalCallsign = callsign === "CUSTOM" ? (customCallsign.trim() || "VULCAN") : callsign;
  const finalChapter = chapter === "CUSTOM" ? (customChapter.trim() || "Sector Inexplorado") : chapter;
  const finalCoord = coordinatePresets[presetCoordinate] || coordinatePresets.san_diego;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onDeploy({
      investigatorId: `#${finalCallsign.toUpperCase()}`,
      currentChapter: finalChapter,
      lat: finalCoord.lat,
      lng: finalCoord.lng
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
          
          {/* callsign / investigator ID selection */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold">Indicativo del Investigador</label>
            <div className="grid grid-cols-3 gap-2">
              {["STORM", "VULCAN", "CUSTOM"].map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setCallsign(opt)}
                  className={`py-2 px-3 border text-xs font-bold rounded transition-all cursor-pointer ${
                    callsign === opt 
                      ? "border-primary bg-primary/10 text-primary" 
                      : "border-outline-variant/50 hover:bg-surface-variant/20 text-on-surface-variant"
                  }`}
                >
                  {opt === "CUSTOM" ? "PERSONALIZADO" : opt}
                </button>
              ))}
            </div>
            {callsign === "CUSTOM" && (
              <input
                type="text"
                placeholder="INGRESE INDICATIVO (ej. ORION)"
                value={customCallsign}
                onChange={(e) => setCustomCallsign(e.target.value)}
                className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary placeholder-outline/50 focus:ring-1 focus:ring-primary focus:outline-none rounded uppercase"
                required
              />
            )}
          </div>

          {/* Chapter selector */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold">Dossier Histórico / Capítulo</label>
            <select
              value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full bg-surface-container-lowest/80 border border-outline-variant p-2 text-xs text-primary focus:ring-1 focus:ring-primary focus:outline-none rounded"
            >
              <option value="El Secreto de la Inquisición">El Secreto de la Inquisición</option>
              <option value="Escape de la Fortaleza">Escape de la Fortaleza</option>
              <option value="El Robo de las Esmeraldas">El Robo de las Esmeraldas</option>
              <option value="La Bóveda del Galeón de Oro">La Bóveda del Galeón de Oro</option>
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

          {/* Coordinate presets in Cartagena */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-label-caps text-outline uppercase font-bold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              Coordenada de Sector Táctico
            </label>
            <div className="space-y-2">
              {Object.entries(coordinatePresets).map(([key, value]) => (
                <label 
                  key={key} 
                  className={`flex items-center gap-2.5 p-2 border rounded cursor-pointer transition-all ${
                    presetCoordinate === key 
                      ? "border-primary/50 bg-primary/5 text-primary" 
                      : "border-outline-variant/30 hover:bg-surface-variant/20 text-on-surface-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="coordinate"
                    value={key}
                    checked={presetCoordinate === key}
                    onChange={() => setPresetCoordinate(key)}
                    className="text-primary focus:ring-primary h-3.5 w-3.5 bg-black border-outline-variant/50"
                  />
                  <div className="text-left">
                    <p className="text-[11px] font-bold">{value.name.split(" (")[0]}</p>
                    <p className="text-[9px] font-status-mono text-outline">{value.name.split(" (")[1]?.replace(")", "")}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Warnings & confirmation */}
          <div className="bg-red-950/15 border border-red-900/30 p-2.5 flex gap-2.5 rounded">
            <ShieldAlert className="w-5 h-5 text-lantern-amber shrink-0 mt-0.5" />
            <p className="text-[10px] text-outline leading-normal font-sans">
              El despliegue establece un enlace de telemetría en vivo con el nodo táctico. Cualquier pérdida de señal satelital debe informarse a ARIADNA CORE de inmediato.
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
