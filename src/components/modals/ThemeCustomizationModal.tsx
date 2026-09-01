import React, { useState } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { PRESET_THEMES, AppThemeId, ThemeColors } from '../../types/theme';
import {
  Palette,
  X,
  Check,
  Sparkles,
  Sun,
  Moon,
  Sliders,
  RotateCcw,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';

const CANVAS_BG_PRESETS = [
  { label: 'Carbón Profundo (BPMN)', color: '#18181B' },
  { label: 'Obsidiana Pizarra', color: '#0F172A' },
  { label: 'Azul Espacial (Cosmic)', color: '#0B0F19' },
  { label: 'Cyber Dark (Emerald)', color: '#0C1712' },
  { label: 'Púrpura Nebulosa', color: '#130D24' },
  { label: 'Gris Perla Suave', color: '#F1F3F5' },
  { label: 'Crema Solar Cálido', color: '#F3EDE2' },
  { label: 'Blanco Puro Studio', color: '#FFFFFF' }
];

export const ThemeCustomizationModal: React.FC = () => {
  const {
    isThemeModalOpen,
    setThemeModalOpen,
    currentThemeId,
    baseThemeId,
    setAppTheme,
    customThemeColors,
    updateCustomTheme,
    setCanvasBgColor,
    showNotification
  } = useUiStore();

  const [activeTab, setActiveTab] = useState<'PRESETS' | 'CANVAS' | 'CUSTOM'>('PRESETS');

  if (!isThemeModalOpen) return null;

  const currentColors = currentThemeId === 'custom'
    ? customThemeColors
    : PRESET_THEMES[currentThemeId].colors;

  const activeBase = PRESET_THEMES[baseThemeId] || PRESET_THEMES['antigravity-dark'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
                <span>Personalización de Temas y Colores</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
                  Antigravity IDE
                </span>
              </h3>
              <p className="text-xs text-theme-text-muted">
                Configurá temáticas integrales, fondos de pizarra y herencia de colores
              </p>
            </div>
          </div>
          <button
            onClick={() => setThemeModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-theme-surface text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Base Theme Info Banner */}
        <div className="px-4 py-2 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-theme-text-muted">
            <Info className="w-3.5 h-3.5 text-theme-accent shrink-0" />
            <span>
              Temática Base Activa: <strong className="text-theme-text">{activeBase.name}</strong>
              {currentThemeId === 'custom' && (
                <span className="ml-1 text-[10px] text-theme-accent font-mono font-semibold">(con personalizaciones activas)</span>
              )}
            </span>
          </div>
          {currentThemeId === 'custom' && (
            <button
              onClick={() => {
                setAppTheme(baseThemeId);
                showNotification(`Revertido a la temática base: ${activeBase.name}`);
              }}
              className="flex items-center space-x-1 text-[11px] text-theme-accent hover:underline font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restablecer a base</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="px-4 pt-3 border-b border-theme-border flex items-center space-x-2 bg-theme-surface-subtle/40">
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'PRESETS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>1. Seleccionar Temática Base</span>
          </button>

          <button
            onClick={() => setActiveTab('CANVAS')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'CANVAS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Fondo de la Pizarra</span>
          </button>

          <button
            onClick={() => setActiveTab('CUSTOM')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'CUSTOM'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Ajuste Fino de Colores</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TAB 1: PRESETS */}
          {activeTab === 'PRESETS' && (
            <div className="space-y-3">
              <p className="text-xs text-theme-text-muted">
                Elegí la temática base inicial. Cualquier cambio posterior conservará el estilo de esta selección:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.values(PRESET_THEMES).filter(t => t.id !== 'custom').map((theme) => {
                  const isSelected = (currentThemeId === theme.id) || (currentThemeId === 'custom' && baseThemeId === theme.id);
                  return (
                    <div
                      key={theme.id}
                      onClick={() => {
                        setAppTheme(theme.id);
                        showNotification(`Temática base aplicada: ${theme.name}`);
                      }}
                      className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-theme-accent bg-theme-surface-subtle shadow-lg scale-[1.01]'
                          : 'border-theme-border hover:border-theme-accent/60 bg-theme-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-theme-text">{theme.name}</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-surface-subtle border border-theme-border text-theme-text-muted">
                          {theme.badge}
                        </span>
                      </div>

                      <p className="text-[11px] text-theme-text-muted mb-3 leading-relaxed">
                        {theme.description}
                      </p>

                      {/* Color Palette Preview Swatches */}
                      <div className="flex items-center justify-between pt-2 border-t border-theme-border/60">
                        <div className="flex items-center space-x-1.5">
                          <div
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.colors.appBg }}
                            title={`Fondo App: ${theme.colors.appBg}`}
                          />
                          <div
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.colors.canvasBg }}
                            title={`Lienzo: ${theme.colors.canvasBg}`}
                          />
                          <div
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.colors.surface }}
                            title={`Superficie: ${theme.colors.surface}`}
                          />
                          <div
                            className="w-5 h-5 rounded-md border border-white/20 shadow-sm"
                            style={{ backgroundColor: theme.colors.accent }}
                            title={`Acento: ${theme.colors.accent}`}
                          />
                        </div>

                        {isSelected && (
                          <div className="flex items-center space-x-1 text-[11px] font-bold text-theme-accent">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>{currentThemeId === 'custom' ? 'Base Activa' : 'Activo'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CANVAS BACKGROUND */}
          {activeTab === 'CANVAS' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text mb-1">
                  Color de Fondo de la Pizarra y Carriles (BPMN)
                </h4>
                <p className="text-xs text-theme-text-muted mb-3">
                  Cambiá el color de la parte de atrás de la pizarra. Todos los demás colores se mantendrán basados en <strong>{activeBase.name}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {CANVAS_BG_PRESETS.map((preset) => {
                  const isCurrent = currentColors.canvasBg.toLowerCase() === preset.color.toLowerCase();
                  return (
                    <button
                      key={preset.color}
                      onClick={() => {
                        setCanvasBgColor(preset.color);
                        showNotification(`Fondo de pizarra: ${preset.label}`);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        isCurrent
                          ? 'border-theme-accent ring-2 ring-theme-accent/30 shadow-md bg-theme-surface-subtle'
                          : 'border-theme-border hover:border-theme-accent/50 bg-theme-surface'
                      }`}
                    >
                      <div
                        className="w-full h-10 rounded-lg border border-white/10 shadow-inner flex items-center justify-center"
                        style={{ backgroundColor: preset.color }}
                      >
                        {isCurrent && <Check className="w-4 h-4 text-theme-accent drop-shadow" />}
                      </div>
                      <div className="text-[11px] font-medium text-theme-text truncate">
                        {preset.label}
                      </div>
                      <span className="text-[9px] font-mono text-theme-text-muted">
                        {preset.color}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Canvas Color Picker */}
              <div className="mt-4 p-3.5 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-theme-text">Selector Hexadecimal Libre</span>
                  <p className="text-[10px] text-theme-text-muted">Elegí cualquier tono exacto para el fondo del lienzo</p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={currentColors.canvasBg}
                    onChange={(e) => setCanvasBgColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={currentColors.canvasBg}
                    onChange={(e) => setCanvasBgColor(e.target.value)}
                    className="w-24 px-2 py-1 rounded bg-theme-surface border border-theme-border text-xs font-mono text-theme-text uppercase"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM THEME BUILDER */}
          {activeTab === 'CUSTOM' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-theme-text mb-0.5">
                    Ajuste Fino de Colores (Basado en {activeBase.name})
                  </h4>
                  <p className="text-xs text-theme-text-muted">
                    Podés modificar variables individuales sin alterar el resto de la paleta.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAppTheme(baseThemeId);
                    showNotification(`Restablecido a los valores originales de ${activeBase.name}`);
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-[11px] text-theme-text-muted transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Restablecer</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Canvas Background */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Fondo de Pizarra</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.canvasBg}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.canvasBg}
                    onChange={(e) => updateCustomTheme({ canvasBg: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* App Background */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Fondo de Aplicación</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.appBg}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.appBg}
                    onChange={(e) => updateCustomTheme({ appBg: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Surface / Panels */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Superficie / Paneles</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.surface}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.surface}
                    onChange={(e) => updateCustomTheme({ surface: e.target.value, card: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Accent Color */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Color de Acento Primario</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.accent}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.accent}
                    onChange={(e) => updateCustomTheme({ accent: e.target.value, edgeColor: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Text Color */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Color del Texto</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.text}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.text}
                    onChange={(e) => updateCustomTheme({ text: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>

                {/* Border Color */}
                <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                  <div className="text-xs">
                    <div className="font-semibold text-theme-text">Color de Bordes</div>
                    <div className="text-[10px] text-theme-text-muted font-mono">{currentColors.border}</div>
                  </div>
                  <input
                    type="color"
                    value={currentColors.border}
                    onChange={(e) => updateCustomTheme({ border: e.target.value })}
                    className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                  />
                </div>
              </div>

              {/* Dark/Light mode toggle */}
              <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-semibold text-theme-text">Esquema Base (Dark / Light)</div>
                  <div className="text-[10px] text-theme-text-muted">Ajusta contraste automático de textos secundarios</div>
                </div>
                <button
                  onClick={() => updateCustomTheme({ isDark: !currentColors.isDark })}
                  className="px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border text-xs font-semibold text-theme-text flex items-center space-x-1.5"
                >
                  {currentColors.isDark ? (
                    <>
                      <Moon className="w-3.5 h-3.5 text-theme-accent" />
                      <span>Modo Oscuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>Modo Claro</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <span className="text-[11px] text-theme-text-muted">
            Los cambios se aplican en tiempo real y persisten automáticamente.
          </span>
          <button
            onClick={() => setThemeModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <span>Aceptar y Cerrar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
