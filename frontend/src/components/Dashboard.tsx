import React from 'react';

const Dashboard: React.FC = () => {
  const cards = [
    { value: '20', label: '管段', color: 'var(--ac)' },
    { value: '15', label: '检查井', color: 'var(--gn)' },
    { value: '15%', label: '缺陷率', color: 'var(--rd)' },
    { value: '3', label: '今日检测', color: 'var(--yw)' },
  ];

  return (
    <div className="dash">
      {cards.map((card) => (
        <div className="dc" key={card.label}>
          <div className="n" style={{ color: card.color }}>{card.value}</div>
          <div className="l">{card.label}</div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
