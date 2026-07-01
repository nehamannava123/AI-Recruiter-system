import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Brain,
  MessageCircle,
  Eye,
  Briefcase,
  Star,
  Gauge,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import RadarChart from '../components/RadarChart';
import ScoreCard from '../components/ScoreCard';
import ReportDownload from '../components/ReportDownload';

const SAMPLE_DATA = {
  sessionId: 'sample',
  role: 'Software Engineer',
  overallScore: 82,
  metrics: {
    confidence: 78,
    communication: 85,
    eye_contact: 72,
    professionalism: 80,
    answer_quality: 88,
    pacing: 76,
    clarity: 83,
    engagement: 79,
  },
  radarScores: {
    confidence: 78,
    eyeContact: 72,
    pace: 76,
    clarity: 83,
    engagement: 79,
    answerQuality: 88,
  },
  qaPairs: [
    {
      question: 'Tell me about yourself and why you\'re interested in this role.',
      answer: 'I\'m a software engineer with three years of experience building scalable web applications. I\'m passionate about clean architecture and user-centered design, which aligns perfectly with this role.',
      answer_score: 85,
      star_compliance: true,
      feedback: 'Strong opening. Consider adding a specific achievement to make it more memorable.',
    },
    {
      question: 'Describe a time you worked effectively in a team.',
      answer: 'In my last project, our team had to deliver a major feature under a tight deadline. I took initiative to organize daily standups and broke the work into parallel tracks, which helped us ship two days early.',
      answer_score: 90,
      star_compliance: true,
      feedback: 'Excellent STAR structure. The quantifiable result strengthens your answer.',
    },
    {
      question: 'Tell me about a challenge you faced at work and how you handled it.',
      answer: 'We had a production outage caused by a database migration. I stayed calm, rolled back the migration, and then worked with the team to create a safer deployment process with automated rollback.',
      answer_score: 82,
      star_compliance: true,
      feedback: 'Good problem-solving narrative. Mention the business impact of the outage for extra depth.',
    },
  ],
};

const METRIC_CARDS = [
  {
    key: 'confidence',
    title: 'Confidence',
    icon: Brain,
    feedback: 'Maintain steady eye contact and reduce filler words to boost confidence.',
  },
  {
    key: 'communication',
    title: 'Communication',
    icon: MessageCircle,
    feedback: 'Clear articulation with good vocabulary range. Keep answers concise.',
  },
  {
    key: 'eye_contact',
    title: 'Eye Contact',
    icon: Eye,
    feedback: 'Look at the camera lens, not the screen, to simulate direct eye contact.',
  },
  {
    key: 'professionalism',
    title: 'Professionalism',
    icon: Briefcase,
    feedback: 'Professional tone maintained throughout. Good posture and composure.',
  },
  {
    key: 'answer_quality',
    title: 'Answer Quality',
    icon: Star,
    feedback: 'Answers were relevant and structured. Use STAR method consistently.',
  },
  {
    key: 'pacing',
    title: 'Pacing',
    icon: Gauge,
    feedback: 'Speaking pace is near optimal. Avoid rushing through key points.',
  },
];

function AccordionItem({ qa, index }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors duration-200 hover:bg-[#111b2f]"
      >
        <div className="flex-1 min-w-0 pr-4">
          <span className="text-xs font-mono text-secondary">Question {index + 1}</span>
          <p className="mt-1 font-display text-sm text-primary line-clamp-1">{qa.question}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-display text-lg font-bold text-accent">{qa.answer_score}</span>
          {open ? <ChevronUp size={18} className="text-secondary" /> : <ChevronDown size={18} className="text-secondary" />}
        </div>
      </button>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="border-t border-border px-5 pb-5"
        >
          <p className="mt-4 text-xs text-secondary">Your Answer</p>
          <p className="mt-1 text-sm text-primary">{qa.answer}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
              Score: {qa.answer_score}/100
            </span>
            <span
              className={`rounded-full px-3 py-1 text-xs ${
                qa.star_compliance
                  ? 'bg-accent/10 text-accent'
                  : 'bg-[#7a3f0f]/10 text-[#f5b25a]'
              }`}
            >
              {qa.star_compliance ? '✓ STAR Compliant' : '✗ Improve STAR Structure'}
            </span>
          </div>

          <p className="mt-3 text-xs text-[#f5b25a] italic">{qa.feedback}</p>
        </motion.div>
      )}
    </div>
  );
}

