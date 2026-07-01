import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import { getDashboardStats } from '../../lib/adminApi';

export default function Analytics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await getDashboardStats();
      setStats(data);
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-void text-primary">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-secondary">Admin Panel</p>
          <h1 className="mt-2 text-4xl font-semibold">Analytics</h1>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <div className="rounded-[28px] border border-border bg-[#08111e] p-5"><p className="text-sm text-secondary">Completed Interviews</p><p className="mt-2 text-3xl font-semibold text-primary">{stats?.completedInterviews ?? 0}</p></div>
          <div className="rounded-[28px] border border-border bg-[#08111e] p-5"><p className="text-sm text-secondary">Average Score</p><p className="mt-2 text-3xl font-semibold text-primary">{stats?.averageScore ?? 0}</p></div>
          <div className="rounded-[28px] border border-border bg-[#08111e] p-5"><p className="text-sm text-secondary">Average Technical</p><p className="mt-2 text-3xl font-semibold text-primary">{stats?.averageTechnicalScore ?? 0}</p></div>
          <div className="rounded-[28px] border border-border bg-[#08111e] p-5"><p className="text-sm text-secondary">Average Confidence</p><p className="mt-2 text-3xl font-semibold text-primary">{stats?.averageConfidence ?? 0}</p></div>
        </div>

        <div className="mt-8">
          <AnalyticsCharts interviews={stats?.interviews || []} />
        </div>
      </div>
    </div>
  );
}
