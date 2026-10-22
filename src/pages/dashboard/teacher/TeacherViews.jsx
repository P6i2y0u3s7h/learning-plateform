import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen, FileText, PlayCircle, ClipboardCheck, ClipboardList,
  MessageSquare, BarChart3, Plus, Search, Trash2, Edit2
} from 'lucide-react';
import { SectionHeading, Button, Badge } from '../../../components/UI';
import DataTable from '../../../components/DataTable';
import Modal from '../../../components/Modal';
import { FormField, SelectField } from '../../../components/FormFields';
import { TEACHER_COURSES, TEACHER_DOUBTS } from '../../../data/sampleData';

export default function TeacherViews() {
  const location = useLocation();
  const path = location.pathname;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');

  const openActionModal = (title) => {
    setModalTitle(title);
    setIsModalOpen(true);
  };

  if (path.includes('/materials')) {
    const materialCols = [
      { header: 'Document Title', accessor: 'title', sortable: true },
      { header: 'Subject', accessor: 'subject' },
      { header: 'Class', accessor: 'class' },
      { header: 'Type', accessor: 'type' },
      {
        header: 'Actions',
        accessor: 'id',
        render: () => (
          <div className="flex gap-2">
            <button className="text-gray-400 hover:text-[#2457A7]"><Edit2 className="w-3.5 h-3.5" /></button>
            <button className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        )
      }
    ];

    const sampleMats = [
      { id: '1', title: 'Quadratic Equations Formula Sheet', subject: 'Mathematics', class: 'Class 10', type: 'Formula Sheet' },
      { id: '2', title: 'Triangles Geometry Theorems Notes', subject: 'Mathematics', class: 'Class 10', type: 'Revision Notes' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeading tag="Curriculum Repository" title="Teacher Study Materials" />
          <Button onClick={() => openActionModal('Upload New Study Document')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Upload Material
          </Button>
        </div>
        <DataTable columns={materialCols} data={sampleMats} searchable searchPlaceholder="Filter materials..." />
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Material Title" placeholder="e.g. Chapter 4 Key Theorems" />
            <SelectField label="Class" options={['Class 9', 'Class 10', 'Class 11', 'Class 12']} />
            <FormField label="Document File (PDF)" type="file" />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">
              Confirm Upload
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (path.includes('/lessons')) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeading tag="Lesson Architecture" title="Manage Lessons & Lectures" />
          <Button onClick={() => openActionModal('Publish New Lesson')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Add Lesson
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Lesson 1: Introduction to Polynomials', 'Lesson 2: Zeroes of Polynomials', 'Lesson 3: Relationship between Zeroes & Coefficients'].map((item, idx) => (
            <div key={idx} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-5 h-5 text-[#2457A7]" />
                <div>
                  <h4 className="font-bold text-sm text-[#172033]">{item}</h4>
                  <p className="text-xs text-[#6B7280]">Class 10 Mathematics • 35 Mins</p>
                </div>
              </div>
              <Badge color="#10B981">Published</Badge>
            </div>
          ))}
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Lesson Name" placeholder="e.g. 2.4 Division Algorithm" />
            <FormField label="Video URL" placeholder="https://..." />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">
              Save Lesson
            </Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (path.includes('/assignments')) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeading tag="Homework" title="Student Assignments" />
          <Button onClick={() => openActionModal('Create Assignment')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> New Assignment
          </Button>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-[#172033]">Assignment #4: Quadratic Word Problems</h4>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-semibold">Due in 3 days</span>
          </div>
          <p className="text-xs text-[#6B7280]">Target: Class 10 Batch A • 38 Submissions received / 42</p>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Assignment Title" />
            <FormField label="Due Date" type="date" />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">Create</Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (path.includes('/tests')) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <SectionHeading tag="Assessment" title="Test & Quiz Management" />
          <Button onClick={() => openActionModal('Schedule New Mock Test')} variant="primary" size="sm">
            <Plus className="w-4 h-4" /> Create Test
          </Button>
        </div>
        <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-bold text-sm text-[#172033]">Class 10 Unit Test 3: Coordinate Geometry</h4>
            <Badge color="#2457A7">Scheduled</Badge>
          </div>
          <p className="text-xs text-[#6B7280]">Date: Oct 28, 2026 • 25 Questions • 50 Marks</p>
        </div>
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
          <div className="space-y-4 text-xs">
            <FormField label="Test Name" />
            <FormField label="Time Limit (Minutes)" type="number" />
            <Button onClick={() => setIsModalOpen(false)} variant="primary" size="sm" className="w-full">Publish</Button>
          </div>
        </Modal>
      </div>
    );
  }

  if (path.includes('/performance')) {
    return (
      <div className="space-y-6">
        <SectionHeading tag="Evaluation" title="Student Performance Matrix" />
        <div className="p-8 bg-white rounded-3xl border border-gray-100 text-center">
          <BarChart3 className="w-12 h-12 text-[#10B981] mx-auto mb-3 opacity-80" />
          <h3 className="font-bold text-base text-[#172033]">Cohort Average: 79.4%</h3>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
            Top performing students and students requiring additional conceptual reinforcement are automatically cataloged.
          </p>
        </div>
      </div>
    );
  }

  // Fallback for courses/doubts/notifications/settings
  return (
    <div className="space-y-6">
      <SectionHeading tag="Teacher Portal" title="Assigned Courses Management" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TEACHER_COURSES.map(c => (
          <div key={c.id} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="font-bold text-base text-[#172033] mb-1">{c.title}</h4>
            <p className="text-xs text-[#6B7280]">{c.students} Students • {c.lessons} Lessons</p>
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
              <Badge color="#10B981">{c.status}</Badge>
              <Button to="/dashboard/teacher/lessons" variant="ghost" size="xs">Edit Syllabus</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
