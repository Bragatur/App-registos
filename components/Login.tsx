import React, { useState } from 'react';
import { Collaborator } from '../types';
import { UserPlusIcon, UsersIcon, TrashIcon } from './icons';

interface LoginProps {
  collaborators: Collaborator[];
  onLogin: (collaborator: Collaborator) => void;
  addCollaborator: (name: string) => Collaborator;
  deleteCollaborator: (id: string) => void;
}

const Login: React.FC<LoginProps> = ({ collaborators, onLogin, addCollaborator, deleteCollaborator }) => {
  const [newCollaboratorName, setNewCollaboratorName] = useState('');
  const [error, setError] = useState('');
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
    onLogin(newCollaborator);
  };
  
  const handleDelete = (e: React.MouseEvent, collab: Collaborator) => {
    e.stopPropagation(); // Prevent login when clicking delete
    if(window.confirm(`Tem a certeza que deseja eliminar o colaborador "${collab.name}"? Todos os seus registos serão apagados.`)) {
      deleteCollaborator(collab.id);
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900">Bem-vindo ao Posto de Turismo</h1>
            <p className="mt-4 text-lg text-slate-600">Selecione o seu utilizador para começar a registar atendimentos.</p>
        </div>

        <div className="w-full bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
            <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center"><UsersIcon className="w-7 h-7 mr-3 text-blue-600" /> Selecionar Utilizador</h2>
            {collaborators.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {collaborators.map((collab) => (
                        <div key={collab.id} className="group flex items-center gap-2">
                            <button
                                onClick={() => onLogin(collab)}
                                className="flex-grow text-left bg-slate-100 hover:bg-blue-100 text-slate-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
                            >
                                {collab.name}
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, collab)}
                                className="p-2 rounded-full text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                                title={`Eliminar ${collab.name}`}
                            >
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-slate-500 text-center py-4">Nenhum colaborador encontrado. Crie um novo para começar.</p>
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
                                }}
                                placeholder="Nome do novo colaborador"
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex items-center gap-3">
                                <button
                                    type="submit"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center disabled:bg-green-300"
                                    disabled={!newCollaboratorName.trim()}
                                >
                                    Criar e Iniciar Sessão
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setError(''); }}
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
                            Não encontra o seu nome? Crie um novo utilizador.
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Login;