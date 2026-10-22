import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Users, UserCheck, BookOpen, Layers, PlayCircle, FileText,
  ClipboardList, ClipboardCheck, CreditCard, HelpCircle,
  Bell, FileBarChart, Settings, Plus, Trash2, Edit2, CheckCircle2
} from 'lucide-react';
import { SectionHeading, Button, Badge } from '../../../components/UI';
import DataTable from '../../../components/DataTable';
import Modal, { ConfirmModal } from '../../../components/Modal';
import { FormField, SelectField } from '../../../components/FormFields';

export default function AdminViews() {
  const location = useLocation();
  const path = location.pathname;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  const openModal = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };

  // 1. Teachers View
  if (path.includes('/teachers')) {
    const teacherCols = [
      { header: 'Faculty Name', accessor: 'name', sortable: true },
      { header: 'Subject Expertise', accessor: 'subject' },
      { header: 'Batches Assigned', accessor: 'batches' },
      { header: 'Status', accessor: 'status', render: (r) => <Badge color="#10B981">{r.status}</Badge> },
      {
        header: 'Action',
        accessor: 'id',
        render: () => <button onClick={() => setDeleteModal(true)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
      }
    ];
    const teachersData = [
      { id: 't1', name: 'Dr. A. K. Sharma', subject: 'Physics & Mathematics', batches: 'Class 10, Class 12', status: 'Active' },
      { id: 't2', name: 'Prof. Fatima Zehra', subject: 'Chemistry', batches: 'Class 11, AMU Entrance', status: 'Active' },
      { id: 't3', name: 'Er. Rajesh Verma', subject: 'Mathematics (JEE)', batches: 'Competitive Batches', status: 'Active' },
    ];
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <SectionHeading tag="Faculty Registry" title="Manage Teachers & Instructors" />
          <Button onClick={() => openModal('Add New Faculty')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Add Teacher
          </Button>
        </div>
        <DataTable columns={teacherCols} data={teachersData} searchable searchPlaceholder="Search faculty members..." />
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Faculty Full Name" placeholder="e.g. Prof. Mohammad Tariq" />
            <FormField label="Email Address" type="email" placeholder="faculty@brainstorm.in" />
            <FormField label="Subjects / Specialization" placeholder="Physics, JEE Mechanics" />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">Save Teacher</Button>
          </div>
        </Modal>
        <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={() => setDeleteModal(false)} title="Remove Faculty" message="Are you sure you want to remove this faculty record?" />
      </div>
    );
  }

  // 2. Courses & Subjects View
  if (path.includes('/courses') || path.includes('/subjects') || path.includes('/chapters')) {
    const courseCols = [
      { header: 'Course / Subject', accessor: 'title', sortable: true },
      { header: 'Category', accessor: 'category' },
      { header: 'Chapters', accessor: 'chapters' },
      { header: 'Status', accessor: 'status', render: (r) => <Badge color="#2457A7">{r.status}</Badge> },
      {
        header: 'Action',
        accessor: 'id',
        render: () => <button onClick={() => setDeleteModal(true)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
      }
    ];
    const coursesData = [
      { id: 'c1', title: 'Mathematics — Class 10 NCERT', category: 'School', chapters: 15, status: 'Published' },
      { id: 'c2', title: 'Science (Physics, Chem, Bio) — Class 10', category: 'School', chapters: 16, status: 'Published' },
      { id: 'c3', title: 'AMU Class 11 Entrance Crash Course', category: 'Entrance', chapters: 18, status: 'Active' },
      { id: 'c4', title: 'JEE Main Foundation Physics', category: 'Competitive', chapters: 20, status: 'Active' },
    ];
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <SectionHeading tag="Academic Curriculum" title="Manage Courses, Subjects & Chapters" />
          <Button onClick={() => openModal('Create New Course / Chapter')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </div>
        <DataTable columns={courseCols} data={coursesData} searchable searchPlaceholder="Search curriculum items..." />
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Title" placeholder="e.g. Class 11 Chemistry" />
            <SelectField label="Category" options={['School', 'Competitive', 'Entrance']} />
            <FormField label="Total Chapters / Topics" placeholder="12" type="number" />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">Save Curriculum</Button>
          </div>
        </Modal>
        <ConfirmModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={() => setDeleteModal(false)} title="Delete Course Item" message="Remove course item from catalog?" />
      </div>
    );
  }

  // 3. Payments & Enrollments
  if (path.includes('/payments') || path.includes('/enrollments')) {
    const paymentCols = [
      { header: 'Invoice ID', accessor: 'id', sortable: true },
      { header: 'Student Name', accessor: 'student' },
      { header: 'Course / Plan', accessor: 'course' },
      { header: 'Amount', accessor: 'amount' },
      { header: 'Status', accessor: 'status', render: (r) => <Badge color="#10B981">{r.status}</Badge> },
      { header: 'Date', accessor: 'date' }
    ];
    const paymentsData = [
      { id: 'INV-1092', student: 'Aarav Patel', course: 'Class 10 Full Package', amount: '₹ 4,999', status: 'Completed', date: 'Oct 18, 2026' },
      { id: 'INV-1093', student: 'Sara Khan', course: 'AMU Entrance Simulator', amount: '₹ 2,499', status: 'Completed', date: 'Oct 17, 2026' },
      { id: 'INV-1094', student: 'Rohan Gupta', course: 'Class 12 Physics Special', amount: '₹ 3,499', status: 'Completed', date: 'Oct 16, 2026' },
    ];
    return (
      <div className="space-y-6">
        <SectionHeading tag="Financials" title="Enrollments & Payment Ledger" subtitle="Review incoming student subscriptions and transactions (Prototype demo)." />
        <DataTable columns={paymentCols} data={paymentsData} searchable searchPlaceholder="Filter payments & invoices..." />
      </div>
    );
  }

  // 4. Reports & Settings
  if (path.includes('/reports') || path.includes('/settings')) {
    return (
      <div className="space-y-6">
        <SectionHeading tag="Configuration" title="System Settings & Analytics Reports" />
        <div className="bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-xl space-y-4 text-xs relative overflow-hidden text-white">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          <FormField label="Platform Name" defaultValue="Brainstorm Academy" />
          <FormField label="Support Email" defaultValue="hello@brainstormacademy.in" />
          <FormField label="Platform Tagline" defaultValue="Learn Today. Lead Tomorrow." />
          <div className="pt-2">
            <Button onClick={() => alert('Platform settings saved in visual state.')} variant="primary" size="sm">
              Save Platform Configuration
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Default Fallback for all other routes (tests, materials, lessons, doubts, notifications)
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <SectionHeading tag="Administrative Desk" title="Management Console" />
        <Button onClick={() => openModal('Add Record')} variant="primary" size="sm">
          <Plus className="w-4 h-4" /> Add Record
        </Button>
      </div>
      <div className="p-8 bg-[#0E121A]/85 backdrop-blur-2xl rounded-3xl border border-white/10 text-center shadow-2xl text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
        <Layers className="w-12 h-12 text-[#CCFF00] mx-auto mb-3" />
        <h3 className="font-display font-bold text-base text-white">Platform Component Active</h3>
        <p className="text-xs font-mono text-slate-400 max-w-md mx-auto mt-1 mb-4">
          All administrative records and configurations are ready for full Firebase integration.
        </p>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        <div className="space-y-4 text-xs font-mono">
          <FormField label="Record Name" placeholder="e.g. New Examination" />
          <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">Submit</Button>
        </div>
      </Modal>
    </div>
  );
}
