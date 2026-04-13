import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../context/AppContext';
import {
  Users, Shield, Settings, FileText, BarChart2, Plus, Edit2, Trash2,
  CheckCircle2, AlertTriangle, RefreshCw, Search, ChevronDown, X,
  Lock, Eye, Database, Zap, Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TABS = [
  { key: 'dashboard', label: '仪表盘', labelEn: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
  { key: 'permissions', label: '权限管理', labelEn: 'Permissions', icon: <Users className="w-4 h-4" /> },
  { key: 'rules', label: '规则引擎', labelEn: 'Rule Engine', icon: <Settings className="w-4 h-4" /> },
  { key: 'audit', label: '审计日志', labelEn: 'Audit Log', icon: <FileText className="w-4 h-4" /> },
];

const pvData = [
  { name: '智绘', pv: 512, uv: 134 },
  { name: '设计副驾', pv: 342, uv: 89 },
  { name: '提案中心', pv: 223, uv: 64 },
  { name: '灵感纹库', pv: 287, uv: 76 },
  { name: '确权中心', pv: 156, uv: 43 },
  { name: '版权认证', pv: 98, uv: 31 },
  { name: '授权资产', pv: 89, uv: 28 },
];

const operationData = [
  { name: '新增', value: 234, color: '#10B981' },
  { name: '修改', value: 198, color: '#3B82F6' },
  { name: '删除', value: 45, color: '#EF4444' },
  { name: '触发', value: 876, color: '#F59E0B' },
];

const ALL_PERMISSIONS = [
  '素材查看', '素材检索', '素材新增', '素材审核',
  '设计副驾', '方向生成', '方向导出',
  '提案创建', '提案展示', '提案编辑', '提案审核',
  '留资', '下单', '订单管理',
  '确权台账', '授权流水', '证据包', '归档操作',
  '规则查看', '规则修改', '权限管理', '日志查看', '全部权限',
];

interface RoleDef {
  id: string;
  name: string;
  nameEn: string;
  users: number;
  permissions: string[];
  color: string;
}

const INITIAL_ROLES: RoleDef[] = [
  { id: 'r1', name: '设计师', nameEn: 'Designer', users: 12, permissions: ['素材查看', '素材检索', '设计副驾', '方向生成', '提案查看'], color: 'bg-blue-500' },
  { id: 'r2', name: '销售/客户经理', nameEn: 'Sales', users: 8, permissions: ['提案创建', '提案展示', '留资', '下单', '素材查看'], color: 'bg-green-500' },
  { id: 'r3', name: '运营/法务', nameEn: 'Operations', users: 5, permissions: ['确权台账', '授权流水', '证据包', '素材审核', '规则查看'], color: 'bg-purple-500' },
  { id: 'r4', name: '管理员', nameEn: 'Admin', users: 2, permissions: ['全部权限'], color: 'bg-amber-500' },
];

interface RuleDef {
  id: string;
  type: 'auth' | 'craft' | 'template' | 'review';
  name: string;
  status: 'active' | 'draft';
  lastModified: string;
  version: string;
  desc: string;
}

const INITIAL_RULES: RuleDef[] = [
  { id: 'rule1', type: 'auth', name: '商用授权默认规则', status: 'active', lastModified: '2026-03-28', version: 'v2.1', desc: '商用授权允许范围：全品类，需登记编号，地域默认全国' },
  { id: 'rule2', type: 'craft', name: '云锦工艺约束规则', status: 'active', lastModified: '2026-03-20', version: 'v1.8', desc: '色数上限16色，纬线浮长≤8mm，适用品类需工艺师确认' },
  { id: 'rule3', type: 'template', name: '提案页默认模板', status: 'active', lastModified: '2026-04-01', version: 'v3.0', desc: '提案页展示顺序：方向图→产品图→场景图→预算→授权说明' },
  { id: 'rule4', type: 'review', name: '高风险素材审核流程', status: 'draft', lastModified: '2026-04-02', version: 'v0.9', desc: '高风险素材（如故宫专属）需法务双重审核，方可加入方案' },
];

const MOCK_AUDIT_LOGS = [
  { id: 'log1', time: '2026-04-03 10:32:15', operator: '张设计师', module: '设计副驾', action: '触发', content: '生成3个设计方向，项目：敦煌研究院景区礼品', level: 'info' },
  { id: 'log2', time: '2026-04-03 10:15:08', operator: '李运营', module: '确权台账', action: '修改', content: '更新授权流水状态：故宫文创龙纹丝巾 → 已签约', level: 'info' },
  { id: 'log3', time: '2026-04-03 09:55:22', operator: '管理员', module: '规则引擎', action: '修改', content: '更新云锦工艺约束规则 v1.7 → v1.8，变更：色数上限调整', level: 'warn' },
  { id: 'log4', time: '2026-04-03 09:30:44', operator: '王销售', module: '提案中心', action: '新增', content: '创建新提案：苏博丝巾系列设计，客户：苏州博物馆', level: 'info' },
  { id: 'log5', time: '2026-04-03 08:45:11', operator: '系统', module: '素材台账', action: '触发', content: '授权预期告警：素材「飞天纹·敦煌系列」将于7天内到期', level: 'error' },
  { id: 'log6', time: '2026-04-02 17:22:33', operator: '李运营', module: '确权台账', action: '新增', content: '生成证据包：西溪湿地生态软装，编号 EP-2026-0062', level: 'info' },
  { id: 'log7', time: '2026-04-02 16:10:05', operator: '管理员', module: '权限管理', action: '修改', content: '角色「设计师」新增权限：导出效果图', level: 'warn' },
  { id: 'log8', time: '2026-04-02 14:30:18', operator: '赵设计师', module: '素材台账', action: '删除', content: '删除草稿素材记录（未提交），元素名：测试纹样', level: 'info' },
];

const RULE_TYPE_CONFIG = {
  auth: { label: '授权规则', color: 'text-green-600 bg-green-50' },
  craft: { label: '工艺规则', color: 'text-amber-600 bg-amber-50' },
  template: { label: '模板配置', color: 'text-blue-600 bg-blue-50' },
  review: { label: '审核规则', color: 'text-purple-600 bg-purple-50' },
};

const ACTION_CONFIG: Record<string, { color: string }> = {
  '新增': { color: 'text-green-600 bg-green-50' },
  '修改': { color: 'text-blue-600 bg-blue-50' },
  '删除': { color: 'text-red-600 bg-red-50' },
  '触发': { color: 'text-amber-600 bg-amber-50' },
};

const LEVEL_CONFIG = {
  info: { color: 'bg-gray-200', dot: 'bg-gray-400' },
  warn: { color: 'bg-amber-100', dot: 'bg-amber-400' },
  error: { color: 'bg-red-50', dot: 'bg-red-500' },
};

// ─── New Role Dialog ──────────────────────────────────────────────────────────

function NewRoleDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (role: RoleDef) => void }) {
  const { t } = useApp();
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [color, setColor] = useState('bg-teal-500');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500', 'bg-indigo-500'];
  const togglePerm = (perm: string) => setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = t('请填写角色名称', 'Role name required');
    if (selectedPerms.length === 0) errs.perms = t('请选择至少一个权限', 'Select at least one permission');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    const newRole: RoleDef = { id: `r${Date.now()}`, name, nameEn: nameEn || name, users: 0, permissions: selectedPerms, color };
    onConfirm(newRole);
    toast.success(t(`角色「${name}」已创建`, `Role "${name}" created`), { description: t('操作已记录审计日志', 'Audit log recorded') });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900">{t('新建角色', 'New Role')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('角色名称（中文）', 'Role Name (CN)')}<span className="text-red-500">*</span></label>
              <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
                placeholder={t('如：法务审核员', 'e.g. Legal Reviewer')}
                className={`w-full text-sm border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200'}`} />
              {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">{t('英文名称（选填）', 'English Name')}</label>
              <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)}
                placeholder="e.g. Legal Reviewer"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1.5 block">{t('角色颜色标识', 'Role Color')}</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} transition-all ${color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'opacity-60 hover:opacity-100'}`} />
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1.5 flex gap-1">{t('分配权限', 'Assign Permissions')}<span className="text-red-500">*</span></label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_PERMISSIONS.map(perm => (
                <button key={perm} onClick={() => { togglePerm(perm); setErrors(p => ({ ...p, perms: '' })); }}
                  className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${selectedPerms.includes(perm) ? 'bg-[#8B1C1C] text-white border-[#8B1C1C]' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                  {perm}
                </button>
              ))}
            </div>
            {errors.perms && <p className="text-xs text-red-500 mt-1">{errors.perms}</p>}
            {selectedPerms.length > 0 && (
              <p className="text-xs text-gray-400 mt-1">{t(`已选 ${selectedPerms.length} 项权限`, `${selectedPerms.length} permissions selected`)}</p>
            )}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${submitting ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('创建中...', 'Creating...')}</> : t('创建角色', 'Create Role')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Permissions Dialog ──────────────────────────────────────────────────

