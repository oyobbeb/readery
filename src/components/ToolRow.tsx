import type { ToolNews } from "../digest.ts";

const KIND = { release: "릴리스", api: "새 API 문서", post: "블로그" };

export default function ToolRow({ news: t }: { news: ToolNews }) {
  return (
    <li className="tool">
      <time className="margin num" dateTime={t.date}>{t.date.slice(5).replace("-", ".")}</time>
      <a className="tool-link" href={t.url} target="_blank" rel="noopener"><span className="tool-name">{t.tool}</span> {t.text}</a>
      <span className="tool-kind">{KIND[t.kind]}</span>
    </li>
  );
}
