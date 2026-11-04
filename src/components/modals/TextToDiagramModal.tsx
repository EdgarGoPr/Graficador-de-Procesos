import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { generateDiagramFromNaturalText } from '../../services/autoLayoutAndGeneratorService';
import { DocumentExtractorService } from '../../services/documentExtractorService';
import {
  Wand2,
  X,
  FileText,
  Upload,
  RefreshCw,
  Sparkles,
  FileCheck
} from 'lucide-react';

export const TextToDiagramModal: React.FC = () => {
  const { isTextToDiagramModalOpen, setTextToDiagramModalOpen, showNotification, setActiveView } = useUiStore();
  const { currentProject, setProjectData, pushSnapshot } = useProjectStore();

  const [customTitle, setCustomTitle] = useState('');
  const [inputText, setInputText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isTextToDiagramModalOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    try {
      const extracted = await DocumentExtractorService.extractDocument(file);
      if (!customTitle.trim()) {
        setCustomTitle(extracted.title);
      }
      setInputText(extracted.content);
      setLoadedFileName(file.name);
      showNotification(`✨ Documento "${file.name}" interpretado con éxito (${extracted.wordCount} palabras).`, 'success');
    } catch (err: any) {
      showNotification(err.message || 'Error al procesar el archivo seleccionado.', 'error');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleGenerateFromText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      showNotification('Abre o crea primero un proyecto para generar el diagrama en el lienzo.', 'warning');
      return;
    }
    if (!inputText.trim()) {
      showNotification('Escribe, pega o carga un documento con la descripción del proceso.', 'warning');
      return;
    }

    pushSnapshot('Antes de generar diagrama automático desde texto/documento');
    const updated = generateDiagramFromNaturalText(
      currentProject,
      inputText,
      customTitle.trim() || undefined
    );
    setProjectData(updated);
    setActiveView('CANVAS');
    setTextToDiagramModalOpen(false);
    showNotification('✨ ¡Diagrama BPMN 2.0 y Carriles generados y auto-alineados con éxito!', 'success');
  };

  const vaultItems = currentProject?.documentationVault?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl max-h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border bg-theme-surface-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500/20 to-purple-500/20 border border-sky-500/40 text-sky-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-theme-text flex items-center gap-2">
                <span>Generador Inteligente de Diagramas BPMN con IA</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </h2>
              <p className="text-xs text-theme-text-muted">
                Transforma texto escrito o documentos cargados por el usuario en carriles, tareas, decisiones y conectores con 1 clic.
              </p>
            </div>
          </div>

          <button
            onClick={() => setTextToDiagramModalOpen(false)}
            className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleGenerateFromText} className="space-y-4">
            {/* Título del Proceso */}
            <div>
              <label className="block text-[11px] font-mono font-bold text-theme-text-muted uppercase mb-1">
                Título del Proceso (Opcional - actualiza la cabecera)
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={currentProject?.documentControl.documentTitle || 'Ej: Procedimiento de Atención y Resolución de Reclamos'}
                className="w-full px-3.5 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text focus:border-theme-accent focus:outline-none"
              />
            </div>

            {/* Zona de Carga de Documentos (Requerimiento 5b) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-purple-500/10 to-indigo-500/10 border border-sky-500/30 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-theme-text">
                  <Upload className="w-4 h-4 text-sky-400 shrink-0" />
                  <span>Cargar Documento para Interpretación IA (.pdf, .docx, .txt, .md)</span>
                </div>
                <p className="text-[11px] text-theme-text-muted truncate">
                  {loadedFileName ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <FileCheck className="w-3.5 h-3.5" />
                      Documento activo: {loadedFileName}
                    </span>
                  ) : (
                    'Sube una ordenanza, manual, instructivo o descripción y la IA extraerá las etapas operativas.'
                  )}
                </p>
              </div>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.doc,.txt,.md,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isExtracting}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-theme-surface hover:bg-sky-500/20 border border-sky-500/40 text-xs font-bold text-sky-400 hover:text-white transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extrayendo...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Examinar Archivo</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Importar desde Bóveda de Documentación */}
            {vaultItems.length > 0 && (
              <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-theme-accent font-bold flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" />
                  Importar desde tu Bóveda Documental:
                </span>
                {vaultItems.map((vi) => (
                  <button
                    key={vi.id}
                    type="button"
                    onClick={() => {
                      setInputText(vi.content);
                      setLoadedFileName(vi.title);
                      if (!customTitle.trim()) setCustomTitle(vi.title);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-theme-surface hover:bg-theme-accent/20 border border-theme-border text-[11px] text-theme-text font-medium cursor-pointer"
                  >
                    {vi.title}
                  </button>
                ))}
              </div>
            )}

            {/* Descripción escrita de pasos (Requerimiento 5a) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-mono font-bold text-theme-text-muted uppercase">
                  Describe o edita los pasos del proceso *
                </label>
                <span className="text-[11px] text-emerald-400 font-mono">
                  Detecta automáticamente Áreas, Roles, Decisiones (&quot;si cumple...&quot;) y SLAs
                </span>
              </div>
              <textarea
                rows={9}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                required
                placeholder="Escribe cada paso en una línea o carga un documento arriba. Ejemplo:&#10;1. Mesa de Entradas recibe la solicitud y valida los requisitos en el sistema.&#10;2. Mesa de Entradas verifica si cumple con la documentación obligatoria.&#10;3. Asuntos Jurídicos emite el dictamen legal vinculante..."
                className="w-full p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text leading-relaxed focus:border-theme-accent focus:outline-none font-sans"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-theme-text-muted">
                💡 Puedes deshacer la acción en cualquier momento con <kbd className="px-1.5 py-0.5 rounded bg-theme-surface-subtle border border-theme-border font-mono">Ctrl+Z</kbd>.
              </p>
              <button
                type="submit"
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <Wand2 className="w-4 h-4" />
                <span>Construir y Auto-Alinear Diagrama en el Lienzo</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
