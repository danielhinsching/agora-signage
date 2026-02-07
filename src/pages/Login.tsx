import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Monitor, Lock, User, Zap } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 500));

    const success = login(username, password);
    if (success) {
      navigate('/admin');
    } else {
      setError('Credenciais inválidas. Tente novamente.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/4 -left-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo Section */}
        <div className="text-center mb-10 fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-secondary mb-6 animate-pulse-glow shadow-2xl shadow-primary/20">
            <Monitor className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-2">Ágora LineUp</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Digital Signage Control
          </p>
        </div>

        {/* Login Form */}
        <div className="glass-card-strong p-8 rounded-2xl fade-in-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">
                Usuário
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Digite seu usuário"
                  className="pl-12 h-12 bg-input/50 border-border/50 focus:border-primary rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-12 h-12 bg-input/50 border-border/50 focus:border-primary rounded-xl"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all font-semibold text-base rounded-xl glow-effect"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Acessar Painel'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-border/30">
            <div className="glass-card p-4 rounded-xl">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Credenciais de demonstração:
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <span className="chip chip-primary">admin</span>
                <span className="text-muted-foreground">/</span>
                <span className="chip chip-secondary">agora2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-10 fade-in" style={{ animationDelay: '0.2s' }}>
          Ágora Tech Park © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default Login;
