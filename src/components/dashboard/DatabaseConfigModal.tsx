import React, { useState, useEffect } from 'react';
import { NeonClient } from '../../services/neonClient';
import { StorageService } from '../../services/storageService';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  UploadCloud,
  Zap,
  Key,
  Eye,
  EyeOff,
  Server,
  Layers
} from 'lucide-react';

interface DatabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DatabaseConfigModal: React.FC<DatabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const { refreshProjectList } = useProjectStore();
  const { showNotification } = useUiStore();

  const [connectionString, setConnectionString] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; latencyMs?: number; error?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ succeeded: number; failed: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = NeonClient.getConnectionString() || '';
      setConnectionString(current);
      setTestResult(null);
      setSyncResult(null);
      if (current) {
        handleTest(current);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async (urlToTest?: string) => {
    setIsTesting(true);
    setTestResult(null);
    const target = urlToTest || connectionString;
    const res = await NeonClient.testConnection(target);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSave = async () => {
    const clean = connectionString.trim();
    NeonClient.setConnectionString(clean.length > 0 ? clean : null);
    await refreshProjectList();
    showNotification(
      clean ? '✅ Base de datos Neon configurada y conectada' : 'ℹ️ Modo local/offline activado',
      'success'
    );
    onClose();
  };

  const handleDisconnect = async () => {
    NeonClient.setConnectionString(null);
    setConnectionString('');
    setTestResult(null);
    await refreshProjectList();
    showNotification('Desconectado de Neon. Usando persistencia local.', 'info');
  };

  const handleSyncToNeon = async () => {
    if (!NeonClient.isConfigured()) {
      showNotification('Primero debes configurar y conectar la base de datos Neon.', 'error');
      return;
    }

    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await StorageService.syncAllLocalProjectsToNeon();
      setSyncResult(res);
      await refreshProjectList();
      showNotification(
        `✅ Sincronización completa: ${res.succeeded} proyecto(s) subidos a Neon.`,
        'success'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showNotification(`Error al sincronizar: ${msg}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const isConnected = testResult?.ok === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border bg-theme-surface-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-theme-accent/10 border border-theme-accent/20 text-theme-accent">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Conexión a Base de Datos Cloud (Neon)</h2>
              <p className="text-xs text-theme-text-muted">PostgreSQL Serverless & Persistencia Híbrida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-theme-border bg-theme-bg/60">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Server className="w-5 h-5 text-theme-text-muted" />
                <span
                  className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${
                    isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-text">
                  {isConnected
                    ? 'Conectado a Neon PostgreSQL'
                    : connectionString
                    ? 'Desconectado o comprobando...'
                    : 'Modo Local / USB (Sin Base de Datos Cloud)'}
                </p>
                <p className="text-[11px] text-theme-text-muted">
                  {isConnected && testResult?.latencyMs !== undefined
                    ? `Latencia de red: ${testResult.latencyMs} ms`
                    : 'Los cambios se almacenan en disco local / localStorage'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleTest()}
              disabled={isTesting || !connectionString.trim()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-theme-surface hover:bg-theme-surface-subtle border border-theme-border text-theme-text disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>Probar</span>
            </button>
          </div>

          {/* Connection Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2.5 ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {testResult.ok ? 'Conexión verificada con éxito' : 'Error al conectar con la base de datos'}
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  {testResult.ok
                    ? `Respuesta del servidor recibida en ${testResult.latencyMs}ms. Tablas e índices listos.`
                    : testResult.error}
                </p>
              </div>
            </div>
          )}

          {/* Connection String Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-theme-text uppercase tracking-wider flex items-center justify-between">
              <span>Cadena de Conexión de Neon (Connection String)</span>
              <span className="text-[11px] font-normal lowercase text-theme-text-muted">
                postgresql://...
              </span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="postgresql://neondb_owner:***@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
                value={connectionString}
                onChange={(e) => {
                  setConnectionString(e.target.value);
                  setTestResult(null);
                }}
                className="w-full pl-9 pr-10 py-2.5 bg-theme-bg border border-theme-border rounded-xl text-xs text-theme-text font-mono placeholder-theme-text-muted/50 focus:border-theme-accent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-text-muted hover:text-theme-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-theme-text-muted">
              Obtén esta URL en la consola de <strong>Neon.tech</strong> &rarr; <em>Dashboard</em> &rarr; <em>Connection details</em>.
            </p>
          </div>

          {/* Bulk Sync Section */}
          <div className="p-4 rounded-xl border border-theme-border bg-theme-surface-subtle/50 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-theme-text">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Sincronizador de Proyectos Locales a Neon</span>
            </div>
            <p className="text-xs text-theme-text-muted">
              Sube de forma masiva los proyectos oficiales y diagramas existentes en tu pendrive USB o navegador hacia tu base de datos Neon.
            </p>

            <button
              onClick={handleSyncToNeon}
              disabled={isSyncing || !connectionString.trim()}
              className="flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-40"
            >
              <Zap className={`w-4 h-4 ${isSyncing ? 'animate-bounce' : ''}`} />
              <span>{isSyncing ? 'Sincronizando proyectos...' : 'Sincronizar proyectos locales a Neon (1-Clic)'}</span>
            </button>

            {syncResult && (
              <div className="text-[11px] text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>
                  Sincronización finalizada: {syncResult.succeeded} guardados correctamente
                  {syncResult.failed > 0 ? `, ${syncResult.failed} fallidos` : ''}.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-theme-border bg-theme-surface-subtle">
          <button
            onClick={handleDisconnect}
            className="text-xs text-theme-text-muted hover:text-red-400 font-semibold transition-colors"
          >
            Desconectar y usar local
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-theme-text hover:bg-theme-border transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-theme-accent hover:bg-theme-accent-hover text-white shadow-lg transition-all"
            >
              Guardar y Conectar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
