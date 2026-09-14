import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { submissionsCol } from './firebase-init.js';

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const wrap = document.getElementById('tree-wrap');
const inner = document.getElementById('tree-inner');
const svg = document.getElementById('tree-edges');
const listWrap = document.getElementById('list-wrap');
const empty = document.getElementById('empty');

let currentView = 'tree';
let latestItems = [];

document.querySelectorAll('.view-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    currentView = btn.dataset.view;
    document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active', b===btn));
    wrap.style.display = currentView === 'tree' ? '' : 'none';
    listWrap.style.display = currentView === 'list' ? 'flex' : 'none';
    renderCurrentView();
  });
});

const COLORS = ['#49C9A6', '#FF8A5B', '#F5C84C', '#B491F0', '#5EC8F2'];
const LEVEL_HEIGHT = 130;
const MIN_GAP = 150;
const TOP_PAD = 60;

// Standard heap-array binary tree layout: node i's parent is
// floor((i-1)/2), children are 2i+1 and 2i+2. Position by depth
// (floor(log2(i+1))) and index within that depth level.
function layoutTree(n){
  if(n === 0) return { positions: [], width: 800, height: 200 };
  const depthOf = i => Math.floor(Math.log2(i + 1));
  const maxDepth = depthOf(n - 1);
  const deepestCount = Math.pow(2, maxDepth);
  const width = Math.max(760, deepestCount * MIN_GAP);
  const height = (maxDepth + 1) * LEVEL_HEIGHT + TOP_PAD + 40;

  const positions = [];
  for(let i = 0; i < n; i++){
    const depth = depthOf(i);
    const levelStart = Math.pow(2, depth) - 1;
    const indexInLevel = i - levelStart;
    const countInLevel = Math.pow(2, depth);
    const x = (indexInLevel + 0.5) / countInLevel * width;
    const y = depth * LEVEL_HEIGHT + TOP_PAD;
    positions.push({ x, y, depth });
  }
  return { positions, width, height };
}

// One reused tooltip element
const tooltip = document.createElement('div');
tooltip.className = 'tree-tooltip';
document.body.appendChild(tooltip);

function showTooltip(el, text){
  tooltip.textContent = text;
  const r = el.getBoundingClientRect();
  tooltip.style.left = (r.left + r.width / 2 - 120) + 'px';
  tooltip.style.top = (r.top - 12) + 'px';
  tooltip.style.transform = 'translateY(-100%)';
  tooltip.classList.add('show');
}
function hideTooltip(){ tooltip.classList.remove('show'); }

onSnapshot(query(submissionsCol, orderBy('timestamp', 'asc')), (snap)=>{
  latestItems = snap.docs.map(d => d.data());
  renderCurrentView();
}, (err)=>{ console.error('submissions listener error', err); });

function renderCurrentView(){
  if(latestItems.length === 0){
    inner.querySelectorAll('.tree-node').forEach(n => n.remove());
    svg.innerHTML = '';
    listWrap.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  if(currentView === 'tree') renderTree(latestItems);
  else renderLinkedList(latestItems);
}

function renderTree(items){
  const { positions, width, height } = layoutTree(items.length);

  inner.style.width = width + 'px';
  inner.style.height = height + 'px';
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  let edgesHtml = '';
  for(let i = 1; i < positions.length; i++){
    const parent = positions[Math.floor((i - 1) / 2)];
    const node = positions[i];
    edgesHtml += `<line x1="${parent.x}" y1="${parent.y}" x2="${node.x}" y2="${node.y}"/>`;
  }
  svg.innerHTML = edgesHtml;

  inner.querySelectorAll('.tree-node').forEach(n => n.remove());
  positions.forEach((pos, i) => {
    const item = items[i];
    const el = document.createElement('div');
    el.className = 'tree-node';
    el.style.left = pos.x + 'px';
    el.style.top = pos.y + 'px';
    el.style.background = COLORS[pos.depth % COLORS.length];
    el.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    el.style.animationDuration = (4 + Math.random() * 2.5).toFixed(2) + 's';
    el.textContent = item.team;

    el.addEventListener('mouseenter', () => showTooltip(el, item.desc || item.team));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => window.open(item.link, '_blank', 'noopener'));

    inner.appendChild(el);
  });
}

function renderLinkedList(items){
  listWrap.innerHTML = '';
  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'll-node';
    el.style.background = COLORS[i % COLORS.length];
    el.style.animationDelay = (-Math.random() * 5).toFixed(2) + 's';
    el.style.animationDuration = (4 + Math.random() * 2.5).toFixed(2) + 's';
    el.textContent = item.team;
    el.addEventListener('mouseenter', () => showTooltip(el, item.desc || item.team));
    el.addEventListener('mouseleave', hideTooltip);
    el.addEventListener('click', () => window.open(item.link, '_blank', 'noopener'));
    listWrap.appendChild(el);

    const arrow = document.createElement('span');
    arrow.className = 'll-arrow';
    arrow.textContent = '→';
    listWrap.appendChild(arrow);
  });
  const nullNode = document.createElement('div');
  nullNode.className = 'll-null';
  nullNode.textContent = 'NULL';
  listWrap.appendChild(nullNode);
}