function EditPermissionsDialog({ role, onClose, onSave }: { role: RoleDef; onClose: () => void; onSave: (perms: string[]) => void }) {
  const { t } = useApp();
  const [selectedPerms, setSelectedPerms] = useState<string[]>(role.permissions);
  const [saving, setSaving] = useState(false);
  const togglePerm = (perm: string) => setSelectedPerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaving(false);
    onSave(selectedPerms);
    toast.success(t(`角色「${role.name}」权限已更新`, `Role "${role.nameEn}" permissions updated`), {
      description: t('变更已记录审计日志', 'Changes logged in audit'),
    });
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 ${role.color} rounded-xl flex items-center justify-center`}>
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-gray-900">{t('编辑权限', 'Edit Permissions')}</h3>
              <p className="text-xs text-gray-400">{role.name} · {role.users}{t('名用户', ' users')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="max-h-[45vh] overflow-y-auto">
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ALL_PERMISSIONS.map(perm => (
              <button key={perm} onClick={() => togglePerm(perm)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${selectedPerms.includes(perm) ? 'bg-[#8B1C1C] text-white border-[#8B1C1C]' : 'border-gray-200 text-gray-500 hover:border-amber-300'}`}>
                {perm}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400">{t(`已选 ${selectedPerms.length} 项权限`, `${selectedPerms.length} permissions selected`)}</p>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          <button onClick={handleSave} disabled={saving}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${saving ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('保存中...', 'Saving...')}</> : t('保存权限', 'Save Permissions')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New Rule Dialog ──────────────────────────────────────────────────────────

