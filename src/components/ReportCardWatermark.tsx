import React from 'react';

export function ReportCardWatermark() {
  // Generates fewer and smaller repeating rows of "Ezibeck Academy" rotated diagonally to be compact and unobtrusive
  // Higher z-index prevents background color panels from covering this during html2canvas rendering
  // Subtle SeaGreen watermark color with low RGBA opacity for pristine text legibility
  return (
    <div 
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex flex-col justify-around py-20 px-8 gap-y-36"
    >
      {Array.from({ length: 4 }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex justify-around items-center w-full gap-x-16 shrink-0 print:gap-x-24"
          style={{ 
            transform: rowIndex % 2 === 0 ? 'translateX(50px)' : 'translateX(-50px)',
          }}
        >
          {Array.from({ length: 2 }).map((_, colIndex) => (
            <span 
              key={colIndex} 
              className="font-sans font-black tracking-widest text-[8px] sm:text-[9px] uppercase select-none whitespace-nowrap"
              style={{ 
                transform: 'rotate(-20deg)', 
                display: 'inline-block',
                color: 'rgba(46, 139, 87, 0.012)' // Reduced size and opacity
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
      className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25 flex flex-col justify-between py-3 px-1 gap-y-6"
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
              className="font-sans font-black tracking-widest text-[8px] sm:text-[9px] uppercase select-none whitespace-nowrap"
              style={{ 
                transform: 'rotate(-18deg)', 
                display: 'inline-block',
                color: 'rgba(46, 139, 87, 0.012)' // High-fidelity RGBA color rendering for html2canvas inline
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
