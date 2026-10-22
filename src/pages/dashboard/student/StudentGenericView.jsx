import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText, Calendar, BarChart3, HelpCircle, Bell, Settings,
  CheckCircle2, Plus, Send, AlertCircle, Sparkles
} from 'lucide-react';
import { SectionHeading, Button, Badge, StatCard } from '../../../components/UI';
import { FormField } from '../../../components/FormFields';

export default function StudentGenericView() {
  const location = useLocation();
  const path = location.pathname;

  const [doubtText, setDoubtText] = useState('');
  const [doubtSent, setDoubtSent] = useState(false);

  if (path.includes('/materials')) {
    return (
      <div className="space-y-6">
        <SectionHeading
          tag="Repository"
          title="Course Study Materials & Notes"
          subtitle="All downloadable PDF resources associated with your active subjects."
        />
        <div className="p-8 bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          <FileText className="w-12 h-12 text-[#CCFF00] mx-auto mb-3 opacity-90" />
          <h3 className="font-mono font-black text-lg text-white">Quick Access to Notes</h3>
          <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto mt-1 mb-5">
            Visit the central study repository to view and download all chapter notes and formula cards.
          </p>
          <Button to="/study-materials" variant="gold" size="sm" className="!bg-[#CCFF00] !text-black !font-mono !font-bold">
            Open Study Materials Library
          </Button>
        </div>
      </div>
    );
  }

  if (path.includes('/classes')) {
    return (
      <div className="space-y-6">
        <SectionHeading
          tag="Timetable"
          title="Scheduled Live Classes"
          subtitle="Interactive live lectures and weekly doubt clearing sessions."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
            <span className="text-xs font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-1 rounded-full uppercase">Tomorrow, 05:00 PM</span>
            <h3 className="font-mono font-black text-base text-white">Class 10 Mathematics Live Problem Solving</h3>
            <p className="text-xs text-slate-400 font-mono">Instructor: Senior Mathematics Faculty</p>
            <Button onClick={() => alert('Live class link will be active 10 minutes prior to session.')} variant="outlineWhite" size="xs" className="!font-mono">
              Join Live Classroom
            </Button>
          </div>
          <div className="p-6 bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#38BDF8] to-transparent" />
            <span className="text-xs font-mono font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-full uppercase">Thursday, 06:30 PM</span>
            <h3 className="font-mono font-black text-base text-white">Class 10 Science Practical Analysis</h3>
            <p className="text-xs text-slate-400 font-mono">Instructor: Science Faculty</p>
            <Button onClick={() => alert('Live class link will be active 10 minutes prior to session.')} variant="outlineWhite" size="xs" className="!font-mono">
              Join Live Classroom
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (path.includes('/doubts')) {
    return (
      <div className="space-y-6">
        <SectionHeading
          tag="Academic Assistance"
          title="Ask a Doubt"
          subtitle="Send direct conceptual queries to assigned educators."
        />
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-2xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          {doubtSent && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Doubt submitted to faculty! You will receive response notification here.</span>
            </div>
          )}
          <label className="block font-mono text-xs uppercase tracking-wider font-bold text-slate-300">
            Type your academic question / problem statement:
          </label>
          <textarea
            rows={4}
            value={doubtText}
            onChange={(e) => setDoubtText(e.target.value)}
            placeholder="Describe the problem, equation, or concept you want clarified..."
            className="w-full p-4 bg-[#060C17] border border-white/15 focus:border-[#CCFF00] focus:ring-1 focus:ring-[#CCFF00]/40 rounded-2xl text-sm font-mono text-white placeholder-slate-600 outline-none transition"
          />
          <button
            onClick={() => {
              if (doubtText.trim()) {
                setDoubtSent(true);
                setDoubtText('');
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-wider bg-[#CCFF00] text-black hover:bg-white transition-all shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Submit Doubt
          </button>
        </div>
      </div>
    );
  }

  if (path.includes('/notifications')) {
    return (
      <div className="space-y-6">
        <SectionHeading
          tag="Updates"
          title="Notification Center"
          subtitle="Recent announcements, test results, and class updates."
        />
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 divide-y divide-white/10 overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          {[
            { title: 'New Mock Test Added', desc: 'Mathematics Chapter 4 Test is now available for attempts.', time: '2 hours ago' },
            { title: 'Doubt Resolved', desc: 'Teacher answered your query on Quadratic Equations.', time: 'Yesterday' },
            { title: 'Study Notes Uploaded', desc: 'Class 10 Science formula sheet is ready for download.', time: '3 days ago' },
          ].map((n, i) => (
            <div key={i} className="p-5 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
              <div className="w-9 h-9 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/20 flex items-center justify-center flex-shrink-0 text-[#CCFF00]">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-sm text-white">{n.title}</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{n.desc}</p>
                <span className="text-[10px] text-slate-500 font-mono mt-1 block">{n.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (path.includes('/settings')) {
    return (
      <div className="space-y-6">
        <SectionHeading
          tag="Profile"
          title="Account Settings"
          subtitle="Manage your profile information and notification preferences."
        />
        <div className="bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-xl space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
          <FormField label="Full Name" defaultValue="Sample Student" />
          <FormField label="Email" defaultValue="student@example.com" disabled />
          <FormField label="Class / Goal" defaultValue="Class 10 CBSE" />
          <Button onClick={() => alert('Profile update will sync with Firebase.')} variant="gold" size="sm" className="!bg-[#CCFF00] !text-black !font-mono !font-bold">
            Save Preferences
          </Button>
        </div>
      </div>
    );
  }

  // Fallback / Progress
  return (
    <div className="space-y-6">
      <SectionHeading
        tag="Student Portal"
        title="Learning Progress & Milestones"
        subtitle="Detailed statistics on chapter completions and review schedules."
      />
      <div className="p-8 bg-[#0E121A]/85 backdrop-blur-xl rounded-3xl border border-white/10 text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#CCFF00] to-transparent" />
        <BarChart3 className="w-12 h-12 text-[#CCFF00] mx-auto mb-3 opacity-90" />
        <h3 className="font-mono font-black text-lg text-white">Comprehensive Progress Analytics</h3>
        <p className="text-xs text-slate-400 font-mono max-w-md mx-auto mt-1 mb-4">
          You have completed 68% of Mathematics, 45% of Science, and 82% of English. Keep consistent to achieve your academic goals!
        </p>
      </div>
    </div>
  );
}
