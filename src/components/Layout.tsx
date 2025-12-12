import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Users,
  Package,
  Wifi,
  FileText,
  ClipboardList,
  BarChart3,
  History,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { path: '/funcionarios', label: 'Funcionários', icon: Users },
  { path: '/itens', label: 'Itens', icon: Package },
  { path: '/onus', label: 'ONUs', icon: Wifi },
  { path: '/os/nova', label: 'Criar OS', icon: FileText },
  { path: '/os', label: 'Ordens de Serviço', icon: ClipboardList },
  { path: '/estoque', label: 'Estoque Atual', icon: BarChart3 },
  { path: '/movimentacoes', label: 'Movimentações', icon: History },
];

export function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex no-print">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h1 className="text-lg font-bold">Controle de Estoque</h1>
          <p className="text-sm text-sidebar-foreground/70">Fibra Óptica</p>
        </div>
        <nav className="flex-1 p-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path === '/os' && location.pathname.startsWith('/os/') && location.pathname !== '/os/nova');
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md mb-1 transition-colors ${
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'hover:bg-sidebar-accent/50'
                }`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="text-sm mb-2">
            <span className="text-sidebar-foreground/70">Usuário:</span>{' '}
            <span className="font-medium">{usuario?.nome}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-border hover:bg-sidebar-accent/80"
          >
            <LogOut size={16} className="mr-2" />
            Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
