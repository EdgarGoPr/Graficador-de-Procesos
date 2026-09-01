import React, { useMemo, useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { generateSipocMatrix } from '../../services/sipocEngine';
import {
  Search,
  Download,
  ShieldCheck,
  Server,
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
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar la matriz SIPOC.
      </div>
    );
  }

  return (
    <div className="flex-1 h-full overflow-y-auto bg-theme-bg p-6 md:p-10 select-none transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xl">
          <div>
            <div className="flex items-center space-x-2 text-[#10B981] text-xs font-mono font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>ISO 9001:2015 &bull; Cláusula 4.4 (Enfoque por Procesos)</span>
            </div>
            <h2 className="text-2xl font-extrabold text-theme-text">
              Matriz SIPOC Sincronizada
            </h2>
            <p className="text-xs text-theme-text-muted mt-1">
              {currentProject.documentControl.documentTitle} ({currentProject.documentControl.documentCode})
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center space-x-2 px-3.5 py-2 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-xl text-xs font-semibold border border-theme-border transition-colors"
            >
              <Download className="w-4 h-4 text-theme-accent" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Filtrar por proveedor, insumo, proceso, salida o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none"
            />
          </div>
          <div className="text-xs font-mono text-theme-text-muted">
            {filteredEntries.length} registro{filteredEntries.length === 1 ? '' : 's'} SIPOC
          </div>
        </div>

        {/* SIPOC Table */}
        <div className="overflow-x-auto rounded-xl border border-theme-border bg-theme-surface shadow-xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme-border bg-theme-surface-subtle text-theme-text font-mono text-[11px] uppercase tracking-wider">
                <th className="p-3 w-16 text-center">ID</th>
                <th className="p-3 text-theme-accent">Suppliers (S)</th>
                <th className="p-3 text-[#3B82F6]">Inputs (I)</th>
                <th className="p-3 text-[#F59E0B]">Process Stage (P)</th>
                <th className="p-3 text-[#10B981]">Outputs (O)</th>
                <th className="p-3 text-theme-accent">Customers (C)</th>
                <th className="p-3">Sistema / Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {filteredEntries.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-theme-surface-hover/50 transition-colors text-theme-text"
                >
                  {/* Standard ID */}
                  <td className="p-3 text-center font-mono font-bold text-theme-accent bg-theme-surface-subtle/50">
                    {row.standardId}
                  </td>

                  {/* Supplier */}
                  <td className="p-3 font-medium text-theme-text max-w-[150px]">
                    <div className="line-clamp-2">{row.supplier}</div>
                    <div className="text-[10px] text-theme-text-muted font-mono mt-0.5">{row.laneName}</div>
                  </td>

                  {/* Input */}
                  <td className="p-3 text-theme-text-muted max-w-[180px]">
                    <div className="line-clamp-3 leading-relaxed">{row.input}</div>
                  </td>

                  {/* Process Stage */}
                  <td className="p-3 font-bold text-theme-text max-w-[180px]">
                    <div className="line-clamp-2">{row.processStage}</div>
                    {row.legalBasis && row.legalBasis !== 'N/A' && (
                      <div className="text-[10px] text-[#F59E0B] font-mono mt-1 flex items-center">
                        <Scale className="w-2.5 h-2.5 mr-1 shrink-0" />
                        <span className="truncate">{row.legalBasis}</span>
                      </div>
                    )}
                  </td>

                  {/* Output */}
                  <td className="p-3 text-[#10B981] max-w-[180px]">
                    <div className="line-clamp-3 leading-relaxed font-medium">{row.output}</div>
                  </td>

                  {/* Customer */}
                  <td className="p-3 font-medium text-theme-accent max-w-[150px]">
                    <div className="line-clamp-2">{row.customer}</div>
                  </td>

                  {/* Systems & Checkpoint */}
                  <td className="p-3 space-y-1 max-w-[140px]">
                    <div className="flex items-center text-[10px] font-mono text-theme-accent bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border">
                      <Server className="w-2.5 h-2.5 mr-1 shrink-0" />
                      <span className="truncate">{row.itSystem}</span>
                    </div>
                    {row.qualityCheckpointCode && (
                      <div className="flex items-center text-[10px] font-bold text-[#10B981] bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
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

