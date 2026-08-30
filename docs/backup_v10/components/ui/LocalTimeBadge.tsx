'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getLocalTime } from '@/lib/utils';

interface LocalTimeBadgeProps {
  timezone?: string;
  showIcon?: boolean;
}

export function LocalTimeBadge({ timezone = 'Asia/Kolkata', showIcon = true }: LocalTimeBadgeProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    setTimeStr(getLocalTime(timezone));
    const interval = setInterval(() => {
      setTimeStr(getLocalTime(timezone));
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  if (!timeStr) return null;

  return (
    <span className="local-time-badge" title={`Live local time in ${timezone}`}>
      {showIcon && <Clock size={11} style={{ verticalAlign: '-1px' }} />}
      {timeStr}
    </span>
  );
}
