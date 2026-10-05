'use strict';
// Chord finder: select a note on the fretboard to see chords built on it as the root.
// Strings 6, 5, 4: root-position shapes with the selected note in the bass.
// Strings 3, 2, 1: compact top-string shapes containing the selected note as the root;
// when another chord tone is lowest, the chord is named as a slash chord (C/E, C/G).
const finderTypes=[
 {family:'Major',symbol:''},{family:'Minor',symbol:'m'},{family:'7',symbol:'7'},{family:'Major 7',symbol:'maj7'},{family:'Minor 7',symbol:'m7'},
 {family:'Major 6',symbol:'6'},{family:'Minor 6',symbol:'m6'},{family:'mM7',symbol:'m(maj7)'},{family:'Sus 2',symbol:'sus2'},{family:'Sus 4',symbol:'sus4'},
 {family:'7 Sus 4',symbol:'7sus4'},{family:'Diminished',symbol:'dim'},{family:'Diminished 7',symbol:'dim7'},{family:'Half-diminished 7',symbol:'m7♭5'},
 {family:'Augmented',symbol:'aug'},{family:'Augmented 7',symbol:'aug7'}
].map(t=>({...t,intervals:t.family==='Half-diminished 7'?[0,3,6,10]:families.find(f=>f.name===t.family).intervals}));
const finderNames=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
let finderNote=null, finderTab=0;
// Spell a chord tone from the root's letter: 3rds use the letter two steps up, 5ths four, and so on.
function spellTone(rootName,semitones,intervals){
 const degree={0:1,2:2,3:3,4:3,5:4,6:5,7:5,8:5,9:6,10:7,11:7}[semitones]+(semitones===9&&intervals.includes(6)&&!intervals.includes(7)?1:0);
 const letters='CDEFGAB',letter=letters[(letters.indexOf(rootName[0])+degree-1)%7];
 const rootPc=natural[rootName[0]]+(rootName[1]==='♯'?1:rootName[1]==='♭'?-1:0);
 let diff=mod(rootPc+semitones-natural[letter]);if(diff>6)diff-=12;
 return letter+(diff>0?'♯'.repeat(diff):'♭'.repeat(-diff));
}
// Tones a voicing must contain: all of a triad; four-note chords may drop a perfect 5th.
const requiredTones=t=>t.intervals.length>3?t.intervals.filter(i=>i!==7):t.intervals;
function fingersNeeded(shape){
 const played=shape.filter(f=>f>0);
 if(!played.length)return 0;
 const min=Math.min(...played),atMin=shape.map((f,i)=>f===min?i:-1).filter(i=>i>=0);
 let fingers=played.length;
 // One finger can barre the lowest fret only if every string under the barre is fretted at or above it.
 if(atMin.length>1&&shape.slice(atMin[0],atMin.at(-1)+1).every(f=>f>=min))fingers-=atMin.length-1;
 return fingers;
}
function chordVoicings(type,string,fret){
 const root=mod(tuning[string]+fret),need=requiredTones(type),found=[];
 const bass=string<=2;
 // String sets to search: bass strings use every string from the root up; treble strings use 3 or 4 adjacent top strings.
 const sets=bass?[[...Array(6-string)].map((_,i)=>string+i)]:(type.intervals.length===3?[[3,4,5],[2,3,4]]:[[2,3,4,5],[1,2,3,4]]).filter(set=>set.includes(string));
 const lo=Math.max(0,fret-3),hi=Math.min(24,fret+(bass?4:3));
 for(const set of sets){
  const options=set.map(i=>{
   if(i===string)return [fret];
   const frets=[];
   for(let f=lo;f<=hi;f++)if((f>0||fret<=4)&&type.intervals.includes(mod(tuning[i]+f-root)))frets.push(f);
   return bass?[-1,...frets]:frets;
  });
  const walk=(chosen)=>{
   if(chosen.length===set.length){
    const shape=Array(6).fill(-1);set.forEach((i,k)=>shape[i]=chosen[k]);
    const played=shape.map((f,i)=>f<0?-1:mod(tuning[i]+f-root));
    const tones=played.filter(p=>p>=0);
    if(tones.length<3||!need.every(n=>tones.includes(n)))return;
    if(!bass&&type.intervals.length===3&&new Set(tones).size<3)return;
    const fretted=shape.filter(f=>f>0),span=fretted.length?Math.max(...fretted)-Math.min(...fretted):0;
    if(span>3)return;
    const fingers=fingersNeeded(shape);
    if(fingers>4)return;
    const first=shape.findIndex(f=>f>=0),last=5-[...shape].reverse().findIndex(f=>f>=0);
    const gaps=shape.slice(first,last+1).filter(f=>f<0).length;
    const centre=fretted.length?(Math.max(...fretted)+Math.min(...fretted))/2:0;
    // Above fret 2, open strings mixed into a fretted shape are unusual, so they cost a little.
    const opens=fret>2?shape.filter(f=>f===0).length:0;
    const score=span*3+fingers*1.5+gaps*5+opens*1.5-(bass?tones.length*2:0)+Math.abs(centre-fret)*.4;
    found.push({shape,score,bass:played[first],tones});
    return;
   }
   for(const f of options[chosen.length])walk([...chosen,f]);
  };
  walk([]);
 }
 found.sort((a,b)=>a.score-b.score);
 // Keep distinct shapes: skip one that is a subset of, or differs on only one string from, a shape already chosen.
 const picked=[];
 for(const v of found){
  const notes=v.shape.map((f,i)=>f<0?null:i+':'+f).filter(Boolean);
  if(picked.some(p=>notes.every(n=>p.notes.includes(n))||v.shape.filter((f,i)=>f!==p.shape[i]).length<=1))continue;
  picked.push({...v,notes});
  if(picked.length===3)break;
 }
 return picked;
}
function finderChordName(type,rootName,bassInterval){
 const name=rootName+type.symbol;
 return bassInterval===0?name:`${name}/${spellTone(rootName,bassInterval,type.intervals)}`;
}
const inversionName=i=>i===0?'root position':[3,4].includes(i)?'1st inversion (3rd in the bass)':[6,7,8].includes(i)?'2nd inversion (5th in the bass)':'3rd inversion (7th in the bass)';
function renderFinder(){
 if(!finderNote)return;
 const {string,fret}=finderNote,root=mod(tuning[string]+fret),rootName=finderNames[root];
 document.getElementById('cf-title').textContent=`${rootName} · string ${6-string}, fret ${fret}`;
 document.getElementById('cf-sub').textContent=string<=2?`Chords with ${rootName} as the root, played from string ${6-string} with ${rootName} in the bass.`:`Compact top-string chords with this ${rootName} as the root. A slash name shows a different chord tone in the bass.`;
 const keyName=guideTonics[guideKey];
 document.getElementById('cf-tabs').innerHTML=finderTypes.map((t,i)=>`<button type="button" data-tab="${i}" aria-pressed="${finderTab===i}">${rootName}${t.symbol}</button>`).join('')+`<button type="button" data-tab="key" aria-pressed="${finderTab==='key'}">In ${keyName} major</button>`;
 // When the tab row scrolls sideways (phones), keep the selected tab in view.
 const tabs=document.getElementById('cf-tabs');
 if(tabs.scrollWidth>tabs.clientWidth)tabs.querySelector('[aria-pressed="true"]')?.scrollIntoView({inline:'nearest',block:'nearest'});
 const body=document.getElementById('cf-body');
 if(finderTab==='key'){
  const chords=keyChordShapes(guideKey).filter(c=>c.family.intervals.includes(mod(root-c.root)));
  const role=i=>i===0?'root':[3,4].includes(i)?'3rd':'5th';
  body.innerHTML=chords.length?`<p class="cf-note">Chords in ${keyName} major that contain ${rootName}:</p><div class="cf-grid">${chords.map(c=>`<figure><figcaption><strong>${c.name}</strong><span>${c.numeral} · ${rootName} is the ${role(mod(root-c.root))}</span></figcaption>${chordDiagram(c.shape,c.root,c.name)}</figure>`).join('')}</div>`:`<p class="cf-note">${rootName} is not in ${keyName} major, so none of its chords contain it. Pick another key on the circle, or use the chord tabs.</p>`;
  return;
 }
 const type=finderTypes[finderTab],voicings=chordVoicings(type,string,fret);
 body.innerHTML=voicings.length?`<p class="cf-note">${rootName}${type.symbol}: ${type.intervals.map(i=>spellTone(rootName,i,type.intervals)).join(' · ')}</p><div class="cf-grid">${voicings.map(v=>{const name=finderChordName(type,rootName,v.bass);const fretted=v.shape.filter(f=>f>0);return `<figure><figcaption><strong>${name}</strong><span>${string<=2?'root in the bass':inversionName(v.bass)}${fretted.length?` · fret ${Math.min(...fretted)}`:' · open'}</span></figcaption>${chordDiagram(v.shape,root,name)}</figure>`;}).join('')}</div>`:`<p class="cf-note">No compact ${rootName}${type.symbol} shape fits around this note in the current tuning. Try the same note on another string.</p>`;
}
function openFinder(string,fret){
 finderNote={string,fret};
 document.querySelectorAll('#notes-board .board-note.is-selected').forEach(n=>n.classList.remove('is-selected'));
 document.querySelector(`#notes-board .board-note[data-string="${string}"][data-fret="${fret}"]`)?.classList.add('is-selected');
 renderFinder();
 const dialog=document.getElementById('chord-finder');
 if(!dialog.open)dialog.showModal();
}
const board=document.getElementById('notes-board');
board.addEventListener('click',e=>{const n=e.target.closest('.board-note');if(n)openFinder(Number(n.dataset.string),Number(n.dataset.fret));});
// Roving focus: arrow keys move between notes, Enter or Space opens the chords.
board.addEventListener('keydown',e=>{
 const n=e.target.closest?.('.board-note');if(!n)return;
 const s=Number(n.dataset.string),f=Number(n.dataset.fret);
 if(e.key==='Enter'||e.key===' '){e.preventDefault();openFinder(s,f);return;}
 const move={ArrowRight:[0,1],ArrowLeft:[0,-1],ArrowUp:[1,0],ArrowDown:[-1,0]}[e.key];
 if(!move)return;
 e.preventDefault();
 const next=board.querySelector(`.board-note[data-string="${Math.min(5,Math.max(0,s+move[0]))}"][data-fret="${Math.min(24,Math.max(0,f+move[1]))}"]`);
 if(next){n.setAttribute('tabindex','-1');next.setAttribute('tabindex','0');next.focus();}
});
document.getElementById('cf-tabs').addEventListener('click',e=>{const t=e.target.closest('[data-tab]');if(!t)return;finderTab=t.dataset.tab==='key'?'key':Number(t.dataset.tab);renderFinder();});
const finderDialog=document.getElementById('chord-finder');
finderDialog.querySelector('.cf-close').addEventListener('click',()=>finderDialog.close());
// A click on the backdrop (outside the dialog box) closes it.
finderDialog.addEventListener('click',e=>{if(e.target===finderDialog)finderDialog.close();});
finderDialog.addEventListener('close',()=>document.querySelectorAll('#notes-board .board-note.is-selected').forEach(n=>n.classList.remove('is-selected')));
document.getElementById('tuning-select').addEventListener('change',()=>{if(finderDialog.open)renderFinder();});
