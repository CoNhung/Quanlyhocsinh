import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ClassRow = {
  id: number;
  name: string;
  grade: number;
  created_at: string;
};

export type SubjectRow = {
  id: number;
  name: string;
  created_at: string;
};

export type StudentRow = {
  id: number;
  name: string;
  phone: string;
  enrollment_date: string | null;
  class_id: number | null;
  created_at: string;
};

export type StudentWithClass = StudentRow & {
  classes: Pick<ClassRow, 'id' | 'name' | 'grade'> | null;
};

export type StudentSubjectRow = {
  student_id: number;
  subject_id: number;
  created_at: string;
};

export type PaymentRow = {
  id: number;
  student_id: number;
  month: number;
  year: number;
  payment_date: string;
  status: 'full' | 'partial' | 'unpaid';
  note: string | null;
  payment_method: string | null;
  created_at: string;
};

export type PaymentWithStudent = PaymentRow & {
  students: Pick<StudentRow, 'id' | 'name' | 'phone'> | null;
};
