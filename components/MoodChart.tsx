import React from 'react';

interface MoodChartProps {
  data: { timestamp: number; score: number }[];
}

export const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
  if (data.length < 2) return null;

  const width = 500;
  const height = 200;
  const padding = 30;

  const minX = data[0].timestamp;
  const maxX = data[data.length - 1].timestamp;
  const minY = 1; // Mood score is 1-10
  const maxY = 10;

  const getX = (timestamp: number) => {
    if (maxX === minX) return padding;
    return ((timestamp - minX) / (maxX - minX)) * (width - padding * 2) + padding;
  };

  const getY = (score: number) => {
    return height - (((score - minY) / (maxY - minY)) * (height - padding * 2) + padding);
  };

  const path = data.map((point, i) => {
    const x = getX(point.timestamp);
    const y = getY(point.score);
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return (
    <div className="w-full h-full flex justify-center items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
            {/* Y-Axis labels and grid lines */}
            {[1, 5, 10].map(score => (
                <g key={score}>
                    <line
                        x1={padding} y1={getY(score)}
                        x2={width - padding} y2={getY(score)}
                        stroke="#475569" strokeWidth="1"
                        strokeDasharray="2,2"
                    />
                    <text
                        x={padding - 8} y={getY(score)}
                        textAnchor="end"
                        alignmentBaseline="middle"
                        fontSize="10"
                        fill="#94a3b8"
                    >
                        {score}
                    </text>
                </g>
            ))}

            {/* Path */}
            <path d={path} stroke="#a78bfa" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

            {/* Points */}
            {data.map((point, i) => (
                <circle
                    key={i}
                    cx={getX(point.timestamp)}
                    cy={getY(point.score)}
                    r="4"
                    fill="#1e293b"
                    stroke="#a78bfa"
                    strokeWidth="2"
                />
            ))}
            
            {/* X-Axis labels */}
             <g>
                <text 
                    x={getX(data[0].timestamp)} 
                    y={height - 5}
                    textAnchor="start"
                    fontSize="10"
                    fill="#94a3b8"
                >
                    {formatDate(data[0].timestamp)}
                </text>
                <text 
                    x={getX(data[data.length - 1].timestamp)} 
                    y={height - 5}
                    textAnchor="end"
                    fontSize="10"
                    fill="#94a3b8"
                >
                    {formatDate(data[data.length - 1].timestamp)}
                </text>
             </g>

        </svg>
    </div>
  );
};