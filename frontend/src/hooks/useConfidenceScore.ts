import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getRankingColor } from '../utils/scoring';

export function useConfidenceScore() {
  const { confidenceScore, confidenceRanking, matchPercentage, currentScores, selectedJob } = useApp();
  const [animatedScore, setAnimatedScore] = useState<number>(confidenceScore);

  useEffect(() => {
    let start = animatedScore;
    const end = confidenceScore;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setAnimatedScore(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    const animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [confidenceScore]);

  const rankingColors = getRankingColor(confidenceRanking);

  return {
    score: animatedScore,
    rawScore: confidenceScore,
    ranking: confidenceRanking,
    matchPercentage,
    currentScores,
    selectedJob,
    rankingColors
  };
}
