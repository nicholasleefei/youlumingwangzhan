import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt?: string;
  className?: string;
  fallback?: React.ReactNode;
  usePlaceholder?: boolean;
}

export default function SafeImage({ 
  src, 
  alt = '', 
  className = '', 
  fallback,
  usePlaceholder = true
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    if (fallback) {
      return fallback;
    }
    if (usePlaceholder) {
      return (
        <img
          src="/placeholder-car.svg"
          alt={alt}
          className={className}
        />
      );
    }
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true);
      }}
      referrerPolicy="no-referrer"
      loading="lazy"
    />
  );
}
