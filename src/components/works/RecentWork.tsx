import Link from '@/components/Link';
import {collection} from '@/lib/collections';
import {text} from '@/lib/text';

const $t = text('components/works/RecentWork');

type Project = {slug: string; title: string; image: string};

// "Recent work" cards on the service pages: the first three projects of the collection
// (the same order as the /works grid).
export default function RecentWork() {
  return (
    <>
      {collection<Project>('projects').slice(0, 3).map((project) => (
      <Link data-reveal key={project.slug} href={`/works/${project.slug}`} className="group relative rounded-[12px] border border-fg/12 bg-bg/30 p-[10px] pb-4 backdrop-blur-[14px]">
        <span aria-hidden className="vv-shine vv-shine-lyr-a pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-a) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
        <span aria-hidden className="vv-shine vv-shine-lyr-b pointer-events-none absolute inset-0 rounded-[inherit] pointer-coarse:hidden" style={{ padding: 1, animationDuration: "2.8s", backgroundImage: "conic-gradient(from calc(var(--vv-shine-b) - var(--vv-shine-w, 24deg)), transparent 0deg, #0099FF calc(var(--vv-shine-w, 24deg) / 2), #7ACAFF var(--vv-shine-w, 24deg), transparent calc(var(--vv-shine-w, 24deg) * 2), transparent 360deg)", mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", maskComposite: "exclude", WebkitMaskComposite: "xor" }} />
        <div className="relative overflow-hidden rounded-[6px] bg-surface" style={{ aspectRatio: "4 / 3" }}>
          <img src={project.image} alt={project.title} className="absolute inset-x-0 top-0 w-full transition-[filter] duration-500 ease-brand group-hover:[filter:blur(7px)_brightness(0.62)]" loading="lazy" decoding="async" />
          <span className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-400 ease-brand group-hover:opacity-100">
            <span className="vv-accent text-[clamp(20px,2vw,28px)] leading-none text-white">
              {$t('view-project')}
            </span>
          </span>
        </div>
        <h3 className="mt-4 px-3 font-display text-[20px] leading-[1.2] font-medium tracking-h3">
          {project.title}
        </h3>
      </Link>
      ))}
    </>
  );
}
