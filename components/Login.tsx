
import React, { useState, useRef } from 'react';
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
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg"
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
    // states for login
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const passwordInputRef = useRef<HTMLInputElement>(null);

    // states for registration
    const [newName, setNewName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);


    // modal state
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;
        onLogin(name, password);
    };

    const handleRegisterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addCollaborator(newName, newPassword, newEmail);
        setNewName('');
        setNewPassword('');
        setConfirmPassword('');
        setNewEmail('');
        setIsRegisterOpen(false);
    };

    const handlePasswordRecover = (email: string) => {
        const result = requestPasswordReset(email);
        if (result) {
            setName(result.name);
            setPassword(result.newPassword);
            setShowRecoveryModal(false);
        }
    };
    
    const approvedCollaborators = collaborators.filter(c => c.status === 'aprovado' && c.id !== PRIMARY_ADMIN_ID);
    
    const getInitials = (name: string): string => {
        if (!name) return '?';
        const parts = name.trim().split(' ');
        if (parts.length > 1 && parts[parts.length - 1]) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    const nameToColor = (name: string): string => {
        if (!name) return '777777';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
            hash = hash & hash; // Convert to 32bit integer
        }
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return "00000".substring(0, 6 - c.length) + c;
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
            {showRecoveryModal && <PasswordRecoveryModal onClose={() => setShowRecoveryModal(false)} onRecover={handlePasswordRecover} />}

            <div className="max-w-6xl w-full mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-800">Registo de Atendimentos Turísticos</h1>
                    <p className="text-slate-600 mt-2">Bem-vindo. Por favor, inicie sessão ou registe-se para continuar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    {/* LEFT COLUMN: AUTHENTICATION */}
                    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200 space-y-6">
                        {/* Login Form */}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><LogInIcon className="w-6 h-6 mr-3 text-blue-600"/> Iniciar Sessão</h2>
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="username">Nome de Utilizador</label>
                                    <input id="username" type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required autoFocus />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="password">Password</label>
                                    <input ref={passwordInputRef} id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500" required />
                                </div>
                                <div className="text-right">
                                    <button type="button" onClick={() => setShowRecoveryModal(true)} className="text-sm text-blue-600 hover:underline">Esqueceu-se da password?</button>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors">Entrar</button>
                            </form>
                        </div>
                        
                        <div className="border-t border-slate-200"></div>

                        {/* Register Form (Minimized) */}
                        <div>
                             {isRegisterOpen ? (
                                <div className="animate-fade-in">
                                     <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><UserPlusIcon className="w-6 h-6 mr-3 text-green-600"/> Pedido de Registo</h2>
                                     <form onSubmit={handleRegisterSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="new-username">Nome de Utilizador</label>
                                            <input id="new-username" type="text" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="new-email">Email</label>
                                            <input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="new-password">Password</label>
                                            <input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="confirm-password">Confirmar Password</label>
                                            <input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500" required />
                                        </div>
                                        <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors">Pedir Registo</button>
                                     </form>
                                      <div className="text-center mt-4">
                                        <button onClick={() => setIsRegisterOpen(false)} className="text-sm text-slate-600 hover:underline">
                                            Ocultar formulário
                                        </button>
                                    </div>
                                </div>
                             ) : (
                                 <div className="text-center">
                                    <p className="text-slate-600">Ainda não tem conta?</p>
                                    <button onClick={() => setIsRegisterOpen(true)} className="font-semibold text-blue-600 hover:underline">
                                        Faça aqui o seu pedido de registo
                                    </button>
                                 </div>
                             )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: APPROVED USERS */}
                    <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                      <h3 className="text-2xl font-bold text-slate-800 mb-6 text-center">Acesso Rápido</h3>
                      {approvedCollaborators.length > 0 ? (
                          <div className="flex flex-wrap gap-x-6 gap-y-8 justify-center">
                            {approvedCollaborators.map(c => (
                              <button
                                key={c.id}
                                onClick={() => { setName(c.name); setPassword(''); passwordInputRef.current?.focus(); }}
                                className="flex flex-col items-center gap-2 text-center group w-28 transform transition-transform duration-200 hover:-translate-y-1"
                                title={`Iniciar sessão como ${c.name}`}
                              >
                                <div 
                                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                                  style={{ backgroundColor: `#${nameToColor(c.name)}` }}
                                >
                                  {getInitials(c.name)}
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="font-semibold text-sm text-slate-700 group-hover:text-blue-600 break-words w-full">{c.name}</span>
                                  {c.isAdmin && (
                                    <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded-full mt-1">Admin</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                      ) : (
                        <div className="text-center py-8 text-slate-500">
                          <p>Nenhum utilizador aprovado ainda.</p>
                          <p className="text-sm mt-1">Os novos registos aparecerão aqui após aprovação de um administrador.</p>
                        </div>
                      )}
                    </div>
                </div>

                {/* BOTTOM ROW: INFORMATION */}
                <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
                    <div className="space-y-4 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center justify-center"><MailIcon className="w-6 h-6 mr-3 text-blue-600"/> Pedido de Informações</h2>
                        <p className="text-slate-600">Para questões, recuperação de conta manual ou outros assuntos, por favor clique no botão abaixo para contactar o administrador.</p>
                        <a href={`mailto:turismobraga@protonmail.com?subject=${encodeURIComponent('Pedido de apoio app Registo de Atendimentos Turísticos')}`} className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors">
                            Contactar Administrador
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
