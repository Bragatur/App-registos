import React, { useState, useMemo } from 'react';
import { Interaction, Collaborator, PRIMARY_ADMIN_ID } from '../types';
import { ArrowUpIcon, ArrowDownIcon, FileSpreadsheetIcon, FileTextIcon } from './icons';

// Declarações para bibliotecas globais
declare const XLSX: any;
declare const jsPDF: any;

interface AnalysisProps {
  allInteractions: Interaction[];
  collaborators: Collaborator[];
  currentCollaborator: Collaborator | null;
  showNotification: (message: React.ReactNode, type: 'success' | 'error') => void;
}

type SortKey = 'count' | 'nationality' | 'visitReason' | 'lengthOfStay' | 'timestamp' | 'collaboratorName';
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{
  columnKey: SortKey;
  title: string;
  sortConfig: { key: SortKey; direction: SortDirection };
  requestSort: (key: SortKey) => void;
}> = ({ columnKey, title, sortConfig, requestSort }) => (
  <th className="p-3 font-semibold text-slate-600 text-left cursor-pointer hover:bg-slate-200" onClick={() => requestSort(columnKey)}>
    <div className="flex items-center gap-2">
      {title}
      {sortConfig.key === columnKey && (
        sortConfig.direction === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />
      )}
    </div>
  </th>
);

