import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { submissionsCol } from './firebase-init.js';

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const gallery = document.getElementById('gallery');
const empty = document.getElementById('empty');

onSnapshot(query(submissionsCol, orderBy('timestamp', 'desc')), (snap)=>{
  const items = snap.docs.map(d => d.data());

  if(items.length === 0){
    gallery.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  gallery.innerHTML = items.map(t => `
    <div class="card">
      <h3>${escapeHtml(t.team)}</h3>
      <p>${escapeHtml(t.desc)}</p>
      <a class="open-link" href="${escapeHtml(t.link)}" target="_blank" rel="noopener">Open project ↗</a>
    </div>
  `).join('');
}, (err)=>{ console.error('submissions listener error', err); });
