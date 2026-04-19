import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { fetchWithAutoRefresh } from '../services/httpClient';

function normalizeProtectedSrc(src: string) {
  if (src.startsWith('/api/')) return src;
  if (src.startsWith('/client/') || src.startsWith('/file/')) {
    return `/api${src}`;
  }
  return src;
}

export function ProtectedImage({
  src,
  alt = '',
  className,
  style,
  ...rest
}: ImgHTMLAttributes<HTMLImageElement>) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(() => {
    if (!src || typeof src !== 'string') return null;
    const normalizedSrc = normalizeProtectedSrc(src);
    return normalizedSrc.startsWith('/api/') ? null : normalizedSrc;
  });

  useEffect(() => {
    if (!src || typeof src !== 'string') {
      setResolvedSrc(null);
      return;
    }

    const normalizedSrc = normalizeProtectedSrc(src);

    if (typeof window === 'undefined' || !normalizedSrc.startsWith('/api/')) {
      setResolvedSrc(normalizedSrc);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;
    let cancelled = false;

    setResolvedSrc(null);

    void fetchWithAutoRefresh(normalizedSrc, {
      signal: controller.signal,
    })
      .then(async response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .then(blob => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setResolvedSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelled) {
          setResolvedSrc(normalizedSrc);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [src]);

  if (!resolvedSrc) {
    return (
      <div
        className={`flex items-center justify-center bg-[rgba(26,61,74,0.06)] ${className ?? ''}`}
        style={style}
      >
        <Loader2 className="w-5 h-5 animate-spin text-[#C4912A]" />
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={resolvedSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
    />
  );
}
