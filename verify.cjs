const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements={};
const context={document:{getElementById:id=>elements[id]??=( {innerHTML:'',textContent:'',addEventListener:()=>{},style:{setProperty(k,v){this[k]=v;}},classList:{add(){},remove(){},toggle(){}},attrs:{},setAttribute(k,v){this.attrs[k]=v;},querySelectorAll:()=>[],querySelector:()=>({addEventListener(){},classList:{add(){},remove(){}}})} )},console,assert};
vm.createContext(context);
vm.runInContext(fs.readFileSync('app.js','utf8')+`
let count=0;
renderedVoicings.forEach(({family:f,shapes})=>{
 assert.equal(shapes.length,7,f.name+' must have seven voicings');
 shapes.forEach((s,j)=>{
  const pitches=s.map((v,k)=>v<0?-1:mod(tuning[k]+v-9)).filter(v=>v>=0);
  const required=f.name==='Altered 7'?[0,4,10]:f.intervals.filter(x=>(x!==7||f.intervals.length===3)&&(!f.name.includes('13')||![2,5].includes(x))&&(!f.name.includes('11')||x!==2));
  assert.ok(pitches.every(p=>f.intervals.includes(p)),f.name+' '+j+' has a non-chord tone: '+pitches);
  assert.ok(required.every(p=>pitches.includes(p)),f.name+' '+j+' missing defining tone: '+pitches+' need '+required);
  if(j<3)assert.equal(mod(s[j]+tuning[j]),9,f.name+' root must be A on the specified string');
  count++;
 });
});
console.log(count+' moveable voicings checked');
const basicIntervals={'Major':[0,4,7],'Major 7':[0,4,7,11],'Dominant 7':[0,4,7,10],'Minor':[0,3,7],'Minor 7':[0,3,7,10]};
Object.entries(basicShapes).forEach(([name,shapes])=>shapes.forEach((shape,root)=>{
 const pitches=parseShape(shape).map((f,i)=>f<0?-1:mod(tuning[i]+f-root)).filter(p=>p>=0);
 assert.ok(pitches.every(p=>basicIntervals[name].includes(p)),name+' '+root+' has a non-chord tone');
 assert.ok(basicIntervals[name].filter(p=>p!==7).every(p=>pitches.includes(p)),name+' '+root+' missing a defining tone');
}));
assert.equal(spellScale('F♯',[0,2,4,5,7,9,11]).join(','),'F♯,G♯,A♯,B,C♯,D♯,E♯');
assert.equal(spellScale('B♭',[0,2,3,5,7,8,10]).join(','),'B♭,C,D♭,E♭,F,G♭,A♭');
const originalBoard=document.getElementById('notes-board').innerHTML;
const originalScales=document.getElementById('scale-charts').innerHTML;
for(const preset of tuningPresets){
 setTuning(preset.id);
 assert.equal(tuning[0],40-preset.down-(preset.drop?2:0));
 assert.equal(tuning[5],64-preset.down);
 const check=(family,shape,root)=>{
  assert.ok(shape && shape.length===6,preset.id+' missing '+family.name);
  const notes=shape.map((f,i)=>f<0?-1:mod(tuning[i]+f-root)).filter(n=>n>=0);
  assert.ok(notes.every(n=>family.intervals.includes(n)),preset.id+' '+family.name+' wrong note '+notes);
  const required=family.name==='Altered 7'?[0,4,10]:family.intervals.filter(n=>(n!==7||family.intervals.length===3)&&(!family.name.includes('13')||![2,5].includes(n))&&(!family.name.includes('11')||n!==2));
  assert.ok(required.every(n=>notes.includes(n)),preset.id+' '+family.name+' missing note');
 };
 assert.equal(renderedBasic.length,60);
 renderedBasic.forEach(({family,shape,root})=>check(family,shape,root));
 renderedVoicings.forEach(({family,shapes})=>{
  assert.equal(shapes.length,7);
  shapes.forEach((shape,j)=>{check(family,shape,9);if(j<3)assert.equal(mod(tuning[j]+shape[j]),9);});
 });
 if(preset.down===12&&!preset.drop){
  assert.equal(document.getElementById('notes-board').innerHTML,originalBoard);
  assert.equal(document.getElementById('scale-charts').innerHTML,originalScales);
  assert.ok(document.getElementById('tuning-notes').textContent.startsWith('E1'));
 }
 if(preset.drop||preset.down%12!==0)assert.notEqual(document.getElementById('notes-board').innerHTML,originalBoard);
 // Independently verify red roots at all string/fret positions for every key.
 for(let key=0;key<12;key++){
  setScaleKey(key);
  const actual=[...fretboard(scales[0].intervals,scales[0].labels).matchAll(/<rect x="([0-9]+)" y="([0-9]+)"[^>]*fill="#d9384c"/g)].map(m=>m[1]+','+m[2]);
  const expected=[];
  for(let row=0;row<6;row++)for(let fret=0;fret<=12;fret++)if((tuning[5-row]+fret)%12===key)expected.push((31+82*fret)+','+(17+28*row));
  assert.equal(actual.join(';'),expected.join(';'),preset.id+' scale roots in key '+key);
 }
 setScaleKey(0);
}
for(const scale of scales)setScaleVisible(scale.name,false);
assert.ok(document.getElementById('scale-charts').innerHTML.includes('Select a scale'));
setScaleVisible('Minor blues scale',true);
setScaleKey(3);
setTuning('drop-2');
assert.equal(scaleKey,3);
assert.equal(visibleScales.size,1);
assert.equal((document.getElementById('scale-charts').innerHTML.match(/class="board"/g)||[]).length,1);
assert.ok(document.getElementById('scale-charts').innerHTML.includes('D♯/E♭ · Minor blues scale'));
// New scales and reference fingerings (refs/*.png): C, root on string 6 at fret 8, rows listed string 1 → string 6.
setTuning('standard-0');setScaleKey(0);
const spelled=name=>spellScale('C',scales.find(s=>s.name===name).intervals).join(' ');
assert.equal(spelled('Dorian'),'C D E♭ F G A B♭');assert.equal(spelled('Phrygian'),'C D♭ E♭ F G A♭ B♭');
assert.equal(spelled('Lydian'),'C D E F♯ G A B');assert.equal(spelled('Mixolydian'),'C D E F G A B♭');
assert.equal(spelled('Locrian'),'C D♭ E♭ F G♭ A♭ B♭');assert.equal(spelled('Harmonic minor'),'C D E♭ F G A♭ B');
assert.equal(spelled('Melodic minor'),'C D E♭ F G A B');assert.equal(spelled('Natural minor scale (Aeolian)'),'C D E♭ F G A♭ B♭');
const refs={'Dorian':[[8],[8,10,11],[7,8,10],[7,8,10],[8,10],[8,10,11]],'Lydian':[[7,8],[7,8,10],[7,9],[7,9,10],[7,9,10],[8,10]],
 'Phrygian':[[8],[8,9,11],[8,10],[8,10,11],[8,10,11],[8,9,11]],'Harmonic minor':[[7,8],[8,9],[7,8,10],[9,10],[8,10,11],[8,10,11]],
 'Melodic minor':[[7,8],[8,10],[7,8,10],[7,9,10],[8,10],[8,10,11]],'Locrian':[[8],[9,11],[8,10,11],[8,10,11],[8,9,11],[8,9,11]],
 'Mixolydian':[[8],[8,10,11],[7,9,10],[7,8,10],[7,8,10],[8,10]],'Natural minor scale (Aeolian)':[[8],[8,9,11],[7,8,10],[8,10],[8,10,11],[8,10,11]]};
for(const [name,rows] of Object.entries(refs)){
 const got=scalePosition(scales.find(s=>s.name===name),0,8);
 const want=new Set(rows.flatMap((frets,row)=>frets.map(f=>(5-row)+','+f)));
 assert.deepEqual([...got].sort(),[...want].sort(),name+' position differs from the reference');
}
// Every root of every scale, key and tuning: the position spans all six strings and contains the selected root.
for(const preset of tuningPresets){setTuning(preset.id);for(let key=0;key<12;key++){setScaleKey(key);for(const sc of scales)for(let st=0;st<6;st++)for(let f=0;f<=24;f++){
 if(mod(tuning[st]+f-key)!==0)continue;
 const pos=scalePosition(sc,st,f),strings=new Set([...pos].map(k=>k[0]));
 assert.ok(pos.has(st+','+f)&&strings.size===6,preset.id+' '+key+' '+sc.name+' '+st+','+f);
 for(const k of pos){const [ps,pf]=k.split(',').map(Number);assert.ok(sc.intervals.includes(mod(tuning[ps]+pf-key)),'non-scale note '+k);}
}}}
setTuning('standard-0');setScaleKey(0);
// Selecting a root dims the rest and shows the summary; selecting it again clears it.
setScaleVisible('Major scale (Ionian)',true);toggleScalePosition('Major scale (Ionian)',0,8);
let charts=document.getElementById('scale-charts').innerHTML;
assert.ok(charts.includes('Position: root on string 6, fret 8')&&charts.includes('opacity=".2"')&&charts.includes('aria-pressed="true"'));
setScaleVisible('Major scale (Ionian)',true);toggleScalePosition('Major scale (Ionian)',0,8);
assert.ok(!document.getElementById('scale-charts').innerHTML.includes('opacity=".2"'));
toggleScalePosition('Major scale (Ionian)',0,8);setScaleKey(2);assert.equal(scalePositions.size,0,'key change clears positions');
setScaleKey(4);toggleScalePosition('Major scale (Ionian)',0,24);
assert.ok(document.getElementById('scale-charts').innerHTML.includes('(continues past fret 24)'));
scalePositions.clear();
setScaleKey(9);
for(const scale of scales)setScaleVisible(scale.name,!scale.off);
setScaleKey(9);
setTuning('standard-0');
console.log('Scale roots checked in all 12 keys × 26 tunings; filtering and selection persistence passed.');
console.log('Scales: 11 scales, 8 reference fingerings matched; every root position spans strings 6→1 in all keys and tunings.');
console.log('All 26 tunings: 5,564 chord diagrams, root positions and octave labels verified.');
`,context);
assert.equal((elements['basic-chart'].innerHTML.match(/class="chord"/g)||[]).length,60);
assert.equal((elements['scale-charts'].innerHTML.match(/class="board"/g)||[]).length,4);
for(const [id,el] of Object.entries(elements))assert.ok(!/undefined|NaN/.test(el.innerHTML),id);
console.log('60 basic diagrams, 4 scales, and rendered sections checked.');

