import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { generateDiagramFromNaturalText } from '../../services/autoLayoutAndGeneratorService';
import {
  Sparkles,
  Wand2,
  LayoutTemplate,
  X,
  FileText,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

interface BuiltInTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  stepsText: string;
}

const BUILTIN_TEMPLATES: BuiltInTemplate[] = [
  {
    id: 'tpl_mesa_entradas',
    title: 'Recepción, Admisión y Resolución de Trámites / Reclamos',
    category: 'Atención Ciudadana & Gestión Documental',
    description: 'Flujo completo con Mesa de Entradas, análisis técnico, compuerta de admisibilidad, dictamen legal y resolución final.',
    stepsText: [
      'El Operador de Mesa de Entradas recibe la solicitud del ciudadano y valida la documentación obligatoria en GDE.',
      'El Operador de Mesa de Entradas verifica si cumple con los requisitos formales de admisibilidad.',
      'El Analista Técnico de Procesos evalúa los antecedentes técnicos e incorpora el informe de situación al expediente.',
      'El Abogado Dictaminante revisa la legalidad del trámite y emite el dictamen jurídico vinculante.',
      'El Supervisor o Autoridad de Aprobación controla la calidad final, firma digitalmente la resolución y notifica al solicitante.'
    ].join('\n')
  },
  {
    id: 'tpl_compras',
    title: 'Circuito de Compras, Contrataciones y Orden de Pago',
    category: 'Administración, Compras y Finanzas',
    description: 'Procedimiento administrativo desde el requerimiento de compra y reserva presupuestaria hasta la adjudicación y liquidación.',
    stepsText: [
      'El Analista Técnico de Procesos registra la solicitud de provisión de bienes o servicios detallando especificaciones técnicas.',
      'El Analista Contable y Presupuestario verifica si existe partida presupuestaria disponible y realiza la imputación preventiva en el ERP.',
      'El Analista Contable y Presupuestario gestiona la compulsa de precios con proveedores y elabora el cuadro comparativo de ofertas.',
      'El Abogado Dictaminante controla el pliego y emite dictamen legal sobre el acto de adjudicación.',
      'El Supervisor o Autoridad de Aprobación aprueba la adjudicación, emite la Orden de Compra y autoriza la liquidación del pago.'
    ].join('\n')
  },
  {
    id: 'tpl_dictamen_legal',
    title: 'Sustanciación de Sumario / Expediente y Dictamen Jurídico',
    category: 'Asuntos Jurídicos & Normativa',
    description: 'Flujo de instrucción legal, control de plazos perentorios, descargo, producción de prueba y acto resolutivo.',
    stepsText: [
      'El Operador de Mesa de Entradas caratula las actuaciones administrativas y remite el expediente a Asuntos Jurídicos.',
      'El Abogado Dictaminante analiza la procedencia legal, dispone la apertura a prueba y notifica la cédula de descargo.',
      'El Abogado Dictaminante verifica si se presentaron pruebas o descargos dentro del plazo legal perentorio.',
      'El Abogado Dictaminante elabora el proyecto de resolución fundada conforme a la Ley 19.549.',
      'El Supervisor o Autoridad de Aprobación suscribe con firma digital el acto administrativo firme y ordena su protocolo.'
    ].join('\n')
  },
  {
    id: 'tpl_calidad_iso',
    title: 'Auditoría Interna de Calidad, Hallazgos y Acciones Correctivas (ISO 9001)',
    category: 'Gobernanza & Calidad ISO 9001:2015',
    description: 'Ciclo de auditoría de procesos, detección de no conformidades, plan de mitigación y verificación de eficacia.',
    stepsText: [
      'El Analista Técnico de Procesos releva la ejecución operativa del procedimiento y ejecuta la lista de verificación ISO 9001.',
      'El Analista Técnico de Procesos verifica si existen desvíos de SLA o no conformidades documentales.',
      'El Operador de Mesa de Entradas o área auditada registra la causa raíz y propone el plan de acción correctiva.',
      'El Supervisor o Autoridad de Aprobación valida la eficacia de los controles mitigantes y certifica la versión vigente del manual.'
    ].join('\n')
  }
];

