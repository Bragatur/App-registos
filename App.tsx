import React, { useState, useEffect } from 'react';
import { Collaborator, Interaction, View, PRIMARY_ADMIN_ID } from './types';
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
  
  useEffect(() => {
    const ADMIN_USERNAME = 'admin';
    const ADMIN_EMAIL = 'braga.turismo.2024@gmail.com';

    setCollaborators(prev => {
      let updatedCollaborators = [...prev];
      let primaryAdmin = updatedCollaborators.find(c => c.id === PRIMARY_ADMIN_ID);

      if (!primaryAdmin) {
        let potentialAdmin = updatedCollaborators.find(c => c.name.toLowerCase() === ADMIN_USERNAME.toLowerCase() || c.name.toLowerCase() === 'vitor.afonso');
        
        if (potentialAdmin) {
           updatedCollaborators = updatedCollaborators.map(c => 
            c.id === potentialAdmin.id 
              ? { ...c, id: PRIMARY_ADMIN_ID, name: ADMIN_USERNAME, email: ADMIN_EMAIL, isAdmin: true, status: 'aprovado' } 
              : c
          );
           updatedCollaborators = updatedCollaborators.filter(c => c.id === PRIMARY_ADMIN_ID || c.name.toLowerCase() !== ADMIN_USERNAME.toLowerCase());
        } else {
          const defaultAdmin: Collaborator = {
            id: PRIMARY_ADMIN_ID,
            name: ADMIN_USERNAME,
            email: ADMIN_EMAIL,
            password: 'admin',
            isAdmin: true,
            status: 'aprovado',
          };
          updatedCollaborators.push(defaultAdmin);
        }
      } else {
        updatedCollaborators = updatedCollaborators.map(c => 
          c.id === PRIMARY_ADMIN_ID
            ? { ...c, email: ADMIN_EMAIL, name: c.name || ADMIN_USERNAME, isAdmin: true, status: 'aprovado' }
            : c
        );
      }
      return updatedCollaborators;
    });
  }, [setCollaborators]);

  // Sincroniza as interações para remover registos órfãos quando um colaborador é eliminado.
  useEffect(() => {
    const collaboratorIds = new Set(collaborators.map(c => c.id));
    if (collaboratorIds.size > 0) {
      setInteractions(prev => prev.filter(i => collaboratorIds.has(i.collaboratorId)));
    }
  }, [collaborators, setInteractions]);


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

  const addCollaborator = (name: string, password: string, email: string): { success: boolean, message: string, collaborator?: Collaborator } => {
    if (name.trim().toLowerCase() === 'admin') {
      return { success: false, message: 'O nome de utilizador "admin" é reservado.' };
    }
    if (collaborators.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        return { success: false, message: 'Já existe um colaborador com este nome.' };
    }
     if (collaborators.some(c => c.email.toLowerCase() === email.trim().toLowerCase())) {
        return { success: false, message: 'Este email já está a ser utilizado.' };
    }
    
    const newCollaborator: Collaborator = {
      id: `colab_${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      password,
      isAdmin: false,
      status: 'pendente',
    };
    setCollaborators(prev => [...prev, newCollaborator]);
    return { success: true, message: "Utilizador criado com sucesso.", collaborator: newCollaborator };
  };

  const approveCollaborator = (id: string) => {
    setCollaborators(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'aprovado' } : c))
    );
  };

  const rejectCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
  };
  
  const deleteCollaborator = (id: string) => {
    setCollaborators(prevCollaborators => {
        if (id === PRIMARY_ADMIN_ID) {
            alert('Não é possível eliminar a conta de administrador principal.');
            return prevCollaborators;
        }

        const targetUser = prevCollaborators.find(c => c.id === id);
        if (!targetUser) return prevCollaborators;
        
        if (targetUser.isAdmin) {
          const adminCount = prevCollaborators.filter(c => c.isAdmin).length;
          if (adminCount <= 1) {
            alert('Não é possível eliminar o último administrador da aplicação.');
            return prevCollaborators;
          }
        }
        
        return prevCollaborators.filter(c => c.id !== id);
    });
  };

  const resetUserPassword = (userId: string, newPassword: string) => {
    setCollaborators(prev =>
      prev.map(c => (c.id === userId ? { ...c, password: newPassword } : c))
    );
  };
  
  const requestPasswordReset = (email: string): { success: boolean, message: string } => {
    const userToReset = collaborators.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!userToReset) {
      return { success: false, message: "Não foi encontrada nenhuma conta com este email." };
    }
    
    const newPassword = Math.random().toString(36).slice(-8);
    resetUserPassword(userToReset.id, newPassword);

    return { success: true, message: `Uma nova password foi gerada para ${userToReset.name}. A sua nova password é: ${newPassword}` };
  };

  const toggleAdminStatus = (userId: string) => {
    setCollaborators(prev => {
        if (userId === PRIMARY_ADMIN_ID) {
            alert('Não é possível remover os privilégios da conta de administrador principal.');
            return prev;
        }
        const targetUser = prev.find(c => c.id === userId);
        if (!targetUser) return prev;

        if (targetUser.isAdmin) {
            const adminCount = prev.filter(c => c.isAdmin).length;
            if (adminCount <= 1) {
              alert('Não é possível remover os privilégios do último administrador.');
              return prev;
            }
        }
        
        return prev.map(c => (c.id === userId ? { ...c, isAdmin: !c.isAdmin } : c));
    });
  };

  const updateCollaboratorProfile = (id: string, newName: string, newPass: string) => {
    if (collaborators.some(c => c.id !== id && c.name.toLowerCase() === newName.trim().toLowerCase())) {
      alert('Já existe um colaborador com este nome.');
      return;
    }

    setCollaborators(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updatedCollaborator = {
            ...c,
            name: newName.trim(),
            password: newPass ? newPass : c.password,
          };

          if (currentCollaborator?.id === id) {
            setCurrentCollaborator(updatedCollaborator);
          }

          return updatedCollaborator;
        }
        return c;
      })
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
    setInteractions(prev => [newInteraction, ...prev]);
  };
  
  const updateInteraction = (updatedInteraction: Interaction) => {
    setInteractions(prev =>
      prev.map((i) => (i.id === updatedInteraction.id ? updatedInteraction : i))
    );
  };

  const deleteInteraction = (id: string) => {
    setInteractions(prev => prev.filter((i) => i.id !== id));
  };

  const renderContent = () => {
    if (!currentCollaborator || currentView === 'login') {
      return <Login onLogin={handleLogin} addCollaborator={addCollaborator} requestPasswordReset={requestPasswordReset} collaborators={collaborators}/>;
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
            onUpdateProfile={updateCollaboratorProfile}
          />
        );
      default:
        return <Login onLogin={handleLogin} addCollaborator={addCollaborator} requestPasswordReset={requestPasswordReset} collaborators={collaborators} />;
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