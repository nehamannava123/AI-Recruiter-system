export default function TranscriptViewer({ transcript }) {
  return (
    <div className="rounded-[28px] border border-border bg-[#08111e] p-6">
      <h3 className="text-xl font-semibold text-primary">Transcript</h3>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-secondary">{transcript || 'No transcript available.'}</p>
    </div>
  );
}
