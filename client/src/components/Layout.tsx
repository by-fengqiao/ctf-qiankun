import {
  Outlet, useLocation, useNavigate, NavLink, Link,
} from 'react-router-dom';
import {
  LayoutDashboard, Key, Clock, Wallet, Settings, Star,
  Users, Ticket, Receipt, Sliders, Activity,
  BookOpen, ChevronRight, Shield, User, Zap,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
}

const USER_NAV: NavItem[] = [
  { to: '/console', label: '概览', icon: LayoutDashboard, end: true },
  { to: '/console/api-keys', label: 'API 密钥管理', icon: Key },
  { to: '/console/usage', label: '使用记录', icon: Clock },
  { to: '/console/credits', label: '积分管理', icon: Wallet },
  { to: '/console/recharge', label: '积分充值', icon: Zap },
  { to: '/console/settings', label: '个人设置', icon: Settings },
  { to: '/console/favorites', label: '收藏工具', icon: Star },
];

const ADMIN_NAV: NavItem[] = [
  { to: '/admin/users', label: '用户管理', icon: Users },
  { to: '/admin/invite-codes', label: '邀请码管理', icon: Ticket },
  { to: '/admin/recharge-orders', label: '充值订单', icon: Receipt },
  { to: '/admin/system-settings', label: '系统设置', icon: Sliders },
  { to: '/admin/monitoring', label: '系统监控', icon: Activity },
];

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { type, email, logout } = useAuth();
  const userEmail = type === 'user' ? email : type === 'admin' ? email : undefined;
  const isAdmin = type === 'admin';
  const isAdminPath = location.pathname.startsWith('/admin/');
  const isConsolePath = location.pathname.startsWith('/console');
  const navItems = isAdminPath ? ADMIN_NAV : isConsolePath ? USER_NAV : [];
  const sectionTitle = isAdminPath ? '管理后台' : '个人控制台';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="w-60 shrink-0 border-r border-border bg-card flex flex-col">
        <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
          <Link
            to="/"
            className="text-base font-semibold text-primary hover:opacity-80 transition-opacity"
          >
            CTF乾坤袋
          </Link>
        </div>
        <div className="px-3 py-3">
          {isAdmin && (
            <div className="mb-3 rounded-lg border border-border bg-background p-1 flex">
              <Link
                to="/console"
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isConsolePath
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="size-3.5" />
                控制台
              </Link>
              <Link
                to="/admin/users"
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  isAdminPath
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Shield className="size-3.5" />
                管理后台
              </Link>
            </div>
          )}
          <p className="text-xs font-medium text-muted-foreground px-2 mb-1">
            {sectionTitle}
          </p>
          <nav className="flex flex-col gap-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`
                }
              >
                <item.icon className="size-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                <ChevronRight className="size-3 ml-auto opacity-50" />
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-border p-3">
          <div className="flex items-center gap-2 px-2 py-2 mb-2">
            <div className="size-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-accent-foreground">
              {userEmail?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">
                {userEmail || '未登录'}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {isAdmin ? '管理员' : '普通用户'}
              </p>
            </div>
          </div>
          <Separator className="my-2" />
          <div className="flex flex-col gap-0.5">
            <Link
              to="/api-docs"
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <BookOpen className="size-4 shrink-0" />
              <span>说明文档</span>
            </Link>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
