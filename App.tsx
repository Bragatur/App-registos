
import React, { useState, useEffect } from 'react';
import { Collaborator, Interaction, View, PRIMARY_ADMIN_ID, Notification as NotificationType } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Reports from './components/Reports';
import Header from './components/Header';
import Admin from './components/Admin';
import { CheckCircleIcon, XCircleIcon, KeyIcon } from './components/icons';

const Notification: React.FC<{ notification: NotificationType | null, onDismiss: () => void }> = ({ notification, onDismiss }) => {
    if (!notification) return null;

    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [notification, onDismiss]);

    const isSuccess = notification.type === 'success';
    const bgColor = isSuccess ? 'bg-green-600' : 'bg-red-600';
    const Icon = isSuccess ? CheckCircleIcon : XCircleIcon;

    return (
        <div className={`fixed bottom-5 right-5 ${bgColor} text-white py-3 px-5 rounded-lg shadow-lg z-50 flex items-center gap-4 animate-fade-in-up`}>
            <Icon className="w-6 h-6" />
            <span>{notification.message}</span>
            {notification.undoAction && (
                <button
                    onClick={() => {
                        notification.undoAction?.();
                        onDismiss();
                    }}
                    className="font-bold underline hover:text-green-100"
                >
                    Desfazer
                </button>
            )}
             <button onClick={onDismiss} className="text-2xl leading-none absolute top-0 right-1.5 hover:text-white/80">&times;</button>
        </div>
    );
};

