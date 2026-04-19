import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { mockProposals, Proposal, mockDesignDirections } from '../data/mockData';
import { ProtectedImage } from '../components/ProtectedImage';
import {
  Search, Plus, ChevronRight, ChevronLeft, X, User, MapPin, Phone,
  DollarSign, CheckCircle2, Star, 
  Package, Shield, Eye, Edit2, Maximize2,
  Minimize2, ArrowRight, 
  Download
} from 'lucide-react';
import { toast } from 'sonner';

const INTENT_CONFIG = {
  high: { label: '高意向', labelEn: 'High', stars: 3, color: 'text-amber-600' },
  medium: { label: '中意向', labelEn: 'Medium', stars: 2, color: 'text-blue-500' },
  low: { label: '低意向', labelEn: 'Low', stars: 1, color: 'text-gray-400' },
};

const SCENE_OPTIONS = ['博物馆文创', '景区礼品', '礼赠品牌联名', '空间软装', '策展装置', '服饰时尚'];
const CATEGORY_OPTIONS = ['礼盒', '丝巾', '服饰', '软装', '壁挂', '文具', '空间装置'];

// ─── New Proposal Wizard ─────────────────────────────────────────────────────

interface NewProposalWizardProps {
  onClose: () => void;
  onConfirm: (data: any) => void;
}

