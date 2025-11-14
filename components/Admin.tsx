import React from 'react';
import { Collaborator } from '../types';
import { UsersIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from './icons';

interface AdminProps {
  collaborators: Collaborator[];
  currentAdminId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}

const Admin: React.FC<AdminProps> = ({ collaborators, currentAdminId, onApprove, onReject, onDelete }) => {
  
  const pendingCollaborators = collaborators.filter(c => c.status === 'pendente');
  const approvedCollaborators = collaborators.filter(c => c.status === 'aprovado');

  const handleDelete = (collab: Collaborator) => {
    if (window.confirm(`Tem a certeza que deseja eliminar permanentemente o utilizador "${collab.name}" e todos os seus registos?`)) {
      onDelete(collab.id);
    }
  };

  const handleReject = (collab: Collaborator) => {
    if (window.confirm(`Tem a certeza que deseja recusar e eliminar o registo pendente de "${collab.name}"?`)) {
      onReject(collab.id);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-3xl font-bold text-slate-800">Painel de Administração</h2>

      {/* Pending Registrations */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold mb-4 text-slate-800">Registos Pendentes ({pendingCollaborators.length})</h3>
        {pendingCollaborators.length > 0 ? (
          <ul className="divide-y divide-slate-200">
            {pendingCollaborators.map(collab => (
              <li key={collab.id} className="flex items-center justify-between py-3">
                <span className="font-medium text-slate-700">{collab.name}</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onApprove(collab.id)}
                    className="flex items-center gap-1.5 bg-green-100 text-green-700 hover:bg-green-200 font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                    title="Aprovar"
                  >
                    <CheckCircleIcon className="w-4 h-4" /> Aprovar
                  </button>
                  <button 
                    onClick={() => handleReject(collab)}
                    className="flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 font-semibold py-1.5 px-3 rounded-md transition-colors text-sm"
                    title="Recusar"
                  >
                    <XCircleIcon className="w-4 h-4" /> Recusar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">Não há registos pendentes de aprovação.</p>
        )}
      </div>

      {/* Approved Users */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
        <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
            <UsersIcon className="w-6 h-6 mr-3 text-blue-600"/>
            Utilizadores Aprovados ({approvedCollaborators.length})
        </h3>
        <ul className="divide-y divide-slate-200">
          {approvedCollaborators.map(collab => (
            <li key={collab.id} className="flex items-center justify-between py-3">
              <div>
                <span className="font-medium text-slate-700">{collab.name}</span>
                {collab.isAdmin && <span className="ml-2 text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">Admin</span>}
              </div>
              <div>
                {collab.id !== currentAdminId && (
                   <button 
                    onClick={() => handleDelete(collab)}
                    className="flex items-center gap-1.5 text-red-600 hover:bg-red-100 font-semibold p-2 rounded-md transition-colors text-sm"
                    title={`Eliminar ${collab.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                    <span>Eliminar Utilizador</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Admin;