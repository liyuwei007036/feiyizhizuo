import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  Coins, Award, TrendingUp, ChevronRight, Plus, ArrowRight, CheckCircle2,
  Clock, Tag, BarChart2, X, Calendar, Globe, Package, DollarSign,
  User, FileText, Download, Edit2, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { mockMaterials } from '../data/mockData';

interface LicenseRecord {
  id: string;
  title: string;
  certNo: string;
  client: string;
  range: string;
  region: string;
  period: string;
  fee: string;
  status: '授权中' | '即将到期' | '已到期';
  usage: number;
  income: number;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  signDate?: string;
}

const INITIAL_LICENSED: LicenseRecord[] = [
  { id: 'l1', title: '四合如意云纹', certNo: 'CPY-2026-0312', client: '故宫博物院文创部', range: '丝巾、服饰', region: '全国', period: '2026-04-01 至 2028-03-31', fee: '¥15,000/年', status: '授权中', usage: 3, income: 30000, contactPerson: '李文创主任', phone: '138****8888', notes: '年度授权，需每年续签', signDate: '2026-04-01' },
  { id: 'l2', title: '富贵连连牡丹纹', certNo: 'CPY-2026-0287', client: '西溪湿地景区', range: '软装、壁挂', region: '华东', period: '2026-04-01 至 2029-03-31', fee: '¥20,000/年', status: '授权中', usage: 8, income: 60000, contactPerson: '孙设计总监', phone: '137****5555', notes: '三年授权，含软装全品类', signDate: '2026-04-01' },
  { id: 'l3', title: '水墨莲池纹', certNo: 'CPY-2025-0156', client: '苏州博物馆文创', range: '全品类', region: '全国', period: '2025-06-01 至 2027-05-31', fee: '¥12,000/年', status: '即将到期', usage: 15, income: 24000, contactPerson: '赵馆长', phone: '136****4444', notes: '即将到期，建议联系续签', signDate: '2025-06-01' },
];

