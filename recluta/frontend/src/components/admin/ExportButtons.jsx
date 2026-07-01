export default function ExportButtons({ interview }) {
  const handlePrint = () => window.print();

  const handleCsv = () => {
    const rows = [
      ['Candidate Name', 'Email', 'Role', 'Overall Score', 'Status'],
      [interview?.candidate_name || '', interview?.email || '', interview?.role || '', interview?.overall_score || '', interview?.status || ''],
    ];
    const csv = rows.map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-${interview?.id || 'report'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <button className="btn-secondary" type="button" onClick={handlePrint}>Print Report</button>
      <button className="btn-secondary" type="button" onClick={handleCsv}>Download CSV</button>
    </div>
  );
}
