import React, { useState, useEffect, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import {
  X,
  Sparkles,
  FileText,
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Plus,
  Key,
  CheckCircle2,
  AlertCircle,
  Upload,
  Clock,
  Volume2,
  BookOpen,
  Info,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { webAudioRecorder, AudioRecordingResult } from '../../services/webAudioRecorder';
import {
  AiRecommendationService,
  getGeminiApiKey,
  setGeminiApiKey
} from '../../services/aiRecommendationService';
import { DocumentExtractorService } from '../../services/documentExtractorService';
import { ProcessDocumentationItem } from '../../types/ai';

export const ProcessDocumentationModal: React.FC = () => {
  const { isDocumentationModalOpen, setDocumentationModalOpen, showNotification } = useUiStore();
  const {
    currentProject,
    addDocumentationItem,
    removeDocumentationItem,
    updateDocumentationGlobalNotes
  } = useProjectStore();

  const [activeTab, setActiveTab] = useState<'TEXTS' | 'AUDIOS' | 'SETTINGS'>('TEXTS');

  // Text Form State
  const [textTitle, setTextTitle] = useState('');
  const [textReference, setTextReference] = useState('');
  const [textContent, setTextContent] = useState('');
  const [globalNotes, setGlobalNotes] = useState('');

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedResult, setRecordedResult] = useState<AudioRecordingResult | null>(null);
  const [audioTitle, setAudioTitle] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Settings State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isExtractingDocument, setIsExtractingDocument] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isDocumentationModalOpen) {
      setApiKeyInput(getGeminiApiKey());
      setGlobalNotes(currentProject?.documentationVault?.globalNotes || '');
      setTestResult(null);
    }
  }, [isDocumentationModalOpen, currentProject]);

  if (!isDocumentationModalOpen) return null;

  const vault = currentProject?.documentationVault || { items: [] };
  const textItems = vault.items.filter((it) => it.type === 'TEXT');
  const audioItems = vault.items.filter((it) => it.type === 'AUDIO_TRANSCRIPTION');

  // --- Manejo de Documentación Escrita ---
  const handleAddText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textTitle.trim() || !textContent.trim()) {
      showNotification('Completa el título y el contenido del documento', 'error');
      return;
    }

    addDocumentationItem({
      type: 'TEXT',
      title: textTitle.trim(),
      sourceReference: textReference.trim() || undefined,
      content: textContent.trim()
    });

    showNotification('Documento agregado a la Bóveda del Proceso', 'success');
    setTextTitle('');
    setTextReference('');
    setTextContent('');
  };

  const handleSaveGlobalNotes = () => {
    updateDocumentationGlobalNotes(globalNotes);
    showNotification('Notas globales actualizadas', 'success');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('audio/')) {
      // Manejar archivo de audio subido
      handleUploadAudioFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsExtractingDocument(true);
    try {
      const extracted = await DocumentExtractorService.extractDocument(file);
      addDocumentationItem({
        type: 'TEXT',
        title: extracted.title,
        sourceReference: extracted.sourceReference,
        content: extracted.content
      });

      const detail = extracted.pageCount
        ? ` (${extracted.pageCount} páginas, ${extracted.wordCount} palabras)`
        : ` (${extracted.wordCount} palabras)`;

      showNotification(`Documento importado con éxito: ${file.name}${detail}`, 'success');
    } catch (err: any) {
      showNotification(`Error al importar documento: ${err.message}`, 'error');
    } finally {
      setIsExtractingDocument(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- Manejo de Audios ---
  const handleStartRecording = async () => {
    try {
      setRecordedResult(null);
      setRecordingSeconds(0);
      await webAudioRecorder.startRecording((sec) => setRecordingSeconds(sec));
      setIsRecording(true);
    } catch (err: any) {
      showNotification(`Error al acceder al micrófono: ${err.message}`, 'error');
    }
  };

  const handleStopRecording = async () => {
    try {
      const result = await webAudioRecorder.stopRecording();
      setIsRecording(false);
      setRecordedResult(result);
      setAudioTitle(`Nota de voz ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    } catch (err: any) {
      setIsRecording(false);
      showNotification(`Error al detener la grabación: ${err.message}`, 'error');
    }
  };

  const handleCancelRecording = () => {
    webAudioRecorder.cancel();
    setIsRecording(false);
    setRecordedResult(null);
    setRecordingSeconds(0);
  };

  const handleUploadAudioFile = async (file: File) => {
    setIsTranscribing(true);
    try {
      const blobUrl = URL.createObjectURL(file);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const base64Audio = result.includes(',') ? result.split(',')[1] : result;

        let transcription = '';
        try {
          transcription = await AiRecommendationService.transcribeAudio(base64Audio, file.type || 'audio/webm');
        } catch (transcribeErr: any) {
          console.warn('Transcripción fallida:', transcribeErr);
          transcription = '(Audio subido sin transcripción automática)';
        }

        addDocumentationItem({
          type: 'AUDIO_TRANSCRIPTION',
          title: file.name.replace(/\.[^/.]+$/, ''),
          sourceReference: `Archivo de audio: ${file.name}`,
          content: transcription,
          audioFileName: file.name,
          audioBlobUrl: blobUrl
        });

        setIsTranscribing(false);
        showNotification(`Audio subido y registrado con éxito`, 'success');
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsTranscribing(false);
      showNotification(`Error al procesar audio: ${err.message}`, 'error');
    }
  };

  const handleSaveRecordedAudio = async (withTranscription: boolean) => {
    if (!recordedResult) return;

    let transcription = '(Audio grabado pendiente de transcripción)';
    if (withTranscription) {
      setIsTranscribing(true);
      try {
        transcription = await AiRecommendationService.transcribeAudio(
          recordedResult.base64Audio,
          recordedResult.mimeType
        );
      } catch (err: any) {
        showNotification(`No se pudo transcribir: ${err.message}. Guardando audio sin transcripción.`, 'error');
      } finally {
        setIsTranscribing(false);
      }
    }

    addDocumentationItem({
      type: 'AUDIO_TRANSCRIPTION',
      title: audioTitle.trim() || 'Nota de voz grabada',
      sourceReference: `Grabación de micrófono (${recordedResult.durationSeconds}s)`,
      content: transcription,
      audioBlobUrl: recordedResult.blobUrl,
      audioDurationSeconds: recordedResult.durationSeconds
    });

    showNotification('Nota de voz guardada en la Bóveda del Proceso', 'success');
    setRecordedResult(null);
    setAudioTitle('');
    setRecordingSeconds(0);
  };

  // --- Manejo de Configuración ---
  const handleSaveApiKey = () => {
    setGeminiApiKey(apiKeyInput.trim());
    showNotification('Clave de API guardada localmente en tu navegador', 'success');
    setTestResult(null);
  };

  const handleTestApiKey = async () => {
    const keyToTest = apiKeyInput.trim();
    if (!keyToTest) {
      setTestResult({ ok: false, message: 'Ingresa una clave para probar.' });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${keyToTest}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Responde estrictamente con la palabra OK' }] }]
          })
        }
      );

      if (res.ok) {
        setTestResult({ ok: true, message: '¡Conexión exitosa con Gemini 3.5 Flash!' });
        setGeminiApiKey(keyToTest);
      } else {
        const errJson = await res.json().catch(() => null);
        setTestResult({
          ok: false,
          message: errJson?.error?.message || `Error HTTP ${res.status}`
        });
      }
    } catch (e: any) {
      setTestResult({ ok: false, message: e.message || 'Error de red al conectar con Google API' });
    } finally {
      setIsTestingKey(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-4xl max-h-[90vh] bg-theme-surface border border-theme-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                Bóveda Documental del Proceso & Contexto IA
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/25">
                  Nivel 1 Jerárquico
                </span>
              </h3>
              <p className="text-xs text-theme-text-muted">
                Textos normativos y audios que guían las recomendaciones de continuación sin desvíos
              </p>
            </div>
          </div>
          <button
            onClick={() => setDocumentationModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-theme-border bg-theme-surface px-6 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('TEXTS')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'TEXTS'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FileText className="w-4 h-4" />
            Documentación Escrita ({textItems.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIOS')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'AUDIOS'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Mic className="w-4 h-4" />
            Notas de Audio & Voz ({audioItems.length})
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'SETTINGS'
                ? 'border-violet-500 text-violet-400'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Key className="w-4 h-4" />
            Configuración Gemini AI
            {getGeminiApiKey() ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" title="Clave configurada" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" title="Clave requerida" />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DOCUMENTACIÓN ESCRITA */}
          {activeTab === 'TEXTS' && (
            <div className="space-y-6">
              {/* Formulario de Carga */}
              <form onSubmit={handleAddText} className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-violet-400" />
                    Cargar Nuevo Documento, Ordenanza o Manual
                  </h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".pdf,.docx,.doc,.txt,.md,.json,audio/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isExtractingDocument}
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs px-2.5 py-1 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Importar manual, normativa o audio (PDF, DOCX, TXT, MD, MP3, WAV...)"
                    >
                      {isExtractingDocument ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                          <span>Extrayendo texto...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-violet-400" />
                          <span>Importar Archivo (PDF, Word, TXT)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={textTitle}
                    onChange={(e) => setTextTitle(e.target.value)}
                    placeholder="Título del documento (ej: Manual de Faltas Art. 10 a 25)"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-violet-500"
                  />
                  <input
                    type="text"
                    value={textReference}
                    onChange={(e) => setTextReference(e.target.value)}
                    placeholder="Referencia normativa (ej: Decreto 230/2025, Pág. 4)"
                    className="w-full text-xs px-3 py-2 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-violet-500"
                  />
                </div>

                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Pega aquí el procedimiento, instrucciones paso a paso o normativa..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-violet-500 font-mono"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Guardar Documento en la Bóveda
                  </button>
                </div>
              </form>

              {/* Lista de Documentos */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Documentos Cargados ({textItems.length})
                </h4>

                {textItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-theme-border rounded-xl text-theme-text-muted">
                    <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                    <p className="text-xs">No hay documentos cargados en la bóveda de este proceso.</p>
                    <p className="text-[11px] mt-1">
                      Pega fragmentos normativos o importa manuales en PDF y Word (.docx) para que la IA fundamente sus recomendaciones.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {textItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border hover:border-violet-500/40 transition-colors group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-theme-text">{item.title}</span>
                              {item.sourceReference && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
                                  {item.sourceReference}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-theme-text-muted line-clamp-3 font-mono whitespace-pre-wrap">
                              {item.content}
                            </p>
                          </div>
                          <button
                            onClick={() => removeDocumentationItem(item.id)}
                            className="p-1.5 rounded-lg opacity-60 group-hover:opacity-100 hover:bg-rose-500/10 text-theme-text-muted hover:text-rose-400 transition-all"
                            title="Eliminar documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Notas Globales */}
              <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-4 h-4 text-sky-400" />
                    Notas y Directivas Operativas Globales
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveGlobalNotes}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text transition-colors"
                  >
                    Guardar Notas
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={globalNotes}
                  onChange={(e) => setGlobalNotes(e.target.value)}
                  placeholder="Directivas generales para todo el proceso (ej: 'Ningún expediente sale sin visto bueno de Asesoría Legal')..."
                  className="w-full text-xs px-3 py-2 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: AUDIOS Y NOTAS DE VOZ */}
          {activeTab === 'AUDIOS' && (
            <div className="space-y-6">
              {/* Grabadora Web con Micrófono */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-950/20 via-theme-surface-subtle to-indigo-950/20 border border-violet-500/30 text-center space-y-4">
                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-bold text-theme-text">Grabadora de Notas de Voz Web</h4>
                  <p className="text-xs text-theme-text-muted">
                    Graba instrucciones o explicaciones verbales. La IA transcribirá el audio y lo usará como base para sugerir el próximo nodo.
                  </p>
                </div>

                {/* Controles de Grabación */}
                <div className="flex items-center justify-center gap-4">
                  {!isRecording && !recordedResult && (
                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <Mic className="w-5 h-5 animate-pulse" />
                      Iniciar Grabación con Micrófono
                    </button>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 text-sm font-bold animate-pulse">
                        <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                        Grabando: {formatTimer(recordingSeconds)}
                      </div>
                      <button
                        type="button"
                        onClick={handleStopRecording}
                        className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Square className="w-4 h-4 fill-current" />
                        Finalizar
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelRecording}
                        className="px-3 py-2 rounded-full hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text text-xs transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>

                {/* Previsualización del Audio Grabado */}
                {recordedResult && (
                  <div className="p-4 rounded-xl bg-theme-surface border border-theme-border max-w-lg mx-auto space-y-3 animate-fadeIn text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-theme-text">
                        <Volume2 className="w-4 h-4 text-violet-400" />
                        Grabación Lista ({recordedResult.durationSeconds}s)
                      </div>
                      <button
                        onClick={() => setRecordedResult(null)}
                        className="text-xs text-theme-text-muted hover:text-rose-400"
                      >
                        Descartar
                      </button>
                    </div>

                    <audio src={recordedResult.blobUrl} controls className="w-full h-9 rounded" />

                    <input
                      type="text"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Nombre de la nota de voz..."
                      className="w-full text-xs px-3 py-2 rounded-lg bg-theme-surface-subtle border border-theme-border text-theme-text focus:outline-none focus:border-violet-500"
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        disabled={isTranscribing}
                        onClick={() => handleSaveRecordedAudio(false)}
                        className="text-xs px-3 py-2 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text transition-colors"
                      >
                        Guardar sin transcribir
                      </button>
                      <button
                        type="button"
                        disabled={isTranscribing}
                        onClick={() => handleSaveRecordedAudio(true)}
                        className="text-xs font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-500/20 transition-all flex items-center gap-2"
                      >
                        {isTranscribing ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Transcribiendo con IA...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Transcribir con IA y Guardar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de Audios Registrados */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Audios y Transcripciones ({audioItems.length})
                </h4>

                {audioItems.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-theme-border rounded-xl text-theme-text-muted">
                    <Mic className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-400" />
                    <p className="text-xs">No hay notas de voz registradas para este proceso.</p>
                    <p className="text-[11px] mt-1">
                      Graba con el micrófono o importa audios para enriquecer el contexto con voz hablada.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {audioItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border hover:border-violet-500/40 transition-colors space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-theme-text">{item.title}</span>
                              {item.audioDurationSeconds && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {item.audioDurationSeconds}s
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-theme-text-muted">
                              {item.sourceReference || 'Grabación de voz'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeDocumentationItem(item.id)}
                            className="p-1.5 rounded-lg opacity-60 group-hover:opacity-100 hover:bg-rose-500/10 text-theme-text-muted hover:text-rose-400 transition-all"
                            title="Eliminar audio"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.audioBlobUrl && (
                          <audio src={item.audioBlobUrl} controls className="w-full h-8 rounded" />
                        )}

                        <div className="p-2.5 rounded-lg bg-theme-surface border border-theme-border">
                          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block mb-1">
                            Transcripción para la IA:
                          </span>
                          <p className="text-xs text-theme-text-muted font-mono whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: CONFIGURACIÓN GEMINI AI */}
          {activeTab === 'SETTINGS' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* Explicación de Jerarquía */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-indigo-500/10 border border-violet-500/25 space-y-2">
                <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Jerarquía Estricta de Verdad (Anti-Alucinaciones)
                </div>
                <p className="text-xs text-theme-text-muted leading-relaxed">
                  Al solicitar una sugerencia en el menú radial, la IA consulta primero la documentación y audios cargados en esta bóveda (<strong>Nivel 1</strong>). Si no hay certidumbre suficiente o los datos divergen de la realidad del proceso, la IA arrojará transparentemente el mensaje <strong>&quot;No hay sugerencias&quot;</strong> antes que inventar un paso inexistente.
                </p>
              </div>

              {/* Formulario de Clave */}
              <div className="p-5 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-theme-text uppercase tracking-wider flex items-center justify-between">
                    <span>Google Gemini API Key</span>
                    {(import.meta as any).env?.VITE_GEMINI_API_KEY && (
                      <span className="text-[10px] text-emerald-400 font-semibold lowercase">
                        (detectada en .env)
                      </span>
                    )}
                  </label>
                  <p className="text-xs text-theme-text-muted">
                    Se almacena de forma segura en el navegador local (`localStorage`) o se lee desde `VITE_GEMINI_API_KEY`.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 text-xs px-3 py-2.5 rounded-lg bg-theme-surface border border-theme-border text-theme-text focus:outline-none focus:border-violet-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    className="px-4 py-2.5 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text text-xs font-semibold transition-colors"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    disabled={isTestingKey || !apiKeyInput}
                    onClick={handleTestApiKey}
                    className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isTestingKey ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    Probar Conexión
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      testResult.ok
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-theme-surface-subtle border-t border-theme-border flex items-center justify-between text-xs text-theme-text-muted">
          <span>{vault.items.length} elementos registrados en la memoria del proceso</span>
          <button
            onClick={() => setDocumentationModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text font-semibold transition-colors"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
