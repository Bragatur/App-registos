import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Collaborator, Interaction } from '../types';
import { QUICK_ACCESS_NATIONALITIES, ALL_NATIONALITIES } from '../constants';
import { PlusIcon, EditIcon, TrashIcon, SearchIcon, BookOpenIcon, ClockIcon } from './icons';

interface DashboardProps {
  collaborator: Collaborator;
  interactions: Interaction[];
  addInteraction: (nationality: string, count: number, visitReason?: string, lengthOfStay?: string) => void;
  updateInteraction: (interaction: Interaction) => void;
  deleteInteraction: (id: string) => void;
}

const InteractionRow: React.FC<{
    interaction: Interaction;
    onUpdate: (interaction: Interaction) => void;
    onDelete: (id: string) => void;
}> = ({ interaction, onUpdate, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [nationality, setNationality] = useState(interaction.nationality);
    const [count, setCount] = useState(interaction.count || 1);
    const [visitReason, setVisitReason] = useState(interaction.visitReason || '');
    const [lengthOfStay, setLengthOfStay] = useState(interaction.lengthOfStay || '');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isEditing) {
            inputRef.current?.focus();
        }
    }, [isEditing]);

    const handleCancel = () => {
        setNationality(interaction.nationality);
        setCount(interaction.count || 1);
        setVisitReason(interaction.visitReason || '');
        setLengthOfStay(interaction.lengthOfStay || '');
        setIsEditing(false);
    }
    
    const handleSave = () => {
        const reasonTrimmed = visitReason.trim();
        const stayTrimmed = lengthOfStay.trim();
        const interactionCount = count > 0 ? count : 1;

        if (nationality.trim() && (
            nationality.trim() !== interaction.nationality ||
            interactionCount !== (interaction.count || 1) ||
            reasonTrimmed !== (interaction.visitReason || '') ||
            stayTrimmed !== (interaction.lengthOfStay || '')
        )) {
            onUpdate({ 
                ...interaction, 
                nationality: nationality.trim(),
                count: interactionCount,
                visitReason: reasonTrimmed || undefined,
                lengthOfStay: stayTrimmed || undefined,
            });
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    }

    if (isEditing) {
        return (
            <tr className="border-b border-slate-200 bg-blue-50">
                <td className="py-3 px-4 align-top" colSpan={2}>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={count}
                                onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)}
                                onKeyDown={handleKeyDown}
                                min="1"
                                className="w-20 px-2 py-1 border border-blue-400 rounded-md font-semibold"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                value={nationality}
                                onChange={(e) => setNationality(e.target.value)}
                                onKeyDown={handleKeyDown}
                                list="nationalities-all-edit"
                                className="flex-grow px-2 py-1 border border-blue-400 rounded-md font-semibold"
                            />
                        </div>
                         <input
                            type="text"
                            value={visitReason}
                            onChange={(e) => setVisitReason(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Motivo da visita (opcional)"
                            className="w-full px-2 py-1 border border-slate-300 rounded-md"
                        />
                         <input
                            type="text"
                            value={lengthOfStay}
                            onChange={(e) => setLengthOfStay(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Tempo de estadia (opcional)"
                            className="w-full px-2 py-1 border border-slate-300 rounded-md"
                        />
                    </div>
                </td>
                <td className="py-3 px-4 align-middle">
                    <div className="flex items-center justify-end space-x-2">
                        <button onClick={handleSave} className="text-white bg-green-600 hover:bg-green-700 p-2 rounded-md transition-colors text-sm font-semibold">Guardar</button>
                        <button onClick={handleCancel} className="text-slate-600 hover:bg-slate-200 p-2 rounded-md transition-colors text-sm">Cancelar</button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
         <tr className="border-b border-slate-200 hover:bg-slate-50">
            <td className="py-3 px-4 align-top">
                <div className="flex items-start">
                    <span className="font-bold text-slate-800 text-lg mr-3 w-8 text-right">{interaction.count || 1}x</span>
                    <div>
                        <span className="font-medium text-slate-800">{interaction.nationality}</span>
                        {(interaction.visitReason || interaction.lengthOfStay) && (
                            <div className="text-xs text-slate-500 mt-1 space-y-1 max-w-xs">
                                {interaction.visitReason && <p className="flex items-start"><BookOpenIcon className="w-3 h-3 mr-1.5 shrink-0 mt-0.5"/> <span>{interaction.visitReason}</span></p>}
                                {interaction.lengthOfStay && <p className="flex items-start"><ClockIcon className="w-3 h-3 mr-1.5 shrink-0 mt-0.5"/> <span>{interaction.lengthOfStay}</span></p>}
                            </div>
                        )}
                    </div>
                </div>
            </td>
            <td className="py-3 px-4 text-slate-500 text-sm align-top">
                {new Date(interaction.timestamp).toLocaleString('pt-PT')}
            </td>
            <td className="py-3 px-4 align-top">
                <div className="flex items-center justify-end space-x-2">
                    <button onClick={() => setIsEditing(true)} className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors" aria-label="Editar">
                        <EditIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => {if(window.confirm('Tem a certeza que deseja eliminar este registo?')) {onDelete(interaction.id)}}} className="text-slate-500 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors" aria-label="Eliminar">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
            </td>
        </tr>
    )
}


const Dashboard: React.FC<DashboardProps> = ({ collaborator, interactions, addInteraction, updateInteraction, deleteInteraction }) => {
  const [notification, setNotification] = useState('');
  
  // Form state
  const [nationality, setNationality] = useState('');
  const [count, setCount] = useState<number | string>(1);
  const [visitReason, setVisitReason] = useState('');
  const [lengthOfStay, setLengthOfStay] = useState('');

  const countInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 2500);
  };

  const handleAddInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nationality.trim()) {
        alert("Por favor, preencha a nacionalidade.");
        return;
    }
    const interactionCount = typeof count === 'number' ? count : parseInt(String(count) || '1', 10);
    const finalCount = interactionCount > 0 ? interactionCount : 1;

    addInteraction(nationality, finalCount, visitReason, lengthOfStay);
    showNotification(`Registo para ${finalCount}x '${nationality}' adicionado.`);
    
    // Reset form
    setNationality('');
    setCount(1);
    setVisitReason('');
    setLengthOfStay('');
  };

  const handleQuickAccessClick = (nat: string) => {
    setNationality(nat);
    countInputRef.current?.select();
  };


  return (
    <div className="max-w-7xl mx-auto">
        {notification && (
            <div className="fixed top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-pulse">
                {notification}
            </div>
        )}
        <datalist id="nationalities-all">
            {ALL_NATIONALITIES.map(nat => <option key={nat} value={nat} />)}
        </datalist>
        <datalist id="nationalities-all-edit">
            {ALL_NATIONALITIES.map(nat => <option key={nat} value={nat} />)}
        </datalist>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                
                {/* Add Interaction Form */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Adicionar Novo Atendimento</h2>
                    <form onSubmit={handleAddInteraction} className="space-y-4">
                        <div>
                            <label htmlFor="nationality" className="block text-sm font-medium text-slate-700 mb-1">Nacionalidade</label>
                            <div className="relative">
                                <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                <input
                                    id="nationality"
                                    type="text"
                                    value={nationality}
                                    onChange={(e) => setNationality(e.target.value)}
                                    list="nationalities-all"
                                    placeholder="Pesquisar ou selecionar..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="count" className="block text-sm font-medium text-slate-700 mb-1">Número de Pessoas</label>
                            <input
                                id="count"
                                type="number"
                                ref={countInputRef}
                                value={count}
                                onChange={(e) => setCount(e.target.value ? parseInt(e.target.value, 10) : '')}
                                min="1"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="visitReason" className="block text-sm font-medium text-slate-700 mb-1">Motivo da Visita (Opcional)</label>
                            <input
                                id="visitReason"
                                type="text"
                                value={visitReason}
                                onChange={(e) => setVisitReason(e.target.value)}
                                placeholder="Ex: Férias, história..."
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="lengthOfStay" className="block text-sm font-medium text-slate-700 mb-1">Tempo de Estadia (Opcional)</label>
                            <input
                                id="lengthOfStay"
                                type="text"
                                value={lengthOfStay}
                                onChange={(e) => setLengthOfStay(e.target.value)}
                                placeholder="Ex: 3 dias, 1 semana"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center transition-colors disabled:bg-blue-300"
                            disabled={!nationality.trim()}
                        >
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            Adicionar Registo
                        </button>
                    </form>
                </div>

                {/* Quick Access */}
                <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h2 className="text-xl font-bold mb-4 text-slate-800">Atalhos Rápidos</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {QUICK_ACCESS_NATIONALITIES.map((nat) => (
                        <button
                            key={nat}
                            onClick={() => handleQuickAccessClick(nat)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-2 rounded-lg transition-transform transform hover:scale-105 text-center text-sm"
                        >
                            {nat}
                        </button>
                        ))}
                    </div>
                </div>

            </div>

            {/* Recent Interactions */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-xl font-bold mb-4 text-slate-800">Os Seus Registos Recentes</h2>
                <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
                    {interactions.length > 0 ? (
                        <table className="w-full text-left table-fixed">
                            <thead className="sticky top-0 bg-slate-100 z-10">
                                <tr>
                                    <th className="py-3 px-4 font-semibold text-slate-600 w-2/5">Nacionalidade e Detalhes</th>
                                    <th className="py-3 px-4 font-semibold text-slate-600 w-2/5">Data e Hora</th>
                                    <th className="py-3 px-4 font-semibold text-slate-600 text-right w-1/5">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {interactions.map((interaction) => (
                                    <InteractionRow 
                                        key={interaction.id}
                                        interaction={interaction}
                                        onUpdate={updateInteraction}
                                        onDelete={deleteInteraction}
                                    />
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center py-10 text-slate-500">Ainda não adicionou nenhum registo.</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;
