import { useState } from 'react';
import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/button';
import { Tv, Calendar, LogOut, LayoutDashboard, Sun, Moon, TrendingUp, Menu, X, Building2 } from 'lucide-react';

const AdminLayout = () => {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <img 
            src="/icon.png" 
            alt="Ágora" 
            className="w-20 h-20 mx-auto rounded-2xl opacity-60 animate-pulse" 
          />
          <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
    { path: '/admin/tvs', label: 'TVs', icon: Tv },
    { path: '/admin/locais', label: 'Locais', icon: Building2 },
    { path: '/admin/events', label: 'Eventos', icon: Calendar },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-card/80 backdrop-blur-xl border-r border-border/50 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 md:p-6 border-b border-border/50">
          <div className="flex items-center justify-between">
            <img
              src="/logotext.png"
              alt="Ágora"
              className="rounded-2xl object-contain dark:brightness-0 dark:invert"
            />
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8"
              onClick={closeSidebar}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1.5 md:space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 md:px-4 py-3 md:py-3.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-primary/15 text-primary border border-primary/25 shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className={`w-8 h-8 md:w-9 md:h-9 rounded-lg flex items-center justify-center ${
                  active ? 'bg-primary/20' : 'bg-muted/50'
                }`}>
                  <item.icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-primary' : ''}`} />
                </div>
                <span className="font-medium text-sm md:text-base">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-3 md:p-4 border-t border-border/50 space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-border/50"
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-primary" />
                Modo Claro
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-primary" />
                Modo Escuro
              </>
            )}
          </Button>

          <div className="glass-card p-3 md:p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3 md:mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{user?.username}</p>
                <p className="text-xs text-muted-foreground">Administrador</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair do Sistema
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-30 lg:hidden bg-card/80 backdrop-blur-xl border-b border-border/50 h-14 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
        <img
          src="/logotext.png"
          alt="Ágora"
          className="h-7 object-contain ml-3 dark:brightness-0 dark:invert"
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar bg-background">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;