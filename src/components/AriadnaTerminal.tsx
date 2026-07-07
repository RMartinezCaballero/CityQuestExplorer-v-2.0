import React, { useState, useRef, useEffect } from "react";
import { Terminal as TerminalIcon, Send, ShieldAlert, Cpu, Sparkles } from "lucide-react";

interface TerminalMessage {
  sender: "user" | "ariadna" | "system";
  text: string;
  time: string;
}

interface AriadnaTerminalProps {
  onExecuteCommand: (command: string) => void;
}

export default function AriadnaTerminal({ onExecuteCommand }: AriadnaTerminalProps) {
  const [commandInput, setCommandInput] = useState("");
  const [history, setHistory] = useState<TerminalMessage[]>([
    {
      sender: "system",
      text: "MOTORES PRINCIPALES DE ARIADNA_OS_V4.2 INICIADOS... [EN LÍNEA]",
      time: "13:58:12"
    },
    {
      sender: "ariadna",
      text: "> OPTIMIZANDO CÓDIGOS DE CUADRÍCULA DE DESPLIEGUE PARA EL EQUIPO VALKYRIE\n> NIVEL DE ADVERTENCIA DE AMENAZA: MÍNIMO\n> LISTO PARA PROTOCOLOS OPERATIVOS. ESCRIBA /help PARA VER ESQUEMAS.",
      time: "13:58:15"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = commandInput.trim();
    if (!cmd) return;

    // Add user command to history
    const currentTime = new Date().toLocaleTimeString("en-US", { hour12: false });
    const userMsg: TerminalMessage = {
      sender: "user",
      text: cmd,
      time: currentTime
    };
    setHistory(prev => [...prev, userMsg]);
    setCommandInput("");
    setLoading(true);

    // Call external callback in case parent wants to update map coordinates
    onExecuteCommand(cmd);

    // Internal commands handling
    if (cmd.toLowerCase() === "/reboot") {
      setTimeout(() => {
        setHistory([
          {
            sender: "system",
            text: "REINICIANDO MOTOR DE ARIADNA OS... ALINEACIÓN DE SECTORES COMPLETA CON ÉXITO.",
            time: new Date().toLocaleTimeString("en-US", { hour12: false })
          },
          {
            sender: "ariadna",
            text: "> ARRANQUE EN FRÍO ACTIVO.\n> TODOS LOS DESPLIEGUES MONITOREADOS.\n> LISTO.",
            time: new Date().toLocaleTimeString("en-US", { hour12: false })
          }
        ]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      // Map frontend history to API format for chat memory
      const mappedHistory = history
        .filter(h => h.sender === "user" || h.sender === "ariadna")
        .slice(-6)
        .map(h => ({
          role: h.sender === "user" ? "user" : "assistant",
          text: h.text
        }));

      const response = await fetch("/api/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, history: mappedHistory })
      });

      const data = await response.json();
      setHistory(prev => [...prev, {
        sender: "ariadna",
        text: data.output,
        time: new Date().toLocaleTimeString("en-US", { hour12: false })
      }]);
    } catch (err) {
      setHistory(prev => [...prev, {
        sender: "system",
        text: "> EXCEPCIÓN PROVOCADA: TIEMPO DE ESPERA AGOTADO EN LA CONEXIÓN AL NODO DE TELEMETRÍA ARIADNA.",
        time: new Date().toLocaleTimeString("en-US", { hour12: false })
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleMacroClick = (macro: string) => {
    setCommandInput(macro);
  };

  return (
    <div className="bg-black border border-primary/25 rounded-md p-4 font-status-mono text-xs flex flex-col h-[280px] lg:h-[300px] shadow-[0_0_15px_rgba(242,202,80,0.1)] relative">
      {/* Title block */}
      <div className="flex items-center justify-between border-b border-primary/10 pb-2 mb-2 text-[10px] uppercase font-bold tracking-widest shrink-0 text-primary">
        <div className="flex items-center gap-1.5">
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>ARIADNA_OS_V4.2</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-outline text-[9px]">TRANSMISIÓN ENCRIPTADA</span>
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto space-y-3 mb-2 pr-1 custom-scrollbar text-[11px]"
      >
        {history.map((msg, idx) => {
          if (msg.sender === "system") {
            return (
              <div key={idx} className="text-outline border-l border-outline/30 pl-2 italic">
                <span className="text-[9px] block text-outline/50">{msg.time}</span>
                {msg.text}
              </div>
            );
          }
          if (msg.sender === "user") {
            return (
              <div key={idx} className="text-right">
                <span className="text-[9px] text-outline block mr-1">{msg.time} [OPERADOR]</span>
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-1 rounded inline-block text-[11px]">
                  &gt; {msg.text}
                </span>
              </div>
            );
          }
          return (
            <div key={idx} className="text-primary/95 leading-relaxed bg-[#051424]/40 border-l-2 border-primary/40 pl-2.5 py-1">
              <span className="text-[9px] text-outline/60 block">{msg.time} [IA ARIADNA]</span>
              <div className="whitespace-pre-wrap font-status-mono break-words">{msg.text}</div>
            </div>
          );
        })}
        {loading && (
          <div className="text-ariadna-cyan animate-pulse flex items-center gap-2 pl-2">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>ARIADNA ESTÁ ANALIZANDO LOS PROTOCOLOS DE DESPLIEGUE...</span>
          </div>
        )}
      </div>

      {/* Suggested Command Macros */}
      <div className="flex flex-wrap gap-1.5 pb-2 border-t border-primary/10 pt-2 shrink-0">
        <button 
          onClick={() => handleMacroClick("/help")}
          className="px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-[2px] text-[9px] font-bold cursor-pointer transition-colors"
        >
          /help
        </button>
        <button 
          onClick={() => handleMacroClick("/status")}
          className="px-2 py-0.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-[2px] text-[9px] font-bold cursor-pointer transition-colors"
        >
          /status
        </button>
        <button 
          onClick={() => handleMacroClick("Analizar ruta de crowley")}
          className="px-2 py-0.5 bg-ariadna-cyan/10 hover:bg-ariadna-cyan/20 text-ariadna-cyan border border-ariadna-cyan/20 rounded-[2px] text-[9px] font-bold cursor-pointer transition-colors flex items-center gap-1"
        >
          <Sparkles className="w-2.5 h-2.5" />
          IA: Optimizar Crowley
        </button>
        <button 
          onClick={() => handleMacroClick("/reboot")}
          className="px-2 py-0.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/40 rounded-[2px] text-[9px] font-bold cursor-pointer transition-colors"
        >
          /reboot
        </button>
      </div>

      {/* Form Input */}
      <form onSubmit={handleSubmit} className="relative flex items-center shrink-0">
        <input 
          type="text"
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          placeholder="ENVIAR COMANDO O CHATEAR CON EL NÚCLEO ARIADNA..."
          className="bg-surface-container-lowest/80 border border-primary/20 text-primary text-xs pl-3 pr-10 py-2 w-full focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none rounded"
          disabled={loading}
        />
        <button 
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-primary hover:text-white transition-colors cursor-pointer p-1.5 disabled:opacity-50"
          disabled={loading || !commandInput.trim()}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
