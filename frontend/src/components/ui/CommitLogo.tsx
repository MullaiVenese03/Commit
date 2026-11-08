import React from 'react';

export type CommitLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CommitLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: CommitLogoSize;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<CommitLogoSize, string> = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export const CommitLogo: React.FC<CommitLogoProps> = ({
  size = 'md',
  className = '',
  alt = 'Commit logo',
  ...props
}) => {
  return (
    <img
      src="/branding/commit-logo.png"
      alt={alt}
      width={1312}
      height={1199}
      className={`shrink-0 object-contain select-none ${sizeClasses[size]} ${className}`}
      loading="eager"
      decoding="async"
      {...props}
    />
  );
};
