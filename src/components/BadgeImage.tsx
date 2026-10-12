// module 5809
import {useEffect, useRef, useState} from 'react';

export default function BadgeImage({className = '', ...props}: any) {
  const ref = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, []);
  return (
    <img
      ref={ref}
      {...props}
      className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`}
      onLoad={(e) => {
        setLoaded(true);
        props.onLoad?.(e);
      }}
    />
  );
}
