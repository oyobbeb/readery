import type { Entry as Item } from "../digest.ts";

// One item in a day list. The margin holds how many places it was seen in; the column holds only the title.
// Discussion threads are chips (tappable); a feed's own name is plain text.
export default function Entry({ entry: e }: { entry: Item }) {
  return (
    <li className="entry">
      <span className={e.places >= 3 ? "margin places hot" : "margin places"}>
        {e.places > 1 && <><span className="n">{e.places}</span>곳<span className="sr">에서 화제</span></>}
      </span>
      <div className="entry-body">
        <a className="entry-title" href={e.url} target="_blank" rel="noopener">{e.title}</a>
        <p className="entry-meta">
          <span className="site">{e.site}</span>
          {e.mentions.map((m) =>
            m.url ? <a key={m.name} className="chip" href={m.url} target="_blank" rel="noopener">{m.name}</a> : <span key={m.name} className="plain">{m.name}</span>,
          )}
        </p>
      </div>
    </li>
  );
}
