import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { mockProjects, mockProposals, Project } from '../data/mockData';
import {
  FolderOpen, User, Plus, ChevronRight, TrendingUp, Clock,
  MessageSquare, Phone, MapPin, Star, Tag, ArrowRight, X,
  CheckCircle2, Calendar, DollarSign, Settings, Send
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const STAGE_CONFIG: Record<string, { color: string; bg: string }> = {
  '需求录入': { color: 'text-stone-600', bg: 'bg-stone-100' },
  '方向生成': { color: 'text-blue-700', bg: 'bg-blue-50' },
  '提案展示': { color: 'text-amber-700', bg: 'bg-amber-50' },
  '跟进中': { color: 'text-purple-700', bg: 'bg-purple-50' },
  '已签单': { color: 'text-emerald-700', bg: 'bg-emerald-50' },
  '归档': { color: 'text-gray-500', bg: 'bg-gray-100' },
};

const MOCK_CLIENTS = [
  { id: 'c1', name: '李文创主任', company: '故宫博物院文创部', phone: '138****8888', industry: '博物馆', intent: 'high', tags: ['高意向', '长期合作'], lastContact: '今天', projects: 2, totalValue: 195000 },
  { id: 'c2', name: '张院长助理', company: '敦煌研究院', phone: '139****6666', industry: '景区', intent: 'medium', tags: ['中意向', '景区文创'], lastContact: '昨天', projects: 1, totalValue: 32000 },
  { id: 'c3', name: '孙设计总监', company: '西溪湿地景区', phone: '137****5555', industry: '景区', intent: 'high', tags: ['高意向', '已签单'], lastContact: '3天前', projects: 1, totalValue: 210000 },
  { id: 'c4', name: '赵馆长', company: '苏州博物馆文创', phone: '136****4444', industry: '博物馆', intent: 'low', tags: ['低意向', '待开发'], lastContact: '1周前', projects: 1, totalValue: 0 },
];

const SCENES = ['博物馆文创', '景区礼品', '城市礼赠', '空间软装', '服饰时尚', '商务定制', '品牌联名', '其他'];
const CATEGORIES = ['丝巾', '服饰', '礼盒', '软装', '壁挂', '文具', '空间装置', '混合品类'];
const STAGES: Project['stage'][] = ['需求录入', '方向生成', '提案展示', '跟进中', '已签单', '归档'];

// ── New Project Wizard ─────────────────────────────────────────────────────────

interface NewProjectForm {
  name: string;
  client: string;
  contactPerson: string;
  phone: string;
  scene: string;
  category: string;
  budget: string;
  stage: Project['stage'];
  manager: string;
  notes: string;
}

function NewProjectWizard({ onClose, onConfirm }: {
  onClose: () => void;
  onConfirm: (project: Project) => void;
}) {
  const { t } = useApp();
  const [step, setStep] = useState(1); // 1=客户信息, 2=项目信息, 3=确认
  const [form, setForm] = useState<NewProjectForm>({
    name: '', client: '', contactPerson: '', phone: '',
    scene: '', category: '', budget: '', stage: '需求录入', manager: '当前用户', notes: '',
  });
  const [errors, setErrors] = useState<Partial<NewProjectForm>>({});
  const [submitting, setSubmitting] = useState(false);
  const [useExistingClient, setUseExistingClient] = useState<string | null>(null);

  const STEPS = ['客户信息', '项目信息', '确认创建'];

  const validateStep = (s: number) => {
    const errs: Partial<NewProjectForm> = {};
    if (s === 1) {
      if (!form.client.trim()) errs.client = '请填写客户机构';
      if (!form.contactPerson.trim()) errs.contactPerson = '请填写联系人';
    }
    if (s === 2) {
      if (!form.name.trim()) errs.name = '请填写项目名称';
      if (!form.scene) errs.scene = '请选择客户场景';
      if (!form.category) errs.category = '请选择品类目标';
      if (!form.budget.trim()) errs.budget = '请填写预算区间';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error('请完善必填信息'); return; }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    const newProject: Project = {
      id: `p${Date.now()}`,
      name: form.name,
      client: form.client,
      scene: form.scene,
      category: form.category,
      stage: form.stage,
      updatedAt: '刚刚',
      manager: form.manager,
      budget: form.budget,
    };
    onConfirm(newProject);
  };

  const selectClient = (c: typeof MOCK_CLIENTS[0]) => {
    setUseExistingClient(c.id);
    setForm(p => ({ ...p, client: c.company, contactPerson: c.name, phone: c.phone }));
    setErrors(p => ({ ...p, client: '', contactPerson: '', phone: '' }));
  };

  const inputCls = (field: keyof NewProjectForm) =>
    `w-full text-sm border rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] transition-colors text-[#1A3D4A] ${(errors as any)[field] ? 'border-red-400 bg-red-50' : 'border-[rgba(26,61,74,0.12)]'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(13,37,53,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[#1A3D4A]">{t('新建客户项目', 'New Project')}</h3>
              <p className="text-xs text-[#9B9590] mt-0.5">3步完成项目创建 · 自动录入看板</p>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-[#F5F0E8] rounded-lg text-[#6B6558]"><X className="w-4 h-4" /></button>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 flex-shrink-0 ${i < step - 1 ? 'text-emerald-600' : i === step - 1 ? 'text-[#1A3D4A]' : 'text-[#9B9590]'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                    i < step - 1 ? 'bg-emerald-500 border-emerald-500 text-white' :
                    i === step - 1 ? 'border-[#1A3D4A] text-[#1A3D4A]' : 'border-[rgba(26,61,74,0.15)] text-[#9B9590]'
                  }`}>{i < step - 1 ? '✓' : i + 1}</div>
                  <span className="text-xs hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step - 1 ? 'bg-emerald-300' : 'rgba(26,61,74,0.1)'}`} style={{ background: i < step - 1 ? '#86EFAC' : 'rgba(26,61,74,0.1)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">
            {/* Step 1: Client Info */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <p className="text-xs text-[#9B9590] mb-2">从已有客户中选择（选填）</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {MOCK_CLIENTS.map(c => (
                      <button key={c.id} onClick={() => selectClient(c)}
                        className="text-left p-2.5 rounded-xl border transition-all"
                        style={{
                          borderColor: useExistingClient === c.id ? '#C4912A' : 'rgba(26,61,74,0.1)',
                          background: useExistingClient === c.id ? 'rgba(196,145,42,0.06)' : 'white',
                        }}>
                        <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 500 }}>{c.name}</p>
                        <p className="text-[10px] text-[#6B6558] truncate">{c.company}</p>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 h-px bg-[rgba(26,61,74,0.08)]" />
                    <span className="text-[10px] text-[#9B9590]">或手动填写</span>
                    <div className="flex-1 h-px bg-[rgba(26,61,74,0.08)]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>客户机构 <span className="text-red-500">*</span></label>
                    <input value={form.client} onChange={e => { setForm(p => ({ ...p, client: e.target.value })); setErrors(p => ({ ...p, client: '' })); setUseExistingClient(null); }}
                      placeholder="如：故宫博物院文创部" className={inputCls('client')} />
                    {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>联系人 <span className="text-red-500">*</span></label>
                    <input value={form.contactPerson} onChange={e => { setForm(p => ({ ...p, contactPerson: e.target.value })); setErrors(p => ({ ...p, contactPerson: '' })); }}
                      placeholder="联系人姓名" className={inputCls('contactPerson')} />
                    {errors.contactPerson && <p className="text-xs text-red-500 mt-0.5">{errors.contactPerson}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>联系电话</label>
                  <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="138****0000" className={inputCls('phone')} />
                </div>
              </motion.div>
            )}

            {/* Step 2: Project Info */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>项目名称 <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                    placeholder="如：故宫文创·龙纹丝巾系列" className={inputCls('name')} autoFocus />
                  {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>客户场景 <span className="text-red-500">*</span></label>
                    <select value={form.scene} onChange={e => { setForm(p => ({ ...p, scene: e.target.value })); setErrors(p => ({ ...p, scene: '' })); }} className={inputCls('scene')}>
                      <option value="">请选择场景...</option>
                      {SCENES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.scene && <p className="text-xs text-red-500 mt-0.5">{errors.scene}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>品类目标 <span className="text-red-500">*</span></label>
                    <select value={form.category} onChange={e => { setForm(p => ({ ...p, category: e.target.value })); setErrors(p => ({ ...p, category: '' })); }} className={inputCls('category')}>
                      <option value="">请选择品类...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="text-xs text-red-500 mt-0.5">{errors.category}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>预算区间 <span className="text-red-500">*</span></label>
                  <input value={form.budget} onChange={e => { setForm(p => ({ ...p, budget: e.target.value })); setErrors(p => ({ ...p, budget: '' })); }}
                    placeholder="如：¥80,000 - 150,000" className={inputCls('budget')} />
                  {errors.budget && <p className="text-xs text-red-500 mt-0.5">{errors.budget}</p>}
                </div>
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>初始阶段</label>
                  <div className="flex flex-wrap gap-1.5">
                    {(['需求录入', '方向生成', '提案展示'] as Project['stage'][]).map(s => {
                      const conf = STAGE_CONFIG[s];
                      return (
                        <button key={s} onClick={() => setForm(p => ({ ...p, stage: s }))}
                          className="px-3 py-1.5 rounded-xl text-xs transition-all"
                          style={{ background: form.stage === s ? '#1A3D4A' : 'white', color: form.stage === s ? 'white' : '#6B6558', border: `1px solid ${form.stage === s ? '#1A3D4A' : 'rgba(26,61,74,0.12)'}` }}>
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>负责人</label>
                  <input value={form.manager} onChange={e => setForm(p => ({ ...p, manager: e.target.value }))}
                    placeholder="负责人姓名" className={inputCls('manager')} />
                </div>
                <div>
                  <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>备注（选填）</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2} placeholder="项目背景、特殊需求等..."
                    className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] text-[#1A3D4A] resize-none" />
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-4 rounded-2xl mb-4" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
                  <p className="text-xs text-[#9B9590] mb-3">项目摘要确认</p>
                  <div className="space-y-2">
                    {[
                      { label: '项目名称', value: form.name, highlight: true },
                      { label: '客户机构', value: form.client },
                      { label: '联系人', value: form.contactPerson || '-' },
                      { label: '客户场景', value: form.scene },
                      { label: '品类目标', value: form.category },
                      { label: '预算区间', value: form.budget },
                      { label: '初始阶段', value: form.stage },
                      { label: '负责人', value: form.manager },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between text-xs">
                        <span className="text-[#9B9590]">{item.label}</span>
                        <span style={{ color: item.highlight ? '#C4912A' : '#1A3D4A', fontWeight: item.highlight ? 500 : 400 }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.12)' }}>
                  <p className="text-[#C4912A] mb-1 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 创建后自动加入</p>
                  <p className="text-[#6B6558]">项目列表 · 数据看板 · 操作日志（自动记录）</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 flex-shrink-0 flex gap-3" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 border border-[rgba(26,61,74,0.12)] rounded-xl text-sm text-[#6B6558] hover:bg-[#F5F0E8] transition-colors">
              {t('上一步', 'Back')}
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 border border-[rgba(26,61,74,0.12)] rounded-xl text-sm text-[#6B6558] hover:bg-[#F5F0E8] transition-colors">
              取消
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext}
              className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              下一步 <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2 transition-all"
              style={{ background: submitting ? 'rgba(26,61,74,0.2)' : 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />创建中...</> : <><FolderOpen className="w-4 h-4" />确认创建项目</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Project Detail Panel ───────────────────────────────────────────────────────

function ProjectDetailPanel({ project, onClose }: { project: Project; onClose: () => void }) {
  const { t } = useApp();
  const navigate = useNavigate();
  const sc = STAGE_CONFIG[project.stage];
  const stageIdx = STAGES.indexOf(project.stage);

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="absolute right-0 top-0 bottom-0 w-80 flex flex-col shadow-2xl z-20"
      style={{ background: 'white', borderLeft: '1px solid rgba(26,61,74,0.08)' }}
    >
      <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
        <h3 className="text-sm text-[#1A3D4A] truncate pr-2" style={{ fontWeight: 500 }}>{project.name}</h3>
        <button onClick={onClose} className="p-1.5 hover:bg-[#F5F0E8] rounded-lg text-[#6B6558] flex-shrink-0"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Stage progress */}
        <div className="p-3 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
          <p className="text-xs text-[#9B9590] mb-2">项目阶段</p>
          <div className="flex items-center gap-1">
            {STAGES.slice(0, 5).map((s, i) => {
              const conf = STAGE_CONFIG[s];
              const isPast = i < stageIdx;
              const isCurrent = i === stageIdx;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`w-5 h-5 rounded-full text-[9px] flex items-center justify-center flex-shrink-0 ${isCurrent ? `${conf.bg} ${conf.color}` : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-[rgba(26,61,74,0.06)] text-[#9B9590]'}`}>
                    {isPast ? '✓' : i + 1}
                  </div>
                  {i < 4 && <div className={`flex-1 h-px ${isPast ? 'bg-emerald-300' : 'bg-[rgba(26,61,74,0.1)]'}`} />}
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{project.stage}</span>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-0" style={{ border: '1px solid rgba(26,61,74,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { label: '客户', value: project.client },
            { label: '场景', value: project.scene },
            { label: '品类', value: project.category },
            { label: '预算', value: project.budget },
            { label: '负责人', value: project.manager },
            { label: '更新时间', value: project.updatedAt },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(26,61,74,0.05)' }}>
              <span className="text-xs text-[#9B9590] w-14 flex-shrink-0">{label}</span>
              <span className="text-xs text-[#1A3D4A]">{value}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button onClick={() => { navigate('/proposals'); toast.info(`打开项目「${project.name}」的提案管理`); }}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            <FolderOpen className="w-4 h-4" /> 查看关联提案
          </button>
          <button onClick={() => { navigate('/copilot'); toast.info('进入设计副驾沟通'); }}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            style={{ border: '1px solid rgba(196,145,42,0.3)', color: '#C4912A', background: 'rgba(196,145,42,0.04)' }}>
            <Send className="w-4 h-4" /> 设计副驾跟进
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function ProjectsPage() {
  const { t, clearRedDot } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'clients' | 'projects'>('projects');
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  useEffect(() => { clearRedDot('projects'); }, []);

  const intentColor = (i: string) => i === 'high' ? 'text-amber-600' : i === 'medium' ? 'text-blue-600' : 'text-gray-400';

  return (
    <div className="p-6 max-w-7xl mx-auto relative" style={{ background: '#F5F0E8', minHeight: '100%' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="w-5 h-5 text-[#C4912A]" />
            <h1 className="text-[#1A3D4A]">客户项目</h1>
          </div>
          <p className="text-sm text-[#6B6558]">客户画像、项目跟进与报价管理</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          <Plus className="w-4 h-4" /> 新建项目
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'rgba(26,61,74,0.06)', width: 'fit-content' }}>
        {[{ key: 'projects', label: '项目列表' }, { key: 'clients', label: '客户画像' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key ? '#1A3D4A' : '#6B6558',
              fontWeight: activeTab === tab.key ? 500 : 400,
              boxShadow: activeTab === tab.key ? '0 1px 4px rgba(26,61,74,0.1)' : undefined,
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'projects' && (
        <div className="space-y-3">
          {projects.map((p, i) => {
            const sc = STAGE_CONFIG[p.stage];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:shadow-md"
                style={{ background: 'white', border: `1px solid ${detailProject?.id === p.id ? '#C4912A' : 'rgba(26,61,74,0.08)'}` }}
                onClick={() => setDetailProject(detailProject?.id === p.id ? null : p)}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.1), rgba(26,61,74,0.06))' }}>
                  <FolderOpen className="w-5 h-5 text-[#C4912A]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 500 }}>{p.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${sc.bg} ${sc.color}`}>{p.stage}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#9B9590]">
                    <span>{p.client}</span>
                    <span>·</span>
                    <span>{p.scene}</span>
                    <span>·</span>
                    <span>{p.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0 text-xs text-[#6B6558]">
                  <div className="text-right">
                    <p style={{ color: '#C4912A', fontWeight: 500 }}>{p.budget}</p>
                    <p className="text-[#9B9590]">{p.manager}</p>
                  </div>
                  <div className="text-right">
                    <p>{p.updatedAt}</p>
                    <p className="text-[#9B9590]">更新时间</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-[#C4A88A] transition-transform ${detailProject?.id === p.id ? 'rotate-90' : ''}`} />
                </div>
              </motion.div>
            );
          })}

          {projects.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FolderOpen className="w-12 h-12 text-[#C4A88A] mb-3" />
              <p className="text-[#6B6558]">暂无项目</p>
              <button onClick={() => setShowNewProject(true)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                <Plus className="w-4 h-4" /> 新建第一个项目
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'clients' && (
        <div className="grid grid-cols-2 gap-4">
          {MOCK_CLIENTS.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md"
              style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}
              onClick={() => { navigate('/copilot'); toast.info(`进入「${c.name}」的设计副驾沟通`); }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: c.intent === 'high' ? 'rgba(196,145,42,0.1)' : 'rgba(26,61,74,0.07)' }}>
                  <User className="w-5 h-5" style={{ color: c.intent === 'high' ? '#C4912A' : '#1A3D4A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{c.name}</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(c.intent === 'high' ? 3 : c.intent === 'medium' ? 2 : 1)].map((_, si) => (
                        <Star key={si} className={`w-3 h-3 fill-current ${intentColor(c.intent)}`} />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#6B6558]">{c.company}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {c.tags.map(tag => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A' }}>{tag}</span>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(26,61,74,0.04)' }}>
                  <p className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>{c.projects}</p>
                  <p className="text-[#9B9590]">项目数</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(26,61,74,0.04)' }}>
                  <p className="text-[#C4912A]" style={{ fontWeight: 600 }}>¥{(c.totalValue / 10000).toFixed(0)}万</p>
                  <p className="text-[#9B9590]">合同额</p>
                </div>
                <div className="text-center p-2 rounded-lg" style={{ background: 'rgba(26,61,74,0.04)' }}>
                  <p className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>{c.lastContact}</p>
                  <p className="text-[#9B9590]">最近沟通</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Project Detail Panel */}
      <AnimatePresence>
        {detailProject && (
          <ProjectDetailPanel project={detailProject} onClose={() => setDetailProject(null)} />
        )}
      </AnimatePresence>

      {/* New Project Wizard */}
      <AnimatePresence>
        {showNewProject && (
          <NewProjectWizard
            onClose={() => setShowNewProject(false)}
            onConfirm={(newProject) => {
              setProjects(prev => [newProject, ...prev]);
              setShowNewProject(false);
              setDetailProject(newProject);
              toast.success(t(`项目「${newProject.name}」已创建！`, `Project "${newProject.name}" created!`), {
                description: '已加入项目列表 · 数据看板已更新 · 操作日志已记录',
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
