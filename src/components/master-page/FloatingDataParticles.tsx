const PARTICLE_DELAYS_SECONDS = [0, 1, 2, 3, 4, 5];

/**
 * Decorative "floating data particle" background layer shared by HeroSection
 * and the contribute-handbook page. Renders one `.data-particle` div per
 * delay step; the animation itself is driven by CSS using the `--delay`
 * custom property.
 */
export default function FloatingDataParticles() {
  return (
    <div className="absolute inset-0">
      {PARTICLE_DELAYS_SECONDS.map((delay) => (
        <div
          key={delay}
          className="data-particle"
          style={{ "--delay": `${delay}s` } as React.CSSProperties}
        ></div>
      ))}
    </div>
  );
}
