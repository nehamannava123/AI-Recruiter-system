import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { generateReport } from '../lib/api';

export default function ReportDownload({ reportData, className = '' }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        session_id: reportData.sessionId || '',
        role: reportData.role || 'Candidate',
        metrics: {
          confidence: reportData.metrics?.confidence || 0,
          communication: reportData.metrics?.communication || 0,
          eye_contact: reportData.metrics?.eye_contact || 0,
          professionalism: reportData.metrics?.professionalism || 0,
          answer_quality: reportData.metrics?.answer_quality || 0,
          pacing: reportData.metrics?.pacing || 0,
          clarity: reportData.metrics?.clarity || 0,
          engagement: reportData.metrics?.engagement || 0,
        },
        qa_pairs: (reportData.qaPairs || []).map((qa) => ({
          question: qa.question,
          answer: qa.answer,
          answer_score: qa.answer_score,
          star_compliance: qa.star_compliance,
          feedback: qa.feedback,
        })),
      };

      const blob = await generateReport(payload);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recluta-interview-report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="btn-primary flex items-center justify-center gap-3 px-10 py-4 text-lg disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Generating PDF...
          </>
        ) : (
          <>
            <Download size={20} />
            Download Full Report (PDF)
          </>
        )}
      </button>
      {error && (
        <p className="mt-3 text-center text-sm text-warn">{error}</p>
      )}
    </div>
  );
}
