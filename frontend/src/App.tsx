import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/common/Layout';
import { Screen0_Hero } from './components/screens/Screen0_Hero';
import { Screen2_Onboarding } from './components/screens/Screen2_Onboarding';
import { Screen1_DreamJob } from './components/screens/Screen1_DreamJob';
import { Screen3_Diagnostic } from './components/screens/Screen3_Diagnostic';
import { Screen4_Portrait } from './components/screens/Screen4_Portrait';
import { Screen5_ActionPlan } from './components/screens/Screen5_ActionPlan';
import { Screen6_Dashboard } from './components/screens/Screen6_Dashboard';

const ScreenRouter: React.FC = () => {
  const { currentStep } = useApp();

  switch (currentStep) {
    case 0:
      // Hero Screen (accessible only when clicking logo)
      return <Screen0_Hero />;
    case 1:
      // Step 1: Academic Profile Context Screen
      return <Screen2_Onboarding />;
    case 2:
      // Step 2: Curated Career Directions
      return <Screen1_DreamJob />;
    case 3:
      return <Screen3_Diagnostic />;
    case 4:
      return <Screen4_Portrait />;
    case 5:
      return <Screen5_ActionPlan />;
    case 6:
      return <Screen6_Dashboard />;
    default:
      return <Screen2_Onboarding />;
  }
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <Layout>
        <ScreenRouter />
      </Layout>
    </AppProvider>
  );
};

export default App;
