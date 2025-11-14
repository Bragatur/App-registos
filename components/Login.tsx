import React, { useState } from 'react';
import { Collaborator } from '../types';
import { UserPlusIcon, UsersIcon } from './icons';

interface LoginProps {
  collaborators: Collaborator[];
  onLogin: (collaborator: Collaborator) => void;
  addCollaborator: (name: string) => Collaborator;
}

const Login: React.FC<LoginProps> = ({ collaborators, onLogin, addCollaborator }) => {
  const [newCollaboratorName, setNewCollaboratorName] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCollaboratorName.trim() === '') {
      setError('O nome não pode estar em branco.');
      return;
    }
    if (collaborators.some(c => c.name.toLowerCase() === newCollaboratorName.toLowerCase().trim())) {
      setError('Já existe um colaborador com este nome.');
      return;
    }
    const newCollaborator = addCollaborator(newCollaboratorName.trim());
    
    // If it's the first user (admin), log them in directly
    if (newCollaborator.status === 'aprovado') {
        onLogin(newCollaborator);
    } else {
        // Otherwise, show pending message
        setNewCollaboratorName('');
        setError('');
        setIsCreating(false);
        setInfoMessage('Registo efetuado. A sua conta aguarda aprovação de um administrador.');
    }
  };
  
  const handleSelectUser = (collab: Collaborator) => {
    if (collab.status === 'pendente') {
      setError(`A conta "${collab.name}" aguarda aprovação de um administrador.`);
      setInfoMessage('');
      return;
    }
    setError('');
    setInfoMessage('');
    onLogin(collab);
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Bem-vindo ao Posto de Turismo</h1>
            <p className="mt-4 text-lg text-slate-600">Selecione o seu utilizador para começar a registar atendimentos.</p>
        </div>

        <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            {infoMessage && (
                <div className="mb-4 p-3 bg-blue-100 border border-blue-200 text-blue-800 rounded-lg text-center">
                    {infoMessage}
                </div>
            )}
             {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-200 text-red-800 rounded-lg text-center">
                    {error}
                </div>
            )}

            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center"><UsersIcon className="w-7 h-7 mr-3 text-blue-600" /> Selecionar Utilizador</h2>
            {collaborators.filter(c => c.status === 'aprovado').length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {collaborators.filter(c => c.status === 'aprovado').map((collab) => (
                        <div key={collab.id} className="group flex items-center gap-2">
                            <button
                                onClick={() => handleSelectUser(collab)}
                                className="w-full text-left bg-slate-100 hover:bg-blue-100 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                            >
                                {collab.name}
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-slate-500 text-center py-4">Nenhum utilizador aprovado. Crie o primeiro para se tornar administrador.</p>
            )}
             {collaborators.filter(c => c.status === 'pendente').length > 0 && (
                <div className="mt-4 text-sm text-center text-slate-500">
                    Existem utilizadores a aguardar aprovação. Aceda como administrador para os gerir.
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-slate-200">
                {isCreating ? (
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center"><UserPlusIcon className="w-6 h-6 mr-3 text-green-600" /> Criar Novo Utilizador</h3>
                        <form onSubmit={handleCreateCollaborator} className="space-y-4">
                            <input
                                type="text"
                                value={newCollaboratorName}
                                onChange={(e) => {
                                    setNewCollaboratorName(e.target.value);
                                    setError('');
                                    setInfoMessage('');
                                }}
                                placeholder="O seu nome completo"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                autoFocus
                            />
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:bg-green-300"
                                    disabled={!newCollaboratorName.trim()}
                                >
                                    Criar Conta
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setError(''); setInfoMessage(''); }}
                                    className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-3 px-4 rounded-lg transition-colors duration-200"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="text-center">
                        <button 
                            onClick={() => setIsCreating(true)}
                            className="text-blue-600 hover:text-blue-800 font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            Não tem conta? Crie um novo registo.
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Login;