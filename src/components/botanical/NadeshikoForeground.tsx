/**
 * NadeshikoForeground -- Near layer (standalone version).
 *
 * L2 Path spec:
 *   - Fixed at bottom-left of screen
 *   - 2 stems (main + side branch) + 6 flowers + 4 leaves
 *   - Flower opacity: 0.15-0.25
 *   - Stem/branch opacity: 0.15-0.18
 *   - Desktop only (max-md:hidden)
 *   - pointer-events-none, aria-hidden
 *
 * Composition:
 *   A gently curving main stem rises from the bottom-left corner,
 *   with one side branch splitting rightward. Nadeshiko flowers
 *   bloom along the stems at varied scales, while narrow leaves
 *   appear along the branches. The arrangement frames the
 *   bottom-left without intruding into the content area.
 *
 * Total SVG elements: 14 (2 stems + 6 flowers + 4 leaves + 2 extra petals)
 *   -- well within the <= 30 page budget
 *
 * Symbol IDs (defined in NadeshikoDefs.tsx):
 *   #nd  -- Full nadeshiko flower
 *   #ndp -- Single petal
 *   #ndf -- Leaf
 */
export default function NadeshikoForeground() {
  return (
    <div
      className="pointer-events-none fixed max-md:hidden"
      style={{
        left: 0,
        bottom: 0,
        width: 220,
        height: 300,
        zIndex: 1,
      }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 220 300"
        fill="none"
        preserveAspectRatio="xMinYMax meet"
        className="h-full w-full"
      >
        {/* ── Main stem ── gentle S-curve rising from bottom-left */}
        <path
          d="M 25 300 Q 20 260, 35 225 Q 50 190, 42 155 Q 34 120, 50 85 Q 66 50, 60 20"
          stroke="var(--color-accent-bark)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.22"
        />

        {/* ── Side branch ── splits right from mid-stem */}
        <path
          d="M 45 160 Q 70 140, 95 130 Q 120 120, 140 105"
          stroke="var(--color-accent-bark)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.21"
        />

        {/* ── Short spur ── off main stem, upper left */}
        <path
          d="M 48 90 Q 30 78, 18 70"
          stroke="var(--color-accent-bark)"
          strokeWidth="1.4"
          strokeLinecap="round"
          fill="none"
          opacity="0.20"
        />

        {/* ── Leaf 1: lower stem, angled left ── */}
        <use
          href="#ndf"
          fill="var(--color-accent-leaf)"
          opacity="0.22"
          transform="translate(22, 248) rotate(-50) scale(0.50)"
        />

        {/* ── Leaf 2: at branch junction, angled right ── */}
        <use
          href="#ndf"
          fill="var(--color-accent-sage)"
          opacity="0.20"
          transform="translate(55, 155) rotate(25) scale(0.45)"
        />

        {/* ── Leaf 3: along side branch ── */}
        <use
          href="#ndf"
          fill="var(--color-accent-leaf)"
          opacity="0.21"
          transform="translate(108, 118) rotate(40) scale(0.42)"
        />

        {/* ── Leaf 4: upper spur, small ── */}
        <use
          href="#ndf"
          fill="var(--color-accent-sage)"
          opacity="0.19"
          transform="translate(15, 65) rotate(-35) scale(0.35)"
        />

        {/* ── Flower 1 (Primary): largest, at first curve ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko)"
          opacity="0.28"
          transform="translate(38, 220) scale(0.95)"
        />

        {/* ── Flower 2: medium, at mid-stem bend ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko-hot)"
          opacity="0.26"
          transform="translate(44, 150) scale(0.78)"
        />

        {/* ── Flower 3: along side branch ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko)"
          opacity="0.24"
          transform="translate(100, 125) scale(0.70)"
        />

        {/* ── Flower 4: end of side branch, smaller ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko-hot)"
          opacity="0.22"
          transform="translate(138, 100) scale(0.52)"
        />

        {/* ── Flower 5: upper main stem ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko)"
          opacity="0.24"
          transform="translate(52, 80) scale(0.60)"
        />

        {/* ── Flower 6 (Bud): topmost, smallest ── */}
        <use
          href="#nd"
          fill="var(--color-nadeshiko-hot)"
          opacity="0.22"
          transform="translate(58, 25) scale(0.38)"
        />
      </svg>
    </div>
  );
}
