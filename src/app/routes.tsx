import React from 'react';
import { createMemoryRouter, Outlet, useRouteError } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ZhiHuiPage } from './pages/ZhiHuiPage';
import { InspirationLibraryPage } from './pages/InspirationLibraryPage';
import { DesignCopilotPage } from './pages/DesignCopilotPage';
import { AdminPage } from './pages/AdminPage';
import { PatternMarketPage } from './pages/PatternMarketPage';
import { PermissionGuard } from './components/PermissionGuard';
import { AppProvider } from './context/AppContext';
import type { ModuleKey } from './context/AppContext';

// ── Root layout ───────────────────────────────────────────────────────────────
function Root() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

// ── Inline error boundary ─────────────────────────────────────────────────────
function RouteErrorBoundary() {
  const error = useRouteError() as Error | null;
  return (
    <div className="flex items-center justify-center h-full p-8"
      style={{ background: '#F5F0E8' }}>
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white shadow-lg"
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(139,32,32,0.07)' }}>
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-[#1A3D4A] mb-2" style={{ fontSize: 18, fontWeight: 600 }}>
          页面渲染出现问题
        </h2>
        <p className="text-sm text-[#6B6558] mb-1 leading-relaxed">
          {error?.message ?? '未知错误'}
        </p>
        <p className="text-xs text-[#9B9590] mb-6">请尝试刷新页面或返回首页</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          刷新页面
        </button>
      </div>
    </div>
  );
}

// ── Route-level RBAC guard ────────────────────────────────────────────────────
function Guard({ mod, Page }: { mod: ModuleKey; Page: React.ComponentType }) {
  return (
    <PermissionGuard module={mod}>
      <Page />
    </PermissionGuard>
  );
}

export const router = createMemoryRouter(
  [
    {
      path: '/',
      Component: Root,
      ErrorBoundary: RouteErrorBoundary,
      children: [
        { index: true,        element: <Guard mod="zhihui"    Page={ZhiHuiPage} /> },
        { path: 'zhihui',     element: <Guard mod="zhihui"    Page={ZhiHuiPage} /> },
        { path: 'copilot',    element: <Guard mod="copilot"   Page={DesignCopilotPage} /> },
        { path: 'materials',  element: <Guard mod="materials" Page={InspirationLibraryPage} /> },
        { path: 'market',     element: <Guard mod="market"    Page={PatternMarketPage} /> },
        { path: 'admin',      element: <Guard mod="admin"     Page={AdminPage} /> },
      ],
    },
  ],
  { initialEntries: ['/zhihui'], initialIndex: 0 }
);