import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function SmallTrendChart({ values = [], label = 'Score' }) {
  const data = {
    labels: values.map((_, i) => i + 1),
    datasets: [
      {
        label,
        data: values,
        borderColor: '#00FFA3',
        backgroundColor: 'rgba(0,255,163,0.12)',
        tension: 0.2,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { min: 0, max: 100 } },
  };

  return <Line data={data} options={options} />;
}
