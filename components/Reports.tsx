import React, { useState, useMemo } from 'react';
import { Interaction, Collaborator, ReportPeriod } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { DownloadIcon, UsersIcon, ClipboardListIcon, GlobeIcon, ScaleIcon } from './icons';

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
        return interactionDate >= startDate && interactionDate <= now && collaboratorMatch;
    });
  }, [allInteractions, period, selectedCollaborator]);

  const nationalityData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    filteredInteractions.forEach(interaction => {
      const count = interaction.count || 1;
      counts[interaction.nationality] = (counts[interaction.nationality] || 0) + count;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, visitantes: count }))
      .sort((a, b) => b.visitantes - a.visitantes);
  }, [filteredInteractions]);

  // Data for KPIs
  const kpis = useMemo(() => {
    const totalVisitors = nationalityData.reduce((sum, item) => sum + item.visitantes, 0);
    const totalInteractions = filteredInteractions.length;
    const averageGroupSize = totalInteractions > 0 ? (totalVisitors / totalInteractions).toFixed(2) : 0;
    const topNationality = nationalityData.length > 0 ? nationalityData[0].name : 'N/A';
    return { totalVisitors, totalInteractions, averageGroupSize, topNationality };
  }, [nationalityData, filteredInteractions]);
  
  // Data for Pie Chart
  const pieChartData = useMemo(() => {
    const top5 = nationalityData.slice(0, 5);
    const othersCount = nationalityData.slice(5).reduce((acc, curr) => acc + curr.visitantes, 0);
    const finalData = [...top5];
    if (othersCount > 0) {
        finalData.push({ name: 'Outros', visitantes: othersCount });
    }
    return finalData;
  }, [nationalityData]);

  // Data for Trend Line Chart
  const trendData = useMemo(() => {
    const formatters: Record<ReportPeriod, (d: Date) => string> = {
        weekly: (d) => d.toLocaleDateString('pt-PT', { weekday: 'short', day: '2-digit' }),
        monthly: (d) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
        quarterly: (d) => `S${Math.floor((d.getDate() - 1) / 7) + 1}, ${d.toLocaleDateString('pt-PT', { month: 'short' })}`, // By week of month
        yearly: (d) => d.toLocaleDateString('pt-PT', { month: 'long' }),
    };

    const grouper = (date: Date) => {
        if(period === 'quarterly') {
             // Group by week
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const weekNumber = Math.ceil((date.getDate() + firstDay.getDay()) / 7);
            return `${date.toLocaleString('pt-PT', { month: 'short' })} - Sem ${weekNumber}`;
        }
        if(period === 'yearly') {
            return date.toLocaleString('pt-PT', { month: 'long' });
        }
        return date.toLocaleDateString('pt-PT'); // Group by day for weekly/monthly
    };

    const trendCounts = filteredInteractions.reduce((acc, curr) => {
        const key = grouper(new Date(curr.timestamp));
        acc[key] = (acc[key] || 0) + (curr.count || 1);
        return acc;
    }, {} as Record<string, number>);
    
    // Sort chronologically
     return Object.entries(trendCounts)
        .map(([dateKey, visitantes]) => ({
            date: dateKey,
            visitantes,
            // Create a sortable date from the key
            sortableDate: new Date(dateKey.split('/').reverse().join('-'))
        }))
        .sort((a, b) => a.sortableDate.getTime() - b.sortableDate.getTime())
        .map(({date, visitantes}) => ({date, visitantes})); // Remove sortableDate
  }, [filteredInteractions, period]);

