import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, collection, doc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { firebaseConfig } from './firebase-config.js';
import { ROSTER } from './roster.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const submissionsCol = collection(db, 'submissions');
const votesCol = collection(db, 'votes');

const $ = id => document.getElementById(id);
function slugify(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'x'; }
function netidKey(s){ return (s||'').trim().toLowerCase(); }
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

/* ---------------- roster search / member picker ---------------- */
let selectedMembers = [];

function renderChips(){
  $('a-members-chips').innerHTML = selectedMembers.map(m => `
    <span class="chip">${escapeHtml(m.name)} (${escapeHtml(m.netid)})
      <button type="button" data-remove="${m.netid}">×</button>
    </span>
  `).join('');
  $('a-members-chips').querySelectorAll('[data-remove]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectedMembers = selectedMembers.filter(m => m.netid !== btn.dataset.remove);
      renderChips();
    });
  });
}

const rosterDropdown = document.createElement('div');
rosterDropdown.className = 'roster-dropdown';
document.body.appendChild(rosterDropdown);

function positionDropdown(){
  const rect = $('a-members-search').getBoundingClientRect();
  rosterDropdown.style.left = rect.left + 'px';
  rosterDropdown.style.top = (rect.bottom + 4) + 'px';
  rosterDropdown.style.width = Math.max(220, rect.width) + 'px';
}

function showRosterMatches(query){
  const q = query.trim().toLowerCase();
  const taken = new Set(selectedMembers.map(m=>m.netid));
  const matches = ROSTER.filter(r =>
    !taken.has(r.netid) &&
    (q === '' ? false : (r.name.toLowerCase().includes(q) || r.netid.toLowerCase().includes(q)))
  ).slice(0, 8);

  if(q === ''){ rosterDropdown.classList.remove('show'); return; }

  rosterDropdown.innerHTML = matches.length
    ? matches.map(r => `<div class="opt" data-netid="${r.netid}"><span>${escapeHtml(r.name)}</span><span class="rid">${escapeHtml(r.netid)}</span></div>`).join('')
    : '<div class="none">No matching student</div>';

  rosterDropdown.querySelectorAll('.opt').forEach(opt=>{
    opt.addEventListener('click', ()=>{
      const r = ROSTER.find(x => x.netid === opt.dataset.netid);
      if(r){ selectedMembers.push(r); renderChips(); }
      $('a-members-search').value = '';
      rosterDropdown.classList.remove('show');
      $('a-members-search').focus();
    });
  });
  positionDropdown();
  rosterDropdown.classList.add('show');
}

$('a-members-search').addEventListener('input', (e)=> showRosterMatches(e.target.value));
$('a-members-search').addEventListener('focus', (e)=> { if(e.target.value) showRosterMatches(e.target.value); });
document.addEventListener('click', (e)=>{
  if(!rosterDropdown.contains(e.target) && e.target.id !== 'a-members-search'){
    rosterDropdown.classList.remove('show');
  }
});
window.addEventListener('resize', positionDropdown);
window.addEventListener('scroll', positionDropdown, true);

/* ---------------- live data (Firestore real-time listeners) ---------------- */
let submissionsCache = [];
let votesCache = [];

onSnapshot(submissionsCol, (snap)=>{
  submissionsCache = snap.docs.map(d => ({ slug: d.id, ...d.data() }));
  render();
}, (err)=>{ console.error('submissions listener error', err); });

onSnapshot(votesCol, (snap)=>{
  votesCache = snap.docs.map(d => d.data());
  render();
}, (err)=>{ console.error('votes listener error', err); });

let expandedTeam = null;
let starPick = {};
let byTeamCache = {};

