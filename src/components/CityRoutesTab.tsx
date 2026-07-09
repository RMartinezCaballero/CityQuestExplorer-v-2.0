import React, { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  Layers, 
  Sparkles, 
  Workflow, 
  Clock, 
  ChevronRight, 
  Video, 
  UserCheck, 
  ArrowRight,
  RefreshCw,
  Info,
  Pencil,
  Crosshair,
  Navigation
} from "lucide-react";
import L from "leaflet";
import { City, Story, Mission } from "../types";
import QRCodeVisual from "./QRCodeVisual";

interface CityRoutesTabProps {
  onTriggerLogTerminal: (cmd: string) => void;
}

export default function CityRoutesTab({ onTriggerLogTerminal }: CityRoutesTabProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCityId, setSelectedCityId] = useState<string>("");
  const [selectedStoryId, setSelectedStoryId] = useState<string>("");
  
  // Creation States
  const [newCityName, setNewCityName] = useState("");
  const [showAddCity, setShowAddCity] = useState(false);
  
  const [newStoryTitle, setNewStoryTitle] = useState("");
  const [newStoryDesc, setNewStoryDesc] = useState("");
  const [showAddStory, setShowAddStory] = useState(false);
  
  // Mission Creation form
  const [showAddMission, setShowAddMission] = useState(false);
  const [mName, setMName] = useState("");
  const [mLocation, setMLocation] = useState("");
  const [mLat, setMLat] = useState("");
  const [mLng, setMLng] = useState("");
  const [mObjective, setMObjective] = useState("");
  const [mType, setMType] = useState<"Observación" | "Investigación" | "Criptografía histórica" | "Lógica" | "Tecnología">("Observación");
  const [mRiddle, setMRiddle] = useState("");
  const [mAnswer, setMAnswer] = useState("");
  const [mLetter, setMLetter] = useState("");
  const [mTime, setMTime] = useState("10 min");
  const [mVideo, setMVideo] = useState("");
  const [mActor, setMActor] = useState("");
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);

  // Administrative Map options
  const [activeMapLayer, setActiveMapLayer] = useState<"tactical" | "satellite">("tactical");
  const [showRoutePath, setShowRoutePath] = useState<boolean>(true);

  // Route Generator states
  const [routeDifficulty, setRouteDifficulty] = useState<"Fácil" | "Medium" | "Difícil">("Fácil");
  const [generatedRoute, setGeneratedRoute] = useState<{
    storyId: string;
    difficulty: string;
    totalMissions: number;
    missions: Mission[];
  } | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  // Assignment and validation states
  const [assignTarget, setAssignTarget] = useState<string>("next");
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);

  // Route Verification/Validation States
  const [valHash, setValHash] = useState("");
  const [valResult, setValResult] = useState<any | null>(null);
  const [valError, setValError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const fetchPendingSessions = async () => {
    if (!selectedStoryId) {
      setPendingSessions([]);
      return;
    }
    try {
      const res = await fetch("/api/active-games");
      if (res.ok) {
        const data = await res.json();
        const filtered = data.filter((g: any) => 
          g.status === "PENDING" && 
          (g.storyId === selectedStoryId || g.storyTitle === activeStory?.title)
        );
        setPendingSessions(filtered);
      }
    } catch (err) {
      console.error("Error fetching pending sessions:", err);
    }
  };

  const handleValidateHash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valHash.trim()) return;
    setIsValidating(true);
    setValError(null);
    setValResult(null);

    try {
      const res = await fetch(`/api/routes/validate/${valHash.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setValResult(data);
        onTriggerLogTerminal(`Ruta validada con éxito en el verificador satelital. Hash: ${valHash}`);
      } else {
        setValError(data.error || "Código de ruta inválido.");
      }
    } catch (err) {
      setValError("Error al conectar con el servidor satelital de verificación.");
    } finally {
      setIsValidating(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/cities");
      if (res.ok) {
        const data = await res.json();
        setCities(data);
        if (data.length > 0 && !selectedCityId) {
          setSelectedCityId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const activeCity = cities.find(c => c.id === selectedCityId);
  
  useEffect(() => {
    if (activeCity && activeCity.stories.length > 0) {
      setSelectedStoryId(activeCity.stories[0].id);
    } else {
      setSelectedStoryId("");
    }
    setGeneratedRoute(null);
    setRouteError(null);
  }, [selectedCityId, cities]);

  const activeStory = activeCity?.stories.find(s => s.id === selectedStoryId);

  // Administrative Map Refs & Helper
  const adminMapContainerRef = useRef<HTMLDivElement>(null);
  const adminMapInstanceRef = useRef<L.Map | null>(null);
  const adminTacticalLayerRef = useRef<L.TileLayer | null>(null);
  const adminSatelliteLayerRef = useRef<L.TileLayer | null>(null);
  const adminMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const adminPathPolylineRef = useRef<L.Polyline | null>(null);

  const getCityCenter = (cityId: string, name: string): [number, number] => {
    const idLower = (cityId || "").toLowerCase();
    const nameLower = (name || "").toLowerCase();
    if (idLower.includes("cartagena") || nameLower.includes("cartagena")) return [10.4229, -75.5422];
    if (idLower.includes("barranquilla") || nameLower.includes("barranquilla")) return [10.9986, -74.7884];
    if (idLower.includes("bogota") || nameLower.includes("bogota") || idLower.includes("bogotá") || nameLower.includes("bogotá")) return [4.6097, -74.0721];
    if (idLower.includes("medellin") || nameLower.includes("medellin") || idLower.includes("medellín") || nameLower.includes("medellín")) return [6.2442, -75.5812];
    if (idLower.includes("cali") || nameLower.includes("cali")) return [3.4516, -76.5320];
    return [10.4229, -75.5422]; // fallback to Cartagena
  };

  // Initialize Administration Map Container
  useEffect(() => {
    if (!adminMapContainerRef.current) return;

    const center = getCityCenter(selectedCityId, activeCity?.name || "");
    const map = L.map(adminMapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(center, 14);

    adminMapInstanceRef.current = map;

    const tacticalLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    });

    const satelliteLayer = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19,
    });

    adminTacticalLayerRef.current = tacticalLayer;
    adminSatelliteLayerRef.current = satelliteLayer;

    if (activeMapLayer === "tactical") {
      tacticalLayer.addTo(map);
    } else {
      satelliteLayer.addTo(map);
    }

    const markersGroup = L.layerGroup().addTo(map);
    adminMarkersGroupRef.current = markersGroup;

    // Polyline group
    const polyline = L.polyline([], {
      color: "#06B6D4",
      weight: 3,
      dashArray: "5, 10",
      opacity: 0.8
    }).addTo(map);
    adminPathPolylineRef.current = polyline;

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(adminMapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      adminMapInstanceRef.current = null;
      adminMarkersGroupRef.current = null;
      adminTacticalLayerRef.current = null;
      adminSatelliteLayerRef.current = null;
      adminPathPolylineRef.current = null;
    };
  }, [selectedCityId]); // Recreate/center when city selection changes

  // Update tile map layer style (tactical vs satellite)
  useEffect(() => {
    const map = adminMapInstanceRef.current;
    const tactical = adminTacticalLayerRef.current;
    const satellite = adminSatelliteLayerRef.current;
    if (!map || !tactical || !satellite) return;

    if (activeMapLayer === "tactical") {
      if (map.hasLayer(satellite)) map.removeLayer(satellite);
      if (!map.hasLayer(tactical)) map.addLayer(tactical);
    } else {
      if (map.hasLayer(tactical)) map.removeLayer(tactical);
      if (!map.hasLayer(satellite)) map.addLayer(satellite);
    }
  }, [activeMapLayer]);

  // Click on map to capture coordinates when adding/editing a mission
  useEffect(() => {
    const map = adminMapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (showAddMission) {
        const { lat, lng } = e.latlng;
        setMLat(lat.toFixed(6));
        setMLng(lng.toFixed(6));
        onTriggerLogTerminal(`Coordenadas capturadas del visor satelital: [${lat.toFixed(6)}, ${lng.toFixed(6)}]`);
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [showAddMission]);

  // Redraw markers, polyline connections, and temporary selection pin
  useEffect(() => {
    const map = adminMapInstanceRef.current;
    const markersGroup = adminMarkersGroupRef.current;
    const polyline = adminPathPolylineRef.current;
    if (!map || !markersGroup || !polyline) return;

    markersGroup.clearLayers();

    const points: L.LatLngExpression[] = [];

    // 1. Draw existing missions of the active story
    if (activeStory && activeStory.missions) {
      activeStory.missions.forEach((mission, idx) => {
        if (!mission.lat || !mission.lng) return;

        const latNum = Number(mission.lat);
        const lngNum = Number(mission.lng);
        points.push([latNum, lngNum]);

        const isFirst = idx === 0;
        const isLast = idx === activeStory.missions.length - 1;
        const markerColor = isFirst ? '#10B981' : isLast ? '#EF4444' : '#06B6D4';
        const colorClass = isFirst 
          ? "bg-emerald-500 shadow-[0_0_12px_#10B981]" 
          : isLast 
            ? "bg-red-500 shadow-[0_0_12px_#EF4444]" 
            : "bg-ariadna-cyan shadow-[0_0_12px_#06B6D4]";

        const markerHtml = `
          <div class="relative w-8 h-8 flex items-center justify-center">
            <div class="absolute w-8 h-8 rounded-full border border-${isFirst ? 'emerald-500' : isLast ? 'red-500' : 'ariadna-cyan'}/40 animate-pulse"></div>
            <div class="w-6 h-6 rounded-full ${colorClass} border border-black/30 flex items-center justify-center text-[10px] font-bold text-black font-status-mono">
              ${idx + 1}
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: "custom-leaflet-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([latNum, lngNum], { icon }).addTo(markersGroup);

        const popupHtml = `
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; line-height: 1.4; padding: 2px;">
            <p style="font-weight: bold; margin: 0 0 4px 0; color: ${markerColor}">
              📌 ${idx + 1}. ${mission.name}
            </p>
            <p style="margin: 0 0 2px 0; color: #d4e4fa">
              Ubicación: <b>"${mission.location}"</b>
            </p>
            <p style="margin: 0 0 2px 0; color: #99907c; font-size: 9px">
              Coords: ${latNum.toFixed(5)}, ${lngNum.toFixed(5)}
            </p>
            <p style="margin: 0; color: #f2ca50; font-size: 10px">
              Clave: ${mission.letter} | Tipo: ${mission.type}
            </p>
          </div>
        `;
        marker.bindPopup(popupHtml, { closeButton: false });
      });
    }

    // 2. Draw polyline routing path connection
    if (showRoutePath && points.length > 1) {
      polyline.setLatLngs(points);
    } else {
      polyline.setLatLngs([]);
    }

    // 3. Draw temporary crosshair target marker if in editing/form mode
    if (showAddMission && mLat && mLng) {
      const tempLat = parseFloat(mLat);
      const tempLng = parseFloat(mLng);
      if (!isNaN(tempLat) && !isNaN(tempLng)) {
        const markerHtml = `
          <div class="relative w-8 h-8 flex items-center justify-center animate-bounce">
            <div class="absolute w-8 h-8 rounded-full border border-yellow-500/80 animate-ping"></div>
            <div class="w-6 h-6 rounded-full bg-yellow-500 shadow-[0_0_12px_#F59E0B] border border-black flex items-center justify-center text-[10px] font-bold text-black">
              🎯
            </div>
          </div>
        `;
        const icon = L.divIcon({
          html: markerHtml,
          className: "custom-leaflet-marker",
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });
        const tempMarker = L.marker([tempLat, tempLng], { icon }).addTo(markersGroup);
        tempMarker.bindPopup(`
          <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 2px;">
            <p style="font-weight: bold; margin: 0; color: #F59E0B">🎯 POSICIÓN ASIGNADA</p>
            <p style="margin: 4px 0 0 0; color: #d4e4fa">${mName || "Nueva Misión"}</p>
          </div>
        `).openPopup();
      }
    }

    // Auto-adjust zoom bounds to show all plotted locations
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (showAddMission && mLat && mLng) {
        const tempLat = parseFloat(mLat);
        const tempLng = parseFloat(mLng);
        if (!isNaN(tempLat) && !isNaN(tempLng)) {
          bounds.extend([tempLat, tempLng]);
        }
      }
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    } else {
      const center = getCityCenter(selectedCityId, activeCity?.name || "");
      map.setView(center, 14);
    }
  }, [activeStory, showRoutePath, mLat, mLng, showAddMission, selectedCityId]);

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    try {
      const res = await fetch("/api/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCityName })
      });
      if (res.ok) {
        const created = await res.json();
        setNewCityName("");
        setShowAddCity(false);
        onTriggerLogTerminal(`Creada la nueva plaza de operaciones: ${created.name}`);
        await fetchCities();
        setSelectedCityId(created.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryTitle.trim()) return;
    try {
      const res = await fetch(`/api/cities/${selectedCityId}/stories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newStoryTitle, description: newStoryDesc })
      });
      if (res.ok) {
        const created = await res.json();
        setNewStoryTitle("");
        setNewStoryDesc("");
        setShowAddStory(false);
        onTriggerLogTerminal(`Creado el juego/historia: ${created.title} en ${activeCity?.name}`);
        await fetchCities();
        setSelectedStoryId(created.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartEditMission = (mission: Mission) => {
    setEditingMissionId(mission.id);
    setMName(mission.name);
    setMLocation(mission.location);
    setMLat(mission.lat ? mission.lat.toString() : "");
    setMLng(mission.lng ? mission.lng.toString() : "");
    setMObjective(mission.objective);
    setMType(mission.type);
    setMRiddle(mission.riddle);
    setMAnswer(mission.answer);
    setMLetter(mission.letter);
    setMTime(mission.timeEstimate);
    setMVideo(mission.videoLink || "");
    setMActor(mission.actor || "");
    setShowAddMission(true);
  };

  const handleCancelMissionForm = () => {
    setMName("");
    setMLocation("");
    setMLat("");
    setMLng("");
    setMObjective("");
    setMRiddle("");
    setMAnswer("");
    setMLetter("");
    setMTime("10 min");
    setMVideo("");
    setMActor("");
    setEditingMissionId(null);
    setShowAddMission(false);
  };

  const handleAddMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName || !mLocation || !mRiddle || !mAnswer || !mLetter) {
      alert("Por favor complete todos los campos obligatorios (*)");
      return;
    }

    try {
      const url = editingMissionId 
        ? `/api/missions/${editingMissionId}` 
        : `/api/stories/${selectedStoryId}/missions`;
      const method = editingMissionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mName,
          location: mLocation,
          objective: mObjective,
          type: mType,
          riddle: mRiddle,
          answer: mAnswer,
          letter: mLetter,
          timeEstimate: mTime,
          videoLink: mVideo || undefined,
          actor: mActor || undefined,
          lat: mLat ? parseFloat(mLat) : undefined,
          lng: mLng ? parseFloat(mLng) : undefined
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (editingMissionId) {
          onTriggerLogTerminal(`Modificada la misión [${data.name}] en la historia: ${activeStory?.title}`);
        } else {
          onTriggerLogTerminal(`Agregada la misión [${data.name}] en la historia: ${activeStory?.title}`);
        }
        
        // Reset form
        handleCancelMissionForm();
        await fetchCities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMission = async (mId: string, mName: string) => {
    if (!confirm(`¿Está seguro de eliminar la misión "${mName}"?`)) return;
    try {
      const res = await fetch(`/api/missions/${mId}`, { method: "DELETE" });
      if (res.ok) {
        onTriggerLogTerminal(`Eliminada la misión [${mName}]`);
        await fetchCities();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateRoute = async () => {
    setRouteError(null);
    setGeneratedRoute(null);
    if (!selectedStoryId) return;

    if (!activeStory || activeStory.missions.length < 2) {
      setRouteError("Se necesitan al menos 2 misiones (una de inicio y otra de fin) para estructurar una ruta.");
      return;
    }

    try {
      const body: any = { 
        storyId: selectedStoryId, 
        difficulty: routeDifficulty 
      };
      
      if (assignTarget === "next") {
        body.assignNextInQueue = true;
      } else if (assignTarget !== "none") {
        body.activeGameId = assignTarget;
      }

      const res = await fetch("/api/routes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedRoute(data);
        
        let msg = `Generada ruta automática para [${activeStory.title}] con hash de verificación único: ${data.routeHash}`;
        if (data.assignedTo) {
          msg += ` y asignada a la sesión activa de: ${data.assignedTo} (ID: ${data.assignedSessionId})`;
        } else {
          msg += ` (Sin asignación - Simulada)`;
        }
        onTriggerLogTerminal(msg);
        
        // Refresh queue lists
        fetchPendingSessions();
      } else {
        const errData = await res.json();
        setRouteError(errData.error || "Error al estructurar ruta.");
      }
    } catch (err) {
      setRouteError("Error al conectar con el servidor satelital.");
    }
  };

  return (
    <div className="space-y-8">
      {/* Tab Header */}
      <div className="border-b border-outline-variant/60 pb-4">
        <h1 className="font-serif text-4xl text-on-surface font-bold">Gestión de Ciudades, Historias y Rutas</h1>
        <p className="text-outline text-xs mt-1">Estructura la jerarquía completa: Ciudades → Historias/Juegos → Misiones. Modela y simula secuencias de misiones con restricciones de orden fijo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Hierarchy Navigation (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* 1. Cities Module */}
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                1. SELECCIONAR CIUDAD
              </h3>
              <button 
                onClick={() => setShowAddCity(!showAddCity)}
                className="text-primary hover:text-cyan-400 p-1 rounded transition-colors cursor-pointer"
                title="Agregar Ciudad"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddCity && (
              <form onSubmit={handleAddCity} className="bg-surface-container-low p-3 rounded mb-4 border border-primary/20 space-y-3">
                <input 
                  type="text"
                  placeholder="Nombre de la nueva ciudad..."
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  className="bg-black/60 border border-outline-variant text-xs p-2 w-full focus:outline-none focus:border-primary text-primary rounded"
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-nocturne-blue px-3 py-1.5 text-[10px] font-bold uppercase rounded cursor-pointer flex-1">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setShowAddCity(false)} className="border border-outline-variant text-outline px-3 py-1.5 text-[10px] font-bold uppercase rounded cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {cities.map((city) => (
                <button
                  key={city.id}
                  onClick={() => setSelectedCityId(city.id)}
                  className={`w-full flex justify-between items-center px-4 py-3 text-xs rounded transition-all text-left font-semibold ${
                    selectedCityId === city.id 
                      ? "bg-primary-container text-on-primary-container font-bold" 
                      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  <span className="uppercase tracking-wider">{city.name}</span>
                  <span className="bg-black/40 text-[9px] px-2 py-0.5 rounded text-outline">
                    {city.stories.length} {city.stories.length === 1 ? "Historia" : "Historias"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Stories/Games Module */}
          <div className="glass-panel p-5 rounded-lg border border-outline-variant/50">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-outline-variant/30">
              <h3 className="font-label-caps text-xs text-primary font-bold tracking-widest flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                2. HISTORIAS / JUEGOS
              </h3>
              <button 
                onClick={() => setShowAddStory(!showAddStory)}
                disabled={!selectedCityId}
                className="text-primary hover:text-cyan-400 p-1 rounded transition-colors cursor-pointer disabled:opacity-40"
                title="Agregar Historia"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {showAddStory && (
              <form onSubmit={handleAddStory} className="bg-surface-container-low p-3 rounded mb-4 border border-primary/20 space-y-3">
                <input 
                  type="text"
                  placeholder="Título de la historia/experiencia..."
                  value={newStoryTitle}
                  onChange={(e) => setNewStoryTitle(e.target.value)}
                  className="bg-black/60 border border-outline-variant text-xs p-2 w-full focus:outline-none focus:border-primary text-primary rounded"
                  required
                />
                <textarea 
                  placeholder="Descripción breve de la aventura..."
                  value={newStoryDesc}
                  onChange={(e) => setNewStoryDesc(e.target.value)}
                  className="bg-black/60 border border-outline-variant text-xs p-2 w-full focus:outline-none focus:border-primary text-on-surface rounded h-16"
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-primary text-nocturne-blue px-3 py-1.5 text-[10px] font-bold uppercase rounded cursor-pointer flex-1">
                    Guardar
                  </button>
                  <button type="button" onClick={() => setShowAddStory(false)} className="border border-outline-variant text-outline px-3 py-1.5 text-[10px] font-bold uppercase rounded cursor-pointer">
                    Cancelar
                  </button>
                </div>
              </form>
            )}

            {activeCity?.stories.length === 0 ? (
              <p className="text-[11px] text-outline italic text-center py-4">No hay historias registradas en esta ciudad.</p>
            ) : (
              <div className="space-y-2">
                {activeCity?.stories.map((story) => (
                  <button
                    key={story.id}
                    onClick={() => setSelectedStoryId(story.id)}
                    className={`w-full flex flex-col p-3 text-xs rounded transition-all text-left border ${
                      selectedStoryId === story.id 
                        ? "bg-primary/10 border-primary text-primary font-bold" 
                        : "bg-surface-container-lowest border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    <span className="font-serif text-sm font-bold text-on-surface">{story.title}</span>
                    <span className="text-[10px] text-outline mt-1 font-medium line-clamp-1">{story.description}</span>
                    <span className="text-[9px] text-ariadna-cyan font-bold mt-2 font-status-mono">
                      {story.missions.length} MISIONES EN TOTAL
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Missions & Sequence Generator (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active Story Details & Missions Manager */}
          {activeStory ? (
            <div className="glass-panel p-6 rounded-lg border border-outline-variant/50">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-outline-variant/30 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/20 text-primary text-[9px] font-status-mono px-2 py-0.5 rounded font-bold uppercase">
                      {activeCity?.name}
                    </span>
                    <h2 className="font-serif text-2xl text-on-surface font-bold">{activeStory.title}</h2>
                  </div>
                  <p className="text-outline text-xs mt-1 leading-relaxed">{activeStory.description}</p>
                </div>
                <button
                  onClick={() => {
                    if (showAddMission) {
                      handleCancelMissionForm();
                    } else {
                      setEditingMissionId(null);
                      setMName("");
                      setMLocation("");
                      setMObjective("");
                      setMRiddle("");
                      setMAnswer("");
                      setMLetter("");
                      setMTime("10 min");
                      setMVideo("");
                      setMActor("");
                      setShowAddMission(true);
                    }
                  }}
                  className="bg-primary hover:bg-cyan-400 text-nocturne-blue text-xs font-bold px-3 py-2 rounded flex items-center gap-1.5 uppercase tracking-wider cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5px]" />
                  <span>AGREGAR MISIÓN</span>
                </button>
              </div>

              {/* Visor Cartográfico Interactivo de la Ciudad */}
              <div className="glass-panel min-h-[360px] h-[360px] relative overflow-hidden group rounded-lg border border-outline-variant/40 mb-6">
                {/* HUD Header Overlay */}
                <div className="absolute top-0 left-0 w-full p-4 z-[400] flex justify-between items-start bg-gradient-to-b from-nocturne-blue to-transparent pointer-events-none">
                  <div className="pointer-events-auto">
                    <h3 className="font-label-caps text-label-caps text-primary tracking-widest text-[11px] flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '8s' }} />
                      VISOR CARTOGRÁFICO DE HISTORIA EN ADMINISTRACIÓN
                    </h3>
                    <p className="font-status-mono text-[9px] text-outline mt-0.5 uppercase">
                      {showAddMission 
                        ? "MODO EDICIÓN ACTIVO: Haz clic en el mapa para asignar coordenadas automáticamente" 
                        : "VISTA DE ANÁLISIS DE RUTA EN TERRENO"}
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pointer-events-auto">
                    <button 
                      type="button"
                      onClick={() => setShowRoutePath(!showRoutePath)}
                      className={`bg-nocturne-blue/90 backdrop-blur-sm border ${showRoutePath ? "border-primary text-primary" : "border-outline-variant text-outline"} px-2.5 py-1 text-[9px] font-status-mono hover:text-primary transition-colors cursor-pointer rounded uppercase font-bold`}
                    >
                      {showRoutePath ? "Trazado: ON" : "Trazado: OFF"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setActiveMapLayer(activeMapLayer === "tactical" ? "satellite" : "tactical")}
                      className={`bg-nocturne-blue/90 backdrop-blur-sm border ${activeMapLayer === "satellite" ? "border-primary text-primary" : "border-outline-variant text-outline"} p-1.5 hover:text-primary transition-colors cursor-pointer rounded`}
                    >
                      <Layers className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Leaflet Map Container */}
                <div className="absolute inset-0 z-0">
                  <div 
                    ref={adminMapContainerRef} 
                    className={`w-full h-full tactical-leaflet-map ${activeMapLayer === "tactical" ? "tactical-tiles" : "satellite-tiles"}`}
                  />
                </div>

                {/* Cyber overlays */}
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none z-10 bg-[linear-gradient(to_right,rgba(6,182,212,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.15)_1px,transparent_1px)] bg-[size:24px_24px]" />
                <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-transparent via-white/[0.005] to-transparent bg-[size:100%_4px]" />

                {/* Map Legend */}
                <div className="absolute bottom-3 left-3 bg-nocturne-blue/90 border border-outline-variant/30 p-2 flex gap-3 rounded text-[8px] font-status-mono tracking-wider z-10">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <span className="text-outline uppercase">INICIO</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-ariadna-cyan rounded-full" />
                    <span className="text-outline uppercase">ESTACIÓN</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full" />
                    <span className="text-outline uppercase">FIN</span>
                  </div>
                </div>

                {/* Dynamic Coord Helper in HUD footer */}
                <div className="absolute bottom-3 right-3 bg-nocturne-blue/90 border border-outline-variant/40 px-2 py-1 rounded text-[8px] font-status-mono text-ariadna-cyan uppercase tracking-widest z-10">
                  ESTACIONES GEOLOCALIZADAS: {activeStory.missions.filter(m => m.lat && m.lng).length}
                </div>
              </div>

              {showAddMission && (
                <form onSubmit={handleAddMission} className="bg-surface-container-low p-4 rounded-lg border border-primary/20 space-y-4 mb-6 text-xs">
                  <h4 className="text-primary font-bold uppercase tracking-wider text-[11px] border-b border-outline-variant/20 pb-1">
                    {editingMissionId ? "Editar Misión Existente" : "Registrar Nueva Misión"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Nombre de Misión *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. LA LLAVE PERDIDA" 
                        value={mName}
                        onChange={(e) => setMName(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Ubicación de Campo (Nombre) *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Plaza de San Diego" 
                        value={mLocation}
                        onChange={(e) => setMLocation(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block flex justify-between">
                        <span>Coordenadas Geográficas (Latitud, Longitud)</span>
                        <span className="text-primary text-[10px] font-semibold">Clickea en el mapa para auto-llenar</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input 
                          type="number" 
                          step="any"
                          placeholder="Latitud (Ej: 10.4229)" 
                          value={mLat}
                          onChange={(e) => setMLat(e.target.value)}
                          className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary font-status-mono rounded"
                        />
                        <input 
                          type="number" 
                          step="any"
                          placeholder="Longitud (Ej: -75.5422)" 
                          value={mLng}
                          onChange={(e) => setMLng(e.target.value)}
                          className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary font-status-mono rounded"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Objetivo de Campo *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Descifrar el enigma grabado en la herradura" 
                        value={mObjective}
                        onChange={(e) => setMObjective(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Tipo de Enigma *</label>
                      <select 
                        value={mType}
                        onChange={(e) => setMType(e.target.value as any)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                      >
                        <option value="Observación">Observación</option>
                        <option value="Investigación">Investigación</option>
                        <option value="Criptografía histórica">Criptografía histórica</option>
                        <option value="Lógica">Lógica</option>
                        <option value="Tecnología">Tecnología</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Enigma (Instrucción al jugador) *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. ¿Cuántos leones custodian el baluarte?" 
                        value={mRiddle}
                        onChange={(e) => setMRiddle(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Respuesta de Validación *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. CINCO" 
                        value={mAnswer}
                        onChange={(e) => setMAnswer(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-status-mono uppercase"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Letra Clave de Revelación (1 char) *</label>
                      <input 
                        type="text" 
                        maxLength={5}
                        placeholder="Ej. A o FINAL" 
                        value={mLetter}
                        onChange={(e) => setMLetter(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-primary rounded font-status-mono uppercase"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Tiempo Estimado (Ej. 10 min) *</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 10 min" 
                        value={mTime}
                        onChange={(e) => setMTime(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Vínculo de Video (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ej. Video 01: El Inicio" 
                        value={mVideo}
                        onChange={(e) => setMVideo(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-outline font-semibold block">Actor Involucrado (Opcional)</label>
                      <input 
                        type="text" 
                        placeholder="Ej. El Guardian (Actor 03)" 
                        value={mActor}
                        onChange={(e) => setMActor(e.target.value)}
                        className="bg-black/60 border border-outline-variant text-xs p-2.5 w-full focus:outline-none focus:border-primary text-on-surface rounded"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 justify-end">
                    <button type="submit" className="bg-primary text-nocturne-blue px-4 py-2 font-bold uppercase rounded cursor-pointer">
                      {editingMissionId ? "Guardar Cambios" : "Guardar Misión"}
                    </button>
                    <button type="button" onClick={handleCancelMissionForm} className="border border-outline-variant text-outline px-4 py-2 font-bold uppercase rounded cursor-pointer">
                      Cancelar
                    </button>
                  </div>
                </form>
              )}

              {/* Missions Pool table */}
              <div className="space-y-3">
                <h3 className="font-label-caps text-xs text-outline font-bold tracking-wider uppercase mb-1">
                  Misiones creadas en la Base de Datos
                </h3>
                
                {activeStory.missions.length === 0 ? (
                  <p className="text-xs text-outline italic text-center py-6 bg-surface-container-low border border-outline-variant/30 rounded">
                    No hay misiones configuradas para esta historia. ¡Comienza agregando misiones!
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-outline-variant/40 rounded">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface-container text-outline font-status-mono font-bold border-b border-outline-variant/40">
                          <th className="p-3">Orden</th>
                          <th className="p-3">Misión</th>
                          <th className="p-3">Ubicación</th>
                          <th className="p-3">Enigma</th>
                          <th className="p-3">Tipo / Letra</th>
                          <th className="p-3 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/20">
                        {activeStory.missions.map((mission, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === activeStory.missions.length - 1;
                          return (
                            <tr key={mission.id} className="hover:bg-surface-container-low/50">
                              <td className="p-3 font-status-mono text-[11px] font-bold">
                                {idx === 0 ? (
                                  <span className="text-emerald-400 font-bold">1 (FIJO)</span>
                                ) : idx === activeStory.missions.length - 1 ? (
                                  <span className="text-red-400 font-bold">{idx + 1} (FIJO)</span>
                                ) : (
                                  <span className="text-outline">{idx + 1}</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="font-bold text-on-surface">{mission.name}</div>
                                <div className="text-[10px] text-outline line-clamp-1">{mission.objective}</div>
                              </td>
                              <td className="p-3 text-[11px] font-medium text-on-surface-variant flex items-center gap-1 mt-1">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span>{mission.location}</span>
                              </td>
                              <td className="p-3 text-[11px] text-outline max-w-[200px] truncate">
                                "{mission.riddle}"
                              </td>
                              <td className="p-3 font-status-mono text-[10px]">
                                <div className="text-primary font-bold">{mission.type}</div>
                                <div className="text-outline">Clave: {mission.letter}</div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button
                                    onClick={() => handleStartEditMission(mission)}
                                    className="text-outline hover:text-primary p-1.5 rounded hover:bg-primary/5 cursor-pointer transition-colors"
                                    title="Editar"
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteMission(mission.id, mission.name)}
                                    className="text-outline hover:text-error p-1.5 rounded hover:bg-error/5 cursor-pointer transition-colors"
                                    title="Eliminar"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Route sequence randomizer simulator */}
              {activeStory.missions.length >= 2 && (
                <div className="mt-8 border-t border-outline-variant/30 pt-6 space-y-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="font-serif text-lg text-primary font-bold">Generador Automático de Rutas</h3>
                      <p className="text-xs text-outline">Estructura rutas aleatorias dinámicas en base a la dificultad y asígnalas a los jugadores en su orden correspondiente.</p>
                    </div>
                  </div>

                  {pendingSessions.length > 0 ? (
                    <div className="bg-primary/5 border border-primary/20 text-xs p-3 rounded flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-primary shrink-0" />
                        <span>
                          Hay <strong>{pendingSessions.length}</strong> sesiones en cola esperando ruta para esta historia.
                        </span>
                      </div>
                      <span className="text-[10px] font-status-mono text-primary font-bold">
                        Siguiente en cola: <span className="underline">{pendingSessions[0].name}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="bg-outline-variant/10 border border-outline-variant/20 text-[11px] p-3 rounded text-outline">
                      No hay jugadores o equipos con reservas pendientes para esta historia en este momento. La ruta generada se mantendrá como simulación libre.
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30">
                    <div className="flex flex-col min-w-[150px]">
                      <label className="text-[10px] text-outline font-bold uppercase mb-1">Dificultad de Ruta</label>
                      <select
                        value={routeDifficulty}
                        onChange={(e) => setRouteDifficulty(e.target.value as any)}
                        className="bg-surface-container-low border border-outline-variant/60 text-xs px-3 py-2 rounded font-bold font-status-mono text-primary focus:outline-none focus:border-primary"
                      >
                        <option value="Fácil">Fácil (5-7 misiones)</option>
                        <option value="Medium">Medium (8-10 misiones)</option>
                        <option value="Difícil">Difícil (10+ misiones)</option>
                      </select>
                    </div>

                    <div className="flex flex-col min-w-[220px] flex-1">
                      <label className="text-[10px] text-outline font-bold uppercase mb-1">Asignar a Jugador / Equipo</label>
                      <select
                        value={assignTarget}
                        onChange={(e) => setAssignTarget(e.target.value)}
                        className="bg-surface-container-low border border-outline-variant/60 text-xs px-3 py-2 rounded font-bold text-on-surface focus:outline-none"
                      >
                        <option value="next">Siguiente en Cola (Orden de Reserva)</option>
                        <option value="none">Ninguno (Solo Simulación)</option>
                        {pendingSessions.map((session) => (
                          <option key={session.id} value={session.id}>
                            {session.name} ({session.isTeam ? "Equipo" : "Jugador"}) - {session.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleGenerateRoute}
                      className="bg-lantern-amber hover:bg-yellow-500 text-nocturne-blue font-bold px-5 py-2 text-xs rounded uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md h-[34px] transition-all"
                    >
                      <Workflow className="w-4 h-4 text-nocturne-blue" />
                      <span>Estructurar Ruta</span>
                    </button>
                  </div>

                  {routeError && (
                    <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                      ⚠️ {routeError}
                    </div>
                  )}

                  {generatedRoute && (
                    <div className="bg-black/40 border border-outline-variant/40 rounded-lg p-5 space-y-4">
                      {generatedRoute.routeHash && (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-lg gap-4">
                          <div className="space-y-3 flex-1">
                            <div>
                              <div className="text-[10px] text-emerald-400 font-status-mono font-bold uppercase">✔️ HASH ÚNICO DE VERIFICACIÓN DE RUTA GENERADO</div>
                              <div className="font-status-mono text-base font-bold text-emerald-300 select-all mt-1 flex items-center gap-2">
                                <span>{generatedRoute.routeHash}</span>
                                <span className="bg-emerald-500/10 text-emerald-400 text-[9px] px-2 py-0.5 rounded border border-emerald-500/20 font-bold">OFICIAL</span>
                              </div>
                            </div>
                            {generatedRoute.assignedTo && (
                              <div>
                                <div className="text-[10px] text-outline font-semibold uppercase">ASIGNADO A</div>
                                <div className="text-xs font-bold text-on-surface mt-0.5">{generatedRoute.assignedTo}</div>
                                <div className="text-[10px] text-primary font-status-mono mt-0.5">{generatedRoute.assignedSessionId}</div>
                              </div>
                            )}
                          </div>
                          
                          <QRCodeVisual 
                            value={generatedRoute.routeHash} 
                            label="CÓDIGO QR DE RUTA" 
                            subtitle="Satelital - Cartagena" 
                            size={100}
                          />
                        </div>
                      )}

                      <div className="flex justify-between items-center border-b border-outline-variant/30 pb-2 text-xs font-status-mono">
                        <span className="text-primary font-bold">SECUENCIA DINÁMICA DE LA EXPERIENCIA</span>
                        <span className="text-ariadna-cyan font-bold">{generatedRoute.totalMissions} MISIONES EN TOTAL</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 py-2">
                        {generatedRoute.missions.map((mission, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === generatedRoute.missions.length - 1;
                          return (
                            <React.Fragment key={mission.id}>
                              <div className={`p-3 rounded border text-xs relative max-w-[200px] shadow-sm ${
                                isFirst 
                                  ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                                  : isLast
                                    ? "bg-red-950/20 border-red-500/40 text-red-300"
                                    : "bg-surface-container-low border-outline-variant/60 text-on-surface"
                              }`}>
                                <div className="font-status-mono text-[9px] text-outline uppercase">
                                  {isFirst ? "📌 INICIO FIJO" : isLast ? "🏁 FIN FIJO" : "🎲 INTERMEDIO"}
                                </div>
                                <div className="font-bold truncate mt-1">{mission.name}</div>
                                <div className="text-[10px] text-outline mt-0.5 truncate flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-primary shrink-0" />
                                  <span>{mission.location}</span>
                                </div>
                              </div>
                              {idx < generatedRoute.missions.length - 1 && (
                                <ArrowRight className="w-4 h-4 text-outline/50 shrink-0" />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>

                      <div className="flex gap-2 items-center bg-primary/5 p-3 rounded text-[11px] text-primary border border-primary/20">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <span><strong>Regla de Negocio Satisfecha:</strong> Las misiones inicial (1) y final siempre permanecen fijas en su orden correspondiente, mientras que las intermedias son elegidas aleatoriamente para crear una experiencia totalmente rejugable y personalizada para el jugador.</span>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            <div className="glass-panel p-8 text-center text-xs text-outline rounded-lg border border-outline-variant/30">
              <Layers className="w-12 h-12 text-outline/40 mx-auto mb-3" />
              <p className="font-serif text-base text-on-surface font-semibold mb-1">Estructura de Red no Seleccionada</p>
              <p>Selecciona una ciudad e historia en el panel izquierdo para administrar sus misiones y flujos de ruta.</p>
            </div>
          )}

          {/* Global Route Verification and Hash Validation Module */}
          <div className="glass-panel p-6 rounded-lg border border-outline-variant/50 space-y-4">
            <div>
              <h3 className="font-serif text-lg text-on-surface font-bold flex items-center gap-2">
                <Workflow className="w-5 h-5 text-ariadna-cyan" />
                Módulo de Verificación de Ruta Satelital
              </h3>
              <p className="text-outline text-xs mt-1">
                Ingresa el Hash Único de Verificación de Ruta generado por el sistema para validar la autenticidad de la secuencia y consultar su asignación en tiempo real.
              </p>
            </div>

            <form onSubmit={handleValidateHash} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ej: RTE-CAR-3829-FAC" 
                value={valHash}
                onChange={(e) => setValHash(e.target.value)}
                className="bg-black/60 border border-outline-variant text-xs p-2.5 flex-1 focus:outline-none focus:border-primary text-primary font-status-mono rounded uppercase tracking-wider"
                required
              />
              <button 
                type="submit" 
                disabled={isValidating}
                className="bg-primary hover:bg-cyan-400 text-nocturne-blue text-xs font-bold px-4 rounded uppercase tracking-wider cursor-pointer flex items-center gap-1.5"
              >
                {isValidating ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>VALIDAR RUTA</span>
                )}
              </button>
            </form>

            {valError && (
              <div className="bg-red-950/20 border border-red-500/30 text-red-400 p-3 rounded text-xs">
                ⚠️ {valError}
              </div>
            )}

            {valResult && (
              <div className="bg-surface-container-low/60 border border-emerald-500/30 rounded-lg p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-3">
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-status-mono">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                        RUTA AUTÉNTICA Y VALIDADA
                      </div>
                      <div className="font-serif text-base font-bold text-on-surface mt-1">{valResult.storyTitle}</div>
                      <div className="text-[10px] text-outline">Código de Enlace: {valResult.gameId}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-outline font-semibold">ASIGNADA A</div>
                      <div className="text-xs font-bold text-primary">{valResult.name}</div>
                      <span className={`inline-block mt-1 text-[9px] font-status-mono px-2 py-0.5 rounded font-bold uppercase ${
                        valResult.status === "ACTIVE" 
                          ? "bg-ariadna-cyan/10 text-ariadna-cyan border border-ariadna-cyan/20"
                          : valResult.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-surface-container-high text-outline border border-outline-variant/30"
                      }`}>
                        {valResult.status === "ACTIVE" ? "🟢 EN JUEGO" : valResult.status === "COMPLETED" ? "🏆 COMPLETADO" : "⏳ PROGRAMADO"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="shrink-0 flex justify-center">
                    <QRCodeVisual 
                      value={valHash.toUpperCase()} 
                      label="QR VERIFICADO" 
                      subtitle={valResult.storyTitle}
                      size={100}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-[10px] text-outline font-bold uppercase tracking-wider">Secuencia de Ruta en Terreno ({valResult.difficulty}):</div>
                  <div className="space-y-3">
                    {valResult.missions.map((m: any, idx: number) => (
                      <div key={m.missionId} className="flex gap-3 items-start bg-black/30 p-3 rounded border border-outline-variant/20">
                        <div className="bg-primary/10 text-primary font-status-mono text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-primary/20">
                          {idx + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-on-surface">{m.name}</span>
                            <span className="text-[9px] bg-surface-container text-outline px-2 py-0.5 rounded uppercase font-status-mono">{m.type}</span>
                          </div>
                          <p className="text-[11px] text-outline-variant flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-primary animate-pulse" />
                            <span>{m.location}</span>
                          </p>
                          <div className="text-[11px] text-on-surface-variant bg-surface-container-low/50 p-2 rounded italic border border-outline-variant/10">
                            <strong>Enigma:</strong> "{m.riddle}"
                          </div>
                          <div className="flex justify-between items-center pt-1 text-[10px] font-status-mono">
                            <span className="text-primary font-bold">Solución para QR: {m.answer}</span>
                            <span className={m.completed ? "text-emerald-400 font-bold" : "text-outline"}>
                              {m.completed ? "✓ COMPLETADO" : "⏳ PENDIENTE DE QR"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
