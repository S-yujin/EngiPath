import { useApp } from '../context/AppContext';
import { MAJOR_PRESETS } from '../utils/mockData';

export function useProfile() {
  const {
    profile,
    updateProfile,
    simulateTranscriptUpload,
    clearTranscript,
    selectedJob,
    currentScores,
    matchPercentage,
    confidenceRanking
  } = useApp();

  const majorOptions = Object.keys(MAJOR_PRESETS);

  const setYear = (year: number) => {
    updateProfile({ year });
  };

  const setMajor = (major: string) => {
    updateProfile({ major });
  };

  const setName = (name: string) => {
    updateProfile({ name });
  };

  const setIntro = (intro: string) => {
    updateProfile({ intro });
  };

  return {
    profile,
    updateProfile,
    setYear,
    setMajor,
    setName,
    setIntro,
    simulateTranscriptUpload,
    clearTranscript,
    majorOptions,
    selectedJob,
    currentScores,
    matchPercentage,
    confidenceRanking
  };
}
