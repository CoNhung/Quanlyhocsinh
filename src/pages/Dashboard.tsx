import { useMemo } from 'react';
import { Users, School, Wallet, AlertCircle, TrendingUp, BookOpen } from 'lucide-react';
import { Card, StatCard, Spinner, Badge } from '../components/ui';
import { useStudents, useClasses, usePayments, useSubjects, useStudentSubjects } from '../lib/hooks';

type PageId = 'dashboard' | 'students' | 'classes' | 'tuition' | 'unpaid';

export default function Dashboard({ onNavigate }: { onNavigate: (p: PageId) => void }) {
  const { students, loading: lS } = useStudents();
  const { classes, loading: lC } = useClasses();
  const { payments, loading: lP } = usePayments();
  const { subjects } = useSubjects();
  const { rows: studentSubjects } = useStudentSubjects();

  const loading = lS || lC || lP;

  const stats = useMemo(() => {
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();

    const monthPayments = payments.filter((p) => p.month === curMonth && p.year === curYear);
    const paidCount = monthPayments.filter((p) => p.status === 'full').length;
    const unpaidCount = students.length - paidCount;

    // students per class
    const perClass = classes
      .map((c) => ({
        class: c,
        count: students.filter((s) => s.class_id === c.id).length,
      }))
      .sort((a, b) => b.count - a.count);

    // subject popularity
    const subjectCount = subjects.map((sub) => ({
      subject: sub,
      count: studentSubjects.filter((ss) => ss.subject_id === sub.id).length,
    }));
    subjectCount.sort((a, b) => b.count - a.count);

    return { paidCount, unpaidCount, monthPayments, perClass, subjectCount, curMonth, curYear };
  }, [students, classes, payments, subjects, studentSubjects]);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome banner */}
      <Card className="p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-0">
        <h2 className="text-2xl font-bold mb-1">Chào mừng đến với Hệ thống Quản lý Học sinh</h2>
        <p className="text-emerald-50 text-sm">
          Tổng quan tình hình học sinh, lớp học và học phí tháng {stats.curMonth}/{stats.curYear}
        </p>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Tổng học sinh"
          value={students.length}
          icon={<Users className="w-6 h-6" />}
          color="emerald"
        />
        <StatCard
          label="Số lớp học"
          value={classes.length}
          icon={<School className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          label="Đã đóng (tháng này)"
          value={stats.paidCount}
          icon={<Wallet className="w-6 h-6" />}
          color="emerald"
          sub={`${stats.monthPayments.length} giao dịch`}
        />
        <StatCard
          label="Chưa đóng (tháng này)"
          value={stats.unpaidCount}
          icon={<AlertCircle className="w-6 h-6" />}
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Students per class */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <School className="w-4 h-4 text-emerald-600" />
              Học sinh theo lớp
            </h3>
            <button
              onClick={() => onNavigate('classes')}
              className="text-xs text-emerald-600 font-medium hover:underline"
            >
              Xem tất cả →
            </button>
          </div>
          <div className="space-y-2.5">
            {stats.perClass.slice(0, 8).map(({ class: c, count }) => {
              const max = stats.perClass[0]?.count || 1;
              const pct = (count / max) * 100;
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 w-16 shrink-0">
                    Lớp {c.name}
                  </span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.perClass.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
            )}
          </div>
        </Card>

        {/* Subject popularity */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              Môn học đăng ký
            </h3>
          </div>
          <div className="space-y-2.5">
            {stats.subjectCount.map(({ subject, count }) => {
              const max = stats.subjectCount[0]?.count || 1;
              const pct = (count / max) * 100;
              return (
                <div key={subject.id} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-600 w-16 shrink-0">
                    {subject.name}
                  </span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 8)}%` }}
                    >
                      <span className="text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {stats.subjectCount.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">Chưa có dữ liệu</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent payments */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Giao dịch học phí gần đây
          </h3>
          <button
            onClick={() => onNavigate('tuition')}
            className="text-xs text-emerald-600 font-medium hover:underline"
          >
            Xem tất cả →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-200">
                <th className="pb-2 font-medium">Học sinh</th>
                <th className="pb-2 font-medium">Tháng</th>
                <th className="pb-2 font-medium">Ngày đóng</th>
                <th className="pb-2 font-medium">Trạng thái</th>
                <th className="pb-2 font-medium">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {stats.monthPayments.slice(0, 8).map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 font-medium text-slate-700">
                    {p.students?.name || '—'}
                  </td>
                  <td className="py-2.5 text-slate-600">{p.month}/{p.year}</td>
                  <td className="py-2.5 text-slate-600">
                    {new Date(p.payment_date).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-2.5">
                    {p.status === 'full' && <Badge color="emerald">Đã đóng đủ</Badge>}
                    {p.status === 'partial' && <Badge color="amber">Đóng thiếu</Badge>}
                    {p.status === 'unpaid' && <Badge color="rose">Chưa đóng</Badge>}
                  </td>
                  <td className="py-2.5 text-slate-500">{p.note || '—'}</td>
                </tr>
              ))}
              {stats.monthPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Chưa có giao dịch trong tháng này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
