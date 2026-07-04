import { useMemo, useRef, useState } from 'react';
import { Wallet, Search, CheckCircle2, Clock, XCircle, Trash2, FileSpreadsheet, Banknote, CreditCard } from 'lucide-react';
import { Card, Button, Select, Input, Badge, Spinner, EmptyState } from '../components/ui';
import { useStudents, usePayments } from '../lib/hooks';
import { supabase } from '../lib/supabase';
import { exportPaidExcel } from '../lib/excel';

export default function TuitionEntry() {
  const { students, loading: lS } = useStudents();
  const { payments, loading: lP, refresh } = usePayments();

  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  // Typeahead student input
  const [studentName, setStudentName] = useState('');
  const [matchedStudent, setMatchedStudent] = useState<number | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [payStatus, setPayStatus] = useState('full');
  const [payMethod, setPayMethod] = useState('cash');
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const classes = useMemo(() => {
    const map = new Map<string, { id: number; name: string; grade: number }>();
    students.forEach((s) => {
      if (s.classes) map.set(String(s.classes.id), s.classes);
    });
    return Array.from(map.values()).sort((a, b) => a.grade - b.grade);
  }, [students]);

  const monthPayments = useMemo(() => {
    return payments.filter(
      (p) => p.month === Number(month) && p.year === Number(year)
    );
  }, [payments, month, year]);

  const filteredStudents = useMemo(() => {
    const paidIds = new Set(monthPayments.map((p) => p.student_id));
    return students
      .filter((s) => paidIds.has(s.id))
      .filter((s) => {
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.phone.includes(search);
        const matchClass = !classFilter || s.class_id === Number(classFilter);
        return matchSearch && matchClass;
      });
  }, [students, monthPayments, search, classFilter]);

  const suggestions = useMemo(() => {
    if (!studentName.trim()) return [];
    const q = studentName.toLowerCase().trim();
    return students
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [students, studentName]);

  const paymentStatusFor = (studentId: number) => {
    const p = monthPayments.find((x) => x.student_id === studentId);
    return p || null;
  };

  const handleNameChange = (v: string) => {
    setStudentName(v);
    setMatchedStudent(null);
    setShowSuggestions(true);
  };

  const pickStudent = (id: number, name: string) => {
    setMatchedStudent(id);
    setStudentName(name);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (!matchedStudent) {
      setError('Vui lòng chọn học sinh từ danh sách gợi ý');
      return;
    }
    setSaving(true);
    try {
      const existing = monthPayments.find((p) => p.student_id === matchedStudent);
      if (existing) {
        const { error: e } = await supabase
          .from('payments')
          .update({
            status: payStatus,
            payment_method: payMethod,
            payment_date: payDate,
            note: note.trim() || null,
          })
          .eq('id', existing.id);
        if (e) throw e;
        setSuccess('Đã cập nhật học phí');
      } else {
        const { error: e } = await supabase.from('payments').insert({
          student_id: matchedStudent,
          month: Number(month),
          year: Number(year),
          payment_date: payDate,
          status: payStatus,
          payment_method: payMethod,
          note: note.trim() || null,
        });
        if (e) throw e;
        setSuccess('Đã ghi nhận học phí');
      }
      setNote('');
      setStudentName('');
      setMatchedStudent(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePayment = async (id: number) => {
    if (!confirm('Xóa bản ghi học phí này?')) return;
    await supabase.from('payments').delete().eq('id', id);
    await refresh();
  };

  const handleExport = () => {
    exportPaidExcel(monthPayments, Number(month), Number(year));
  };

  if (lS || lP) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Entry form */}
      <Card className="p-5">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-emerald-600" />
          Nhập học phí
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Typeahead student name */}
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tên học sinh <span className="text-rose-500">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={studentName}
              onChange={(e) => handleNameChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Nhập tên học sinh..."
              className={`w-full px-3 py-2 rounded-lg border text-sm text-slate-800 focus:outline-none focus:ring-2 transition ${
                matchedStudent
                  ? 'border-emerald-500 ring-emerald-500/20 bg-emerald-50/30'
                  : 'border-slate-300 focus:ring-emerald-500/30 focus:border-emerald-500'
              }`}
            />
            {matchedStudent && (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-[34px]" />
            )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-30 mt-1 w-full bg-white rounded-lg border border-slate-200 shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onMouseDown={() => pickStudent(s.id, s.name)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 border-b border-slate-100 last:border-0 transition"
                  >
                    <span className="font-medium text-slate-800">{s.name}</span>
                    {s.classes && (
                      <span className="text-slate-400 ml-2">Lớp {s.classes.name}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Select
            label="Tháng"
            value={month}
            onChange={setMonth}
            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
          />
          <Select
            label="Năm"
            value={year}
            onChange={setYear}
            options={Array.from({ length: 5 }, (_, i) => {
              const y = new Date().getFullYear() - 2 + i;
              return { value: y, label: String(y) };
            })}
          />
          <Input label="Ngày đóng" type="date" value={payDate} onChange={setPayDate} />
          <Select
            label="Trạng thái"
            value={payStatus}
            onChange={setPayStatus}
            options={[
              { value: 'full', label: 'Đã đóng đủ' },
              { value: 'partial', label: 'Đóng thiếu' },
              { value: 'unpaid', label: 'Chưa đóng' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phương thức</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayMethod('cash')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  payMethod === 'cash'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                }`}
              >
                <Banknote className="w-4 h-4" />
                Tiền mặt
              </button>
              <button
                type="button"
                onClick={() => setPayMethod('transfer')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition ${
                  payMethod === 'transfer'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-600 border-slate-300 hover:border-emerald-400'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Chuyển khoản
              </button>
            </div>
          </div>
          <Input label="Ghi chú" value={note} onChange={setNote} placeholder="Ghi chú thêm..." className="sm:col-span-2" />
        </div>
        <div className="flex items-center gap-3 mt-4">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Đang lưu...' : 'Lưu học phí'}
          </Button>
          {error && <span className="text-sm text-rose-600">{error}</span>}
          {success && <span className="text-sm text-emerald-600 font-medium">{success}</span>}
        </div>
      </Card>

      {/* Filters + Export */}
      <div className="flex flex-col sm:flex-row gap-3">
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
        <div className="text-sm text-slate-500 self-center sm:ml-auto">
          Tháng <span className="font-semibold text-slate-700">{month}/{year}</span>
        </div>
        <Button variant="secondary" onClick={handleExport} disabled={monthPayments.length === 0}>
          <FileSpreadsheet className="w-4 h-4" />
          Xuất Excel
        </Button>
      </div>

      {/* Payment table */}
      <Card className="overflow-hidden">
        {filteredStudents.length === 0 ? (
          <EmptyState message="Chưa có học sinh nào đóng học phí trong tháng này" icon={<Wallet className="w-10 h-10 text-slate-300" />} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">STT</th>
                  <th className="text-left px-4 py-3 font-semibold">Học sinh</th>
                  <th className="text-left px-4 py-3 font-semibold">Lớp</th>
                  <th className="text-left px-4 py-3 font-semibold">SĐT</th>
                  <th className="text-left px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="text-left px-4 py-3 font-semibold">Phương thức</th>
                  <th className="text-left px-4 py-3 font-semibold">Ngày đóng</th>
                  <th className="text-left px-4 py-3 font-semibold">Ghi chú</th>
                  <th className="text-right px-4 py-3 font-semibold">Xóa</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => {
                  const p = paymentStatusFor(s.id);
                  return (
                    <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.classes ? `Lớp ${s.classes.name}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.phone}</td>
                      <td className="px-4 py-3">
                        {p?.status === 'full' && (
                          <Badge color="emerald">
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> Đã đóng đủ
                          </Badge>
                        )}
                        {p?.status === 'partial' && (
                          <Badge color="amber">
                            <Clock className="w-3 h-3 mr-1 inline" /> Đóng thiếu
                          </Badge>
                        )}
                        {p?.status === 'unpaid' && (
                          <Badge color="rose">
                            <XCircle className="w-3 h-3 mr-1 inline" /> Chưa đóng
                          </Badge>
                        )}
                        {!p && <span className="text-slate-400 text-xs">Chưa có dữ liệu</span>}
                      </td>
                      <td className="px-4 py-3">
                        {p?.payment_method === 'cash' && (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                            <Banknote className="w-3.5 h-3.5" /> Tiền mặt
                          </span>
                        )}
                        {p?.payment_method === 'transfer' && (
                          <span className="inline-flex items-center gap-1 text-slate-600 text-xs">
                            <CreditCard className="w-3.5 h-3.5" /> Chuyển khoản
                          </span>
                        )}
                        {p && !p.payment_method && <span className="text-slate-400 text-xs">—</span>}
                        {!p && <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p ? new Date(p.payment_date).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{p?.note || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        {p && (
                          <button
                            onClick={() => handleDeletePayment(p.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
