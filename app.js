import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { submissionsCol } from './firebase-init.js';

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const pillWrap = document.getElementById('pills');
const empty = document.getElementById('empty');

const tooltip = document.createElement('div');
tooltip.className = 'pill-tooltip';
document.body.appendChild(tooltip);

function showTooltip(el, text){
  tooltip.textContent = text;
  const r = el.getBoundingClientRect();
  tooltip.style.left = (r.left + r.width / 2) + 'px';
  tooltip.style.top = (r.top - 10) + 'px';
  tooltip.classList.add('show');
}
function hideTooltip(){ tooltip.classList.remove('show'); }

onSnapshot(query(submissionsCol, orderBy('timestamp', 'asc')), (snap)=>{
  const items = snap.docs.map(d => d.data());

  if(items.length === 0){
    pillWrap.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  pillWrap.innerHTML = '';
  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'pill';
    el.textContent = item.team;
    el.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    el.addEventListener('mouseenter', () => showTooltip(el, item.desc || item.team));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => window.open(item.link, '_blank', 'noopener'));
    pillWrap.appendChild(el);

    if(i < items.length - 1){
      const arrow = document.createElement('span');
      arrow.className = 'pill-arrow';
      arrow.textContent = '→';
      pillWrap.appendChild(arrow);
    }
  });
}, (err)=>{ console.error('submissions listener error', err); });
