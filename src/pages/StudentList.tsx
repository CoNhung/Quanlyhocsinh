import { useMemo, useState } from 'react';
import { UserPlus, Search, Pencil, Trash2, Phone, X, Users, Download } from 'lucide-react';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Spinner,
  EmptyState,
} from '../components/ui';
import { useStudents, useClasses, useSubjects, useStudentSubjects, usePayments } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import { exportStudentListExcel, sortByNameVietnamese } from '../lib/excel';

export default function StudentList() {
  const { students, loading, refresh } = useStudents();
  const { classes } = useClasses();
  const { subjects } = useSubjects();
  const { rows: studentSubjects, refresh: refreshSS } = useStudentSubjects();
  const { payments } = usePayments();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', class_id: '', enrollment_date: '' });
  const [selectedSubjects, setSelectedSubjects] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

  const filtered = useMemo(() => {
    const result = students.filter((s) => {
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
    return sortByNameVietnamese(result);
  }, [students, search, classFilter, subjectFilter, studentSubjects]);

  const subjectNamesFor = (studentId: number) => {
    const ids = studentSubjects.filter((ss) => ss.student_id === studentId).map((ss) => ss.subject_id);
    return subjects.filter((sub) => ids.includes(sub.id));
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', phone: '', class_id: '', enrollment_date: new Date().toISOString().slice(0, 10) });
    setSelectedSubjects([]);
    setError('');
    setShowModal(true);
  };

  const openEdit = (id: number) => {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setEditing(id);
    setForm({
      name: s.name,
      phone: s.phone,
      class_id: s.class_id ? String(s.class_id) : '',
      enrollment_date: s.enrollment_date || new Date().toISOString().slice(0, 10),
    });
    setSelectedSubjects(subjectNamesFor(id).map((sub) => sub.id));
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên học sinh');
      return;
    }
    if (!form.phone.trim()) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        class_id: form.class_id ? Number(form.class_id) : null,
        enrollment_date: form.enrollment_date || null,
      };

      if (editing) {
        const { error: e } = await supabase
          .from('students')
          .update(payload)
          .eq('id', editing);
        if (e) throw e;

        // sync subjects
        await supabase.from('student_subjects').delete().eq('student_id', editing);
        if (selectedSubjects.length > 0) {
          const rows = selectedSubjects.map((sid) => ({ student_id: editing, subject_id: sid }));
          const { error: e2 } = await supabase.from('student_subjects').insert(rows);
          if (e2) throw e2;
        }
      } else {
        const { data, error: e } = await supabase
          .from('students')
          .insert(payload)
          .select('id')
          .single();
        if (e) throw e;
        const newId = data.id;
        if (selectedSubjects.length > 0) {
          const rows = selectedSubjects.map((sid) => ({ student_id: newId, subject_id: sid }));
          const { error: e2 } = await supabase.from('student_subjects').insert(rows);
          if (e2) throw e2;
        }
      }
      await refresh();
      await refreshSS();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xóa học sinh này? Hành động không thể hoàn tác.')) return;
    await supabase.from('student_subjects').delete().eq('student_id', id);
    await supabase.from('payments').delete().eq('student_id', id);
    await supabase.from('students').delete().eq('id', id);
    await refresh();
    await refreshSS();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc SĐT..."
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              const classObj = classFilter ? classes.find((c) => c.id === Number(classFilter)) : null;
              const subjectName = subjectFilter ? subjects.find((s) => s.id === Number(subjectFilter))?.name : null;
              exportStudentListExcel(
                students,
                subjects,
                studentSubjects,
                payments,
                curMonth,
                curYear,
                classObj ? { name: classObj.name, grade: classObj.grade } : null,
                subjectName
              );
            }}
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </Button>
          <Button onClick={openAdd}>
            <UserPlus className="w-4 h-4" />
            Thêm học sinh
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-500">
        Hiển thị <span className="font-semibold text-slate-700">{filtered.length}</span> / {students.length} học sinh
      </p>

      {/* Table */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState message="Không tìm thấy học sinh nào" icon={<Users className="w-10 h-10 text-slate-300" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">STT</th>
                  <th className="text-left px-4 py-3 font-semibold">Họ và tên</th>
                  <th className="text-left px-4 py-3 font-semibold">Số điện thoại</th>
                  <th className="text-left px-4 py-3 font-semibold">Lớp</th>
                  <th className="text-left px-4 py-3 font-semibold">Ngày nhập học</th>
                  <th className="text-left px-4 py-3 font-semibold">Môn đăng ký</th>
                  <th className="text-right px-4 py-3 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const subs = subjectNamesFor(s.id);
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {s.phone}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {s.classes ? (
                          <Badge color="blue">Lớp {s.classes.name}</Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.enrollment_date
                          ? new Date(s.enrollment_date).toLocaleDateString('vi-VN')
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {subs.length > 0 ? (
                            subs.map((sub) => (
                              <Badge key={sub.id} color="emerald">
                                {sub.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-slate-400 text-xs">Chưa đăng ký</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(s.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editing ? 'Sửa học sinh' : 'Thêm học sinh mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <Input label="Họ và tên" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="Nguyễn Văn A" />
              <Input label="Số điện thoại" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} required placeholder="09xxxxxxxx" />
              <Select
                label="Lớp"
                value={form.class_id}
                onChange={(v) => setForm({ ...form, class_id: v })}
                placeholder="— Chọn lớp —"
                options={classes.map((c) => ({ value: c.id, label: `Lớp ${c.name} (Khối ${c.grade})` }))}
              />
              <Input
                label="Ngày nhập học"
                type="date"
                value={form.enrollment_date}
                onChange={(v) => setForm({ ...form, enrollment_date: v })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Môn học đăng ký</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((sub) => {
                    const checked = selectedSubjects.includes(sub.id);
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() =>
                          setSelectedSubjects((prev) =>
                            checked ? prev.filter((x) => x !== sub.id) : [...prev, sub.id]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                          checked
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Đang lưu...' : editing ? 'Cập nhật' : 'Thêm mới'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
