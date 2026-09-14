import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, writeBatch, onSnapshot, serverTimestamp, orderBy, query
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const submissionsCol = collection(db, 'submissions');
const rostersCol = collection(db, 'rosters');

const $ = id => document.getElementById(id);
function slugify(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'x'; }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function isUrl(s){ try{ new URL(s); return true; }catch(e){ return false; } }

/* ---------------- background: starfield + constellation + comets ---------------- */
(function(){
  const canvas = $('bg');
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

/* ---------------- dynamic member rows (name + NetID pairs, arbitrary count) ---------------- */
function addMemberRow(name = '', netid = ''){
  const wrap = document.createElement('div');
  wrap.className = 'member-row';
  wrap.innerHTML = `
    <input placeholder="" class="m-name" value="${escapeHtml(name)}">
    <input placeholder="" class="m-netid" value="${escapeHtml(netid)}">
    <button type="button" title="Remove">×</button>
  `;
  wrap.querySelector('button').addEventListener('click', ()=>{
    // never let it go below one row
    if($('a-members-rows').children.length > 1) wrap.remove();
  });
  $('a-members-rows').appendChild(wrap);
}
addMemberRow();
$('a-add-member').addEventListener('click', ()=> addMemberRow());

function collectMembers(){
  return Array.from($('a-members-rows').querySelectorAll('.member-row')).map(row => ({
    name: row.querySelector('.m-name').value.trim(),
    netid: row.querySelector('.m-netid').value.trim()
  })).filter(m => m.name && m.netid);
}

/* ---------------- live data (Firestore real-time listener, public collection only) ---------------- */
let submissionsCache = [];

onSnapshot(query(submissionsCol, orderBy('timestamp', 'desc')), (snap)=>{
  submissionsCache = snap.docs.map(d => ({ slug: d.id, ...d.data() }));
  render();
}, (err)=>{ console.error('submissions listener error', err); });

function render(){
  const tbody = $('rows');

  if(submissionsCache.length === 0){
    tbody.innerHTML = '';
    return;
  }

  tbody.innerHTML = submissionsCache.map(t => `
    <tr>
      <td><span class="teamname">${escapeHtml(t.team)}</span></td>
      <td>${escapeHtml(t.desc)}</td>
      <td><a href="${escapeHtml(t.link)}" target="_blank" rel="noopener">Open ↗</a></td>
    </tr>
  `).join('');
}

/* ---------------- add team (writes to two collections: public + private) ---------------- */
$('a-submit').addEventListener('click', async ()=>{
  const team = $('a-team').value.trim();
  const link = $('a-link').value.trim();
  const desc = $('a-desc').value.trim();
  const members = collectMembers();
  const msg = $('a-msg');

  if(!team || !link || members.length === 0){
    msg.textContent = 'Team name, at least one member (name + NetID), and a link are required.';
    msg.classList.add('show');
    return;
  }
  if(!isUrl(link)){
    msg.textContent = 'Link needs to be a full URL, e.g. https://…';
    msg.classList.add('show');
    return;
  }
  msg.classList.remove('show');

  const slug = slugify(team);
  try{
    const batch = writeBatch(db);
    batch.set(doc(submissionsCol, slug), {
      team, link, desc,
      timestamp: serverTimestamp()
    });
    batch.set(doc(rostersCol, slug), {
      members,
      timestamp: serverTimestamp()
    });
    await batch.commit();

    $('a-team').value=''; $('a-link').value=''; $('a-desc').value='';
    $('a-members-rows').innerHTML = ''; addMemberRow();
    // render() fires automatically via the submissions listener
  }catch(e){
    if(e.code === 'permission-denied'){
      msg.textContent = 'A team with that name already exists and submissions can\'t be edited — pick a different team name, or ask your TA to fix the existing one.';
    } else {
      msg.textContent = 'Could not save — try again.';
    }
    msg.classList.add('show');
    console.error(e);
  }
});
