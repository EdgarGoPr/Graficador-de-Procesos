import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { generateSipocMatrix } from '../../services/sipocEngine';
import {
  Table,
  Search,
  Download,
  ShieldCheck,
  Server,
  Layers,
  ArrowRight,
  Sparkles,
  Scale
} from 'lucide-react';
import { useUiStore } from '../../store/useUiStore';

export const SipocMatrixView: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { showNotification } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');

  const sipocEntries = useMemo(() => {
    if (!currentProject) return [];
    return generateSipocMatrix(
      currentProject.nodes,
      currentProject.edges,
      currentProject.pools
    );
  }, [currentProject]);

  const filteredEntries = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return sipocEntries.filter(
      (e) =>
        e.processStage.toLowerCase().includes(term) ||
        e.supplier.toLowerCase().includes(term) ||
        e.input.toLowerCase().includes(term) ||
        e.output.toLowerCase().includes(term) ||
        e.customer.toLowerCase().includes(term) ||
        e.standardId.toLowerCase().includes(term) ||
        e.laneName.toLowerCase().includes(term)
    );
  }, [sipocEntries, searchTerm]);

  const handleExportCsv = () => {
    if (sipocEntries.length === 0) return;

    const headers = [
      'ID',
      'Carril / Rol',
      'Proveedor (Supplier)',
      'Insumos / Entrada (Input)',
      'Etapa del Proceso (Process)',
      'Salida / Entregable (Output)',
      'Cliente / Receptor (Customer)',
      'Sistema TI',
      'Marco Legal',
      'Punto de Control'
    ];

    const rows = sipocEntries.map((e) => [
      `"${e.standardId}"`,
      `"${e.laneName}"`,
      `"${e.supplier.replace(/"/g, '""')}"`,
      `"${e.input.replace(/"/g, '""')}"`,
      `"${e.processStage.replace(/"/g, '""')}"`,
      `"${e.output.replace(/"/g, '""')}"`,
      `"${e.customer.replace(/"/g, '""')}"`,
      `"${e.itSystem}"`,
      `"${e.legalBasis}"`,
      `"${e.qualityCheckpointCode || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sipoc_${currentProject?.fileName?.replace('.json', '') || 'matriz'}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showNotification('Matriz SIPOC exportada a CSV', 'success');
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        No hay proyecto seleccionado para generar la matriz SIPOC.
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 md:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center space-x-2 text-pink-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>ISO 9001:2015 &bull; Cláusula 4.4 (Enfoque por Procesos)</span>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-100">
              Matriz SIPOC Sincronizada
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {currentProject.documentControl.documentTitle} ({currentProject.documentControl.documentCode})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Filtrar por proveedor, insumo, proceso, salida o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>
          <div className="text-xs font-mono text-slate-400">
            {filteredEntries.length} registro{filteredEntries.length === 1 ? '' : 's'} SIPOC
          </div>
        </div>

        {/* SIPOC Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90 shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-300 font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3 w-16 text-center">ID</th>
                <th className="p-3 text-cyan-400">Suppliers (S)</th>
                <th className="p-3 text-blue-400">Inputs (I)</th>
                <th className="p-3 text-amber-400">Process Stage (P)</th>
                <th className="p-3 text-emerald-400">Outputs (O)</th>
                <th className="p-3 text-purple-400">Customers (C)</th>
                <th className="p-3">Sistema / Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEntries.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-800/40 transition-colors text-slate-300"
                >
                  {/* Standard ID */}
                  <td className="p-3 text-center font-mono font-bold text-cyan-400 bg-slate-950/40">
                    {row.standardId}
                  </td>

                  {/* Supplier */}
                  <td className="p-3 font-medium text-cyan-200/90 max-w-[150px]">
                    <div className="line-clamp-2">{row.supplier}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{row.laneName}</div>
                  </td>

                  {/* Input */}
                  <td className="p-3 text-slate-300 max-w-[180px]">
                    <div className="line-clamp-3 leading-relaxed">{row.input}</div>
                  </td>

                  {/* Process Stage */}
                  <td className="p-3 font-bold text-slate-100 max-w-[180px]">
                    <div className="line-clamp-2">{row.processStage}</div>
                    {row.legalBasis && row.legalBasis !== 'N/A' && (
                      <div className="text-[10px] text-amber-400/80 font-mono mt-1 flex items-center">
                        <Scale className="w-2.5 h-2.5 mr-1 shrink-0" />
                        <span className="truncate">{row.legalBasis}</span>
                      </div>
                    )}
                  </td>

                  {/* Output */}
                  <td className="p-3 text-emerald-300 max-w-[180px]">
                    <div className="line-clamp-3 leading-relaxed">{row.output}</div>
                  </td>

                  {/* Customer */}
                  <td className="p-3 font-medium text-purple-300 max-w-[150px]">
                    <div className="line-clamp-2">{row.customer}</div>
                  </td>

                  {/* Systems & Checkpoint */}
                  <td className="p-3 space-y-1 max-w-[140px]">
                    <div className="flex items-center text-[10px] font-mono text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{row.itSystem}</span>
                    </div>
                    {row.qualityCheckpointCode && (
                      <div className="flex items-center text-[10px] font-bold text-pink-300 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-900/40">
                        <ShieldCheck className="w-2.5 h-2.5 mr-1 shrink-0" />
                        <span>{row.qualityCheckpointCode}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
