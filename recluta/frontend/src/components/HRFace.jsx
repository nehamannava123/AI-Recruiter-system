export default function HRFace({ isSpeaking = false, question = '', status = 'Waiting...' }) {
  return (
    <div className="flex h-full flex-col rounded-[32px] border border-border bg-[#07101c] p-6 shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.26em] text-secondary">AI Interviewer</p>
          <h2 className="mt-2 text-3xl font-semibold text-primary">Priya</h2>
          <p className="text-sm text-secondary">HR hiring manager persona</p>
        </div>
        <div className="rounded-full border border-accent/20 bg-[#081622] px-4 py-2 text-sm text-accent">
          {isSpeaking ? 'Speaking' : 'Listening'}
        </div>
      </div>

      <div className="relative mt-8 flex flex-1 items-center justify-center rounded-[32px] border border-border bg-[#0b1320] p-6">
        <div className="relative flex h-[320px] w-[320px] items-center justify-center rounded-full bg-gradient-to-br from-[#0e1728] to-[#08101d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05)]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_20%_20%,rgba(79,217,197,0.18),transparent_18%),radial-gradient(circle_at_80%_25%,rgba(124,184,255,0.12),transparent_22%)]" />
          <div className="relative flex h-full w-full flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-6">
              <div className="h-16 w-16 rounded-full bg-[#101929] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
              <div className="h-16 w-16 rounded-full bg-[#101929] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]" />
            </div>
            <div className="relative h-24 w-52 overflow-hidden rounded-full bg-[#0b1525] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]">
              <div
                className={`absolute left-1/2 top-1/2 h-10 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent transition-all duration-200 ${
                  isSpeaking ? 'scale-x-100' : 'scale-x-60'
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-[28px] border border-border bg-[#09101b] p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-secondary">Current prompt</p>
        <p className="mt-4 min-h-[76px] text-sm leading-7 text-primary">{question || 'Preparing the next interview question...'}</p>
      </div>

      <div className="mt-5 rounded-[28px] border border-border bg-[#08101d] p-4 text-sm text-secondary">
        <p className="text-xs uppercase tracking-[0.24em] text-secondary">Interview status</p>
        <p className="mt-3 text-base text-primary">{status}</p>
      </div>
    </div>
  );
}
