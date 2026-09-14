(function(){
  const canvas = document.getElementById('bg');
  if(!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;
  const mouse = { x: -9999, y: -9999 };

  // Matches the reference site's actual tsParticles config:
  // particle color #e68e2e, link color #f5d393, link distance 150,
  // speed 1, size 1-5, opacity 0.5, hover = repulse.
  const PARTICLE_COLOR = '230,142,46';
  const LINK_COLOR = '245,211,147';
  const LINK_DIST = 150;
  const REPULSE_DIST = 100;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initParticles();
  }
  window.addEventListener('resize', resize);
  window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

  function initParticles(){
    // density-based count, similar in spirit to tsParticles' density.width option
    const count = Math.min(140, Math.floor((W * H) / 9000));
    particles = Array.from({length: count}, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      r: 1 + Math.random() * 4
    }));
  }
  resize();

  function draw(){
    ctx.clearRect(0, 0, W, H);

    particles.forEach(p => {
      // repulse from cursor
      const dx = p.x - mouse.x, dy = p.y - mouse.y;
      const distToMouse = Math.hypot(dx, dy);
      if(distToMouse < REPULSE_DIST){
        const force = (REPULSE_DIST - distToMouse) / REPULSE_DIST;
        p.x += (dx / distToMouse) * force * 3;
        p.y += (dy / distToMouse) * force * 3;
      }

      p.x += p.vx;
      p.y += p.vy;
      if(p.x < 0 || p.x > W) p.vx *= -1;
      if(p.y < 0 || p.y > H) p.vy *= -1;
      p.x = Math.max(0, Math.min(W, p.x));
      p.y = Math.max(0, Math.min(H, p.y));
    });

    // links recomputed every frame by live distance
    ctx.lineWidth = 1;
    for(let i = 0; i < particles.length; i++){
      for(let j = i + 1; j < particles.length; j++){
        const a = particles[i], b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if(d < LINK_DIST){
          const alpha = 0.5 * (1 - d / LINK_DIST);
          ctx.strokeStyle = `rgba(${LINK_COLOR},${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${PARTICLE_COLOR},0.5)`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
