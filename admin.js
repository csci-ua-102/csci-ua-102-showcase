import { doc, setDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import { db, submissionsCol, rostersCol } from './firebase-init.js';

const $ = id => document.getElementById(id);
function slugify(s){ return (s||'').toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') || 'x'; }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function isUrl(s){ try{ new URL(s); return true; }catch(e){ return false; } }

function addMemberRow(name = '', netid = ''){
  const wrap = document.createElement('div');
  wrap.className = 'member-row';
  wrap.innerHTML = `
    <input placeholder="" class="m-name" value="${escapeHtml(name)}">
    <input placeholder="" class="m-netid" value="${escapeHtml(netid)}">
    <button type="button" title="Remove">×</button>
  `;
  wrap.querySelector('button').addEventListener('click', ()=>{
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

    msg.style.color = 'var(--pointer)';
    msg.textContent = 'Added — check the public page to confirm.';
    msg.classList.add('show');

    $('a-team').value=''; $('a-link').value=''; $('a-desc').value='';
    $('a-members-rows').innerHTML = ''; addMemberRow();
  }catch(e){
    msg.style.color = 'var(--highlight)';
    if(e.code === 'permission-denied'){
      msg.textContent = 'A team with that name already exists and entries are immutable — edit directly in the Firebase console instead, or use a different team name.';
    } else {
      msg.textContent = 'Could not save — try again.';
    }
    msg.classList.add('show');
    console.error(e);
  }
});
