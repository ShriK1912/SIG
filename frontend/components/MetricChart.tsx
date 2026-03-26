"use client";

type MetricChartProps = {
  label: string;
  value: string;
  icon: string;
  colorClass: string;
  bars: number[];
};

export function MetricChart({ label, value, icon, colorClass, bars }: MetricChartProps) {
  // A bar at or above 100 means the metric has crossed its threshold — show
  // the last (current) bar in full opacity, older bars at 20% opacity.
  const isAlarming = bars.length > 0 && bars[bars.length - 1] >= 100;

  return (
    <div
      className={`bg-surface-container p-4 transition-all duration-500 ${
        isAlarming ? "ring-1 ring-red-500/40" : ""
      }`}
    >
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h4 className="font-headline text-[10px] font-bold uppercase text-zinc-500">{label}</h4>
          <div
            className={`font-mono text-xl transition-colors duration-300 ${
              isAlarming ? "text-red-400" : colorClass
            }`}
          >
            {value}
          </div>
        </div>
        <span
          className={`material-symbols-outlined text-sm transition-colors duration-300 ${
            isAlarming ? "text-red-400" : colorClass
          }`}
        >
          {icon}
        </span>
      </div>

      {/* Bar sparkline */}
      <div className="relative flex h-12 items-end gap-0.5">
        {/* Threshold line at 100% height */}
        <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-zinc-700/60" />

        {bars.map((height, index) => {
          const isCurrent = index === bars.length - 1;
          const cappedHeight = Math.min(100, height); // never overflow the container
          const barColor = isAlarming
            ? isCurrent
              ? "bg-red-500"
              : "bg-red-500/20"
            : isCurrent
            ? colorClass.replace("text-", "bg-")
            : colorClass.replace("text-", "bg-") + "/20";

          return (
            <div
              key={`${label}-${index}`}
              className={`flex-1 transition-all duration-300 ${barColor}`}
              style={{ height: `${Math.max(4, cappedHeight)}%` }}
            />
          );
        })}
      </div>

      {/* Threshold breach label */}
      {isAlarming && (
        <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-wider text-red-500">
          THRESHOLD_BREACHED
        </p>
      )}
    </div>
  );
}
