import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { Award, Lock, CheckCircle2, AlertTriangle, Clock, Plus, ChevronRight, X, FileText, Upload, ArrowRight, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const STATUS_STEPS = ['草案', '已加密', '待认证', '认证中', '已认证'];

const MOCK_CERTS = [
  { id: 'c1', title: '故宫文创·龙纹丝巾系列', certNo: 'EC-2026-0087', date: '2026-04-01', status: '已认证', regNo: 'CPY-2026-0312', progress: 4 },
  { id: 'c2', title: '南京城市礼赠·云锦纹样', certNo: 'EC-2026-0134', date: '2026-04-04', status: '待认证', regNo: '-', progress: 2 },
  { id: 'c3', title: '水墨·流云系列', certNo: 'EC-2026-0108', date: '2026-03-28', status: '认证中', regNo: '-', progress: 3 },
  { id: 'c4', title: '苏博丝巾·莲花纹', certNo: 'EC-2026-0091', date: '2026-03-20', status: '已认证', regNo: 'CPY-2026-0287', progress: 4 },
];

const statusConfig: Record<string, { color: string; bg: string; dot: string }> = {
  '草案': { color: 'text-stone-500', bg: 'bg-stone-100', dot: 'bg-stone-400' },
  '已加密': { color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  '待认证': { color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  '认证中': { color: 'text-purple-700', bg: 'bg-purple-50', dot: 'bg-purple-500' },
  '已认证': { color: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500' },
  '驳回': { color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

function CertApplicationForm({ certId, onClose }: { certId: string; onClose: () => void }) {
  const { t } = useApp();
  const cert = MOCK_CERTS.find(c => c.id === certId);
  const [form, setForm] = useState({ subject: '南京鋆寰科技有限公司', title: cert?.title || '', desc: '', material: '', craft: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = '作品名称不能为空';
    if (!form.desc.trim()) errs.desc = '作品说明不能为空';
    if (!form.craft.trim()) errs.craft = '请填写工艺说明';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); toast.error('请完善必填信息'); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 1500));
    setSubmitting(false);
    toast.success('版权认证申请已提交！', { description: '预计 5-7 个工作日完成审核' });
    onClose();
  };

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 focus:outline-none transition-colors bg-[#F5F0E8] text-[#1A3D4A] placeholder:text-[#9B9590] ${errors[field] ? 'border-red-400' : 'border-[rgba(26,61,74,0.12)] focus:border-[#C4912A]'}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(13,37,53,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'white' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4" style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-[#C4912A]" />
            <div>
              <p className="text-white text-sm" style={{ fontWeight: 600 }}>提交版权认证申请</p>
              <p className="text-white/50 text-xs">证书编号：{cert?.certNo}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>认证主体 <span className="text-red-500">*</span></label>
            <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className={inputCls('subject')} />
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>作品名称 <span className="text-red-500">*</span></label>
            <input value={form.title} onChange={e => { setForm(p => ({ ...p, title: e.target.value })); setErrors(p => ({ ...p, title: '' })); }} className={inputCls('title')} />
            {errors.title && <p className="text-xs text-red-500 mt-0.5">{errors.title}</p>}
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>作品说明 <span className="text-red-500">*</span></label>
            <textarea value={form.desc} onChange={e => { setForm(p => ({ ...p, desc: e.target.value })); setErrors(p => ({ ...p, desc: '' })); }}
              rows={3} placeholder="描述作品的创作背景、文化内涵、表现形式等..."
              className={inputCls('desc') + ' resize-none'} />
            {errors.desc && <p className="text-xs text-red-500 mt-0.5">{errors.desc}</p>}
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 flex gap-1" style={{ fontWeight: 500 }}>材质/工艺说明 <span className="text-red-500">*</span></label>
            <textarea value={form.craft} onChange={e => { setForm(p => ({ ...p, craft: e.target.value })); setErrors(p => ({ ...p, craft: '' })); }}
              rows={2} placeholder="如：云锦织造工艺，经纬密度 x，使用蚕丝原料..."
              className={inputCls('craft') + ' resize-none'} />
            {errors.craft && <p className="text-xs text-red-500 mt-0.5">{errors.craft}</p>}
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>附件清单</label>
            <button onClick={() => toast.info('附件上传功能开发中...')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-[#6B6558] transition-all border-2 border-dashed hover:border-[#C4912A] hover:text-[#C4912A]"
              style={{ borderColor: 'rgba(26,61,74,0.15)' }}>
              <Upload className="w-4 h-4" /> 上传相关材料
            </button>
          </div>
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>备注</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              rows={2} placeholder="其他补充说明..."
              className={inputCls('') + ' resize-none'} />
          </div>
        </div>

        <div className="flex gap-3 p-4" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558] hover:text-[#1A3D4A] transition-all"
            style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 text-white transition-all"
            style={{ background: submitting ? 'rgba(196,145,42,0.3)' : 'linear-gradient(135deg, #C4912A, #D4A947)' }}>
            {submitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />提交中...</> : <><Award className="w-4 h-4" />提交认证申请</>}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CopyrightPage() {
  const { clearRedDot } = useApp();
  const [applyFor, setApplyFor] = useState<string | null>(null);

  useEffect(() => { clearRedDot('copyright'); }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto" style={{ background: '#F5F0E8', minHeight: '100%' }}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Award className="w-5 h-5 text-[#C4912A]" />
          <h1 className="text-[#1A3D4A]">版权认证</h1>
        </div>
        <p className="text-sm text-[#6B6558]">将已加密确权的纹样提交版权认证 · 认证通过后可进入授权资产体系</p>
      </div>

      {/* Status flow */}
      <div className="flex items-center gap-2 mb-6 p-4 rounded-2xl" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
        {STATUS_STEPS.map((step, i) => (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${i <= 3 ? 'text-[#1A3D4A]' : 'text-[#9B9590]'}`}
              style={{ background: i <= 3 ? 'rgba(26,61,74,0.07)' : 'transparent' }}>
              <div className={`w-1.5 h-1.5 rounded-full ${['bg-stone-400','bg-amber-500','bg-blue-500','bg-purple-500','bg-teal-500'][i]}`} />
              {step}
            </div>
            {i < STATUS_STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-[#C4A88A] mx-1" />}
          </div>
        ))}
      </div>

      {/* Certificate list */}
      <div className="space-y-3">
        {MOCK_CERTS.map((cert, i) => {
          const st = statusConfig[cert.status];
          return (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="rounded-2xl p-5"
              style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cert.status === '已认证' ? 'rgba(196,145,42,0.1)' : 'rgba(26,61,74,0.06)' }}>
                    <Award className={`w-5 h-5 ${cert.status === '已认证' ? 'text-[#C4912A]' : 'text-[#1A3D4A]'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-[#1A3D4A] text-sm truncate" style={{ fontWeight: 500 }}>{cert.title}</h3>
                      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${st.bg} ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />{cert.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-[#9B9590]">
                      <span>加密证书：{cert.certNo}</span>
                      <span>申请日期：{cert.date}</span>
                      {cert.regNo !== '-' && <span className="text-[#C4912A]">登记号：{cert.regNo}</span>}
                    </div>
                    {/* Progress bar */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {STATUS_STEPS.map((s, si) => (
                        <div key={si} className="flex-1 h-1 rounded-full transition-all"
                          style={{ background: si < cert.progress ? '#C4912A' : si === cert.progress ? 'rgba(196,145,42,0.4)' : 'rgba(26,61,74,0.08)' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {cert.status === '待认证' && (
                    <button
                      onClick={() => setApplyFor(cert.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white transition-all"
                      style={{ background: 'linear-gradient(135deg, #C4912A, #D4A947)' }}
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> 提交认证
                    </button>
                  )}
                  {cert.status === '已认证' && (
                    <button
                      onClick={() => toast.info('认证证书下载中...')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#6B6558] hover:text-[#1A3D4A] transition-all"
                      style={{ border: '1px solid rgba(26,61,74,0.12)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> 查看证书
                    </button>
                  )}
                  {cert.status === '认证中' && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-purple-600"
                      style={{ background: 'rgba(147,51,234,0.06)' }}>
                      <Clock className="w-3.5 h-3.5" /> 审核中
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer info */}
      <div className="mt-6 p-4 rounded-2xl text-xs text-center" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
        <p className="text-[#6B6558]">版权认证服务由南京鋆寰科技有限公司提供 · Nanjing AureusOrbis Technology Co., Ltd.</p>
        <p className="text-[#9B9590] mt-0.5">认证通过后的纹样将自动进入授权资产库，支持授权入库与提案复用</p>
      </div>

      {/* Application modal */}
      <AnimatePresence>
        {applyFor && (
          <CertApplicationForm certId={applyFor} onClose={() => setApplyFor(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
