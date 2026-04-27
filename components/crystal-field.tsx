type Crystal = {
  className: string;
  style?: React.CSSProperties;
};

const crystals: Crystal[] = [
  { className: "left-[8%] top-[18%] h-20 w-8", style: { "--r": "-13deg" } as React.CSSProperties },
  { className: "left-[13%] top-[11%] h-28 w-11 opacity-80", style: { "--r": "-8deg" } as React.CSSProperties },
  { className: "left-[20%] top-[20%] h-24 w-10 opacity-90", style: { "--r": "8deg" } as React.CSSProperties },
  { className: "right-[10%] top-[14%] h-24 w-10 opacity-75", style: { "--r": "10deg" } as React.CSSProperties },
  { className: "right-[23%] bottom-[16%] h-16 w-7 opacity-45 blur-[1px]", style: { "--r": "-24deg" } as React.CSSProperties }
];

export function CrystalField({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="absolute left-[7%] top-[10%] h-44 w-44 rounded-full bg-vc-primary/15 blur-3xl" />
      <div className="absolute right-[6%] top-[8%] h-36 w-36 rounded-full bg-vc-primary/12 blur-3xl" />
      {crystals.map((crystal, index) => (
        <div
          key={index}
          className={`vc-drift absolute [clip-path:polygon(50%_0%,88%_18%,78%_88%,50%_100%,20%_88%,12%_18%)] border border-vc-primary/30 bg-[linear-gradient(135deg,rgba(244,252,247,.96),rgba(120,198,154,.64)_52%,rgba(255,255,255,.56))] shadow-vc-glow ${crystal.className}`}
          style={crystal.style}
        />
      ))}
    </div>
  );
}
