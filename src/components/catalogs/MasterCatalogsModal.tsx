import React, { useState, useEffect } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { MasterCatalogsService } from '../../services/masterCatalogsService';
import {
  FunctionalRoleCatalogItem,
  MasterCatalogsStateData,
  NormativeCatalogItem,
  NormativeType,
  OrganizationUnitCatalogItem,
  RiskControlCatalogItem,
  SupportMediumType,
  SystemDocCategory,
  SystemDocumentCatalogItem
} from '../../types/catalogs';
import {
  Database,
  Building2,
  UserCheck,
  Scale,
  Monitor,
  ShieldAlert,
  Trash2,
  Plus,
  Pencil,
  Search,
  X,
  Check,
  RotateCcw,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

type CatalogTab = 'ORG_UNITS' | 'ROLES' | 'NORMATIVES' | 'SYSTEMS_DOCS' | 'RISKS_CONTROLS' | 'TRASH';

const PRESET_COLORS = [
  '#0284C7', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444', '#6366F1'
];

export const MasterCatalogsModal: React.FC = () => {
  const { isMasterCatalogsModalOpen, setMasterCatalogsModalOpen, showNotification } = useUiStore();
  const { currentProject, setProjectData, updateDocumentControl, restoreProjectFromTrash } = useProjectStore();

  const [activeTab, setActiveTab] = useState<CatalogTab>('ORG_UNITS');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogs, setCatalogs] = useState<MasterCatalogsStateData>(() => MasterCatalogsService.getCatalogsSync());

  // Form states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 1. OrgUnit fields
  const [uoCode, setUoCode] = useState('');
  const [uoName, setUoName] = useState('');
  const [uoParent, setUoParent] = useState('');
  const [uoHead, setUoHead] = useState('');
  const [uoColor, setUoColor] = useState('#0284C7');
  const [uoDesc, setUoDesc] = useState('');
  const [uoActive, setUoActive] = useState(true);

  // 2. Role fields
  const [rolCode, setRolCode] = useState('');
  const [rolName, setRolName] = useState('');
  const [rolOrgUnit, setRolOrgUnit] = useState('');
  const [rolSystem, setRolSystem] = useState('');
  const [rolCost, setRolCost] = useState(25);
  const [rolResp, setRolResp] = useState('');
  const [rolColor, setRolColor] = useState('#10B981');
  const [rolActive, setRolActive] = useState(true);

  // 3. Normative fields
  const [normCode, setNormCode] = useState('');
  const [normTitle, setNormTitle] = useState('');
  const [normCategory, setNormCategory] = useState<NormativeType>('LEY');
  const [normSummary, setNormSummary] = useState('');
  const [normDate, setNormDate] = useState('2026-01-01');
  const [normActive, setNormActive] = useState(true);

  // 4. Systems & Docs fields
  const [sysCode, setSysCode] = useState('');
  const [sysName, setSysName] = useState('');
  const [sysCategory, setSysCategory] = useState<SystemDocCategory>('SISTEMA_IT');
  const [sysMedium, setSysMedium] = useState<SupportMediumType>('DIGITAL');
  const [sysOwner, setSysOwner] = useState('');
  const [sysDesc, setSysDesc] = useState('');
  const [sysActive, setSysActive] = useState(true);

  // 5. Risks & Controls fields
  const [rskCode, setRskCode] = useState('');
  const [rskDesc, setRskDesc] = useState('');
  const [rskProb, setRskProb] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [rskImpact, setRskImpact] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH');
  const [rskControl, setRskControl] = useState('');
  const [rskControlType, setRskControlType] = useState<'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE'>('PREVENTIVE');
  const [rskActive, setRskActive] = useState(true);

  useEffect(() => {
    if (isMasterCatalogsModalOpen) {
      setCatalogs(MasterCatalogsService.getCatalogsSync());
      MasterCatalogsService.initialize().then((res) => setCatalogs(res));
    }
    const unsub = MasterCatalogsService.subscribe(() => {
      setCatalogs(MasterCatalogsService.getCatalogsSync());
    });
    return unsub;
  }, [isMasterCatalogsModalOpen]);

  if (!isMasterCatalogsModalOpen) return null;

  const q = searchQuery.trim().toLowerCase();

  // Open new form for current tab
  const handleOpenNew = () => {
    setEditingId(null);
    if (activeTab === 'ORG_UNITS') {
      setUoCode(`UO-00${catalogs.orgUnits.length + 1}`);
      setUoName('');
      setUoParent('Secretaría General');
      setUoHead('');
      setUoColor(PRESET_COLORS[catalogs.orgUnits.length % PRESET_COLORS.length]);
      setUoDesc('');
      setUoActive(true);
    } else if (activeTab === 'ROLES') {
      setRolCode(`ROL-00${catalogs.roles.length + 1}`);
      setRolName('');
      setRolOrgUnit(catalogs.orgUnits[0]?.name || '');
      setRolSystem(catalogs.systemsDocs[0]?.name || 'GDE');
      setRolCost(25);
      setRolResp('');
      setRolColor(PRESET_COLORS[catalogs.roles.length % PRESET_COLORS.length]);
      setRolActive(true);
    } else if (activeTab === 'NORMATIVES') {
      setNormCode(`NOR-00${catalogs.normatives.length + 1}`);
      setNormTitle('');
      setNormCategory('LEY');
      setNormSummary('');
      setNormDate(new Date().toISOString().slice(0, 10));
      setNormActive(true);
    } else if (activeTab === 'SYSTEMS_DOCS') {
      setSysCode(`DOC-00${catalogs.systemsDocs.length + 1}`);
      setSysName('');
      setSysCategory('SISTEMA_IT');
      setSysMedium('DIGITAL');
      setSysOwner(catalogs.orgUnits[0]?.name || '');
      setSysDesc('');
      setSysActive(true);
    } else if (activeTab === 'RISKS_CONTROLS') {
      setRskCode(`RSK-00${catalogs.risksControls.length + 1}`);
      setRskDesc('');
      setRskProb('MEDIUM');
      setRskImpact('HIGH');
      setRskControl('');
      setRskControlType('PREVENTIVE');
      setRskActive(true);
    }
    setIsFormOpen(true);
  };

  // Edit existing item
  const handleEditOrgUnit = (item: OrganizationUnitCatalogItem) => {
    setEditingId(item.id);
    setUoCode(item.code);
    setUoName(item.name);
    setUoParent(item.parentUnit);
    setUoHead(item.headName);
    setUoColor(item.colorHex);
    setUoDesc(item.description);
    setUoActive(item.isActive);
    setIsFormOpen(true);
  };

  const handleEditRole = (item: FunctionalRoleCatalogItem) => {
    setEditingId(item.id);
    setRolCode(item.code);
    setRolName(item.name);
    setRolOrgUnit(item.organizationUnit);
    setRolSystem(item.defaultSystem);
    setRolCost(item.hourlyCost);
    setRolResp(item.responsibilities);
    setRolColor(item.colorHex);
    setRolActive(item.isActive);
    setIsFormOpen(true);
  };

  const handleEditNormative = (item: NormativeCatalogItem) => {
    setEditingId(item.id);
    setNormCode(item.code);
    setNormTitle(item.title);
    setNormCategory(item.category);
    setNormSummary(item.summary);
    setNormDate(item.effectiveDate);
    setNormActive(item.isActive);
    setIsFormOpen(true);
  };

  const handleEditSystemDoc = (item: SystemDocumentCatalogItem) => {
    setEditingId(item.id);
    setSysCode(item.code);
    setSysName(item.name);
    setSysCategory(item.category);
    setSysMedium(item.supportMedium);
    setSysOwner(item.ownerUnit);
    setSysDesc(item.description);
    setSysActive(item.isActive);
    setIsFormOpen(true);
  };

  const handleEditRisk = (item: RiskControlCatalogItem) => {
    setEditingId(item.id);
    setRskCode(item.code);
    setRskDesc(item.riskDescription);
    setRskProb(item.probability);
    setRskImpact(item.impact);
    setRskControl(item.mitigatingControl);
    setRskControlType(item.controlType);
    setRskActive(item.isActive);
    setIsFormOpen(true);
  };

  // Save handler
  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'ORG_UNITS') {
      if (!uoName.trim()) return;
      await MasterCatalogsService.saveOrgUnit({
        id: editingId || undefined,
        code: uoCode.trim() || 'UO-000',
        name: uoName.trim(),
        parentUnit: uoParent.trim() || 'Dirección General',
        headName: uoHead.trim() || 'Responsable de Área',
        colorHex: uoColor,
        description: uoDesc.trim(),
        isActive: uoActive
      });
      showNotification(editingId ? 'Unidad Organizativa actualizada' : 'Unidad Organizativa dada de alta', 'success');
    } else if (activeTab === 'ROLES') {
      if (!rolName.trim()) return;
      await MasterCatalogsService.saveRole({
        id: editingId || undefined,
        code: rolCode.trim() || 'ROL-000',
        name: rolName.trim(),
        organizationUnit: rolOrgUnit.trim() || 'General',
        defaultSystem: rolSystem.trim() || 'Sistema Corporativo',
        hourlyCost: Number(rolCost) || 0,
        responsibilities: rolResp.trim(),
        colorHex: rolColor,
        isActive: rolActive
      });
      showNotification(editingId ? 'Rol / Cargo actualizado' : 'Rol / Cargo dado de alta', 'success');
    } else if (activeTab === 'NORMATIVES') {
      if (!normCode.trim() || !normTitle.trim()) return;
      await MasterCatalogsService.saveNormative({
        id: editingId || undefined,
        code: normCode.trim(),
        title: normTitle.trim(),
        category: normCategory,
        summary: normSummary.trim(),
        effectiveDate: normDate,
        isActive: normActive
      });
      showNotification(editingId ? 'Marco Normativo actualizado' : 'Marco Normativo dado de alta', 'success');
    } else if (activeTab === 'SYSTEMS_DOCS') {
      if (!sysName.trim()) return;
      await MasterCatalogsService.saveSystemDoc({
        id: editingId || undefined,
        code: sysCode.trim() || 'DOC-000',
        name: sysName.trim(),
        category: sysCategory,
        supportMedium: sysMedium,
        ownerUnit: sysOwner.trim() || 'General',
        description: sysDesc.trim(),
        isActive: sysActive
      });
      showNotification(editingId ? 'Sistema / Documento actualizado' : 'Sistema / Documento dado de alta', 'success');
    } else if (activeTab === 'RISKS_CONTROLS') {
      if (!rskDesc.trim()) return;
      await MasterCatalogsService.saveRiskControl({
        id: editingId || undefined,
        code: rskCode.trim() || 'RSK-000',
        riskDescription: rskDesc.trim(),
        probability: rskProb,
        impact: rskImpact,
        mitigatingControl: rskControl.trim(),
        controlType: rskControlType,
        isActive: rskActive
      });
      showNotification(editingId ? 'Riesgo y Control actualizado' : 'Riesgo y Control dado de alta', 'success');
    }
    setIsFormOpen(false);
    setEditingId(null);
  };

  // Quick Action: Add Role as Swimlane to Current Project
  const handleAddRoleAsLaneToCanvas = (roleItem: FunctionalRoleCatalogItem) => {
    if (!currentProject) {
      showNotification('Abre primero un proyecto para enviar carriles al lienzo.', 'warning');
      return;
    }
    const pool = currentProject.pools[0];
    if (!pool) return;

    const alreadyExists = pool.lanes.some(
      (l) => l.name.toLowerCase() === roleItem.organizationUnit.toLowerCase() && l.role.toLowerCase() === roleItem.name.toLowerCase()
    );
    if (alreadyExists) {
      showNotification(`El carril "${roleItem.name}" ya se encuentra en este proceso.`, 'info');
      return;
    }

    const newLaneId = `lane_${Date.now()}`;
    const nextOrder = pool.lanes.length;
    const newLane = {
      id: newLaneId,
      name: roleItem.organizationUnit || roleItem.name,
      role: roleItem.name,
      system: roleItem.defaultSystem || 'GDE',
      colorHex: roleItem.colorHex || '#0284C7',
      order: nextOrder
    };

    const updatedPools = currentProject.pools.map((p, idx) =>
      idx === 0 ? { ...p, lanes: [...p.lanes, newLane] } : p
    );

    const laneHeight = 250;
    const newLaneNode = {
      id: `node_${newLaneId}`,
      type: 'PoolLane',
      position: { x: 0, y: nextOrder * laneHeight },
      style: { width: 1600, height: laneHeight, zIndex: -10 },
      draggable: false,
      selectable: true,
      data: {
        standardId: roleItem.code,
        title: `${newLane.name} — ${newLane.role}`,
        description: roleItem.responsibilities || '',
        nodeType: 'PoolLane' as const,
        laneId: newLaneId,
        laneName: newLane.name,
        roleName: newLane.role,
        itSystem: newLane.system,
        legalFramework: '',
        inputs: [],
        outputs: [],
        operationalRisks: [],
        customBgColor: newLane.colorHex,
        tags: ['Carril ABM']
      }
    };

    setProjectData({
      ...currentProject,
      pools: updatedPools,
      nodes: [...currentProject.nodes, newLaneNode]
    });

    showNotification(`Carril "${roleItem.name}" agregado al lienzo actual`, 'success');
  };

  // Quick Action: Link Normative to Current Project
  const handleLinkNormativeToProject = (norm: NormativeCatalogItem) => {
    if (!currentProject) {
      showNotification('Abre primero un proyecto para vincular normativa.', 'warning');
      return;
    }
    const label = `${norm.code} - ${norm.title}`;
    const existing = currentProject.documentControl.legalNormativeBasis || [];
    if (existing.includes(label) || existing.includes(norm.code)) {
      showNotification(`La norma ${norm.code} ya está vinculada al proyecto.`, 'info');
      return;
    }
    updateDocumentControl({
      legalNormativeBasis: [...existing, label]
    });
    showNotification(`Norma "${norm.code}" vinculada a la Ficha del Proceso`, 'success');
  };

  // Restore project from Trash
  const handleRestoreProject = async (fileName: string, title: string) => {
    const ok = await restoreProjectFromTrash(fileName);
    if (ok) {
      showNotification(`Proyecto "${title}" restaurado exitosamente al Dashboard`, 'success');
    }
  };

  const handlePurgeProject = async (fileName: string) => {
    await MasterCatalogsService.removeProjectFromTrash(fileName);
    showNotification('Proyecto eliminado definitivamente de la papelera', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-6xl h-[88vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-theme-border bg-theme-surface-subtle flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-extrabold text-theme-text">
                  Centro Maestro de Catálogos y ABMs Corporativos
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Altas • Bajas • Modificaciones
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                Estandariza áreas, cargos/carriles, normativas, sistemas, riesgos y papelera para autocompletar toda la aplicación sin volver a escribir.
              </p>
            </div>
          </div>

          <button
            onClick={() => setMasterCatalogsModalOpen(false)}
            className="p-2 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 py-2.5 bg-theme-surface border-b border-theme-border flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => { setActiveTab('ORG_UNITS'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ORG_UNITS'
                  ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Unidades Organizativas</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {catalogs.orgUnits.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('ROLES'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'ROLES'
                  ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Cargos y Carriles</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {catalogs.roles.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('NORMATIVES'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'NORMATIVES'
                  ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Marco Normativo</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {catalogs.normatives.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('SYSTEMS_DOCS'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SYSTEMS_DOCS'
                  ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Sistemas y Formularios</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {catalogs.systemsDocs.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('RISKS_CONTROLS'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'RISKS_CONTROLS'
                  ? 'bg-theme-accent text-white shadow-md shadow-sky-500/20'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Riesgos y Controles</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 font-mono">
                {catalogs.risksControls.length}
              </span>
            </button>

            <button
              onClick={() => { setActiveTab('TRASH'); setIsFormOpen(false); }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'TRASH'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface-subtle'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Papelera de Proyectos</span>
              {catalogs.deletedProjects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                  {catalogs.deletedProjects.length}
                </span>
              )}
            </button>
          </div>

          {/* Search & New Button */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-theme-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en este catálogo..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text focus:outline-none focus:border-theme-accent w-48"
              />
            </div>

            {activeTab !== 'TRASH' && (
              <button
                onClick={handleOpenNew}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Registro (Alta)</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Inline ABM Form Drawer if Open */}
          {isFormOpen && activeTab !== 'TRASH' && (
            <form
              onSubmit={handleSaveForm}
              className="p-5 rounded-2xl bg-theme-surface-subtle border-2 border-theme-accent/50 shadow-xl space-y-4 animate-fadeIn"
            >
              <div className="flex items-center justify-between border-b border-theme-border pb-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-theme-accent" />
                  <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-theme-accent">
                    {editingId ? 'Modificación de Registro en Catálogo' : 'Alta de Nuevo Registro en Catálogo'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-theme-text-muted hover:text-theme-text cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {/* 1. ORG_UNITS FORM */}
              {activeTab === 'ORG_UNITS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CÓDIGO</label>
                    <input
                      type="text"
                      value={uoCode}
                      onChange={(e) => setUoCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">NOMBRE DE LA UNIDAD ORGANIZATIVA / ÁREA *</label>
                    <input
                      type="text"
                      value={uoName}
                      onChange={(e) => setUoName(e.target.value)}
                      required
                      placeholder="Ej: Dirección de Atención al Ciudadano"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">DEPENDENCIA SUPERIOR</label>
                    <input
                      type="text"
                      value={uoParent}
                      onChange={(e) => setUoParent(e.target.value)}
                      placeholder="Ej: Secretaría General"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">RESPONSABLE / TITULAR</label>
                    <input
                      type="text"
                      value={uoHead}
                      onChange={(e) => setUoHead(e.target.value)}
                      placeholder="Nombre o cargo del titular"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">COLOR IDENTIFICATORIO</label>
                    <div className="flex items-center space-x-1.5 pt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setUoColor(c)}
                          className={`w-6 h-6 rounded-lg border-2 transition-transform cursor-pointer ${
                            uoColor === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">MISIONES Y FUNCIONES / DESCRIPCIÓN</label>
                    <input
                      type="text"
                      value={uoDesc}
                      onChange={(e) => setUoDesc(e.target.value)}
                      placeholder="Resumen de competencias del área..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                </div>
              )}

              {/* 2. ROLES FORM */}
              {activeTab === 'ROLES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CÓDIGO</label>
                    <input
                      type="text"
                      value={rolCode}
                      onChange={(e) => setRolCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">NOMBRE DEL CARGO / ROL FUNCIONAL (SWIMLANE) *</label>
                    <input
                      type="text"
                      value={rolName}
                      onChange={(e) => setRolName(e.target.value)}
                      required
                      placeholder="Ej: Inspector de Calidad / Analista de Compras"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">UNIDAD ORGANIZATIVA ASOCIADA</label>
                    <select
                      value={rolOrgUnit}
                      onChange={(e) => setRolOrgUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      {catalogs.orgUnits.map((u) => (
                        <option key={u.id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">SISTEMA PRINCIPAL QUE OPERA</label>
                    <input
                      type="text"
                      value={rolSystem}
                      onChange={(e) => setRolSystem(e.target.value)}
                      placeholder="Ej: GDE / ERP"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">COSTO HORA ESTIMADO (USD)</label>
                    <input
                      type="number"
                      min={0}
                      value={rolCost}
                      onChange={(e) => setRolCost(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">RESPONSABILIDADES ESTÁNDAR DEL PUESTO</label>
                    <input
                      type="text"
                      value={rolResp}
                      onChange={(e) => setRolResp(e.target.value)}
                      placeholder="Qué actividades realiza habitualmente..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">COLOR DE CARRIL</label>
                    <div className="flex items-center space-x-1.5 pt-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRolColor(c)}
                          className={`w-6 h-6 rounded-lg border-2 transition-transform cursor-pointer ${
                            rolColor === c ? 'border-white scale-110' : 'border-transparent opacity-70'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 3. NORMATIVES FORM */}
              {activeTab === 'NORMATIVES' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">N° O CÓDIGO DE NORMA *</label>
                    <input
                      type="text"
                      value={normCode}
                      onChange={(e) => setNormCode(e.target.value)}
                      required
                      placeholder="Ej: Ley 24.449 / ISO 9001:2015"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CATEGORÍA</label>
                    <select
                      value={normCategory}
                      onChange={(e) => setNormCategory(e.target.value as NormativeType)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="LEY">Ley Nacional / Provincial</option>
                      <option value="DECRETO">Decreto Reglamentario</option>
                      <option value="ORDENANZA">Ordenanza Municipal</option>
                      <option value="RESOLUCION">Resolución / Disposición</option>
                      <option value="NORMA_ISO">Norma Técnica / ISO</option>
                      <option value="POLITICA_INTERNA">Política / Manual Interno</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">FECHA DE VIGENCIA</label>
                    <input
                      type="date"
                      value={normDate}
                      onChange={(e) => setNormDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">TÍTULO FORMAL DE LA NORMA *</label>
                    <input
                      type="text"
                      value={normTitle}
                      onChange={(e) => setNormTitle(e.target.value)}
                      required
                      placeholder="Ej: Régimen de Contrataciones y Administración Financiera"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">ALCANCE / RESUMEN DE APLICACIÓN</label>
                    <input
                      type="text"
                      value={normSummary}
                      onChange={(e) => setNormSummary(e.target.value)}
                      placeholder="Artículos o cláusulas aplicables a los procesos..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                </div>
              )}

              {/* 4. SYSTEMS & DOCS FORM */}
              {activeTab === 'SYSTEMS_DOCS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CÓDIGO</label>
                    <input
                      type="text"
                      value={sysCode}
                      onChange={(e) => setSysCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">NOMBRE DEL SISTEMA, FORMULARIO O REGISTRO *</label>
                    <input
                      type="text"
                      value={sysName}
                      onChange={(e) => setSysName(e.target.value)}
                      required
                      placeholder="Ej: Formulario F-01 de Recepción / Sistema SAP"
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">TIPO DE RECURSO</label>
                    <select
                      value={sysCategory}
                      onChange={(e) => setSysCategory(e.target.value as SystemDocCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="SISTEMA_IT">Sistema Informático / Software</option>
                      <option value="FORMULARIO">Formulario Normalizado</option>
                      <option value="EXPEDIENTE">Expediente / Legajo</option>
                      <option value="REGISTRO">Acta / Resolución / Registro</option>
                      <option value="PLANILLA">Planilla de Control</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">SOPORTE</label>
                    <select
                      value={sysMedium}
                      onChange={(e) => setSysMedium(e.target.value as SupportMediumType)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="DIGITAL">100% Digital / Electrónico</option>
                      <option value="PAPEL">Soporte Físico / Papel</option>
                      <option value="MIXTO">Híbrido (Digital + Papel)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">ÁREA ADMINISTRADORA</label>
                    <input
                      type="text"
                      value={sysOwner}
                      onChange={(e) => setSysOwner(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">DESCRIPCIÓN Y PROPÓSITO</label>
                    <input
                      type="text"
                      value={sysDesc}
                      onChange={(e) => setSysDesc(e.target.value)}
                      placeholder="Para qué se utiliza como entrada, salida o herramienta en las actividades..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                </div>
              )}

              {/* 5. RISKS & CONTROLS FORM */}
              {activeTab === 'RISKS_CONTROLS' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CÓDIGO RIESGO</label>
                    <input
                      type="text"
                      value={rskCode}
                      onChange={(e) => setRskCode(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">PROBABILIDAD</label>
                    <select
                      value={rskProb}
                      onChange={(e) => setRskProb(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="LOW">Baja (Low)</option>
                      <option value="MEDIUM">Media (Medium)</option>
                      <option value="HIGH">Alta (High)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">IMPACTO OPERATIVO</label>
                    <select
                      value={rskImpact}
                      onChange={(e) => setRskImpact(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="LOW">Bajo (Low)</option>
                      <option value="MEDIUM">Moderado (Medium)</option>
                      <option value="HIGH">Crítico / Alto (High)</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">DESCRIPCIÓN DEL RIESGO OPERATIVO *</label>
                    <input
                      type="text"
                      value={rskDesc}
                      onChange={(e) => setRskDesc(e.target.value)}
                      required
                      placeholder="Ej: Omisión de control documental previo a la liquidación..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">CONTROL MITIGANTE RECOMENDADO *</label>
                    <input
                      type="text"
                      value={rskControl}
                      onChange={(e) => setRskControl(e.target.value)}
                      required
                      placeholder="Ej: Doble validación cruzada y firma de conformidad..."
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-theme-text-muted mb-1">TIPO DE CONTROL</label>
                    <select
                      value={rskControlType}
                      onChange={(e) => setRskControlType(e.target.value as 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE')}
                      className="w-full px-3 py-2 rounded-xl bg-theme-surface border border-theme-border text-xs text-theme-text"
                    >
                      <option value="PREVENTIVE">Preventivo</option>
                      <option value="DETECTIVE">Detectivo</option>
                      <option value="CORRECTIVE">Correctivo</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-text-muted hover:text-theme-text cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Guardar Modificación' : 'Confirmar Alta en Catálogo'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 1: ORG UNITS */}
          {activeTab === 'ORG_UNITS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogs.orgUnits
                .filter((u) => !q || u.name.toLowerCase().includes(q) || u.code.toLowerCase().includes(q) || u.headName.toLowerCase().includes(q))
                .map((u) => (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-theme-accent/50 transition-all flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className="w-3.5 h-12 rounded-full shrink-0 mt-0.5"
                        style={{ backgroundColor: u.colorHex }}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-accent">
                            {u.code}
                          </span>
                          <span className="text-sm font-bold text-theme-text">{u.name}</span>
                        </div>
                        <p className="text-[11px] text-theme-text-muted mt-1">
                          Depende de: <strong className="text-theme-text">{u.parentUnit}</strong> &bull; Titular: <strong className="text-theme-text">{u.headName}</strong>
                        </p>
                        {u.description && (
                          <p className="text-xs text-theme-text-muted mt-1.5 leading-relaxed">{u.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleEditOrgUnit(u)}
                        title="Modificar Unidad Organizativa"
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => MasterCatalogsService.deleteOrgUnit(u.id)}
                        title="Dar de baja"
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 2: ROLES / SWIMLANES */}
          {activeTab === 'ROLES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogs.roles
                .filter((r) => !q || r.name.toLowerCase().includes(q) || r.organizationUnit.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-theme-accent/50 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        <div
                          className="w-3.5 h-12 rounded-full shrink-0 mt-0.5"
                          style={{ backgroundColor: r.colorHex }}
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-emerald-400">
                              {r.code}
                            </span>
                            <span className="text-sm font-bold text-theme-text">{r.name}</span>
                          </div>
                          <p className="text-[11px] text-theme-text-muted mt-1">
                            Área: <strong className="text-theme-text">{r.organizationUnit}</strong> &bull; Sistema: <strong className="text-theme-accent">{r.defaultSystem}</strong> &bull; Costo: <strong className="font-mono">${r.hourlyCost}/h</strong>
                          </p>
                          {r.responsibilities && (
                            <p className="text-xs text-theme-text-muted mt-1.5 leading-relaxed">{r.responsibilities}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleEditRole(r)}
                          title="Modificar Cargo / Rol"
                          className="p-1.5 rounded-lg text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => MasterCatalogsService.deleteRole(r.id)}
                          title="Dar de baja"
                          className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {currentProject && (
                      <div className="pt-2.5 border-t border-theme-border flex justify-end">
                        <button
                          onClick={() => handleAddRoleAsLaneToCanvas(r)}
                          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-theme-accent/15 hover:bg-theme-accent/25 text-theme-accent border border-theme-accent/30 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Layers className="w-3 h-3" />
                          <span>➕ Agregar como Carril al Lienzo Actual</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* TAB 3: NORMATIVES */}
          {activeTab === 'NORMATIVES' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogs.normatives
                .filter((n) => !q || n.code.toLowerCase().includes(q) || n.title.toLowerCase().includes(q))
                .map((n) => (
                  <div
                    key={n.id}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-amber-500/40 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400">
                            {n.code}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                            {n.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-theme-text mt-1.5">{n.title}</h4>
                        {n.summary && (
                          <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">{n.summary}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-1 shrink-0">
                        <button
                          onClick={() => handleEditNormative(n)}
                          className="p-1.5 rounded-lg text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => MasterCatalogsService.deleteNormative(n.id)}
                          className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {currentProject && (
                      <div className="pt-2.5 border-t border-theme-border flex justify-end">
                        <button
                          onClick={() => handleLinkNormativeToProject(n)}
                          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>➕ Vincular a Ficha del Proceso Actual</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* TAB 4: SYSTEMS & DOCS */}
          {activeTab === 'SYSTEMS_DOCS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogs.systemsDocs
                .filter((s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-theme-accent/50 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-400">
                          {s.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                          {s.category} &bull; {s.supportMedium}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-theme-text mt-1.5">{s.name}</h4>
                      <p className="text-[11px] text-theme-text-muted mt-0.5">
                        Área propietaria: <strong className="text-theme-text">{s.ownerUnit}</strong>
                      </p>
                      {s.description && (
                        <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">{s.description}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleEditSystemDoc(s)}
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => MasterCatalogsService.deleteSystemDoc(s.id)}
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 5: RISKS & CONTROLS */}
          {activeTab === 'RISKS_CONTROLS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogs.risksControls
                .filter((r) => !q || r.riskDescription.toLowerCase().includes(q) || r.mitigatingControl.toLowerCase().includes(q))
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border hover:border-rose-500/40 transition-all flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-400">
                          {r.code}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                          Prob: {r.probability} &bull; Impacto: {r.impact} &bull; {r.controlType}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-theme-text mt-1.5 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{r.riskDescription}</span>
                      </h4>
                      <p className="text-xs text-emerald-400 mt-1.5 leading-relaxed">
                        <strong>Control Mitigante:</strong> {r.mitigatingControl}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={() => handleEditRisk(r)}
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => MasterCatalogsService.deleteRiskControl(r.id)}
                        className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-400 hover:bg-theme-surface transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* TAB 6: TRASH / RECYCLE BIN */}
          {activeTab === 'TRASH' && (
            <div className="space-y-3">
              {catalogs.deletedProjects.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-theme-surface-subtle border border-theme-border">
                  <Trash2 className="w-10 h-10 text-theme-text-muted mx-auto mb-3 opacity-50" />
                  <h3 className="text-sm font-bold text-theme-text">La Papelera de Proyectos está vacía</h3>
                  <p className="text-xs text-theme-text-muted mt-1">
                    Cuando elimines algún proyecto desde el Dashboard, quedará resguardado aquí para que puedas restaurarlo si fue por error.
                  </p>
                </div>
              ) : (
                catalogs.deletedProjects.map((dp) => (
                  <div
                    key={dp.fileName}
                    className="p-4 rounded-2xl bg-theme-surface-subtle border border-theme-border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                          {dp.documentCode} (v{dp.version})
                        </span>
                        <h4 className="text-sm font-bold text-theme-text">{dp.documentTitle}</h4>
                      </div>
                      <p className="text-xs text-theme-text-muted mt-1">
                        Área: {dp.organizationUnit} &bull; Autor: {dp.authorName} &bull; Eliminado el {new Date(dp.deletedAt).toLocaleString()} por {dp.deletedByEmail}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleRestoreProject(dp.fileName, dp.documentTitle)}
                        className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Restaurar al Dashboard</span>
                      </button>
                      <button
                        onClick={() => handlePurgeProject(dp.fileName)}
                        className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold cursor-pointer"
                      >
                        Purgar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

