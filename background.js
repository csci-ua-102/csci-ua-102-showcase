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
  }
  window.addEventListener('resize', resize);
  resize();

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

    // dense triangulated clusters (not an even spread) — 2-3 blobs of nodes,
    // each node connected to its 2-3 nearest neighbors within the cluster
    const clusterCenters = [
      { x: W*0.28, y: H*0.28 },
      { x: W*0.82, y: H*0.35 },
    ];
    clusters = clusterCenters.map(center => {
      const count = 16;
      const spread = Math.min(W,H) * 0.16;
      const nodes = Array.from({length: count}, () => ({
        x: center.x + (Math.random()-0.5) * spread * 2,
        y: center.y + (Math.random()-0.5) * spread * 2,
        vx: (Math.random()-0.5)*0.08,
        vy: (Math.random()-0.5)*0.08
      }));
      const edges = [];
      nodes.forEach((n, i) => {
        const dists = nodes
          .map((o, j) => ({ j, d: i===j ? Infinity : Math.hypot(n.x-o.x, n.y-o.y) }))
          .sort((a,b) => a.d - b.d)
          .slice(0, 3);
        dists.forEach(d => edges.push({ a: i, b: d.j, pt: Math.random() }));
      });
      return { nodes, edges };
    });
  }
  initScene();

  function draw(){
    t += 1;
    ctx.clearRect(0,0,W,H);

    // red ink splatters, drawn first so everything else sits on top
    splatters.forEach(s => {
      const grad = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r);
      grad.addColorStop(0, `rgba(200,40,30,${s.a})`);
      grad.addColorStop(1, 'rgba(200,40,30,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    });

    // distant stars
    stars.forEach(s => {
      const tw = 0.5 + 0.5*Math.sin(t*0.02*s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${(0.08+0.3*tw).toFixed(3)})`;
      ctx.fill();
    });

    // clustered triangulated meshes
    clusters.forEach(cluster => {
      cluster.nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy;
      });
      ctx.lineWidth = 1;
      cluster.edges.forEach(e => {
        const a = cluster.nodes[e.a], b = cluster.nodes[e.b];
        ctx.strokeStyle = 'rgba(224,196,150,0.22)';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();

        e.pt += 0.0025;
        if(e.pt > 1) e.pt = 0;
        const px = a.x + (b.x-a.x)*e.pt;
        const py = a.y + (b.y-a.y)*e.pt;
        ctx.beginPath();
        ctx.arc(px, py, 1.6, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(241,68,46,0.6)';
        ctx.fill();
      });
      cluster.nodes.forEach(n => {
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
