import { useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { statsData } from '../data/mockData';
import { BarChart3, TrendingUp, Sparkles, Shield, Award, Coins, Users, ArrowUpRight } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, PieChart, Pie
} from 'recharts';

const areaData = [
  { month: '10月', value: 45, proposals: 8 }, { month: '11月', value: 62, proposals: 11 },
  { month: '12月', value: 58, proposals: 9 }, { month: '1月', value: 78, proposals: 14 },
  { month: '2月', value: 72, proposals: 12 }, { month: '3月', value: 95, proposals: 18 },
  { month: '4月', value: 88, proposals: 16 },
];

const creationData = [
  { day: '周一', sessions: 4 }, { day: '周二', sessions: 7 }, { day: '周三', sessions: 5 },
  { day: '周四', sessions: 9 }, { day: '周五', sessions: 12 }, { day: '周六', sessions: 3 }, { day: '周日', sessions: 2 },
];

const pieData = [
  { name: '博物馆文创', value: 38, color: '#1A3D4A' },
  { name: '景区礼品', value: 28, color: '#C4912A' },
  { name: '品牌联名', value: 18, color: '#8B2020' },
  { name: '空间软装', value: 16, color: '#6B4F8A' },
];

const STATS = [
  { icon: <TrendingUp className="w-5 h-5" />, label: '签约总额', value: `¥${(statsData.totalSignedValue / 10000).toFixed(0)}万`, sub: `月增 ${statsData.monthlyGrowth}%`, color: '#C4912A', bg: 'rgba(196,145,42,0.08)' },
  { icon: <Sparkles className="w-5 h-5" />, label: '智绘创作次数', value: '142', sub: '本月增长 28%', color: '#1A3D4A', bg: 'rgba(26,61,74,0.07)' },
  { icon: <Shield className="w-5 h-5" />, label: '已确权纹样', value: '34', sub: '本月新增 6', color: '#4A7C8E', bg: 'rgba(74,124,142,0.08)' },
  { icon: <Award className="w-5 h-5" />, label: '已认证纹样', value: '28', sub: '认证通过率 82%', color: '#8B2020', bg: 'rgba(139,32,32,0.07)' },
  { icon: <Coins className="w-5 h-5" />, label: '授权收入', value: '¥11.4万', sub: '本年度', color: '#6B4F8A', bg: 'rgba(107,79,138,0.07)' },
  { icon: <Users className="w-5 h-5" />, label: '活跃客户', value: statsData.activeProjects.toString(), sub: `共 ${statsData.totalProjects} 个项目`, color: '#2A7A6A', bg: 'rgba(42,122,106,0.07)' },
];

export function DashboardPage() {
  const { clearRedDot } = useApp();

  useEffect(() => { clearRedDot('dashboard'); }, []);

  const tooltipStyle = {
    contentStyle: {
      background: 'white',
      border: '1px solid rgba(26,61,74,0.1)',
      borderRadius: 12,
      fontSize: 12,
      boxShadow: '0 4px 12px rgba(26,61,74,0.1)',
    },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto" style={{ background: '#F5F0E8', minHeight: '100%' }}>
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-[#C4912A]" />
          <h1 className="text-[#1A3D4A]">数据看板</h1>
        </div>
        <p className="text-sm text-[#6B6558]">创作效率、提案转化、资产复用与授权收益全览</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-6 gap-3 mb-5">
        {STATS.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl p-4" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="text-xl text-[#1A3D4A]" style={{ fontWeight: 700 }}>{s.value}</div>
            <div className="text-xs text-[#6B6558] mt-0.5">{s.label}</div>
            <div className="text-[10px] text-[#9B9590] mt-0.5 flex items-center gap-0.5"><ArrowUpRight className="w-2.5 h-2.5 text-emerald-500" />{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-2 rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>签约额趋势 · 近7个月</p>
              <p className="text-xs text-[#9B9590]">单位：万元</p>
            </div>
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="w-3 h-3" /> +{statsData.monthlyGrowth}%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={areaData}>
              <defs>
                <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A3D4A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1A3D4A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gr2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C4912A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#C4912A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9B9590' }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltipStyle} formatter={(v: any, n: string) => [n === 'value' ? `${v}万` : `${v}个`, n === 'value' ? '签约额' : '提案数']} />
              <Area type="monotone" dataKey="value" stroke="#1A3D4A" strokeWidth={2} fill="url(#gr1)" />
              <Area type="monotone" dataKey="proposals" stroke="#C4912A" strokeWidth={1.5} fill="url(#gr2)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pie chart */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
          <p className="text-sm text-[#1A3D4A] mb-4" style={{ fontWeight: 600 }}>场景分布</p>
          <ResponsiveContainer width="100%" height={100}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={48} paddingAngle={2} dataKey="value">
                {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v}%`, '占比']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[#6B6558]">{d.name}</span>
                </div>
                <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Creation bar chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="rounded-2xl p-5" style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
        <p className="text-sm text-[#1A3D4A] mb-4" style={{ fontWeight: 600 }}>智绘创作活跃度 · 本周</p>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={creationData} barSize={18}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9B9590' }} axisLine={false} tickLine={false} />
            <Tooltip {...tooltipStyle} formatter={(v: any) => [`${v} 次`, '创作次数']} />
            <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
              {creationData.map((_, i) => <Cell key={i} fill={i === 4 ? '#C4912A' : '#1A3D4A'} fillOpacity={i === 4 ? 1 : 0.5} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-[#9B9590]">
        © 南京鋆寰科技有限公司 · Nanjing AureusOrbis Technology Co., Ltd. · 锦绣智织 v2.0
      </div>
    </div>
  );
}
