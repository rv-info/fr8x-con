'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { getLocalTime } from '@/lib/utils';

interface LocalTimeBadgeProps {
  timezone?: string;
  showIcon?: boolean;
  boxFormat?: boolean;
}

export function LocalTimeBadge({
  timezone = 'Asia/Kolkata',
  showIcon = true,
  boxFormat = false,
}: LocalTimeBadgeProps) {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      try {
        const formatted = new Intl.DateTimeFormat('en-US', {
          timeZone: timezone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }).format(new Date());
        setTimeStr(formatted);
      } catch {
        setTimeStr(getLocalTime(timezone));
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  if (!timeStr) return null;

  if (boxFormat) {
    return (
      <div
        className="red-outlined-time-box"
        title={`Live local time in owner timezone: ${timezone}`}
      >
        <small className="time-label">LOCAL TIME</small>
        <strong className="time-value">{timeStr}</strong>
      </div>
    );
  }

  return (
    <span className="local-time-badge" title={`Live local time in ${timezone}`}>
      {showIcon && <Clock size={11} style={{ verticalAlign: '-1px' }} />}
      {timeStr}
    </span>
  );
}
