


import React, { useState, useRef } from 'react';
import { Collaborator, PRIMARY_ADMIN_ID, Interaction } from '../types';
import { UsersIcon, CheckCircleIcon, XCircleIcon, CogIcon, ShieldCheckIcon, TrashIcon, RotateCcwIcon, AlertTriangleIcon, FileSpreadsheetIcon } from './icons';
import { ORDERED_NATIONALITIES_FOR_EXPORT } from '../constants';

// Declaração para a biblioteca XLSX carregada via CDN
declare const XLSX: any;

interface ManageUserModalProps {
  user: Collaborator;
  isSelf: boolean;
  onClose: () => void;
  onUpdateProfile: (id: string, newName: string, newEmail: string, newPass: string) => void;
  onDelete: (id: string) => void;
  onToggleAdmin: (id: string) => void;
  onResetInteractions: (id: string) => void;
}

const ManageUserModal: React.FC<ManageUserModalProps> = ({ user, isSelf, onClose, onUpdateProfile, onDelete, onToggleAdmin, onResetInteractions }) => {
  const [newName, setNewName] = useState(user.name);
  const [newEmail, setNewEmail] = useState(user.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<{
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmClass: string;
  } | null>(null);
  
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newName.trim() === '' || newEmail.trim() === '') {
      setError('Nome e email não podem estar em branco.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError('As passwords não coincidem.');
      return;
    }
    onUpdateProfile(user.id, newName, newEmail, newPassword);
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
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="self-email">Email</label>
              <input id="self-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
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
          
          <form onSubmit={handleProfileUpdate} className="space-y-3 border-t pt-4">
            <h4 className="font-semibold text-slate-700">Editar Perfil</h4>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="edit-name">Nome de Utilizador</label>
              <input id="edit-name" type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="edit-email">Email</label>
              <input id="edit-email" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="new-pass">Nova Password (deixar em branco para não alterar)</label>
              <input id="new-pass" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="••••••••" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1" htmlFor="confirm-pass">Confirmar Nova Password</label>
              <input id="confirm-pass" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="••••••••" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Guardar Alterações</button>
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
  allInteractions: Interaction[];
  collaborators: Collaborator[];
  currentAdminId: string;
  showNotification: (message: React.ReactNode, type: 'success' | 'error') => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleAdmin: (id: string) => void;
  onResetInteractions: (id: string) => void;
  onUpdateProfile: (id: string, newName: string, newEmail: string, newPass: string) => void;
  onClearAllInteractions: () => void;
}

const Admin: React.FC<AdminProps> = ({ 
  allInteractions,
  collaborators, 
  currentAdminId,
  showNotification,
  onApprove, 
  onReject, 
  onDelete,
  onToggleAdmin,
  onResetInteractions,
  onUpdateProfile, 
  onClearAllInteractions,
}) => {
  const [managingUser, setManagingUser] = useState<Collaborator | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [globalConfirmation, setGlobalConfirmation] = useState<{
    message: string;
    onConfirm: () => void;
    confirmText: string;
    confirmClass: string;
  } | null>(null);

  const pendingCollaborators = collaborators.filter(c => c.status === 'pendente');
  const approvedCollaborators = collaborators.filter(c => c.status === 'aprovado');

  const handleReject = (collab: Collaborator) => {
    if (window.confirm(`Tem a certeza que deseja recusar e eliminar o registo pendente de "${collab.name}"?`)) {
      onReject(collab.id);
    }
  };

  const handleClearAllInteractions = () => {
    setGlobalConfirmation({
      message: 'Tem a certeza que deseja eliminar PERMANENTEMENTE TODOS os registos de atendimento de TODOS os utilizadores? Esta ação é irreversível.',
      onConfirm: () => {
        onClearAllInteractions();
        setGlobalConfirmation(null);
      },
      confirmText: 'Sim, Eliminar Tudo',
      confirmClass: 'bg-red-600 hover:bg-red-700'
    });
  };
  
  const handleExportCollaboratorTotals = () => {
    setIsExporting(true);
    showNotification('A preparar o seu relatório Excel...', 'success');

    try {
        const usersToReport = collaborators.filter(c => c.status === 'aprovado' && c.id !== PRIMARY_ADMIN_ID);
        if (usersToReport.length === 0) {
            showNotification('Não existem utilizadores para gerar o relatório.', 'error');
            setIsExporting(false);
            return;
        }

        const wb = XLSX.utils.book_new();

        usersToReport.forEach(user => {
            const userInteractions = allInteractions.filter(i => i.collaboratorId === user.id);
            if (userInteractions.length === 0) {
                const ws = XLSX.utils.aoa_to_sheet([[`Utilizador ${user.name} não tem registos.`]]);
                XLSX.utils.book_append_sheet(wb, ws, user.name.substring(0, 31));
                return;
            }

            const dataByMonth: { [monthYear: string]: { [nat: string]: number } } = {};
            const allNationalities = new Set<string>();

            userInteractions.forEach(interaction => {
                const date = new Date(interaction.timestamp);
                const month = date.toLocaleString('pt-PT', { month: 'short' });
                const year = date.getFullYear();
                const monthYearKey = `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
                
                if (!dataByMonth[monthYearKey]) dataByMonth[monthYearKey] = {};
                
                const currentCount = dataByMonth[monthYearKey][interaction.nationality] || 0;
                dataByMonth[monthYearKey][interaction.nationality] = currentCount + (interaction.count || 1);
                allNationalities.add(interaction.nationality);
            });

            const orderedSet = new Set(ORDERED_NATIONALITIES_FOR_EXPORT);
            const orderedNatsInReport: string[] = [];
            const otherNats: string[] = [];

            allNationalities.forEach(nat => {
                if (!orderedSet.has(nat)) {
                    otherNats.push(nat);
                }
            });

            ORDERED_NATIONALITIES_FOR_EXPORT.forEach(orderedNat => {
                if (allNationalities.has(orderedNat)) {
                    orderedNatsInReport.push(orderedNat);
                }
            });
            
            const monthOrder = ['Jan.', 'Fev.', 'Mar.', 'Abr.', 'Mai.', 'Jun.', 'Jul.', 'Ago.', 'Set.', 'Out.', 'Nov.', 'Dez.'];
            
            const sortedMonthYears = Object.keys(dataByMonth).sort((a, b) => {
                const [monthA, yearA] = a.split(' ');
                const [monthB, yearB] = b.split(' ');
                if (parseInt(yearA) !== parseInt(yearB)) return parseInt(yearA) - parseInt(yearB);
                return monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB);
            });

            const sheetData: (string | number)[][] = [];
            const header = ['Nacionalidade', ...sortedMonthYears, 'Total'];
            sheetData.push(header);

            orderedNatsInReport.forEach(nat => {
                const row: (string | number)[] = [nat];
                let rowTotal = 0;
                sortedMonthYears.forEach(my => {
                    const count = dataByMonth[my]?.[nat] || 0;
                    row.push(count);
                    rowTotal += count;
                });
                row.push(rowTotal);
                sheetData.push(row);
            });

            if (otherNats.length > 0) {
                const outrosRow: (string | number)[] = ['Outros'];
                let outrosRowTotal = 0;
                sortedMonthYears.forEach(my => {
                    const outrosMonthTotal = otherNats.reduce((sum, nat) => sum + (dataByMonth[my]?.[nat] || 0), 0);
                    outrosRow.push(outrosMonthTotal);
                    outrosRowTotal += outrosMonthTotal;
                });
                outrosRow.push(outrosRowTotal);
                sheetData.push(outrosRow);
            }

            const footer: (string | number)[] = ['Total'];
            let grandTotal = 0;
            sortedMonthYears.forEach((my) => {
                const monthTotal = Array.from(allNationalities).reduce((sum, nat) => sum + (dataByMonth[my]?.[nat] || 0), 0);
                footer.push(monthTotal);
                grandTotal += monthTotal;
            });
            footer.push(grandTotal);
            sheetData.push(footer);

            const ws = XLSX.utils.aoa_to_sheet(sheetData);
            const colWidths = header.map(h => ({ wch: Math.max(h.length, 12) }));
            colWidths[0].wch = Math.max(...orderedNatsInReport.map(n => n.length), 'Nacionalidade'.length, 'Outros'.length, 'Total'.length) + 2;
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, user.name.substring(0, 31));
        });

        XLSX.writeFile(wb, "relatorio_por_colaborador.xlsx");
        showNotification('Relatório exportado com sucesso!', 'success');
    } catch (error) {
        console.error("Erro ao exportar XLSX:", error);
        showNotification('Ocorreu um erro ao gerar o relatório.', 'error');
    } finally {
        setIsExporting(false);
    }
  };


  return (
    <>
      {globalConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[60] p-4" onClick={() => setGlobalConfirmation(null)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-slate-800 flex items-center">
                    <AlertTriangleIcon className="w-6 h-6 mr-3 text-red-500"/>
                    Confirmação Necessária
                </h3>
                <p className="text-slate-600">{globalConfirmation.message}</p>
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button onClick={() => setGlobalConfirmation(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg">
                        Cancelar
                    </button>
                    <button
                        onClick={globalConfirmation.onConfirm}
                        className={`text-white font-semibold px-4 py-2 rounded-lg ${globalConfirmation.confirmClass}`}
                    >
                        {globalConfirmation.confirmText}
                    </button>
                </div>
            </div>
          </div>
      )}

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
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
            <h3 className="text-xl font-bold mb-4 text-slate-800 flex items-center">
                <FileSpreadsheetIcon className="w-6 h-6 mr-3 text-green-600"/>
                Exportações de Relatórios
            </h3>
            <p className="text-slate-600 mb-4">
                Crie uma folha de cálculo Excel com os totais de visitantes, organizada por nacionalidade e por mês, para cada colaborador.
            </p>
            <button
                onClick={handleExportCollaboratorTotals}
                disabled={isExporting}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
            >
                <FileSpreadsheetIcon className="w-5 h-5 mr-2"/>
                {isExporting ? 'A gerar...' : 'Exportar Totais por Colaborador (XLSX)'}
            </button>
        </div>
        
        <div className="bg-red-50 border-t-4 border-red-400 p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-red-800 flex items-center">
                <AlertTriangleIcon className="w-6 h-6 mr-3"/>
                Zona de Perigo Global
            </h3>
            <p className="text-red-700 mb-4">A ação abaixo afetará toda a aplicação e não pode ser desfeita. Irá eliminar permanentemente todos os registos de atendimento de todos os utilizadores.</p>
            <button
                onClick={handleClearAllInteractions}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors"
            >
                <TrashIcon className="w-5 h-5 mr-2"/>
                Eliminar TODOS os Registos de Atendimento
            </button>
        </div>
      </div>

      {managingUser && (
        <ManageUserModal 
          user={managingUser}
          isSelf={managingUser.id === currentAdminId}
          onClose={() => setManagingUser(null)}
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