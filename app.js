import { onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { submissionsCol } from './firebase-init.js';

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

const tbody = document.getElementById('rows');
const empty = document.getElementById('empty');

onSnapshot(query(submissionsCol, orderBy('timestamp', 'asc')), (snap)=>{
  const items = snap.docs.map(d => d.data());

  if(items.length === 0){
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  const rows = items.map(t => `
    <tr>
      <td class="marker-col"><span class="marker-dot"></span></td>
      <td><span class="teamname">${escapeHtml(t.team)}</span></td>
      <td>${escapeHtml(t.desc)}</td>
      <td><a href="${escapeHtml(t.link)}" target="_blank" rel="noopener">Open ↗</a></td>
    </tr>
  `);

  // terminator row — the visual "NULL" at the end of the chain
  rows.push(`
    <tr class="null-row">
      <td class="marker-col"></td>
      <td colspan="3">NULL</td>
    </tr>
  `);

  tbody.innerHTML = rows.join('');
}, (err)=>{ console.error('submissions listener error', err); });
