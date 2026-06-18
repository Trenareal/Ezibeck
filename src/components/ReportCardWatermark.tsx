import React from 'react';

export function ReportCardWatermark() {
  // Generates multiple repeating rows of "Ezibeck Academy" rotated diagonally
  // Higher z-index prevents background color panels from covering this during html2canvas rendering
  // Subtle SeaGreen watermark color with lower opacity for pristine text legibility
  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex flex-col justify-between py-10 px-4 gap-y-20 opacity-90"
    >
      {Array.from({ length: 14 }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-around items-center w-full gap-x-6 shrink-0 print:gap-x-12"
          style={{ 
            transform: rowIndex % 2 === 0 ? 'translateX(30px)' : 'translateX(-30px)',
          }}
        >
          {Array.from({ length: 4 }).map((_, colIndex) => (
            <span 
              key={colIndex} 
              className="font-sans font-black tracking-widest text-[#2e8b57] text-xs sm:text-sm uppercase select-none whitespace-nowrap"
              style={{ 
                transform: 'rotate(-28deg)', 
                display: 'inline-block',
                opacity: 0.025 // Ultra-reduced, soft SeaGreen watermark to maximize text clarity
              }}
            >
              Ezibeck Academy
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

export function ScratchCardWatermark() {
  // Generates compact repeating rows of "Ezibeck Academy" rotated diagonally inside smaller cards/slips
  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex flex-col justify-between py-3 px-1 gap-y-6 opacity-90"
    >
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-around items-center w-full gap-x-2 shrink-0"
          style={{ 
            transform: rowIndex % 2 === 0 ? 'translateX(10px)' : 'translateX(-10px)',
          }}
        >
          {Array.from({ length: 3 }).map((_, colIndex) => (
            <span 
              key={colIndex} 
              className="font-sans font-black tracking-widest text-[#2e8b57] text-[8px] sm:text-[9px] uppercase select-none whitespace-nowrap"
              style={{ 
                transform: 'rotate(-18deg)', 
                display: 'inline-block',
                opacity: 0.02 // Soft SeaGreen watermark for compact slips
              }}
            >
              Ezibeck Academy
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
