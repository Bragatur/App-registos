import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Interaction, Collaborator, ReportPeriod, PRIMARY_ADMIN_ID } from '../types';
import { ALL_NATIONALITIES, ORDERED_NATIONALITIES_FOR_EXPORT, VISIT_REASONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileSpreadsheetIcon, FileTextIcon, UsersIcon, ClipboardListIcon, GlobeIcon, ScaleIcon, SearchIcon, EditIcon, BookOpenIcon, ClockIcon } from './icons';

// Declaração para bibliotecas globais carregadas via CDN
declare const XLSX: any;
declare const jsPDF: any;
declare const html2canvas: any;

// FIX: Add jspdf to the global Window interface to fix type error for CDN library.
declare global {
  interface Window {
    jspdf: any;
  }
}

interface EditInteractionModalProps {
    interaction: Interaction;
    onClose: () => void;
    onSave: (updatedInteraction: Interaction) => void;
}

const EditInteractionModal: React.FC<EditInteractionModalProps> = ({ interaction, onClose, onSave }) => {
    const [nationality, setNationality] = useState(interaction.nationality);
    const [count, setCount] = useState(interaction.count || 1);
    const [visitReason, setVisitReason] = useState(interaction.visitReason || '');
    const [lengthOfStay, setLengthOfStay] = useState(interaction.lengthOfStay || '');
    const [timestamp, setTimestamp] = useState(interaction.timestamp);

    const formatForInput = (isoString: string) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const reasonTrimmed = visitReason.trim();
        const stayTrimmed = lengthOfStay.trim();
        const interactionCount = count > 0 ? count : 1;

        onSave({
            ...interaction,
            nationality: nationality.trim(),
            count: interactionCount,
            visitReason: reasonTrimmed || undefined,
            lengthOfStay: stayTrimmed || undefined,
            timestamp: timestamp,
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <h3 className="text-xl font-bold text-slate-800">Editar Registo</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="edit-nationality">Nacionalidade</label>
                        <input id="edit-nationality" type="text" value={nationality} onChange={(e) => setNationality(e.target.value)} list="nationalities-all" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required autoFocus />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="edit-count">Nº de Pessoas</label>
                        <input id="edit-count" type="number" value={count} onChange={(e) => setCount(parseInt(e.target.value, 10) || 1)} min="1" className="w-full px-3 py-2 border border-slate-300 rounded-lg" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="edit-visitReason">Motivo da Visita (Opcional)</label>
                        <input id="edit-visitReason" type="text" value={visitReason} onChange={(e) => setVisitReason(e.target.value)} list="visit-reasons" className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="edit-lengthOfStay">Tempo de Estadia (Opcional)</label>
                        <input id="edit-lengthOfStay" type="text" value={lengthOfStay} onChange={(e) => setLengthOfStay(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1" htmlFor="edit-timestamp">Data e Hora do Atendimento</label>
                        <input
                            id="edit-timestamp"
                            type="datetime-local"
                            value={formatForInput(timestamp)}
                            onChange={(e) => setTimestamp(new Date(e.target.value).toISOString())}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold px-4 py-2 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg">Guardar Alterações</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

interface ReportsProps {
  allInteractions: Interaction[];
  collaborators: Collaborator[];
  showNotification: (message: React.ReactNode, type: 'success' | 'error') => void;
  currentCollaborator: Collaborator | null;
  updateInteraction: (interaction: Interaction) => void;
}

const KpiCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-50 p-6 rounded-xl flex items-center gap-5 border border-slate-200">
        <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

const ChartDataTable: React.FC<{ title: string; data: any[]; columnHeaders: { key: string; label: string }[] }> = ({ title, data, columnHeaders }) => {
    if (data.length === 0) {
        return (
            <div>
                <h4 className="text-md font-semibold text-slate-700 mb-2 text-center">{title}</h4>
                <div className="border border-slate-200 rounded-lg p-4 text-center text-slate-500">
                    Sem dados.
                </div>
            </div>
        );
    }
    return (
        <div>
            <h4 className="text-md font-semibold text-slate-700 mb-2 text-center">{title}</h4>
            <div className="overflow-auto max-h-72 border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                        <tr>
                            {columnHeaders.map(header => (
                                <th key={header.key} className="p-2 font-semibold text-slate-600">{header.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => (
                            <tr key={index} className="border-b border-slate-200 last:border-b-0">
                                {columnHeaders.map(header => (
                                    <td key={`${index}-${header.key}`} className="p-2">{row[header.key]}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Reports: React.FC<ReportsProps> = ({ allInteractions, collaborators, showNotification, currentCollaborator, updateInteraction }) => {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const isAdmin = currentCollaborator?.isAdmin === true;
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>(
    isAdmin ? 'all' : currentCollaborator?.id || ''
  );

  const [isExporting, setIsExporting] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<Interaction | null>(null);
  
  // Pagination for admin table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const CHART_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6', '#6b7280', '#14b8a6', '#eab308', '#d946ef', '#06b6d4'];

  const periodLabels: Record<ReportPeriod, string> = {
    weekly: 'Últimos 7 dias',
    monthly: 'Este Mês',
    quarterly: 'Este Trimestre',
    yearly: 'Este Ano',
    custom: 'Personalizado'
  };

  useEffect(() => {
    if (period !== 'custom') {
      setStartDate('');
      setEndDate('');
    }
  }, [period]);

  const getDateRange = () => {
      const now = new Date();
      let effectiveStartDate: Date | null = null;
      let effectiveEndDate: Date | null = null;
      
      if (period === 'custom') {
          if (startDate) {
              effectiveStartDate = new Date(startDate);
              effectiveStartDate.setHours(0, 0, 0, 0);
          }
          if (endDate) {
              effectiveEndDate = new Date(endDate);
              effectiveEndDate.setHours(23, 59, 59, 999);
          }
      } else {
          effectiveEndDate = new Date();
          effectiveEndDate.setHours(23, 59, 59, 999);
          let tempStartDate = new Date();

          switch (period) {
            case 'weekly':
              tempStartDate.setDate(now.getDate() - 6);
              tempStartDate.setHours(0, 0, 0, 0);
              effectiveStartDate = tempStartDate;
              break;
            case 'monthly':
              effectiveStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
              break;
            case 'quarterly':
              const quarter = Math.floor(now.getMonth() / 3);
              effectiveStartDate = new Date(now.getFullYear(), quarter * 3, 1);
              break;
            case 'yearly':
              effectiveStartDate = new Date(now.getFullYear(), 0, 1);
              break;
          }
      }
      return { effectiveStartDate, effectiveEndDate };
  }

  const interactionsForChartsAndKpis = useMemo(() => {
    if (!currentCollaborator) return [];
    
    const { effectiveStartDate, effectiveEndDate } = getDateRange();
    const interactionsWithoutAdmin = allInteractions.filter(
        interaction => interaction.collaboratorId !== PRIMARY_ADMIN_ID
    );

    return interactionsWithoutAdmin.filter(interaction => {
      const interactionDate = new Date(interaction.timestamp);
      const startDateMatch = !effectiveStartDate || interactionDate >= effectiveStartDate;
      const endDateMatch = !effectiveEndDate || interactionDate <= effectiveEndDate;
      
      const collaboratorMatch = isAdmin 
          ? (selectedCollaborator === 'all' || interaction.collaboratorId === selectedCollaborator)
          : (interaction.collaboratorId === currentCollaborator?.id);
      
      return startDateMatch && endDateMatch && collaboratorMatch;
    });
  }, [allInteractions, period, selectedCollaborator, startDate, endDate, currentCollaborator, isAdmin]);

  const interactionsForDetailedTable = useMemo(() => {
    if (!currentCollaborator) return [];

    const { effectiveStartDate, effectiveEndDate } = getDateRange();
    const interactionsWithoutAdmin = allInteractions.filter(
        interaction => interaction.collaboratorId !== PRIMARY_ADMIN_ID
    );

    return interactionsWithoutAdmin
      .filter(interaction => {
          const interactionDate = new Date(interaction.timestamp);
          const startDateMatch = !effectiveStartDate || interactionDate >= effectiveStartDate;
          const endDateMatch = !effectiveEndDate || interactionDate <= effectiveEndDate;
          
          const collaboratorMatch = isAdmin
              ? (selectedCollaborator === 'all' || interaction.collaboratorId === selectedCollaborator)
              : (interaction.collaboratorId === currentCollaborator?.id);
          
          return startDateMatch && endDateMatch && collaboratorMatch;
      })
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [allInteractions, period, selectedCollaborator, startDate, endDate, currentCollaborator, isAdmin]);
  
  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = interactionsForDetailedTable.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(interactionsForDetailedTable.length / itemsPerPage);

  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
        setCurrentPage(pageNumber);
    }
  };
  
  useEffect(() => {
      setCurrentPage(1);
  }, [period, selectedCollaborator, startDate, endDate]);


  const nationalityData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    interactionsForChartsAndKpis.forEach(interaction => {
      const count = interaction.count || 1;
      counts[interaction.nationality] = (counts[interaction.nationality] || 0) + count;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ Nacionalidade: name, Visitantes: count }))
      .sort((a, b) => b.Visitantes - a.Visitantes);
  }, [interactionsForChartsAndKpis]);
  
  const kpis = useMemo(() => {
    const totalVisitors = nationalityData.reduce((sum, item) => sum + item.Visitantes, 0);
    const totalInteractions = interactionsForChartsAndKpis.length;
    const averageGroupSize = totalInteractions > 0 ? (totalVisitors / totalInteractions).toFixed(2) : 0;
    const topNationality = nationalityData.length > 0 ? nationalityData[0].Nacionalidade : 'N/A';
    return { totalVisitors, averageGroupSize, topNationality };
  }, [nationalityData, interactionsForChartsAndKpis]);
  
  const pieChartData = useMemo(() => {
    const top5 = nationalityData.slice(0, 5).map(item => ({name: item.Nacionalidade, visitantes: item.Visitantes}));
    const othersCount = nationalityData.slice(5).reduce((acc, curr) => acc + curr.Visitantes, 0);
    const finalData = [...top5];
    if (othersCount > 0) {
        finalData.push({ name: 'Outros', visitantes: othersCount });
    }
    return finalData;
  }, [nationalityData]);

  const trendData = useMemo(() => {
    const grouper = (date: Date) => {
        if(period === 'quarterly' || period === 'yearly' || (period === 'custom' && startDate && endDate && (new Date(endDate).getTime() - new Date(startDate).getTime()) > 31 * 24 * 60 * 60 * 1000)) {
            return date.toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        }
        return date.toLocaleDateString('pt-PT', {day: '2-digit', month: 'short'});
    };

    const trendCounts = new Map<string, number>();
    const sortedInteractions = [...interactionsForChartsAndKpis].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedInteractions.forEach(interaction => {
        const key = grouper(new Date(interaction.timestamp));
        const currentCount = trendCounts.get(key) || 0;
        trendCounts.set(key, currentCount + (interaction.count || 1));
    });
    
    return Array.from(trendCounts.entries())
        .map(([date, visitantes]) => ({date, visitantes}))
        .slice(-30);
  }, [interactionsForChartsAndKpis, period, startDate, endDate]);

  const visitReasonData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    interactionsForChartsAndKpis.forEach(interaction => {
      if (interaction.visitReason && interaction.visitReason.trim()) {
        const reason = interaction.visitReason.trim();
        const capitalizedReason = reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase();
        const count = interaction.count || 1;
        counts[capitalizedReason] = (counts[capitalizedReason] || 0) + count;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ Motivo: name, Visitantes: count }))
      .sort((a, b) => b.Visitantes - a.Visitantes)
      .slice(0, 10);
  }, [interactionsForChartsAndKpis]);

  const lengthOfStayData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    interactionsForChartsAndKpis.forEach(interaction => {
      if (interaction.lengthOfStay && interaction.lengthOfStay.trim()) {
        const stay = interaction.lengthOfStay.trim();
        const capitalizedStay = stay.charAt(0).toUpperCase() + stay.slice(1).toLowerCase();
        const count = interaction.count || 1;
        counts[capitalizedStay] = (counts[capitalizedStay] || 0) + count;
      }
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ Duração: name, Visitantes: count }))
      .sort((a, b) => b.Visitantes - a.Visitantes)
      .slice(0, 10);
  }, [interactionsForChartsAndKpis]);

  const nationalityChartHeight = useMemo(() => {
    const minHeight = 400;
    const heightPerBar = 28;
    return Math.max(minHeight, nationalityData.length * heightPerBar);
  }, [nationalityData]);

  const getFilename = () => {
    const periodString = period === 'custom' && (startDate || endDate)
        ? `de_${startDate}_ate_${endDate}`.replace(/-/g, '')
        : period;
    const collaboratorName = selectedCollaborator === 'all' 
      ? 'todos' 
      : (collaborators.find(c => c.id === selectedCollaborator)?.name || 'colaborador').replace(/\s+/g, '_');
    return `relatorio_${periodString}_${collaboratorName}`;
  }

  const getChartAsImage = async (elementId: string): Promise<string | null> => {
    const element = document.getElementById(elementId);
    if (!element) return null;
    try {
        const canvas = await html2canvas(element, { backgroundColor: '#ffffff', scale: 2 });
        return canvas.toDataURL('image/png', 0.9);
    } catch (error) {
        console.error("Error generating chart image:", error);
        showNotification("Erro ao gerar imagem de um gráfico.", "error");
        return null;
    }
  };
  
  const handleExportXLSX = async () => {
    if (interactionsForChartsAndKpis.length === 0) {
        showNotification("Não há dados para exportar.", "error");
        return;
    }
    setIsExporting(true);

    const wb = XLSX.utils.book_new();
    
    const periodLabel = period === 'custom' && (startDate || endDate) 
        ? `De ${startDate || '(início)'} a ${endDate || '(fim)'}` 
        : periodLabels[period];

    const summaryData = [
        ["Relatório de Atendimentos Turísticos"], [],
        ["Período", periodLabel],
        ["Colaborador", selectedCollaborator === 'all' ? 'Todos' : collaborators.find(c => c.id === selectedCollaborator)?.name],
        ["Data de Exportação", new Date().toLocaleString('pt-PT')], [],
        ["Indicadores Chave de Desempenho (KPIs)"], ["Métrica", "Valor"],
        ["Total de Visitantes", kpis.totalVisitors],
        ["Média por Grupo", kpis.averageGroupSize],
        ["Nacionalidade Top", kpis.topNationality],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 40 }, { wch: 20 }];
    wsSummary["A1"].s = { font: { bold: true, sz: 16 } };
    wsSummary["A7"].s = { font: { bold: true, sz: 14 } };
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");
    
    const visualDashboardData = [
      ["Dashboard Visual"], [],
      ["Nota:", "Para uma experiência visual completa com gráficos, por favor, utilize a exportação para PDF."], [],
      ["Tendência de Visitantes", "Disponível no PDF"],
      ["Distribuição de Nacionalidades", "Disponível no PDF"],
      ["Visitantes por Nacionalidade", "Disponível no PDF"],
      ["Top Motivos de Visita", "Disponível no PDF"],
      ["Top Duração da Estadia", "Disponível no PDF"],
    ];
    const wsVisual = XLSX.utils.aoa_to_sheet(visualDashboardData);
    wsVisual['!cols'] = [{ wch: 30 }, { wch: 50 }];
    wsVisual["A1"].s = { font: { bold: true, sz: 16 } };
    XLSX.utils.book_append_sheet(wb, wsVisual, "Dashboard Visual");

    const createSheet = (data: any[], sheetName: string) => {
        if (data.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(data);
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    const orderedNationalityDataForExport = [];
    const nationalityDataMap = new Map(nationalityData.map(item => [item.Nacionalidade, item.Visitantes]));
    const orderedSet = new Set(ORDERED_NATIONALITIES_FOR_EXPORT);

    // Add nationalities in the specified order
    for (const nat of ORDERED_NATIONALITIES_FOR_EXPORT) {
        if (nationalityDataMap.has(nat)) {
            orderedNationalityDataForExport.push({ Nacionalidade: nat, Visitantes: nationalityDataMap.get(nat) as number });
        }
    }

    // Handle "Outros"
    let othersCount = 0;
    // FIX: Cast `nat` to string and `count` to number because `nationalityDataMap` is of type `Map<unknown, unknown>`,
    // which causes type errors in strict mode.
    for (const [nat, count] of nationalityDataMap.entries()) {
        if (!orderedSet.has(nat as string)) {
            othersCount += count as number;
        }
    }

    if (othersCount > 0) {
        orderedNationalityDataForExport.push({ Nacionalidade: 'Outros', Visitantes: othersCount });
    }

    // Handle "Total"
    // FIX: Add types to the reduce function to correctly calculate `totalVisitors` as a number. This resolves
    // type errors when using the `+` and `>` operators.
    // FIX: Explicitly set the generic type for `reduce` to `number` to ensure `totalVisitors` is not inferred as `unknown`.
    const totalVisitors = Array.from(nationalityDataMap.values()).reduce<number>((sum, count) => sum + (count as number), 0);
    if (totalVisitors > 0) {
        orderedNationalityDataForExport.push({ Nacionalidade: 'Total', Visitantes: totalVisitors });
    }

    createSheet(orderedNationalityDataForExport, "Nacionalidades");
    createSheet(visitReasonData, "Motivos de Visita");
    createSheet(lengthOfStayData, "Duração da Estadia");

    XLSX.writeFile(wb, `${getFilename()}.xlsx`);
    setIsExporting(false);
    showNotification("Relatório XLSX exportado com sucesso!", "success");
  };

  const handleExportPDF = async () => {
    if (interactionsForChartsAndKpis.length === 0) {
        showNotification("Não há dados para exportar.", "error");
        return;
    }
    setIsExporting(true);
    showNotification("A gerar o seu relatório PDF...", "success");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    let yPos = 20;
    const pageMargin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const contentWidth = pageWidth - (pageMargin * 2);
    
    const periodLabel = period === 'custom' && (startDate || endDate) 
        ? `De ${startDate || '(início)'} a ${endDate || '(fim)'}` 
        : periodLabels[period];

    doc.setFontSize(18);
    doc.text("Relatório de Atendimentos Turísticos", pageMargin, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${periodLabel}`, pageMargin, yPos);
    doc.text(`Colaborador: ${selectedCollaborator === 'all' ? 'Todos' : collaborators.find(c => c.id === selectedCollaborator)?.name}`, pageWidth / 2, yPos);
    yPos += 10;

    doc.autoTable({
        startY: yPos,
        head: [['KPIs', `Visitantes: ${kpis.totalVisitors}`, `Média: ${kpis.averageGroupSize}`, `Top: ${kpis.topNationality}`]],
        theme: 'grid', headStyles: { fillColor: [59, 130, 246] }
    });
    yPos = (doc.autoTable.previous.finalY as number) + 12;

    const chartIds = ['trend-chart', 'pie-chart', 'nationality-chart', 'reason-chart', 'stay-chart'];
    const chartTitles = ['Tendência de Visitantes', 'Distribuição de Nacionalidades', 'Visitantes por Nacionalidade', 'Top Motivos de Visita', 'Top Duração da Estadia'];

    for (let i = 0; i < chartIds.length; i++) {
        const imgData = await getChartAsImage(chartIds[i]);
        if (imgData) {
            const imgProps = doc.getImageProperties(imgData);
            const imgHeight = (imgProps.height * contentWidth) / imgProps.width;

            if (yPos + imgHeight + 15 > doc.internal.pageSize.getHeight()) {
                doc.addPage();
                yPos = 20;
            }

            doc.setFontSize(14);
            doc.text(chartTitles[i], pageMargin, yPos);
            yPos += 6;
            doc.addImage(imgData, 'PNG', pageMargin, yPos, contentWidth, imgHeight, '', 'FAST');
            yPos += imgHeight + 12;
        }
    }
    
    const addDataToPdf = (title: string, data: any[]) => {
        if (data.length > 0) {
            if (yPos + 20 > (doc.internal.pageSize.getHeight() as number)) {
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text(title, pageMargin, yPos);
            yPos += 8;
            doc.autoTable({
                startY: yPos,
                head: [Object.keys(data[0])],
                // FIX: The `body` of `autoTable` was receiving mixed types, which can cause issues. 
                // Convert all cell values to strings for consistent display and to avoid type errors.
                body: data.map(row => Object.values(row).map(value => String(value ?? ''))),
                theme: 'striped', headStyles: { fillColor: [45, 55, 72] },
                didDrawPage: (hookData: any) => { 
                    // FIX: Safely update yPos for multi-page tables by casting to number.
                    yPos = (hookData.cursor.y as number);
                }
            });
            // FIX: After the table, use the reliable `finalY` property (cast to number) and add a margin.
            yPos = (doc.autoTable.previous.finalY as number) + 15;
        }
    };
    
    addDataToPdf("Visitantes por Nacionalidade", nationalityData);
    addDataToPdf("Top Motivos de Visita", visitReasonData);
    addDataToPdf("Top Duração da Estadia", lengthOfStayData);

    doc.save(`${getFilename()}.pdf`);
    setIsExporting(false);
    showNotification("Relatório PDF exportado com sucesso!", "success");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        {editingInteraction && (
            <EditInteractionModal
                interaction={editingInteraction}
                onClose={() => setEditingInteraction(null)}
                onSave={(updated) => {
                    updateInteraction(updated);
                    setEditingInteraction(null);
                }}
            />
        )}
        <datalist id="nationalities-all">
            {ALL_NATIONALITIES.map(nat => <option key={nat} value={nat} />)}
        </datalist>
        <datalist id="visit-reasons">
            {VISIT_REASONS.map(reason => <option key={reason} value={reason} />)}
        </datalist>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold text-slate-800">Relatórios</h2>
            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                 <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        {(Object.keys(periodLabels) as ReportPeriod[]).map(p => (
                            <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${period === p ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>{periodLabels[p]}</button>
                        ))}
                    </div>
                    {isAdmin && (
                        <select value={selectedCollaborator} onChange={(e) => setSelectedCollaborator(e.target.value)} className="px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500">
                            <option value="all">Todos</option>
                            {collaborators.filter(c => c.status === 'aprovado' && c.id !== PRIMARY_ADMIN_ID).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    )}
                    <button onClick={handleExportXLSX} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed">
                        <FileSpreadsheetIcon className="w-5 h-5 text-green-600" />
                        <span className="hidden sm:inline">{isExporting ? 'A gerar...' : 'XLSX'}</span>
                    </button>
                    <button onClick={handleExportPDF} disabled={isExporting} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors disabled:bg-slate-200 disabled:cursor-not-allowed">
                        <FileTextIcon className="w-5 h-5 text-red-600" />
                        <span className="hidden sm:inline">{isExporting ? 'A gerar...' : 'PDF'}</span>
                    </button>
                </div>
                {period === 'custom' && (
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm animate-fade-in">
                        <label htmlFor="start-date" className="text-sm font-semibold text-slate-600">De:</label>
                        <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 py-1 rounded-md text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-300 focus:ring-1 focus:ring-blue-500"
                            max={endDate || undefined}
                        />
                        <label htmlFor="end-date" className="text-sm font-semibold text-slate-600">Até:</label>
                        <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 py-1 rounded-md text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-300 focus:ring-1 focus:ring-blue-500"
                            min={startDate || undefined}
                        />
                    </div>
                )}
            </div>
        </div>
        
        {interactionsForChartsAndKpis.length > 0 ? (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <KpiCard title="Total de Visitantes" value={kpis.totalVisitors} icon={<UsersIcon className="w-6 h-6"/>}/>
                <KpiCard title="Média por Grupo" value={kpis.averageGroupSize} icon={<ScaleIcon className="w-6 h-6"/>}/>
                <KpiCard title="Nacionalidade Top" value={kpis.topNationality} icon={<GlobeIcon className="w-6 h-6"/>}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div id="trend-chart" className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                     <h3 className="text-lg font-semibold text-slate-700 mb-4">Tendência de Visitantes</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis allowDecimals={false}/>
                            <Tooltip />
                            <Line type="monotone" dataKey="visitantes" stroke={CHART_COLORS[0]} strokeWidth={2} name="Visitantes" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div id="pie-chart" className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Distribuição de Nacionalidades</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieChartData} dataKey="visitantes" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                 {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "Visitantes"]}/>
                            <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div id="nationality-chart" className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Visitantes por Nacionalidade</h3>
                <ResponsiveContainer width="100%" height={nationalityChartHeight}>
                    <BarChart layout="vertical" data={nationalityData.map(d => ({ name: d.Nacionalidade, visitantes: d.Visitantes }))} margin={{ top: 5, right: 30, left: 50, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={150} interval={0} />
                        <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
                        <Bar dataKey="visitantes" name="Nº de Visitantes">
                            {nationalityData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Análise do Perfil do Visitante</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div id="reason-chart">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Motivos de Visita</h3>
                        {visitReasonData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={visitReasonData.map(d => ({ name: d.Motivo, visitantes: d.Visitantes }))} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}}/>
                                <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                <Bar dataKey="visitantes" name="Nº de Visitantes">
                                     {visitReasonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ): ( <p className="text-center text-slate-500 py-10">Sem dados de motivo da visita.</p>) }
                    </div>
                    <div id="stay-chart">
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Duração da Estadia</h3>
                        {lengthOfStayData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={lengthOfStayData.map(d => ({ name: d.Duração, visitantes: d.Visitantes }))} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                                <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                <Bar dataKey="visitantes" name="Nº de Visitantes">
                                    {lengthOfStayData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                        ) : ( <p className="text-center text-slate-500 py-10">Sem dados de duração da estadia.</p> )}
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-xl font-bold mb-6 text-slate-800 text-center">Dados Resumidos dos Gráficos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <ChartDataTable
                        title="Visitantes por Nacionalidade"
                        data={nationalityData}
                        columnHeaders={[
                            { key: 'Nacionalidade', label: 'Nacionalidade' },
                            { key: 'Visitantes', label: 'Visitantes' }
                        ]}
                    />
                    <ChartDataTable
                        title="Tendência de Visitantes"
                        data={trendData}
                        columnHeaders={[
                            { key: 'date', label: 'Data' },
                            { key: 'visitantes', label: 'Visitantes' }
                        ]}
                    />
                    <ChartDataTable
                        title="Top Motivos de Visita"
                        data={visitReasonData}
                        columnHeaders={[
                            { key: 'Motivo', label: 'Motivo' },
                            { key: 'Visitantes', label: 'Visitantes' }
                        ]}
                    />
                    <ChartDataTable
                        title="Top Duração da Estadia"
                        data={lengthOfStayData}
                        columnHeaders={[
                            { key: 'Duração', label: 'Duração' },
                            { key: 'Visitantes', label: 'Visitantes' }
                        ]}
                    />
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-xl font-bold mb-4 text-slate-800">{isAdmin ? 'Todos os Registos' : 'Os Seus Registos'}</h3>
                {interactionsForDetailedTable.length > 0 ? (
                <>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-100">
                            <tr>
                                <th className="p-3 font-semibold text-slate-600">Pessoas</th>
                                <th className="p-3 font-semibold text-slate-600">Nacionalidade e Detalhes</th>
                                <th className="p-3 font-semibold text-slate-600">Data</th>
                                {isAdmin && <th className="p-3 font-semibold text-slate-600">Colaborador</th>}
                                <th className="p-3 font-semibold text-slate-600 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentItems.map(interaction => (
                                <tr key={interaction.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-3 font-bold">{interaction.count}x</td>
                                    <td className="p-3">
                                            <div>
                                            <span className="font-medium text-slate-800">{interaction.nationality}</span>
                                            {(interaction.visitReason || interaction.lengthOfStay) && (
                                                <div className="text-xs text-slate-500 mt-1 space-y-1 max-w-xs">
                                                    {interaction.visitReason && <p className="flex items-start"><BookOpenIcon className="w-3 h-3 mr-1.5 shrink-0 mt-0.5"/> <span>{interaction.visitReason}</span></p>}
                                                    {interaction.lengthOfStay && <p className="flex items-start"><ClockIcon className="w-3 h-3 mr-1.5 shrink-0 mt-0.5"/> <span>{interaction.lengthOfStay}</span></p>}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-sm text-slate-500">{new Date(interaction.timestamp).toLocaleString('pt-PT')}</td>
                                    {isAdmin && <td className="p-3 text-sm">{collaborators.find(c => c.id === interaction.collaboratorId)?.name || 'N/A'}</td>}
                                    <td className="p-3 text-right">
                                        <button 
                                            onClick={() => setEditingInteraction(interaction)} 
                                            className="text-slate-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-100 transition-colors"
                                            aria-label="Editar"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                    {totalPages > 1 && (
                    <div className="flex justify-between items-center mt-4">
                        <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50">Anterior</button>
                        <span>Página {currentPage} de {totalPages}</span>
                        <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-slate-200 rounded-md disabled:opacity-50">Próxima</button>
                    </div>
                )}
                </>
                ) : (
                    <p className="text-center text-slate-500 py-10">Não foram encontrados registos detalhados para a sua seleção.</p>
                )}
            </div>
        </div>
        ) : (
            <div className="text-center py-20 text-slate-500 bg-white rounded-xl shadow-md border border-slate-200">
                <p>Não há dados de atendimentos para o período e filtro selecionados.</p>
            </div>
        )}
    </div>
  );
};

export default Reports;