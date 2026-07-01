import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#4fd9c5', '#7cb8ff', '#f5b25a'];

export default function AnalyticsCharts({ interviews }) {
  const trendData = (interviews || []).slice(0, 8).reverse().map((item) => ({
    name: item.candidate_name?.split(' ')[0] || 'Candidate',
    score: item.overall_score || 0,
  }));

  const technicalData = (interviews || []).map((item) => ({
    name: item.candidate_name?.split(' ')[0] || 'Candidate',
    score: item.technical_score || 0,
  }));

  const communicationData = (interviews || []).map((item) => ({
    name: item.candidate_name?.split(' ')[0] || 'Candidate',
    score: item.communication_score || 0,
  }));

  const confidenceData = (interviews || []).map((item) => ({
    name: item.candidate_name?.split(' ')[0] || 'Candidate',
    score: item.confidence_score || 0,
  }));

  const topCandidates = [...(interviews || [])].sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0)).slice(0, 5).map((item) => ({
    name: item.candidate_name,
    score: item.overall_score || 0,
  }));

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-[28px] border border-border bg-[#08111e] p-6">
        <h3 className="text-xl font-semibold text-primary">Overall Score Trend</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#8fa8c4" />
              <YAxis stroke="#8fa8c4" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#4fd9c5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-[28px] border border-border bg-[#08111e] p-6">
        <h3 className="text-xl font-semibold text-primary">Top Performing Candidates</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topCandidates}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#8fa8c4" />
              <YAxis stroke="#8fa8c4" />
              <Tooltip />
              <Bar dataKey="score" fill="#7cb8ff" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-[28px] border border-border bg-[#08111e] p-6">
        <h3 className="text-xl font-semibold text-primary">Technical Score Distribution</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={technicalData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#8fa8c4" />
              <YAxis stroke="#8fa8c4" />
              <Tooltip />
              <Bar dataKey="score" fill="#4fd9c5" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-[28px] border border-border bg-[#08111e] p-6">
        <h3 className="text-xl font-semibold text-primary">Communication Score Distribution</h3>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={communicationData}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="name" stroke="#8fa8c4" />
              <YAxis stroke="#8fa8c4" />
              <Tooltip />
              <Bar dataKey="score" fill="#f5b25a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
