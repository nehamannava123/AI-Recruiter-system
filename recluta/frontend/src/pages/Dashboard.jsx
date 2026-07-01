import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

function BriefcaseIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 7.5A2.5 2.5 0 0 1 9.5 5h5A2.5 2.5 0 0 1 17 7.5V8h1.5A2.5 2.5 0 0 1 21 10.5v6A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-6A2.5 2.5 0 0 1 5.5 8H7v-.5Z" />
      <path d="M9.5 8V6.5a1.5 1.5 0 0 1 3 0V8" />
    </svg>
  );
}

function VideoCameraIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="7" width="12" height="10" rx="2.5" />
      <path d="m15 10 4-2.5v9L15 14" />
    </svg>
  );
}

const options = [
  {
    title: 'Resume Evaluation',
    description: 'AI-powered resume screening and scoring.',
    href: '/frontend',
    icon: BriefcaseIcon,
    accent: 'from-[#4fd9c5] to-[#3f8cff]',
  },
  {
    title: 'Interview Evaluation',
    description: 'AI-driven face tracking, speech analysis, and reporting.',
    href: '/recluta/frontend',
    icon: VideoCameraIcon,
    accent: 'from-[#8b5cf6] to-[#22d3ee]',
  },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-void px-4 py-6 text-primary sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col rounded-[36px] border border-white/10 bg-[rgba(8,13,24,0.88)] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.24)] backdrop-blur xl:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-2 pb-5 sm:px-4">
          <div className="text-xl font-semibold tracking-tight text-primary">Recruiter Hub</div>
          <div className="rounded-full border border-accent/20 bg-accent/10 px-3 py-2 text-sm text-accent">
            noureenandteam
          </div>
        </header>

        <main className="flex-1 px-2 py-8 sm:px-4 sm:py-10 lg:px-6 lg:py-12">
          <div className="mb-8 text-center">
            <p className="text-sm uppercase tracking-[0.32em] text-secondary">Choose your path</p>
            <h1 className="mt-3 text-3xl font-semibold text-primary sm:text-4xl lg:text-5xl">
              Select Evaluation Mode
            </h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {options.map((option, index) => {
              const Icon = option.icon;
              return (
                <motion.div
                  key={option.title}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: index * 0.08 }}
                  whileHover={{ scale: 1.02, y: -4, boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)' }}
                  className="group"
                >
                  <Link
                    to={option.href}
                    className="flex h-full flex-col justify-between rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(17,24,39,0.96),rgba(9,14,28,0.96))] p-6 transition-all duration-200 hover:border-accent/30"
                  >
                    <div>
                      <div className={`mb-5 inline-flex rounded-2xl bg-gradient-to-br ${option.accent} p-3 text-white`}>
                        <Icon className="h-7 w-7" />
                      </div>
                      <h2 className="text-2xl font-semibold text-primary">{option.title}</h2>
                      <p className="mt-3 text-sm leading-7 text-secondary">{option.description}</p>
                    </div>

                    <div className="mt-8 flex items-center justify-between text-sm font-medium text-accent">
                      <span>Open module</span>
                      <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
