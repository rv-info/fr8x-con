'use client';

import React, { useState } from 'react';
import { GoldenTick } from './GoldenTick';
import { ProfilePreviewModal, ProfilePreviewData } from './ProfilePreviewModal';

interface ProfileLinkProps {
  name: string;
  role?: string;
  company?: string;
  location?: string;
  timezone?: string;
  hasGoldenTick?: boolean;
  isVerified?: boolean;
  className?: string;
}

export function ProfileLink({
  name,
  role,
  company,
  location,
  timezone = 'Asia/Kolkata',
  hasGoldenTick,
  isVerified = true,
  className,
}: ProfileLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  const previewData: ProfilePreviewData = {
    name,
    role,
    company,
    location,
    timezone,
    hasGoldenTick,
    isVerified,
  };

  return (
    <>
      <span
        className={`profilelink ${className || ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        title={`View ${name}'s verified professional profile`}
      >
        {name}
        {hasGoldenTick && <GoldenTick />}
      </span>
      <ProfilePreviewModal isOpen={isOpen} onClose={() => setIsOpen(false)} profile={previewData} />
    </>
  );
}