// FIX: Implement data aggregation for visit reason and length of stay to fix error and implement charts.
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
      .map(([name, count]) => ({ name, visitantes: count }))
      .sort((a, b) => b.visitantes - a.visitantes)
      .slice(0, 10); // Take top 10 reasons
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
      .map(([name, count]) => ({ name, visitantes: count }))
      .sort((a, b) => b.visitantes - a.visitantes)
      .slice(0, 10); // Take top 10
  }, [filteredInteractions]);


  const handleExport = () => {
    if (nationalityData.length === 0) {
        alert("Não há dados para exportar.");
        return;
    }

    const headers = ["Nacionalidade", "Nº de Visitantes"];
    const csvContent = [
        headers.join(','),
        ...nationalityData.map(row => `"${row.name.replace(/"/g, '""')}",${row.visitantes}`)
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        const collaboratorName = selectedCollaborator === 'all' ? 'todos' : collaborators.find(c => c.id === selectedCollaborator)?.name || 'desconhecido';
        link.setAttribute("href", url);
        link.setAttribute("download", `relatorio_visitantes_${period}_${collaboratorName.replace(/\s/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };


  const periodLabels: Record<ReportPeriod, string> = {
    weekly: 'Últimos 7 dias',
    monthly: 'Este Mês',
    quarterly: 'Este Trimestre',
    yearly: 'Este Ano',
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
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                                period === p ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {periodLabels[p]}
                        </button>
                    ))}
                </div>
                 <select
                    value={selectedCollaborator}
                    onChange={(e) => setSelectedCollaborator(e.target.value)}
                    className="px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Todos os Colaboradores</option>
                    {collaborators.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button onClick={handleExport} className="flex items-center gap-2 px-3 py-2 rounded-md font-semibold bg-white text-slate-700 border border-slate-300 shadow-sm hover:bg-slate-100 transition-colors">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Exportar</span>
                </button>
            </div>
        </div>
        
        {filteredInteractions.length > 0 ? (
        <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Total de Visitantes" value={kpis.totalVisitors} icon={<UsersIcon className="w-6 h-6"/>}/>
                <KpiCard title="Total de Atendimentos" value={kpis.totalInteractions} icon={<ClipboardListIcon className="w-6 h-6"/>}/>
                <KpiCard title="Média por Grupo" value={kpis.averageGroupSize} icon={<ScaleIcon className="w-6 h-6"/>}/>
                <KpiCard title="Nacionalidade Top" value={kpis.topNationality} icon={<GlobeIcon className="w-6 h-6"/>}/>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                     <h3 className="text-lg font-semibold text-slate-700 mb-4">Tendência de Visitantes</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="date" tick={{fontSize: 12}}/>
                                <YAxis allowDecimals={false}/>
                                <Tooltip />
                                <Line type="monotone" dataKey="visitantes" stroke="#3b82f6" strokeWidth={2} name="Visitantes" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4">Distribuição de Nacionalidades</h3>
                     <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={pieChartData} dataKey="visitantes" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                     {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, "Visitantes"]}/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Main Bar Chart */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-700 mb-4">
                    Visitantes por Nacionalidade ({periodLabels[period]})
                </h3>
                <div style={{ width: '100%', height: 500 }}>
                    <ResponsiveContainer>
                        <BarChart
                        data={nationalityData}
                        margin={{ top: 5, right: 20, left: -10, bottom: 95 }}
                        >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} tick={{fontSize: 12}} />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Legend verticalAlign="top" wrapperStyle={{paddingBottom: '20px'}} />
                        <Bar dataKey="visitantes" fill="#3b82f6" name="Nº de Visitantes" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
             {/* Profile Analysis */}
            <div className="bg-white p-6 rounded-xl shadow-md border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Análise do Perfil do Visitante</h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Motivos de Visita</h3>
                        {visitReasonData.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={visitReasonData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                    <XAxis type="number" allowDecimals={false}/>
                                    <YAxis type="category" dataKey="name" width={120} tick={{fontSize: 12}}/>
                                    <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                    <Bar dataKey="visitantes" fill="#10b981" name="Nº de Visitantes" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        ): ( <p className="text-center text-slate-500 py-10">Não existem dados sobre o motivo da visita para o período selecionado.</p>) }
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-4 text-center">Top Duração da Estadia</h3>
                        {lengthOfStayData.length > 0 ? (
                            <div style={{ width: '100%', height: 300 }}>
                                <ResponsiveContainer>
                                    <BarChart data={lengthOfStayData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                        <XAxis type="number" allowDecimals={false}/>
                                        <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}}/>
                                        <Tooltip formatter={(value: number) => [value, "Visitantes"]}/>
                                        <Bar dataKey="visitantes" fill="#f59e0b" name="Nº de Visitantes" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <p className="text-center text-slate-500 py-10">Não existem dados sobre a duração da estadia para o período selecionado.</p>
                        )}
                    </div>
                </div>
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