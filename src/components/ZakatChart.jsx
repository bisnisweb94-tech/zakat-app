import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

function ZakatChart({ current, target, theme }) {
    const primaryColor = theme === 'light' ? '#0891b2' : '#8b5cf6';
    const emptyColor = theme === 'light' ? 'rgba(8, 145, 178, 0.15)' : 'rgba(139, 92, 246, 0.15)';

    const data = {
        labels: ['Tercapai', 'Belum'],
        datasets: [{
            data: [current, Math.max(target - current, 0)],
            backgroundColor: [primaryColor, emptyColor],
            borderWidth: 0,
            borderRadius: 15,
            cutout: '75%'
        }]
    };

    const options = {
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        },
        responsive: true,
        maintainAspectRatio: true,
        animation: { duration: 1000 }
    };

    return <Doughnut data={data} options={options} />;
}

export default ZakatChart;
