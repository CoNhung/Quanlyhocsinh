import * as XLSX from 'xlsx';
import type { StudentWithClass, PaymentWithStudent, SubjectRow, StudentSubjectRow } from './supabase';

type ExportRow = {
  STT: number;
  'Họ và tên': string;
  'Lớp': string;
  'Số điện thoại': string;
  'Tháng': string;
  'Ngày đóng': string;
  'Trạng thái': string;
  'Phương thức': string;
  'Ghi chú': string;
};

type StudentExportRow = {
  STT: number;
  'Họ và tên': string;
  'Số điện thoại': string;
  'Ngày nhập học': string;
  'Lớp': string;
  'Môn đăng ký': string;
  'Trạng thái': string;
};

const statusLabel = (status: string) => {
  if (status === 'full') return 'Đã đóng đủ';
  if (status === 'partial') return 'Đóng thiếu';
  if (status === 'unpaid') return 'Chưa đóng';
  return status;
};

const methodLabel = (method: string | null) => {
  if (method === 'cash') return 'Tiền mặt';
  if (method === 'transfer') return 'Chuyển khoản';
  return method || '';
};

const fmtDate = (d: string | null) => {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('vi-VN');
  } catch {
    return d;
  }
};

// Get last word in Vietnamese name (the actual name, not family name)
export const getLastName = (fullName: string): string => {
  const parts = fullName.trim().split(/\s+/);
  return parts[parts.length - 1] || '';
};

export const sortByNameVietnamese = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const lastNameA = getLastName(a.name).toLowerCase();
    const lastNameB = getLastName(b.name).toLowerCase();
    return lastNameA.localeCompare(lastNameB, 'vi');
  });
};

export function exportPaidExcel(
  payments: PaymentWithStudent[],
  month: number,
  year: number
) {
  const rows: ExportRow[] = payments
    .filter((p) => p.status === 'full' || p.status === 'partial')
    .map((p, i) => ({
      STT: i + 1,
      'Họ và tên': p.students?.name || '',
      'Lớp': '',
      'Số điện thoại': p.students?.phone || '',
      'Tháng': `${p.month}/${p.year}`,
      'Ngày đóng': fmtDate(p.payment_date),
      'Trạng thái': statusLabel(p.status),
      'Phương thức': methodLabel(p.payment_method),
      'Ghi chú': p.note || '',
    }));

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['STT', 'Họ và tên', 'Lớp', 'Số điện thoại', 'Tháng', 'Ngày đóng', 'Trạng thái', 'Phương thức', 'Ghi chú'],
  });
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Đã đóng');
  XLSX.writeFile(wb, `HocPhi_DaDong_${month}_${year}.xlsx`);
}

