import React, { useEffect, useRef } from 'react';

interface MatrixCharacterBackgroundProps {
  opacity?: number;
  className?: string;
}

const TARGET_WORDS = ['Engipath', '진로탐색', '성장계획'];

export const MatrixCharacterBackground: React.FC<MatrixCharacterBackgroundProps> = ({
  opacity = 1,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    // Multi-lingual character pool with "원", "툴"
    const charPool = [
      'E', 'n', 'g', 'i', 'P', 'a', 't', 'h', '진', '로', '성', '장',
      '0', '1', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F',
      'X', 'M', 'Q', 'W', '%', '@', '&', '#', '$'
    ];

    // Standard small monospace grid for crisp legibility
    const fontSize = 9.0;
    const cellWidth = 9.0;
    const cellHeight = 11.0;

    let cols = 0;
    let rows = 0;

    // Mouse movement glitch controller: single punchy burst on move, then 5s cooldown
    const GLITCH_DURATION = 650; // ms duration of the active glitch
    const GLITCH_COOLDOWN = 5000; // 5 seconds strict delay before another glitch can trigger
    let isGlitchActive = false;
    let glitchStartTime = 0;
    let lastGlitchEndTime = 0;

    const handleMouseMove = () => {
      const now = Date.now();
      if (!isGlitchActive && now - lastGlitchEndTime >= GLITCH_COOLDOWN) {
        isGlitchActive = true;
        glitchStartTime = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    interface GridCell {
      char: string;
      origX: number;
      origY: number;
      row: number;
      col: number;
      masks: Float32Array; // masks for each word in TARGET_WORDS
      blinkSpeed: number;
      blinkOffset: number;
    }

    let cells: GridCell[] = [];

    const buildMasksAndGrid = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      cols = Math.floor(width / cellWidth);
      rows = Math.floor(height / cellHeight);

      const offCanvas = document.createElement('canvas');
      offCanvas.width = cols;
      offCanvas.height = rows;
      const offCtx = offCanvas.getContext('2d');

      const wordMaskData: Float32Array[] = [];

      if (offCtx) {
        for (let w = 0; w < TARGET_WORDS.length; w++) {
          const word = TARGET_WORDS[w];
          offCtx.fillStyle = '#000000';
          offCtx.fillRect(0, 0, cols, rows);

          offCtx.fillStyle = '#ffffff';

          let calculatedFontSize: number;
          if (word === 'Engipath') {
            // 7 letters: fit horizontally with clean margins
            calculatedFontSize = Math.min(Math.floor(rows * 0.46), Math.floor((cols * 0.86) / 4.4));
          } else {
            // 2 letters ('万途' / '원툴'): bold, balanced, highly legible
            calculatedFontSize = Math.min(Math.floor(rows * 0.68), Math.floor(cols * 0.44));
          }

          offCtx.font = `900 ${calculatedFontSize}px "Noto Sans SC", "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", "PingFang SC", "Segoe UI", sans-serif`;
          offCtx.textAlign = 'center';
          offCtx.textBaseline = 'middle';
          offCtx.fillText(word, cols / 2, rows / 2);

          const imgData = offCtx.getImageData(0, 0, cols, rows).data;
          const maskArr = new Float32Array(cols * rows);
          for (let i = 0; i < cols * rows; i++) {
            maskArr[i] = imgData[i * 4] / 255;
          }
          wordMaskData.push(maskArr);
        }

        cells = [];
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = r * cols + c;
            const origX = c * cellWidth + cellWidth / 2;
            const origY = r * cellHeight + cellHeight / 2;

            const masks = new Float32Array(TARGET_WORDS.length);
            for (let w = 0; w < TARGET_WORDS.length; w++) {
              masks[w] = wordMaskData[w][idx] || 0;
            }

            cells.push({
              char: charPool[Math.floor(Math.random() * charPool.length)],
              origX,
              origY,
              row: r,
              col: c,
              masks,
              blinkSpeed: 0.0012 + Math.random() * 0.003,
              blinkOffset: Math.random() * Math.PI * 2
            });
          }
        }
      }
    };

    buildMasksAndGrid();

    const handleResize = () => {
      buildMasksAndGrid();
    };

    window.addEventListener('resize', handleResize);

    const wordDuration = 4800; // ms display per word
    const morphDuration = 1600; // ms silky-smooth transition
    const totalCycle = TARGET_WORDS.length * wordDuration;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const now = Date.now();
      const time = now * 0.0015;

      // Handle 650ms glitch lifecycle followed by strict 5s delay
      let isGlitching = false;
      let glitchIntensity = 0;

      if (isGlitchActive) {
        const elapsed = now - glitchStartTime;
        if (elapsed < GLITCH_DURATION) {
          isGlitching = true;
          const progress = elapsed / GLITCH_DURATION;
          glitchIntensity = Math.sin(progress * Math.PI);
        } else {
          isGlitchActive = false;
          lastGlitchEndTime = now; // 5-second countdown starts immediately
        }
      }

      const cycleTime = now % totalCycle;
      const wordSlot = Math.floor(cycleTime / wordDuration);
      const slotElapsed = cycleTime % wordDuration;

      const currentWordIdx = wordSlot;
      const nextWordIdx = (wordSlot + 1) % TARGET_WORDS.length;

      // Ultra-smooth cosine interpolation for morphing
      let morphT = 0;
      if (slotElapsed > wordDuration - morphDuration) {
        const rawT = (slotElapsed - (wordDuration - morphDuration)) / morphDuration;
        morphT = 0.5 - 0.5 * Math.cos(rawT * Math.PI);
      }

      // Dynamic glitch tearing scanline rows across the screen during the burst
      const glitchBandRow1 = isGlitching ? Math.floor(Math.sin(time * 24) * rows * 0.45 + rows * 0.5) : -100;
      const glitchBandRow2 = isGlitching ? Math.floor(Math.cos(time * 32) * rows * 0.4 + rows * 0.3) : -100;
      const glitchBandRow3 = isGlitching ? Math.floor(Math.sin(time * 19 + 2) * rows * 0.35 + rows * 0.75) : -100;

      ctx.save();
      ctx.font = `600 ${fontSize}px "JetBrains Mono", "SF Mono", Menlo, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const isMorphing = morphT > 0.01 && morphT < 0.99;

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        const isNearBand =
          isGlitching &&
          (Math.abs(cell.row - glitchBandRow1) < 5 ||
            Math.abs(cell.row - glitchBandRow2) < 4 ||
            Math.abs(cell.row - glitchBandRow3) < 3);

        // Scramble characters on morph or during active glitch with boosted rate
        if (
          (isMorphing && Math.random() < 0.08) ||
          (isGlitching && (isNearBand ? Math.random() < 0.65 : Math.random() < 0.28 * glitchIntensity))
        ) {
          cell.char = charPool[Math.floor(Math.random() * charPool.length)];
        } else if (Math.random() < 0.006) {
          cell.char = charPool[Math.floor(Math.random() * charPool.length)];
        }

        const dCurrent = cell.masks[currentWordIdx];
        const dNext = cell.masks[nextWordIdx];
        const interpolatedDensity = dCurrent * (1 - morphT) + dNext * morphT;

        const isMask = interpolatedDensity > 0.20;
        const blink = 0.5 + 0.5 * Math.sin(time * cell.blinkSpeed * 1000 + cell.blinkOffset);

        // Calculate intense glitch displacement with horizontal CRT shear
        let renderX = cell.origX;
        let renderY = cell.origY;

        if (isGlitching) {
          if (isNearBand) {
            renderX += (Math.random() - 0.5) * 65 * glitchIntensity;
            renderY += (Math.random() - 0.5) * 8 * glitchIntensity;
          } else if (Math.random() < 0.35 * glitchIntensity) {
            renderX += (Math.random() - 0.5) * 24 * glitchIntensity;
            renderY += (Math.random() - 0.5) * 4 * glitchIntensity;
          }
        }

        if (isMask) {
          const wave = Math.sin(time * 1.8 + cell.origX * 0.015 + cell.origY * 0.015) * 0.08;
          let alpha = Math.min(0.98, Math.max(0.30, (0.50 + interpolatedDensity * 0.45 + wave) * (0.6 + blink * 0.4)));

          if (isGlitching && isNearBand) {
            // Intense Chromatic Aberration: Render dual offset cyan & neon red spikes
            const splitOffset = (Math.random() * 8 + 4) * glitchIntensity;
            ctx.fillStyle = `rgba(239, 68, 68, ${Math.min(1.0, alpha + 0.35)})`;
            ctx.fillText(cell.char, renderX - splitOffset, renderY);
            ctx.fillStyle = `rgba(6, 182, 212, ${Math.min(1.0, alpha + 0.4)})`;
            ctx.fillText(cell.char, renderX + splitOffset, renderY);
          } else if (isGlitching && Math.random() < 0.35 * glitchIntensity) {
            alpha = Math.min(1.0, alpha + 0.4 * glitchIntensity);
            ctx.fillStyle = Math.random() < 0.5 ? `rgba(6, 182, 212, ${alpha})` : `rgba(236, 72, 153, ${alpha})`;
            ctx.fillText(cell.char, renderX, renderY);
          } else if (interpolatedDensity > 0.65) {
            ctx.fillStyle = `rgba(147, 51, 234, ${alpha})`;
            ctx.fillText(cell.char, renderX, renderY);
          } else {
            ctx.fillStyle = `rgba(168, 85, 247, ${alpha * 0.9})`;
            ctx.fillText(cell.char, renderX, renderY);
          }
        } else {
          // Ambient background glyphs
          let baseAlpha = 0.018 + blink * 0.03;
          if (isGlitching && isNearBand) {
            baseAlpha += 0.22 * glitchIntensity;
            ctx.fillStyle = `rgba(6, 182, 212, ${baseAlpha})`;
          } else {
            if (isGlitching && Math.random() < 0.15 * glitchIntensity) {
              baseAlpha += 0.12 * glitchIntensity;
            }
            ctx.fillStyle = `rgba(168, 85, 247, ${baseAlpha})`;
          }
          ctx.fillText(cell.char, renderX, renderY);
        }
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none w-full h-full z-0 transition-opacity duration-700 ${className}`}
      style={{ opacity }}
    />
  );
};
