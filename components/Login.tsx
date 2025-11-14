import React, { useState } from 'react';
import { Collaborator } from '../types';
import { UserPlusIcon, LogInIcon } from './icons';

interface LoginProps {
  onLogin: (name: string, password: string) => { success: boolean; message: string };
  addCollaborator: (name: string, password: string) => { success: boolean; message: string; collaborator?: Collaborator };
}

const Login: React.FC<LoginProps> = ({ onLogin, addCollaborator }) => {
  const [isCreating, setIsCreating] = useState(false);
  
  // Login State
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Creation State
  const [createName, setCreateName] = useState('');
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
    
    if (!createName.trim() || !createPassword) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    if (createPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    
    const result = addCollaborator(createName, createPassword);

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

  return (
    <div className="max-w-md mx-auto flex flex-col items-center justify-center min-h-[80vh] p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Posto de Turismo</h1>
        <p className="mt-3 text-lg text-slate-600">
          {isCreating ? 'Crie uma nova conta para começar.' : 'Inicie sessão para continuar.'}
        </p>
      </div>

      <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {infoMessage && <div className="mb-4 p-3 bg-blue-100 text-blue-800 rounded-lg text-center">{infoMessage}</div>}
        {error && <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg text-center">{error}</div>}

        {isCreating ? (
          // --- REGISTRATION FORM ---
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center mb-6"><UserPlusIcon className="w-7 h-7 mr-3"/> Criar Conta</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="create-name">Nome Completo</label>
              <input id="create-name" type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required autoFocus/>
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
              <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="login-password">Password</label>
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
    </div>
  );
};

export default Login;