import React, { useState } from 'react';
import { Collaborator } from '../types';
import { UserPlusIcon, LogInIcon, MailIcon } from './icons';

interface PasswordRecoveryModalProps {
  onClose: () => void;
  onRecover: (email: string) => { success: boolean; message: string };
}

const PasswordRecoveryModal: React.FC<PasswordRecoveryModalProps> = ({ onClose, onRecover }) => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        const result = onRecover(email);
        setMessage(result.message);
        setIsSuccess(result.success);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-800">Recuperar Password</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>
                {message && (
                  <div className={`p-3 rounded-lg text-center ${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {message}
                  </div>
                )}
                {!isSuccess && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm text-slate-600">Introduza o seu email de registo. Se for encontrado, uma nova password temporária será gerada e mostrada aqui.</p>
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
                )}
            </div>
        </div>
    );
};


interface LoginProps {
  onLogin: (name: string, password: string) => { success: boolean; message: string };
  addCollaborator: (name: string, password: string, email: string) => { success: boolean; message: string; collaborator?: Collaborator };
  requestPasswordReset: (email: string) => { success: boolean; message: string };
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
  
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginName || !loginPassword) {
      setError('Por favor, preencha o nome de utilizador e a password.');
      return;
    }
    const result = onLogin(loginName, loginPassword);
    if (!result.success) {
      setError(result.message);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    
    if (!createName.trim() || !createEmail.trim() || !createPassword) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (createPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    
    const result = addCollaborator(createName, createPassword, createEmail);

    if (!result.success) {
        setError(result.message);
    } else {
        setInfoMessage('Registo efetuado. A sua conta aguarda aprovação de um administrador.');
        setIsCreating(false);
        resetCreateForm();
    }
  };
  
  const resetCreateForm = () => {
    setCreateName('');
    setCreateEmail('');
    setCreatePassword('');
    setConfirmPassword('');
  }

  const toggleView = () => {
    setIsCreating(!isCreating);
    setError('');
    setInfoMessage('');
    setLoginName('');
    setLoginPassword('');
    resetCreateForm();
  }
  
  const approvedUsers = collaborators.filter(c => c.status === 'aprovado');

  return (
    <>
      {isRecovering && <PasswordRecoveryModal onClose={() => setIsRecovering(false)} onRecover={requestPasswordReset} />}
      <div className="flex flex-col items-center justify-center min-h-[90vh] p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Posto de Turismo</h1>
          <p className="mt-3 text-lg text-slate-600">
            {isCreating ? 'Crie uma nova conta para começar.' : 'Inicie sessão para continuar.'}
          </p>
        </div>
        
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">

          <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            {infoMessage && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-center">{infoMessage}</div>}
            {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">{error}</div>}

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
          
           <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
             <h2 className="text-2xl font-bold text-slate-800 mb-6">Utilizadores Aprovados</h2>
             {approvedUsers.length > 0 ? (
                <ul className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
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
                <p className="text-slate-500">Não existem utilizadores aprovados.</p>
             )}
           </div>
        </div>

      </div>
    </>
  );
};

export default Login;