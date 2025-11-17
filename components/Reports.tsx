import React, { useState, useMemo } from 'react';
import { Interaction, Collaborator, ReportPeriod } from '../types';
import { ALL_NATIONALITIES } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileSpreadsheetIcon, FileTextIcon, UsersIcon, ClipboardListIcon, GlobeIcon, ScaleIcon, SearchIcon, SparklesIcon } from './icons';
import { GoogleGenAI } from "@google/genai";

// Declaração para bibliotecas globais carregadas via CDN
declare const XLSX: any;
declare const jsPDF: any;

// FIX: Add jspdf to the global Window interface to fix type error for CDN library.
declare global {
  interface Window {
    jspdf: any;
  }
}


interface ReportsProps {
  allInteractions: Interaction[];
  collaborators: Collaborator[];
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

const Reports: React.FC<ReportsProps> = ({ allInteractions, collaborators }) => {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>('all');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [visitReasonFilter, setVisitReasonFilter] = useState<string>('');
  const [lengthOfStayFilter, setLengthOfStayFilter] = useState<string>('');
  const [geminiAnalysis, setGeminiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const uniqueVisitReasons = useMemo(() => {
    const reasons = new Set<string>();
    allInteractions.forEach(i => i.visitReason && reasons.add(i.visitReason));
    return Array.from(reasons).sort();
  }, [allInteractions]);

  const uniqueLengthsOfStay = useMemo(() => {
    const stays = new Set<string>();
    allInteractions.forEach(i => i.lengthOfStay && stays.add(i.lengthOfStay));
    return Array.from(stays).sort();
  }, [allInteractions]);

  const periodLabels: Record<ReportPeriod, string> = {
    weekly: 'Últimos 7 dias',
    monthly: 'Este Mês',
    quarterly: 'Este Trimestre',
    yearly: 'Este Ano',
  };

  const filteredInteractions = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    now.setHours(23, 59, 59, 999); // Include all of today

    switch (period) {
      case 'weekly':
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarterly':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }
    
    return allInteractions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp);
        const collaboratorMatch = selectedCollaborator === 'all' || interaction.collaboratorId === selectedCollaborator;
        const nationalityMatch = !nationalityFilter || interaction.nationality.toLowerCase().includes(nationalityFilter.toLowerCase());
        const visitReasonMatch = !visitReasonFilter || (interaction.visitReason && interaction.visitReason.toLowerCase().includes(visitReasonFilter.toLowerCase()));
        const lengthOfStayMatch = !lengthOfStayFilter || (interaction.lengthOfStay && interaction.lengthOfStay.toLowerCase().includes(lengthOfStayFilter.toLowerCase()));
        
        return interactionDate >= startDate && interactionDate <= now && collaboratorMatch && nationalityMatch && visitReasonMatch && lengthOfStayMatch;
    });
  }, [allInteractions, period, selectedCollaborator, nationalityFilter, visitReasonFilter, lengthOfStayFilter]);

  const nationalityData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredInteractions.forEach(interaction => {
      const count = interaction.count || 1;
      counts[interaction.nationality] = (counts[interaction.nationality] || 0) + count;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ Nacionalidade: name, Visitantes: count }))
      .sort((a, b) => b.Visitantes - a.Visitantes);
  }, [filteredInteractions]);

  const kpis = useMemo(() => {
    const totalVisitors = nationalityData.reduce((sum, item) => sum + item.Visitantes, 0);
    const totalInteractions = filteredInteractions.length;
    const averageGroupSize = totalInteractions > 0 ? (totalVisitors / totalInteractions).toFixed(2) : 0;
    const topNationality = nationalityData.length > 0 ? nationalityData[0].Nacionalidade : 'N/A';
    return { totalVisitors, totalInteractions, averageGroupSize, topNationality };
  }, [nationalityData, filteredInteractions]);
  
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
        if(period === 'quarterly' || period === 'yearly') {
            return date.toLocaleString('pt-PT', { month: 'short', year: '2-digit' });
        }
        return date.toLocaleDateString('pt-PT', {day: '2-digit', month: 'short'}); // Group by day for weekly/monthly
    };

    // FIX: Refactored to correctly sort and group trend data, which resolves the 'new Date()' type error on invalid date strings.
    // Use a Map to preserve insertion order after sorting.
    const trendCounts = new Map<string, number>();

    // Sort interactions chronologically to ensure the map preserves the correct order.
    const sortedInteractions = [...filteredInteractions].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    sortedInteractions.forEach(interaction => {
        const key = grouper(new Date(interaction.timestamp));
        const currentCount = trendCounts.get(key) || 0;
        trendCounts.set(key, currentCount + (interaction.count || 1));
    });
    
    return Array.from(trendCounts.entries())
        .map(([date, visitantes]) => ({date, visitantes}))
        .slice(-30); // Show last 30 data points to avoid clutter
  }, [filteredInteractions, period]);

  const visitReasonData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredInteractions.forEach(interaction => {
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
  }, [filteredInteractions]);

  const lengthOfStayData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredInteractions.forEach(interaction => {
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
  }, [filteredInteractions]);

  const nationalityChartHeight = useMemo(() => {
    const minHeight = 400;
    const heightPerBar = 28;
    return Math.max(minHeight, nationalityData.length * heightPerBar);
  }, [nationalityData]);

  const getFilename = () => {
    const collaboratorName = selectedCollaborator === 'all' ? 'todos' : collaborators.find(c => c.id === selectedCollaborator)?.name || 'desconhecido';
    const filenameParts = [`relatorio`, period, collaboratorName.replace(/\s/g, '_')];
    if (nationalityFilter) filenameParts.push(`nac-${nationalityFilter.replace(/\s/g, '_')}`);
    if (visitReasonFilter) filenameParts.push(`motivo-${visitReasonFilter.replace(/\s/g, '_')}`);
    if (lengthOfStayFilter) filenameParts.push(`estadia-${lengthOfStayFilter.replace(/\s/g, '_')}`);
    return filenameParts.join('_');
  };

  const handleExportXLSX = () => {
    if (filteredInteractions.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    
    const wb = XLSX.utils.book_new();

    // --- Resumo Sheet ---
    const summaryData = [
        ["Relatório de Atendimentos Turísticos"],
        [],
        ["Período", periodLabels[period]],
        ["Colaborador", selectedCollaborator === 'all' ? 'Todos' : collaborators.find(c => c.id === selectedCollaborator)?.name],
        ["Data de Exportação", new Date().toLocaleString('pt-PT')],
        [],
        ["Indicadores Chave de Desempenho (KPIs)"],
        ["Métrica", "Valor"],
        ["Total de Visitantes", kpis.totalVisitors],
        ["Total de Atendimentos", kpis.totalInteractions],
        ["Média por Grupo", kpis.averageGroupSize],
        ["Nacionalidade Top", kpis.topNationality],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 40 }, { wch: 20 }];
    wsSummary["A1"].s = { font: { bold: true, sz: 16 }};
    wsSummary["A7"].s = { font: { bold: true, sz: 14 }};
    wsSummary["A8"].s = { font: { bold: true }};
    wsSummary["B8"].s = { font: { bold: true }};
    XLSX.utils.book_append_sheet(wb, wsSummary, "Resumo");

    // --- Data Sheets ---
    const createSheetWithAutosize = (data: any[], sheetName: string) => {
        if (data.length === 0) return;
        const ws = XLSX.utils.json_to_sheet(data);
        const colWidths = Object.keys(data[0] || {}).map(key => ({
            wch: Math.max(key.length, ...data.map(row => String(row[key] || '').length)) + 2
        }));
        ws['!cols'] = colWidths;
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };

    createSheetWithAutosize(nationalityData, "Nacionalidades");
    createSheetWithAutosize(visitReasonData, "Motivos de Visita");
    createSheetWithAutosize(lengthOfStayData, "Duração da Estadia");

    XLSX.writeFile(wb, `${getFilename()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredInteractions.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let yPos = 22;

    doc.setFontSize(18);
    doc.text("Relatório de Atendimentos Turísticos", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Período: ${periodLabels[period]}`, 14, yPos);
    yPos += 6;
    doc.text(`Colaborador: ${selectedCollaborator === 'all' ? 'Todos' : collaborators.find(c => c.id === selectedCollaborator)?.name}`, 14, yPos);
    yPos += 10;

    // KPIs Table
    doc.autoTable({
        startY: yPos,
        head: [['Indicadores Chave (KPIs)']],
        body: [
            [`Total de Visitantes: ${kpis.totalVisitors}`],
            [`Total de Atendimentos: ${kpis.totalInteractions}`],
            [`Média por Grupo: ${kpis.averageGroupSize}`],
            [`Nacionalidade Top: ${kpis.topNationality}`],
        ],
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }
    });
    yPos = doc.autoTable.previous.finalY + 15;

    // Data Tables
    const addDataToPdf = (title: string, data: any[]) => {
        if (data.length > 0) {
            doc.setFontSize(14);
            doc.text(title, 14, yPos);
            yPos += 8;
            doc.autoTable({
                startY: yPos,
                head: [Object.keys(data[0])],
                body: data.map(row => Object.values(row)),
                theme: 'striped',
                headStyles: { fillColor: [45, 55, 72] }
            });
            yPos = doc.autoTable.previous.finalY + 15;
        }
    };
    
    addDataToPdf("Visitantes por Nacionalidade", nationalityData);
    addDataToPdf("Top Motivos de Visita", visitReasonData);
    addDataToPdf("Top Duração da Estadia", lengthOfStayData);

    doc.save(`${getFilename()}.pdf`);
  };

  const handleGeminiAnalysis = async () => {
    if (filteredInteractions.length === 0) {
        alert("Não há dados para analisar. Por favor, ajuste os filtros.");
        return;
    }
    setIsAnalyzing(true);
    setGeminiAnalysis('');

    const prompt = `
        Analise os seguintes dados de interação de um posto de turismo e forneça um resumo com as principais conclusões.
        Os dados referem-se ao período: ${periodLabels[period]}.
        Filtros aplicados: Colaborador (${selectedCollaborator === 'all' ? 'Todos' : collaborators.find(c => c.id === selectedCollaborator)?.name}), Nacionalidade (${nationalityFilter || 'Todas'}), Motivo (${visitReasonFilter || 'Todos'}), Estadia (${lengthOfStayFilter || 'Todas'}).

        KPIs:
        - Visitantes Totais: ${kpis.totalVisitors}, Atendimentos: ${kpis.totalInteractions}, Média/Grupo: ${kpis.averageGroupSize}, Top Nacionalidade: ${kpis.topNationality}

        Top 5 Nacionalidades:
        ${nationalityData.slice(0, 5).map(d => `- ${d.Nacionalidade}: ${d.Visitantes}`).join('\n')}

        Top 5 Motivos de Visita:
        ${visitReasonData.length > 0 ? visitReasonData.slice(0, 5).map(d => `- ${d.Motivo}: ${d.Visitantes}`).join('\n') : 'Sem dados'}
        
        Top 5 Durações de Estadia:
        ${lengthOfStayData.length > 0 ? lengthOfStayData.slice(0, 5).map(d => `- ${d.Duração}: ${d.Visitantes}`).join('\n') : 'Sem dados'}

        Forneça a análise em Português, formatada como Markdown (use **negrito** para destacar). Foque-se em tendências, padrões e recomendações. Seja conciso.
    `;
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        setGeminiAnalysis(response.text);
    } catch (error) {
        console.error("Error calling Gemini API", error);
        setGeminiAnalysis("Ocorreu um erro ao gerar a análise. Por favor, tente novamente.");
    } finally {
        setIsAnalyzing(false);
    }
  };

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
        {/* Header and Filters */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-3xl font-bold text-slate-800">Relatórios</h2>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    {(Object.keys(periodLabels) as ReportPeriod[]).map(p => (
                        <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${period === p ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'}`}>{periodLabels[p]}</button>
                    ))}
                </div>
                 <select value={selectedCollaborator} onChange={(e) => setSelectedCollaborator(e.target.value)} className="px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500">
                    <option value="all">Todos</option>
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                {/* Outros filtros aqui */}
                <button onClick={handleExportXLSX} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors">
                    <FileSpreadsheetIcon className="w-5 h-5 text-green-600" />
                    <span className="hidden sm:inline">XLSX</span>
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors">
                    <FileTextIcon className="w-5 h-5 text-red-600" />
                    <span className="hidden sm:inline">PDF</span>
                </button>
                 <button onClick={handleGeminiAnalysis} disabled={isAnalyzing} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-blue-600 text-white border border-blue-700 shadow-sm hover:bg-blue-700 transition-colors disabled:bg-blue-300">
                    <SparklesIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">{isAnalyzing ? 'A analisar...' : 'Análise IA'}</span>
                </button>
            </div>
        </div>
        
        {filteredInteractions.length > 0 ? (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total de Visitantes" value={kpis.totalVisitors} icon={<UsersIcon className="w-6 h-6"/>}/>
                <KpiCard title="Total de Atendimentos" value={kpis.totalInteractions} icon={<ClipboardListIcon className="w-6 h-6"/>}/>
                <KpiCard title="Média por Grupo" value={kpis.averageGroupSize} icon={<ScaleIcon className="w-6 h-6"/>}/>
                <KpiCard title="Nacionalidade Top" value={kpis.topNationality} icon={<GlobeIcon className="w-6 h-6"/>}/>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                     <h3 className="text-lg font-semibold text-slate-700 mb-4">Tendência de Visitantes</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                            <XAxis dataKey="date" tick={{fontSize: 12}}/>
                            <YAxis allowDecimals={false}/>
                            <Tooltip />
                            <Line type="monotone" dataKey="visitantes" stroke="#3b82f6" strokeWidth={2} name="Visitantes" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Distribuição de Nacionalidades</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={pieChartData} dataKey="visitantes" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                 {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => [value, "Visitantes"]}/>
                            <Legend/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">Visitantes por Nacionalidade</h3>
                <ResponsiveContainer width="100%" height={nationalityChartHeight}>
                    <BarChart layout="vertical" data={nationalityData.map(d => ({ name: d.Nacionalidade, visitantes: d.Visitantes }))} margin={{ top: 5, right: 30, left: 50, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="name" tick={{fontSize: 12}} width={150} interval={0} />
                        <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
                        <Bar dataKey="visitantes" fill="#3b82f6" name="Nº de Visitantes" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Análise do Perfil do Visitante</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Motivos de Visita</h3>
                        {visitReasonData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={visitReasonData.map(d => ({ name: d.Motivo, visitantes: d.Visitantes }))} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis type="category" dataKey="name" width={150} tick={{fontSize: 12}}/>
                                <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                <Bar dataKey="visitantes" fill="#10b981" name="Nº de Visitantes" />
                            </BarChart>
                        </ResponsiveContainer>
                        ): ( <p className="text-center text-slate-500 py-10">Sem dados de motivo da visita.</p>) }
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Duração da Estadia</h3>
                        {lengthOfStayData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={lengthOfStayData.map(d => ({ name: d.Duração, visitantes: d.Visitantes }))} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false}/>
                                <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                                <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                <Bar dataKey="visitantes" fill="#f59e0b" name="Nº de Visitantes" />
                            </BarChart>
                        </ResponsiveContainer>
                        ) : ( <p className="text-center text-slate-500 py-10">Sem dados de duração da estadia.</p> )}
                    </div>
                </div>
            </div>
            
            {(isAnalyzing || geminiAnalysis) && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center">
                  <SparklesIcon className="w-5 h-5 mr-2 text-blue-600" /> Análise Inteligente
                </h3>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="ml-3 text-slate-600">A gerar análise com Gemini...</p>
                  </div>
                ) : (
                  <div
                    className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-lg"
                    dangerouslySetInnerHTML={{ __html: geminiAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />') }}
                  />
                )}
              </div>
            )}

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