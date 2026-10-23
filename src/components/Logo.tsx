const logoStyle = {
  display: 'inline-block',
  aspectRatio: '2785 / 778',
  backgroundColor: 'currentColor',
  mask: 'url(/brand/logo.webp) center / contain no-repeat',
  WebkitMask: 'url(/brand/logo.webp) center / contain no-repeat',
};

export function EsaMark({ className }: { className?: string }) {
  return <span className={className} style={logoStyle} role="img" aria-label="ESA Coder Solutions" />;
}

export function EsaWordmark({ className }: { className?: string }) {
  return <span className={className} style={logoStyle} aria-hidden />;
}
