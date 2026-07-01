import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import DashboardCards from '../../components/admin/DashboardCards';
import ScoreCards from '../../components/admin/ScoreCards';
import { getDashboardStats } from '../../lib/adminApi';

export default function Dashboard() {
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Admin Panel</p>
            <h1 className="mt-2 text-4xl font-semibold">HR Dashboard</h1>
          </div>
          <div className="flex gap-3">
            <Link className="btn-secondary" to="/admin/candidates">View Candidates</Link>
            <Link className="btn-primary" to="/admin/analytics">View Analytics</Link>
          </div>
        </div>

        <div className="mt-8">
          <DashboardCards stats={stats} />
        </div>

        <div className="mt-8">
          <ScoreCards stats={stats} />
        </div>

        <div className="mt-8 rounded-[32px] border border-border bg-[#08111e] p-6">
          <h2 className="text-2xl font-semibold">Recent Interviews</h2>
          <div className="mt-6 space-y-3">
            {(stats?.interviews || []).slice(0, 6).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-[20px] border border-border/70 bg-[#07121d] px-4 py-3">
                <div>
                  <p className="font-medium text-primary">{item.candidate_name}</p>
                  <p className="text-sm text-secondary">{item.role}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-accent">{item.overall_score}</p>
                  <p className="text-sm text-secondary">{new Date(item.interview_date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
