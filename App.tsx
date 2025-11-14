import React, { useState, useEffect } from 'react';
import { Collaborator, Interaction, View } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Header from './components/Header';
import Admin from './components/Admin';

const App: React.FC = () => {
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>('tourist_app_collaborators', []);
  const [interactions, setInteractions] = useLocalStorage<Interaction[]>('tourist_app_interactions', []);
  const [currentCollaborator, setCurrentCollaborator] = useState<Collaborator | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  
  // Effect to ensure the default admin account exists and is correctly configured on startup.
  useEffect(() => {
    setCollaborators(prev => {
      let updatedCollaborators = [...prev];
      const adminAccount = updatedCollaborators.find(c => c.name.toLowerCase() === 'admin');

      if (!adminAccount) {
        // If 'admin' user doesn't exist, create it.
        const defaultAdmin: Collaborator = {
          id: 'colab_admin_default',
          name: 'admin',
          password: 'admin',
          isAdmin: true,
          status: 'aprovado',
        };
        updatedCollaborators.push(defaultAdmin);
      } else {
        // If 'admin' user exists, ensure it has admin rights and is approved.
        if (!adminAccount.isAdmin || adminAccount.status !== 'aprovado') {
          updatedCollaborators = updatedCollaborators.map(c =>
            c.id === adminAccount.id
              ? { ...c, isAdmin: true, status: 'aprovado' }
              : c
          );
        }
      }
      return updatedCollaborators;
    });
  }, [setCollaborators]);


  const handleLogin = (name: string, password: string): { success: boolean, message: string } => {
    const collaborator = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (!collaborator) {
      return { success: false, message: 'Utilizador não encontrado.' };
    }
    if (collaborator.password !== password) {
      return { success: false, message: 'Password incorreta.' };
    }
    if (collaborator.status !== 'aprovado') {
      return { success: false, message: 'A sua conta aguarda aprovação de um administrador.' };
    }
    
    setCurrentCollaborator(collaborator);
    setCurrentView('dashboard');
    return { success: true, message: 'Login bem-sucedido!' };
  };

  const handleLogout = () => {
    setCurrentCollaborator(null);
    setCurrentView('login');
  };

  const addCollaborator = (name: string, password: string): { success: boolean, message: string, collaborator?: Collaborator } => {
    if (name.trim().toLowerCase() === 'admin') {
      return { success: false, message: 'O nome de utilizador "admin" é reservado.' };
    }
    if (collaborators.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        return { success: false, message: 'Já existe um colaborador com este nome.' };
    }
    
    const newCollaborator: Collaborator = {
      id: `colab_${Date.now()}`,
      name: name.trim(),
      password,
      isAdmin: false, // New users are never admins by default
      status: 'pendente',
    };
    setCollaborators([...collaborators, newCollaborator]);
    return { success: true, message: "Utilizador criado com sucesso.", collaborator: newCollaborator };
  };

  const approveCollaborator = (id: string) => {
    setCollaborators(
      collaborators.map(c => (c.id === id ? { ...c, status: 'aprovado' } : c))
    );
  };

  const rejectCollaborator = (id: string) => {
    setCollaborators(collaborators.filter(c => c.id !== id));
  };
  
  const deleteCollaborator = (id: string) => {
    const targetUser = collaborators.find(c => c.id === id);
    if (!targetUser) return;
    
    if (targetUser.name.toLowerCase() === 'admin') {
        alert('Não é possível eliminar a conta de administrador principal.');
        return;
    }

    if (targetUser.isAdmin) {
      const adminCount = collaborators.filter(c => c.isAdmin).length;
      if (adminCount <= 1) {
        alert('Não é possível eliminar o último administrador da aplicação.');
        return;
      }
    }

    setCollaborators(collaborators.filter(c => c.id !== id));
    setInteractions(interactions.filter(i => i.collaboratorId !== id));
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    const targetUser = collaborators.find(c => c.id === userId);
    if (targetUser?.name.toLowerCase() === 'admin') {
      alert('A password do administrador principal não pode ser alterada a partir deste painel.');
      return;
    }
    setCollaborators(prev =>
      prev.map(c => (c.id === userId ? { ...c, password: newPassword } : c))
    );
  };

  const toggleAdminStatus = (userId: string) => {
    const targetUser = collaborators.find(c => c.id === userId);
    if (!targetUser) return;

    if (targetUser.name.toLowerCase() === 'admin') {
        alert('Não é possível remover os privilégios da conta de administrador principal.');
        return;
    }

    const adminCount = collaborators.filter(c => c.isAdmin).length;
    if (targetUser.isAdmin && adminCount <= 1) {
      alert('Não é possível remover os privilégios do último administrador.');
      return;
    }

    setCollaborators(prev =>
      prev.map(c => (c.id === userId ? { ...c, isAdmin: !c.isAdmin } : c))
    );
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
      return <Login onLogin={handleLogin} addCollaborator={addCollaborator} />;
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
      case 'admin':
        return (
          <Admin
            collaborators={collaborators}
            currentAdminId={currentCollaborator.id}
            onApprove={approveCollaborator}
            onReject={rejectCollaborator}
            onDelete={deleteCollaborator}
            onResetPassword={resetUserPassword}
            onToggleAdmin={toggleAdminStatus}
          />
        );
      default:
        return <Login onLogin={handleLogin} addCollaborator={addCollaborator} />;
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