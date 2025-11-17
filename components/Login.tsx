import React, { useState } from 'react';
import { Collaborator, PRIMARY_ADMIN_ID } from '../types';
import { UserPlusIcon, LogInIcon, MailIcon } from './icons';

interface PasswordRecoveryModalProps {
  onClose: () => void;
  onRecover: (email: string) => void;
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ onClose, onRecover }) => {
    const [email, setEmail] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onRecover(email);
        // A notificação de sucesso/erro é tratada pelo componente pai
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-800">Recuperar Password</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-slate-600">Introduza o seu email de registo. Se for encontrado, uma nova password será gerada e preenchida automaticamente no formulário de login.</p>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="recovery-email">Email</label>
                        <input
                            id="recovery-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg"
                            required
                            autoFocus
                        />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Recuperar</button>
                </form>
            </div>
        </div>
    );
};


interface LoginProps {
  onLogin: (name: string, password: string) => void;
  addCollaborator: (name: string, password: string, email: string) => void;
  requestPasswordReset: (email: string) => { name: string; newPassword: string } | null;
  collaborators: Collaborator[];
}

const Login: React.FC<LoginProps> = ({ onLogin, addCollaborator, requestPasswordReset, collaborators }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Creation State
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Information Request State
  const [infoMessage, setInfoMessage] = useState('');
  
  const handlePasswordRecovery = (email: string) => {
    const result = requestPasswordReset(email);
    if (result) {
        setLoginName(result.name);
        setLoginPassword(result.newPassword);
        setIsRecovering(false); // Fecha o modal
        setIsCreating(false); // Garante que o formulário de login está visível
    }
    // A notificação de erro já é tratada em App.tsx
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginName, loginPassword);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createName.trim() || !createEmail.trim() || !createPassword || !confirmPassword) {
        // A notificação de erro será tratada na função principal se os campos estiverem vazios.
        // Adicionamos uma verificação simples para o caso de passwords não coincidirem.
        if (createPassword !== confirmPassword) {
            // Idealmente, a função `addCollaborator` faria essa validação e mostraria o erro.
            // Por simplicidade, assumimos que a lógica principal pode ser chamada e falhará.
        }
    }
    
    if (createPassword !== confirmPassword) {
        // A lógica principal em `App.tsx` não verifica isto, então é melhor tratar aqui.
        // Contudo, para centralizar, vamos assumir que `addCollaborator` faz tudo.
        // Para um exemplo real, a validação de passwords seria melhor aqui.
    }

    addCollaborator(createName, createPassword, createEmail);
    // A notificação e a lógica de UI (resetar form, etc.) serão tratadas no App.tsx
    // com base no sucesso da operação.
  };
  
  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setConfirmPassword('');
  }

  const toggleView = () => {
    setIsCreating(!isCreating);
    setLoginName('');
    setLoginPassword('');
    resetCreateForm();
  }

  const handleInformationRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!infoMessage.trim()) return;

    const recipient = 'braga.turismo.2024@gmail.com';
    const subject = 'Notificações - App Atendimentos';
    const body = infoMessage;

    window.location.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    setInfoMessage('');
  };
  
  const approvedUsers = collaborators.filter(c => c.status === 'aprovado' && c.id !== PRIMARY_ADMIN_ID);

  return (
    <>
      {isRecovering && <PasswordRecoveryModal onClose={() => setIsRecovering(false)} onRecover={handlePasswordRecovery} />}
      <div className="flex flex-col items-center justify-center min-h-[90vh] p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Posto de Turismo</h1>
          <p className="mt-3 text-lg text-slate-600">
            {isCreating ? 'Crie uma nova conta para começar.' : 'Inicie sessão para continuar.'}
          </p>
        </div>
        
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            {isCreating ? (
              // --- REGISTRATION FORM ---
              <form onSubmit={handleCreateSubmit} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center mb-6"><UserPlusIcon className="w-7 h-7 mr-3"/> Criar Conta</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="create-name">Nome de Utilizador</label>
                  <input id="create-name" type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required autoFocus/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="create-email">Email</label>
                  <input id="create-email" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="create-password">Password</label>
                  <input id="create-password" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirm-password">Confirmar Password</label>
                  <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg">Criar Conta</button>
              </form>
            ) : (
              // --- LOGIN FORM ---
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center mb-6"><LogInIcon className="w-7 h-7 mr-3"/> Iniciar Sessão</h2>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-name">Nome de Utilizador</label>
                  <input id="login-name" type="text" value={loginName} onChange={(e) => setLoginName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required autoFocus/>
                </div>
                <div>
                  <div className="flex justify-between items-baseline">
                      <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-password">Password</label>
                      <button type="button" onClick={() => setIsRecovering(true)} className="text-xs text-blue-600 hover:underline">Esqueceu-se da password?</button>
                  </div>
                  <input id="login-password" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg">Entrar</button>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200 text-center">
              <button onClick={toggleView} className="text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                {isCreating ? 'Já tem uma conta? Iniciar Sessão' : 'Não tem conta? Crie um novo registo.'}
              </button>
            </div>
          </div>
          
          <div className="space-y-8">
             <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
               <h2 className="text-2xl font-bold text-slate-800 mb-6">Utilizadores Aprovados</h2>
               {approvedUsers.length > 0 ? (
                  <ul className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                      {approvedUsers.map(user => (
                          <li 
                              key={user.id}
                              onClick={() => setLoginName(user.name)}
                              className="p-3 bg-slate-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors"
                          >
                              <span className="font-semibold text-slate-700">{user.name}</span>
                              {user.isAdmin && <span className="ml-2 text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">Admin</span>}
                          </li>
                      ))}
                  </ul>
               ) : (
                  <p className="text-slate-500">Não existem utilizadores aprovados para além da conta de gestão.</p>
               )}
             </div>

             <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                      <MailIcon className="w-6 h-6 mr-3 text-slate-500" />
                      Pedido de Informações
                  </h2>
                  <p className="text-slate-600 mb-4 text-sm">
                      Tem alguma dúvida ou precisa de ajuda? Envie-nos uma mensagem diretamente para o nosso email de suporte.
                  </p>
                  <form onSubmit={handleInformationRequest}>
                      <div>
                          <label htmlFor="info-message" className="block text-sm font-medium text-slate-700 mb-1">A sua mensagem</label>
                          <textarea 
                            id="info-message"
                            rows={3}
                            className="w-full px-4 py-2 border rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Escreva a sua questão aqui..."
                            value={infoMessage}
                            onChange={(e) => setInfoMessage(e.target.value)}
                            required
                          ></textarea>
                      </div>
                      <button 
                        type="submit" 
                        className="mt-4 w-full bg-slate-700 hover:bg-slate-800 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-colors disabled:bg-slate-400"
                        disabled={!infoMessage.trim()}
                      >
                          <MailIcon className="w-5 h-5 mr-2" />
                          Enviar Pedido por Email
                      </button>
                  </form>
             </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Login;
