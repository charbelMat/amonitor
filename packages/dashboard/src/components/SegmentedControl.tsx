interface Segment<T extends string> {
  value: T;
  label: string;
  count?: number;
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
}: {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex bg-raised border border-border rounded-md p-0.5">
      {segments.map((segment) => {
        const active = segment.value === value;
        return (
          <button
            key={segment.value}
            onClick={() => onChange(segment.value)}
            className={`text-xs font-medium px-2.5 py-1.5 rounded transition-colors ${
              active ? 'bg-accent/20 text-accentSoft' : 'text-muted hover:text-ink'
            }`}
          >
            {segment.label}
            {segment.count !== undefined && (
              <span className={`ml-1.5 ${active ? 'text-accentSoft/70' : 'text-faint'}`}>
                {segment.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
