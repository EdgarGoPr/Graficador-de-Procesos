import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { downloadPngFile, downloadSvgFile } from '../../services/imageExportService';
import { exportMultiPageDiagramPdf } from '../../services/pdfDiagramExportService';
import { exportFullStandardizedManualPdf } from '../../services/pdfFullManualExportService';
import { downloadBpmnXmlFile } from '../../services/bpmnXmlExporter';
import { downloadDocxManual } from '../../services/docxExportService';
import {
  Download,
  Image,
  Code,
  FileText,
  X,
  Sparkles,
  Layers,
  ArrowDownToLine,
  Printer,
  ShieldCheck
} from 'lucide-react';

interface ExportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportCenterModal: React.FC<ExportCenterModalProps> = ({ isOpen, onClose }) => {
  const { currentProject } = useProjectStore();
  const { showNotification } = useUiStore();
  const [isExporting, setIsExporting] = useState<string | null>(null);

  if (!isOpen || !currentProject) return null;

  const handleExportFullManualPdf = async () => {
    try {
      setIsExporting('full-manual-pdf');
      const fileName = await exportFullStandardizedManualPdf(currentProject);
      showNotification(`Manual Oficial PDF generado exitosamente: ${fileName}`, 'success');
      onClose();
    } catch (e) {
      showNotification('Error al compilar el Manual Oficial en PDF', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdfDiagram = async () => {
    try {
      setIsExporting('pdf');
      const fileName = await exportMultiPageDiagramPdf(currentProject, currentProject.printFrames, {
        themeMode: 'light',
        includeHeaderFooter: true,
      });
      showNotification(`PDF generado exitosamente: ${fileName}`, 'success');
      onClose();
    } catch (e) {
      showNotification('Error al exportar Diagrama PDF', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPng = async () => {
    try {
      setIsExporting('png');
      await downloadPngFile(currentProject, 3);
      showNotification('Imagen PNG HD descargada correctamente', 'success');
      onClose();
    } catch (e) {
      showNotification('Error al generar imagen PNG', 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportSvg = () => {
    downloadSvgFile(currentProject);
    showNotification('Diagrama SVG vectorial descargado', 'success');
    onClose();
  };

  const handleExportBpmnXml = () => {
    downloadBpmnXmlFile(currentProject);
    showNotification('Archivo BPMN 2.0 XML (.bpmn) exportado', 'success');
    onClose();
  };

  const handleExportWord = () => {
    downloadDocxManual(currentProject);
    showNotification('Manual de Procedimientos en Word exportado', 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Centro de Exportación & Documentación Oficial</h2>
              <p className="text-xs text-theme-text-muted">
                Genera el Manual Integral en PDF y artefactos estándar BPMN 2.0 / ISO 9001
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
          {/* 0. DESTACADO: MANUAL INTEGRAL ESTANDARIZADO EN PDF (ISO 9001 COMPLETO) */}
          <div
            onClick={handleExportFullManualPdf}
            className="sm:col-span-2 p-5 rounded-2xl bg-gradient-to-r from-sky-500/15 via-emerald-500/10 to-theme-surface-subtle border-2 border-sky-500/50 hover:border-sky-400 cursor-pointer group transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg"
          >
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/40">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                  ★ RECOMENDADO • AUTOMATIZACIÓN TOTAL ISO 9001
                </span>
              </div>
              <h3 className="text-base font-extrabold text-theme-text group-hover:text-sky-400 transition-colors">
                Manual Oficial de Procedimientos Estandarizado en PDF (Integral)
              </h3>
              <p className="text-xs text-theme-text-muted leading-relaxed">
                Compila automáticamente en un único PDF foliado: Portada institucional, Ficha de Control, Objetivo y Alcance, Mapa Gráfico BPMN, Descripción Paso a Paso por Rol, Matriz SIPOC, Matriz RACI, Riesgos, Firmas y Sello SHA-256.
              </p>
            </div>
            <div className="shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center space-x-2">
                <span>{isExporting === 'full-manual-pdf' ? 'Compilando Manual...' : 'Descargar Manual PDF'}</span>
                <ArrowDownToLine className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 1. PDF Multi-Página Diagram */}
          <div
            onClick={handleExportPdfDiagram}
            className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-sky-400 hover:bg-theme-surface cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:scale-110 transition-transform">
                  <Printer className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-sky-400">
                  .PDF (Láminas Mapa)
                </span>
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-sky-400 transition-colors">
                Láminas del Diagrama en PDF (Multi-Hoja)
              </h3>
              <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                Exporta exclusivamente el mapa gráfico en hojas A4/Carta/A3 con encuadre de recuadros y membrete técnico.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center text-xs font-semibold text-sky-400">
              <span>{isExporting === 'pdf' ? 'Generando PDF...' : 'Guardar PDF Diagrama'}</span>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* 2. PNG HD */}
          <div
            onClick={handleExportPng}
            className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-theme-accent hover:bg-theme-surface cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/30 group-hover:scale-110 transition-transform">
                  <Image className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-accent">
                  .PNG (HD)
                </span>
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-theme-accent transition-colors">
                Imagen PNG de Alta Resolución
              </h3>
              <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                Renderizado nítido del lienzo a 300 DPI, listo para pegar en presentaciones o informes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center text-xs font-semibold text-theme-accent">
              <span>{isExporting === 'png' ? 'Generando...' : 'Descargar Imagen HD'}</span>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* 3. SVG Vectorial */}
          <div
            onClick={handleExportSvg}
            className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-[#10B981] hover:bg-theme-surface cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 group-hover:scale-110 transition-transform">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-[#10B981]">
                  .SVG
                </span>
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-[#10B981] transition-colors">
                Diagrama Vectorial SVG
              </h3>
              <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                Gráfico vectorial puro con escalado infinito sin pixelación. Ideal para diseño gráfico e imprenta.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center text-xs font-semibold text-[#10B981]">
              <span>Descargar SVG Vectorial</span>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* 4. BPMN 2.0 XML */}
          <div
            onClick={handleExportBpmnXml}
            className="p-5 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-[#F59E0B] hover:bg-theme-surface cursor-pointer group transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 group-hover:scale-110 transition-transform">
                  <Code className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-[#F59E0B]">
                  .BPMN (XML)
                </span>
              </div>
              <h3 className="text-sm font-bold text-theme-text group-hover:text-[#F59E0B] transition-colors">
                BPMN 2.0 Estándar XML
              </h3>
              <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                XML oficial estándar OMG para abrir o importar en Camunda, Bizagi, Signavio o BonitaBPM.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-theme-border flex items-center text-xs font-semibold text-[#F59E0B]">
              <span>Exportar XML Oficial</span>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1.5 group-hover:translate-y-0.5 transition-transform" />
            </div>
          </div>

          {/* 5. Microsoft Word */}
          <div
            onClick={handleExportWord}
            className="sm:col-span-2 p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-[#3B82F6] hover:bg-theme-surface cursor-pointer group transition-all flex items-center justify-between"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-theme-text group-hover:text-[#3B82F6] transition-colors">
                  Manual Editable en Microsoft Word (.DOC / .DOCX)
                </h3>
                <p className="text-xs text-theme-text-muted">
                  Documento estructurado en formato Word para edición libre adicional.
                </p>
              </div>
            </div>
            <div className="flex items-center text-xs font-semibold text-[#3B82F6]">
              <span>Descargar Word</span>
              <ArrowDownToLine className="w-3.5 h-3.5 ml-1.5" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between">
          <span className="text-xs text-theme-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
            Todos los formatos se generan de forma nativa y estandarizada en tu navegador.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text rounded-lg text-xs font-semibold border border-theme-border transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
