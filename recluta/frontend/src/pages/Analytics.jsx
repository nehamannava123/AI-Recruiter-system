import React, { useEffect, useState } from 'react'
import SmallTrendChart from '../components/SmallTrendChart'

export default function Analytics() {
  const [trend, setTrend] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetch('/api/analysis/trends?metric=overall_score&limit=100')
      .then((r) => r.json())
      .then((data) => {
        setTrend(data.moving_average || data.values || [])
      })
    fetch('/api/analysis/history?limit=20')
      .then((r) => r.json())
      .then((data) => setHistory(data.rows || []))
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <div className="bg-[#0E1424] p-4 rounded mb-6">
        <h2 className="text-lg mb-2">Overall Score Trend</h2>
        <div style={{ width: '100%', height: 200 }}>
          <SmallTrendChart values={trend} />
        </div>
      </div>

      <div className="bg-[#0E1424] p-4 rounded">
        <h2 className="text-lg mb-2">Recent Sessions</h2>
        <ul>
          {history.map((h, i) => (
            <li key={i} className="py-2 border-b border-[#1C2840]">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{h.role} · {h.level}</div>
                  <div className="text-sm text-[#8896B3]">{h.question}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold">{Math.round(h.overall_score || h.answer_score || 0)}%</div>
                  <div className="text-sm text-[#8896B3]">{h._saved_at || h.timestamp || ''}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
