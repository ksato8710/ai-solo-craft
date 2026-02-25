/**
 * NadeshikoMidground -- Mid layer (drifting petals).
 *
 * L2 Path spec:
 *   - 4-6 nadeshiko petals with gentle-drift animation
 *   - Period: 15-20 seconds, staggered by 2-4s between each
 *   - Element opacity: 0.08-0.15
 *   - Positioned at viewport edges (not center)
 *   - Each petal has --drift-base set to a different rotation angle
 *   - pointer-events-none, aria-hidden
 *
 * Total SVG elements: 5 (petals via <use>)
 * Animations: 5 gentle-drift instances (within <= 12 budget)
 */
export default function NadeshikoMidground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      {/* Petal 1 -- upper-right edge, 15s drift */}
      <svg
        className="absolute animate-[gentle-drift_15s_ease-in-out_infinite]"
        style={
          {
            top: "12%",
            right: "6%",
            width: 24,
            opacity: 0.12,
            "--drift-base": "rotate(25deg)",
          } as React.CSSProperties
        }
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" />
      </svg>

      {/* Petal 2 -- left edge, upper-mid, 17s drift */}
      <svg
        className="absolute animate-[gentle-drift_17s_ease-in-out_infinite]"
        style={
          {
            top: "35%",
            left: "4%",
            width: 20,
            opacity: 0.09,
            "--drift-base": "rotate(-50deg)",
          } as React.CSSProperties
        }
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko-hot)"
      >
        <use href="#ndp" />
      </svg>

      {/* Petal 3 -- right edge, mid-height, 19s drift */}
      <svg
        className="absolute animate-[gentle-drift_19s_ease-in-out_infinite]"
        style={
          {
            top: "58%",
            right: "9%",
            width: 28,
            opacity: 0.08,
            "--drift-base": "rotate(70deg)",
          } as React.CSSProperties
        }
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" />
      </svg>

      {/* Petal 4 -- lower-left edge, 16s drift */}
      <svg
        className="absolute animate-[gentle-drift_16s_ease-in-out_infinite]"
        style={
          {
            bottom: "22%",
            left: "7%",
            width: 18,
            opacity: 0.15,
            "--drift-base": "rotate(-20deg)",
          } as React.CSSProperties
        }
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko-hot)"
      >
        <use href="#ndp" />
      </svg>

      {/* Petal 5 -- lower-right edge, slowest 20s drift */}
      <svg
        className="absolute animate-[gentle-drift_20s_ease-in-out_infinite]"
        style={
          {
            bottom: "12%",
            right: "5%",
            width: 22,
            opacity: 0.10,
            "--drift-base": "rotate(110deg)",
          } as React.CSSProperties
        }
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" />
      </svg>
    </div>
  );
}
