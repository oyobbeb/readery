// One canonical form per article, so the same link from HN, GeekNews and a blog feed becomes one item.
import { createHash } from "node:crypto";
import normalizeUrl from "normalize-url";

const TRACKING = [/^utm_\w+/i, /^(ref|source|fbclid|gclid|mc_cid|mc_eid)$/i];

export const canonical = (url: string) => normalizeUrl(url, { forceHttps: true, stripHash: true, removeQueryParameters: TRACKING });

export const itemId = (url: string) => createHash("sha1").update(canonical(url)).digest("hex").slice(0, 12);
