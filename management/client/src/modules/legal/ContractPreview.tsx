/**
 * Previzualizarea contractului: un iframe same-origin, fără scripturi, în care motorul
 * din `contract/engine.ts` construiește paginile A4. Print-ul se face din iframe, deci
 * în PDF apar doar paginile contractului.
 */
import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

import { fit, render, type ImageSet, type Values } from "./contract/engine";
import { loadImages } from "./contract/images";
import pageCss from "./contract/page.css?raw";
import template from "./contract/template.html?raw";

const RENDER_DEBOUNCE_MS = 180;

/** Scheletul documentului din iframe (scris o singură dată, ca `srcdoc`). */
export const CONTRACT_SKELETON =
  '<!doctype html><html lang="ro"><head><meta charset="utf-8"><title>Contract ESA</title><style>' +
  pageCss +
  '</style></head><body><div id="pages"></div></body></html>';

export interface ContractPreviewHandle {
  /** Randează imediat, așteaptă imaginile și întoarce documentul din iframe (pentru PDF pe server). */
  prepare: () => Promise<Document | null>;
  /** Randează imediat, setează titlul și deschide dialogul de print al iframe-ului. */
  print: () => Promise<void>;
}

export interface ContractPreviewProps {
  values: Values;
  ref?: Ref<ContractPreviewHandle>;
}

/** Titlul documentului (devine numele implicit al fișierului PDF). */
export function pdfTitle(values: Values): string {
  return "Contract ESA - " + (values.clNume || "client") + (values.nr ? " - " + values.nr.replace(/[/\\]/g, "-") : "");
}

export function ContractPreview({ values, ref }: ContractPreviewProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const [loaded, setLoaded] = useState(false);
  const [images, setImages] = useState<ImageSet | null>(null);
  const firstRender = useRef(true);

  useEffect(() => {
    let alive = true;
    void loadImages().then((set) => {
      if (alive) setImages(set);
    });
    return () => {
      alive = false;
    };
  }, []);

  // Randare cu debounce la schimbarea valorilor (prima randare e imediată).
  useEffect(() => {
    const doc = frameRef.current?.contentDocument;
    if (!loaded || !images || !doc) return;

    const run = () => render(values, doc, template, images);
    if (firstRender.current) {
      firstRender.current = false;
      run();
      return;
    }
    const timer = setTimeout(run, RENDER_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [values, loaded, images]);

  // Zoom-ul de încadrare urmărește lățimea iframe-ului.
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

  useImperativeHandle(ref, () => ({
    async prepare() {
      const doc = frameRef.current?.contentDocument;
      if (!doc) return null;
      render(valuesRef.current, doc, template, images ?? (await loadImages()));
      await Promise.all([...doc.images].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))));
      return doc;
    },
    async print() {
      const frame = frameRef.current;
      const doc = frame?.contentDocument;
      const win = frame?.contentWindow;
      if (!frame || !doc || !win) return;

      const set = images ?? (await loadImages());
      render(valuesRef.current, doc, template, set);
      // Imaginile trebuie să fie gata înainte de print.
      await Promise.all(
        [...doc.images].map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
      );

      const title = pdfTitle(valuesRef.current);
      const previous = document.title;
      doc.title = title;
      document.title = title;
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
      title="Previzualizare contract"
      srcDoc={CONTRACT_SKELETON}
      onLoad={() => setLoaded(true)}
      className="block h-full w-full rounded-lg border border-line bg-[#f2f2f0]"
    />
  );
}
