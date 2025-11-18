

import React from 'react';
import { Collaborator, View } from '../types';
import { ChartBarIcon, EditIcon, LogOutIcon, ShieldCheckIcon, KeyIcon, AnalysisIcon } from './icons';

interface HeaderProps {
  collaborator: Collaborator;
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
  onChangePasswordClick: () => void;
}

const NavButton: React.FC<{
    onClick: () => void;
    isActive: boolean;
    children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ onClick, isActive, children, ...props }) => (
    <button 
        onClick={onClick} 
        className={`flex items-center space-x-2 px-4 py-2 rounded-md font-semibold transition-colors ${
            isActive 
            ? 'bg-blue-600 text-white' 
            : 'text-slate-600 hover:bg-slate-200'
        }`}
        {...props}
    >
        {children}
    </button>
)

const Header: React.FC<HeaderProps> = ({ collaborator, currentView, setView, onLogout, onChangePasswordClick }) => {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          
          {/* Left Group (Title + Nav) */}
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold text-slate-900">Posto de Turismo</h1>
            <nav className="hidden sm:flex items-center gap-4 bg-slate-100 p-1 rounded-lg">
                <NavButton onClick={() => setView('dashboard')} isActive={currentView === 'dashboard'} title="Registar e gerir atendimentos">
                    <EditIcon className="w-5 h-5" />
                    <span>Atendimentos</span>
                </NavButton>
                <NavButton onClick={() => setView('reports')} isActive={currentView === 'reports'} title="Ver relatórios e estatísticas">
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Relatórios</span>
                </NavButton>
                <NavButton onClick={() => setView('analysis')} isActive={currentView === 'analysis'} title="Análise detalhada dos dados">
                    <AnalysisIcon className="w-5 h-5" />
                    <span>Análise</span>
                </NavButton>
                 {collaborator.isAdmin && (
                    <NavButton onClick={() => setView('admin')} isActive={currentView === 'admin'} title="Painel de administração">
                        <ShieldCheckIcon className="w-5 h-5" />
                        <span>Admin</span>
                    </NavButton>
                )}
            </nav>
          </div>

          {/* Right Group (User Info) */}
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-sm font-medium text-slate-600 hidden md:block">
              Bem-vindo, <span className="font-bold">{collaborator.name}</span>
            </span>
             <button
              onClick={onChangePasswordClick}
              className="flex items-center space-x-2 text-slate-600 hover:text-blue-600 font-semibold p-2 rounded-md hover:bg-blue-100 transition-colors"
              title="Alterar Password"
            >
              <KeyIcon className="w-5 h-5" />
              <span className="hidden sm:inline">Alterar Password</span>
            </button>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 text-slate-600 hover:text-red-600 font-semibold p-2 rounded-md hover:bg-red-100 transition-colors"
              title="Sair"
            >
              <LogOutIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>

        {/* Mobile Nav Below */}
        <nav className="sm:hidden flex items-center gap-4 bg-slate-100 p-1 rounded-lg mb-4 justify-start overflow-x-auto">
            <NavButton onClick={() => setView('dashboard')} isActive={currentView === 'dashboard'} title="Registar e gerir atendimentos">
                <EditIcon className="w-5 h-5" />
                <span>Atendimentos</span>
            </NavButton>
            <NavButton onClick={() => setView('reports')} isActive={currentView === 'reports'} title="Ver relatórios e estatísticas">
                <ChartBarIcon className="w-5 h-5" />
                <span>Relatórios</span>
            </NavButton>
            <NavButton onClick={() => setView('analysis')} isActive={currentView === 'analysis'} title="Análise detalhada dos dados">
                <AnalysisIcon className="w-5 h-5" />
                <span>Análise</span>
            </NavButton>
            {collaborator.isAdmin && (
                <NavButton onClick={() => setView('admin')} isActive={currentView === 'admin'} title="Painel de administração">
                    <ShieldCheckIcon className="w-5 h-5" />
                    <span>Admin</span>
                </NavButton>
            )}
        </nav>
      </div>
    </header>
  );
};

export default Header;