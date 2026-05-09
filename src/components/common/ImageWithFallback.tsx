import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function ImageWithFallback({
  src,
  fallbackSrc = '/placeholder-car.png',
  alt,
  className,
  style,
  onClick,
}: ImageWithFallbackProps) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  const finalSrc = hasError ? fallbackSrc : src;

  return (
    <img
      src={finalSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      onClick={onClick}
    />
  );
}

interface LazyImageProps extends ImageWithFallbackProps {
  loadingClassName?: string;
}

export function LazyImage({
  src,
  fallbackSrc,
  alt,
  className,
  style,
  onClick,
  loadingClassName,
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  const finalSrc = hasError ? (fallbackSrc || '/placeholder-car.png') : src;

  return (
    <div className={`relative ${className || ''}`} style={style}>
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 flex items-center justify-center bg-zinc-100 ${loadingClassName || ''}`}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
        </div>
      )}
      <img
        src={finalSrc}
        alt={alt}
        className={`${className || ''} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        loading="lazy"
      />
    </div>
  );
}

export function CarImage({ src, alt, className, style }: Omit<ImageWithFallbackProps, 'fallbackSrc'>) {
  return (
    <ImageWithFallback
      src={src}
      alt={alt}
      className={className}
      style={style}
      fallbackSrc="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2ZmZiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtNTAlLCAtNTAlKSIgZm9udC1mYW1pbHk9IkF2ZW5pciIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzMzMyI+5rGkX1x1MjYxMFx1NGY0NFx1NGY0NVx1NGY0NFx1MzRhYyA8L3RleHQ+PC9zdmc+"
    />
  );
}
