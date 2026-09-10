import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, type = 'order' }) => {
  if (!status) return null;

  // Type can be 'order' or 'payment'
  const badgeClass = `status-badge ${type}-${status.toLowerCase().replace(/[\s-]/g, '')}`;
  const displayStatus = status.replace(/_/g, ' ');

  return (
    <span className={badgeClass}>
      {displayStatus}
    </span>
  );
};

export default StatusBadge;
