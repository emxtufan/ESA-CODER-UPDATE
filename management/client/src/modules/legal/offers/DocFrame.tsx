/**
 * Iframe de previzualizare pentru documentele din dosar: scheletul cu `page.css` + `dossier.css`,
 * randare cu debounce, zoom de încadrare și acces la documentul randat (PDF / print).
 */
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { fit, type ImageSet } from "../contract/engine";
import { loadImages } from "../contract/images";
import { DOSSIER_SKELETON } from "../dossier/render";

const DEBOUNCE_MS = 200;

export interface DocFrameHandle {
  /** Randează imediat, așteaptă imaginile și întoarce documentul din iframe. */
  prepare: () => Promise<Document | null>;
  /** Randează și deschide print-ul din browser (rezerva fără PDF pe server). */
  print: (title?: string) => Promise<void>;
}

export interface DocFrameProps {
  /** Randează documentul în `doc`; trebuie să fie fără efecte în afara iframe-ului. */
  render: (doc: Document, img: ImageSet) => void;
  /** Se schimbă când conținutul trebuie randat din nou. */
  renderKey: unknown;
  skeleton?: string;
  title?: string;
  className?: string;
  ref?: Ref<DocFrameHandle>;
}

export function DocFrame({ render, renderKey, skeleton = DOSSIER_SKELETON, title = "Previzualizare document", className, ref }: DocFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const renderRef = useRef(render);
  renderRef.current = render;
  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState<ImageSet | null>(null);
  const first = useRef(true);

  useEffect(() => {
    let alive = true;
    void loadImages().then((set) => alive && setImages(set));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!loaded || !images || !doc) return;
    const run = () => {
      try {
        renderRef.current(doc, images);
      } catch (error) {
        console.error("Randarea documentului a eșuat", error);
      }
    };
    if (first.current) {
      first.current = false;
      run();
      return;
    }
    const timer = setTimeout(run, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [renderKey, loaded, images]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || !loaded) return;
    const observer = new ResizeObserver(() => {
      const doc = frame.contentDocument;
      if (doc) fit(doc);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [loaded]);

  async function prepare(): Promise<Document | null> {
    const doc = frameRef.current?.contentDocument;
    if (!doc) return null;
    const set = images ?? (await loadImages());
    renderRef.current(doc, set);
    await Promise.all([...doc.images].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
    return doc;
  }

  useImperativeHandle(ref, () => ({
    prepare,
    async print(docTitle) {
      const doc = await prepare();
      const win = frameRef.current?.contentWindow;
      if (!doc || !win) return;
      const previous = document.title;
      if (docTitle) {
        doc.title = docTitle;
        document.title = docTitle;
      }
      try {
        win.focus();
        win.print();
      } finally {
        document.title = previous;
      }
    },
  }));

  return (
    <iframe
      ref={frameRef}
      title={title}
      srcDoc={skeleton}
      onLoad={() => setLoaded(true)}
      className={className ?? "block h-full w-full rounded-lg border border-line bg-[#f2f2f0]"}
    />
  );
}

/**
 * Randează într-un iframe ascuns (în afara ecranului) și întoarce documentul și o funcție de curățare.
 * Folosit la exportul ZIP, unde documentele se randează pe rând.
 */
export async function renderHidden(skeleton: string, fn: (doc: Document, img: ImageSet) => void): Promise<{ doc: Document; dispose: () => void }> {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;left:-10000px;top:0;width:1000px;height:1400px;border:0;visibility:hidden";
  document.body.appendChild(frame);
  await new Promise<void>((resolve) => {
    frame.onload = () => resolve();
    frame.srcdoc = skeleton;
  });
  const doc = frame.contentDocument!;
  const img = await loadImages();
  fn(doc, img);
  await Promise.all([...doc.images].map((i) => (i.complete ? Promise.resolve() : i.decode().catch(() => undefined))));
  return { doc, dispose: () => frame.remove() };
}