function render(){
  const tbody = $('rows');

  const oldPos = {};
  tbody.querySelectorAll('tr[data-team]').forEach(tr=>{
    oldPos[tr.dataset.team] = tr.getBoundingClientRect();
  });

  if(submissionsCache.length === 0){
    tbody.innerHTML = '';
    byTeamCache = {};
    return;
  }

  const byTeam = {};
  submissionsCache.forEach(s=>{
    byTeam[s.slug] = { ...s, members: Array.isArray(s.members) ? s.members : [], scores: [] };
  });
  votesCache.forEach(v=>{
    const t = byTeam[v.team];
    if(!t) return;
    const netids = t.members.map(m => netidKey(m.netid));
    if(!netids.includes(netidKey(v.voter))) t.scores.push(v.score);
  });
  byTeamCache = byTeam;

  const ranked = Object.values(byTeam).map(t=>({
    ...t,
    count: t.scores.length,
    avg: t.scores.length ? t.scores.reduce((a,b)=>a+b,0)/t.scores.length : 0
  })).sort((a,b)=> b.avg - a.avg || b.count - a.count);

  tbody.innerHTML = ranked.map((t,i)=>{
    const rows = [`
      <tr data-team="${t.slug}" class="${i===0 && t.count>0 ? 'first':''}">
        <td class="rank-cell">${i+1}</td>
        <td><span class="teamname">${escapeHtml(t.team)}</span></td>
        <td class="members-cell">
          <span class="name-list">${t.members.map(m=>escapeHtml(m.name)).join(', ')}</span>
          <span class="netid-list">${t.members.map(m=>escapeHtml(m.netid)).join(', ')}</span>
        </td>
        <td>${escapeHtml(t.desc)}</td>
        <td><a href="${escapeHtml(t.link)}" target="_blank" rel="noopener">Open ↗</a></td>
        <td class="score-cell">${t.count ? t.avg.toFixed(1) : '—'}</td>
        <td class="votes-cell">${t.count}</td>
        <td><button class="mini" data-toggle="${t.slug}">Vote</button></td>
      </tr>
    `];
    if(expandedTeam === t.slug){
      rows.push(`
        <tr class="vote-row" data-vote-for="${t.slug}">
          <td colspan="8">
            <div class="vote-form">
              <div class="field"><label>Your NetID</label><input id="vf-netid-${t.slug}"></div>
              <div class="field"><label>Score</label>
                <div class="stars-pick" data-stars="${t.slug}">
                  ${[1,2,3,4,5].map(n=>`<button data-v="${n}" class="${(starPick[t.slug]||0)>=n?'sel':''}">${n}</button>`).join('')}
                </div>
              </div>
              <button class="vote-submit" data-submit="${t.slug}">Submit vote</button>
              <div class="vote-status" id="vf-status-${t.slug}"></div>
            </div>
          </td>
        </tr>
      `);
    }
    return rows.join('');
  }).join('');

  tbody.querySelectorAll('tr[data-team]').forEach(tr=>{
    const slug = tr.dataset.team;
    const old = oldPos[slug];
    if(!old) return;
    const now = tr.getBoundingClientRect();
    const dy = old.top - now.top;
    if(Math.abs(dy) > 1){
      tr.style.transition = 'none';
      tr.style.transform = `translateY(${dy}px)`;
      requestAnimationFrame(()=>{
        tr.style.transition = 'transform .45s ease';
        tr.style.transform = 'translateY(0)';
      });
    }
  });

  attachRowHandlers();
}

function attachRowHandlers(){
  document.querySelectorAll('[data-toggle]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const slug = btn.dataset.toggle;
      expandedTeam = (expandedTeam === slug) ? null : slug;
      render();
    });
  });
  document.querySelectorAll('[data-stars]').forEach(group=>{
    const slug = group.dataset.stars;
    group.querySelectorAll('button').forEach(b=>{
      b.addEventListener('click', ()=>{
        starPick[slug] = parseInt(b.dataset.v,10);
        group.querySelectorAll('button').forEach(x=>{
          x.classList.toggle('sel', parseInt(x.dataset.v,10) <= starPick[slug]);
        });
      });
    });
  });
  document.querySelectorAll('[data-submit]').forEach(btn=>{
    btn.addEventListener('click', async ()=>{
      const slug = btn.dataset.submit;
      const netid = $('vf-netid-'+slug).value.trim();
      const score = starPick[slug] || 0;
      const status = $('vf-status-'+slug);
      if(!netid || !score){
        status.textContent = 'Enter your NetID and pick a score.';
        return;
      }

      const team = byTeamCache[slug];
      const voterKey = netidKey(netid);
      if(team && team.members.some(m => netidKey(m.netid) === voterKey)){
        status.textContent = "You're listed on this team — you can't vote for it.";
        return;
      }

      try{
        const voteId = voterKey + '_' + slug;
        await setDoc(doc(votesCol, voteId), {
          voter: voterKey,
          team: slug,
          score,
          timestamp: serverTimestamp()
        });
        expandedTeam = null;
        starPick[slug] = 0;
        // render() fires automatically via the votes listener
      }catch(e){
        if(e.code === 'permission-denied'){
          status.textContent = "That NetID has already voted for this team, or isn't eligible to.";
        } else {
          status.textContent = 'Could not save — try again.';
        }
        console.error(e);
      }
    });
  });
}

/* ---------------- add row ---------------- */
$('a-submit').addEventListener('click', async ()=>{
  const team = $('a-team').value.trim();
  const link = $('a-link').value.trim();
  const desc = $('a-desc').value.trim();
  const msg = $('a-msg');

  if(!team || !link || selectedMembers.length === 0){
    msg.textContent = 'Team name, at least one member, and a link are required.';
    msg.classList.add('show');
    return;
  }
  if(!isUrl(link)){
    msg.textContent = 'Link needs to be a full URL, e.g. https://…';
    msg.classList.add('show');
    return;
  }
  msg.classList.remove('show');

  try{
    const slug = slugify(team);
    await setDoc(doc(submissionsCol, slug), {
      team, link, desc,
      members: selectedMembers,
      memberNetids: selectedMembers.map(m => netidKey(m.netid)),
      timestamp: serverTimestamp()
    });
    $('a-team').value=''; $('a-link').value=''; $('a-desc').value='';
    selectedMembers = []; renderChips();
    // render() fires automatically via the submissions listener
  }catch(e){
    msg.textContent = 'Could not save — try again.';
    msg.classList.add('show');
    console.error(e);
  }
});
