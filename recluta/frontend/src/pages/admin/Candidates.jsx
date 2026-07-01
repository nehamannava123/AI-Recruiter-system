import { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import CandidateTable from '../../components/admin/CandidateTable';
import SearchFilters from '../../components/admin/SearchFilters';
import { getAllInterviews } from '../../lib/adminApi';

export default function Candidates() {
  const [interviews, setInterviews] = useState([]);
  const [filters, setFilters] = useState({ searchName: '', searchEmail: '', searchRole: '', date: '', status: '' });
  const [sortScore, setSortScore] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await getAllInterviews();
      setInterviews(data || []);
    }
    load();
  }, []);

  const filteredInterviews = useMemo(() => {
    const list = [...interviews].filter((item) => {
      const matchesName = item.candidate_name?.toLowerCase().includes(filters.searchName.toLowerCase());
      const matchesEmail = item.email?.toLowerCase().includes(filters.searchEmail.toLowerCase());
      const matchesRole = item.role?.toLowerCase().includes(filters.searchRole.toLowerCase());
      const matchesDate = filters.date ? new Date(item.interview_date).toISOString().startsWith(filters.date) : true;
      const matchesStatus = filters.status ? item.status === filters.status : true;
      return matchesName && matchesEmail && matchesRole && matchesDate && matchesStatus;
    });

    if (sortScore) {
      list.sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));
    }

    return list;
  }, [filters, interviews, sortScore]);

  return (
    <div className="min-h-screen bg-void text-primary">
      <Navbar />
      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-secondary">Admin Panel</p>
            <h1 className="mt-2 text-4xl font-semibold">Candidate Reports</h1>
          </div>
        </div>

        <div className="mt-8 rounded-[32px] border border-border bg-[#08111e] p-6">
          <SearchFilters filters={filters} onChange={(key, value) => setFilters((prev) => ({ ...prev, [key]: value }))} onClear={() => setFilters({ searchName: '', searchEmail: '', searchRole: '', date: '', status: '' })} />
          <div className="mt-6">
            <CandidateTable interviews={filteredInterviews} onSort={() => setSortScore((prev) => !prev)} />
          </div>
        </div>
      </div>
    </div>
  );
}
