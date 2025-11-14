import React, { useState } from 'react';
import { Collaborator, Interaction, View } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Header from './components/Header';

const App: React.FC = () => {
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>('tourist_app_collaborators', []);
  const [interactions, setInteractions] = useLocalStorage<Interaction[]>('tourist_app_interactions', []);
  const [currentCollaborator, setCurrentCollaborator] = useState<Collaborator | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');

  const handleLogin = (collaborator: Collaborator) => {
    setCurrentCollaborator(collaborator);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentCollaborator(null);
    setCurrentView('login');
  };

  const addCollaborator = (name: string): Collaborator => {
    const newCollaborator: Collaborator = { id: `colab_${Date.now()}`, name };
    setCollaborators([...collaborators, newCollaborator]);
    return newCollaborator;
  };

  const deleteCollaborator = (id: string) => {
    // Remove collaborator and all their interactions
    setCollaborators(collaborators.filter(c => c.id !== id));
    setInteractions(interactions.filter(i => i.collaboratorId !== id));
  };

  const addInteraction = (nationality: string, count: number, visitReason?: string, lengthOfStay?: string) => {
    if (!currentCollaborator) return;
    const newInteraction: Interaction = {
      id: `int_${Date.now()}`,
      collaboratorId: currentCollaborator.id,
      nationality,
      count,
      timestamp: new Date().toISOString(),
      visitReason: visitReason && visitReason.trim() ? visitReason.trim() : undefined,
      lengthOfStay: lengthOfStay && lengthOfStay.trim() ? lengthOfStay.trim() : undefined,
    };
    setInteractions([newInteraction, ...interactions]);
  };
  
  const updateInteraction = (updatedInteraction: Interaction) => {
    setInteractions(
      interactions.map((i) => (i.id === updatedInteraction.id ? updatedInteraction : i))
    );
  };

  const deleteInteraction = (id: string) => {
    setInteractions(interactions.filter((i) => i.id !== id));
  };

  const renderContent = () => {
    if (!currentCollaborator || currentView === 'login') {
      return <Login collaborators={collaborators} onLogin={handleLogin} addCollaborator={addCollaborator} deleteCollaborator={deleteCollaborator} />;
    }

    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            collaborator={currentCollaborator}
            interactions={interactions.filter(i => i.collaboratorId === currentCollaborator.id)}
            addInteraction={addInteraction}
            updateInteraction={updateInteraction}
            deleteInteraction={deleteInteraction}
          />
        );
      case 'reports':
        return <Reports allInteractions={interactions} collaborators={collaborators} />;
      default:
        return <Login collaborators={collaborators} onLogin={handleLogin} addCollaborator={addCollaborator} deleteCollaborator={deleteCollaborator} />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans">
      {currentCollaborator && (
        <Header 
          collaborator={currentCollaborator} 
          currentView={currentView}
          setView={setCurrentView}
          onLogout={handleLogout} 
        />
      )}
      <main className="p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;