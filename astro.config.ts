import react from "@astrojs/react";
import { defineConfig, fontProviders } from "astro/config";

// Fonts are downloaded at build time and served from the site itself.
// Korean faces come from Google, which cuts Hangul into ~90 unicode-range slices (a page fetches only the slices
// its text uses); Fontsource ships Hangul as one ~500 KB file per weight.
// Source Serif 4 has no Hangul, so it carries no fallback of its own: titles fall through to Nanum Myeongjo.
export default defineConfig({
  fonts: [
    { provider: fontProviders.google(), name: "IBM Plex Sans KR", cssVariable: "--font-sans", weights: [400, 600], fallbacks: ["sans-serif"] },
    { provider: fontProviders.fontsource(), name: "Source Serif 4", cssVariable: "--font-serif", weights: ["600 700"], styles: ["normal"], fallbacks: [], optimizedFallbacks: false },
    { provider: fontProviders.google(), name: "Nanum Myeongjo", cssVariable: "--font-serif-ko", weights: [700], fallbacks: ["serif"] },
    // Numbers only (dates, counts); Hangul next to them falls through to the sans.
    { provider: fontProviders.fontsource(), name: "IBM Plex Mono", cssVariable: "--font-mono", weights: [400], styles: ["normal"], fallbacks: [], optimizedFallbacks: false },
  ],
  integrations: [react()],
});
