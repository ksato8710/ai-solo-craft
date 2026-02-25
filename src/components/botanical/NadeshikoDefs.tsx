/**
 * NadeshikoDefs -- Reusable SVG symbol definitions for the Nadeshiko botanical system.
 *
 * Defines three motifs:
 *   #nd  -- Nadeshiko flower (5 fringed petals + center)
 *   #ndp -- Single petal (for scattered/drifting elements)
 *   #ndf -- Leaf (ellipse + center vein)
 *
 * Design notes:
 *   Nadeshiko (Dianthus / Japanese Pink) has 5 petals whose tips
 *   split into delicate fringe. The geometric abstraction uses
 *   pairs of slim, slightly diverging ellipses per petal to evoke
 *   that characteristic split without drawing literal fringe.
 *   The slender proportions (rx:ry ~ 1:5) convey the flower's
 *   graceful, understated beauty -- mirroring the meticulous
 *   craft of solo development work.
 *
 *   Total primitives for #nd: 11 (5x2 petal halves + 1 center)
 *
 * Rendered as a hidden SVG so <use href="#nd"> etc. can reference
 * these symbols from any sibling component on the page.
 */
export default function NadeshikoDefs() {
  return (
    <svg
      style={{ position: "absolute", width: 0, height: 0, display: "none" }}
      aria-hidden="true"
    >
      <defs>
        {/* ------------------------------------------------
            Nadeshiko flower -- id="nd"
            Geometric abstraction: 5 petals at 72 deg intervals.
            Each petal is a pair of slim ellipses angled apart
            by ~8 deg to suggest the fringed/split petal tip.
            A small center circle anchors the composition.
            Total primitives: 11 (5x2 + 1)
            ------------------------------------------------ */}
        <g id="nd">
          {/* Petal 1 — 0 deg */}
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(-4)" />
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(4)" opacity=".75" />
          {/* Petal 2 — 72 deg */}
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(68)" />
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(76)" opacity=".75" />
          {/* Petal 3 — 144 deg */}
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(140)" />
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(148)" opacity=".75" />
          {/* Petal 4 — 216 deg */}
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(212)" />
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(220)" opacity=".75" />
          {/* Petal 5 — 288 deg */}
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(284)" />
          <ellipse cx="0" cy="-14" rx="3" ry="12" transform="rotate(292)" opacity=".75" />
          {/* Center */}
          <circle cx="0" cy="0" r="3.5" opacity=".5" />
        </g>

        {/* ------------------------------------------------
            Single nadeshiko petal -- id="ndp"
            Slim ellipse for scattered / drifting petal elements
            in midground and background layers. Narrower than
            dahlia petals to maintain the delicate silhouette.
            ------------------------------------------------ */}
        <g id="ndp">
          <ellipse cx="0" cy="0" rx="3.5" ry="9" />
        </g>

        {/* ------------------------------------------------
            Leaf -- id="ndf"
            Nadeshiko leaves are narrow and lance-shaped.
            Ellipse body + thin center vein stroke.
            Proportions are slimmer than dahlia leaves.
            ------------------------------------------------ */}
        <g id="ndf">
          <ellipse cx="0" cy="0" rx="5" ry="16" />
          <line
            x1="0"
            y1="-14"
            x2="0"
            y2="14"
            stroke="var(--color-bg-cream)"
            strokeWidth="0.8"
            opacity="0.3"
          />
        </g>
      </defs>
    </svg>
  );
}
