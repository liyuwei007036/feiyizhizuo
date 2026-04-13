import React from 'react';
import { motion } from 'motion/react';
import { Lock, ShieldOff, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import type { ModuleKey } from '../context/AppContext';
import { MODULE_META, ROLE_LABELS, ROLE_PERMISSIONS } from '../context/AppContext';

// ── Role badge colors ─────────────────────────────────────────────────────────
const ROLE_ICON_COLORS: Record<string, string> = {
  designer: '#1A3D4A',
  admin:    '#8B2020',
};

// ── AccessDenied page ─────────────────────────────────────────────────────────
export function AccessDenied({ module }: { module: ModuleKey }) {
  const { userRole, t } = useApp();
  const navigate = useNavigate();
  const meta = MODULE_META[module];
  const roleInfo = ROLE_LABELS[userRole];

  // Determine which modules this role CAN access (for redirection suggestions)
  const accessibleModules = (Object.keys(ROLE_PERMISSIONS[userRole]) as ModuleKey[])
    .filter(m => ROLE_PERMISSIONS[userRole][m]?.includes('view'))
    .slice(0, 3);

  const PATH_MAP: Record<ModuleKey, string> = {
    zhihui: '/zhihui', copilot: '/copilot', proposals: '/proposals',
    materials: '/materials', market: '/market', admin: '/admin',
  };

  return (
    <div className="flex items-center justify-center h-full p-8" style={{ background: '#F5F0E8' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
              <ShieldOff className="w-9 h-9 text-white/80" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
              style={{ background: '#8B2020' }}>
              <Lock className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="text-center mb-6">
          <h2 className="text-xl text-[#1A3D4A] mb-2" style={{ fontWeight: 700 }}>
            {t('访问受限', 'Access Restricted')}
          </h2>
          <p className="text-sm text-[#6B6558] leading-relaxed">
            {t(
              `您当前角色「${roleInfo.zh}」无权访问「${meta.zh}」模块`,
              `Your current role "${roleInfo.en}" cannot access "${meta.en}"`
            )}
          </p>
        </div>

        {/* Cards */}
        <div className="space-y-3 mb-6">
          {/* Current role */}
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(139,32,32,0.05)', border: '1px solid rgba(139,32,32,0.15)' }}>
            <p className="text-[11px] text-[#8B2020] mb-2" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
              {t('当前角色', 'CURRENT ROLE')}
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
                style={{ background: ROLE_ICON_COLORS[userRole] ?? '#1A3D4A' }}>
                {roleInfo.zh[0]}
              </div>
              <div>
                <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{t(roleInfo.zh, roleInfo.en)}</p>
                <p className="text-[10px] text-[#9B9590]">{t('该角色对此模块无访问权限', 'No access to this module')}</p>
              </div>
            </div>
          </div>

          {/* Allowed roles */}
          <div className="p-4 rounded-2xl"
            style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
            <p className="text-[11px] text-[#6B6558] mb-2.5" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
              {t('有权访问此模块的角色', 'ROLES WITH ACCESS')}
            </p>
            <div className="flex flex-wrap gap-2">
              {meta.allowedRoles.map(role => (
                <span key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                  style={{ background: 'rgba(196,145,42,0.1)', color: '#C4912A', border: '1px solid rgba(196,145,42,0.2)' }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: ROLE_ICON_COLORS[role] ?? '#1A3D4A' }} />
                  {t(ROLE_LABELS[role].zh, ROLE_LABELS[role].en)}
                </span>
              ))}
            </div>
          </div>

          {/* Accessible modules for current role */}
          {accessibleModules.length > 0 && (
            <div className="p-4 rounded-2xl"
              style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.06)' }}>
              <p className="text-[11px] text-[#6B6558] mb-2.5" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
                {t('您可以访问', 'YOU CAN ACCESS')}
              </p>
              <div className="space-y-1">
                {accessibleModules.map(m => (
                  <button key={m}
                    onClick={() => navigate(PATH_MAP[m])}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl hover:bg-[#F5F0E8] transition-colors text-left">
                    <span className="text-xs text-[#1A3D4A]">{t(MODULE_META[m].zh, MODULE_META[m].en)}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#C4A88A]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security notice */}
        <div className="px-4 py-3 rounded-xl text-center"
          style={{ background: 'rgba(196,145,42,0.06)', border: '1px dashed rgba(196,145,42,0.25)' }}>
          <p className="text-[10px] text-[#9B9590] leading-relaxed">
            {t(
              '本系统遵循最小权限原则，操作均留有审计日志。如需调整权限，请联系管理员。',
              'This system follows the Principle of Least Privilege. All actions are audit-logged. Contact admin to adjust roles.'
            )}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── PermissionGuard wrapper ───────────────────────────────────────────────────
export function PermissionGuard({
  module,
  children,
}: {
  module: ModuleKey;
  children: React.ReactNode;
}) {
  const { canAccess } = useApp();
  if (!canAccess(module)) {
    return <AccessDenied module={module} />;
  }
  return <>{children}</>;
}