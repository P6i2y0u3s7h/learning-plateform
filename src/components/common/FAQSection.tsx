import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FAQItem {
  id: string;
  number: string;
  category: 'all' | 'school' | 'competitive' | 'entrance' | 'platform';
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    id: 'f1',
    number: '01',
    category: 'school',
    question: 'Are School Courses aligned with the official NCERT syllabus?',
    answer:
      'Yes, absolutely. All our School Courses for Classes 6 through 12 strictly adhere to the latest NCERT and CBSE curriculum guidelines. Each course includes chapter-wise concept lectures, textbook solutions, exemplar exercises, and board exam revision sheets.',
  },
  {
    id: 'f2',
    number: '02',
    category: 'competitive',
    question: 'Which competitive exams does Brainstorm Academy cover?',
    answer:
      'We provide dedicated, expert-curated preparation modules for BPSC TRE (Teacher Recruitment Examination), UP Super TET, BSSC (CGL & Inter Level), and Bihar SI (Daroga). The content covers complete General Studies, Hindi, English, Mathematics, Reasoning, and specialized subject pedagogy.',
  },
  {
    id: 'f3',
    number: '03',
    category: 'entrance',
    question: 'How do you prepare students for AMU and Jamia Millia Islamia entrance exams?',
    answer:
      'Our entrance preparation programs for Aligarh Muslim University (AMU) and Jamia Millia Islamia (JMI) cover Class 6, Class 9, Class 11 (Science, Commerce, Arts), and Diploma Engineering. We analyze the last 10 years of entrance question papers, negative marking schemes, and provide time-bound mock exams identical to the actual entrance pattern.',
  },
  {
    id: 'f4',
    number: '04',
    category: 'competitive',
    question: 'Does Brainstorm Academy provide bilingual study material and mock tests?',
    answer:
      'Yes. All competitive exam modules (BPSC TRE, UP Super TET, BSSC, Bihar SI) and school materials are provided in both Hindi and English mediums with bilingual explanations and downloadable PDF notes.',
  },
  {
    id: 'f5',
    number: '05',
    category: 'platform',
    question: 'Can I access lessons and test series on mobile devices?',
    answer:
      'Yes, Brainstorm Academy is fully responsive across mobile phones (320px+), tablets, laptops, and desktop computers. You can study on the go, practice full-length timed tests, and download lecture notes seamlessly on any device.',
  },
  {
    id: 'f6',
    number: '06',
    category: 'platform',
    question: 'How do mock tests and performance analytics work?',
    answer:
      'After finishing each mock test or quiz, you receive an instant diagnostic report breaking down your accuracy, time spent per question, subject-wise strengths, and areas needing improvement so you can focus your revision effectively.',
  },
];

export const FAQSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [openId, setOpenId] = useState<string | null>('f1');

  const filteredFaqs =
    activeCategory === 'all'
      ? FAQS
      : FAQS.filter((f) => f.category === activeCategory);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const categories = [
    { id: 'all', label: 'All Queries' },
    { id: 'school', label: 'School (6–12)' },
    { id: 'competitive', label: 'BPSC / TET / SI' },
    { id: 'entrance', label: 'AMU & Jamia' },
    { id: 'platform', label: 'CBT Test Engine' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Category Filter Pills in JoinScrub Pill Style */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'px-4 py-2 font-mono text-xs uppercase tracking-wider rounded-full transition-all cursor-pointer border',
              activeCategory === cat.id
                ? 'bg-white text-black border-white font-bold shadow-md'
                : 'bg-[#0E121A] text-slate-400 hover:text-white border-white/10 hover:border-white/20'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Accordion List with Scrub Dark Obsidian Styling */}
      <div className="border border-white/10 divide-y divide-white/10 rounded-2xl bg-[#0E121A] overflow-hidden">
        {filteredFaqs.map((faq) => {
          const isOpen = openId === faq.id;
          return (
            <div key={faq.id} className="transition-colors">
              <button
                type="button"
                onClick={() => toggle(faq.id)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-[#CCFF00] font-bold">
                    {faq.number}
                  </span>
                  <span className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-tight">
                    {faq.question}
                  </span>
                </div>
                <div className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center flex-shrink-0 text-slate-300 bg-white/5">
                  {isOpen ? <Minus className="w-3.5 h-3.5 text-[#CCFF00]" /> : <Plus className="w-3.5 h-3.5" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-black/20 font-sans">
                  <p className="pl-8">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FAQSection;
