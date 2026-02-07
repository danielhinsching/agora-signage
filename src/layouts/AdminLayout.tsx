import { Navigate, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Monitor, Tv, Calendar, LogOut, LayoutDashboard, Zap } from 'lucide-react';

const AdminLayout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { path: '/admin/tvs', label: 'TVs', icon: Tv },
    { path: '/admin/events', label: 'Eventos', icon: Calendar },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-72 bg-card/50 backdrop-blur-xl border-r border-border/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg animate-pulse-glow">
              <Monitor className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-xl gradient-text">Ágora LineUp</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Digital Signage
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-primary/20 to-secondary/10 text-primary border border-primary/30 shadow-lg shadow-primary/10'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  active ? 'bg-primary/20' : 'bg-muted/50'
                }`}>
                  <item.icon className={`w-5 h-5 ${active ? 'text-primary' : ''}`} />
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-border/50">
          <div className="glass-card p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-sm">{user?.username}</p>
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto custom-scrollbar bg-gradient-to-br from-background via-background to-muted/20">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