export const TextToDiagramModal: React.FC = () => {
  const { isTextToDiagramModalOpen, setTextToDiagramModalOpen, showNotification, setActiveView } = useUiStore();
  const { currentProject, setProjectData, pushSnapshot } = useProjectStore();

  const [mode, setMode] = useState<'TEXT_AI' | 'TEMPLATES'>('TEXT_AI');
  const [customTitle, setCustomTitle] = useState('');
  const [inputText, setInputText] = useState(BUILTIN_TEMPLATES[0].stepsText);

  if (!isTextToDiagramModalOpen) return null;

  const handleGenerateFromText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProject) {
      showNotification('Abre o crea primero un proyecto para generar el diagrama en el lienzo.', 'warning');
      return;
    }
    if (!inputText.trim()) {
      showNotification('Escribe o pega al menos un par de oraciones describiendo el proceso.', 'warning');
      return;
    }

    pushSnapshot('Antes de generar diagrama automático desde texto');
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

  const handleApplyTemplate = (tpl: BuiltInTemplate) => {
    if (!currentProject) {
      showNotification('Abre o crea primero un proyecto para aplicar la plantilla.', 'warning');
      return;
    }
    pushSnapshot(`Aplicar plantilla: ${tpl.title}`);
    const updated = generateDiagramFromNaturalText(currentProject, tpl.stepsText, tpl.title);
    setProjectData(updated);
    setActiveView('CANVAS');
    setTextToDiagramModalOpen(false);
    showNotification(`✨ Plantilla "${tpl.title}" aplicada al lienzo con éxito`, 'success');
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
              <h2 className="text-base font-extrabold text-theme-text">
                Generador Inteligente de Diagramas BPMN & Biblioteca de Plantillas
              </h2>
              <p className="text-xs text-theme-text-muted">
                Ahorra horas de trabajo: transforma cualquier texto o plantilla en carriles, tareas, decisiones y conectores con 1 clic.
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

        {/* Mode Selector Tabs */}
        <div className="px-6 py-2.5 bg-theme-surface border-b border-theme-border flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setMode('TEXT_AI')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'TEXT_AI'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Texto / Audio a Diagrama BPMN (1-Clic)</span>
          </button>

          <button
            onClick={() => setMode('TEMPLATES')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mode === 'TEMPLATES'
                ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Biblioteca de Plantillas Pre-Armadas ({BUILTIN_TEMPLATES.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {mode === 'TEXT_AI' ? (
            <form onSubmit={handleGenerateFromText} className="space-y-4">
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

              {vaultItems.length > 0 && (
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono text-theme-accent font-bold flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    Importar texto desde tu Bóveda IA:
                  </span>
                  {vaultItems.map((vi) => (
                    <button
                      key={vi.id}
                      type="button"
                      onClick={() => setInputText(vi.content)}
                      className="px-2.5 py-1 rounded-lg bg-theme-surface hover:bg-theme-accent/20 border border-theme-border text-[11px] text-theme-text font-medium cursor-pointer"
                    >
                      {vi.title}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono font-bold text-theme-text-muted uppercase">
                    Describe los pasos del proceso (1 oración o párrafo por etapa) *
                  </label>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Detecta automáticamente Áreas, Roles, Decisiones (&quot;si cumple...&quot;) y SLAs
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  required
                  placeholder="Escribe cada paso en una línea. Ejemplo:&#10;1. Mesa de Entradas recibe la solicitud y valida los requisitos.&#10;2. Mesa de Entradas verifica si cumple con la documentación.&#10;3. Asuntos Jurídicos emite el dictamen legal..."
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {BUILTIN_TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-theme-accent transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
                      {tpl.category}
                    </span>
                    <h3 className="text-sm font-bold text-theme-text mt-2">{tpl.title}</h3>
                    <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                      {tpl.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-theme-border flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomTitle(tpl.title);
                        setInputText(tpl.stepsText);
                        setMode('TEXT_AI');
                      }}
                      className="text-xs text-theme-text-muted hover:text-theme-text underline cursor-pointer"
                    >
                      Personalizar pasos antes
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Usar Plantilla Ahora</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

