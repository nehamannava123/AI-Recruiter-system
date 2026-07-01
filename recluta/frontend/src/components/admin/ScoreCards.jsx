export default function ScoreCards({ stats }) {
  const items = [
    { label: 'Average Technical Score', value: stats?.averageTechnicalScore ?? 0 },
    { label: 'Average Communication Score', value: stats?.averageCommunicationScore ?? 0 },
    { label: 'Average Confidence', value: stats?.averageConfidence ?? 0 },
    { label: 'Average Eye Contact', value: stats?.averageEyeContact ?? 0 },
    { label: 'Average Engagement', value: stats?.averageEngagement ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-[24px] border border-border bg-[#07121d] p-4">
          <p className="text-sm text-secondary">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold text-primary">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
