import React, { useState } from 'react';
import { Collaborator } from '../types';
import { UsersIcon, CheckCircleIcon, XCircleIcon, CogIcon } from './icons';

interface ManageUserModalProps {
  user: Collaborator;
  isSelf: boolean;
  onClose: () => void;
  onUpdateProfile: (id: string, newName: string, newPass: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onToggleAdmin: (id: string) => void;
  onDelete: (id: string) => void;
}

const ManageUserModal: React.FC<ManageUserModalProps> = ({ user, isSelf, onClose, onUpdateProfile, onResetPassword, onToggleAdmin, onDelete }) => {
  const [newName, setNewName] = useState(user.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handlePasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newPassword || newPassword !== confirmPassword) {
      setError('As passwords não coincidem ou estão em branco.');
      return;
    }
    if (isSelf) {
      onUpdateProfile(user.id, newName, newPassword);
      alert(`O seu perfil foi atualizado com sucesso.`);
    } else {
      onResetPassword(user.id, newPassword);
      alert(`Password para ${user.name} foi redefinida com sucesso.`);
    }
    onClose();
  };
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    onUpdateProfile(user.id, newName, newPassword);
    alert('O seu perfil foi atualizado com sucesso.');
    onClose();
  }

  const handleToggleAdmin = () => {
    const action = user.isAdmin ? 'remover os privilégios de administrador de' : 'promover a administrador o utilizador';
    if (window.confirm(`Tem a certeza que deseja ${action} ${user.name}?`)) {
        onToggleAdmin(user.id);
        onClose();
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Tem a certeza que deseja eliminar permanentemente o utilizador "${user.name}" e todos os seus registos?`)) {
      onDelete(user.id);
      onClose();
    }
  };

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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg space-y-6 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
            <h3 className="text-xl font-bold text-slate-800">Gerir Utilizador: <span className="text-blue-600">{user.name}</span></h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        
        {/* Reset Password */}
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

        {/* Admin Actions */}
        <div className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-slate-700">Permissões</h4>
             <button onClick={handleToggleAdmin} className="w-full text-left bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-semibold px-4 py-3 rounded-lg transition-colors">
                {user.isAdmin ? 'Remover Privilégios de Administrador' : 'Promover a Administrador'}
             </button>
        </div>

        {/* Delete Action */}
        <div className="space-y-3 border-t pt-4">
             <h4 className="font-semibold text-red-700">Zona de Perigo</h4>
             <button onClick={handleDelete} className="w-full text-left bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors">
                Eliminar Utilizador Permanentemente
             </button>
        </div>

        <div className="text-right border-t pt-4">
          <button onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg transition-colors">Fechar</button>
        </div>
      </div>
    </div>
  );
};


interface AdminProps {
  collaborators: Collaborator[];
  currentAdminId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onResetPassword: (id: string, newPass: string) => void;
  onToggleAdmin: (id: string) => void;
  onUpdateProfile: (id: string, newName: string, newPass: string) => void;
}

const Admin: React.FC<AdminProps> = ({ collaborators, currentAdminId, onApprove, onReject, onDelete, onResetPassword, onToggleAdmin, onUpdateProfile }) => {
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

        {/* Pending Registrations */}
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

        {/* Approved Users */}
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
          onToggleAdmin={onToggleAdmin}
          onDelete={onDelete}
          onUpdateProfile={onUpdateProfile}
        />
      )}
    </>
  );
};

export default Admin;