function NewRuleDialog({ onClose, onConfirm }: { onClose: () => void; onConfirm: (rule: RuleDef) => void }) {
  const { t } = useApp();
  const [formData, setFormData] = useState({ name: '', type: 'auth' as RuleDef['type'], desc: '', status: 'active' as 'active' | 'draft' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = t('请填写规则名称', 'Rule name required');
    if (!formData.desc.trim()) errs.desc = t('请填写规则描述', 'Description required');
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    setSubmitting(false);
    const newRule: RuleDef = {
      id: `rule${Date.now()}`, ...formData,
      lastModified: '2026-04-03', version: 'v1.0',
    };
    onConfirm(newRule);
    toast.success(t(`规则「${formData.name}」已创建`, `Rule "${formData.name}" created`), {
      description: t('规则已写入规则引擎，操作已记录审计日志', 'Rule added to engine, audit logged'),
    });
  };

  const inputCls = (field: string) =>
    `w-full text-sm border rounded-xl px-3 py-2 bg-gray-50 focus:outline-none focus:border-amber-400 ${errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'}`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-gray-900">{t('新建规则', 'New Rule')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('规则名称', 'Rule Name')}<span className="text-red-500">*</span></label>
            <input type="text" value={formData.name}
              onChange={e => { setFormData(p => ({ ...p, name: e.target.value })); setErrors(p => ({ ...p, name: '' })); }}
              placeholder={t('如：新素材授权校验规则', 'e.g. New Material Auth Rule')} className={inputCls('name')} autoFocus />
            {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 mb-1 block">{t('规则类型', 'Rule Type')}</label>
              <select value={formData.type} onChange={e => setFormData(p => ({ ...p, type: e.target.value as RuleDef['type'] }))} className={inputCls('')}>
                {Object.entries(RULE_TYPE_CONFIG).map(([key, conf]) => (
                  <option key={key} value={key}>{conf.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">{t('初始状态', 'Initial Status')}</label>
              <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as 'active' | 'draft' }))} className={inputCls('')}>
                <option value="active">{t('立即生效', 'Active')}</option>
                <option value="draft">{t('草稿（暂不生效）', 'Draft')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 flex gap-1">{t('规则描述', 'Rule Description')}<span className="text-red-500">*</span></label>
            <textarea value={formData.desc}
              onChange={e => { setFormData(p => ({ ...p, desc: e.target.value })); setErrors(p => ({ ...p, desc: '' })); }}
              placeholder={t('描述规则的触发条件、约束内容、适用场景等...', 'Describe trigger conditions, constraints, applicable scenarios...')}
              rows={4} className={`${inputCls('desc')} resize-none`} />
            {errors.desc && <p className="text-xs text-red-500 mt-0.5">{errors.desc}</p>}
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">{t('取消', 'Cancel')}</button>
          <button onClick={handleSubmit} disabled={submitting}
            className={`flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 ${submitting ? 'bg-gray-100 text-gray-400' : 'bg-[#8B1C1C] text-white hover:bg-[#7A1818]'}`}>
            {submitting ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('创建中...', 'Creating...')}</> : t('创建规则', 'Create Rule')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function AdminPage() {
  const { t, userRole, clearRedDot } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [logSearch, setLogSearch] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [rules, setRules] = useState(INITIAL_RULES);
  const [roles, setRoles] = useState(INITIAL_ROLES);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [editingRuleDesc, setEditingRuleDesc] = useState('');
  const [savingRule, setSavingRule] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showNewRoleDialog, setShowNewRoleDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDef | null>(null);
  const [showNewRuleDialog, setShowNewRuleDialog] = useState(false);

  useEffect(() => { clearRedDot('admin'); }, []);

  if (userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
          <Lock className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-gray-700 mb-2">{t('无访问权限', 'Access Denied')}</h3>
        <p className="text-sm text-gray-400">{t('管理后台仅限管理员访问。请在左侧边栏切换角色为「管理员」体验此页面。', 'Admin backend is restricted. Switch role to Admin in the sidebar to view.')}</p>
        <div className="mt-4 bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 max-w-xs">
          {t('爬楼梯原则：无权限菜单应隐藏，通过直链访问时提示无权限', 'Navigation Principle: Hidden menus, show reason when accessed directly')}
        </div>
      </div>
    );
  }

  const filteredLogs = MOCK_AUDIT_LOGS.filter(log => {
    const q = logSearch.toLowerCase();
    const matchSearch = !q || log.content.toLowerCase().includes(q) || log.operator.toLowerCase().includes(q) || log.module.toLowerCase().includes(q);
    const matchFilter = !logFilter || log.action === logFilter;
    return matchSearch && matchFilter;
  });

  const handleSaveRule = async (ruleId: string) => {
    setSavingRule(true);
    await new Promise(r => setTimeout(r, 1200));
    setSavingRule(false);
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r, desc: editingRuleDesc,
      lastModified: '2026-04-03',
      version: `v${(parseFloat(r.version.slice(1)) + 0.1).toFixed(1)}`,
    } : r));
    setEditingRule(null);
    toast.success(t('规则已保存并记录审计日志', 'Rule saved and audit log recorded'), {
      description: t('上线10要件：修改操作已写入审计日志', '10 Launch Items: Edit operation logged'),
    });
  };

  const handleDeleteRule = (ruleId: string) => { setDeleteConfirm(ruleId); };

  const confirmDelete = () => {
    setRules(prev => prev.filter(r => r.id !== deleteConfirm));
    toast.success(t('规则已删除，审计日志已记录', 'Rule deleted, audit log recorded'));
    setDeleteConfirm(null);
  };

  const handleToggleRuleStatus = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? {
      ...r, status: r.status === 'active' ? 'draft' : 'active', lastModified: '2026-04-03',
    } : r));
    const rule = rules.find(r => r.id === ruleId);
    if (rule) {
      const newStatus = rule.status === 'active' ? '草稿' : '生效中';
      toast.success(t(`规则已${newStatus === '生效中' ? '启用' : '停用'}`, `Rule ${newStatus === '生效中' ? 'activated' : 'deactivated'}`));
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 px-6 flex items-center gap-0">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-3.5 text-sm border-b-2 transition-all ${activeTab === tab.key ? 'border-[#8B1C1C] text-[#8B1C1C]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {tab.icon}
            {t(tab.label, tab.labelEn)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* Dashboard */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: t('日PV', 'Daily PV'), value: '1,284', sub: t('今日页面访问', 'Page views today'), color: 'text-blue-600', bg: 'bg-blue-50', icon: <Eye className="w-4 h-4 text-blue-600" /> },
                  { label: t('日UV', 'Daily UV'), value: '47', sub: t('今日活跃用户', 'Active users today'), color: 'text-green-600', bg: 'bg-green-50', icon: <Users className="w-4 h-4 text-green-600" /> },
                  { label: t('操作总数', 'Total Ops'), value: '1,353', sub: t('增删改触发', 'CRUD+Trigger'), color: 'text-amber-600', bg: 'bg-amber-50', icon: <Zap className="w-4 h-4 text-amber-600" /> },
                  { label: t('日志覆盖率', 'Log Coverage'), value: '100%', sub: t('全操作日志已记录', 'All ops logged'), color: 'text-purple-600', bg: 'bg-purple-50', icon: <Database className="w-4 h-4 text-purple-600" /> },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="bg-white rounded-xl border border-gray-100 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 ${stat.bg} rounded-lg flex items-center justify-center`}>{stat.icon}</div>
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <div className={`text-2xl ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
                  </motion.div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm text-gray-700 mb-4">{t('模块访问 PV/UV', 'Module PV/UV')}</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={pvData} barCategoryGap="30%">
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="pv" fill="#8B1C1C" radius={[4, 4, 0, 0]} name="PV" />
                      <Bar dataKey="uv" fill="#C9A84C" radius={[4, 4, 0, 0]} name="UV" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="text-sm text-gray-700 mb-4">{t('操作类型分布（日）', 'Daily Operation Types')}</h3>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="50%" height={180}>
                      <PieChart>
                        <Pie data={operationData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value" strokeWidth={0}>
                          {operationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {operationData.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-xs text-gray-600">{item.name}</span>
                          </div>
                          <span className="text-xs text-gray-700">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Permissions */}
          {activeTab === 'permissions' && (
            <motion.div key="permissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-gray-700">{t('组织与角色权限', 'Organization & Role Permissions')}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{t('支持多组织、多角色与资源隔离', 'Multi-org, multi-role, resource isolation')}</p>
                </div>
                <button onClick={() => setShowNewRoleDialog(true)}
                  className="flex items-center gap-1.5 text-sm bg-[#8B1C1C] text-white px-3 py-2 rounded-lg hover:bg-[#7A1818] transition-colors">
                  <Plus className="w-4 h-4" /> {t('新建角色', 'New Role')}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {roles.map((role, i) => (
                  <motion.div key={role.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                    className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 ${role.color} rounded-xl flex items-center justify-center`}>
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm text-gray-800">{role.name}</h4>
                          <p className="text-xs text-gray-400">{role.users} {t('名用户', 'users')}</p>
                        </div>
                      </div>
                      <button onClick={() => setEditingRole(role)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(perm => (
                        <span key={perm} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{perm}</span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rules */}
          {activeTab === 'rules' && (
            <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-gray-700">{t('规则引擎配置', 'Rule Engine Configuration')}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{t('规则配置化，变更即时生效，变更保留审计日志', 'Config-driven rules, instant effect, audit logged')}</p>
                </div>
                <button onClick={() => setShowNewRuleDialog(true)}
                  className="flex items-center gap-1.5 text-sm bg-[#8B1C1C] text-white px-3 py-2 rounded-lg hover:bg-[#7A1818] transition-colors">
                  <Plus className="w-4 h-4" /> {t('新建规则', 'New Rule')}
                </button>
              </div>
              <div className="space-y-3">
                {rules.map((rule, i) => {
                  const typeConf = RULE_TYPE_CONFIG[rule.type];
                  const isEditing = editingRule === rule.id;
                  return (
                    <motion.div key={rule.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-xl border border-gray-100 p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <h4 className="text-sm text-gray-800">{rule.name}</h4>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeConf.color}`}>{typeConf.label}</span>
                            <button onClick={() => handleToggleRuleStatus(rule.id)}
                              className={`text-xs px-1.5 py-0.5 rounded-full transition-colors cursor-pointer ${rule.status === 'active' ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}>
                              {rule.status === 'active' ? t('生效中', 'Active') : t('草稿', 'Draft')}
                            </button>
                          </div>
                          {isEditing ? (
                            <textarea
                              defaultValue={rule.desc}
                              onChange={e => setEditingRuleDesc(e.target.value)}
                              className="w-full text-xs border border-amber-300 rounded-lg p-2 focus:outline-none focus:border-amber-500 bg-amber-50 resize-none"
                              rows={2}
                            />
                          ) : (
                            <p className="text-xs text-gray-500">{rule.desc}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="w-3 h-3 text-gray-300" />
                            <span className="text-xs text-gray-400">{t('最后修改：', 'Last modified: ')}{rule.lastModified}</span>
                            <span className="text-xs text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{rule.version}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isEditing ? (
                            <>
                              <button onClick={() => setEditingRule(null)}
                                className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                                {t('取消', 'Cancel')}
                              </button>
                              <button onClick={() => handleSaveRule(rule.id)} disabled={savingRule}
                                className="text-xs px-2.5 py-1.5 bg-[#8B1C1C] text-white rounded-lg hover:bg-[#7A1818] transition-colors flex items-center gap-1">
                                {savingRule ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                {t('保存', 'Save')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button onClick={() => { setEditingRule(rule.id); setEditingRuleDesc(rule.desc); }}
                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDeleteRule(rule.id)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Audit Log */}
          {activeTab === 'audit' && (
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input type="text" value={logSearch} onChange={e => setLogSearch(e.target.value)}
                    placeholder={t('搜索操作日志...', 'Search audit logs...')}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-amber-400 bg-gray-50" />
                </div>
                {['', '新增', '修改', '删除', '触发'].map(action => (
                  <button key={action} onClick={() => setLogFilter(action)}
                    className={`text-xs px-3 py-1.5 rounded-full transition-all ${logFilter === action ? 'bg-[#8B1C1C] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {!action ? t('全部', 'All') : action}
                  </button>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-5 text-xs text-gray-400 px-4 py-2.5 border-b border-gray-50 bg-gray-50">
                  <span>{t('时间', 'Time')}</span>
                  <span>{t('操作人', 'Operator')}</span>
                  <span>{t('模块', 'Module')}</span>
                  <span>{t('操作类型', 'Action')}</span>
                  <span>{t('操作内容', 'Content')}</span>
                </div>
                {filteredLogs.map((log, i) => {
                  const actionConf = ACTION_CONFIG[log.action];
                  const levelConf = LEVEL_CONFIG[log.level as keyof typeof LEVEL_CONFIG];
                  return (
                    <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      className={`grid grid-cols-5 text-xs px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors ${log.level === 'error' ? 'bg-red-50/30' : ''}`}>
                      <span className="text-gray-400 font-mono text-[11px]">{log.time}</span>
                      <span className="text-gray-600">{log.operator}</span>
                      <span className="text-gray-600">{log.module}</span>
                      <span>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${actionConf?.color}`}>{log.action}</span>
                      </span>
                      <span className="text-gray-600 truncate">{log.content}</span>
                    </motion.div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm text-gray-400">{t('未找到匹配日志', 'No matching logs')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-gray-900">{t('确认删除规则？', 'Confirm Delete Rule?')}</h3>
                  <p className="text-xs text-gray-500">{t('爬楼梯原则：高风险操作需二次确认', 'Navigation Principle: High-risk ops need confirmation')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-5">{t('删除后规则将立即失效，此操作将被记录到审计日志。确定删除吗？', 'The rule will be immediately disabled and this action will be logged. Are you sure?')}</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                  {t('取消', 'Cancel')}
                </button>
                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600">
                  {t('确认删除', 'Confirm Delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Role Dialog */}
      <AnimatePresence>
        {showNewRoleDialog && (
          <NewRoleDialog
            onClose={() => setShowNewRoleDialog(false)}
            onConfirm={role => { setRoles(prev => [...prev, role]); setShowNewRoleDialog(false); }}
          />
        )}
      </AnimatePresence>

      {/* Edit Permissions Dialog */}
      <AnimatePresence>
        {editingRole && (
          <EditPermissionsDialog
            role={editingRole}
            onClose={() => setEditingRole(null)}
            onSave={perms => { setRoles(prev => prev.map(r => r.id === editingRole.id ? { ...r, permissions: perms } : r)); }}
          />
        )}
      </AnimatePresence>

      {/* New Rule Dialog */}
      <AnimatePresence>
        {showNewRuleDialog && (
          <NewRuleDialog
            onClose={() => setShowNewRuleDialog(false)}
            onConfirm={rule => { setRules(prev => [...prev, rule]); setShowNewRuleDialog(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}