const Analysis: React.FC<AnalysisProps> = ({ allInteractions, collaborators, currentCollaborator, showNotification }) => {
  const isAdmin = currentCollaborator?.isAdmin === true;

  const [filters, setFilters] = useState({
    collaboratorId: isAdmin ? 'all' : currentCollaborator?.id || '',
    startDate: '',
    endDate: '',
    nationality: '',
    visitReason: '',
    lengthOfStay: ''
  });

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection }>({ key: 'timestamp', direction: 'desc' });
  const [isExporting, setIsExporting] = useState(false);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
    setFilters({
      collaboratorId: isAdmin ? 'all' : currentCollaborator?.id || '',
      startDate: '',
      endDate: '',
      nationality: '',
      visitReason: '',
      lengthOfStay: ''
    });
  };

  const filteredData = useMemo(() => {
    const collaboratorMap = new Map(collaborators.map(c => [c.id, c.name]));

    return allInteractions
      .filter(i => i.collaboratorId !== PRIMARY_ADMIN_ID)
      .map(i => ({...i, collaboratorName: collaboratorMap.get(i.collaboratorId) || 'N/A' }))
      .filter(item => {
        const itemDate = new Date(item.timestamp);
        const startDate = filters.startDate ? new Date(filters.startDate) : null;
        if(startDate) startDate.setHours(0, 0, 0, 0);

        const endDate = filters.endDate ? new Date(filters.endDate) : null;
        if(endDate) endDate.setHours(23, 59, 59, 999);

        const collaboratorMatch = isAdmin ? (filters.collaboratorId === 'all' || item.collaboratorId === filters.collaboratorId) : (item.collaboratorId === currentCollaborator?.id);

        return (
          collaboratorMatch &&
          (!startDate || itemDate >= startDate) &&
          (!endDate || itemDate <= endDate) &&
          item.nationality.toLowerCase().includes(filters.nationality.toLowerCase()) &&
          (item.visitReason || '').toLowerCase().includes(filters.visitReason.toLowerCase()) &&
          (item.lengthOfStay || '').toLowerCase().includes(filters.lengthOfStay.toLowerCase())
        );
      });
  }, [allInteractions, collaborators, filters, isAdmin, currentCollaborator]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortConfig]);

  const handleExportXLSX = () => {
     if (sortedData.length === 0) {
        showNotification("Não há dados para exportar.", "error");
        return;
    }
    setIsExporting(true);
    
    const dataToExport = sortedData.map(item => ({
        'Colaborador': item.collaboratorName,
        'Nacionalidade': item.nationality,
        'Nº Pessoas': item.count,
        'Motivo da Visita': item.visitReason || '',
        'Tempo de Estadia': item.lengthOfStay || '',
        'Data e Hora': new Date(item.timestamp).toLocaleString('pt-PT'),
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Análise de Atendimentos");
    XLSX.writeFile(wb, "analise_atendimentos.xlsx");
    
    setIsExporting(false);
    showNotification("Relatório XLSX exportado.", "success");
  };

  const handleExportPDF = () => {
    if (sortedData.length === 0) {
        showNotification("Não há dados para exportar.", "error");
        return;
    }
    setIsExporting(true);
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'l', unit: 'mm', format: 'a4' });

    const head = [['Colaborador', 'Nacionalidade', 'Pessoas', 'Motivo Visita', 'Estadia', 'Data e Hora']];
    const body = sortedData.map(item => [
      item.collaboratorName,
      item.nationality,
      item.count,
      item.visitReason || '',
      item.lengthOfStay || '',
      new Date(item.timestamp).toLocaleString('pt-PT'),
    ]);

    doc.autoTable({
        head,
        body,
        startY: 20,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [59, 130, 246] }
    });

    doc.setFontSize(18);
    doc.text("Análise de Atendimentos", 15, 15);
    
    doc.save("analise_atendimentos.pdf");
    setIsExporting(false);
    showNotification("Relatório PDF exportado.", "success");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-3xl font-bold text-slate-800">Análise Detalhada</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Colaborador</label>
              <select name="collaboratorId" value={filters.collaboratorId} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg">
                <option value="all">Todos</option>
                {collaborators.filter(c => c.status === 'aprovado' && c.id !== PRIMARY_ADMIN_ID).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Início</label>
              <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg"/>
          </div>
           <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data de Fim</label>
              <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" min={filters.startDate || undefined} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nacionalidade</label>
            <input type="text" name="nationality" value={filters.nationality} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Pesquisar..."/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo da Visita</label>
            <input type="text" name="visitReason" value={filters.visitReason} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Pesquisar..."/>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tempo de Estadia</label>
            <input type="text" name="lengthOfStay" value={filters.lengthOfStay} onChange={handleFilterChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg" placeholder="Pesquisar..."/>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button onClick={resetFilters} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg">Limpar Filtros</button>
        </div>
      </div>
      
       <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
           <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-800">Resultados ({sortedData.length})</h3>
                <div className="flex items-center gap-2">
                    <button onClick={handleExportXLSX} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 disabled:bg-slate-200">
                        <FileSpreadsheetIcon className="w-5 h-5 text-green-600"/> <span>XLSX</span>
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 disabled:bg-slate-200">
                        <FileTextIcon className="w-5 h-5 text-red-600"/> <span>PDF</span>
                    </button>
                </div>
           </div>
           <div className="overflow-x-auto">
                {sortedData.length > 0 ? (
                    <table className="w-full text-left">
                        <thead className="bg-slate-100">
                            <tr>
                                {isAdmin && <SortableHeader columnKey="collaboratorName" title="Colaborador" sortConfig={sortConfig} requestSort={requestSort} />}
                                <SortableHeader columnKey="nationality" title="Nacionalidade" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="count" title="Nº Pessoas" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="visitReason" title="Motivo Visita" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="lengthOfStay" title="Estadia" sortConfig={sortConfig} requestSort={requestSort} />
                                <SortableHeader columnKey="timestamp" title="Data e Hora" sortConfig={sortConfig} requestSort={requestSort} />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.map(item => (
                                <tr key={item.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    {isAdmin && <td className="p-3">{item.collaboratorName}</td>}
                                    <td className="p-3 font-medium">{item.nationality}</td>
                                    <td className="p-3">{item.count}</td>
                                    <td className="p-3 text-sm text-slate-600">{item.visitReason}</td>
                                    <td className="p-3 text-sm text-slate-600">{item.lengthOfStay}</td>
                                    <td className="p-3 text-sm text-slate-600">{new Date(item.timestamp).toLocaleString('pt-PT')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-center py-10 text-slate-500">Nenhum registo encontrado para os filtros selecionados.</p>
                )}
           </div>
       </div>
    </div>
  );
};

export default Analysis;