export function exportUnpaidExcel(
  students: StudentWithClass[],
  payments: PaymentWithStudent[],
  month: number,
  year: number
) {
  const sortedStudents = sortByNameVietnamese(students);

  const rows: (ExportRow & { 'Môn đăng ký': string })[] = sortedStudents.map((s, i) => {
    const p = payments.find(
      (x) => x.student_id === s.id && x.month === month && x.year === year
    );
    return {
      STT: i + 1,
      'Họ và tên': s.name,
      'Lớp': s.classes?.name || '',
      'Số điện thoại': s.phone,
      'Tháng': `${month}/${year}`,
      'Ngày đóng': p ? fmtDate(p.payment_date) : '',
      'Trạng thái': p ? statusLabel(p.status) : 'Chưa đóng',
      'Phương thức': p ? methodLabel(p.payment_method) : '',
      'Ghi chú': p?.note || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['STT', 'Họ và tên', 'Lớp', 'Số điện thoại', 'Tháng', 'Ngày đóng', 'Trạng thái', 'Phương thức', 'Ghi chú'],
  });
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Chưa đóng');
  XLSX.writeFile(wb, `HocPhi_ChuaDong_${month}_${year}.xlsx`);
}

export function exportRecentPaymentsExcel(
  payments: PaymentWithStudent[],
  students: StudentWithClass[],
  subjects: SubjectRow[],
  studentSubjects: StudentSubjectRow[],
  month: number,
  year: number
) {
  const getSubjectNames = (studentId: number): string => {
    const ssIds = studentSubjects.filter((ss) => ss.student_id === studentId).map((ss) => ss.subject_id);
    return subjects.filter((s) => ssIds.includes(s.id)).map((s) => s.name).join(', ');
  };

  const rows: ExportRow[] = payments.map((p, i) => {
    const student = students.find((s) => s.id === p.student_id);
    return {
      STT: i + 1,
      'Họ và tên': p.students?.name || '',
      'Lớp': student?.classes?.name || '',
      'Số điện thoại': p.students?.phone || '',
      'Tháng': `${p.month}/${p.year}`,
      'Ngày đóng': fmtDate(p.payment_date),
      'Trạng thái': statusLabel(p.status),
      'Phương thức': methodLabel(p.payment_method),
      'Ghi chú': p.note || '',
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows, {
    header: ['STT', 'Họ và tên', 'Lớp', 'Số điện thoại', 'Tháng', 'Ngày đóng', 'Trạng thái', 'Phương thức', 'Ghi chú'],
  });
  ws['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách đóng');
  XLSX.writeFile(wb, `DanhSach_Dong_${month}_${year}.xlsx`);
}

export function exportStudentListExcel(
  students: StudentWithClass[],
  subjects: SubjectRow[],
  studentSubjects: StudentSubjectRow[],
  payments: PaymentWithStudent[],
  month: number,
  year: number,
  classFilter?: { name: string; grade: number } | null,
  subjectFilter?: string | null
) {
  const wb = XLSX.utils.book_new();
  const paidIds = new Set(
    payments
      .filter((p) => p.month === month && p.year === year && p.status === 'full')
      .map((p) => p.student_id)
  );

  // Helper to get subjects for a student
  const getSubjectNames = (studentId: number): string => {
    const ssIds = studentSubjects.filter((ss) => ss.student_id === studentId).map((ss) => ss.subject_id);
    return subjects.filter((s) => ssIds.includes(s.id)).map((s) => s.name).join(', ');
  };

  // Filter students by class and subject
  let filteredStudents = [...students];
  if (classFilter) {
    filteredStudents = filteredStudents.filter((s) => s.classes?.name === classFilter.name);
  }
  if (subjectFilter) {
    const subjectId = subjects.find((s) => s.name === subjectFilter)?.id;
    if (subjectId) {
      filteredStudents = filteredStudents.filter((s) =>
        studentSubjects.some((ss) => ss.student_id === s.id && ss.subject_id === subjectId)
      );
    }
  }

  // Sort by last name (Vietnamese style)
  const sortedStudents = sortByNameVietnamese(filteredStudents);

  // Tab 1: Student list
  const studentRows: StudentExportRow[] = sortedStudents.map((s, i) => ({
    STT: i + 1,
    'Họ và tên': s.name,
    'Số điện thoại': s.phone,
    'Ngày nhập học': fmtDate(s.enrollment_date),
    'Lớp': s.classes?.name || '',
    'Môn đăng ký': getSubjectNames(s.id),
    'Trạng thái': paidIds.has(s.id) ? 'Đã đóng đủ' : 'Chưa đóng đủ',
  }));

  const wsStudents = XLSX.utils.json_to_sheet(studentRows, {
    header: ['STT', 'Họ và tên', 'Số điện thoại', 'Ngày nhập học', 'Lớp', 'Môn đăng ký', 'Trạng thái'],
  });
  wsStudents['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 14 }, { wch: 8 }, { wch: 25 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStudents, 'Danh sách học sinh');

  // Tab 2: Paid
  const paidStudents = sortedStudents.filter((s) => paidIds.has(s.id));
  const paidRows: ExportRow[] = paidStudents.map((s, i) => {
    const p = payments.find((x) => x.student_id === s.id && x.month === month && x.year === year);
    return {
      STT: i + 1,
      'Họ và tên': s.name,
      'Lớp': s.classes?.name || '',
      'Số điện thoại': s.phone,
      'Tháng': `${month}/${year}`,
      'Ngày đóng': p ? fmtDate(p.payment_date) : '',
      'Trạng thái': p ? statusLabel(p.status) : 'Đã đóng đủ',
      'Phương thức': p ? methodLabel(p.payment_method) : '',
      'Ghi chú': p?.note || '',
    };
  });

  const wsPaid = XLSX.utils.json_to_sheet(paidRows, {
    header: ['STT', 'Họ và tên', 'Lớp', 'Số điện thoại', 'Tháng', 'Ngày đóng', 'Trạng thái', 'Phương thức', 'Ghi chú'],
  });
  wsPaid['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPaid, 'Đã đóng');

  // Tab 3: Unpaid
  const unpaidStudents = sortedStudents.filter((s) => !paidIds.has(s.id));
  const unpaidRows: ExportRow[] = unpaidStudents.map((s, i) => {
    const p = payments.find((x) => x.student_id === s.id && x.month === month && x.year === year);
    return {
      STT: i + 1,
      'Họ và tên': s.name,
      'Lớp': s.classes?.name || '',
      'Số điện thoại': s.phone,
      'Tháng': `${month}/${year}`,
      'Ngày đóng': p ? fmtDate(p.payment_date) : '',
      'Trạng thái': p ? statusLabel(p.status) : 'Chưa đóng',
      'Phương thức': p ? methodLabel(p.payment_method) : '',
      'Ghi chú': p?.note || '',
    };
  });

  const wsUnpaid = XLSX.utils.json_to_sheet(unpaidRows, {
    header: ['STT', 'Họ và tên', 'Lớp', 'Số điện thoại', 'Tháng', 'Ngày đóng', 'Trạng thái', 'Phương thức', 'Ghi chú'],
  });
  wsUnpaid['!cols'] = [
    { wch: 5 }, { wch: 25 }, { wch: 8 }, { wch: 15 }, { wch: 10 },
    { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUnpaid, 'Chưa đóng');

  const fileName = classFilter
    ? `DanhSach_Lop${classFilter.name}_${month}_${year}.xlsx`
    : `DanhSach_HocSinh_${month}_${year}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
