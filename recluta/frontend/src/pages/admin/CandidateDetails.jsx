import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import TranscriptViewer from '../../components/admin/TranscriptViewer';
import ExportButtons from '../../components/admin/ExportButtons';
import { getInterviewById } from '../../lib/adminApi';

export default function CandidateDetails() {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await getInterviewById(id);
      setInterview(data);
    }
    load();
  }, [id]);

  if (!interview) {
    return <div className="min-h-screen bg-void text-primary">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-void text-primary">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Admin Panel</p>
            <h1 className="mt-2 text-4xl font-semibold">{interview.candidate_name}</h1>
          </div>
          <ExportButtons interview={interview} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[32px] border border-border bg-[#08111e] p-6">
            <h2 className="text-2xl font-semibold">Candidate Information</h2>
            <div className="mt-6 space-y-3 text-sm text-secondary">
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">Email: {interview.email}</div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">Role: {interview.role}</div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">Experience: {interview.experience}</div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">Interview Date: {new Date(interview.interview_date).toLocaleString()}</div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">Duration: {interview.duration} min</div>
            </div>
          </div>

          <div className="rounded-[32px] border border-border bg-[#08111e] p-6">
            <h2 className="text-2xl font-semibold">Interview Summary</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Overall Score</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.overall_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Technical Score</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.technical_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Communication Score</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.communication_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Confidence</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.confidence_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Grammar</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.grammar_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Fluency</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.fluency_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Eye Contact</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.eye_contact}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Smile Score</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.smile_score}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Engagement</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.engagement}</p></div>
              <div className="rounded-[20px] border border-border/70 bg-[#07121d] p-4"><p className="text-sm text-secondary">Filler Words</p><p className="mt-2 text-2xl font-semibold text-primary">{interview.filler_words}</p></div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-border bg-[#08111e] p-6">
            <h2 className="text-2xl font-semibold">Resume Summary</h2>
            <p className="mt-4 text-sm leading-7 text-secondary">{interview.resume_summary || 'No resume summary available.'}</p>
          </div>
          <div className="rounded-[32px] border border-border bg-[#08111e] p-6">
            <h2 className="text-2xl font-semibold">AI Feedback</h2>
            <p className="mt-4 text-sm leading-7 text-secondary">{interview.transcript ? 'Feedback available from the candidate report.' : 'No feedback recorded.'}</p>
          </div>
        </div>

        <div className="mt-8">
          <TranscriptViewer transcript={interview.transcript} />
        </div>
      </div>
    </div>
  );
}
