'use strict';
const guideTonics=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const majorSteps=[0,2,4,5,7,9,11];
const sharpWalk=['C','G','D','A','E','B','F♯','C♯'], flatWalk=['C','F','B♭','E♭','A♭','D♭','G♭','C♭'];
const walkModes=['sharps','flats'];
const tonicRoot=t=>mod(natural[t[0]]+(t.slice(1)==='♯'?1:t.slice(1)==='♭'?-1:0));
let guideKey=0, guideMode=document.getElementById('guide-mode').value||'sharps', guideStep=-1, guideTimer=null, guideEndTimer=null;
let guideTrail=[], guideSpeed=2800, guidePrevStep=null, guideWindowAngle=0, guideWindowShown=0, guideWindowFrame=null;
let guideChords=[];
// Accidentals in the major key signature, listed in standard order.
function keySignature(tonic){
 const notes=spellScale(tonic,majorSteps);
 const sharps=[...'FCGDAEB'].map(l=>notes.find(n=>n[0]===l&&n.includes('♯'))).filter(Boolean);
 const flats=[...'BEADGCF'].map(l=>notes.find(n=>n[0]===l&&n.includes('♭'))).filter(Boolean);
 const accidentals=sharps.length?sharps:flats;
 return {type:sharps.length?'sharp':flats.length?'flat':'none',count:accidentals.length,accidentals,notes};
}
const signatureText=sig=>sig.count?`${sig.count} ${sig.type}${sig.count===1?'':'s'}: ${sig.accidentals.join(' ')}`:'no sharps or flats';
const newNote=(from,to)=>spellScale(to,majorSteps).find(n=>!spellScale(from,majorSteps).includes(n));
function walkSteps(tonics,sharp){
 return tonics.map((name,i)=>{
  const sig=keySignature(name),key={root:tonicRoot(name),name};
  let text=i===0?`C major: no sharps or flats. Each step ${sharp?'clockwise goes up a fifth and adds one sharp':'counterclockwise goes up a fourth and adds one flat'}.`
   :`${name} major, a ${sharp?'fifth':'fourth'} above ${tonics[i-1]}, adds ${sig.accidentals.at(-1)}: ${signatureText(sig)}.`;
  if(i===7)text+=sharp?' Same sound as D♭ major (5 flats).':' Same sound as B major (5 sharps).';
  return {root:key.root,quality:'Major',degree:i?`${i}${sharp?'♯':'♭'}`:'0',name,text,key};
 });
}
// Open strings low to high, located on the circle; the move to each string is described by direction.
function stringSteps(homeKey){
 const names=tuning.map(n=>guideTonics[mod(n)]);
 const slice=pc=>mod(pc*7);
 return names.map((name,i)=>{
  const pc=mod(tuning[i]),string=6-i;
  let text=`String ${string}: ${name}.`;
  if(i===0)text+=' Follow the open strings around the circle.';
  else{
   const d=mod(slice(pc)-slice(mod(tuning[i-1])));
   text+=d===11?` One slice counterclockwise from ${names[i-1]}: a fourth higher.`:d===1?` One slice clockwise from ${names[i-1]}: a fifth higher.`:d===0?` The same slice as ${names[i-1]}.`:` ${Math.min(d,12-d)} slices ${d<=6?'clockwise':'counterclockwise'} from ${names[i-1]}: the pattern breaks here.`;
  }
  if(i===5)text+=' Keys on these neighbouring slices ring the most open strings.';
  return {root:pc,quality:'Major',degree:`string ${string}`,name,text,key:homeKey,outer:true,noShape:true};
 });
}
const sliceOf=pc=>mod(pc*7);
const sharedNotes=(a,b)=>majorSteps.filter(x=>majorSteps.some(y=>mod(b+y)===mod(a+x))).length;
// Root movement on the circle, used to narrate progressions.
function describeMove(from,to){
 const d=mod(sliceOf(to)-sliceOf(from));
 return d===0?'same root':d===1?'root one slice clockwise (up a fifth)':d===11?'root one slice counterclockwise (down a fifth)':`root ${Math.min(d,12-d)} slices ${d<6?'clockwise':'counterclockwise'}`;
}
const suffixes={'Major':'','Minor':'m','7':'7','Major 7':'maj7','Minor 7':'m7'};
const progressions={
 pop:{steps:[[0,'Major','I'],[4,'Major','V'],[5,'Minor','vi'],[3,'Major','IV']],first:'I–V–vi–IV, the “pop” progression behind hundreds of hits.'},
 axis:{steps:[[5,'Minor','vi'],[3,'Major','IV'],[0,'Major','I'],[4,'Major','V']],first:'vi–IV–I–V: the pop progression started on vi, so it feels darker.'},
 fifties:{steps:[[0,'Major','I'],[5,'Minor','vi'],[3,'Major','IV'],[4,'Major','V']],first:'I–vi–IV–V, the 1950s doo-wop progression.'},
 jazz:{steps:[[1,'Minor 7','ii7'],[4,'7','V7'],[0,'Major 7','Imaj7']],first:'ii7–V7–Imaj7, the core of jazz: two steps counterclockwise to home.'},
 blues:{steps:[[0,'7','I7'],[3,'7','IV7'],[0,'7','I7'],[4,'7','V7'],[3,'7','IV7'],[0,'7','I7']],first:'12-bar blues: I7 for 4 bars, IV7 for 2, I7 for 2, then V7, IV7 and I7 for the last 2. Every chord is a dominant 7th.'}
};
function lessonSteps(key,mode){
 if(mode==='sharps')return walkSteps(sharpWalk,true);
 if(mode==='flats')return walkSteps(flatWalk,false);
 const major=spellScale(guideTonics[key],majorSteps);
 const minor=spellScale(guideTonics[key],[0,2,3,5,7,8,10]);
 const homeKey={root:key,name:major[0]};
 const chord=(offset,quality,degree,name,text,k=homeKey)=>({root:mod(key+offset),quality,degree,name,text,key:k});
 const home=()=>chord(0,'Major','I',major[0],`${major[0]} major is home (I).`);
 const finish=()=>chord(0,'Major','I',major[0],`Back home to ${major[0]}.`);
 if(mode==='strings')return stringSteps(homeKey);
 if(progressions[mode]){
  const def=progressions[mode];
  return def.steps.map(([degree,quality,numeral],i,all)=>{
   const root=mod(key+majorSteps[degree]),name=major[degree]+suffixes[quality];
   const text=i===0?`${name} (${numeral}). ${def.first}`:`${name} (${numeral}): ${describeMove(mod(key+majorSteps[all[i-1][0]]),root)}.`+(i===all.length-1&&degree===0?' Home.':'');
   return {root,quality,degree:numeral,name,text,key:homeKey};
  });
 }
 if(mode==='minor'){
  const h=spellScale(major[5],[0,2,3,5,7,8,11]);
  return [chord(9,'Minor','i',major[5]+'m',`${major[5]} minor: the relative minor of ${major[0]}, same signature.`),chord(2,'Minor','iv',major[1]+'m',`${major[1]}m (iv): ${describeMove(mod(key+9),mod(key+2))}.`),chord(4,'Minor','v',major[2]+'m',`${major[2]}m (v) from the plain minor scale: it pulls home only weakly.`),chord(4,'7','V7',major[2]+'7',`${major[2]}7 (V7): raise the 7th, ${major[4]} → ${h[6]} (harmonic minor). Now it leads strongly home. That is why minor-key songs usually use ${major[2]} or ${major[2]}7, not ${major[2]}m.`),chord(9,'Minor','i',major[5]+'m',`Back to ${major[5]}m.`)];
 }
 if(mode==='modulate4'){
  const target={root:mod(key+5),name:major[3]};
  return [home(),chord(2,'Minor','ii = vi',major[1]+'m',`${major[1]}m is ii in ${major[0]} and vi in ${major[3]}: the pivot chord.`),chord(0,'7','V7 of '+major[3],major[0]+'7',`${major[0]}7 is V7 of ${major[3]}. Its 7th, ${newNote(major[0],major[3])}, is the one new note.`,target),chord(5,'Major','I in '+major[3],major[3],`Arrive in ${major[3]}, one slice counterclockwise: ${signatureText(keySignature(major[3]))}.`,target)];
 }
 if(mode==='modulateMinor'){
  const h=spellScale(major[5],[0,2,3,5,7,8,11]);
  return [home(),chord(2,'Minor','ii = iv',major[1]+'m',`${major[1]}m is ii in ${major[0]} and iv in ${major[5]} minor: the pivot.`),chord(4,'7','V7 of '+major[5]+'m',major[2]+'7',`${major[2]}7 is V7 of ${major[5]} minor; its ${h[6]} is the raised 7th.`),chord(9,'Minor','i in '+major[5]+'m',major[5]+'m',`Arrive in ${major[5]} minor: same slice and signature, new home note.`)];
 }
 if(mode==='distance'){
  return [0,1,2,3,4,5,6].map(d=>{
   const roots=[...new Set([mod(key+7*d),mod(key-7*d)])],names=roots.map(r=>guideTonics[r]).join(' and '),n=sharedNotes(key,roots[0]);
   const text=d===0?`${major[0]} major: 7 of its own notes. The badges count how many notes each key shares with ${major[0]}.`:d===6?`Opposite: ${names} shares only ${n} notes, the most distant key. A jump this far sounds abrupt.`:`${d} slice${d>1?'s':''} away: ${names} share${roots.length>1?'':'s'} ${n} of 7 notes.${d===1?' Changing key here sounds smooth.':''}`;
   return {root:roots[0],quality:'Major',degree:`${n} shared`,name:d?`±${d}`:'Home',text,key:homeKey,highlight:roots,distance:d,noShape:true,noMotion:true};
  });
 }
 if(mode==='circle'){
  const outer=step=>({...step,outer:true});
  return [outer(chord(4,'Minor','iii',major[2]+'m',`${major[2]}m (iii). Follow the chord roots on the outer ring: each move is one slice counterclockwise, down a fifth.`)),outer(chord(9,'Minor','vi',major[5]+'m',`${major[5]}m (vi), one slice counterclockwise.`)),outer(chord(2,'Minor','ii',major[1]+'m',`${major[1]}m (ii), one slice further.`)),outer(chord(7,'Major','V',major[4],`${major[4]} (V), the dominant, one slice from home.`)),outer(chord(0,'Major','I',major[0],`${major[0]} (I): home. iii–vi–ii–V–I is the circle progression behind countless jazz and pop songs.`))];
 }
 if(mode==='neighbours')return [chord(0,'Major','I',major[0],`${major[0]} is home. Its neighbours IV and V, with their inner minors, hold the key’s chords.`),chord(5,'Major','IV',major[3],`${major[3]} (IV), one slice counterclockwise. One note differs: ${newNote(major[0],major[3])} instead of ${major[6]}.`),chord(7,'Major','V',major[4],`${major[4]} (V), one slice clockwise. One note differs: ${newNote(major[0],major[4])} instead of ${major[3]}. V pulls back to I.`),chord(0,'Major','I',major[0],`Back to ${major[0]}. Neighbouring slices make I–IV–V smooth in any key.`)];
 if(mode==='modulate'){
  const target={root:mod(key+7),name:major[4]},lead=newNote(major[0],major[4]);
  return [home(),chord(9,'Minor','vi = ii',major[5]+'m',`${major[5]}m is vi in ${major[0]} and ii in ${major[4]}: a pivot chord shared by both keys.`),chord(2,'7','V7 of '+major[4],major[1]+'7',`${major[1]}7 is V7 of ${major[4]}. Its third, ${lead}, is the one new note.`,target),chord(7,'Major','I in '+major[4],major[4],`Arrive in ${major[4]}, one slice clockwise: ${signatureText(keySignature(major[4]))}.`,target)];
 }
 if(mode==='relative')return [home(),chord(9,'Minor','vi',major[5]+'m',`${major[5]} minor shares ${major[0]} major’s slice, notes and signature (${signatureText(keySignature(major[0]))}). Only the home note changes.`),finish()];
 if(mode==='parallel')return [home(),chord(0,'Minor','i',major[0]+'m',`${major[0]} minor: same tonic, but 3, 6 and 7 are lowered (${major[2]} → ${minor[2]}, ${major[5]} → ${minor[5]}, ${major[6]} → ${minor[6]}). It sits three slices counterclockwise, on the inner ring.`),finish()];
 if(mode==='dominant')return [home(),chord(9,'7','V7/ii',major[5]+'7',`${major[5]}7 is a secondary dominant pointing to ${major[1]}m (ii). Its third is outside the key.`),chord(2,'Minor','ii',major[1]+'m',`${major[5]}7 resolves to ${major[1]}m, one slice counterclockwise.`),chord(7,'7','V7',major[4]+'7',`${major[4]}7, the home dominant one slice clockwise of ${major[0]}, pulls back to I.`),finish()];
 return [home(),chord(5,'Major','IV',major[3],`${major[3]} major is IV, one slice counterclockwise.`),chord(5,'Minor','iv (borrowed)',minor[3]+'m',`Borrow ${minor[3]}m from ${minor[0]} minor: its third drops to ${minor[5]} (♭6). The tonic stays ${major[0]}.`),finish()];
}
function guideShape(step){
 const existing=renderedBasic.find(c=>c.root===step.root&&c.family.name===step.quality);
 return existing?existing.shape:alternateVoicings(families.find(f=>f.name===step.quality),[],step.root)[0];
}
function lessonIntro(mode){
 const m=spellScale(guideTonics[guideKey],majorSteps);
 return {
  sharps:'Sharps · clockwise: walk from C to C♯, adding one sharp per step. This walk always starts at C.',
  flats:'Flats · counterclockwise: walk from C to C♭, adding one flat per step. This walk always starts at C.',
  neighbours:`I–IV–V neighbours in ${m[0]}: see why the slices beside a key give its main chords.`,
  modulate:`Modulate to V: move from ${m[0]} to ${m[4]}, one slice clockwise, through a pivot chord.`,
  dominant:`Dominant resolution in ${m[0]}: dominant chords pulling one slice counterclockwise to their targets.`,
  relative:`Relative minor: ${m[0]} major and ${m[5]} minor share one slice and one key signature.`,
  parallel:`Parallel minor: ${m[0]} major and ${m[0]} minor share a tonic but not a signature.`,
  borrowed:`Borrowed chords: colour ${m[0]} major with a chord from ${m[0]} minor.`,
  circle:`Circle progression in ${m[0]}: iii–vi–ii–V–I, stepping counterclockwise all the way home.`,
  strings:'Open strings: find your guitar’s open strings on the circle, low to high.',
  pop:`Pop progression in ${m[0]}: I–V–vi–IV.`,axis:`vi–IV–I–V in ${m[0]}.`,fifties:`’50s progression in ${m[0]}: I–vi–IV–V.`,jazz:`Jazz ii–V–I in ${m[0]}, with 7th chords.`,blues:`12-bar blues in ${m[0]}: dominant 7ths on I, IV and V.`,
  minor:`Minor key harmony in ${m[5]} minor: why the V chord is usually major.`,
  modulate4:`Modulate to IV: move from ${m[0]} to ${m[3]}, one slice counterclockwise.`,
  modulateMinor:`Modulate to the relative minor: from ${m[0]} major to ${m[5]} minor.`,
  distance:`Key distance from ${m[0]}: how many notes other keys share with it.`
 }[mode]+' Press Play or Next step.';
}
function renderLesson(){
 guideChords=lessonSteps(guideKey,guideMode);
 guidePrevStep=null;
 document.getElementById('guide-progression').innerHTML=guideChords.map((step,i)=>`<button type="button" class="guide-chord" data-step="${i}" aria-label="Step ${i+1}: ${step.name}, ${step.degree}"><strong>${step.name}</strong><span>${step.degree}</span>${step.noShape?'':chordDiagram(guideShape(step),step.root,step.name)}</button>`).join('');
 if(guideStep>=0){guideStep=Math.min(guideStep,guideChords.length-1);updateLesson();}
 else showIdle();
 renderRules();renderKeyChords();
}
const onInner=step=>/^Minor/.test(step.quality)&&!step.outer;
const reduceMotion=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
// SVG transform attributes rotate about explicit points, which renders the same in every browser
// (CSS transform-origin on SVG groups does not). Numerals counter-rotate about their own anchors.
function drawWindow(angle){
 guideWindowShown=angle;
 const el=document.getElementById('circle-window');
 if(!el)return;
 el.setAttribute('transform',`rotate(${angle.toFixed(2)} 220 220)`);
 el.querySelectorAll('.window-numeral').forEach(n=>n.setAttribute('transform',`rotate(${(-angle).toFixed(2)} ${n.getAttribute('x')} ${n.getAttribute('y')})`));
}
// Rotate by the shortest way round, so F → C turns 30° rather than 330°.
function rotateWindow(root){
 const target=mod(root*7)*30;
 guideWindowAngle+=((target-guideWindowAngle)%360+540)%360-180;
 if(guideWindowFrame!==null)cancelAnimationFrame(guideWindowFrame);
 guideWindowFrame=null;
 const from=guideWindowShown,to=guideWindowAngle;
 if(typeof requestAnimationFrame!=='function'||reduceMotion()||from===to){drawWindow(to);return;}
 const start=performance.now();
 const frame=now=>{
  const t=Math.min(1,(now-start)/800),eased=t<.5?4*t**3:1-(2-2*t)**3/2;
  drawWindow(from+(to-from)*eased);
  guideWindowFrame=t<1?requestAnimationFrame(frame):null;
 };
 guideWindowFrame=requestAnimationFrame(frame);
}
function renderDistance(step){
 const layer=document.getElementById('circle-distance');
 if(!layer)return;
 if(!step||step.distance==null){layer.innerHTML='';return;}
 let s='';
 for(let i=0;i<12;i++){
  const root=mod(i*7),d=Math.min(mod(i-sliceOf(step.key.root)),mod(sliceOf(step.key.root)-i));
  if(d>step.distance)continue;
  const [x,y]=circlePt(127,i*Math.PI/6);
  s+=`<g class="dist-badge${d===step.distance?' is-new':''}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>${svgText(x.toFixed(1),y.toFixed(1),sharedNotes(step.key.root,root))}</g>`;
 }
 layer.innerHTML=s;
}
function stepCaption(step){
 if(walkModes.includes(guideMode))return guideStep>0?`+ ${keySignature(step.key.name).accidentals.at(-1)}`:'no ♯ / ♭';
 return step.degree;
}
function renderCaption(step){
 const center=document.getElementById('circle-center'),caption=document.getElementById('circle-caption');
 if(!center||!caption)return;
 if(!step){center.setAttribute('display','inline');caption.innerHTML='';return;}
 center.setAttribute('display','none');
 const name=step.name.length>5?13:step.name.length>3?17:22;
 caption.innerHTML=svgText(220,210,step.name,`class="caption-name" font-size="${name}"`)+svgText(220,236,stepCaption(step),'class="caption-detail"');
}
function renderMotion(prev,step){
 renderDistance(step);
 if(step.noMotion){const layer=document.getElementById('circle-motion');layer.classList.remove('is-clearing');layer.innerHTML='';return;}
 const [x,y]=circlePoint(step.root,onInner(step));
 const pulse=reduceMotion()?'':'<animate attributeName="r" values="17;34" dur="1.6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".9;0" dur="1.6s" repeatCount="indefinite"/>';
 let s=`<circle class="guide-halo" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="23">${pulse}</circle>`;
 if(!prev)guideTrail=[];
 // Earlier moves stay as a faint trail so the whole route remains visible.
 const trail=guideTrail.map(t=>`<path class="guide-trail" d="${t.d}"/><path class="guide-trail-head" d="M3 0L-9 -6.5L-9 6.5Z" transform="${t.head}"/>`).join('');
 if(prev&&!prev.noMotion){
  const p=circlePoint(prev.root,onInner(prev)),q=[x,y];
  if(Math.hypot(p[0]-q[0],p[1]-q[1])>1){
   // Short moves follow the ring; long moves bend toward the centre. Both stop short of the labels.
   const k=1.2-.7*Math.hypot(p[0]-q[0],p[1]-q[1])/298;
   const c=[220+((p[0]+q[0])/2-220)*k,220+((p[1]+q[1])/2-220)*k];
   const toward=(a,b,d)=>{const l=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return [a[0]+(b[0]-a[0])/l*d,a[1]+(b[1]-a[1])/l*d];};
   const a=toward(p,c,20),b=toward(q,c,24),f=v=>v.map(n=>n.toFixed(1)).join(' ');
   const angle=Math.atan2(b[1]-c[1],b[0]-c[0])*180/Math.PI;
   const d=`M${f(a)}Q${f(c)} ${f(b)}`,head=`translate(${f(b)}) rotate(${angle.toFixed(1)})`;
   s+=`<path class="guide-arrow" pathLength="1" d="${d}"/><path class="guide-arrowhead" d="M3 0L-9 -6.5L-9 6.5Z" transform="${head}"/>`;
   guideTrail=[...guideTrail,{d,head}].slice(-11);
  }
 }
 const layer=document.getElementById('circle-motion');
 layer.classList.remove('is-clearing');
 layer.innerHTML=trail+s;
}
// Open-chord keys and capo options. In a tuning lowered by `down`, a shape in key S sounds S − down; a capo adds its fret.
function guitarTip(keyName){
 const root=tonicRoot(keyName),down=selectedTuning.down%12;
 const options=['C','G','D','A','E'].map(shape=>({shape,capo:mod(root-tonicRoot(shape)+down)})).filter(o=>o.capo<=7).sort((a,b)=>a.capo-b.capo).slice(0,2);
 const say=o=>o.capo?`capo ${o.capo} with ${o.shape} shapes`:`open ${o.shape}-shape chords, no capo${o.shape===keyName?'':` (they sound as ${keyName} in this tuning)`}`;
 return (options[0].capo?'':'Open-chord friendly: ')+options.map(say).join(', or ')+'.';
}
function renderSignature(step){
 const sig=keySignature(step.key.name),prev=guidePrevStep?keySignature(guidePrevStep.key.name).accidentals:null;
 const relative=sig.notes[5];
 const chips=sig.count?sig.accidentals.map(a=>`<span class="sig-chip${prev&&!prev.includes(a)?' is-new':''}">${a}</span>`).join(''):'<span class="sig-none">No sharps or flats: natural notes only</span>';
 document.getElementById('guide-signature').innerHTML=`<p class="sig-head"><strong>${step.key.name} major</strong> / ${relative} minor ${sig.count?`<span>· ${sig.count} ${sig.type}${sig.count===1?'':'s'}</span>`:''}</p><div class="sig-chips" aria-label="Key signature">${chips}</div><p class="sig-guitar"><strong>Guitar:</strong> ${guitarTip(step.key.name)}</p>`;
}
// Tooltips name each key's role in the selected key, including the diminished vii°.
function updateKeyTitles(home){
 const m=spellScale(home.name,majorSteps),roles={major:{0:'I',5:'IV',7:'V'},minor:{2:'ii',4:'iii',9:'vi'}};
 document.querySelectorAll('#circle [data-ring]').forEach(g=>{
  const offset=mod(Number(g.dataset.root)-home.root),role=roles[g.dataset.ring][offset];
  let extra=role?` · ${role} in ${home.name} major`:'';
  if(g.dataset.ring==='minor'&&offset===11)extra=` · in ${home.name} major this root carries vii°: ${m[6]}° (diminished, not minor)`;
  const title=g.querySelector('title');
  if(title)title.textContent=g.dataset.title+extra;
 });
}
function highlightCircle(home,step){
 const inner=step&&onInner(step);
 document.querySelectorAll('#circle [data-major]').forEach(el=>{
  const root=Number(el.dataset.major);
  el.classList.toggle('guide-home',root===home.root);
  el.classList.toggle('guide-current',!!step&&!inner&&(step.highlight?step.highlight.includes(root):root===step.root));
 });
 document.querySelectorAll('#circle [data-minor]').forEach(el=>el.classList.toggle('guide-current-minor',!!inner&&Number(el.dataset.minor)===step.root));
 document.querySelectorAll('.guide-chord').forEach((el,i)=>{
  el.classList.toggle('is-current',!!step&&i===guideStep);
  el.setAttribute('aria-current',step&&i===guideStep?'step':'false');
 });
 updateKeyTitles(home);
}
// Idle: no lesson step. Only the selected key, its window and its signature are shown.
function showIdle(message){
 cancelLessonEnd();
 guideStep=-1;guidePrevStep=null;
 const key={root:guideKey,name:guideTonics[guideKey]};
 highlightCircle(key,null);
 const layer=document.getElementById('circle-motion');
 layer.innerHTML='';layer.classList.remove('is-clearing');
 renderDistance(null);
 renderCaption(null);guideTrail=[];
 renderSignature({key});
 rotateWindow(key.root);
 document.getElementById('guide-notes').innerHTML='';
 document.getElementById('guide-explanation').textContent=message||lessonIntro(guideMode);
 document.getElementById('guide-stop').disabled=true;
}
function updateLesson(){
 const step=guideChords[guideStep];
 const isMinor=step.quality==='Minor';
 highlightCircle(step.key,step);
 document.getElementById('guide-explanation').textContent=`${guideStep+1} / ${guideChords.length} · ${step.text}`;
 document.getElementById('guide-stop').disabled=false;
 renderSignature(step);
 renderCaption(step);
 renderMotion(guidePrevStep,step);
 rotateWindow(step.key.root);
 guidePrevStep=step;
 const parallel=guideMode==='parallel'&&isMinor;
 const notes=spellScale(guideTonics[guideKey],parallel?[0,2,3,5,7,8,10]:majorSteps);
 const noteBox=document.getElementById('guide-notes');
 if(guideMode==='relative'||guideMode==='parallel'){
  const ordered=guideMode==='relative'&&isMinor?[...notes.slice(5),...notes.slice(0,5)]:notes;
  noteBox.innerHTML=`<p>${isMinor?step.name+' · natural minor':guideTonics[guideKey]+' · major'} scale</p><div class="guide-note-row">${ordered.map((n,i)=>`<span class="${parallel&&[2,5,6].includes(i)?'lowered':''}">${n}<small>${parallel&&[2,5,6].includes(i)?'♭':''}${i+1}</small></span>`).join('')}</div>`;
 }else if(walkModes.includes(guideMode)||guideMode==='modulate'){
  const sig=keySignature(step.key.name);
  noteBox.innerHTML=`<p>${step.key.name} major scale</p><div class="guide-note-row">${sig.notes.map((n,i)=>`<span class="${sig.accidentals.includes(n)?'altered':''}">${n}<small>${i+1}</small></span>`).join('')}</div>`;
 }else noteBox.innerHTML='';
}
// Usage rules, with examples spelled for the selected key.
function renderRules(){
 const m=spellScale(guideTonics[guideKey],majorSteps),sig=keySignature(m[0]),strings=tuning.map(n=>guideTonics[mod(n)]).join(' ');
 const rule=(title,text,mode)=>`<li><strong>${title}.</strong> ${text} <button type="button" class="rule-show" data-mode="${mode}">Show me</button></li>`;
 document.getElementById('guide-rules').innerHTML=[
  rule('Key signature',`Read the number on the edge: ${m[0]} has ${signatureText(sig)}. Sharps always come in the order F C G D A E B (“Father Charles Goes Down And Ends Battle”); flats in reverse, B E A D G C F (“Battle Ends And Down Goes Charles’ Father”).`,sig.type==='flat'?'flats':'sharps'),
  rule('Relative minor',`The inner label in the same slice: ${m[0]} ↔ ${m[5]}m. Same notes and signature, different home note.`,'relative'),
  rule('Chords of the key',`Your slice and its two neighbours: I IV V outside, ii iii vi inside, vii° just past the window. In ${m[0]}: ${m[0]} ${m[3]} ${m[4]} · ${m[1]}m ${m[2]}m ${m[5]}m · ${m[6]}°.`,'neighbours'),
  rule('Progressions',`Counterclockwise moves resolve toward home: ${m[4]} → ${m[0]}. ii–V–I is two such steps: ${m[1]}m → ${m[4]} → ${m[0]}; the full circle progression is ${m[2]}m → ${m[5]}m → ${m[1]}m → ${m[4]} → ${m[0]}.`,'circle'),
  rule('Changing key',`Move one slice and only one note changes. ${m[0]} → ${m[4]}: ${m[3]} becomes ${newNote(m[0],m[4])}.`,'modulate'),
  rule('Guitar',`Your open strings (${strings}) sit on neighbouring slices, so nearby keys ring open strings. In ${m[0]}: ${guitarTip(m[0])}`,'strings')
 ].join('');
}
// Diatonic chords of the selected key, voiced either as open chords or within one fretboard position.
let keyChordStyle='open', keyChordStart=0;
const keyChordQualities=['Major','Minor','Minor','Major','Major','Minor','Diminished'];
const keyChordNumerals=['I','ii','iii','IV','V','vi','vii°'];
const fretted=shape=>shape.filter(f=>f>0);
const rootStringOf=(shape,root)=>shape.findIndex((f,i)=>f>=0&&mod(tuning[i]+f)===root);
// Root-position moveable shapes (root on string 6, 5 or 4), at both octaves of the root fret.
function positionCandidates(family,root){
 const index=families.indexOf(family),out=[];
 for(let j=0;j<3;j++){
  if(selectedTuning.drop&&j===0){out.push(...alternateVoicings(family,[],root,0).map(shape=>({shape,string:0})));continue;}
  for(const base of [mod(root-tuning[j]),mod(root-tuning[j])+12]){
   const shape=moveableShapes[index][j].map(f=>f<0?-1:f+base);
   if(Math.max(...shape)<=15)out.push({shape,string:j});
  }
 }
 return out;
}
function keyChordShapes(key){
 const m=spellScale(guideTonics[key],majorSteps);
 const chords=m.map((note,i)=>({name:note+(i===6?'°':keyChordQualities[i]==='Minor'?'m':''),numeral:keyChordNumerals[i],root:tonicRoot(note),family:families.find(f=>f.name===keyChordQualities[i])}));
 if(keyChordStyle==='open'){
  for(const c of chords){
   const basic=renderedBasic.find(b=>b.root===c.root&&b.family===c.family);
   c.shape=basic?basic.shape:alternateVoicings(c.family,[],c.root)[0];
  }
 }else{
  // The I chord fixes the position; every other chord takes the closest shape to it.
  const home=positionCandidates(chords[0].family,chords[0].root).filter(c=>c.string===keyChordStart).sort((a,b)=>Math.min(...fretted(a.shape))-Math.min(...fretted(b.shape)))[0];
  const low=Math.min(...fretted(home.shape)),high=low+4,centre=v=>{const f=fretted(v);return (Math.min(...f)+Math.max(...f))/2;};
  const cost=c=>{const f=fretted(c.shape);return Math.max(0,Math.max(...f)-high)*10+Math.max(0,low-1-Math.min(...f))*10+Math.abs(centre(c.shape)-centre(home.shape))+(c.string===2?.6:0);};
  chords[0].shape=home.shape;
  for(const c of chords.slice(1))c.shape=positionCandidates(c.family,c.root).sort((a,b)=>cost(a)-cost(b))[0].shape;
 }
 for(const c of chords){c.string=rootStringOf(c.shape,c.root);c.open=c.shape.some(f=>f===0);}
 return chords;
}
function renderKeyChords(){
 const box=document.getElementById('key-chords');
 if(!box)return;
 const chords=keyChordShapes(guideKey),m=spellScale(guideTonics[guideKey],majorSteps);
 document.getElementById('key-chords-title').textContent=`Chords in ${m[0]} major`;
 document.getElementById('key-chords-start').hidden=keyChordStyle!=='position';
 const f=chords.flatMap(c=>fretted(c.shape));
 document.getElementById('key-chords-note').textContent=(keyChordStyle==='open'?'Open-position shapes where possible, barre shapes elsewhere.':`Moveable shapes kept in one area of the neck (frets ${Math.min(...f)}–${Math.max(...f)}).`)+' Badge: the string carrying the root (R6 = low string).';
 box.innerHTML=chords.map(c=>`<figure class="key-chord"><figcaption><strong>${c.name}</strong><span>${c.numeral}</span></figcaption><span class="root-badge">R${6-c.string}${c.open?' · open':''}</span>${chordDiagram(c.shape,c.root,`${c.name}, ${c.numeral}, root on string ${6-c.string}`)}</figure>`).join('');
}
function cancelLessonEnd(){
 if(guideEndTimer!==null)clearTimeout(guideEndTimer);
 guideEndTimer=null;
}
function pauseGuide(){
 cancelLessonEnd();
 if(guideTimer!==null)clearInterval(guideTimer);
 guideTimer=null;
 document.getElementById('guide-play').textContent='Play';
}
function stopGuide(){pauseGuide();showIdle();}
// After the last step, fade the arrow and halo out, then return to the idle circle.
function finishLesson(){
 document.getElementById('circle-motion').classList.add('is-clearing');
 guideEndTimer=setTimeout(()=>{guideEndTimer=null;showIdle('Lesson complete. Press Play to watch again, or choose another lesson.');},400);
}
function startGuideTimer(){
 guideTimer=setInterval(()=>{
  guideStep++;updateLesson();
  // Last step: stop advancing, then clear the circle.
  if(guideStep===guideChords.length-1){
   clearInterval(guideTimer);guideTimer=null;
   document.getElementById('guide-play').textContent='Play';
   guideEndTimer=setTimeout(finishLesson,Math.max(3000,guideSpeed));
  }
 },guideSpeed);
}
function playGuide(){
 if(guideStep<0||guideStep===guideChords.length-1){guideStep=0;guidePrevStep=null;}
 pauseGuide();
 updateLesson();document.getElementById('guide-play').textContent='Pause';
 startGuideTimer();
}
function setGuideSpeed(ms){
 guideSpeed=ms;
 if(guideTimer!==null){clearInterval(guideTimer);startGuideTimer();}
}
function jumpGuide(index){
 pauseGuide();guideStep=index;
 if(index===0){guidePrevStep=null;guideTrail=[];}
 updateLesson();
}
// The circle's key also drives the scale maps and highlights its rows in the key tables.
function linkKey(key){
 document.querySelectorAll('#major-keys tbody tr, #minor-keys tbody tr').forEach(row=>row.classList.toggle('is-selected',row.sectionRowIndex===key));
}
function setGuideKey(key){
 pauseGuide();guideKey=key;guideStep=-1;
 document.getElementById('guide-key').value=String(key);
 if(scaleKey!==key)setScaleKey(key);
 linkKey(key);
 renderLesson();
}
function setGuideMode(mode){
 pauseGuide();guideMode=mode;guideStep=-1;
 document.getElementById('guide-mode').value=mode;
 renderLesson();
}
// Selecting a key on the circle selects it; during a running walk it jumps to that key's step.
function pickCircleKey(root){
 if(guideStep<0||!walkModes.includes(guideMode)){setGuideKey(root);return;}
 let index=guideChords.findIndex(s=>s.root===root);
 if(index<0){
  pauseGuide();guideMode=guideMode==='sharps'?'flats':'sharps';
  document.getElementById('guide-mode').value=guideMode;
  guideStep=0;renderLesson();
  index=guideChords.findIndex(s=>s.root===root);
 }
 jumpGuide(index);
}
document.getElementById('key-chords-controls').addEventListener('change',e=>{
 if(e.target.name==='key-chord-style')keyChordStyle=e.target.value;
 if(e.target.id==='key-chords-start-select')keyChordStart=Number(e.target.value);
 renderKeyChords();
});
document.getElementById('guide-key').innerHTML=guideTonics.map((n,i)=>`<option value="${i}">${n} major</option>`).join('');
document.getElementById('guide-key').addEventListener('change',e=>setGuideKey(Number(e.target.value)));
document.getElementById('guide-mode').addEventListener('change',e=>setGuideMode(e.target.value));
// The scale maps' key selector drives the circle too, so the two always show the same key.
function syncFromScaleKey(key){if(key!==guideKey)setGuideKey(key);}
document.getElementById('scale-key').addEventListener('change',e=>syncFromScaleKey(Number(e.target.value)));
document.getElementById('guide-play').addEventListener('click',()=>{if(guideTimer!==null)pauseGuide();else playGuide();});
document.getElementById('guide-next').addEventListener('click',()=>jumpGuide((guideStep+1)%guideChords.length));
document.getElementById('guide-reset').addEventListener('click',()=>{guidePrevStep=null;jumpGuide(0);});
document.getElementById('guide-stop').addEventListener('click',stopGuide);
document.getElementById('guide-speed').addEventListener('change',e=>setGuideSpeed(Number(e.target.value)));
document.getElementById('guide-progression').addEventListener('click',e=>{const button=e.target.closest('[data-step]');if(button)jumpGuide(Number(button.dataset.step));});
document.getElementById('guide-rules').addEventListener('click',e=>{const button=e.target.closest('[data-mode]');if(button){setGuideMode(button.dataset.mode);playGuide();}});
document.getElementById('circle').addEventListener('click',e=>{const key=e.target.closest('[data-pick]');if(key)pickCircleKey(Number(key.dataset.pick));});
document.getElementById('circle').addEventListener('keydown',e=>{
 const key=e.target.closest?.('[data-pick]');
 if(key&&(e.key==='Enter'||e.key===' ')){e.preventDefault();pickCircleKey(Number(key.dataset.pick));}
});
document.getElementById('tuning-select').addEventListener('change',()=>pauseGuide());
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseGuide();});
renderLesson();linkKey(guideKey);
// On phones the usage rules start collapsed so the lesson controls sit near the circle.
if(typeof matchMedia==='function'&&matchMedia('(max-width:650px)').matches)document.querySelector('.guide-rules')?.removeAttribute('open');
if(scaleKey!==guideKey)setScaleKey(guideKey);
