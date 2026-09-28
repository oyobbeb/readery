// Readery settings. Scripts import these; nothing else holds them.
import type { Profile } from "./scripts/lib/llm/judgments.ts";

export type Source = { id: string; name: string } & (
  // pathPrefix keeps only links under that path (Vercel's feed mixes its changelog into the blog).
  | { kind: "feed"; url: string; pathPrefix?: string }
  | { kind: "hn" | "lobsters" | "toss" | "geeknews" }
);

// Every feed answered on 2026-09-28 and had a post in the last 90 days.
export const sources: Source[] = [
  { id: "hn", name: "Hacker News", kind: "hn" },
  { id: "lobsters", name: "Lobsters", kind: "lobsters" },
  { id: "geeknews", name: "GeekNews", kind: "geeknews" },

  { id: "toss", name: "토스", kind: "toss" },
  { id: "line", name: "LINE", kind: "feed", url: "https://techblog.lycorp.co.jp/ko/feed/index.xml" },
  { id: "naver-d2", name: "NAVER D2", kind: "feed", url: "https://d2.naver.com/d2.atom" },
  { id: "kakao", name: "카카오", kind: "feed", url: "https://tech.kakao.com/feed/" },
  { id: "woowahan", name: "우아한형제들", kind: "feed", url: "https://techblog.woowahan.com/feed/" },
  { id: "daangn", name: "당근", kind: "feed", url: "https://medium.com/feed/daangn" },
  { id: "kakaobank", name: "카카오뱅크", kind: "feed", url: "https://tech.kakaobank.com/index.xml" },
  { id: "kakao-enterprise", name: "카카오엔터프라이즈", kind: "feed", url: "https://tech.kakaoenterprise.com/feed" },
  { id: "musinsa", name: "무신사", kind: "feed", url: "https://medium.com/feed/musinsa-tech" },
  { id: "gccompany", name: "여기어때", kind: "feed", url: "https://techblog.gccompany.co.kr/feed" },
  { id: "devsisters", name: "데브시스터즈", kind: "feed", url: "https://tech.devsisters.com/rss.xml" },
  { id: "yogiyo", name: "요기요", kind: "feed", url: "https://techblog.yogiyo.co.kr/feed" },
  { id: "nhn-cloud", name: "NHN Cloud", kind: "feed", url: "https://meetup.nhncloud.com/rss" },
  { id: "oliveyoung", name: "올리브영", kind: "feed", url: "https://oliveyoung.tech/rss.xml" },
  { id: "ssg", name: "SSG", kind: "feed", url: "https://medium.com/feed/ssgtech" },
  { id: "lotteon", name: "롯데ON", kind: "feed", url: "https://techblog.lotteon.com/feed" },
  { id: "inflab", name: "인프랩", kind: "feed", url: "https://tech.inflab.com/rss.xml" },
  { id: "socar", name: "쏘카", kind: "feed", url: "https://tech.socar.kr/rss.xml" },

  { id: "netflix", name: "Netflix", kind: "feed", url: "https://netflixtechblog.com/feed" },
  { id: "meta", name: "Meta", kind: "feed", url: "https://engineering.fb.com/feed/" },
  { id: "airbnb", name: "Airbnb", kind: "feed", url: "https://medium.com/feed/airbnb-engineering" },
  { id: "pinterest", name: "Pinterest", kind: "feed", url: "https://medium.com/feed/pinterest-engineering" },
  { id: "discord", name: "Discord", kind: "feed", url: "https://discord.com/blog/rss.xml" },
  { id: "dropbox", name: "Dropbox", kind: "feed", url: "https://dropbox.tech/feed" },
  { id: "spotify", name: "Spotify", kind: "feed", url: "https://engineering.atspotify.com/feed" },
  { id: "shopify", name: "Shopify", kind: "feed", url: "https://shopify.engineering/blog.atom" },
  { id: "stripe", name: "Stripe", kind: "feed", url: "https://stripe.com/blog/feed.rss" },
  { id: "grab", name: "Grab", kind: "feed", url: "https://engineering.grab.com/feed.xml" },
  { id: "aws-architecture", name: "AWS Architecture", kind: "feed", url: "https://aws.amazon.com/blogs/architecture/feed/" },
  { id: "cloudflare", name: "Cloudflare", kind: "feed", url: "https://blog.cloudflare.com/rss/" },
  { id: "vercel", name: "Vercel", kind: "feed", url: "https://vercel.com/atom", pathPrefix: "/blog/" },
  { id: "figma", name: "Figma", kind: "feed", url: "https://www.figma.com/blog/feed/atom.xml" },
  { id: "webkit", name: "WebKit", kind: "feed", url: "https://webkit.org/feed/" },
  { id: "flyio", name: "Fly.io", kind: "feed", url: "https://fly.io/blog/feed.xml" },
  { id: "github", name: "GitHub", kind: "feed", url: "https://github.blog/engineering/feed/" },
  { id: "supabase", name: "Supabase", kind: "feed", url: "https://supabase.com/rss.xml" },
  { id: "linear", name: "Linear", kind: "feed", url: "https://linear.app/rss/now.xml" },
];

// The interest filter judges items against the user's own five words (pilot 2026-09-28: KO 91%, EN 100%).
export const profile: Profile = {
  interests: [
    { ko: "프론트엔드", en: "Frontend development." },
    { ko: "백엔드", en: "Backend development." },
    { ko: "시스템 디자인", en: "System design." },
    { ko: "웹", en: "The web." },
    { ko: "오픈소스", en: "Open source." },
  ],
  notInterested: [
    { ko: "암호화폐 시세·투자", en: "Cryptocurrency prices and investing." },
    { ko: "정치·연예 뉴스", en: "Politics and celebrity news." },
  ],
  // Fallback only, when Jev is unreachable.
  keywords: [
    "frontend", "front-end", "react", "next.js", "nextjs", "solid", "solidjs", "qwik", "astro", "vite", "svelte", "vue", "css",
    "browser", "javascript", "typescript", "node.js", "nodejs", "deno", "bun", "wasm", "webassembly", "backend", "back-end",
    "server", "api", "database", "postgres", "postgresql", "mysql", "sqlite", "redis", "kafka", "queue", "cache", "kubernetes",
    "k8s", "docker", "infrastructure", "ci", "deploy", "golang", "go 1.", "rust", "architecture", "system design", "scalability",
    "distributed", "microservice", "postmortem", "incident", "http", "web", "website", "self-host", "self-hosting",
    "open source", "open-source", "oss", "github", "git",
    "프론트엔드", "백엔드", "서버", "데이터베이스", "아키텍처", "설계", "인프라", "배포", "웹", "브라우저", "오픈소스", "대규모", "트래픽",
  ],
};