interface ChangePasswordModalProps {
  onClose: () => void;
  onSubmit: (newPassword: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSubmit }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setError('As passwords não coincidem ou estão em branco.');
      return;
    }
    onSubmit(newPassword);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-slate-800 flex items-center"><KeyIcon className="w-6 h-6 mr-3 text-blue-600" /> Alterar a sua Password</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-slate-600">Por segurança, defina uma nova password pessoal para a sua conta.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="new-password-modal">Nova Password</label>
            <input id="new-password-modal" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirm-password-modal">Confirmar Nova Password</label>
            <input id="confirm-password-modal" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Guardar Nova Password</button>
        </form>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const [collaborators, setCollaborators] = useLocalStorage<Collaborator[]>('tourist_app_collaborators', []);
  const [interactions, setInteractions] = useLocalStorage<Interaction[]>('tourist_app_interactions', []);
  const [currentCollaborator, setCurrentCollaborator] = useState<Collaborator | null>(null);
  const [currentView, setCurrentView] = useState<View>('login');
  const [notification, setNotification] = useState<NotificationType | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error', undoAction?: () => void) => {
    setNotification({ message, type, undoAction });
  };
  
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

  useEffect(() => {
    const collaboratorIds = new Set(collaborators.map(c => c.id));
    if (collaboratorIds.size > 0) {
      setInteractions(prev => prev.filter(i => collaboratorIds.has(i.collaboratorId)));
    }
  }, [collaborators, setInteractions]);


  const handleLogin = (name: string, password: string) => {
    const collaborator = collaborators.find(c => c.name.toLowerCase() === name.toLowerCase());

    if (!collaborator) {
      showNotification('Utilizador não encontrado.', 'error');
      return;
    }
    if (collaborator.password !== password) {
      showNotification('Password incorreta.', 'error');
      return;
    }
    if (collaborator.status !== 'aprovado') {
      showNotification('A sua conta aguarda aprovação de um administrador.', 'error');
      return;
    }
    
    setCurrentCollaborator(collaborator);
    setCurrentView('dashboard');
    showNotification(`Bem-vindo, ${collaborator.name}!`, 'success');
  };

  const handleLogout = () => {
    setCurrentCollaborator(null);
    setCurrentView('login');
  };

  const addCollaborator = (name: string, password: string, email: string) => {
    if (name.trim().toLowerCase() === 'admin') {
      showNotification('O nome de utilizador "admin" é reservado.', 'error');
      return;
    }
    if (collaborators.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) {
        showNotification('Já existe um colaborador com este nome.', 'error');
        return;
    }
     if (collaborators.some(c => c.email.toLowerCase() === email.trim().toLowerCase())) {
        showNotification('Este email já está a ser utilizado.', 'error');
        return;
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
    showNotification('Registo efetuado. Aguarde aprovação de um administrador.', 'success');

    const recipient = 'braga.turismo.2024@gmail.com';
    const subject = 'Novo Pedido de Aprovação de Registo';
    const body = `Um novo utilizador registou-se e aguarda aprovação.\n\nNome: ${newCollaborator.name}\nEmail: ${newCollaborator.email}\n\nPor favor, aceda ao painel de administração para aprovar ou recusar o registo.`;
    
    window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const approveCollaborator = (id: string) => {
    const collaboratorToApprove = collaborators.find(c => c.id === id);
    if (!collaboratorToApprove) return;

    setCollaborators(prev =>
      prev.map(c => (c.id === id ? { ...c, status: 'aprovado' } : c))
    );
    showNotification("Utilizador aprovado com sucesso.", "success");
    
    const recipient = collaboratorToApprove.email;
    const subject = 'O seu registo na App Atendimentos foi aprovado!';
    const body = `Olá ${collaboratorToApprove.name},\n\nO seu registo na aplicação de Atendimentos Turísticos foi aprovado.\n\nJá pode iniciar sessão com as suas credenciais.\n\nCom os melhores cumprimentos,\nA Equipa do Posto de Turismo`;

    if (window.confirm(`Deseja notificar "${collaboratorToApprove.name}" (${recipient}) por email sobre a aprovação?`)) {
        window.open(`mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    }
  };

  const rejectCollaborator = (id: string) => {
    setCollaborators(prev => prev.filter(c => c.id !== id));
    showNotification("Registo pendente recusado e eliminado.", "success");
  };
  
  const deleteCollaborator = (id: string) => {
    const targetUser = collaborators.find(c => c.id === id);
    if (!targetUser) return;

    if (id === PRIMARY_ADMIN_ID) {
        showNotification('Não é possível eliminar a conta de administrador principal.', 'error');
        return;
    }
    
    if (targetUser.isAdmin) {
      const adminCount = collaborators.filter(c => c.isAdmin).length;
      if (adminCount <= 1) {
        showNotification('Não é possível eliminar o último administrador da aplicação.', 'error');
        return;
      }
    }
    
    setCollaborators(prev => prev.filter(c => c.id !== id));
    setInteractions(prev => prev.filter(i => i.collaboratorId !== id));
    showNotification(`Utilizador "${targetUser.name}" e todos os seus registos foram eliminados.`, 'success');
  };

  const requestPasswordReset = (email: string): { name: string; newPassword: string } | null => {
    const userToReset = collaborators.find(c => c.email.toLowerCase() === email.toLowerCase());
    if (!userToReset) {
      showNotification("Não foi encontrada nenhuma conta com este email.", "error");
      return null;
    }
    
    const newPassword = Math.random().toString(36).slice(-8);
    setCollaborators(prev =>
      prev.map(c => (c.id === userToReset.id ? { ...c, password: newPassword, mustChangePassword: true } : c))
    );

    showNotification(`Password para "${userToReset.name}" redefinida. Inicie sessão com a nova password.`, 'success');
    return { name: userToReset.name, newPassword };
  };

  const handleChangePassword = (newPassword: string) => {
    if (!currentCollaborator) return;

    const updatedCollaborator: Collaborator = {
      ...currentCollaborator,
      password: newPassword,
      mustChangePassword: false,
    };

    setCollaborators(prev =>
      prev.map(c => (c.id === currentCollaborator.id ? updatedCollaborator : c))
    );

    setCurrentCollaborator(updatedCollaborator);
    setIsChangingPassword(false);
    showNotification('A sua password foi alterada com sucesso.', 'success');
  };

  const toggleAdminStatus = (userId: string) => {
    const targetUser = collaborators.find(c => c.id === userId);
    if (!targetUser) return;

    if (userId === PRIMARY_ADMIN_ID) {
        showNotification('Não é possível remover os privilégios da conta de administrador principal.', 'error');
        return;
    }

    if (targetUser.isAdmin) {
        const adminCount = collaborators.filter(c => c.isAdmin).length;
        if (adminCount <= 1) {
          showNotification('Não é possível remover os privilégios do último administrador.', 'error');
          return;
        }
    }
    
    setCollaborators(prev => prev.map(c => (c.id === userId ? { ...c, isAdmin: !c.isAdmin } : c)));
    showNotification(`Permissões de ${targetUser.name} atualizadas.`, 'success');
  };

  const updateCollaboratorProfile = (id: string, newName: string, newEmail: string, newPass: string) => {
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      showNotification('Nome e email não podem estar em branco.', 'error');
      return;
    }
    
    if (collaborators.some(c => c.id !== id && c.name.toLowerCase() === trimmedName.toLowerCase())) {
      showNotification('Já existe um colaborador com este nome.', 'error');
      return;
    }

    if (collaborators.some(c => c.id !== id && c.email.toLowerCase() === trimmedEmail)) {
      showNotification('Este email já está a ser utilizado.', 'error');
      return;
    }

    setCollaborators(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updatedCollaborator = {
            ...c,
            name: trimmedName,
            email: trimmedEmail,
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
    showNotification('Perfil atualizado com sucesso.', 'success');
  };

  const addInteraction = (nationality: string, count: number, visitReason?: string, lengthOfStay?: string): string => {
    if (!currentCollaborator) return '';
    const newInteraction: Interaction = {
      id: `int_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      collaboratorId: currentCollaborator.id,
      nationality,
      count,
      timestamp: new Date().toISOString(),
      visitReason: visitReason && visitReason.trim() ? visitReason.trim() : undefined,
      lengthOfStay: lengthOfStay && lengthOfStay.trim() ? lengthOfStay.trim() : undefined,
    };
    setInteractions(prev => [newInteraction, ...prev]);
    showNotification(`Registo para ${count}x '${nationality}' adicionado.`, 'success', () => deleteInteraction(newInteraction.id, true));
    return newInteraction.id;
  };
  
  const updateInteraction = (updatedInteraction: Interaction) => {
    setInteractions(prev =>
      prev.map((i) => (i.id === updatedInteraction.id ? updatedInteraction : i))
    );
    showNotification("Registo atualizado.", 'success');
  };

  const deleteInteraction = (id: string, isUndo: boolean = false) => {
    setInteractions(prev => prev.filter((i) => i.id !== id));
    if (isUndo) {
        showNotification('Registo desfeito.', 'success');
    }
  };

  const resetCollaboratorInteractions = (collaboratorId: string) => {
    const user = collaborators.find(c => c.id === collaboratorId);
    setInteractions(prev => prev.filter(i => i.collaboratorId !== collaboratorId));
    if (user) {
        showNotification(`Todos os registos de "${user.name}" foram eliminados.`, 'success');
    }
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
            onChangePasswordClick={() => setIsChangingPassword(true)}
          />
        );
      case 'reports':
        return <Reports 
            allInteractions={interactions} 
            collaborators={collaborators} 
            showNotification={showNotification} 
            currentCollaborator={currentCollaborator}
            updateInteraction={updateInteraction}
        />;
      case 'admin':
        return (
          <Admin
            collaborators={collaborators}
            currentAdminId={currentCollaborator.id}
            onApprove={approveCollaborator}
            onReject={rejectCollaborator}
            onDelete={deleteCollaborator}
            onToggleAdmin={toggleAdminStatus}
            onResetInteractions={resetCollaboratorInteractions}
            onUpdateProfile={updateCollaboratorProfile}
          />
        );
      default:
        return <Login onLogin={handleLogin} addCollaborator={addCollaborator} requestPasswordReset={requestPasswordReset} collaborators={collaborators} />;
    }
  };

  return (
    <div className="bg-slate-100 min-h-screen text-slate-800 font-sans">
      <Notification notification={notification} onDismiss={() => setNotification(null)} />
      
      {isChangingPassword && currentCollaborator && (
        <ChangePasswordModal 
          onClose={() => setIsChangingPassword(false)}
          onSubmit={handleChangePassword}
        />
      )}

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