const STATS_DATA = [
  { label: '授权中纹样', value: '12', sub: '3款即将到期', icon: <Award className="w-5 h-5 text-[#C4912A]" />, color: 'bg-[rgba(196,145,42,0.08)]' },
  { label: '累计授权收入', value: '¥11.4万', sub: '本年度', icon: <TrendingUp className="w-5 h-5 text-teal-600" />, color: 'bg-teal-50' },
  { label: '授权使用次数', value: '26', sub: '近12个月', icon: <BarChart2 className="w-5 h-5 text-[#1A3D4A]" />, color: 'bg-[rgba(26,61,74,0.06)]' },
  { label: '可授权纹样', value: '8', sub: '认证通过待授权', icon: <Coins className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50' },
];

const REGIONS = ['全国', '华东', '华北', '华南', '华中', '西南', '西北', '东北'];
const RANGES = ['丝巾', '服饰', '礼盒', '软装', '壁挂', '文具', '全品类'];

// ── New License Modal ──────────────────────────────────────────────────────────

interface NewLicenseForm {
  patternTitle: string; certNo: string; client: string; contactPerson: string;
  phone: string; range: string[]; region: string; fee: string;
  startDate: string; endDate: string; notes: string;
}

function NewLicenseModal({ onClose, onConfirm, initialPattern }: {
  onClose: () => void;
  onConfirm: (data: LicenseRecord) => void;
  initialPattern?: string;
}) {
  const { t } = useApp();
  const [form, setForm] = useState<NewLicenseForm>({
    patternTitle: initialPattern || '', certNo: '', client: '', contactPerson: '',
    phone: '', range: [], region: '全国', fee: '', startDate: '', endDate: '', notes: '',
  });
  const [errors, setErrors] = useState<Partial<NewLicenseForm>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const errs: Partial<NewLicenseForm> = {};
    if (!form.patternTitle.trim()) errs.patternTitle = '请填写授权纹样名称';
    if (!form.client.trim()) errs.client = '请填写被授权方';
    if (!form.fee.trim()) errs.fee = '请填写授权费用';
    if (!form.startDate) errs.startDate = '请选择授权开始日期';
    if (!form.endDate) errs.endDate = '请选择授权结束日期';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error('请完善必填信息'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    const newRecord: LicenseRecord = {
      id: `l${Date.now()}`,
      title: form.patternTitle,
      certNo: form.certNo || `CPY-2026-${Math.floor(Math.random() * 900 + 100)}`,
      client: form.client,
      range: form.range.join('、') || '全品类',
      region: form.region,
      period: `${form.startDate} 至 ${form.endDate}`,
      fee: form.fee.startsWith('¥') ? form.fee : `¥${form.fee}/年`,
      status: '授权中',
      usage: 0,
      income: 0,
      contactPerson: form.contactPerson,
      phone: form.phone,
      notes: form.notes,
      signDate: new Date().toISOString().split('T')[0],
    };
    onConfirm(newRecord);
    toast.success('新建授权成功！', { description: `「${form.patternTitle}」已授权给${form.client}，操作日志已记录` });
  };

  const inputCls = (field: keyof NewLicenseForm) =>
    `w-full text-sm border rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] transition-colors text-[#1A3D4A] ${(errors as any)[field] ? 'border-red-400 bg-red-50' : 'border-[rgba(26,61,74,0.12)]'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(13,37,53,0.75)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl bg-white max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          <div className="flex items-center gap-3">
            <Coins className="w-5 h-5 text-[#C4912A]" />
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>新建授权记录</p>
              <p className="text-white/50 text-xs">为已认证纹样创建新的授权合约</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>授权纹样名称 <span className="text-red-500">*</span></label>
              <input value={form.patternTitle} onChange={e => { setForm(p => ({ ...p, patternTitle: e.target.value })); setErrors(p => ({ ...p, patternTitle: '' })); }}
                placeholder="如：四合如意云纹" className={inputCls('patternTitle')} autoFocus />
              {errors.patternTitle && <p className="text-xs text-red-500 mt-0.5">{errors.patternTitle}</p>}
            </div>
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>版权登记号</label>
              <input value={form.certNo} onChange={e => setForm(p => ({ ...p, certNo: e.target.value }))}
                placeholder="CPY-2026-XXXX（选填）" className={inputCls('certNo')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>被授权方 <span className="text-red-500">*</span></label>
              <input value={form.client} onChange={e => { setForm(p => ({ ...p, client: e.target.value })); setErrors(p => ({ ...p, client: '' })); }}
                placeholder="如：故宫博物院文创部" className={inputCls('client')} />
              {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
            </div>
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>联系人</label>
              <input value={form.contactPerson} onChange={e => setForm(p => ({ ...p, contactPerson: e.target.value }))}
                placeholder="如：李文创主任" className={inputCls('contactPerson')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>联系电话</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                placeholder="138****0000" className={inputCls('phone')} />
            </div>
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>授权费用 <span className="text-red-500">*</span></label>
              <input value={form.fee} onChange={e => { setForm(p => ({ ...p, fee: e.target.value })); setErrors(p => ({ ...p, fee: '' })); }}
                placeholder="如：¥15,000/年" className={inputCls('fee')} />
              {errors.fee && <p className="text-xs text-red-500 mt-0.5">{errors.fee}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>授权品类</label>
            <div className="flex flex-wrap gap-1.5">
              {RANGES.map(r => (
                <button key={r} onClick={() => setForm(p => ({ ...p, range: p.range.includes(r) ? p.range.filter(x => x !== r) : [...p.range, r] }))}
                  className="px-3 py-1 rounded-lg text-xs transition-all"
                  style={{ background: form.range.includes(r) ? '#1A3D4A' : 'rgba(26,61,74,0.05)', color: form.range.includes(r) ? 'white' : '#6B6558', border: `1px solid ${form.range.includes(r) ? '#1A3D4A' : 'rgba(26,61,74,0.1)'}` }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>授权地域</label>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map(r => (
                <button key={r} onClick={() => setForm(p => ({ ...p, region: r }))}
                  className="px-3 py-1 rounded-lg text-xs transition-all"
                  style={{ background: form.region === r ? 'rgba(196,145,42,0.1)' : 'rgba(26,61,74,0.04)', color: form.region === r ? '#C4912A' : '#6B6558', border: `1px solid ${form.region === r ? 'rgba(196,145,42,0.3)' : 'rgba(26,61,74,0.1)'}`, fontWeight: form.region === r ? 500 : 400 }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>授权开始日期 <span className="text-red-500">*</span></label>
              <input type="date" value={form.startDate} onChange={e => { setForm(p => ({ ...p, startDate: e.target.value })); setErrors(p => ({ ...p, startDate: '' })); }}
                className={inputCls('startDate')} />
              {errors.startDate && <p className="text-xs text-red-500 mt-0.5">{errors.startDate}</p>}
            </div>
            <div>
              <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>授权结束日期 <span className="text-red-500">*</span></label>
              <input type="date" value={form.endDate} onChange={e => { setForm(p => ({ ...p, endDate: e.target.value })); setErrors(p => ({ ...p, endDate: '' })); }}
                className={inputCls('endDate')} />
              {errors.endDate && <p className="text-xs text-red-500 mt-0.5">{errors.endDate}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>授权备注</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2} placeholder="如：需每年续签确认、不可转授权..."
              className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] text-[#1A3D4A] resize-none" />
          </div>
        </div>

        <div className="flex gap-3 p-5 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558] hover:text-[#1A3D4A] transition-all" style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-white transition-all"
            style={{ background: submitting ? 'rgba(26,61,74,0.2)' : 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</> : <><CheckCircle2 className="w-4 h-4" />确认新建授权</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── License Detail Panel ───────────────────────────────────────────────────────

function LicenseDetailPanel({ license, onClose, onEdit }: {
  license: LicenseRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const { t } = useApp();
  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 26, stiffness: 300 }}
      className="fixed right-0 top-0 bottom-0 w-96 flex flex-col shadow-2xl z-30"
      style={{ background: 'white', borderLeft: '1px solid rgba(26,61,74,0.08)' }}
    >
      <div className="flex items-center justify-between p-4 flex-shrink-0" style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
        <div>
          <p className="text-white text-sm" style={{ fontWeight: 600 }}>{license.title}</p>
          <p className="text-white/50 text-xs mt-0.5">{license.certNo}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${license.status === '即将到期' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${license.status === '即将到期' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {license.status}
          </span>
          {license.status === '即将到期' && (
            <span className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 建议联系续签
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.12)' }}>
            <p className="text-lg text-[#C4912A]" style={{ fontWeight: 700 }}>¥{(license.income / 10000).toFixed(1)}万</p>
            <p className="text-xs text-[#6B6558]">累计授权收入</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
            <p className="text-lg text-[#1A3D4A]" style={{ fontWeight: 700 }}>{license.usage}</p>
            <p className="text-xs text-[#6B6558]">累计使用次数</p>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-0" style={{ border: '1px solid rgba(26,61,74,0.08)', borderRadius: 12, overflow: 'hidden' }}>
          {[
            { icon: <User className="w-3.5 h-3.5" />, label: '被授权方', value: license.client },
            { icon: <User className="w-3.5 h-3.5" />, label: '联系人', value: license.contactPerson || '-' },
            { icon: <FileText className="w-3.5 h-3.5" />, label: '联系电话', value: license.phone || '-' },
            { icon: <Package className="w-3.5 h-3.5" />, label: '授权品类', value: license.range },
            { icon: <Globe className="w-3.5 h-3.5" />, label: '授权地域', value: license.region },
            { icon: <DollarSign className="w-3.5 h-3.5" />, label: '授权费用', value: license.fee },
            { icon: <Calendar className="w-3.5 h-3.5" />, label: '授权期限', value: license.period },
            { icon: <Calendar className="w-3.5 h-3.5" />, label: '签约日期', value: license.signDate || '-' },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5" style={{ borderBottom: '1px solid rgba(26,61,74,0.05)' }}>
              <span className="text-[#C4912A] flex-shrink-0">{icon}</span>
              <span className="text-xs text-[#9B9590] w-16 flex-shrink-0">{label}</span>
              <span className="text-xs text-[#1A3D4A] flex-1">{value}</span>
            </div>
          ))}
        </div>

        {license.notes && (
          <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
            <p className="text-[#9B9590] mb-0.5">备注</p>
            <p className="text-[#6B6558]">{license.notes}</p>
          </div>
        )}

        {/* Audit trail */}
        <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(196,145,42,0.04)', border: '1px solid rgba(196,145,42,0.1)' }}>
          <p className="text-[#C4912A] mb-1.5 flex items-center gap-1"><Shield className="w-3 h-3" /> 授权操作日志</p>
          <div className="space-y-1">
            <p className="text-[#6B6558]">• {license.signDate || '2026-04-01'} 创建授权合约</p>
            <p className="text-[#6B6558]">• 最后使用：{license.usage} 次</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex-shrink-0 space-y-2" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
        <button
          onClick={() => { toast.info('授权合约下载中...'); }}
          className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-white transition-all"
          style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          <Download className="w-4 h-4" /> 下载授权合约
        </button>
        {license.status === '即将到期' && (
          <button
            onClick={() => toast.success(`已发起「${license.title}」续签流程`, { description: '已通知 ' + license.contactPerson + '，请跟进确认' })}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            style={{ border: '1px solid rgba(196,145,42,0.3)', color: '#C4912A', background: 'rgba(196,145,42,0.04)' }}>
            <ArrowRight className="w-4 h-4" /> 发起续签
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Initiate License Modal (for available patterns) ────────────────────────────

function InitiateLicenseModal({ patternName, onClose, onConfirm }: {
  patternName: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [client, setClient] = useState('');
  const [fee, setFee] = useState('');
  const [region, setRegion] = useState('全国');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!client.trim()) { toast.error('请填写被授权方'); return; }
    if (!fee.trim()) { toast.error('请填写授权费用'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1000));
    setSubmitting(false);
    onConfirm();
    toast.success(`「${patternName}」授权流程已发起！`, { description: `授权给：${client}，请完善授权合约细节` });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(13,37,53,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-white"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4" style={{ background: 'linear-gradient(135deg, #C4912A, #D4A947)' }}>
          <div>
            <p className="text-white text-sm" style={{ fontWeight: 600 }}>发起新授权</p>
            <p className="text-white/70 text-xs mt-0.5">{patternName}</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>被授权方 <span className="text-red-500">*</span></label>
            <input value={client} onChange={e => setClient(e.target.value)}
              placeholder="如：故宫博物院文创部" autoFocus
              className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>授权费用 <span className="text-red-500">*</span></label>
            <input value={fee} onChange={e => setFee(e.target.value)}
              placeholder="如：¥15,000/年"
              className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl px-3 py-2 bg-[#F5F0E8] focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>授权地域</label>
            <div className="flex flex-wrap gap-1.5">
              {['全国', '华东', '华南', '华北'].map(r => (
                <button key={r} onClick={() => setRegion(r)}
                  className="px-3 py-1 rounded-lg text-xs transition-all"
                  style={{ background: region === r ? 'rgba(196,145,42,0.1)' : 'rgba(26,61,74,0.04)', color: region === r ? '#C4912A' : '#6B6558', border: `1px solid ${region === r ? 'rgba(196,145,42,0.3)' : 'rgba(26,61,74,0.1)'}` }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-xl text-xs" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.12)' }}>
            <p className="text-[#C4912A]">发起后将进入完整授权流程，需补充品类、期限等详细信息</p>
          </div>
        </div>
        <div className="flex gap-3 px-4 pb-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]" style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-white"
            style={{ background: submitting ? 'rgba(196,145,42,0.3)' : 'linear-gradient(135deg, #C4912A, #D4A947)' }}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />发起中...</> : <><Coins className="w-4 h-4" />发起授权</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function LicensingPage() {
  const { clearRedDot } = useApp();
  const [licensed, setLicensed] = useState<LicenseRecord[]>(INITIAL_LICENSED);
  const [showNewLicense, setShowNewLicense] = useState(false);
  const [detailLicense, setDetailLicense] = useState<LicenseRecord | null>(null);
  const [initiatingPattern, setInitiatingPattern] = useState<string | null>(null);

  useEffect(() => { clearRedDot('licensing'); }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto" style={{ background: '#F5F0E8', minHeight: '100%' }}>
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Coins className="w-5 h-5 text-[#C4912A]" />
              <h1 className="text-[#1A3D4A]">授权资产</h1>
            </div>
            <p className="text-sm text-[#6B6558]">管理已认证纹样的授权记录、收益追踪与复用历史</p>
          </div>
          <button
            onClick={() => setShowNewLicense(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            <Plus className="w-4 h-4" /> 新建授权
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STATS_DATA.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <div className="text-2xl text-[#1A3D4A]" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs text-[#6B6558] mt-0.5">{s.label}</div>
            <div className="text-[10px] text-[#9B9590] mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Licensed patterns */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
          <h3 className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>授权记录 ({licensed.length})</h3>
          <button onClick={() => setShowNewLicense(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            <Plus className="w-3.5 h-3.5" /> 新建授权
          </button>
        </div>
        {licensed.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.07 }}
            className="flex items-center gap-4 px-5 py-4 hover:bg-[#FFFDF9] transition-colors cursor-pointer"
            style={{ borderBottom: i < licensed.length - 1 ? '1px solid rgba(26,61,74,0.05)' : undefined }}
            onClick={() => setDetailLicense(item)}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(196,145,42,0.08)' }}>
              <Award className="w-5 h-5 text-[#C4912A]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 500 }}>{item.title}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${item.status === '即将到期' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {item.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#9B9590]">
                <span>{item.client}</span>
                <span>·</span>
                <span>{item.range}</span>
                <span>·</span>
                <span>{item.region}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm text-[#C4912A]" style={{ fontWeight: 600 }}>{item.fee}</div>
              <div className="text-xs text-[#9B9590]">累计 ¥{(item.income / 10000).toFixed(1)}万</div>
            </div>
            <div className="text-xs text-[#6B6558] flex-shrink-0 w-36 text-right">{item.period}</div>
            <ChevronRight className="w-4 h-4 text-[#C4A88A] flex-shrink-0" />
          </motion.div>
        ))}
      </div>

      {/* Available to license */}
      <div className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
        <h3 className="text-sm text-[#1A3D4A] mb-4" style={{ fontWeight: 600 }}>可授权纹样（已认证，未授权）</h3>
        <div className="grid grid-cols-4 gap-3">
          {mockMaterials.filter(m => m.authStatus === 'commercial').slice(0, 4).map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}
              className="rounded-xl overflow-hidden"
              style={{ border: '1px solid rgba(26,61,74,0.08)' }}>
              <div className="relative overflow-hidden" style={{ paddingBottom: '70%' }}>
                <img src={m.imageUrl} alt={m.name} className="absolute inset-0 w-full h-full object-cover" />
              </div>
              <div className="p-2.5">
                <p className="text-xs text-[#1A3D4A] mb-1 truncate" style={{ fontWeight: 500 }}>{m.name}</p>
                <button
                  onClick={() => setInitiatingPattern(m.name)}
                  className="w-full py-1.5 rounded-lg text-[10px] text-[#C4912A] flex items-center justify-center gap-1 transition-all hover:bg-[rgba(196,145,42,0.08)]"
                  style={{ border: '1px solid rgba(196,145,42,0.3)', background: 'rgba(196,145,42,0.04)' }}>
                  <Plus className="w-2.5 h-2.5" /> 发起授权
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {detailLicense && (
          <LicenseDetailPanel
            license={detailLicense}
            onClose={() => setDetailLicense(null)}
            onEdit={() => {
              setShowNewLicense(true);
              setDetailLicense(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* New License Modal */}
      <AnimatePresence>
        {showNewLicense && (
          <NewLicenseModal
            onClose={() => setShowNewLicense(false)}
            onConfirm={(newRecord) => {
              setLicensed(prev => [newRecord, ...prev]);
              setShowNewLicense(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Initiate License Modal */}
      <AnimatePresence>
        {initiatingPattern && (
          <InitiateLicenseModal
            patternName={initiatingPattern}
            onClose={() => setInitiatingPattern(null)}
            onConfirm={() => {
              setInitiatingPattern(null);
              setShowNewLicense(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}