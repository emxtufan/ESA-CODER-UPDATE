// module 8190
import { useEffect, useRef, useState } from 'react';

export default function AuroraImage({ src, className, style }: any) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <img
      ref={imgRef}
      src={src}
      alt=""
      className={`${className}${loaded ? ' is-loaded' : ''}`}
      style={style}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      onLoad={() => setLoaded(true)}
    />
  );
}
