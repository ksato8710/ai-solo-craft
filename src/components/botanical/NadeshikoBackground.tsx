/**
 * NadeshikoBackground -- Far layer (environment layer).
 *
 * L2 Path spec:
 *   - Container opacity: 0.15
 *   - 8-12 scattered elements (nadeshiko petals + leaves)
 *   - Small scale, individual opacity 0.3-0.5
 *   - Positioned along viewport edges, avoiding center
 *   - pointer-events-none, aria-hidden
 *
 * Total SVG elements: 10 (within the <= 30 page budget)
 */
export default function NadeshikoBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      style={{ opacity: 0.16 }}
      aria-hidden="true"
    >
      {/* --- Nadeshiko petals and leaves scattered at edges --- */}

      {/* Top-left corner -- petal */}
      <svg
        className="absolute"
        style={{ top: "5%", left: "3%", width: 18, transform: "rotate(-30deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" opacity="0.4" />
      </svg>

      {/* Top-center-left -- small leaf */}
      <svg
        className="absolute"
        style={{ top: "8%", left: "18%", width: 20, transform: "rotate(20deg)" }}
        viewBox="-12 -22 24 44"
        fill="var(--color-accent-leaf)"
      >
        <use href="#ndf" opacity="0.35" />
      </svg>

      {/* Top-right area -- petal */}
      <svg
        className="absolute"
        style={{ top: "6%", right: "5%", width: 16, transform: "rotate(40deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko-hot)"
      >
        <use href="#ndp" opacity="0.45" />
      </svg>

      {/* Left edge, upper-mid -- leaf */}
      <svg
        className="absolute"
        style={{ top: "28%", left: "2%", width: 22, transform: "rotate(-55deg)" }}
        viewBox="-12 -22 24 44"
        fill="var(--color-accent-sage)"
      >
        <use href="#ndf" opacity="0.3" />
      </svg>

      {/* Left edge, mid-height -- petal */}
      <svg
        className="absolute"
        style={{ top: "48%", left: "3%", width: 14, transform: "rotate(65deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" opacity="0.45" />
      </svg>

      {/* Right edge, upper-mid -- petal */}
      <svg
        className="absolute"
        style={{ top: "32%", right: "3%", width: 15, transform: "rotate(-45deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko-hot)"
      >
        <use href="#ndp" opacity="0.4" />
      </svg>

      {/* Right edge, lower-mid -- leaf */}
      <svg
        className="absolute"
        style={{ bottom: "30%", right: "2%", width: 18, transform: "rotate(75deg)" }}
        viewBox="-12 -22 24 44"
        fill="var(--color-accent-leaf)"
      >
        <use href="#ndf" opacity="0.35" />
      </svg>

      {/* Bottom-left area -- petal */}
      <svg
        className="absolute"
        style={{ bottom: "10%", left: "6%", width: 16, transform: "rotate(130deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko)"
      >
        <use href="#ndp" opacity="0.5" />
      </svg>

      {/* Bottom-right corner -- leaf */}
      <svg
        className="absolute"
        style={{ bottom: "8%", right: "7%", width: 20, transform: "rotate(-15deg)" }}
        viewBox="-12 -22 24 44"
        fill="var(--color-accent-sage)"
      >
        <use href="#ndf" opacity="0.3" />
      </svg>

      {/* Bottom-center-right -- petal */}
      <svg
        className="absolute"
        style={{ bottom: "14%", right: "20%", width: 12, transform: "rotate(-85deg)" }}
        viewBox="-10 -15 20 30"
        fill="var(--color-nadeshiko-hot)"
      >
        <use href="#ndp" opacity="0.4" />
      </svg>
    </div>
  );
}
