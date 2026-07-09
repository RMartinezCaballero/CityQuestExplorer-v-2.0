import React from "react";
import { QrCode, Clipboard } from "lucide-react";

interface QRCodeVisualProps {
  value: string;
  size?: number;
  label?: string;
  subtitle?: string;
}

export default function QRCodeVisual({ value, size = 144, label, subtitle }: QRCodeVisualProps) {
  // Simple deterministic hashing
  const djb2Hash = (str: string): number => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
  };

  const gridSize = 15;
  const finderSize = 5;

  const isFinder = (x: number, y: number): boolean => {
    // Top-left
    if (x < finderSize && y < finderSize) return true;
    // Top-right
    if (x >= gridSize - finderSize && y < finderSize) return true;
    // Bottom-left
    if (x < finderSize && y >= gridSize - finderSize) return true;
    return false;
  };

  const getFinderValue = (x: number, y: number): boolean => {
    let lx = x;
    let ly = y;
    if (x >= gridSize - finderSize) lx = x - (gridSize - finderSize);
    if (y >= gridSize - finderSize) ly = y - (gridSize - finderSize);

    // 5x5 finder pattern: outer ring black, next ring white, center block black
    if (lx === 0 || lx === finderSize - 1 || ly === 0 || ly === finderSize - 1) return true;
    if (lx >= 2 && lx <= 2 && ly >= 2 && ly <= 2) return true;
    return false;
  };

  // Generate grid cells
  const cells: boolean[] = [];
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      if (isFinder(x, y)) {
        cells.push(getFinderValue(x, y));
      } else {
        const cellSeed = value + `_cell_${x}_${y}`;
        const cellHash = djb2Hash(cellSeed);
        cells.push(cellHash % 2 === 0);
      }
    }
  }

  const cellSize = size / gridSize;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(value);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-[#0a0f1d]/90 border border-ariadna-cyan/30 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.1)] hover:border-ariadna-cyan/60 transition-all max-w-[200px] text-center shrink-0">
      {label && (
        <span className="text-[9px] font-status-mono text-outline font-bold tracking-widest uppercase mb-1.5">
          {label}
        </span>
      )}

      {/* Actual SVG QR Code with high-tech hologram scanner style */}
      <div className="relative p-2.5 bg-black rounded-lg border border-ariadna-cyan/20 group overflow-hidden">
        {/* Glowing holographic scanner line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-cyan-400 opacity-60 animate-bounce shadow-[0_0_8px_#22d3ee] pointer-events-none z-10"></div>
        <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors pointer-events-none"></div>

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {cells.map((isFilled, idx) => {
            if (!isFilled) return null;
            const x = idx % gridSize;
            const y = Math.floor(idx / gridSize);
            return (
              <rect
                key={idx}
                x={x * cellSize}
                y={y * cellSize}
                width={cellSize - 0.4}
                height={cellSize - 0.4}
                fill={isFinder(x, y) ? "#22d3ee" : "#e2e8f0"}
                rx={0.8}
              />
            );
          })}
        </svg>
      </div>

      <div className="mt-2.5 w-full space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-ariadna-cyan font-status-mono text-[10px] font-bold uppercase select-all bg-ariadna-cyan/10 border border-ariadna-cyan/25 px-2 py-1 rounded">
          <QrCode className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{value}</span>
          <button
            onClick={copyToClipboard}
            className="text-outline hover:text-primary transition-colors cursor-pointer shrink-0"
            title="Copiar Hash"
          >
            <Clipboard className="w-3 h-3" />
          </button>
        </div>
        {subtitle && <p className="text-[9px] text-outline italic font-sans">{subtitle}</p>}
      </div>
    </div>
  );
}
