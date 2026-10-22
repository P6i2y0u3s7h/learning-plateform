import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, UserCheck, BookOpen, ClipboardList, TrendingUp,
  CreditCard, ShieldCheck, Plus, Search, Filter, AlertCircle,
  FileBarChart, CheckCircle2, Trash2, Sparkles, Activity
} from 'lucide-react';
import DataTable from '../../../components/DataTable';
import Modal, { ConfirmModal } from '../../../components/Modal';
import { FormField, SelectField } from '../../../components/FormFields';
import { ADMIN_STATS, ADMIN_RECENT_STUDENTS } from '../../../data/sampleData';

export default function AdminOverview() {
  const [students, setStudents] = useState(ADMIN_RECENT_STUDENTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const [newStudent, setNewStudent] = useState({ name: '', class: 'Class 10', status: 'Active' });

  const handleAddStudent = () => {
    if (newStudent.name.trim()) {
      const studentObj = {
        id: `s${Date.now()}`,
        name: newStudent.name,
        class: newStudent.class,
        enrolled: 'Today',
        status: newStudent.status,
      };
      setStudents([studentObj, ...students]);
      setIsAddModalOpen(false);
      setNewStudent({ name: '', class: 'Class 10', status: 'Active' });
    }
  };

  const handleDelete = () => {
    if (deleteId) {
      setStudents(students.filter(s => s.id !== deleteId));
      setDeleteId(null);
    }
  };

  const columns = [
    {
      header: 'Student Name',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <span className="font-display font-bold text-sm text-white hover:text-[#CCFF00] transition-colors">
          {row.name}
        </span>
      ),
    },
    {
      header: 'Class / Program',
      accessor: 'class',
      sortable: true,
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {row.class}
        </span>
      ),
    },
    {
      header: 'Enrolled Date',
      accessor: 'enrolled',
      render: (row) => (
        <span className="font-mono text-xs text-slate-400">
          {row.enrolled}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const isActive = row.status === 'Active';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-xs font-semibold ${
              isActive
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-white/5 border border-white/10 text-slate-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            />
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <button
          onClick={() => setDeleteId(row.id)}
          className="inline-flex items-center gap-1 text-xs font-mono font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 px-2.5 py-1 rounded-lg border border-transparent hover:border-rose-500/30 transition-all cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove</span>
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-8 relative">
      {/* Background ambient lighting */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#10B981]/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Admin Welcome Banner - Scrub Dark Glassmorphism */}
      <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Specular hairline top glow */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] via-[#10B981] to-transparent" />

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#CCFF00] via-[#a3e635] to-[#84cc16] text-black flex items-center justify-center font-mono font-black text-2xl shadow-[0_0_25px_rgba(204,255,0,0.35)] ring-1 ring-white/20 flex-shrink-0">
            A
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-[#CCFF00] uppercase font-bold">
                [ CENTRAL CONTROL NODE &middot; SUPER ADMIN ]
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight">
              Platform Administration
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 font-mono mt-1">
              Brainstorm Academy Central Control & Entity Management Panel
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_20px_rgba(204,255,0,0.25)] cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Enroll Student</span>
          </button>
          <Link
            to="/dashboard/admin/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/15 text-white hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
          >
            <span>Manage Courses</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats - Scrub Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Students */}
        <div className="bg-[#0E121A]/85 backdrop-blur-xl border border-white/10 hover:border-[#CCFF00]/40 rounded-2xl p-5 transition-all duration-300 shadow-xl group relative overflow-hidden flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#CCFF00] group-hover:scale-110 transition-transform flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-0.5">Total Students</p>
            <p className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">1,240</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Active enrollments</p>
          </div>
        </div>

        {/* Card 2: Verified Faculty */}
        <div className="bg-[#0E121A]/85 backdrop-blur-xl border border-white/10 hover:border-[#10B981]/40 rounded-2xl p-5 transition-all duration-300 shadow-xl group relative overflow-hidden flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#10B981] group-hover:scale-110 transition-transform flex-shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-0.5">Verified Faculty</p>
            <p className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">48</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Instructors & evaluators</p>
          </div>
        </div>

        {/* Card 3: Active Courses */}
        <div className="bg-[#0E121A]/85 backdrop-blur-xl border border-white/10 hover:border-[#38BDF8]/40 rounded-2xl p-5 transition-all duration-300 shadow-xl group relative overflow-hidden flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#38BDF8] group-hover:scale-110 transition-transform flex-shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-0.5">Active Courses</p>
            <p className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">32</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">School & competitive</p>
          </div>
        </div>

        {/* Card 4: Monthly Revenue */}
        <div className="bg-[#0E121A]/85 backdrop-blur-xl border border-white/10 hover:border-[#A855F7]/40 rounded-2xl p-5 transition-all duration-300 shadow-xl group relative overflow-hidden flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#A855F7] group-hover:scale-110 transition-transform flex-shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-slate-400 font-mono text-[11px] uppercase tracking-wider mb-0.5">Monthly Revenue</p>
            <p className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight">Visual Demo</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Prototype state</p>
          </div>
        </div>
      </div>

      {/* Recent Student Registry */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#CCFF00]" />
              Recent Student Admissions
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Interactive table with search, sorting, and modal deletion
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 font-mono text-xs text-[#CCFF00] self-start sm:self-auto">
            {students.length} Records
          </span>
        </div>

        <DataTable
          columns={columns}
          data={students}
          searchable
          searchPlaceholder="Search admitted students..."
        />
      </div>

      {/* Add Student Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Enroll New Student (Admin Node)"
        size="md"
        footer={
          <>
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleAddStudent}
              className="px-5 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.25)] cursor-pointer"
            >
              Add Student
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs font-mono">
          <FormField
            label="Student Full Name"
            placeholder="e.g. Rahul Sharma"
            value={newStudent.name}
            onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
            required
          />
          <SelectField
            label="Class / Course"
            options={['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'AMU Entrance', 'Jamia Entrance']}
            value={newStudent.class}
            onChange={(e) => setNewStudent({ ...newStudent, class: e.target.value })}
          />
          <SelectField
            label="Status"
            options={['Active', 'Inactive', 'Pending']}
            value={newStudent.status}
            onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}
          />
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Remove Student Record"
        message="Are you sure you want to remove this student record from the visual prototype list?"
        confirmLabel="Delete Record"
      />
    </div>
  );
}
