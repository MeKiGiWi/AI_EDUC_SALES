export function OrbitLines({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      viewBox="0 0 1200 800"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M-20 620 C210 398 465 744 710 505 C910 309 810 138 1230 70"
        stroke="#478BFF"
        strokeOpacity="0.16"
        strokeWidth="1.5"
      />
      <path
        d="M85 115 C230 325 570 230 760 390 C960 558 760 690 1115 780"
        stroke="#478BFF"
        strokeOpacity="0.12"
        strokeWidth="1.25"
      />
      <path
        d="M320 -60 C245 160 590 205 535 430 C490 612 248 560 205 815"
        stroke="#478BFF"
        strokeOpacity="0.10"
        strokeWidth="1.25"
      />
    </svg>
  );
}
