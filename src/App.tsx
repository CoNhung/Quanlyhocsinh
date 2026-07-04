import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  School,
  Wallet,
  AlertCircle,
  Menu,
  X,
  GraduationCap,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/StudentList';
import ClassManagement from './pages/ClassManagement';
import TuitionEntry from './pages/TuitionEntry';
import UnpaidTuition from './pages/UnpaidTuition';
import RecentPayments from './pages/RecentPayments';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './lib/auth';

type PageId = 'dashboard' | 'students' | 'classes' | 'tuition' | 'unpaid' | 'recent';

const NAV_ITEMS: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard },
  { id: 'students', label: 'Danh sách học sinh', icon: Users },
  { id: 'classes', label: 'Quản lý lớp', icon: School },
  { id: 'tuition', label: 'Nhập học phí', icon: Wallet },
  { id: 'unpaid', label: 'Chưa đóng học phí', icon: AlertCircle },
  { id: 'recent', label: 'Đóng gần đây', icon: TrendingUp },
];

function MainApp() {
  const { isAuthenticated, logout } = useAuth();
  const [page, setPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!isAuthenticated) {
    return <Login />;
  }

  const current = NAV_ITEMS.find((n) => n.id === page)!;

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'students':
        return <StudentList />;
      case 'classes':
        return <ClassManagement />;
      case 'tuition':
        return <TuitionEntry />;
      case 'unpaid':
        return <UnpaidTuition />;
      case 'recent':
        return <RecentPayments />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">QUẢN LÝ HỌC SINH</h1>
            <p className="text-[11px] text-slate-400">Hệ thống quản lý</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <LogOut className="w-[18px] h-[18px] shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200 h-16 flex items-center px-4 lg:px-8 gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <current.icon className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">{current.label}</h2>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{renderPage()}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
