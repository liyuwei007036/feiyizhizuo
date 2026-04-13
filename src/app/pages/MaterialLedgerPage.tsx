import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { mockMaterials, Material } from '../data/mockData';
import {
  Search, Filter, X, CheckCircle2, AlertTriangle, XCircle, Clock,
  ChevronRight, Plus, Tag, Eye, ShieldCheck, ShieldAlert, ShieldX,
  Layers, Star, ArrowRight, Info, Upload, FileText, History
} from 'lucide-react';
import { toast } from 'sonner';

const AUTH_STATUS_CONFIG = {
  commercial: { label: '可商用', labelEn: 'Commercial', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  restricted: { label: '限制使用', labelEn: 'Restricted', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: <ShieldAlert className="w-3.5 h-3.5" /> },
  'non-commercial': { label: '非商用', labelEn: 'Non-commercial', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info className="w-3.5 h-3.5" /> },
  pending: { label: '待审核', labelEn: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: <Clock className="w-3.5 h-3.5" /> },
};

const RISK_CONFIG = {
  low: { label: '低风险', labelEn: 'Low Risk', color: 'text-green-600', dot: 'bg-green-400' },
  medium: { label: '中风险', labelEn: 'Med Risk', color: 'text-amber-600', dot: 'bg-amber-400' },
  high: { label: '高风险', labelEn: 'High Risk', color: 'text-red-600', dot: 'bg-red-500' },
};

const TAG_OPTIONS = ['云纹', '飞天', '龙纹', '莲花', '锦鸡', '牡丹', '传统', '现代', '可商用', '限制使用'];
const AUTH_OPTIONS = ['commercial', 'restricted', 'non-commercial', 'pending'] as const;

const MOCK_CASES = [
  { id: 'c1', project: '故宫文创·龙纹丝巾系列', client: '故宫博物院', result: '签约¥120,000', date: '2026-04-01', status: 'signed' },
  { id: 'c2', project: '敦煌研究院景区礼品', client: '敦煌研究院', result: '跟进中', date: '2026-03-25', status: 'follow_up' },
  { id: 'c3', project: '南博国宝纹样文创', client: '南京博物院', result: '签约¥95,000', date: '2026-02-18', status: 'signed' },
];

interface AddMaterialDialogProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

function AddMaterialDialog({ onClose, onConfirm }: AddMaterialDialogProps) {
  const { t } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', alias: '', source: '', author: '', inheritor: '',
    authStatus: 'pending' as keyof typeof AUTH_STATUS_CONFIG,
    authExpiry: '', region: '', craftLimits: '', description: '',
    tags: [] as string[], categories: [] as string[],
    riskLevel: 'low' as 'low' | 'medium' | 'high',
    registrationNo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const CATEGORIES = ['丝巾', '服饰', '礼盒', '软装', '壁挂', '文具', '全品类'];
  const TAG_OPTS = ['云纹', '传统', '现代', '可商用', '限制使用', '非遗', '吉祥', '自然'];

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.name.trim()) errs.name = t('素材名称不能为空', 'Name is required');
      if (!formData.source.trim()) errs.source = t('来源机构不能为空', 'Source is required');
      if (!formData.author.trim()) errs.author = t('作者信息不能为空', 'Author is required');
    }
    if (s === 2) {
      if (!formData.authExpiry) errs.authExpiry = t('请填写授权到期时间', 'Auth expiry required');
      if (!formData.region) errs.region = t('请填写适用地域', 'Region required');
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(t('请完善必填信息后继续', 'Please fill required fields'));
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1200));
    setSubmitting(false);
    onConfirm(formData);
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter(t => t !== tag) : [...prev.tags, tag],
    }));
  };

  const toggleCategory = (cat: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(cat) ? prev.categories.filter(c => c !== cat) : [...prev.categories, cat],
    }));
  };

  const steps = [
    t('基础信息', 'Basic Info'),
    t('授权信息', 'Auth Info'),
    t('分类标签', 'Tags & Category'),
  ];

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">{t('新增素材', 'Add Material')}</h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
              <X className="w-4 h-4" />
            </button>
          </div>
          {/* Step Indicator */}
          <div className="flex items-center gap-0">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 ${i < step - 1 ? 'text-green-600' : i === step - 1 ? 'text-[#8B1C1C]' : 'text-gray-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                    i < step - 1 ? 'bg-green-500 border-green-500 text-white' :
                    i === step - 1 ? 'border-[#8B1C1C] text-[#8B1C1C]' :
                    'border-gray-200 text-gray-300'
                  }`}>
                    {i < step - 1 ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </div>
                  <span className="text-xs hidden sm:block">{s}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < step - 1 ? 'bg-green-300' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('素材名称', 'Material Name')}<span className="text-red-500">*</span></label>
                <input type="text" value={formData.name} onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
                  placeholder={t('如：云纹·四合如意', 'e.g. Cloud Pattern')} className={inputCls('name')} />
                {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{t('别名/简称', 'Alias')}</label>
                <input type="text" value={formData.alias} onChange={e => setFormData(p => ({ ...p, alias: e.target.value }))}
                  placeholder={t('如：如意云纹', 'e.g. Lucky Cloud')} className={inputCls('')} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('来源机构', 'Source')}<span className="text-red-500">*</span></label>
                <input type="text" value={formData.source} onChange={e => { setFormData(p => ({ ...p, source: e.target.value })); setErrors(p => ({ ...p, source: '' })); }}
                  placeholder={t('如：南京云锦研究所', 'e.g. Nanjing Yunjin Institute')} className={inputCls('source')} />
                {errors.source && <p className="text-xs text-red-500 mt-0.5">{errors.source}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('原作者', 'Author')}<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.author} onChange={e => { setFormData(p => ({ ...p, author: e.target.value })); setErrors(p => ({ ...p, author: '' })); }}
                    placeholder={t('作者姓名', 'Author name')} className={inputCls('author')} />
                  {errors.author && <p className="text-xs text-red-500 mt-0.5">{errors.author}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('传承人（选填）', 'Inheritor')}</label>
                  <input type="text" value={formData.inheritor} onChange={e => setFormData(p => ({ ...p, inheritor: e.target.value }))}
                    placeholder={t('如：国家级传承人', 'e.g. National Inheritor')} className={inputCls('')} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{t('素材描述', 'Description')}</label>
                <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
                  placeholder={t('简要描述素材的来源、特点和历史背景...', 'Brief description of origin, features and history...')}
                  rows={3} className={`${inputCls('')} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{t('登记编号（选填）', 'Registry No.')}</label>
                <input type="text" value={formData.registrationNo} onChange={e => setFormData(p => ({ ...p, registrationNo: e.target.value }))}
                  placeholder="YJ-2026-XXX" className={inputCls('')} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">{t('授权状态', 'Auth Status')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(AUTH_STATUS_CONFIG) as [keyof typeof AUTH_STATUS_CONFIG, any][]).map(([key, conf]) => (
                    <button
                      key={key}
                      onClick={() => setFormData(p => ({ ...p, authStatus: key }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all ${
                        formData.authStatus === key ? `${conf.bg} ${conf.color} ${conf.border} border-2` : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {conf.icon}
                      {t(conf.label, conf.labelEn)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('授权到期日', 'Auth Expiry')}<span className="text-red-500">*</span></label>
                  <input type="date" value={formData.authExpiry} onChange={e => { setFormData(p => ({ ...p, authExpiry: e.target.value })); setErrors(p => ({ ...p, authExpiry: '' })); }}
                    className={inputCls('authExpiry')} />
                  {errors.authExpiry && <p className="text-xs text-red-500 mt-0.5">{errors.authExpiry}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('适用地域', 'Region')}<span className="text-red-500">*</span></label>
                  <select value={formData.region} onChange={e => { setFormData(p => ({ ...p, region: e.target.value })); setErrors(p => ({ ...p, region: '' })); }}
                    className={inputCls('region')}>
                    <option value="">{t('选择地域...', 'Select region...')}</option>
                    {['全国', '华东', '华南', '华北', '西部', '港澳台', '海外'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.region && <p className="text-xs text-red-500 mt-0.5">{errors.region}</p>}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">{t('工艺限制说明', 'Craft Constraints')}</label>
                <textarea value={formData.craftLimits} onChange={e => setFormData(p => ({ ...p, craftLimits: e.target.value }))}
                  placeholder={t('如：色数≤12色，纬线浮长≤8mm，适用品类：丝巾/服饰...', 'e.g. Colors ≤12, weft float ≤8mm...')}
                  rows={3} className={`${inputCls('')} resize-none`} />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1.5 block">{t('风险等级', 'Risk Level')}</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(level => {
                    const conf = RISK_CONFIG[level];
                    return (
                      <button
                        key={level}
                        onClick={() => setFormData(p => ({ ...p, riskLevel: level }))}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs transition-all ${
                          formData.riskLevel === level ? `${conf.color} border-current bg-current/10` : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        <div className={`w-2 h-2 rounded-full ${formData.riskLevel === level ? conf.dot : 'bg-gray-300'}`} />
                        {t(conf.label, conf.labelEn)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-600 mb-2 block">{t('适用品类', 'Categories')}</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        formData.categories.includes(cat) ? 'bg-[#8B1C1C] text-white border-[#8B1C1C]' : 'border-gray-200 text-gray-500 hover:border-amber-400'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-2 block">{t('题材标签', 'Tags')}</label>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        formData.tags.includes(tag) ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-500 hover:border-amber-400'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
              {/* Image Upload placeholder */}
              <div>
                <label className="text-xs text-gray-600 mb-2 block">{t('素材图片', 'Material Image')}</label>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-amber-400 transition-colors cursor-pointer"
                  onClick={() => toast.info(t('图片上传功能开发中', 'Image upload coming soon'))}>
                  <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">{t('点击上传素材参考图', 'Click to upload reference image')}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{t('支持 JPG/PNG，最大 10MB', 'JPG/PNG, max 10MB')}</p>
                </div>
              </div>
              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs space-y-1.5">
                <p className="text-gray-500 mb-2">{t('信息确认', 'Summary')}</p>
                {[
                  { label: t('名称', 'Name'), value: formData.name || '-' },
                  { label: t('来源', 'Source'), value: formData.source || '-' },
                  { label: t('授权状态', 'Auth'), value: AUTH_STATUS_CONFIG[formData.authStatus].label },
                  { label: t('地域', 'Region'), value: formData.region || '-' },
                  { label: t('到期', 'Expiry'), value: formData.authExpiry || '-' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-gray-400">{item.label}</span>
                    <span className="text-gray-700">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-gray-100 flex gap-3">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {t('上一步', 'Back')}
            </button>
          ) : (
            <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              {t('取消', 'Cancel')}
            </button>
          )}
          {step < 3 ? (
            <button onClick={handleNext} className="flex-1 py-2.5 bg-[#8B1C1C] text-white rounded-xl text-sm hover:bg-[#7A1818] transition-colors">
              {t('下一步', 'Next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors ${submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}
            >
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('提交中...', 'Submitting...')}</> : t('确认提交', 'Submit')}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface CasesModalProps {
  material: Material;
  onClose: () => void;
}

function CasesModal({ material, onClose }: CasesModalProps) {
  const { t } = useApp();
  const statusLabels: Record<string, string> = {
    signed: t('已签约', 'Signed'),
    follow_up: t('跟进中', 'Follow Up'),
    presenting: t('提案中', 'Presenting'),
  };
  const statusColors: Record<string, string> = {
    signed: 'text-green-600 bg-green-50',
    follow_up: 'text-blue-600 bg-blue-50',
    presenting: 'text-amber-600 bg-amber-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <History className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <h3 className="text-gray-900">{t('历史成交案例', 'Historical Cases')}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{material.name} · {material.historyCases}{t('个案例', ' cases')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {MOCK_CASES.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="border border-gray-100 rounded-xl p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm text-gray-800">{c.project}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.client}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status]}`}>
                  {statusLabels[c.status]}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">{c.date}</span>
                <span className="text-green-600">{c.result}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 bg-amber-50 rounded-xl p-3">
          <p className="text-xs text-amber-700">
            {t(`「${material.name}」已累计应用于 ${material.historyCases} 个成交项目，授权覆盖 ${material.categories.join('、')} 等品类。`, 
              `"${material.name}" has been used in ${material.historyCases} signed projects.`)}
          </p>
        </div>

        <button onClick={onClose} className="w-full mt-4 py-2.5 bg-[#8B1C1C] text-white rounded-xl text-sm hover:bg-[#7A1818] transition-colors">
          {t('关闭', 'Close')}
        </button>
      </motion.div>
    </motion.div>
  );
}

interface AddToProposalDialogProps {
  material: Material;
  onClose: () => void;
  onConfirm: () => void;
}

function AddToProposalDialog({ material, onClose, onConfirm }: AddToProposalDialogProps) {
  const { t } = useApp();
  const authConf = AUTH_STATUS_CONFIG[material.authStatus];
  const isBlocked = material.authStatus === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${authConf.bg}`}>
            {isBlocked ? <ShieldX className="w-5 h-5 text-red-500" /> : <ShieldCheck className="w-5 h-5 text-green-600" />}
          </div>
          <div>
            <h3 className="text-gray-900">{t('授权校验结果', 'Authorization Check Result')}</h3>
            <p className="text-xs text-gray-500">{material.name}</p>
          </div>
        </div>

        {isBlocked ? (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
            <div className="flex gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700">{t('授权信息不完整，禁止加入方案', 'Incomplete authorization, cannot add to proposal')}</p>
                <p className="text-xs text-red-500 mt-1">{t('请联系运营/法务补全授权字段后再使用', 'Please contact Operations/Legal to complete auth fields')}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-4">
            <div className="flex gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-green-700">{t('授权校验通过，可加入当前方案', 'Authorization passed, can add to proposal')}</p>
                <ul className="mt-2 space-y-1">
                  {material.authRange.map((r, i) => (
                    <li key={i} className="text-xs text-green-600 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-green-400" />
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">{t('授权到期', 'Auth Expiry')}</span>
            <span className="text-gray-700">{material.authExpiry}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('工艺限制', 'Craft Limits')}</span>
            <span className="text-gray-700 text-right max-w-[60%]">{material.craftLimits.substring(0, 40)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">{t('登记编号', 'Registry No.')}</span>
            <span className="text-gray-700 font-mono">{material.registrationNo}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {t('取消', 'Cancel')}
          </button>
          <button
            onClick={isBlocked ? undefined : onConfirm}
            disabled={isBlocked}
            className={`flex-1 py-2.5 rounded-xl text-sm transition-colors ${isBlocked ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}
          >
            {isBlocked ? t('无法添加', 'Cannot Add') : t('确认加入', 'Confirm Add')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function MaterialLedgerPage() {
  const { t, clearRedDot } = useApp();
  const [materials, setMaterials] = useState(mockMaterials);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAuth, setSelectedAuth] = useState<string[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [checkingMaterial, setCheckingMaterial] = useState<Material | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [casesForMaterial, setCasesForMaterial] = useState<Material | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    clearRedDot('materials');
    const saved = sessionStorage.getItem('materialSearch');
    if (saved) { setSearchQuery(saved); }
  }, []);

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    sessionStorage.setItem('materialSearch', q);
  };

  const filtered = materials.filter(m => {
    const q = searchQuery.toLowerCase().replace(/\s/g, '');
    const nameMatch = !q || m.name.toLowerCase().replace(/\s/g, '').includes(q) || m.alias.toLowerCase().includes(q) || m.tags.some(tag => tag.toLowerCase().includes(q));
    const tagMatch = selectedTags.length === 0 || selectedTags.some(t => m.tags.includes(t));
    const authMatch = selectedAuth.length === 0 || selectedAuth.includes(m.authStatus);
    return nameMatch && tagMatch && authMatch;
  });

  const handleAddToProposal = (m: Material) => {
    setCheckingMaterial(m);
  };

  const handleConfirmAdd = () => {
    if (!checkingMaterial) return;
    toast.success(t(`「${checkingMaterial.name}」已加入当前方案`, `"${checkingMaterial.name}" added to proposal`), {
      description: t('授权校验通过，操作已记录日志', 'Auth checked, operation logged'),
    });
    setCheckingMaterial(null);
  };

  const handleAddMaterial = (data: any) => {
    const newMaterial: Material = {
      id: `m${Date.now()}`,
      name: data.name,
      alias: data.alias || '',
      source: data.source,
      author: data.author,
      inheritor: data.inheritor || '-',
      authStatus: data.authStatus,
      authRange: [data.region, data.authStatus === 'commercial' ? '可商用' : '限制使用'],
      authExpiry: data.authExpiry || '待确认',
      region: data.region || '全国',
      categories: data.categories.length > 0 ? data.categories : ['待审核'],
      craftLimits: data.craftLimits || '待补充',
      complexity: 5, colorCount: 8,
      tags: data.tags.length > 0 ? data.tags : ['新录入'],
      imageUrl: 'https://images.unsplash.com/photo-1718653159704-dbe7e2a99b36?w=400',
      registrationNo: data.registrationNo || '待录入',
      evidenceNo: '-',
      riskLevel: data.riskLevel,
      historyCases: 0,
      description: data.description || '素材信息录入中...',
    };
    setMaterials(prev => [newMaterial, ...prev]);
    setShowAddDialog(false);
    toast.success(t('素材录入成功！', 'Material added successfully!'), {
      description: t(`「${data.name}」已加入素材台账，授权状态：${AUTH_STATUS_CONFIG[data.authStatus as keyof typeof AUTH_STATUS_CONFIG].label}`, `Added to ledger`),
    });
  };

  return (
    <div className="flex h-full">
      {/* Left: Filter Panel */}
      <div className="w-56 flex-shrink-0 border-r border-gray-100 bg-white p-4 overflow-y-auto">
        <h3 className="text-sm text-gray-700 mb-4">{t('检索条件', 'Filters')}</h3>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && toast.info(t('已执行检索', 'Search executed'))}
            placeholder={t('关键词搜索（不区分大小写）', 'Search...')}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-200 bg-gray-50"
          />
          {searchQuery && (
            <button onClick={() => handleSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
              <X className="w-3 h-3 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 -mt-2 mb-4">{t('⌨ Enter键执行检索', '⌨ Press Enter to search')}</p>

        {/* Auth Status Filter */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">{t('授权状态', 'Auth Status')}</p>
          {AUTH_OPTIONS.map(status => {
            const conf = AUTH_STATUS_CONFIG[status];
            const active = selectedAuth.includes(status);
            return (
              <button
                key={status}
                onClick={() => setSelectedAuth(prev => active ? prev.filter(s => s !== status) : [...prev, status])}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded-lg mb-1 text-xs transition-all ${active ? `${conf.bg} ${conf.color} border ${conf.border}` : 'text-gray-500 hover:bg-gray-50'}`}
              >
                {conf.icon}
                {t(conf.label, conf.labelEn)}
              </button>
            );
          })}
        </div>

        {/* Tag Filter */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">{t('题材标签', 'Tags')}</p>
          <div className="flex flex-wrap gap-1">
            {TAG_OPTIONS.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => active ? prev.filter(t => t !== tag) : [...prev, tag])}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${active ? 'bg-[#8B1C1C] text-white border-[#8B1C1C]' : 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600'}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {(selectedTags.length > 0 || selectedAuth.length > 0 || searchQuery) && (
          <button
            onClick={() => { setSelectedTags([]); setSelectedAuth([]); setSearchQuery(''); sessionStorage.removeItem('materialSearch'); }}
            className="w-full text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 justify-center py-2"
          >
            <X className="w-3 h-3" /> {t('清空筛选', 'Clear filters')}
          </button>
        )}
      </div>

      {/* Middle: Material Grid */}
      <div className="flex-1 overflow-y-auto p-4 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">{t('素材列表', 'Materials')}</span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
              {filtered.length}{t('个结果', ' results')}
            </span>
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 text-xs text-white bg-[#8B1C1C] px-3 py-1.5 rounded-lg hover:bg-[#7A1818] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t('新增素材', 'Add Material')}
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 text-sm">{t('未找到匹配素材', 'No matching materials')}</p>
            <p className="text-gray-400 text-xs mt-1">{t('尝试不同的关键词或筛选条件', 'Try different keywords or filters')}</p>
            <button onClick={() => { setSelectedTags([]); setSelectedAuth([]); setSearchQuery(''); }} className="mt-3 text-xs text-amber-600 hover:underline">
              {t('清空所有筛选', 'Clear all filters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((material, i) => {
              const authConf = AUTH_STATUS_CONFIG[material.authStatus];
              const riskConf = RISK_CONFIG[material.riskLevel];
              const isSelected = selectedMaterial?.id === material.id;
              return (
                <motion.div
                  key={material.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedMaterial(isSelected ? null : material)}
                  className={`bg-white rounded-xl border cursor-pointer transition-all hover:shadow-md overflow-hidden group ${isSelected ? 'border-[#8B1C1C] ring-1 ring-[#8B1C1C]/20 shadow-md' : 'border-gray-100 hover:border-amber-200'}`}
                >
                  <div className="relative h-36 overflow-hidden">
                    <img src={material.imageUrl} alt={material.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute top-2 left-2">
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${authConf.bg} ${authConf.color} ${authConf.border}`}>
                        {authConf.icon}
                        {t(authConf.label, authConf.labelEn)}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full bg-white/90 ${riskConf.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${riskConf.dot}`} />
                        {t(riskConf.label, riskConf.labelEn)}
                      </span>
                    </div>
                    {material.riskLevel === 'high' && (
                      <div className="absolute bottom-2 left-0 right-0 mx-2">
                        <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {t('高风险：需专项审批', 'High risk: requires approval')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm text-gray-800">{material.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5">{material.inheritor || material.author}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {material.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-xs bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                      <button
                        onClick={e => { e.stopPropagation(); setCasesForMaterial(material); }}
                        className="text-xs text-gray-400 hover:text-amber-600 transition-colors flex items-center gap-1"
                      >
                        <History className="w-3 h-3" />
                        {material.historyCases}{t('个案例', ' cases')}
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); handleAddToProposal(material); }}
                        className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors ${
                          material.authStatus === 'pending' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                          material.riskLevel === 'high' ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' :
                          'bg-[#8B1C1C]/10 text-[#8B1C1C] hover:bg-[#8B1C1C]/20'
                        }`}
                        disabled={material.authStatus === 'pending'}
                        title={material.authStatus === 'pending' ? t('授权待审核，不可加入', 'Pending authorization') : ''}
                      >
                        <Plus className="w-3 h-3" />
                        {t('加入方案', 'Add to Proposal')}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Detail Panel */}
      <AnimatePresence>
        {selectedMaterial && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex-shrink-0 border-l border-gray-100 bg-white overflow-y-auto overflow-x-hidden"
          >
            <div className="p-4 min-w-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-700">{t('素材详情', 'Material Detail')}</h3>
                <button onClick={() => setSelectedMaterial(null)} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <img src={selectedMaterial.imageUrl} alt={selectedMaterial.name} className="w-full h-44 object-cover rounded-xl mb-4" />

              <div className="space-y-3">
                <div>
                  <h2 className="text-gray-900 text-base">{selectedMaterial.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{selectedMaterial.alias && `别名：${selectedMaterial.alias}`}</p>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed">{selectedMaterial.description}</p>

                <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                  {[
                    { label: t('来源', 'Source'), value: selectedMaterial.source },
                    { label: t('作者/传承人', 'Author'), value: selectedMaterial.inheritor || selectedMaterial.author },
                    { label: t('登记编号', 'Registry No.'), value: selectedMaterial.registrationNo, mono: true },
                    { label: t('存证编号', 'Evidence No.'), value: selectedMaterial.evidenceNo, mono: true },
                    { label: t('授权到期', 'Auth Expiry'), value: selectedMaterial.authExpiry },
                    { label: t('适用地域', 'Region'), value: selectedMaterial.region },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between gap-2">
                      <span className="text-gray-500 flex-shrink-0">{item.label}</span>
                      <span className={`text-gray-700 text-right ${item.mono ? 'font-mono text-[10px]' : ''}`}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1.5">{t('授权范围', 'Auth Range')}</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedMaterial.authRange.map((r, i) => (
                      <span key={i} className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100">{r}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs text-amber-700 flex items-center gap-1 mb-1">
                    <Layers className="w-3 h-3" /> {t('工艺限制', 'Craft Constraints')}
                  </p>
                  <p className="text-xs text-amber-600">{selectedMaterial.craftLimits}</p>
                  <div className="flex gap-3 mt-2">
                    <span className="text-xs text-amber-600">{t('复杂度', 'Complexity')}: {selectedMaterial.complexity}/10</span>
                    <span className="text-xs text-amber-600">{t('色数', 'Colors')}: ≤{selectedMaterial.colorCount}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  {selectedMaterial.historyCases} {t('个历史成交案例', 'historical cases')}
                  <button
                    onClick={() => setCasesForMaterial(selectedMaterial)}
                    className="ml-auto text-amber-600 hover:underline flex items-center gap-0.5"
                  >
                    {t('查看案例', 'View cases')} <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => handleAddToProposal(selectedMaterial)}
                  disabled={selectedMaterial.authStatus === 'pending'}
                  className={`w-full py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 ${
                    selectedMaterial.authStatus === 'pending'
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                  {selectedMaterial.authStatus === 'pending' ? t('授权待审核', 'Auth Pending') : t('加入当前方案', 'Add to Proposal')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {checkingMaterial && (
          <AddToProposalDialog
            material={checkingMaterial}
            onClose={() => setCheckingMaterial(null)}
            onConfirm={handleConfirmAdd}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddDialog && (
          <AddMaterialDialog
            onClose={() => setShowAddDialog(false)}
            onConfirm={handleAddMaterial}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {casesForMaterial && (
          <CasesModal
            material={casesForMaterial}
            onClose={() => setCasesForMaterial(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
