import { Link } from 'react-router-dom';

export default function CandidateTable({ interviews, onSort }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-border bg-[#08111e]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#0b1524] text-secondary">
            <tr>
              <th className="px-4 py-3">Candidate</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Experience</th>
              <th className="px-4 py-3">Interview Date</th>
              <th className="px-4 py-3">
                <button className="font-medium text-secondary" type="button" onClick={onSort}>Overall Score</button>
              </th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {interviews.map((interview) => (
              <tr key={interview.id} className="border-t border-border/70 text-primary">
                <td className="px-4 py-3">{interview.candidate_name}</td>
                <td className="px-4 py-3">{interview.email}</td>
                <td className="px-4 py-3">{interview.role}</td>
                <td className="px-4 py-3">{interview.experience}</td>
                <td className="px-4 py-3">{new Date(interview.interview_date).toLocaleDateString()}</td>
                <td className="px-4 py-3">{interview.overall_score}</td>
                <td className="px-4 py-3"><span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs text-accent">{interview.status}</span></td>
                <td className="px-4 py-3"><Link className="text-aurora" to={`/admin/interview/${interview.id}`}>View</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