context.document.querySelectorAll=()=>[];
context.document.addEventListener=()=>{};
context.setInterval=()=>1;
context.clearInterval=()=>{};
context.setTimeout=fn=>{fn();return 1;};
context.clearTimeout=()=>{};
vm.runInContext(fs.readFileSync('circle-guide.js','utf8')+`
// Idle on load: nothing animated, intro text shown.
assert.equal(guideStep,-1);
assert.equal(document.getElementById('circle-motion').innerHTML,'');
assert.ok(document.getElementById('guide-explanation').textContent.includes('Press Play'));
assert.ok(document.getElementById('guide-stop').disabled);
assert.equal(lessonSteps(0,'relative').map(s=>s.name).join(','),'C,Am,C');
assert.equal(lessonSteps(0,'parallel').map(s=>s.name).join(','),'C,Cm,C');
assert.equal(lessonSteps(0,'dominant').map(s=>s.name).join(','),'C,A7,Dm,G7,C');
assert.equal(lessonSteps(0,'borrowed').map(s=>s.name).join(','),'C,F,Fm,C');
assert.equal(lessonSteps(5,'dominant').map(s=>s.name).join(','),'F,D7,Gm,C7,F');
assert.equal(lessonSteps(4,'sharps').map(s=>s.name).join(','),'C,G,D,A,E,B,F♯,C♯');
assert.equal(lessonSteps(4,'flats').map(s=>s.name).join(','),'C,F,B♭,E♭,A♭,D♭,G♭,C♭');
assert.equal(lessonSteps(0,'neighbours').map(s=>s.name).join(','),'C,F,G,C');
assert.equal(lessonSteps(0,'modulate').map(s=>s.name).join(','),'C,Am,D7,G');
assert.equal(lessonSteps(5,'modulate').map(s=>s.name).join(','),'F,Dm,G7,C');
assert.deepEqual(lessonSteps(0,'modulate').map(s=>s.key.name),['C','C','G','G']);
assert.equal(keySignature('C♯').accidentals.join(' '),'F♯ C♯ G♯ D♯ A♯ E♯ B♯');
assert.equal(keySignature('C♭').accidentals.join(' '),'B♭ E♭ A♭ D♭ G♭ C♭ F♭');
assert.equal(keySignature('C').count,0);
assert.equal(keySignature('A♭').accidentals.join(' '),'B♭ E♭ A♭ D♭');
// Circle progression: iii–vi–ii–V–I, roots tracked on the outer ring, each move one slice counterclockwise.
const slice=pc=>mod(pc*7);
for(let key=0;key<12;key++){
 const steps=lessonSteps(key,'circle');
 assert.ok(steps.every(s=>s.outer));
 steps.slice(1).forEach((s,i)=>assert.equal(mod(slice(s.root)-slice(steps[i].root)),11,'circle progression key '+key));
}
assert.equal(lessonSteps(0,'circle').map(s=>s.name).join(','),'Em,Am,Dm,G,C');
assert.equal(lessonSteps(7,'circle').map(s=>s.name).join(','),'Bm,Em,Am,D,G');
// Open strings follow the tuning; the B string breaks the fourths pattern.
let strings=lessonSteps(0,'strings');
assert.equal(strings.map(s=>s.name).join(','),'E,A,D,G,B,E');
assert.ok(strings.every(s=>s.noShape&&s.outer));
assert.ok(strings[1].text.includes('counterclockwise')&&strings[4].text.includes('pattern breaks'));
setTuning('drop-0');strings=lessonSteps(0,'strings');
assert.equal(strings[0].name,'D');assert.ok(strings[1].text.includes('One slice clockwise'));
setTuning('standard-1');
assert.equal(lessonSteps(0,'strings').map(s=>s.name).join(','),'E♭,A♭,D♭,F♯,B♭,E♭');
assert.equal(guitarTip('E♭'),'Open-chord friendly: open E-shape chords, no capo (they sound as E♭ in this tuning), or capo 2 with D shapes.');
setTuning('standard-0');
// Capo advice in standard tuning.
assert.equal(guitarTip('C'),'Open-chord friendly: open C-shape chords, no capo, or capo 3 with A shapes.');
assert.equal(guitarTip('E♭'),'capo 1 with D shapes, or capo 3 with C shapes.');
assert.equal(guitarTip('F'),'capo 1 with E shapes, or capo 3 with D shapes.');
assert.equal(guitarTip('C♭'),'capo 2 with A shapes, or capo 4 with G shapes.');
for(const t of [...guideTonics,'C♯','C♭'])assert.ok(!/undefined|NaN/.test(guitarTip(t)),'tip '+t);
// Batch C lessons.
assert.equal(lessonSteps(0,'pop').map(s=>s.name).join(','),'C,G,Am,F');
assert.equal(lessonSteps(0,'axis').map(s=>s.name).join(','),'Am,F,C,G');
assert.equal(lessonSteps(0,'fifties').map(s=>s.name).join(','),'C,Am,F,G');
assert.equal(lessonSteps(7,'jazz').map(s=>s.name).join(','),'Am7,D7,Gmaj7');
assert.equal(lessonSteps(9,'blues').map(s=>s.name).join(','),'A7,D7,A7,E7,D7,A7');
assert.equal(lessonSteps(0,'minor').map(s=>s.name).join(','),'Am,Dm,Em,E7,Am');
assert.ok(lessonSteps(0,'minor')[3].text.includes('G → G♯'));
assert.equal(lessonSteps(0,'modulate4').map(s=>s.name).join(','),'C,Dm,C7,F');
assert.ok(lessonSteps(0,'modulate4')[2].text.includes('B♭'));
assert.deepEqual(lessonSteps(0,'modulate4').map(s=>s.key.name),['C','C','F','F']);
assert.equal(lessonSteps(0,'modulateMinor').map(s=>s.name).join(','),'C,Dm,E7,Am');
assert.ok(lessonSteps(0,'jazz').every(s=>s.quality!=='Minor 7'||onInner(s)));
const dist=lessonSteps(0,'distance');
assert.deepEqual(dist.map(s=>s.degree),['7 shared','6 shared','5 shared','4 shared','3 shared','2 shared','2 shared']);
assert.deepEqual(dist[1].highlight.sort(),[5,7]);assert.deepEqual(dist[6].highlight,[6]);
for(let a=0;a<12;a++)for(let b=0;b<12;b++){const d=Math.min(mod(sliceOf(b)-sliceOf(a)),mod(sliceOf(a)-sliceOf(b)));assert.equal(sharedNotes(a,b),[7,6,5,4,3,2,2][d]);}
assert.ok(lessonSteps(0,'pop')[1].text.includes('one slice clockwise'));
setGuideMode('distance');jumpGuide(2);
assert.equal((document.getElementById('circle-distance').innerHTML.match(/dist-badge/g)||[]).length,5);
assert.equal((document.getElementById('circle-distance').innerHTML.match(/is-new/g)||[]).length,2);
assert.equal(document.getElementById('circle-motion').innerHTML,'');
stopGuide();assert.equal(document.getElementById('circle-distance').innerHTML,'');
setGuideMode('pop');jumpGuide(0);jumpGuide(1);
assert.ok(document.getElementById('circle-motion').innerHTML.includes('guide-arrow'));
stopGuide();setGuideMode('relative');
// Batch D: trail, caption, speed.
setGuideMode('circle');setGuideKey(0);jumpGuide(0);
assert.equal(document.getElementById('circle-center').attrs.display,'none');
assert.ok(document.getElementById('circle-caption').innerHTML.includes('>Em<')&&document.getElementById('circle-caption').innerHTML.includes('>iii<'));
jumpGuide(1);jumpGuide(2);jumpGuide(3);
let motion=document.getElementById('circle-motion').innerHTML;
assert.equal((motion.match(/class="guide-trail"/g)||[]).length,2,'two earlier arrows in the trail');
assert.equal((motion.match(/class="guide-arrow"/g)||[]).length,1);
stopGuide();
assert.equal(document.getElementById('circle-center').attrs.display,'inline');
assert.equal(document.getElementById('circle-caption').innerHTML,'');
setGuideMode('sharps');jumpGuide(0);jumpGuide(1);
assert.ok(document.getElementById('circle-caption').innerHTML.includes('+ F♯'));
jumpGuide(0);assert.ok(!document.getElementById('circle-motion').innerHTML.includes('guide-trail'),'trail resets when starting over');
stopGuide();
let intervalMs=[];const realSetInterval=globalThis.setInterval;globalThis.setInterval=(fn,ms)=>{intervalMs.push(ms);return 1;};
setGuideSpeed(1600);playGuide();setGuideSpeed(4500);
assert.deepEqual(intervalMs,[1600,4500]);
stopGuide();setGuideSpeed(2800);globalThis.setInterval=realSetInterval;
// Batch E: the circle's key drives the scale maps.
setGuideKey(7);assert.equal(scaleKey,7);
assert.ok(document.getElementById('scale-charts').innerHTML.includes('G · Major scale'));
syncFromScaleKey(3);assert.equal(guideKey,3);assert.equal(document.getElementById('guide-key').value,'3');assert.equal(scaleKey,3);
assert.ok(document.getElementById('guide-signature').innerHTML.includes('E♭ major'));
setGuideKey(0);setGuideMode('relative');
// Chords in the key: correct tones, a root on the badged string, and one-position voicings stay compact.
for(const preset of tuningPresets){
 setTuning(preset.id);
 for(let key=0;key<12;key++)for(const [style,start] of [['open',0],['position',0],['position',1],['position',2]]){
  keyChordStyle=style;keyChordStart=start;
  const chords=keyChordShapes(key),label=preset.id+' '+guideTonics[key]+' '+style+start;
  assert.equal(chords.length,7,label);
  assert.equal(chords.map(c=>c.numeral).join(' '),'I ii iii IV V vi vii°');
  for(const c of chords){
   const tones=c.shape.map((f,i)=>f<0?-1:mod(tuning[i]+f-c.root)).filter(n=>n>=0);
   const need=c.family.name==='Diminished'?[0,3,6]:[0,c.family.name==='Minor'?3:4];
   assert.ok(tones.every(n=>c.family.intervals.includes(n))&&need.every(n=>tones.includes(n)),label+' '+c.name+' '+c.shape);
   assert.ok(c.string>=0&&mod(tuning[c.string]+c.shape[c.string])===c.root,label+' badge '+c.name);
  }
  if(style==='position'){
   assert.equal(chords[0].string,start,label+' I chord root string');
   const f=chords.flatMap(c=>fretted(c.shape));
   assert.ok(Math.max(...f)-Math.min(...f)<=7,label+' spread '+(Math.max(...f)-Math.min(...f)));
  }
 }
}
setTuning('standard-0');keyChordStyle='position';keyChordStart=0;
assert.equal(keyChordShapes(7).map(c=>c.shape.map(f=>f<0?'x':f).join('')).join(' '),'355433 577555 x24432 x35553 x57775 xx2453 2342xx');
keyChordStart=2;
assert.equal(keyChordShapes(7)[0].shape.map(f=>f<0?'x':f).join(''),'xx5787');
keyChordStart=0;keyChordStyle='open';
assert.equal(keyChordShapes(7).map(c=>c.name).join(' '),'G Am Bm C D Em F♯°');
assert.equal(keyChordShapes(7)[0].shape.join(','),'3,2,0,0,0,3');
renderKeyChords();
assert.equal((document.getElementById('key-chords').innerHTML.match(/class="key-chord"/g)||[]).length,7);
assert.ok(!/undefined|NaN/.test(document.getElementById('key-chords').innerHTML));
// Each walk step adds exactly one accidental, appended in standard order.
for(const mode of ['sharps','flats'])lessonSteps(0,mode).forEach((s,i,all)=>{
 const sig=keySignature(s.key.name);assert.equal(sig.count,i,mode+' '+s.name);
 if(i)assert.deepEqual(sig.accidentals.slice(0,-1),keySignature(all[i-1].key.name).accidentals);
 assert.ok(!s.text.includes('undefined'),mode+' text');
});
// Animation anchors sit on the visible labels of both rings.
const svg=document.getElementById('circle').innerHTML;
for(let root=0;root<12;root++)for(const minor of [false,true]){
 const [x,y]=circlePoint(root,minor).map(v=>v.toFixed(2));
 const label=[...svg.matchAll(/<text x="([-0-9.]+)" y="([-0-9.]+)"[^>]*>([^<]+)</g)].find(m=>Math.abs(m[1]-x)<.01&&Math.abs(m[2]-y)<.01);
 assert.ok(label,'no label at circlePoint '+root+' '+minor);
 const pc=tonicRoot(label[3].replace('m','').split(' ')[0]);
 assert.equal(pc,root,'circlePoint '+root+(minor?'m':'')+' lands on '+label[3]);
}
// Flat-side keys also show their sharp names.
for(const n of ['>G♯<','>D♯<','>A♯<','>A♯m<'])assert.ok(svg.includes(n),'sharp name '+n);
assert.ok(svg.includes('aria-label="B♭ major or A♯ major')||svg.includes('aria-label="B♭ or A♯ major'),'sharp name in the accessible label');
// Motion layer: halo only on the first step, then halo plus arrow; window turns the short way.
setGuideMode('dominant');setGuideKey(0);jumpGuide(0);
assert.equal((document.getElementById('circle-motion').innerHTML.match(/guide-halo/g)||[]).length,1);
assert.ok(!document.getElementById('circle-motion').innerHTML.includes('guide-arrow'));
jumpGuide(1);
assert.equal((document.getElementById('circle-motion').innerHTML.match(/class="guide-arrow"/g)||[]).length,1);
assert.ok(!/NaN|undefined/.test(document.getElementById('circle-motion').innerHTML+document.getElementById('guide-signature').innerHTML));
setGuideKey(5);const before=guideWindowAngle;setGuideKey(0);
assert.equal(guideWindowAngle-before,30,'F → C should rotate +30°');
// Stop and auto-finish both return to a clean idle circle.
jumpGuide(1);assert.ok(!document.getElementById('guide-stop').disabled);
stopGuide();
assert.equal(guideStep,-1);assert.equal(document.getElementById('circle-motion').innerHTML,'');
jumpGuide(2);finishLesson();
assert.equal(guideStep,-1);assert.equal(document.getElementById('circle-motion').innerHTML,'');
assert.ok(document.getElementById('guide-explanation').textContent.startsWith('Lesson complete'));
// Idle click selects a key without starting a lesson; during a walk it jumps to the step.
pickCircleKey(7);
assert.equal(guideKey,7);assert.equal(guideStep,-1);assert.equal(document.getElementById('circle-motion').innerHTML,'');
assert.ok(document.getElementById('guide-signature').innerHTML.includes('G major'));
setGuideMode('sharps');jumpGuide(0);pickCircleKey(5);
assert.equal(guideMode,'flats');assert.equal(guideChords[guideStep].name,'F');
// Numerals ride in the window; it rotates about the circle centre via the SVG transform attribute.
const numerals=[...svg.matchAll(/class="window-numeral[^"]*"[^>]*>([^<]+)</g)].map(m=>m[1]);
assert.deepEqual(numerals,['IV','I','V','ii','vi','iii','vii°']);
setGuideKey(7);
assert.equal(document.getElementById('circle-window').attrs.transform,'rotate(30.00 220 220)');
// Rules use the selected key's spelling.
setGuideKey(7);
const rules=document.getElementById('guide-rules').innerHTML;
for(const t of ['1 sharp: F♯','G ↔ Em','G C D','Am Bm Em','F♯°','Am → D → G','C becomes C♯'])assert.ok(rules.includes(t),'rules for G: '+t);
setGuideKey(5);assert.ok(document.getElementById('guide-rules').innerHTML.includes('data-mode="flats"'));
for(const t of ['Father Charles Goes Down And Ends Battle','data-mode="circle"','data-mode="strings"','capo 1 with E shapes'])assert.ok(document.getElementById('guide-rules').innerHTML.includes(t),'rules for F: '+t);
for(let key=0;key<12;key++){setGuideKey(key);assert.ok(!/undefined|NaN/.test(document.getElementById('guide-rules').innerHTML+document.getElementById('guide-explanation').textContent),'rules '+key);}
for(const mode of ['sharps','flats','neighbours','circle','modulate','modulate4','modulateMinor','distance','relative','parallel','minor','dominant','borrowed','pop','axis','fifties','jazz','blues','strings']){setGuideMode(mode);assert.ok(!/undefined/.test(document.getElementById('guide-explanation').textContent),'intro '+mode);}
setGuideKey(0);setGuideMode('relative');
for(const preset of tuningPresets){
 setTuning(preset.id);
 for(let key=0;key<12;key++)for(const mode of ['sharps','flats','neighbours','circle','modulate','modulate4','modulateMinor','distance','relative','parallel','minor','dominant','borrowed','pop','axis','fifties','jazz','blues','strings']){
  const steps=lessonSteps(key,mode);
  for(const step of steps){
   const shape=guideShape(step);
   assert.equal(shape.length,6);
   const tones=families.find(f=>f.name===step.quality).intervals;
   const notes=shape.map((f,i)=>f<0?-1:mod(tuning[i]+f-step.root)).filter(n=>n>=0);
   assert.ok(notes.every(n=>tones.includes(n)),preset.id+' '+step.name);
  }
 }
}
setTuning('standard-0');
console.log('Circle lessons verified: 19 modes × 12 keys × 26 tunings, key signatures, sharp/flat walks, modulation, motion layer, window rotation, idle/Stop, numerals and rules.');
`,context);
// CSS transform-origin on SVG groups differs between Chrome and Firefox; rotation must stay in SVG attributes.
const css=fs.readFileSync('styles.css','utf8');
assert.ok(!/transform-box|transform-origin/.test((css.match(/\.circle-window[^}]*}|\.window-numeral[^}]*}|\.guide-halo[^}]*}/g)||[]).join('')));
const html=fs.readFileSync('index.html','utf8');
assert.ok(html.includes('° means diminished')&&html.includes('value="circle"')&&html.includes('value="strings"'));
assert.ok(!/udio/.test(html+fs.readFileSync('circle-guide.js','utf8')),'audio removed');
console.log('Batch D/E: arrow trail, centre caption, speed control and key linking verified.');
console.log('Batch C: progressions, minor harmony, modulation to IV and relative minor, key distance verified.');
console.log('Batch B: chords in key verified for 26 tunings × 12 keys × 4 shape settings.');
console.log('Batch A: circle progression, open strings, capo tips, mnemonic, symbols and audio removal verified.');
assert.ok(/let scaleKey = 0;/.test(fs.readFileSync('app.js','utf8')),'scale maps start on C like the circle');
assert.ok(/frets:24/.test(fs.readFileSync('app.js','utf8'))&&!/#scale-charts\{display:grid/.test(fs.readFileSync('styles.css','utf8')),'scale maps: 24 frets, one column');
// Chord finder (chord-finder.js): select a fretboard note, get chords with that note as the root.
context.document.querySelector=()=>null;
vm.runInContext(fs.readFileSync('chord-finder.js','utf8')+`
setTuning('standard-0');
const T=family=>finderTypes.find(t=>t.family===family);
const names=(family,s,f)=>chordVoicings(T(family),s,f).map(v=>finderChordName(T(family),finderNames[mod(tuning[s]+f)],v.bass)+' '+v.shape.map(x=>x<0?'x':x).join(''));
assert.equal(finderTypes.length,16);
assert.ok(finderTypes.every(t=>!t.intervals.some(i=>[1,2,5].includes(i)&&!/Sus/.test(t.family))),'no 9th, 11th or 13th chords');
assert.equal(['Major','Minor','7','Major 7'].map(f=>T(f).intervals.map(i=>spellTone('A',i,T(f).intervals)).join(' ')).join(' | '),'A C♯ E | A C E | A C♯ E G | A C♯ E G♯');
assert.equal(T('Diminished 7').intervals.map(i=>spellTone('F♯',i,T('Diminished 7').intervals)).join(' '),'F♯ A C E♭');
assert.equal(T('Half-diminished 7').intervals.map(i=>spellTone('B♭',i,T('Half-diminished 7').intervals)).join(' '),'B♭ D♭ F♭ A♭');
// Treble strings: the three classic top-string C triads, named by their bass note.
assert.ok(names('Major',3,5).includes('C xxx553'));
assert.ok(names('Major',4,13).includes('C/G xxx121312'));
assert.ok(names('Major',5,8).includes('C/E xxx988'));
// Bass strings: familiar shapes rank first.
assert.equal(names('Major',0,5)[0],'A 577655');
assert.equal(names('7',1,3)[0],'C7 x35353');
assert.equal(names('Major',0,3)[0],'G 320003');
assert.equal(names('Major',0,0)[0],'E 022100');
assert.equal(fingersNeeded([-1,3,-1,3,-1,0]),2,'a barre cannot span a muted string');
// Every tuning, string, fret and type: valid voicings only.
let empty=0,total=0;
for(const preset of tuningPresets){
 setTuning(preset.id);
 for(let s=0;s<6;s++)for(let f=0;f<=24;f++)for(const t of finderTypes){
  total++;const vs=chordVoicings(t,s,f);if(!vs.length){empty++;continue;}
  assert.ok(vs.length<=3);
  for(const v of vs){
   const id=preset.id+' s'+(6-s)+' f'+f+' '+t.family+' '+v.shape;
   assert.equal(v.shape[s],f,id+' keeps the selected note');
   const tones=v.shape.map((x,i)=>x<0?-1:mod(tuning[i]+x-tuning[s]-f)).filter(x=>x>=0);
   assert.ok(tones.every(x=>t.intervals.includes(x))&&requiredTones(t).every(x=>tones.includes(x)),id+' tones');
   const fretted=v.shape.filter(x=>x>0);
   assert.ok(!fretted.length||Math.max(...fretted)-Math.min(...fretted)<=3,id+' span');
   assert.ok(fingersNeeded(v.shape)<=4&&Math.max(...v.shape)<=24,id+' playable');
   if(s<=2)assert.equal(v.shape.findIndex(x=>x>=0),s,id+' root in the bass');
   else assert.ok(v.shape.slice(0,1).every(x=>x<0),id+' top strings only');
  }
  if(s<=2&&f>=1&&f<=20&&['Major','Minor','7'].includes(t.family))assert.ok(vs.length,preset.id+' bass '+t.family+' s'+(6-s)+' f'+f);
 }
}
assert.ok(empty/total<.03,'empty results '+empty+'/'+total);
setTuning('standard-0');
// Popup content.
finderNote={string:3,fret:5};finderTab=0;renderFinder();
assert.ok(document.getElementById('cf-title').textContent==='C · string 3, fret 5');
assert.ok(document.getElementById('cf-body').innerHTML.includes('>C<')&&document.getElementById('cf-body').innerHTML.includes('>C/G<'));
assert.ok(['>Caug<','>Caug7<','>Cdim<','>Cdim7<'].every(t=>document.getElementById('cf-tabs').innerHTML.includes(t))&&!['>C+<','>C+7<','>C°<','>C°7<'].some(t=>document.getElementById('cf-tabs').innerHTML.includes(t)));
assert.ok(document.getElementById('cf-tabs').innerHTML.includes('>Cm7♭5<')&&document.getElementById('cf-tabs').innerHTML.includes('In C major'));
setGuideKey(0);finderNote={string:0,fret:0};finderTab='key';renderFinder();
const keyTab=document.getElementById('cf-body').innerHTML;
for(const t of ['>C<','>Em<','>Am<','is the 3rd','is the root','is the 5th'])assert.ok(keyTab.includes(t),'in-key tab: '+t);
finderNote={string:0,fret:2};renderFinder();assert.ok(document.getElementById('cf-body').innerHTML.includes('is not in C major'));
assert.ok(!/undefined|NaN/.test(document.getElementById('cf-body').innerHTML+document.getElementById('cf-tabs').innerHTML));
console.log('Chord finder: 16 types × 6 strings × 25 frets × 26 tunings checked ('+empty+' of '+total+' positions at the neck ends have no compact shape).');
`,context);
// Metronome (metronome.js): flexible meters, accent groups, tap tempo.
vm.runInContext(fs.readFileSync('metronome.js','utf8')+`
assert.equal(defaultGroups(17,16),'3+3+3+3+3+2');
assert.equal(defaultGroups(7,8),'3+2+2');
assert.equal(defaultGroups(6,8),'3+3');
assert.equal(defaultGroups(5,8),'3+2');
assert.equal(defaultGroups(13,16),'3+3+3+2+2');
assert.equal(defaultGroups(4,8),'2+2');
assert.equal(defaultGroups(4,4),'');
assert.equal(defaultGroups(3,8),'');
for(const unit of [8,16,32])for(let beats=1;beats<=32;beats++){
 const g=defaultGroups(beats,unit),p=parseGroups(g,beats);
 assert.ok(!p.error,unit+' '+beats+' '+g);
 if(p.groups)assert.ok(p.groups.every(n=>n===2||n===3),'groups of 2 and 3: '+g);
}
assert.deepEqual(parseGroups('3+3+2',8).groups,[3,3,2]);
assert.deepEqual(parseGroups(' 2 + 2 + 3 ',7).groups,[2,2,3]);
assert.equal(parseGroups('',5).groups,null);
assert.ok(parseGroups('3+3',7).error.includes('add up to 6'));
assert.ok(parseGroups('3+a',7).error);
assert.ok(parseGroups('3+0+4',7).error);
assert.deepEqual(accentPattern(17,[3,3,3,3,3,2],true),[2,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0]);
assert.deepEqual(accentPattern(4,null,true),[2,0,0,0]);
assert.deepEqual(accentPattern(4,null,false),[0,0,0,0]);
assert.deepEqual(accentPattern(7,[2,2,3],false),[1,0,1,0,1,0,0]);
assert.equal(tempoFromTaps([0,500,1000,1500,2000]),120);
assert.equal(tempoFromTaps([0,400,3000,3500]),120,'a long pause starts a new count');
assert.equal(tempoFromTaps([1000]),null);
assert.equal(clampBpm(10),30);assert.equal(clampBpm(400),300);assert.equal(clampBpm('96.6'),97);
setMetro({beats:40});assert.equal(metro.beats,32);
setMetro({beats:17,unit:16,groups:defaultGroups(17,16)});
assert.equal((document.getElementById('metro-beats').innerHTML.match(/metro-dot/g)||[]).length,17);
assert.equal((document.getElementById('metro-beats').innerHTML.match(/level-1/g)||[]).length,5);
assert.ok(document.getElementById('metro-hint').textContent.startsWith('17/16: 17 clicks per bar, each a sixteenth note'));
setMetro({groups:'3+3'});assert.ok(document.getElementById('metro-groups-note').textContent.includes('add up to 6'));
console.log('Metronome: groupings for 1–32 beats, accents, tap tempo and limits verified.');
`,context);
