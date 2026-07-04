import { useState } from 'react';
import { School, Plus, Users, Pencil, Trash2, X } from 'lucide-react';
import { Card, Button, Input, Spinner, EmptyState } from '../components/ui';
import { useClasses, useStudents } from '../lib/hooks';
import { supabase } from '../lib/supabase';

export default function ClassManagement() {
  const { classes, loading, refresh } = useClasses();
  const { students } = useStudents();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', grade: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const countFor = (classId: number) => students.filter((s) => s.class_id === classId).length;

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', grade: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (id: number) => {
    const c = classes.find((x) => x.id === id);
    if (!c) return;
    setEditing(id);
    setForm({ name: c.name, grade: String(c.grade) });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên lớp');
      return;
    }
    const gradeNum = Number(form.grade);
    if (!form.grade || isNaN(gradeNum)) {
      setError('Vui lòng nhập khối hợp lệ (số)');
      return;
    }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), grade: gradeNum };
      if (editing) {
        const { error: e } = await supabase.from('classes').update(payload).eq('id', editing);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from('classes').insert(payload);
        if (e) throw e;
      }
      await refresh();
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const count = countFor(id);
    if (count > 0) {
      alert(`Không thể xóa: lớp đang có ${count} học sinh. Vui lòng chuyển học sinh sang lớp khác trước.`);
      return;
    }
    if (!confirm('Xóa lớp học này?')) return;
    await supabase.from('classes').delete().eq('id', id);
    await refresh();
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{classes.length}</span> lớp học
        </p>
        <Button onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Thêm lớp
        </Button>
      </div>

      {classes.length === 0 ? (
        <Card>
          <EmptyState message="Chưa có lớp học nào" icon={<School className="w-10 h-10 text-slate-300" />} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map((c) => {
            const count = countFor(c.id);
            return (
              <Card key={c.id} className="p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg">
                    {c.name}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(c.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 transition"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="mt-3 font-bold text-slate-800">Lớp {c.name}</h3>
                <p className="text-sm text-slate-500">Khối {c.grade}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-600">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">{count}</span> học sinh
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {editing ? 'Sửa lớp học' : 'Thêm lớp học mới'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="space-y-4">
              <Input label="Tên lớp" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required placeholder="VD: 9, 10A" />
              <Input label="Khối" value={form.grade} onChange={(v) => setForm({ ...form, grade: v })} required placeholder="VD: 9" />
              {error && (
                <div className="text-sm text-rose-600 bg-rose-50 px-3 py-2 rounded-lg">{error}</div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
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
