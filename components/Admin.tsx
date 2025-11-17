

import React, { useState, useRef } from 'react';
import { Collaborator, PRIMARY_ADMIN_ID } from '../types';
import { UsersIcon, CheckCircleIcon, XCircleIcon, CogIcon, ShieldCheckIcon, TrashIcon, RotateCcwIcon, AlertTriangleIcon } from './icons';

interface ManageUserModalProps {
  user: Collaborator;
  isSelf: boolean;
  onClose: () => void;
  onUpdateProfile: (id: string, newName: string, newPass: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onDelete: (id: string) => void;
  onToggleAdmin: (id: string) => void;
  onResetInteractions: (id: string) => void;
}

const ManageUserModal: React.FC<ManageUserModalProps> = ({ user, isSelf, onClose, onUpdateProfile, onResetPassword, onDelete, onToggleAdmin, onResetInteractions }) => {
  const [newName, setNewName] = useState(user.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmClass: string;
  } | null>(null);
  
  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword !== confirmPassword) {
      setError('As passwords não coincidem ou estão em branco.');
      return;
    }
    onResetPassword(user.id, newPassword);
    onClose();
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
     if (newName.trim() === '') {
      setError('O nome de utilizador não pode estar em branco.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    onUpdateProfile(user.id, newName, newPassword);
    onClose();
  }

  const handleDeleteUser = () => {
    setConfirmation({
      message: `Tem a certeza que deseja eliminar permanentemente o utilizador "${user.name}"? TODOS os seus registos serão apagados. Esta ação é irreversível.`,
      onConfirm: () => {
        onDelete(user.id);
        onClose();
      },
      confirmText: 'Sim, Eliminar',
      confirmClass: 'bg-red-600 hover:bg-red-700'
    });
  }

  const handleToggleAdmin = () => {
    onToggleAdmin(user.id);
    onClose();
  }
  
  const handleResetInteractions = () => {
    setConfirmation({
      message: `Tem a certeza que deseja eliminar TODOS os registos de atendimento de "${user.name}"? Esta ação é irreversível.`,
      onConfirm: () => {
        onResetInteractions(user.id);
        onClose();
      },
      confirmText: 'Sim, Eliminar Registos',
      confirmClass: 'bg-amber-500 hover:bg-amber-600'
    });
  }

  if (isSelf) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-xl font-bold text-slate-800">Editar o Meu Perfil</h3>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="self-name">Nome de Utilizador</label>
              <input id="self-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="self-pass">Nova Password (deixar em branco para não alterar)</label>
              <input id="self-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="self-confirm">Confirmar Nova Password</label>
              <input id="self-confirm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg">Cancelar</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg">Guardar Alterações</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      {confirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={() => setConfirmation(null)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-slate-800 flex items-center">
                  <AlertTriangleIcon className="w-6 h-6 mr-3 text-red-500"/>
                  Confirmação Necessária
              </h3>
              <p className="text-slate-600">{confirmation.message}</p>
              <div className="flex justify-end gap-3 pt-4 border-t">
                  <button onClick={() => setConfirmation(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg">
                      Cancelar
                  </button>
                  <button
                      onClick={() => {
                          confirmation.onConfirm();
                          setConfirmation(null);
                      }}
                      className={`text-white font-semibold px-4 py-2 rounded-lg ${confirmation.confirmClass}`}
                  >
                      {confirmation.confirmText}
                  </button>
              </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
          <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-slate-800">Gerir Utilizador: <span className="text-blue-600">{user.name}</span></h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
          </div>
          
          <form onSubmit={handlePasswordReset} className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-slate-700">Redefinir Password</h4>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="new-pass">Nova Password</label>
              <input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="confirm-pass">Confirmar Nova Password</label>
              <input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="••••••••" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Redefinir Password</button>
          </form>

          {user.id !== PRIMARY_ADMIN_ID && (
            <>
              <div className="space-y-3 border-t pt-4">
                <h4 className="font-semibold text-slate-700">Permissões</h4>
                <div className="flex items-center justify-between">
                  <p>Estatuto: <span className={`font-bold ${user.isAdmin ? 'text-blue-600' : 'text-slate-600'}`}>{user.isAdmin ? 'Administrador' : 'Utilizador'}</span></p>
                  <button 
                    onClick={handleToggleAdmin}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <ShieldCheckIcon className="w-5 h-5" />
                    {user.isAdmin ? 'Remover Admin' : 'Promover a Admin'}
                  </button>
                </div>
              </div>

              <div className="space-y-3 border-t border-red-300 pt-4 bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">Zona de Perigo</h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleResetInteractions}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    <RotateCcwIcon className="w-5 h-5"/> Eliminar Registos
                  </button>
                  <button
                    onClick={handleDeleteUser}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                   <TrashIcon className="w-5 h-5" /> Eliminar Utilizador
                  </button>
                </div>
                <p className="text-xs text-red-600 mt-2">Estas ações são irreversíveis.</p>
              </div>
            </>
          )}
          
          <div className="text-right border-t pt-4">
            <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg transition-colors">Fechar</button>
          </div>
        </div>
      </div>
    </>
  );
};


interface AdminProps {
  collaborators: Collaborator[];
  currentAdminId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAdmin: (id: string) => void;
  onResetInteractions: (id: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onUpdateProfile: (id: string, newName: string, newPass: string) => void;
}

const Admin: React.FC<AdminProps> = ({ 
  collaborators, 
  currentAdminId, 
  onApprove, 
  onReject, 
  onDelete,
  onToggleAdmin,
  onResetInteractions,
  onResetPassword, 
  onUpdateProfile, 
}) => {
  const [managingUser, setManagingUser] = useState<Collaborator | null>(null);

  const pendingCollaborators = collaborators.filter(c => c.status === 'pendente');
  const approvedCollaborators = collaborators.filter(c => c.status === 'aprovado');

  const handleReject = (collab: Collaborator) => {
    if (window.confirm(`Tem a certeza que deseja recusar e eliminar o registo pendente de "${collab.name}"?`)) {
      onReject(collab.id);
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-8">
        <h2 className="text-3xl font-bold text-slate-800">Painel de Administração</h2>

        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-xl font-bold mb-4 text-slate-800">Registos Pendentes ({pendingCollaborators.length})</h3>
          {pendingCollaborators.length > 0 ? (
            <ul className="divide-y divide-slate-200">
              {pendingCollaborators.map(collab => (
                <li key={collab.id} className="flex items-center justify-between py-3 flex-wrap gap-2">
                  <div>
                    <span className="font-medium text-slate-700">{collab.name}</span>
                    <span className="block text-sm text-slate-500">{collab.email}</span>
                  </div>
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
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
          <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
              <UsersIcon className="w-6 h-6 mr-3 text-blue-600"/>
              Utilizadores Aprovados ({approvedCollaborators.length})
          </h3>
          <ul className="divide-y divide-slate-200">
            {approvedCollaborators.map(collab => (
              <li key={collab.id} className="flex items-center justify-between py-3 flex-wrap gap-2">
                <div>
                  <span className="font-medium text-slate-700">{collab.name}</span>
                  <span className="block text-sm text-slate-500">{collab.email}</span>
                  {collab.isAdmin && <span className="ml-2 text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full">Admin</span>}
                  {collab.id === currentAdminId && <span className="ml-2 text-xs font-bold text-white bg-green-600 px-2 py-0.5 rounded-full">Você</span>}
                </div>
                <div>
                  <button 
                    onClick={() => setManagingUser(collab)}
                    className="flex items-center gap-1.5 text-slate-600 hover:bg-slate-200 font-semibold p-2 rounded-md transition-colors text-sm"
                    title={`Gerir ${collab.name}`}
                  >
                    <CogIcon className="w-4 h-4" />
                    <span>Gerir</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {managingUser && (
        <ManageUserModal 
          user={managingUser}
          isSelf={managingUser.id === currentAdminId}
          onClose={() => setManagingUser(null)}
          onResetPassword={onResetPassword}
          onUpdateProfile={onUpdateProfile}
          onDelete={onDelete}
          onToggleAdmin={onToggleAdmin}
          onResetInteractions={onResetInteractions}
        />
      )}
    </>
  );
};

export default Admin;