export default function Results() {
  const [data, setData] = useState(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('recluta_results');
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      setData(SAMPLE_DATA);
    }
  }, []);

  useEffect(() => {
    if (data) {
      const timer = setTimeout(() => setAnimatedScore(data.overallScore), 300);
      return () => clearTimeout(timer);
    }
  }, [data]);

  const improvementPoints = useMemo(() => {
    if (!data) return [];
    const points = [];

    if (data.metrics.filler_count && data.metrics.filler_count > 5) {
      points.push('Reduce filler words like “um” or “uh” to make your responses feel more deliberate.');
    }
    if (data.metrics.eye_contact < 70) {
      points.push('Increase eye contact with the camera to appear more engaged and confident.');
    }
    if (data.metrics.pacing < 70) {
      points.push('Slow your speaking pace slightly so each point lands clearly.');
    }
    if (data.metrics.answer_quality < 80) {
      points.push('Add one concrete result to each story to make your answers more memorable.');
    }
    if (!points.length) {
      points.push('Your session is strong. Maintain your current structure and clarity.');
    }

    return points.slice(0, 4);
  }, [data]);

  const strengths = useMemo(() => {
    if (!data) return [];
    const points = [];

    if (data.metrics.communication >= 80) {
      points.push('Your communication is clear and focused, which keeps the interviewer engaged.');
    }
    if (data.metrics.answer_quality >= 80) {
      points.push('Answers are structured and relevant, showing strong problem-solving awareness.');
    }
    if (data.metrics.confidence >= 75) {
      points.push('Your tone and delivery convey confidence in your skills.');
    }
    if (data.metrics.professionalism >= 75) {
      points.push('You maintain a polished tone and steady composure throughout the session.');
    }
    if (!points.length) {
      points.push('Good effort—focus on making your delivery more concise and intentional.');
    }

    return points.slice(0, 4);
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void">
        <div className="space-y-3">
          <div className="skeleton h-8 w-48" />
          <div className="skeleton h-32 w-64" />
        </div>
      </div>
    );
  }

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="min-h-screen bg-void">
      <Navbar />

      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
        <section className="grid gap-6 xl:grid-cols-[0.9fr_0.5fr]">
          <div className="card p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-secondary">Final Report</p>
                <h1 className="text-4xl font-semibold text-primary">Interview feedback</h1>
                <p className="max-w-2xl text-base text-secondary">A concise recap of your session with actionable strengths and improvements. Download the full PDF for a shareable review.</p>
              </div>
              <div className="relative flex h-44 w-44 items-center justify-center rounded-full border border-accent/20 bg-[#08121f] text-center">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                  <circle
                    cx="90"
                    cy="90"
                    r={radius}
                    fill="none"
                    stroke="var(--accent)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    transform="rotate(-90 90 90)"
                    style={{ transition: 'stroke-dashoffset 1.5s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-display font-semibold text-accent">{animatedScore}</span>
                  <span className="text-sm text-secondary">overall</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card grid gap-4 p-8">
            <div className="rounded-[28px] border border-border/80 bg-[#0c1220] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-secondary">Session details</p>
              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between rounded-[20px] border border-border/70 bg-[#08101b] px-4 py-3">
                  <span className="text-sm text-secondary">Role</span>
                  <span className="font-medium text-primary">{data.role}</span>
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-border/70 bg-[#08101b] px-4 py-3">
                  <span className="text-sm text-secondary">Questions</span>
                  <span className="font-medium text-primary">{data.qaPairs.length}</span>
                </div>
                <div className="flex items-center justify-between rounded-[20px] border border-border/70 bg-[#08101b] px-4 py-3">
                  <span className="text-sm text-secondary">Report</span>
                  <span className="font-medium text-primary">PDF ready</span>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/80 bg-[#0c1220] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-secondary">What you did well</p>
              <ul className="mt-4 space-y-3 text-sm text-secondary">
                {strengths.map((point, index) => (
                  <li key={index} className="rounded-[18px] border border-border/70 bg-[#08101d] px-4 py-3">
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_0.6fr]">
          <div className="grid gap-6">
            <div className="card p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-secondary">Key improvement areas</p>
                  <h2 className="mt-2 text-2xl font-semibold text-primary">Refine your approach</h2>
                </div>
                <div className="rounded-full border border-accent/20 bg-[#081622] px-3 py-2 text-xs text-accent">Specific</div>
              </div>

              <ul className="mt-6 space-y-4 text-sm text-secondary">
                {improvementPoints.map((point, index) => (
                  <li key={index} className="rounded-[20px] border border-border/70 bg-[#07111d] px-5 py-4">
                    <span className="font-semibold text-primary">{index + 1}.</span> {point}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card grid gap-4 p-8">
              <div className="flex items-center gap-3 text-secondary">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#07111d] text-accent">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em]">Metric summary</p>
                  <p className="text-base text-primary">A quick view of your scoring across the interview.</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {METRIC_CARDS.slice(0, 4).map((card) => (
                  <div key={card.key} className="rounded-[20px] border border-border/70 bg-[#08121e] p-4">
                    <p className="text-sm text-secondary">{card.title}</p>
                    <p className="mt-2 text-xl font-semibold text-primary">{data.metrics[card.key] || 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="card p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-secondary">Detailed breakdown</p>
              <div className="mt-6 grid gap-3">
                {data.qaPairs.map((qa, i) => (
                  <div key={i} className="rounded-[20px] border border-border/70 bg-[#08101d] p-4">
                    <p className="text-sm font-semibold text-primary line-clamp-1">Question {i + 1}</p>
                    <p className="mt-2 text-sm text-secondary line-clamp-2">{qa.question}</p>
                    <p className="mt-3 text-xs text-[#f5b25a]">{qa.feedback}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-8">
              <p className="text-xs uppercase tracking-[0.24em] text-secondary">Export</p>
              <div className="mt-4">
                <ReportDownload reportData={data} className="w-full" />
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-primary">Question Breakdown</h2>
          <div className="mt-6 space-y-3">
            {(data.qaPairs || []).map((qa, i) => (
              <AccordionItem key={i} qa={qa} index={i} />
            ))}
          </div>
        </section>

        <section className="mt-12 flex flex-col items-center pb-12">
          <Link to="/setup" className="btn-secondary mt-6">
            Practice Again →
          </Link>
        </section>
      </div>
    </div>
  );
}
