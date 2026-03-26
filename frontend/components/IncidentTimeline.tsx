"use client";

export type TimelineItem = {
  title: string;
  time: string;
  copy: string;
  color: string; // e.g. "bg-tertiary text-tertiary"
};

type IncidentTimelineProps = {
  items: TimelineItem[];
};

export function IncidentTimeline({ items }: IncidentTimelineProps) {
  // Show a neutral placeholder until the first real event arrives
  const display: TimelineItem[] =
    items.length > 0
      ? items
      : [
          {
            title: "SYSTEM_NOMINAL",
            time: "--:--:--",
            copy: "No incidents detected. Monitoring active — inject a fault to begin.",
            color: "bg-zinc-700 text-zinc-400",
          },
        ];

  return (
    <section className="col-span-12 bg-surface-container p-6 lg:col-span-5">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-headline text-sm font-bold uppercase tracking-widest text-zinc-400">
          INCIDENT_TIMELINE
        </h3>
        {items.length > 0 && (
          <span className="font-mono text-[9px] text-zinc-600">
            {items.length} EVENT{items.length !== 1 ? "S" : ""}
          </span>
        )}
      </div>

      <div className="relative space-y-6 before:absolute before:bottom-2 before:left-2 before:top-2 before:w-px before:bg-outline-variant/20">
        {display.map((item, i) => {
          const [bgClass, textClass] = item.color.split(" ");
          return (
            <div
              key={`${item.title}-${i}`}
              className={`relative pl-8 transition-opacity duration-300 ${
                i > 0 ? "opacity-50" : "opacity-100"
              }`}
            >
              {/* Timeline dot */}
              <span
                className={`absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-surface ${bgClass} ${
                  i === 0 ? "ring-2 ring-offset-1 ring-offset-surface " + bgClass.replace("bg-", "ring-") : ""
                }`}
              />

              <div className="flex items-start justify-between gap-2">
                <span className={`font-mono text-xs font-bold ${textClass}`}>{item.title}</span>
                <span className="shrink-0 font-mono text-[10px] text-zinc-600">{item.time}</span>
              </div>
              <p className="mt-1 text-xs italic text-zinc-400 leading-relaxed">{item.copy}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
