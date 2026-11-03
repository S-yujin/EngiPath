import React, { useEffect, useRef } from 'react';

const SPECTROGRAM_CHARS = [
  '万', '途', '0', '1', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
  'M', 'Q', 'W', 'X', '%', '#', '$', '&', '@'
];

interface WaveSpectrogramBackgroundProps {
  opacity?: number;
}

export const WaveSpectrogramBackground: React.FC<WaveSpectrogramBackgroundProps> = ({
  opacity = 1.0
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      width = window.innerWidth;
      // Taller spectrogram height (up to 52% of viewport)
      height = Math.min(460, Math.floor(window.innerHeight * 0.52));
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const colSpacing = 16;
    const rowSpacing = 14;

    // Cache matrix characters across the grid
    const numCols = Math.ceil(3400 / colSpacing);
    const numRows = Math.ceil(520 / rowSpacing);
    const charGrid: string[][] = [];
    for (let c = 0; c < numCols; c++) {
      const colChars: string[] = [];
      for (let r = 0; r < numRows; r++) {
        colChars.push(SPECTROGRAM_CHARS[Math.floor(Math.random() * SPECTROGRAM_CHARS.length)]);
      }
      charGrid.push(colChars);
    }

    let time = 0;

    const render = () => {
      // Much slower, graceful, peaceful wave motion (4.5x slower)
      time += 0.0065;
      ctx.clearRect(0, 0, width, height);

      const cols = Math.ceil(width / colSpacing);
      const rows = Math.ceil(height / rowSpacing);

      ctx.font = '700 11px "JetBrains Mono", "SF Mono", Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let c = 0; c < cols; c++) {
        const x = c * colSpacing + colSpacing / 2;

        // Multi-harmonic audio soundboard / equalizer wave formula with tranquil pace
        const wave1 = Math.sin(time * 1.5 + c * 0.11) * 0.44;
        const wave2 = Math.sin(time * 0.75 - c * 0.06) * 0.28;
        const wave3 = Math.sin(time * 2.2 + c * 0.22) * 0.15;
        const wave4 = Math.cos(time * 1.1 + c * 0.16) * 0.11;

        const combined = 0.54 + (wave1 + wave2 + wave3 + wave4);
        const colHeight = Math.max(1, Math.min(rows, Math.floor(combined * rows)));

        for (let r = 0; r < colHeight; r++) {
          const y = height - (r * rowSpacing + rowSpacing / 2);
          const char = charGrid[c % numCols][r % numRows];

          // Height ratio from baseline
          const heightRatio = r / Math.max(1, colHeight - 1);

          // Distinct ambient alpha
          const baseAlpha = 0.07 + heightRatio * 0.28;
          const finalAlpha = baseAlpha * opacity;

          if (finalAlpha <= 0.015) continue;

          // Color palette: vibrant purple, violet, indigo, with special glow for 万 and 途
          if (char === '万' || char === '途') {
            ctx.fillStyle = `rgba(147, 51, 234, ${Math.min(0.80, finalAlpha * 2.4)})`;
          } else if (r === colHeight - 1) {
            // Equalizer peak cap
            ctx.fillStyle = `rgba(168, 85, 247, ${Math.min(0.85, finalAlpha * 2.1)})`;
          } else if (r % 3 === 0) {
            ctx.fillStyle = `rgba(129, 140, 248, ${finalAlpha * 1.35})`;
          } else {
            ctx.fillStyle = `rgba(192, 132, 252, ${finalAlpha * 1.25})`;
          }

          ctx.fillText(char, x, y);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [opacity]);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-72 sm:h-96 pointer-events-none z-0 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* Soft top gradient so spectrogram blends seamlessly into background */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#FAF9FC] to-transparent pointer-events-none" />
    </div>
  );
};
