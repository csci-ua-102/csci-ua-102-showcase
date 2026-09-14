// This is the actual tsParticles library (v4), not a reimplementation —
// options copied verbatim from the reference site's ParticlesContainer.tsx.
// Only change from their version: fullScreen is true here instead of a
// bounded hero-section div, since this page doesn't have their specific
// two-column hero layout — same engine, same physics, same values.
const particlesOptions = {
  fullScreen: { enable: true, zIndex: 0 },
  background: {
    color: { value: "transparent" }
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onClick: { enable: false, mode: "push" },
      onHover: { enable: true, mode: "repulse" },
      resize: true
    },
    modes: {
      push: { quantity: 90 },
      repulse: { distance: 200, duration: 0.4 }
    }
  },
  particles: {
    color: { value: "#e68e2e" },
    links: {
      color: "#f5d393",
      distance: 150,
      enable: true,
      opacity: 0.5,
      width: 1
    },
    collisions: { enable: true },
    move: {
      direction: "none",
      enable: true,
      outModes: { default: "bounce" },
      random: false,
      speed: 1,
      straight: false
    },
    number: {
      density: { enable: true, width: 800 },
      value: 80
    },
    opacity: { value: 0.5 },
    shape: { type: "circle" },
    size: { value: { min: 1, max: 5 } }
  },
  detectRetina: true
};

(async () => {
  await loadFull(tsParticles);
  await tsParticles.load({ id: "tsparticles-bg", options: particlesOptions });
})();
