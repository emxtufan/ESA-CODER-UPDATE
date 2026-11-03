/**
 * Imaginile din antetul și footerul contractului. Se transformă în data URL la
 * runtime (o singură dată), ca iframe-ul să nu aștepte încărcarea lor la print.
 */
import logoUrl from "../assets/logo.png";
import mailUrl from "../assets/mail.png";
import phoneUrl from "../assets/phone.png";
import webUrl from "../assets/web.png";

import type { ImageSet } from "./engine";

async function toDataUrl(url: string): Promise<string> {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

let cached: Promise<ImageSet> | null = null;

/** URL-urile din bundle, ca rezervă dacă conversia eșuează. */
export const IMAGE_URLS: ImageSet = { logo: logoUrl, mail: mailUrl, phone: phoneUrl, web: webUrl };

/** Imaginile ca data URL (cache la nivel de modul). */
export function loadImages(): Promise<ImageSet> {
  cached ??= Promise.all([toDataUrl(logoUrl), toDataUrl(mailUrl), toDataUrl(phoneUrl), toDataUrl(webUrl)])
    .then(([logo, mail, phone, web]) => ({ logo, mail, phone, web }))
    .catch(() => IMAGE_URLS);
  return cached;
}
