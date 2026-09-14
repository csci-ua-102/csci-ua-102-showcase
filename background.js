(function(){
  const canvas = document.getElementById('bg');
  if(!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  const ctx = canvas.getContext('2d');
  let W,H,stars,clusters,splatters,t=0;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    initScene();
  }
  window.addEventListener('resize', resize);

  function initScene(){
    // sparse distant stars — background texture, not the main event
    const starCount = Math.floor((W*H)/16000);
    stars = Array.from({length:starCount}, ()=>({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.1 + 0.3,
      phase: Math.random()*Math.PI*2,
      speed: 0.5 + Math.random()*1.2
    }));

    // static red ink-splatter blobs, corner-anchored like the reference
    splatters = [
      { x: W*0.02, y: H*0.05, r: Math.min(W,H)*0.22, a: 0.16 },
      { x: W*0.85, y: H*0.55, r: Math.min(W,H)*0.30, a: 0.10 },
    ];

    // bounded clusters of freely-drifting particles — this is how real
    // tsParticles "links" mode works: each frame, any two particles closer
    // than LINK_DIST get a line drawn between them, opacity fading with
    // distance. Nothing is fixed — connections form and break continuously
    // as particles move, which is what actually reads as "alive."
    const boxes = [
      { cx: W*0.28, cy: H*0.30, w: Math.min(W,H)*0.34, h: Math.min(W,H)*0.30 },
      { cx: W*0.82, cy: H*0.38, w: Math.min(W,H)*0.30, h: Math.min(W,H)*0.34 },
    ];
    clusters = boxes.map(box => {
      const count = 18;
      const nodes = Array.from({length: count}, () => ({
        x: box.cx + (Math.random()-0.5) * box.w,
        y: box.cy + (Math.random()-0.5) * box.h,
        vx: (Math.random()-0.5) * 0.5,
        vy: (Math.random()-0.5) * 0.5
      }));
      return { box, nodes };
    });
  }
  resize();

  const LINK_DIST = 130;

  function draw(){
    t += 1;
    ctx.clearRect(0,0,W,H);

    splatters.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, `rgba(200,40,30,${s.a})`);
      grad.addColorStop(1, 'rgba(200,40,30,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });

    stars.forEach(s => {
      const tw = 0.5 + 0.5*Math.sin(t*0.02*s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${(0.08+0.3*tw).toFixed(3)})`;
      ctx.fill();
    });

    clusters.forEach(cluster => {
      const { box, nodes } = cluster;
      const left = box.cx - box.w/2, right = box.cx + box.w/2;
      const top = box.cy - box.h/2, bottom = box.cy + box.h/2;

      // move + bounce within the bounding box, keeping the cluster compact
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
        if(n.x < left || n.x > right) n.vx *= -1;
        if(n.y < top || n.y > bottom) n.vy *= -1;
        n.x = Math.max(left, Math.min(right, n.x));
        n.y = Math.max(top, Math.min(bottom, n.y));
      });

      // recompute links every frame based on live distance — this is the
      // part that makes it feel dynamic rather than a fixed diagram
      ctx.lineWidth = 1;
      for(let i = 0; i < nodes.length; i++){
        for(let j = i+1; j < nodes.length; j++){
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x-b.x, a.y-b.y);
          if(d < LINK_DIST){
            const alpha = 0.28 * (1 - d/LINK_DIST);
            ctx.strokeStyle = `rgba(224,196,150,${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 2.2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,250,240,0.85)';
        ctx.fill();
      });
    });

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