function NewProposalWizard({ onClose, onConfirm }: NewProposalWizardProps) {
  const { t } = useApp();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    projectName: '', client: '', contactPerson: '', phone: '', email: '',
    scene: '', category: '', budget: '', intentLevel: 'medium' as 'high' | 'medium' | 'low',
    selectedDirection: null as typeof mockDesignDirections[0] | null,
    authNote: '', priceRange: '', deliveryDays: '30', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const STEPS = [
    t('客户信息', 'Client Info'),
    t('场景方向', 'Scene & Direction'),
    t('授权预览', 'Auth Preview'),
    t('确认报价', 'Confirm Quote'),
  ];

  const validateStep = (s: number) => {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!formData.projectName.trim()) errs.projectName = t('请填写项目名称', 'Project name required');
      if (!formData.client.trim()) errs.client = t('请填写客户机构', 'Client required');
      if (!formData.contactPerson.trim()) errs.contactPerson = t('请填写联系人', 'Contact required');
      if (!formData.phone.trim()) errs.phone = t('请填写联系电话', 'Phone required');
    }
    if (s === 2) {
      if (!formData.scene) errs.scene = t('请选择客户场景', 'Scene required');
      if (!formData.category) errs.category = t('请选择品类目标', 'Category required');
      if (!formData.budget.trim()) errs.budget = t('请填写预算区间', 'Budget required');
    }
    if (s === 4) {
      if (!formData.priceRange.trim()) errs.priceRange = t('请填写报价区间', 'Price range required');
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error(t('请完善必填信息', 'Please fill required fields'), {
        description: t('爬楼梯原则：标红提示第一个出错字段', 'Navigation: first error field highlighted'),
      });
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const errs = validateStep(4);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1400));
    setSubmitting(false);
    onConfirm(formData);
  };

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none focus:border-amber-400 transition-colors ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header with step indicators */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-900">{t('新建提案', 'New Proposal')}</h3>
              <p className="text-xs text-gray-400">{t('4步原则 · 完成留资', '4-step principle · Lead capture')}</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center gap-1.5 flex-shrink-0 ${i < step - 1 ? 'text-green-600' : i === step - 1 ? 'text-[#8B1C1C]' : 'text-gray-300'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 flex-shrink-0 ${
                    i < step - 1 ? 'bg-green-500 border-green-500 text-white' :
                    i === step - 1 ? 'border-[#8B1C1C] text-[#8B1C1C]' : 'border-gray-200 text-gray-300'
                  }`}>{i < step - 1 ? '✓' : i + 1}</div>
                  <span className="text-xs hidden sm:block">{s}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 ${i < step - 1 ? 'bg-green-300' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('项目名称', 'Project Name')}<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.projectName}
                    onChange={e => { setFormData(p => ({ ...p, projectName: e.target.value })); setErrors(p => ({ ...p, projectName: '' })); }}
                    placeholder={t('如：故宫文创·龙纹丝巾系列', 'e.g. Museum Gift Design')} className={inputCls('projectName')} autoFocus />
                  {errors.projectName && <p className="text-xs text-red-500 mt-0.5">{errors.projectName}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('客户机构', 'Client Organization')}<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.client}
                    onChange={e => { setFormData(p => ({ ...p, client: e.target.value })); setErrors(p => ({ ...p, client: '' })); }}
                    placeholder={t('如：故宫博物院文创部', 'e.g. Palace Museum')} className={inputCls('client')} />
                  {errors.client && <p className="text-xs text-red-500 mt-0.5">{errors.client}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('联系人', 'Contact')}<span className="text-red-500">*</span></label>
                    <input type="text" value={formData.contactPerson}
                      onChange={e => { setFormData(p => ({ ...p, contactPerson: e.target.value })); setErrors(p => ({ ...p, contactPerson: '' })); }}
                      placeholder={t('联系人姓名', 'Contact name')} className={inputCls('contactPerson')} />
                    {errors.contactPerson && <p className="text-xs text-red-500 mt-0.5">{errors.contactPerson}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('联系电话', 'Phone')}<span className="text-red-500">*</span></label>
                    <input type="text" value={formData.phone}
                      onChange={e => { setFormData(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
                      placeholder="138****0000" className={inputCls('phone')} />
                    {errors.phone && <p className="text-xs text-red-500 mt-0.5">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('邮箱（选填）', 'Email (optional)')}</label>
                  <input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                    placeholder="email@example.com" className={inputCls('')} />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1.5 block">{t('客户意向', 'Intent Level')}</label>
                  <div className="flex gap-2">
                    {(['high', 'medium', 'low'] as const).map(level => {
                      const conf = INTENT_CONFIG[level];
                      return (
                        <button key={level} onClick={() => setFormData(p => ({ ...p, intentLevel: level }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs transition-all ${
                            formData.intentLevel === level ? `${conf.color} border-current bg-current/10` : 'border-gray-200 text-gray-400 hover:bg-gray-50'
                          }`}>
                          <div className="flex gap-0.5">{Array.from({ length: conf.stars }).map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-current" />)}</div>
                          {t(conf.label, conf.labelEn)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('客户场景', 'Scene')}<span className="text-red-500">*</span></label>
                    <select value={formData.scene}
                      onChange={e => { setFormData(p => ({ ...p, scene: e.target.value })); setErrors(p => ({ ...p, scene: '' })); }}
                      className={inputCls('scene')}>
                      <option value="">{t('选择场景...', 'Select...')}</option>
                      {SCENE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.scene && <p className="text-xs text-red-500 mt-0.5">{errors.scene}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('品类目标', 'Category')}<span className="text-red-500">*</span></label>
                    <select value={formData.category}
                      onChange={e => { setFormData(p => ({ ...p, category: e.target.value })); setErrors(p => ({ ...p, category: '' })); }}
                      className={inputCls('category')}>
                      <option value="">{t('选择品类...', 'Select...')}</option>
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {errors.category && <p className="text-xs text-red-500 mt-0.5">{errors.category}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('预算区间', 'Budget Range')}<span className="text-red-500">*</span></label>
                  <input type="text" value={formData.budget}
                    onChange={e => { setFormData(p => ({ ...p, budget: e.target.value })); setErrors(p => ({ ...p, budget: '' })); }}
                    placeholder={t('如：¥80,000 - ¥150,000', 'e.g. ¥80,000 - ¥150,000')} className={inputCls('budget')} />
                  {errors.budget && <p className="text-xs text-red-500 mt-0.5">{errors.budget}</p>}
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-2 block">{t('关联设计方向（选填）', 'Link Design Direction (optional)')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {mockDesignDirections.map(dir => (
                      <button key={dir.id}
                        onClick={() => setFormData(p => ({ ...p, selectedDirection: p.selectedDirection?.id === dir.id ? null : dir }))}
                        className={`relative rounded-xl border overflow-hidden transition-all ${formData.selectedDirection?.id === dir.id ? 'border-[#8B1C1C] ring-2 ring-[#8B1C1C]/20' : 'border-gray-200 hover:border-amber-300'}`}>
                        <ProtectedImage src={dir.imageUrl} alt={dir.title} className="w-full h-16 object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <p className="absolute bottom-1 left-1 right-1 text-white text-[10px] leading-tight">{dir.title}</p>
                        {dir.recommended && <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />}
                      </button>
                    ))}
                  </div>
                  {formData.selectedDirection && (
                    <div className="mt-2 bg-amber-50 rounded-lg p-2 text-xs text-amber-700">
                      ✓ {t(`已关联方向：${formData.selectedDirection.title}`, `Linked: ${formData.selectedDirection.title}`)}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-700">{t('授权自动校验', 'Auto Authorization Check')}</p>
                      <p className="text-xs text-blue-500 mt-1">
                        {formData.selectedDirection
                          ? t(`已关联方向「${formData.selectedDirection.title}」，使用素材：${formData.selectedDirection.elements.join('、')}`, `Direction linked: ${formData.selectedDirection.title}`)
                          : t('未关联设计方向，授权信息将在后续补充', 'No direction linked, auth info to be added later')}
                      </p>
                    </div>
                  </div>
                </div>
                {formData.selectedDirection && (
                  <div className="space-y-2">
                    {formData.selectedDirection.elements.map((el, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs text-gray-700">{el}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{t('授权校验通过 · 可商用', 'Auth passed · Commercial use')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('授权说明备注（选填）', 'Auth Notes (optional)')}</label>
                  <textarea value={formData.authNote} onChange={e => setFormData(p => ({ ...p, authNote: e.target.value }))}
                    placeholder={t('如：龙纹·五爪正龙：故宫专属授权，本项目已获授权确认', 'e.g. Auth details...')}
                    rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 resize-none" />
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                  <p>{t('提案原则：仅展示已校验授权素材；草稿仅供参考，不可直接授权使用。', 'Principle: Only verified materials shown; drafts are reference only.')}</p>
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('报价区间', 'Price Range')}<span className="text-red-500">*</span></label>
                    <input type="text" value={formData.priceRange}
                      onChange={e => { setFormData(p => ({ ...p, priceRange: e.target.value })); setErrors(p => ({ ...p, priceRange: '' })); }}
                      placeholder={t('如：¥85,000起', 'e.g. ¥85,000+')} className={inputCls('priceRange')} />
                    {errors.priceRange && <p className="text-xs text-red-500 mt-0.5">{errors.priceRange}</p>}
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">{t('交付周期（天）', 'Delivery (days)')}</label>
                    <input type="number" value={formData.deliveryDays} onChange={e => setFormData(p => ({ ...p, deliveryDays: e.target.value }))}
                      placeholder="30" min="1" max="365" className={inputCls('')} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">{t('提案备注', 'Proposal Notes')}</label>
                  <textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))}
                    placeholder={t('如：优先考虑传统工艺方向，客户对色彩要求较高...', 'e.g. Client prefers traditional craft...')}
                    rows={3} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 resize-none" />
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-xs space-y-1.5">
                  <p className="text-gray-500 mb-2">{t('提案摘要确认', 'Proposal Summary')}</p>
                  {[
                    { label: t('项目', 'Project'), value: formData.projectName },
                    { label: t('客户', 'Client'), value: formData.client },
                    { label: t('场景', 'Scene'), value: formData.scene || '-' },
                    { label: t('品类', 'Category'), value: formData.category || '-' },
                    { label: t('预算', 'Budget'), value: formData.budget || '-' },
                    { label: t('报价', 'Price'), value: formData.priceRange || '-' },
                    { label: t('交付', 'Delivery'), value: `${formData.deliveryDays}${t('天', 'd')}` },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between">
                      <span className="text-gray-400">{item.label}</span>
                      <span className="text-gray-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
          {step < 4 ? (
            <button onClick={handleNext} className="flex-1 py-2.5 bg-[#8B1C1C] text-white rounded-xl text-sm hover:bg-[#7A1818] transition-colors flex items-center justify-center gap-2">
              {t('下一步', 'Next')} <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${submitting ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
              {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('创建中...', 'Creating...')}</> : <><CheckCircle2 className="w-4 h-4" />{t('确认创建提案', 'Create Proposal')}</>}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Proposal Dialog ────────────────────────────────────────────────────

function EditProposalDialog({ proposal, onClose, onSave }: { proposal: Proposal; onClose: () => void; onSave: (data: Partial<Proposal>) => void }) {
  const { t } = useApp();
  const [formData, setFormData] = useState({
    projectName: proposal.projectName,
    client: proposal.client,
    contactPerson: proposal.contactPerson,
    phone: proposal.phone,
    budget: proposal.budget,
    priceRange: proposal.priceRange,
    deliveryDays: proposal.deliveryDays,
    authNote: proposal.authNote,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    onSave(formData);
    toast.success(t('提案信息已更新', 'Proposal updated'), { description: t('修改已记录操作日志', 'Edit operation logged') });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900">{t('编辑提案', 'Edit Proposal')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {[
            { key: 'projectName', label: t('项目名称', 'Project Name') },
            { key: 'client', label: t('客户机构', 'Client') },
            { key: 'contactPerson', label: t('联系人', 'Contact') },
            { key: 'phone', label: t('联系电话', 'Phone') },
            { key: 'budget', label: t('预算区间', 'Budget Range') },
            { key: 'priceRange', label: t('报价区间', 'Price Range') },
          ].map(field => (
            <div key={field.key}>
              <label className="text-xs text-gray-600 mb-1 block">{field.label}</label>
              <input type="text" value={(formData as any)[field.key]}
                onChange={e => setFormData(p => ({ ...p, [field.key]: e.target.value }))}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 transition-colors" />
            </div>
          ))}
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t('交付周期（天）', 'Delivery (days)')}</label>
            <input type="number" value={formData.deliveryDays}
              onChange={e => setFormData(p => ({ ...p, deliveryDays: Number(e.target.value) }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">{t('授权说明', 'Auth Notes')}</label>
            <textarea value={formData.authNote} onChange={e => setFormData(p => ({ ...p, authNote: e.target.value }))}
              rows={2} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all ${saving ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('保存中...', 'Saving...')}</> : t('保存修改', 'Save')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Presentation Mode ──────────────────────────────────────────────────────

function PresentationMode({ proposal, images, onClose }: { proposal: Proposal; images: string[]; onClose: () => void }) {
  const { t } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showInfo, setShowInfo] = useState(true);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') setCurrentIndex(i => Math.min(images.length - 1, i + 1));
    if (e.key === 'ArrowLeft') setCurrentIndex(i => Math.max(0, i - 1));
  }, [onClose, images.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-[100] flex items-center justify-center"
    >
      {/* Main Image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-full max-h-full"
        >
          <ProtectedImage
            src={images[currentIndex]}
            alt={`Scheme ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
          />
        </motion.div>
      </AnimatePresence>

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent p-6 flex items-start justify-between">
        <div>
          <h2 className="text-white text-lg">{proposal.projectName}</h2>
          <p className="text-white/60 text-sm mt-0.5">{proposal.client} · {proposal.contactPerson}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInfo(!showInfo)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors" title={t('切换信息面板', 'Toggle Info')}>
            {showInfo ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
        <div className="flex items-end justify-between">
          <AnimatePresence>
            {showInfo && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-white">
                  <p className="text-xs text-white/60">{t('报价', 'Price')}</p>
                  <p className="text-sm">{proposal.priceRange}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-white">
                  <p className="text-xs text-white/60">{t('交付周期', 'Delivery')}</p>
                  <p className="text-sm">{proposal.deliveryDays}{t('天', 'd')}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-white max-w-xs">
                  <p className="text-xs text-white/60">{t('授权说明', 'Auth')}</p>
                  <p className="text-xs mt-0.5 text-white/80 line-clamp-1">{proposal.authNote}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-3 ml-auto">
            {/* Thumbnails */}
            <div className="flex gap-2">
              {images.map((img, i) => (
                <button key={i} onClick={() => setCurrentIndex(i)}
                  className={`w-12 h-9 rounded-lg overflow-hidden border-2 transition-all ${i === currentIndex ? 'border-white' : 'border-transparent opacity-50 hover:opacity-80'}`}>
                  <ProtectedImage src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <span className="text-white/60 text-sm">{currentIndex + 1} / {images.length}</span>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {currentIndex > 0 && (
        <button onClick={() => setCurrentIndex(i => i - 1)}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button onClick={() => setCurrentIndex(i => i + 1)}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* ESC hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs">
        {t('按 ESC 退出 · 方向键切换方案', 'Press ESC to exit · Arrow keys to navigate')}
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export function ProposalPage() {
  const { t, clearRedDot, setRedDot, copilotProposals } = useApp();
  const [proposals, setProposals] = useState(mockProposals);

  // Copilot proposals injected from context — shaped to match Proposal interface
  const copilotAsMock = copilotProposals.map(cp => ({
    id: cp.id,
    projectName: cp.title,
    client: cp.clientCompany,
    contactPerson: cp.clientName,
    phone: '—',
    scene: cp.directionType,
    budget: cp.budget,
    priceRange: cp.budget,
    deliveryDays: 30,
    intentLevel: 'high' as const,
    status: cp.status,
    schemes: 1,
    createdAt: cp.addedAt,
    updatedAt: cp.addedAt,
    manager: cp.clientName,
    coverImage: cp.patternImageUrl || 'https://images.unsplash.com/photo-1773394175834-2c407177ddcf?w=600',
    authNote: cp.summary,
  }));

  // Merge: copilot proposals appear at top, deduplicated
  const copilotIds = new Set(copilotAsMock.map(p => p.id));
  const mergedProposals = [
    ...copilotAsMock,
    ...proposals.filter(p => !copilotIds.has(p.id)),
  ];
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSchemeIndex, setCurrentSchemeIndex] = useState(0);
  const [showNewWizard, setShowNewWizard] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [presentationMode, setPresentationMode] = useState(false);

  useEffect(() => { clearRedDot('proposals'); }, []);

  const filtered = mergedProposals.filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.projectName.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
  });

  const schemeImages = selectedProposal ? [
    selectedProposal.coverImage,
    'https://images.unsplash.com/photo-1708772874052-104a4bb60079?w=800',
    'https://images.unsplash.com/photo-1702633958543-8e91aacb805e?w=800',
  ] : [];

  const handleCreateProposal = (data: any) => {
    const newProposal: Proposal = {
      id: `pr${Date.now()}`,
      projectName: data.projectName,
      client: data.client,
      contactPerson: data.contactPerson,
      phone: data.phone,
      scene: data.scene || '博物馆文创',
      budget: data.budget || '-',
      intentLevel: data.intentLevel,
      status: 'draft',
      schemes: data.selectedDirection ? 1 : 0,
      createdAt: '2026-04-03',
      updatedAt: '刚刚',
      manager: '当前用户',
      coverImage: data.selectedDirection?.imageUrl || 'https://images.unsplash.com/photo-1646181865497-4a1cb7508249?w=600',
      authNote: data.authNote || data.selectedDirection?.elements?.join('、') + ' 授权待确认' || '授权信息待补充',
      deliveryDays: parseInt(data.deliveryDays) || 30,
      priceRange: data.priceRange || data.budget,
    };
    setProposals(prev => [newProposal, ...prev]);
    setSelectedProposal(newProposal);
    setShowNewWizard(false);
    toast.success(t(`提案「${data.projectName}」已创建！`, `Proposal "${data.projectName}" created!`), {
      description: t('4步原则：提案已就绪，可开始提案展示', '4-step: Proposal ready for presentation'),
    });
    setRedDot('proposals', 1);
  };



  const handleEditSave = (id: string, data: Partial<Proposal>) => {
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...data, updatedAt: '刚刚' } : p));
    if (selectedProposal?.id === id) {
      setSelectedProposal(prev => prev ? { ...prev, ...data, updatedAt: '刚刚' } : null);
    }
  };

  return (
    <div className="flex h-full">
      {/* Left Panel: Proposal List */}
      <div className="w-80 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
        <div className="p-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm text-gray-700">{t('提案列表', 'Proposals')}</h3>
            <button onClick={() => setShowNewWizard(true)}
              className="flex items-center gap-1 text-xs text-white bg-[#8B1C1C] px-2.5 py-1.5 rounded-lg hover:bg-[#7A1818] transition-colors">
              <Plus className="w-3.5 h-3.5" /> {t('新建', 'New')}
            </button>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('搜索客户或项目名称...', 'Search...')}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-gray-50" />
          </div>

        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((proposal, i) => {
            const intentConf = INTENT_CONFIG[proposal.intentLevel];
            const isSelected = selectedProposal?.id === proposal.id;
            return (
              <motion.button key={proposal.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                onClick={() => { setSelectedProposal(isSelected ? null : proposal); setCurrentSchemeIndex(0); }}
                className={`w-full p-3.5 border-b border-gray-50 text-left hover:bg-gray-50 transition-colors ${isSelected ? 'bg-amber-50 border-l-2 border-l-[#8B1C1C]' : ''}`}>
                <div className="flex items-start gap-2.5">
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                    <ProtectedImage src={proposal.coverImage} alt={proposal.projectName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs text-gray-800 truncate">{proposal.projectName}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{proposal.client}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`flex items-center gap-0.5 ${intentConf.color}`}>
                        {Array.from({ length: intentConf.stars }).map((_, j) => <Star key={j} className="w-2.5 h-2.5 fill-current" />)}
                      </div>
                      <span className="text-xs text-gray-400">{proposal.updatedAt}</span>
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right: Proposal Detail */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!selectedProposal ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                <Eye className="w-7 h-7 text-amber-400" />
              </div>
              <h3 className="text-gray-600 mb-1">{t('选择一个提案查看详情', 'Select a proposal to view details')}</h3>
              <p className="text-sm text-gray-400 mb-4">{t('20-30分钟内完成现场提案成交', 'Complete on-site proposal in 20-30 minutes')}</p>
              <button onClick={() => setShowNewWizard(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#8B1C1C] text-white rounded-xl text-sm hover:bg-[#7A1818] transition-colors">
                <Plus className="w-4 h-4" /> {t('新建提案', 'New Proposal')}
              </button>
            </motion.div>
          ) : (
            <motion.div key={selectedProposal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 max-w-4xl">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-gray-900 mb-1">{selectedProposal.projectName}</h2>
                  <p className="text-sm text-gray-500">{t('最后更新：', 'Last updated: ')}{selectedProposal.updatedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      toast.success(t('PDF导出中...', 'Exporting PDF...'), {
                        description: t('提案将导出为PDF格式', 'Proposal will be exported as PDF')
                      });
                      setTimeout(() => {
                        toast.success(t('PDF已导出', 'PDF exported successfully'));
                      }, 1500);
                    }}
                    className="flex items-center gap-1.5 text-sm border border-green-200 bg-green-50 px-3 py-1.5 rounded-lg text-green-700 hover:bg-green-100 transition-colors">
                    <Download className="w-3.5 h-3.5" /> {t('导出PDF', 'Export PDF')}
                  </button>
                  <button onClick={() => setPresentationMode(true)}
                    className="flex items-center gap-1.5 text-sm border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg text-amber-700 hover:bg-amber-100 transition-colors">
                    <Maximize2 className="w-3.5 h-3.5" /> {t('全屏展示', 'Present')}
                  </button>
                  <button onClick={() => setEditingProposal(selectedProposal)}
                    className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-1.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                    <Edit2 className="w-3.5 h-3.5" /> {t('编辑', 'Edit')}
                  </button>
                </div>
              </div>



              <div className="grid grid-cols-3 gap-5">
                {/* Client Info + Actions */}
                <div className="col-span-1 space-y-4">
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs text-gray-500 mb-3 uppercase tracking-wide">{t('客户信息', 'Client Info')}</h4>
                    <div className="space-y-2.5">
                      {[
                        { icon: <User className="w-3.5 h-3.5" />, label: selectedProposal.contactPerson },
                        { icon: <MapPin className="w-3.5 h-3.5" />, label: selectedProposal.client },
                        { icon: <Phone className="w-3.5 h-3.5" />, label: selectedProposal.phone },
                        { icon: <Package className="w-3.5 h-3.5" />, label: selectedProposal.scene },
                        { icon: <DollarSign className="w-3.5 h-3.5" />, label: selectedProposal.budget },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="text-gray-400 flex-shrink-0">{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className={`mt-3 flex items-center gap-1 text-xs ${INTENT_CONFIG[selectedProposal.intentLevel].color}`}>
                      {Array.from({ length: INTENT_CONFIG[selectedProposal.intentLevel].stars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                      <span>{t(INTENT_CONFIG[selectedProposal.intentLevel].label, INTENT_CONFIG[selectedProposal.intentLevel].labelEn)}</span>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h4 className="text-xs text-gray-500 mb-3 uppercase tracking-wide">{t('预算与授权', 'Budget & Authorization')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('报价', 'Price')}</span>
                        <span className="text-gray-800">{selectedProposal.priceRange}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">{t('交付周期', 'Delivery')}</span>
                        <span className="text-gray-800">{selectedProposal.deliveryDays} {t('天', 'days')}</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-blue-50 rounded-lg p-2.5">
                      <div className="flex items-start gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-700">{selectedProposal.authNote}</p>
                      </div>
                    </div>
                  </div>

                  {/* Deal Actions */}
                </div>

                {/* Scheme Display */}
                <div className="col-span-2">
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="relative">
                      <ProtectedImage
                        src={schemeImages[currentSchemeIndex]}
                        alt={`Scheme ${currentSchemeIndex + 1}`}
                        className="w-full h-72 object-cover cursor-zoom-in"
                        onClick={() => setPresentationMode(true)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                      {schemeImages.length > 1 && (
                        <>
                          <button onClick={() => setCurrentSchemeIndex(Math.max(0, currentSchemeIndex - 1))} disabled={currentSchemeIndex === 0}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors">
                            <ChevronLeft className="w-4 h-4 text-gray-700" />
                          </button>
                          <button onClick={() => setCurrentSchemeIndex(Math.min(schemeImages.length - 1, currentSchemeIndex + 1))} disabled={currentSchemeIndex === schemeImages.length - 1}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center disabled:opacity-30 hover:bg-white transition-colors">
                            <ChevronRight className="w-4 h-4 text-gray-700" />
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-3 left-3 text-white">
                        <p className="text-xs opacity-70">{t('方案', 'Scheme')} {currentSchemeIndex + 1} / {selectedProposal.schemes}</p>
                      </div>
                      <button onClick={() => setPresentationMode(true)}
                        className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-lg text-white transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex gap-2 p-3 border-b border-gray-50">
                      {schemeImages.map((img, i) => (
                        <button key={i} onClick={() => {
                          if (i === currentSchemeIndex) {
                            setPresentationMode(true);
                            return;
                          }
                          setCurrentSchemeIndex(i);
                        }}
                          className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${currentSchemeIndex === i ? 'border-[#8B1C1C]' : 'border-transparent hover:border-amber-300'}`}>
                          <ProtectedImage src={img} alt={`thumb ${i}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      <h4 className="text-sm text-gray-700 mb-2">{t('设计说明', 'Design Description')}</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        {t('本方案融合云锦传统元素与现代设计语言，以传承非遗工艺为核心，结合客户场景需求，呈现独特的文化美学。所有素材已完成授权校验，工艺可行性评估已通过。', 'This proposal integrates traditional Yunjin elements with modern design language, centered on intangible cultural heritage craftsmanship.')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showNewWizard && (
          <NewProposalWizard onClose={() => setShowNewWizard(false)} onConfirm={handleCreateProposal} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingProposal && (
          <EditProposalDialog
            proposal={editingProposal}
            onClose={() => setEditingProposal(null)}
            onSave={data => handleEditSave(editingProposal.id, data)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {presentationMode && selectedProposal && (
          <PresentationMode proposal={selectedProposal} images={schemeImages} onClose={() => setPresentationMode(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
