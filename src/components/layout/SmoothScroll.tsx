import {useEffect, type ReactNode} from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {setLenis} from '@/lib/scrollLock';

gsap.registerPlugin(ScrollTrigger);

// module 9082
export default function SmoothScroll({children}: {children?: ReactNode}) {
  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !window.matchMedia('(any-pointer: fine)').matches
    )
      return;
    // lerp = continuous inertia: each wheel tick blends into the running motion
    // instead of restarting a fixed-duration tween. Lower = smoother/floatier.
    const lenis = new Lenis({lerp: 0.065, wheelMultiplier: 1.1, });
    setLenis(lenis);
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      setLenis(null);
      lenis.destroy();
    };
  }, []);
  return <>{children}</>;
}
