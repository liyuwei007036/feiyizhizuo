import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import { mockRightsRecords, RightsRecord } from '../data/mockData';
import {
  ShieldCheck, Lock, CheckCircle2, Clock, AlertTriangle, ChevronRight,
  FileText, Download, Plus, Search, Archive, Award, ArrowRight,
  User, Layers, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

const STATUS_CONFIG = {
  pending: { label: '待确权', color: 'text-amber-700', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  submitted: { label: '确权中', color: 'text-blue-700', bg: 'bg-blue-50', dot: 'bg-blue-500' },
  confirmed: { label: '已确权', color: 'text-teal-700', bg: 'bg-teal-50', dot: 'bg-teal-500' },
  failed: { label: '确权失败', color: 'text-red-700', bg: 'bg-red-50', dot: 'bg-red-500' },
};

const EVENT_CONFIG = {
  input: { label: '需求录入', color: 'text-blue-600', dot: 'bg-blue-400' },
  generate: { label: '智绘生成', color: 'text-purple-600', dot: 'bg-purple-400' },
  edit: { label: '参数调整', color: 'text-amber-600', dot: 'bg-amber-400' },
  review: { label: '法务审核', color: 'text-teal-600', dot: 'bg-teal-400' },
  proposal: { label: '提案展示', color: 'text-[#1A3D4A]', dot: 'bg-[#1A3D4A]' },
  signed: { label: '成交归档', color: 'text-emerald-600', dot: 'bg-emerald-500' },
  archive: { label: '项目归档', color: 'text-gray-500', dot: 'bg-gray-400' },
};

const MOCK_PENDING = [
  { id: 'n1', title: '南京城市礼赠·云锦纹样', category: '云锦', source: '智绘生成', time: '10分钟前' },
  { id: 'n2', title: '水墨莲池·现代改造版', category: '苏绣', source: '设计师导入', time: '2小时前' },
];

export function RightsConfirmPage() {
  const { t, clearRedDot } = useApp();
  const navigate = useNavigate();
  const [activeRecord, setActiveRecord] = useState<RightsRecord | null>(mockRightsRecords[0]);
  const [encryptingId, setEncryptingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => { clearRedDot('rights'); }, []);

  const handleEncrypt = async (id: string) => {
    setEncryptingId(id);
    await new Promise(r => setTimeout(r, 2000));
    setEncryptingId(null);
    toast.success(t('加密确权完成！机密加密证书已生成', 'Encryption complete! Certificate generated'), {
      description: '证书编号 EC-2026-0' + Math.floor(Math.random() * 900 + 100),
      action: { label: '去版权认证', onClick: () => navigate('/copyright') },
    });
  };

  const allRecords = mockRightsRecords;
  const filtered = allRecords.filter(r => !search || r.projectName.includes(search));

  return (
    <div className="flex h-full" style={{ background: '#F5F0E8' }}>
      {/* Left: Record list */}
      <div className="w-72 flex-shrink-0 flex flex-col" style={{ background: 'white', borderRight: '1px solid rgba(26,61,74,0.08)' }}>
        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-[#C4912A]" />
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>确权中心</span>
          </div>
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg" style={{ background: 'rgba(26,61,74,0.05)' }}>
            <Search className="w-3 h-3 text-[#9B9590]" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索项目..." className="text-xs bg-transparent outline-none text-[#1A3D4A] placeholder:text-[#9B9590] w-full" />
          </div>
        </div>

        {/* Pending confirmation */}
        {MOCK_PENDING.length > 0 && (
          <div className="p-3 flex-shrink-0" style={{ background: 'rgba(196,145,42,0.04)', borderBottom: '1px solid rgba(196,145,42,0.1)' }}>
            <p className="text-xs text-[#C4912A] mb-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> 待确权 ({MOCK_PENDING.length})
            </p>
            {MOCK_PENDING.map(item => (
              <div key={item.id} className="flex items-center justify-between mb-1.5 last:mb-0">
                <div className="flex-1 min-w-0 mr-2">
                  <p className="text-xs text-[#1A3D4A] truncate">{item.title}</p>
                  <p className="text-[10px] text-[#9B9590]">{item.source} · {item.time}</p>
                </div>
                <button
                  onClick={() => handleEncrypt(item.id)}
                  disabled={encryptingId === item.id}
                  className="px-2 py-1 rounded-lg text-[10px] text-white flex items-center gap-1 flex-shrink-0 transition-all"
                  style={{ background: encryptingId === item.id ? 'rgba(196,145,42,0.3)' : '#C4912A' }}
                >
                  {encryptingId === item.id ? <><div className="w-2.5 h-2.5 border border-white/40 border-t-white rounded-full animate-spin" />确权中</> : <><Lock className="w-2.5 h-2.5" />确权</>}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Record list */}
        <div className="flex-1 overflow-y-auto p-2" style={{ scrollbarWidth: 'none' }}>
          <p className="text-[10px] px-2 py-1.5 uppercase tracking-widest" style={{ color: 'rgba(26,61,74,0.35)' }}>已确权记录</p>
          {filtered.map(r => {
            const st = STATUS_CONFIG[r.evidenceStatus];
            const isActive = activeRecord?.id === r.id;
            return (
              <button key={r.id} onClick={() => setActiveRecord(r)}
                className={`w-full text-left px-2.5 py-2.5 rounded-xl mb-0.5 transition-all ${isActive ? 'bg-[#F0E6D3]' : 'hover:bg-[rgba(26,61,74,0.04)]'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-[#1A3D4A] truncate flex-1 mr-1" style={{ fontWeight: 500 }}>{r.projectName}</span>
                  <span className={`flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${st.bg} ${st.color}`}>
                    <span className={`w-1 h-1 rounded-full ${st.dot}`} />{st.label}
                  </span>
                </div>
                <p className="text-[10px] text-[#9B9590]">{r.evidenceNo} · {r.createdAt}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Record detail */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeRecord ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 flex-shrink-0" style={{ background: 'rgba(245,240,232,0.8)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[#1A3D4A]">{activeRecord.projectName}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[#9B9590]">证据包编号：{activeRecord.evidenceNo}</span>
                    <span className="text-xs text-[#9B9590]">版本：{activeRecord.versionId}</span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${STATUS_CONFIG[activeRecord.evidenceStatus].bg} ${STATUS_CONFIG[activeRecord.evidenceStatus].color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_CONFIG[activeRecord.evidenceStatus].dot}`} />
                      {STATUS_CONFIG[activeRecord.evidenceStatus].label}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toast.success('证据包下载中...')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-[#6B6558] hover:text-[#1A3D4A] transition-all"
                    style={{ border: '1px solid rgba(26,61,74,0.12)' }}>
                    <Download className="w-3.5 h-3.5" /> 下载证据包
                  </button>
                  <button onClick={() => navigate('/copyright')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #C4912A, #D4A947)' }}>
                    <Award className="w-3.5 h-3.5" /> 去版权认证
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-5">
                {/* Timeline */}
                <div className="col-span-2">
                  <h3 className="text-sm text-[#1A3D4A] mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#C4912A]" /> 操作时间线
                  </h3>
                  <div className="space-y-0">
                    {activeRecord.events.map((event, i) => {
                      const ec = EVENT_CONFIG[event.type];
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex gap-3"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${ec.dot}`} />
                            {i < activeRecord.events.length - 1 && <div className="w-px flex-1 my-1 bg-[rgba(26,61,74,0.1)]" />}
                          </div>
                          <div className="pb-4 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className={`text-xs ${ec.color}`} style={{ fontWeight: 500 }}>{ec.label}</span>
                              <span className="text-[10px] text-[#9B9590]">{event.time}</span>
                              <span className="text-[10px] text-[#9B9590]">· {event.operator}</span>
                            </div>
                            <p className="text-xs text-[#6B6558]">{event.content}</p>
                            {event.materialIds && event.materialIds.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {event.materialIds.map(id => (
                                  <span key={id} className="text-[9px] px-1.5 py-0.5 rounded"
                                    style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A' }}>纹样#{id}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Auth records + Reuse */}
                <div className="space-y-4">
                  <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
                    <h4 className="text-xs text-[#1A3D4A] mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Shield className="w-3.5 h-3.5 text-[#C4912A]" /> 授权记录
                    </h4>
                    {activeRecord.authRecords.map(auth => (
                      <div key={auth.id} className="text-xs space-y-1.5 p-3 rounded-xl mb-2"
                        style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.06)' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>{auth.client}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${auth.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                            {auth.status === 'active' ? '有效' : '已过期'}
                          </span>
                        </div>
                        <p className="text-[#6B6558]">{auth.categories.join('、')} · {auth.region}</p>
                        <p className="text-[#9B9590] text-[10px]">{auth.period}</p>
                        <p className="text-[#C4912A]" style={{ fontWeight: 500 }}>{auth.price}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
                    <h4 className="text-xs text-[#1A3D4A] mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
                      <Archive className="w-3.5 h-3.5 text-[#C4912A]" /> 复用资产
                    </h4>
                    {activeRecord.reuseAssets.map(asset => (
                      <div key={asset.id} className="flex items-center gap-2 p-2 rounded-lg mb-1.5"
                        style={{ background: 'rgba(196,145,42,0.04)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(196,145,42,0.1)' }}>
                          <Layers className="w-3.5 h-3.5 text-[#C4912A]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#1A3D4A] truncate">{asset.name}</p>
                          <p className="text-[10px] text-[#9B9590]">使用 {asset.usageCount} 次</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-[#C4A88A] mx-auto mb-3" />
              <p className="text-[#6B6558]">选择左侧记录查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
