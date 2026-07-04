import { useMemo, useState } from 'react';
import { AlertCircle, Search, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import { Card, Button, Select, Badge, Spinner, EmptyState } from '../components/ui';
import { useStudents, usePayments, useSubjects, useStudentSubjects } from '../lib/hooks';
import { exportUnpaidExcel } from '../lib/excel';

export default function UnpaidTuition() {
  const { students, loading: lS } = useStudents();
  const { payments, loading: lP } = usePayments();
  const { subjects } = useSubjects();
  const { rows: studentSubjects } = useStudentSubjects();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const classes = useMemo(() => {
    const map = new Map<string, { id: number; name: string; grade: number }>();
    students.forEach((s) => {
      if (s.classes) map.set(String(s.classes.id), s.classes);
    });
    return Array.from(map.values()).sort((a, b) => a.grade - b.grade);
  }, [students]);

  const unpaidStudents = useMemo(() => {
    const monthPayments = payments.filter(
      (p) => p.month === Number(month) && p.year === Number(year)
    );
    const paidIds = new Set(
      monthPayments.filter((p) => p.status === 'full').map((p) => p.student_id)
    );

    return students
      .filter((s) => !paidIds.has(s.id))
      .filter((s) => {
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.phone.includes(search);
        const matchClass = !classFilter || s.class_id === Number(classFilter);
        const matchSubject =
          !subjectFilter ||
          studentSubjects.some(
            (ss) => ss.student_id === s.id && ss.subject_id === Number(subjectFilter)
          );
        return matchSearch && matchClass && matchSubject;
      });
  }, [students, payments, month, year, search, classFilter, subjectFilter, studentSubjects]);

  const getSubjectNames = (studentId: number): string => {
    const ssIds = studentSubjects.filter((ss) => ss.student_id === studentId).map((ss) => ss.subject_id);
    return subjects.filter((s) => ssIds.includes(s.id)).map((s) => s.name).join(', ');
  };

  if (lS || lP) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header banner */}
      <Card className="p-5 bg-gradient-to-br from-rose-500 to-orange-600 text-white border-0">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-8 h-8" />
          <div>
            <h3 className="text-lg font-bold">Danh sách chưa đóng học phí</h3>
            <p className="text-rose-50 text-sm">
              Tháng {month}/{year} —{' '}
              <span className="font-bold">{unpaidStudents.length}</span> học sinh chưa đóng
            </p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm học sinh..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        >
          <option value="">Tất cả lớp</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              Lớp {c.name}
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
        <Select
          value={month}
          onChange={setMonth}
          options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
          className="w-32"
        />
        <Select
          value={year}
          onChange={setYear}
          options={Array.from({ length: 5 }, (_, i) => {
            const y = new Date().getFullYear() - 2 + i;
            return { value: y, label: String(y) };
          })}
          className="w-28"
        />
        <Button variant="secondary" onClick={() => exportUnpaidExcel(unpaidStudents, payments, Number(month), Number(year))} disabled={unpaidStudents.length === 0}>
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Excel
        </Button>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {unpaidStudents.length === 0 ? (
          <EmptyState
            message="Tất cả học sinh đã đóng học phí tháng này!"
            icon={<CheckCircle2 className="w-10 h-10 text-emerald-400" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">STT</th>
                  <th className="text-left px-4 py-3 font-semibold">Học sinh</th>
                  <th className="text-left px-4 py-3 font-semibold">Lớp</th>
                  <th className="text-left px-4 py-3 font-semibold">Số điện thoại</th>
                  <th className="text-left px-4 py-3 font-semibold">Môn đăng ký</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {unpaidStudents.map((s, i) => {
                  const p = payments.find(
                    (x) =>
                      x.student_id === s.id &&
                      x.month === Number(month) &&
                      x.year === Number(year)
                  );
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.classes ? `Lớp ${s.classes.name}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {getSubjectNames(s.id) || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {p?.status === 'partial' && <Badge color="amber">Đóng thiếu</Badge>}
                        {p?.status === 'unpaid' && <Badge color="rose">Chưa đóng</Badge>}
                        {!p && <Badge color="rose">Chưa đóng</Badge>}
                      </td>
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
