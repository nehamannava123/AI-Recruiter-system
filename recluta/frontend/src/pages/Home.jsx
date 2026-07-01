import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, Eye, FileText, ShieldCheck, Sparkles } from 'lucide-react';
import Navbar from '../components/Navbar';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
};

const features = [
  {
    icon: Mic,
    title: 'Adaptive Interview Flow',
    description: 'AI interviewer adjusts questions to your role and experience level.',
  },
  {
    icon: Eye,
    title: 'Live Performance Signals',
    description: 'See real-time feedback on eye contact, pacing, and confidence.',
  },
  {
    icon: FileText,
    title: 'Instant Report',
    description: 'Download a score-backed interview report after each simulation.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Practice',
    description: 'Private sessions with safe local recordings and secure profiles.',
  },
  {
    icon: Sparkles,
    title: 'Structured Preparation',
    description: 'Choose a role and seniority level to train for the right interview.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-void">
      <Navbar />

      <section className="relative overflow-hidden px-6 pt-24 pb-20 text-center lg:px-12">
        <div className="absolute left-1/2 top-10 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />
        <div className="mx-auto relative max-w-5xl">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="pill-badge mb-8 inline-flex items-center gap-2 border border-accent/20 bg-[#061116] px-4 py-2 text-xs text-accent"
          >
            AI-driven preparation for serious interviews
          </motion.div>

          <motion.h1
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="font-display text-5xl font-semibold leading-tight text-primary sm:text-6xl lg:text-7xl"
          >
            Your interview studio for practicing
            <span className="block text-accent mt-3">with real feedback before the day.</span>
          </motion.h1>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-secondary"
          >
            Select a role, train with a live AI interviewer, and get a polished results report with actionable improvement guidance.
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link to="/setup" className="btn-primary inline-flex items-center gap-2">
              Start the studio →
            </Link>
            <Link to="/results" className="btn-secondary">
              View sample report
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 lg:px-12">
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="card p-8">
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Why Recluta?</p>
            <h2 className="mt-4 text-3xl font-semibold text-primary">Practice with purpose, not guesswork.</h2>
            <p className="mt-4 text-base text-secondary">
              The AI interviewer learns your role, guides your answers, and scores your delivery in real time. Every session becomes clearer, faster, and more relevant.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-border/80 bg-[#08111e] p-5">
                <p className="text-sm text-secondary">Role-specific simulations</p>
                <p className="mt-3 text-xl font-semibold text-primary">Targeted mock interviews</p>
              </div>
              <div className="rounded-[24px] border border-border/80 bg-[#08111e] p-5">
                <p className="text-sm text-secondary">Score-backed insights</p>
                <p className="mt-3 text-xl font-semibold text-primary">Actionable feedback</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={4 + i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="card flex flex-col gap-4 p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#08131f] text-accent">
                  <feature.icon size={20} />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold text-primary">{feature.title}</h3>
                  <p className="mt-2 text-sm text-secondary">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
