export default function DashboardCards({ stats }) {
  const cards = [
    { label: 'Total Interviews', value: stats?.totalInterviews ?? 0 },
    { label: 'Completed Interviews', value: stats?.completedInterviews ?? 0 },
    { label: 'Average Score', value: `${stats?.averageScore ?? 0}` },
    { label: 'Today\'s Interviews', value: stats?.todayInterviews ?? 0 },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-[28px] border border-border bg-[#08111e] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
          <p className="text-sm text-secondary">{card.label}</p>
          <p className="mt-3 text-3xl font-semibold text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
