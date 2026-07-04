import { useMemo, useState } from 'react';
import { TrendingUp, Calendar, Download } from 'lucide-react';
import { Card, Badge, Spinner, Button } from '../components/ui';
import { usePayments, useStudents, useClasses, useSubjects, useStudentSubjects } from '../lib/hooks';
import { exportRecentPaymentsExcel } from '../lib/excel';

export default function RecentPayments() {
  const { payments, loading: lP } = usePayments();
  const { students, loading: lS } = useStudents();
  const { classes } = useClasses();
  const { subjects } = useSubjects();
  const { rows: studentSubjects } = useStudentSubjects();

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  const loading = lP || lS;

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = useMemo(() => {
    const uniqueYears = new Set(payments.map((p) => p.year));
    const allYears = Array.from(uniqueYears).sort((a, b) => b - a);
    if (!allYears.includes(year)) allYears.unshift(year);
    return allYears;
  }, [payments, year]);

  const filtered = useMemo(() => {
    return payments
      .filter((p) => p.month === month && p.year === year)
      .filter((p) => {
        if (!classFilter && !subjectFilter) return true;
        const student = students.find((s) => s.id === p.student_id);
        if (!student) return false;
        const matchClass = !classFilter || student.class_id === Number(classFilter);
        const matchSubject =
          !subjectFilter ||
          studentSubjects.some(
            (ss) => ss.student_id === p.student_id && ss.subject_id === Number(subjectFilter)
          );
        return matchClass && matchSubject;
      })
      .sort((a, b) => new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime());
  }, [payments, students, studentSubjects, month, year, classFilter, subjectFilter]);

  const handleExport = () => {
    exportRecentPaymentsExcel(filtered, students, subjects, studentSubjects, month, year);
  };

  const getSubjectNames = (studentId: number): string => {
    const ssIds = studentSubjects.filter((ss) => ss.student_id === studentId).map((ss) => ss.subject_id);
    return subjects.filter((s) => ssIds.includes(s.id)).map((s) => s.name).join(', ');
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Danh sách đóng gần đây</h1>
            <p className="text-sm text-slate-500">Xem các giao dịch học phí theo tháng</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  Năm {y}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={handleExport} variant="secondary">
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Lớp {c.name} (Khối {c.grade})
            </option>
          ))}
        </select>
        <select
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        >
          <option value="">Tất cả môn</option>
          {subjects.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-800">
            Giao dịch tháng {month}/{year}
          </h3>
          <span className="text-sm text-slate-500">{filtered.length} giao dịch</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Không có giao dịch nào trong tháng {month}/{year}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="pb-3 font-medium">STT</th>
                  <th className="pb-3 font-medium">Học sinh</th>
                  <th className="pb-3 font-medium">Lớp</th>
                  <th className="pb-3 font-medium">SĐT</th>
                  <th className="pb-3 font-medium">Môn đăng ký</th>
                  <th className="pb-3 font-medium">Ngày đóng</th>
                  <th className="pb-3 font-medium">Trạng thái</th>
                  <th className="pb-3 font-medium">Phương thức</th>
                  <th className="pb-3 font-medium">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const student = students.find((s) => s.id === p.student_id);
                  return (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 text-slate-500">{i + 1}</td>
                      <td className="py-3 font-medium text-slate-800">{p.students?.name || '—'}</td>
                      <td className="py-3 text-slate-600">
                        {student?.classes ? `Lớp ${student.classes.name}` : '—'}
                      </td>
                      <td className="py-3 text-slate-600">{p.students?.phone || '—'}</td>
                      <td className="py-3 text-slate-600">{getSubjectNames(p.student_id) || '—'}</td>
                      <td className="py-3 text-slate-600">
                        {new Date(p.payment_date).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3">
                        {p.status === 'full' && <Badge color="emerald">Đã đóng đủ</Badge>}
                        {p.status === 'partial' && <Badge color="amber">Đóng thiếu</Badge>}
                        {p.status === 'unpaid' && <Badge color="rose">Chưa đóng</Badge>}
                      </td>
                      <td className="py-3 text-slate-600">
                        {p.payment_method === 'cash' ? 'Tiền mặt' : p.payment_method === 'transfer' ? 'Chuyển khoản' : '—'}
                      </td>
                      <td className="py-3 text-slate-500">{p.note || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
