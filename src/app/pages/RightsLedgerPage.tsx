import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { mockRightsRecords, RightsRecord, RightsEvent, AuthRecord } from '../data/mockData';
import {
  Shield, Clock, CheckCircle2, AlertCircle, XCircle, FileText,
  ChevronRight, Download, Plus, Layers, RefreshCw, Eye, Tag,
  Package, GitBranch, Archive, X, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPE_CONFIG = {
  input: { label: '需求录入', labelEn: 'Input', icon: <FileText className="w-3 h-3" />, color: 'bg-gray-400', lineColor: 'border-gray-200' },
  generate: { label: '方向生成', labelEn: 'Generate', icon: <Package className="w-3 h-3" />, color: 'bg-blue-400', lineColor: 'border-blue-100' },
  edit: { label: '编辑调参', labelEn: 'Edit', icon: <RefreshCw className="w-3 h-3" />, color: 'bg-purple-400', lineColor: 'border-purple-100' },
  review: { label: '审核通过', labelEn: 'Review', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-green-400', lineColor: 'border-green-100' },
  proposal: { label: '提案展示', labelEn: 'Proposal', icon: <Eye className="w-3 h-3" />, color: 'bg-amber-400', lineColor: 'border-amber-100' },
  signed: { label: '签约成交', labelEn: 'Signed', icon: <CheckCircle2 className="w-3 h-3" />, color: 'bg-emerald-500', lineColor: 'border-emerald-100' },
  archive: { label: '归档存证', labelEn: 'Archive', icon: <Archive className="w-3 h-3" />, color: 'bg-gray-600', lineColor: 'border-gray-200' },
};

const EVIDENCE_STATUS_CONFIG = {
  pending: { label: '待提交', labelEn: 'Pending', color: 'text-gray-500', bg: 'bg-gray-100' },
  submitted: { label: '已提交', labelEn: 'Submitted', color: 'text-blue-600', bg: 'bg-blue-50' },
  confirmed: { label: '已确认', labelEn: 'Confirmed', color: 'text-green-600', bg: 'bg-green-50' },
  failed: { label: '提交失败', labelEn: 'Failed', color: 'text-red-600', bg: 'bg-red-50' },
};

const AUTH_RECORD_STATUS_CONFIG = {
  active: { label: '有效', color: 'text-green-600 bg-green-50' },
  expired: { label: '已过期', color: 'text-red-600 bg-red-50' },
  revoked: { label: '已撤销', color: 'text-gray-500 bg-gray-100' },
};

// ─── Timeline ────────────────────────────────────────────────────────────────

function Timeline({ events }: { events: RightsEvent[] }) {
  const { t } = useApp();
  return (
    <div className="relative">
      {events.map((event, i) => {
        const conf = EVENT_TYPE_CONFIG[event.type];
        const isLast = i === events.length - 1;
        return (
          <div key={event.id} className="flex gap-3 relative">
            {!isLast && <div className="absolute left-3.5 top-8 bottom-0 w-px bg-gray-100" />}
            <div className={`w-7 h-7 rounded-full ${conf.color} flex items-center justify-center flex-shrink-0 text-white mt-1`}>
              {conf.icon}
            </div>
            <div className="flex-1 pb-5">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-gray-700">{t(conf.label, conf.labelEn)}</span>
                <span className="text-xs text-gray-400">·</span>
                <span className="text-xs text-gray-400">{event.operator}</span>
                <span className="text-xs text-gray-400 ml-auto">{event.time}</span>
              </div>
              <div className={`bg-gray-50 rounded-xl p-2.5 text-xs text-gray-600 border ${conf.lineColor}`}>
                {event.content}
                {event.materialIds && event.materialIds.length > 0 && (
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {event.materialIds.map(id => (
                      <span key={id} className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] border border-amber-100">
                        {t('素材', 'Material')}#{id}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Auth Dialog ─────────────────────────────────────────────────────────

interface AddAuthDialogProps {
  onClose: () => void;
  onConfirm: (auth: AuthRecord) => void;
}

function AddAuthDialog({ onClose, onConfirm }: AddAuthDialogProps) {
  const { t } = useApp();
  const [formData, setFormData] = useState({
    client: '', region: '全国', period_start: '', period_end: '',
    price: '', type: 'first' as AuthRecord['type'],
    categories: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = ['丝巾', '服饰', '礼盒', '软装', '壁挂', '文具', '全品类'];
  const REGIONS = ['全国', '华东', '华南', '华北', '西部', '港澳台', '海外'];

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.client.trim()) errs.client = t('请填写客户名称', 'Client required');
    if (!formData.period_start) errs.period_start = t('请填写授权开始时间', 'Start date required');
    if (!formData.period_end) errs.period_end = t('请填写授权结束时间', 'End date required');
    if (!formData.price.trim()) errs.price = t('请填写授权费用', 'Price required');
    if (formData.categories.length === 0) errs.categories = t('请选择至少一个品类', 'Select at least one category');
    return errs;
  };

  const handleCheckConflict = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(t('请完善授权信息', 'Please fill auth info'));
      return;
    }
    setErrors({});
    setChecking(true);
    await new Promise(r => setTimeout(r, 1500));
    setChecking(false);
    setChecked(true);
    toast.success(t('授权冲突校验通过，可安全新增', 'No conflict detected, safe to add'));
  };

  const handleSubmit = async () => {
    if (!checked) {
      toast.error(t('请先进行冲突校验', 'Please check conflicts first'));
      return;
    }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    const newAuth: AuthRecord = {
      id: `auth_${Date.now()}`,
      client: formData.client,
      region: formData.region,
      categories: formData.categories,
      period: `${formData.period_start} 至 ${formData.period_end}`,
      price: formData.price,
      status: 'active',
      type: formData.type,
    };
    onConfirm(newAuth);
  };

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-gray-900">{t('新增授权流水', 'Add Authorization Record')}</h3>
              <p className="text-xs text-gray-400">{t('系统将自动校验授权冲突', 'System will check auth conflicts')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('被授权方（客户）', 'Licensee (Client)')}<span className="text-red-500">*</span></label>
            <input type="text" value={formData.client}
              onChange={e => { setFormData(p => ({ ...p, client: e.target.value })); setErrors(p => ({ ...p, client: '' })); setChecked(false); }}
              placeholder={t('如：故宫博物院文创部', 'e.g. Palace Museum')} className={inputCls('client')} autoFocus />
            {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t('授权地域', 'Region')}</label>
            <select value={formData.region} onChange={e => { setFormData(p => ({ ...p, region: e.target.value })); setChecked(false); }}
              className={inputCls('region')}>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1.5 flex gap-1">{t('授权期限', 'Authorization Period')}<span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <input type="date" value={formData.period_start}
                  onChange={e => { setFormData(p => ({ ...p, period_start: e.target.value })); setErrors(p => ({ ...p, period_start: '' })); setChecked(false); }}
                  className={inputCls('period_start')} />
                {errors.period_start && <p className="text-xs text-red-500 mt-0.5">{errors.period_start}</p>}
              </div>
              <div>
                <input type="date" value={formData.period_end}
                  onChange={e => { setFormData(p => ({ ...p, period_end: e.target.value })); setErrors(p => ({ ...p, period_end: '' })); setChecked(false); }}
                  className={inputCls('period_end')} />
                {errors.period_end && <p className="text-xs text-red-500 mt-0.5">{errors.period_end}</p>}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('授权费用', 'License Fee')}<span className="text-red-500">*</span></label>
            <input type="text" value={formData.price}
              onChange={e => { setFormData(p => ({ ...p, price: e.target.value })); setErrors(p => ({ ...p, price: '' })); }}
              placeholder={t('如：¥15,000/年', 'e.g. ¥15,000/yr')} className={inputCls('price')} />
            {errors.price && <p className="text-xs text-red-500 mt-0.5">{errors.price}</p>}
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">{t('授权类型', 'Auth Type')}</label>
            <div className="flex gap-2">
              {(['first', 'renewal', 'secondary'] as const).map(type => {
                const labels = { first: t('首次授权', 'First'), renewal: t('续约', 'Renewal'), secondary: t('二次授权', 'Secondary') };
                return (
                  <button key={type} onClick={() => setFormData(p => ({ ...p, type }))}
                    className={`flex-1 py-2 rounded-xl border text-xs transition-all ${formData.type === type ? 'bg-purple-50 text-purple-700 border-purple-200 border-2' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
                    {labels[type]}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-600 mb-1.5 flex gap-1">{t('授权品类', 'Categories')}<span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => { toggleCategory(cat); setErrors(p => ({ ...p, categories: '' })); setChecked(false); }}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${formData.categories.includes(cat) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-500 hover:border-purple-300'}`}>
                  {cat}
                </button>
              ))}
            </div>
            {errors.categories && <p className="text-xs text-red-500 mt-1">{errors.categories}</p>}
          </div>

          {/* Conflict Check Status */}
          {checked && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
              <p className="text-xs text-green-700">{t('授权冲突校验通过 · 无重叠授权 · 可安全新增', 'No conflicts detected · Safe to add')}</p>
            </motion.div>
          )}
        </div>

        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          {!checked ? (
            <button onClick={handleCheckConflict} disabled={checking}
              className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${checking ? 'bg-gray-100 text-gray-400' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
              {checking ? <><RefreshCw className="w-4 h-4 animate-spin" />{t('校验中...', 'Checking...')}</> : <><Shield className="w-4 h-4" />{t('冲突校验', 'Check Conflicts')}</>}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${submitting ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('提交中...', 'Submitting...')}</> : <><CheckCircle2 className="w-4 h-4" />{t('确认新增', 'Confirm')}</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New Record Dialog ───────────────────────────────────────────────────────

interface NewRecordDialogProps {
  onClose: () => void;
  onConfirm: (record: RightsRecord) => void;
}

function NewRecordDialog({ onClose, onConfirm }: NewRecordDialogProps) {
  const { t } = useApp();
  const [formData, setFormData] = useState({ projectName: '', versionId: '', notes: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!formData.projectName.trim()) errs.projectName = t('请填写项目名称', 'Project name required');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    const now = new Date();
    const newRecord: RightsRecord = {
      id: `r${Date.now()}`,
      projectName: formData.projectName,
      versionId: formData.versionId || `VER-${now.getFullYear()}-${String(Date.now()).slice(-5)}`,
      createdAt: now.toISOString().split('T')[0],
      evidenceNo: `EP-${now.getFullYear()}-${String(Date.now()).slice(-4)}`,
      evidenceStatus: 'pending',
      events: [{
        id: 'e1', time: now.toLocaleString('zh-CN'), type: 'input',
        operator: '当前用户', content: `需求录入：${formData.projectName}${formData.notes ? '，备注：' + formData.notes : ''}`,
        materialIds: [],
      }],
      authRecords: [],
      reuseAssets: [],
    };
    onConfirm(newRecord);
    toast.success(t('确权台账记录已创建', 'Rights record created'), {
      description: t(`版本号：${newRecord.versionId}`, `Version: ${newRecord.versionId}`),
    });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-gray-900">{t('新建确权记录', 'New Rights Record')}</h3>
              <p className="text-xs text-gray-400">{t('系统自动分配版本号和存证编号', 'Version & evidence no. auto-assigned')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('项目名称', 'Project Name')}<span className="text-red-500">*</span></label>
            <input type="text" value={formData.projectName}
              onChange={e => { setFormData(p => ({ ...p, projectName: e.target.value })); setErrors(p => ({ ...p, projectName: '' })); }}
              placeholder={t('如：南博国宝纹样文创项目', 'e.g. Museum Cultural Project')}
              className={`w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors ${errors.projectName ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
              autoFocus />
            {errors.projectName && <p className="text-xs text-red-500 mt-0.5">{errors.projectName}</p>}
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t('自定义版本号（选填）', 'Custom Version ID (optional)')}</label>
            <input type="text" value={formData.versionId} onChange={e => setFormData(p => ({ ...p, versionId: e.target.value }))}
              placeholder="VER-2026-XXXXX"
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 font-mono" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t('初始备注（选填）', 'Initial Notes (optional)')}</label>
            <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder={t('需求说明、客户信息等...', 'Requirements, client info...')}
              rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 resize-none" />
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
            {t('系统将自动创建「需求录入」事件节点，后续可追加授权、生成等节点。', 'System will create an "Input" event. Auth and other events can be added later.')}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${submitting ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('创建中...', 'Creating...')}</> : t('创建记录', 'Create Record')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RightsLedgerPage() {
  const { t, clearRedDot } = useApp();
  const [records, setRecords] = useState(mockRightsRecords);
  const [selectedRecord, setSelectedRecord] = useState<RightsRecord | null>(mockRightsRecords[0]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'auth' | 'assets'>('timeline');
  const [addingAuth, setAddingAuth] = useState(false);
  const [addingPool, setAddingPool] = useState(false);
  const [showAddAuthDialog, setShowAddAuthDialog] = useState(false);
  const [showNewRecordDialog, setShowNewRecordDialog] = useState(false);

  useEffect(() => { clearRedDot('rights'); }, []);

  const handleGenerateEvidence = (record: RightsRecord) => {
    if (record.evidenceStatus !== 'confirmed') {
      toast.info(t('正在发起证据包存证...', 'Initiating evidence submission...'));
      setTimeout(() => {
        setRecords(prev => prev.map(r => r.id === record.id ? { ...r, evidenceStatus: 'submitted' as const } : r));
        if (selectedRecord?.id === record.id) {
          setSelectedRecord(prev => prev ? { ...prev, evidenceStatus: 'submitted' as const } : null);
        }
        toast.success(t('证据包提交成功，等待确认', 'Evidence submitted, awaiting confirmation'), {
          description: `${t('证据包编号：', 'Evidence No: ')}${record.evidenceNo}`,
        });
      }, 2000);
    }
  };

  const handleAddToPool = () => {
    setAddingPool(true);
    setTimeout(() => {
      setAddingPool(false);
      toast.success(t('已加入复用资产池', 'Added to reuse asset pool'), {
        description: t('上线10要件：操作已记录日志', '10 Launch Items: Operation logged'),
      });
    }, 1200);
  };

  const handleAddAuth = (auth: AuthRecord) => {
    if (!selectedRecord) return;
    const updated = { ...selectedRecord, authRecords: [...selectedRecord.authRecords, auth] };
    setRecords(prev => prev.map(r => r.id === selectedRecord.id ? updated : r));
    setSelectedRecord(updated);
    setShowAddAuthDialog(false);
    toast.success(t('授权流水已新增，已完成冲突校验', 'Auth record added, conflict checked'), {
      description: t('操作已记录日志', 'Operation logged'),
    });
  };

  const handleNewRecord = (record: RightsRecord) => {
    setRecords(prev => [record, ...prev]);
    setSelectedRecord(record);
    setShowNewRecordDialog(false);
    setActiveTab('timeline');
  };

  const handleExportEvidence = (record: RightsRecord) => {
    toast.success(t('证据包导出中...', 'Exporting evidence package...'), {
      description: t(`编号：${record.evidenceNo}，包含 ${record.events.length} 个版本节点、${record.authRecords.length} 条授权记录`, 
        `No: ${record.evidenceNo}, ${record.events.length} events, ${record.authRecords.length} auth records`),
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Records List */}
      <div className="w-72 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-700">{t('确权台账', 'Rights Ledger')}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{records.length}{t('条记录', ' records')}</span>
              <button onClick={() => setShowNewRecordDialog(true)}
                className="flex items-center gap-1 text-xs text-white bg-[#8B1C1C] px-2.5 py-1.5 rounded-lg hover:bg-[#7A1818] transition-colors">
                <Plus className="w-3 h-3" /> {t('新建', 'New')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {records.map((record, i) => {
            const evConf = EVIDENCE_STATUS_CONFIG[record.evidenceStatus];
            const isSelected = selectedRecord?.id === record.id;
            return (
              <motion.button key={record.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedRecord(isSelected ? null : record)}
                className={`w-full p-4 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-amber-50 border-l-2 border-l-[#8B1C1C]' : ''}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs text-gray-800 leading-snug">{record.projectName}</p>
                  <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${evConf.bg} ${evConf.color}`}>
                    {t(evConf.label, evConf.labelEn)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">{record.evidenceNo}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <GitBranch className="w-3 h-3 text-gray-300" />
                  <span className="text-xs text-gray-400">{record.events.length}{t('个版本节点', ' events')}</span>
                  <span className="text-gray-200">·</span>
                  <span className="text-xs text-gray-400">{record.authRecords.length}{t('条授权', ' auth')}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right: Detail */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedRecord ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center p-6">
              <Shield className="w-12 h-12 text-gray-200 mb-3" />
              <p className="text-gray-500 mb-4">{t('选择一条记录查看版本链与授权详情', 'Select a record to view version chain and auth details')}</p>
              <button onClick={() => setShowNewRecordDialog(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1C1C] text-white rounded-xl text-sm hover:bg-[#7A1818] transition-colors">
                <Plus className="w-4 h-4" /> {t('新建确权记录', 'New Rights Record')}
              </button>
            </motion.div>
          ) : (
            <motion.div key={selectedRecord.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <h2 className="text-gray-900 mb-1">{selectedRecord.projectName}</h2>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono">VER: {selectedRecord.versionId}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500 font-mono">EP: {selectedRecord.evidenceNo}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${EVIDENCE_STATUS_CONFIG[selectedRecord.evidenceStatus].bg} ${EVIDENCE_STATUS_CONFIG[selectedRecord.evidenceStatus].color}`}>
                      {t(EVIDENCE_STATUS_CONFIG[selectedRecord.evidenceStatus].label, EVIDENCE_STATUS_CONFIG[selectedRecord.evidenceStatus].labelEn)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleExportEvidence(selectedRecord)}
                    className="flex items-center gap-1.5 text-xs border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <Download className="w-3.5 h-3.5" /> {t('导出证据包', 'Export Evidence')}
                  </button>
                  <button
                    onClick={() => handleGenerateEvidence(selectedRecord)}
                    disabled={selectedRecord.evidenceStatus === 'confirmed'}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                      selectedRecord.evidenceStatus === 'confirmed'
                        ? 'bg-green-100 text-green-600 cursor-default'
                        : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    {selectedRecord.evidenceStatus === 'confirmed' ? t('已存证', 'Confirmed') : t('发起存证', 'Submit Evidence')}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-0 border-b border-gray-100 mb-5">
                {[
                  { key: 'timeline', label: t('版本时间轴', 'Version Timeline'), icon: <GitBranch className="w-3.5 h-3.5" /> },
                  { key: 'auth', label: t('授权流水', 'Auth Records'), icon: <Shield className="w-3.5 h-3.5" /> },
                  { key: 'assets', label: t('复用资产池', 'Reuse Assets'), icon: <Layers className="w-3.5 h-3.5" /> },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-all ${
                      activeTab === tab.key ? 'border-[#8B1C1C] text-[#8B1C1C]' : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'timeline' && (
                  <motion.div key="timeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm text-gray-700">{t('版本事件时间轴', 'Version Event Timeline')}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{selectedRecord.events.length} {t('个节点', 'events')}</span>
                          <button
                            onClick={() => {
                              const newEvent: RightsEvent = {
                                id: `e${Date.now()}`,
                                time: new Date().toLocaleString('zh-CN'),
                                type: 'edit',
                                operator: '当前用户',
                                content: t('手动追加事件��点记录', 'Manual event node added'),
                              };
                              const updated = { ...selectedRecord, events: [...selectedRecord.events, newEvent] };
                              setRecords(prev => prev.map(r => r.id === selectedRecord.id ? updated : r));
                              setSelectedRecord(updated);
                              toast.success(t('版本节点已追加', 'Event node added'));
                            }}
                            className="text-xs text-[#8B1C1C] hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> {t('追加节点', 'Add Node')}
                          </button>
                        </div>
                      </div>
                      <Timeline events={selectedRecord.events} />
                    </div>
                  </motion.div>
                )}

                {activeTab === 'auth' && (
                  <motion.div key="auth" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm text-gray-700">{t('授权流水记录', 'Authorization Records')}</h3>
                        <button onClick={() => setShowAddAuthDialog(true)}
                          className="flex items-center gap-1 text-xs bg-[#8B1C1C] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#7A1818] transition-colors">
                          <Plus className="w-3.5 h-3.5" /> {t('新增授权', 'Add Auth')}
                        </button>
                      </div>

                      {selectedRecord.authRecords.length === 0 ? (
                        <div className="text-center py-10">
                          <Shield className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">{t('暂无授权记录', 'No auth records yet')}</p>
                          <button onClick={() => setShowAddAuthDialog(true)} className="mt-3 text-xs text-amber-600 hover:underline">
                            {t('点击新增授权流水', 'Click to add auth record')}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedRecord.authRecords.map((auth, i) => (
                            <motion.div key={auth.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                              className="border border-gray-100 rounded-xl p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm text-gray-800">{auth.client}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${AUTH_RECORD_STATUS_CONFIG[auth.status].color}`}>
                                      {t(AUTH_RECORD_STATUS_CONFIG[auth.status].label, AUTH_RECORD_STATUS_CONFIG[auth.status].label)}
                                    </span>
                                    <span className="text-xs bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">
                                      {auth.type === 'first' ? t('首次授权', 'First') : auth.type === 'renewal' ? t('续约', 'Renewal') : t('二次授权', 'Secondary')}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-sm text-gray-700">{auth.price}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                                <div className="flex gap-2"><span className="text-gray-400">{t('地域', 'Region')}</span><span className="text-gray-600">{auth.region}</span></div>
                                <div className="flex gap-2"><span className="text-gray-400">{t('授权期', 'Period')}</span><span className="text-gray-600">{auth.period}</span></div>
                                <div className="col-span-2 flex gap-2"><span className="text-gray-400">{t('品类', 'Categories')}</span><span className="text-gray-600">{auth.categories.join('、')}</span></div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'assets' && (
                  <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div className="bg-white rounded-2xl border border-gray-100 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm text-gray-700">{t('复用资产池', 'Reuse Asset Pool')}</h3>
                        <button onClick={handleAddToPool}
                          className="flex items-center gap-1 text-xs bg-[#8B1C1C] text-white px-2.5 py-1.5 rounded-lg hover:bg-[#7A1818] transition-colors">
                          {addingPool ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                          {addingPool ? t('加入中...', 'Adding...') : t('加入资产池', 'Add to Pool')}
                        </button>
                      </div>

                      {selectedRecord.reuseAssets.length === 0 ? (
                        <div className="text-center py-8">
                          <Layers className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">{t('暂无复用资产', 'No reuse assets yet')}</p>
                          <p className="text-xs text-gray-300 mt-1">{t('项目完成后可将方案加入主题包/系列包', 'After completion, add schemes to theme/series packs')}</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {selectedRecord.reuseAssets.map((asset, i) => {
                            const typeLabels = { theme_pack: t('主题包', 'Theme Pack'), series_pack: t('系列包', 'Series Pack'), collab_pack: t('联名包', 'Collab Pack') };
                            const typeBg = { theme_pack: 'bg-amber-50 border-amber-100', series_pack: 'bg-blue-50 border-blue-100', collab_pack: 'bg-purple-50 border-purple-100' };
                            const typeColor = { theme_pack: 'text-amber-700', series_pack: 'text-blue-700', collab_pack: 'text-purple-700' };
                            return (
                              <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                                className={`rounded-xl border p-4 ${typeBg[asset.type]}`}>
                                <div className="flex items-start justify-between mb-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${typeBg[asset.type]} ${typeColor[asset.type]} border ${typeBg[asset.type].split(' ')[1]}`}>
                                    {typeLabels[asset.type]}
                                  </span>
                                  <span className="text-xs text-gray-400">{asset.usageCount}{t('次引用', ' refs')}</span>
                                </div>
                                <p className="text-sm text-gray-800 mb-2">{asset.name}</p>
                                <div className="flex flex-wrap gap-1">
                                  {asset.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-white/70 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                                  ))}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <AnimatePresence>
        {showAddAuthDialog && selectedRecord && (
          <AddAuthDialog onClose={() => setShowAddAuthDialog(false)} onConfirm={handleAddAuth} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showNewRecordDialog && (
          <NewRecordDialog onClose={() => setShowNewRecordDialog(false)} onConfirm={handleNewRecord} />
        )}
      </AnimatePresence>
    </div>
  );
}
