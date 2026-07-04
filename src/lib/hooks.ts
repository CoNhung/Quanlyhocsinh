import { useEffect, useState, useCallback } from 'react';
import {
  supabase,
  type ClassRow,
  type SubjectRow,
  type StudentWithClass,
  type PaymentWithStudent,
  type StudentSubjectRow,
} from './supabase';

export function useClasses() {
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('grade', { ascending: true })
      .order('name', { ascending: true });
    if (!error && data) setClasses(data as ClassRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { classes, loading, refresh };
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setSubjects(data as SubjectRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { subjects, loading, refresh };
}

export function useStudents() {
  const [students, setStudents] = useState<StudentWithClass[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('*, classes(id, name, grade)')
      .order('name', { ascending: true });
    if (!error && data) setStudents(data as StudentWithClass[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { students, loading, refresh };
}

export function useStudentSubjects() {
  const [rows, setRows] = useState<StudentSubjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('student_subjects')
      .select('*');
    if (!error && data) setRows(data as StudentSubjectRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { rows, loading, refresh };
}

export function usePayments() {
  const [payments, setPayments] = useState<PaymentWithStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(id, name, phone)')
      .order('payment_date', { ascending: false });
    if (!error && data) setPayments(data as PaymentWithStudent[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { payments, loading, refresh };
}
