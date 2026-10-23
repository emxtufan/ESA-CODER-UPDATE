// module 1476
// Exports (compiled name -> readable name):
//   qh -> mediaUrl      resolves a stored image ref (/media/.., http.., wix:image://..) to a URL
//   HL -> vectorUrl     resolves a stored vector/icon ref (wix:vector://..) to a URL
//   LT -> mediaSrcSet   builds a srcset for /_next/image URLs and local images (undefined otherwise)
function parseWixImage(ref: string) {
  const m = ref.match(/^wix:image:\/\/v1\/([^/]+)\/([^#]*)(?:#(.*))?$/);
  if (!m) return null;
  const params = new URLSearchParams(m[3] || '');
  return {
    id: m[1],
    name: decodeURIComponent(m[2]) || 'image',
    width: Number(params.get('originWidth')) || 0,
    height: Number(params.get('originHeight')) || 0,
  };
}

export function mediaUrl(ref: string, width: number, height?: number, crop = 'al_c'): string {
  if (!ref) return '';
  // The original routed /media/ files through next/image; here they are served as-is.
  if (ref.startsWith('/media/')) return ref;
  if (ref.startsWith('http')) return ref;
  const img = parseWixImage(ref);
  if (!img) return '';
  const ratio = img.width && img.height ? img.height / img.width : 0.667;
  const h = height ?? Math.round(width * ratio);
  const name = encodeURIComponent(img.name.replace(/\s+/g, '-'));
  return `https://static.wixstatic.com/media/${img.id}/v1/fill/w_${width},h_${h},${crop},q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${name}`;
}

export function vectorUrl(ref: string): string {
  if (!ref) return '';
  if (ref.startsWith('/media/') || ref.startsWith('http')) return ref;
  const m = ref.match(/^wix:vector:\/\/v1\/([^/]+)\//);
  return m ? `https://static.wixstatic.com/shapes/${m[1]}` : '';
}

export function mediaSrcSet(url: string, widths = [448, 828]): string | undefined {
  if (url.startsWith('/_next/image?')) {
    return widths.map((w) => `${url.replace(/([?&])w=\d+/, `$1w=${w}`)} ${w}w`).join(', ');
  }
  // local images: resized copies made by server/images.mjs (it only accepts the widths it lists)
  if (/^\/[^?#]+\.(jpe?g|png|webp)$/i.test(url)) return widths.map((w) => `${url}?w=${w} ${w}w`).join(', ');
  return undefined;
}
