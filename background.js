(function(){
  const canvas = document.getElementById('bg');
  if(!canvas) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduced) return;
  const ctx = canvas.getContext('2d');
  let W,H,stars,nodes,edges,comets=[],t=0;

  function resize(){
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function initScene(){
    const starCount = Math.floor((W*H)/6000);
    stars = Array.from({length:starCount}, ()=>({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.3 + 0.3,
      phase: Math.random()*Math.PI*2,
      speed: 0.6 + Math.random()*1.4
    }));

    const nodeCount = Math.max(12, Math.min(22, Math.floor((W*H)/85000)));
    nodes = Array.from({length:nodeCount}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      vx: (Math.random()-0.5)*0.12, vy: (Math.random()-0.5)*0.12
    }));
    edges = [];
    for(let i=0;i<nodes.length;i++){
      let best = -1, bd = Infinity;
      for(let j=0;j<nodes.length;j++){
        if(i===j) continue;
        const d = Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y);
        if(d < bd){ bd = d; best = j; }
      }
      if(best>=0) edges.push({a:i,b:best,pt:Math.random()});
    }
  }
  initScene();

  function maybeSpawnComet(){
    if(Math.random() < 0.006 && comets.length < 2){
      const fromLeft = Math.random() < 0.5;
      const y0 = Math.random()*H*0.6;
      comets.push({
        x: fromLeft ? -50 : W+50,
        y: y0,
        vx: (fromLeft ? 1 : -1) * (5 + Math.random()*3),
        vy: 2 + Math.random()*1.5,
        life: 1
      });
    }
  }

  function draw(){
    t += 1;
    ctx.clearRect(0,0,W,H);

    stars.forEach(s=>{
      const tw = 0.55 + 0.45*Math.sin(t*0.02*s.speed + s.phase);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${(0.15+0.55*tw).toFixed(3)})`;
      ctx.fill();
    });

    nodes.forEach(n=>{
      n.x += n.vx; n.y += n.vy;
      if(n.x<0||n.x>W) n.vx*=-1;
      if(n.y<0||n.y>H) n.vy*=-1;
    });
    ctx.lineWidth = 1;
    edges.forEach(e=>{
      const a = nodes[e.a], b = nodes[e.b];
      ctx.strokeStyle = 'rgba(255,255,255,0.07)';
      ctx.beginPath();
      ctx.moveTo(a.x,a.y);
      ctx.lineTo(b.x,b.y);
      ctx.stroke();

      e.pt += 0.003;
      if(e.pt > 1) e.pt = 0;
      const px = a.x + (b.x-a.x)*e.pt;
      const py = a.y + (b.y-a.y)*e.pt;
      ctx.beginPath();
      ctx.arc(px,py,1.8,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,180,120,0.55)';
      ctx.fill();
    });
    nodes.forEach(n=>{
      ctx.beginPath();
      ctx.arc(n.x,n.y,2,0,Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fill();
    });

    maybeSpawnComet();
    comets.forEach(c=>{
      const grad = ctx.createLinearGradient(c.x, c.y, c.x - c.vx*14, c.y - c.vy*14);
      grad.addColorStop(0, `rgba(255,255,255,${0.85*c.life})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(c.x, c.y);
      ctx.lineTo(c.x - c.vx*14, c.y - c.vy*14);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(c.x, c.y, 1.6, 0, Math.PI*2);
      ctx.fillStyle = `rgba(255,255,255,${c.life})`;
      ctx.fill();

      c.x += c.vx; c.y += c.vy;
      if(c.x < -80 || c.x > W+80 || c.y > H+80) c.life = 0;
    });
    comets = comets.filter(c => c.life > 0);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
