'use strict';
const standardMidi = [40,45,50,55,59,64];
let tuning = [...standardMidi];
let selectedTuning = {drop:false,down:0};
let scaleKey = 0;
const shortNotes = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const tuningPresets = [false,true].flatMap(drop=>Array.from({length:13},(_,down)=>({
 id:`${drop?'drop':'standard'}-${down}`,drop,down,
 name:`${drop?'Drop':'Standard'} ${shortNotes[((drop?2:4)-down+12)%12]}${down===12?' · octave below':down?` · −${down} semitone${down===1?'':'s'}`:''}`
})));
const noteNames = ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
const mod = n => (n % 12 + 12) % 12;
const svgText = (x,y,t,extra='') => `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" ${extra}>${t}</text>`;
// Horizontal fretboard: string 1 on top. Scale maps pass {frets, position, selected}:
// notes outside `position` are dimmed, and root notes become buttons that select a position.
function fretboard(intervals=null, labels=null, opts={}){
 const frets=opts.frets??12,extra=(frets-12)*82,position=opts.position;
 let s=`<svg class="board" viewBox="0 0 ${1120+extra} 210" role="img" aria-label="${intervals?noteNames[scaleKey]+' scale intervals across '+frets+' frets':'Notes on the guitar fretboard'}"><g font-family="system-ui" font-size="13" fill="#18282e">`;
 for(let f=0;f<=frets;f++){const x=58+f*82;s+=svgText(x,194,f,'fill="#60747a"');if(f>0)s+=`<path d="M${x+41} 18V172" stroke="#dce5e7"/>`;if([3,5,7,9,12,15,17,19,21,24].includes(f))s+=`<circle cx="${x}" cy="194" r="15" fill="#e8f0f0"/>`+svgText(x,194,f);}
 for(let row=0;row<6;row++){const y=27+row*28;const string=5-row;s+=`<path d="M46 ${y}H${1084+extra}" stroke="#adbdc2" stroke-width="${.7+row*.18}"/>`;s+=svgText(15,y,shortNotes[mod(tuning[string])],'font-weight="700"');for(let f=0;f<=frets;f++){const pitch=mod(tuning[string]+f);const degree=mod(pitch-scaleKey);if(intervals&&!intervals.includes(degree))continue;const root=intervals?degree===0:false;const label=intervals?labels[intervals.indexOf(degree)]:noteNames[pitch];const x=58+f*82;
  const dim=position&&!position.has(string+','+f),picked=!!opts.selected&&opts.selected.string===string&&opts.selected.fret===f;
  const note=`<rect x="${x-27}" y="${y-10}" width="54" height="20" rx="10" fill="${root?'#d9384c':f===0?'#18282e':'#fff'}" stroke="${picked?'#18282e':root?'#d9384c':'#bbcbd0'}"${picked?' stroke-width="3"':''}/>`+svgText(x,y,label,`fill="${root||f===0?'white':'#18282e'}" font-size="${label.length>3?11:13}"`);
  const body=dim?`<g opacity=".2">${note}</g>`:note;
  // A transparent hit area the size of the fret cell makes notes easy to tap on small screens.
  const hit=`<rect class="hit-area" x="${x-41}" y="${y-14}" width="82" height="28" fill="transparent"/>`;
  if(opts.clickable){s+=`<g class="board-note" data-string="${string}" data-fret="${f}" tabindex="${string===5&&f===0?0:-1}" role="button" aria-label="${noteNames[pitch]}, string ${6-string}, fret ${f}: show chords"><title>${noteNames[pitch]} · string ${6-string}, fret ${f}: show chords</title>${hit}${body}</g>`;continue;}
  s+=root&&opts.frets?`<g class="scale-root" data-string="${string}" data-fret="${f}" tabindex="0" role="button" aria-pressed="${picked}" aria-label="${picked?'Clear':'Show'} the position from the root on string ${6-string}, fret ${f}"><title>Root on string ${6-string}, fret ${f}: ${picked?'click to clear':'show this position'}</title>${hit}${body}</g>`:body;}}
 return s+'</g></svg>';
}
// Frets are always ordered from the sixth (low E) string to the first.
const basicShapes = {
 'Major': ['x32010','x46664','xx0232','xx1343','022100','133211','244322','320003','466544','x02220','x13331','x24442'],
 'Major 7': ['x32000','x46564','xx0222','xx1333','021100','xx3210','243322','320002','465544','x02120','x13231','x24342'],
 'Dominant 7': ['x32310','x46464','xx0212','xx1323','020100','131211','242322','320001','464544','x02020','x13131','x24242'],
 'Minor': ['x35543','x46654','xx0231','xx1342','022000','133111','244222','355333','466444','x02210','x13321','x24432'],
 'Minor 7': ['x35343','x46454','xx0211','xx1322','020000','131111','242222','353333','464444','x02010','x13121','x24232']
};
const parseShape=s=>[...s].map(x=>x==='x'?-1:Number(x));
function chordDiagram(frets,root,label){
 const positive=frets.filter(f=>f>0), min=Math.min(...positive), max=Math.max(...positive);
 const start=max<=4?1:min, rows=Math.max(4,max-start+1), height=Math.max(110,34+rows*15);
 let s=`<svg class="chord" viewBox="0 0 92 ${height}" role="img" aria-label="${label}; frets low to high: ${frets.map(f=>f<0?'muted':f).join(', ')}"><title>${label}: ${frets.map(f=>f<0?'×':f).join(' ')}</title><g font-family="system-ui" fill="#18282e">`;
 for(let i=0;i<6;i++)s+=`<path d="M${21+i*11} 24V${24+rows*15}" stroke="#a4b3b8" stroke-width=".7"/>`;
 for(let f=0;f<=rows;f++)s+=`<path d="M21 ${24+f*15}H76" stroke="#a4b3b8" stroke-width="${f===0&&start===1?3:.7}"/>`;
 if(start>1)s+=svgText(9,32,start,'font-size="10"');
 // A straight barre is possible only when all covered strings meet or exceed it.
 for(const fret of [...new Set(positive)]){const indices=frets.map((v,i)=>v===fret?i:-1).filter(i=>i>=0);if(indices.length>1){const a=indices[0],b=indices.at(-1);if(frets.slice(a,b+1).every(v=>v>=fret))s+=`<path d="M${21+a*11} ${31.5+(fret-start)*15}H${21+b*11}" stroke="#18282e" stroke-width="7" stroke-linecap="round"/>`;}}
 frets.forEach((f,i)=>{const x=21+i*11;const isRoot=f>=0&&mod(tuning[i]+f)===root;if(f<0)s+=svgText(x,13,'×','font-size="12"');else if(f===0)s+=`<circle cx="${x}" cy="13" r="3.3" fill="white" stroke="${isRoot?'#d9384c':'#60747a'}" stroke-width="1.3"/>`;else s+=`<circle cx="${x}" cy="${31.5+(f-start)*15}" r="4" fill="${isRoot?'#d9384c':'#18282e'}" stroke="white" stroke-width=".65"/>`;});
 return s+'</g></svg>';
}

const families=[
 {name:'Major',group:'Major',formula:'R · 3 · 5',intervals:[0,4,7]},
 {name:'Major 6',group:'Major',formula:'R · 3 · 5 · 6',intervals:[0,4,7,9]},
 {name:'Major 7',group:'Major',formula:'R · 3 · 5 · 7',intervals:[0,4,7,11]},
 {name:'Major 9',group:'Major',formula:'R · 3 · 5 · 7 · 9',intervals:[0,4,7,11,2]},
 {name:'Major 13',group:'Major',formula:'R · 3 · 5 · 7 · 9 · 11 · 13',intervals:[0,4,7,11,2,5,9]},
 {name:'Sus 2',group:'Suspended',formula:'R · 2 · 5',intervals:[0,2,7]},
 {name:'Sus 4',group:'Suspended',formula:'R · 4 · 5',intervals:[0,5,7]},
 {name:'7',group:'Dominant',formula:'R · 3 · 5 · ♭7',intervals:[0,4,7,10]},
 {name:'9',group:'Dominant',formula:'R · 3 · 5 · ♭7 · 9',intervals:[0,4,7,10,2]},
 {name:'13',group:'Dominant',formula:'R · 3 · 5 · ♭7 · 9 · 11 · 13',intervals:[0,4,7,10,2,5,9]},
 {name:'7 Sus 4',group:'Dominant',formula:'R · 4 · 5 · ♭7',intervals:[0,5,7,10]},
 {name:'Altered 7',group:'Dominant',formula:'R · 3 · ♭7 + altered 5 / 9',intervals:[0,4,6,8,10,1,3]},
 {name:'Minor',group:'Minor',formula:'R · ♭3 · 5',intervals:[0,3,7]},
 {name:'Minor 6',group:'Minor',formula:'R · ♭3 · 5 · 6',intervals:[0,3,7,9]},
 {name:'Minor 7',group:'Minor',formula:'R · ♭3 · 5 · ♭7',intervals:[0,3,7,10]},
 {name:'mM7',group:'Minor',formula:'R · ♭3 · 5 · 7',intervals:[0,3,7,11]},
 {name:'Minor 9',group:'Minor',formula:'R · ♭3 · 5 · ♭7 · 9',intervals:[0,3,7,10,2]},
 {name:'Minor 11',group:'Minor',formula:'R · ♭3 · 5 · ♭7 · 9 · 11',intervals:[0,3,7,10,2,5]},
 {name:'Diminished',group:'Diminished',formula:'R · ♭3 · ♭5',intervals:[0,3,6]},
 {name:'Diminished 7',group:'Diminished',formula:'R · ♭3 · ♭5 · ♭♭7',intervals:[0,3,6,9]},
 {name:'Augmented',group:'Augmented',formula:'R · 3 · ♯5',intervals:[0,4,8]},
 {name:'Augmented 7',group:'Augmented',formula:'R · 3 · ♯5 · ♭7',intervals:[0,4,8,10]}
];
// Relative frets for root-position shapes. All three root columns are shown in A.
// Extensions omit the fifth and/or lower extensions where six strings require it.
const moveableShapes=[
 [[0,2,2,1,0,0],[-1,0,2,2,2,0],[-1,-1,0,2,3,2]],
 [[0,-1,2,1,2,0],[-1,0,2,2,2,2],[-1,-1,0,2,0,2]],
 [[0,2,1,1,0,0],[-1,0,2,1,2,0],[-1,-1,0,2,2,2]],
 [[0,-1,1,1,0,2],[-1,0,-1,1,0,0],[-1,-1,0,1,1,0]],
 [[0,-1,1,1,2,2],[-1,0,-1,1,2,2],[-1,-1,0,1,1,2]],
 [[0,2,4,4,0,0],[-1,0,2,2,0,0],[-1,-1,0,2,3,0]],
 [[0,2,2,2,0,0],[-1,0,2,2,3,0],[-1,-1,0,2,3,3]],
 [[0,2,0,1,0,0],[-1,0,2,0,2,0],[-1,-1,0,2,1,2]],
 [[0,-1,0,1,0,2],[-1,0,-1,0,0,0],[-1,-1,0,-1,1,0]],
 [[0,-1,0,1,2,2],[-1,0,-1,0,2,2],[-1,-1,0,-1,1,2]],
 [[0,2,0,2,0,0],[-1,0,2,0,3,0],[-1,-1,0,2,1,3]],
 [[0,-1,0,1,1,1],[-1,0,-1,0,2,1],[-1,-1,0,1,1,2]],
 [[0,2,2,0,0,0],[-1,0,2,2,1,0],[-1,-1,0,2,3,1]],
 [[0,-1,2,0,2,0],[-1,0,2,2,1,2],[-1,-1,0,2,0,1]],
 [[0,2,0,0,0,0],[-1,0,2,0,1,0],[-1,-1,0,2,1,1]],
 [[0,2,1,0,0,0],[-1,0,2,1,1,0],[-1,-1,0,2,2,1]],
 [[0,2,0,0,0,2],[-1,0,2,0,1,2],[-1,-1,0,3,1,0]],
 [[0,0,0,0,0,0],[-1,0,0,0,1,0],[-1,-1,0,0,1,1]],
 [[0,1,2,0,-1,-1],[-1,0,1,2,1,-1],[-1,-1,0,1,3,1]],
 [[0,1,2,0,2,0],[-1,0,1,2,1,2],[-1,-1,0,1,0,1]],
 [[0,-1,2,1,1,0],[-1,0,3,2,2,1],[-1,-1,0,3,3,2]],
 [[0,-1,0,1,1,0],[-1,0,3,0,2,1],[-1,-1,0,3,1,2]]
];
// Search compact alternate voicings; retain defining chord tones and no open strings.
function alternateVoicings(family,exclude,root=9,rootString=null){
 const required=family.name==='Altered 7'?[0,4,10]:family.intervals.filter(x=>(x!==7||family.intervals.length===3)&&(!family.name.includes('13')||![2,5].includes(x))&&(!family.name.includes('11')||x!==2));
 const found=[];const used=new Set(exclude.map(s=>s.join(',')));
 for(let bass=0;bass<=2;bass++)for(let start=1;start<=12;start++){
  if(rootString!==null&&bass!==rootString)continue;
  const options=tuning.map((open,i)=>i<bass?[-1]:[-1,...Array.from({length:4},(_,k)=>start+k).filter(f=>family.intervals.includes(mod(open+f-root))&&(!(i===rootString)||mod(open+f)===root))]);
  const walk=(arr)=>{if(arr.length===6){const played=arr.filter(f=>f>=0);if(played.length<3||arr[bass]<0)return;const pitches=arr.map((f,i)=>f<0?-1:mod(tuning[i]+f-root));if(!required.every(p=>pitches.includes(p)))return;if(family.name==='Altered 7'&&!pitches.some(p=>[1,3,6,8].includes(p)))return;const key=arr.join(',');if(used.has(key))return;const min=Math.min(...played),max=Math.max(...played);let fingers=played.length;const atMin=arr.map((v,i)=>v===min?i:-1).filter(i=>i>=0);if(atMin.length>1&&arr.slice(atMin[0],atMin.at(-1)+1).every(f=>f>=min))fingers-=atMin.length-1;if(fingers>4)return;used.add(key);found.push({shape:arr,score:(max-min)*4+fingers*2+min*.15+(pitches[bass]!==0?4:0)});return;}for(const f of options[arr.length])walk([...arr,f]);};walk([]);
 }
 return found.sort((a,b)=>a.score-b.score).slice(0,4).map(x=>x.shape);
}
const shapeOverrides={
 'Major 9':{1:[-1,12,11,13,12,12],2:[-1,-1,7,6,9,7]},
 'Major 13':{2:[-1,-1,7,6,7,4]},
 '9':{1:[-1,12,11,12,12,12],2:[-1,-1,7,6,8,7]},
 '13':{2:[-1,-1,7,6,7,3]},
 'Altered 7':{2:[-1,-1,7,6,8,6]},
 'Minor 9':{1:[-1,12,10,12,12,12],2:[-1,-1,7,5,8,7]}
};
const renderedVoicings=[];
const renderedBasic=[];
function renderMoveable(){
renderedVoicings.length=0;
let moveRows='',group='';
families.forEach((family,i)=>{
 if(family.group!==group){group=family.group;moveRows+=`<tr class="family"><th colspan="8" scope="colgroup">${group.toUpperCase()}</th></tr>`;}
 const roots=moveableShapes[i].map((shape,j)=>{
  if(selectedTuning.drop&&j===0)return alternateVoicings(family,[],9,0)[0];
  let shifted=(shapeOverrides[family.name]?.[j]||shape.map(f=>f<0?-1:f+[5,12,7][j])).map(f=>f<0?-1:f+selectedTuning.down);
  while(Math.min(...shifted.filter(f=>f>=0))>12)shifted=shifted.map(f=>f<0?-1:f-12);
  return shifted;
 });
 const shapes=[...roots,...alternateVoicings(family,roots)];
 renderedVoicings.push({family,shapes});
 moveRows+=`<tr><th scope="row">${family.name}</th>${shapes.map(s=>'<td>'+chordDiagram(s,9,'A '+family.name)+'</td>').join('')}</tr>`;
});
document.getElementById('moveable-chart').innerHTML='<table><thead><tr><th>Chord family</th><th>Root 6</th><th>Root 5</th><th>Root 4</th><th colspan="4">Alternate voicings · in A</th></tr></thead><tbody>'+moveRows+'</tbody></table><p class="section-note">Numbers beside diagrams indicate the starting fret. Extended chords may omit the fifth or inner extensions. mM7 = minor with a major seventh.</p>';
}
const formulaExtras=[{name:'Half-diminished 7',formula:'R · ♭3 · ♭5 · ♭7'}];
document.getElementById('formulas').innerHTML='<table class="formula-table"><thead><tr><th>Chord</th><th>Formula</th></tr></thead><tbody>'+[...families,...formulaExtras].map(f=>`<tr><th scope="row">${f.name==='7'?'Dominant 7':f.name==='9'?'Dominant 9':f.name==='13'?'Dominant 13':f.name}</th><td>${f.formula}</td></tr>`).join('')+'</tbody></table>';

const scales=[
 {name:'Major scale (Ionian)',group:'Essentials',intervals:[0,2,4,5,7,9,11],labels:['R','2','3','4','5','6','7'],hint:'Major pentatonic: omit the 4th and 7th.'},
 {name:'Natural minor scale (Aeolian)',group:'Essentials',intervals:[0,2,3,5,7,8,10],labels:['R','2','♭3','4','5','♭6','♭7'],hint:'Minor pentatonic: omit the 2nd and ♭6th.'},
 {name:'Major blues scale',group:'Essentials',intervals:[0,2,3,4,7,9],labels:['R','2','♭3','3','5','6'],hint:'Major pentatonic + ♭3.'},
 {name:'Minor blues scale',group:'Essentials',intervals:[0,3,5,6,7,10],labels:['R','♭3','4','♭5','5','♭7'],hint:'Minor pentatonic + ♭5.'},
 {name:'Dorian',group:'Modes',intervals:[0,2,3,5,7,9,10],labels:['R','2','♭3','4','5','6','♭7'],hint:'Natural minor with a raised 6th. Fits minor 7th chords; the ii of the major scale.',off:true},
 {name:'Phrygian',group:'Modes',intervals:[0,1,3,5,7,8,10],labels:['R','♭2','♭3','4','5','♭6','♭7'],hint:'Natural minor with a lowered 2nd: a Spanish, flamenco and metal colour.',off:true},
 {name:'Lydian',group:'Modes',intervals:[0,2,4,6,7,9,11],labels:['R','2','3','♯4','5','6','7'],hint:'Major with a raised 4th: bright and dreamy. Fits maj7♯11 chords.',off:true},
 {name:'Mixolydian',group:'Modes',intervals:[0,2,4,5,7,9,10],labels:['R','2','3','4','5','6','♭7'],hint:'Major with a lowered 7th: the dominant scale for 7th chords, rock and blues.',off:true},
 {name:'Locrian',group:'Modes',intervals:[0,1,3,5,6,8,10],labels:['R','♭2','♭3','4','♭5','♭6','♭7'],hint:'The darkest mode, built on vii°. Fits half-diminished (m7♭5) chords.',off:true},
 {name:'Harmonic minor',group:'Minor variants',intervals:[0,2,3,5,7,8,11],labels:['R','2','♭3','4','5','♭6','7'],hint:'Natural minor with a raised 7th: gives the major V chord (E7 in A minor).',off:true},
 {name:'Melodic minor',group:'Minor variants',intervals:[0,2,3,5,7,9,11],labels:['R','2','♭3','4','5','6','7'],hint:'Natural minor with raised 6th and 7th; the jazz form uses it both ways.',off:true}
];
const visibleScales = new Set(scales.filter(s=>!s.off).map(s=>s.name));
const scalePositions = new Map();
const scaleTonics=['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
// Fingering rule from the reference charts: walk two octaves up from a note on string 6. Stay on a string
// while the note is within the position (up to three frets above the start) and the string spans at most
// four frets (one finger per fret); otherwise move to the next string.
function walkPosition(scale,startFret){
 const inScale=p=>scale.intervals.includes(mod(p-scaleKey)),notes=new Set(),hi=startFret+3;
 const fits=(f,first)=>f<=hi&&f-first<=3;
 let current=0,first=startFret;
 // Two octaves, extended if needed so the position always reaches string 1.
 for(let p=tuning[0]+startFret;p<=tuning[0]+startFret+36;p++){
  if(!inScale(p))continue;
  if(p>tuning[0]+startFret+24&&[...notes].some(k=>k[0]==='5'))break;
  let f=p-tuning[current];
  // Near the nut the next string may need a negative fret; then keep stretching on this string.
  if(!fits(f,first)&&current<5&&p-tuning[current+1]>=0){current++;f=p-tuning[current];first=f;}
  if(current===5&&!fits(f,first))break;
  if(f>=0)notes.add(current+','+f);
 }
 return notes;
}
// A sixth-string root starts the walk itself; other roots use the nearest string-6 start whose walk includes them.
function scalePosition(scale,string,fret){
 if(string===0)return walkPosition(scale,fret);
 const inScale=f=>scale.intervals.includes(mod(tuning[0]+f-scaleKey));
 const starts=[-1,0,1,-2,2,-3,3,-4,4].map(d=>fret+d).filter(f=>f>=0&&inScale(f));
 for(const start of starts){const notes=walkPosition(scale,start);if(notes.has(string+','+fret))return notes;}
 const notes=walkPosition(scale,starts[0]);notes.add(string+','+fret);return notes;
}
function renderScales(){
 const selected=scales.filter(s=>visibleScales.has(s.name));
 document.getElementById('scale-summary').textContent=`${noteNames[scaleKey]} · ${selected.length} scale${selected.length===1?'':'s'}`;
 document.getElementById('scale-charts').innerHTML=selected.length?selected.map(s=>{
  // Positions that start high on the neck can run past the last fret; keep only what the board shows.
  const pick=scalePositions.get(s.name),position=pick&&new Set([...scalePosition(s,pick.string,pick.fret)].filter(k=>Number(k.split(',')[1])<=24));
  const notes=s.intervals.length===7?` <span class="scale-notes">${spellScale(scaleTonics[scaleKey],s.intervals).join(' ')}</span>`:'';
  const frets=position&&[...position].map(k=>Number(k.split(',')[1]));
  const info=pick?`<p class="scale-position">Position: root on string ${6-pick.string}, fret ${pick.fret} · frets ${Math.min(...frets)}–${Math.max(...frets)} · ${position.size} notes${Math.max(...frets)===24&&[...scalePosition(s,pick.string,pick.fret)].some(k=>Number(k.split(',')[1])>24)?' (continues past fret 24)':''} <button type="button" class="scale-clear" data-scale="${s.name}">Clear</button></p>`:'<p class="scale-position is-hint">Select a red root to highlight its position from string 6 to string 1.</p>';
  return `<article class="scale" data-scale="${s.name}"><h3>${noteNames[scaleKey]} · ${s.name}${notes}</h3><p>${s.hint} <span class="scale-intervals">${s.labels.join(' · ')}</span></p>${info}<div class="board-wrap">${fretboard(s.intervals,s.labels,{frets:24,position,selected:pick})}</div></article>`;
 }).join(''):'<p class="scale-empty">Select a scale above to show its fretboard map.</p>';
}
function toggleScalePosition(name,string,fret){
 const pick=scalePositions.get(name);
 if(pick&&pick.string===string&&pick.fret===fret)scalePositions.delete(name);else scalePositions.set(name,{string,fret});
 renderScales();
}
function setScaleKey(value){
 const key=Number(value);
 if(!Number.isInteger(key)||key<0||key>11)return;
 scaleKey=key;scalePositions.clear();
 document.getElementById('scale-key').value=String(key);
 renderScales();
}
function setScaleVisible(name,visible){
 if(!scales.some(s=>s.name===name))return;
 if(visible)visibleScales.add(name);else visibleScales.delete(name);
 renderScales();
}
document.getElementById('scale-key').innerHTML=noteNames.map((name,key)=>`<option value="${key}">${name}</option>`).join('');
document.getElementById('scale-key').value='0';
document.getElementById('scale-key').addEventListener('change',event=>setScaleKey(event.target.value));
document.getElementById('scale-options').innerHTML=[...new Set(scales.map(s=>s.group))].map(g=>`<div class="scale-group"><span>${g}</span>${scales.filter(s=>s.group===g).map(s=>`<label><input type="checkbox" value="${s.name}"${visibleScales.has(s.name)?' checked':''}> ${s.name}</label>`).join('')}</div>`).join('');
document.getElementById('scale-charts').addEventListener('click',event=>{
 const clear=event.target.closest('.scale-clear');
 if(clear){scalePositions.delete(clear.dataset.scale);renderScales();return;}
 const root=event.target.closest('.scale-root');
 if(root)toggleScalePosition(root.closest('.scale').dataset.scale,Number(root.dataset.string),Number(root.dataset.fret));
});
document.getElementById('scale-charts').addEventListener('keydown',event=>{
 const root=event.target.closest?.('.scale-root');
 if(root&&(event.key==='Enter'||event.key===' ')){event.preventDefault();toggleScalePosition(root.closest('.scale').dataset.scale,Number(root.dataset.string),Number(root.dataset.fret));}
});
document.getElementById('scale-options').addEventListener('change',event=>{
 if(event.target.type==='checkbox')setScaleVisible(event.target.value,event.target.checked);
});

// Circle geometry: centre (220,220); sector i sits at i×30° clockwise from the top.
const circlePt=(r,a)=>[220+Math.sin(a)*r,220-Math.cos(a)*r];
const circlePoint=(root,minor)=>circlePt(minor?96:149,mod((minor?root+3:root)*7)*Math.PI/6);
const circleMajors=['C','G','D','A','E','B / C♭','F♯ / G♭','D♭ / C♯','A♭','E♭','B♭','F'];
const circleMinors=['Am','Em','Bm','F♯m','C♯m','G♯m','D♯m / E♭m','B♭m','Fm','Cm','Gm','Dm'];
// Flat-side keys keep their correct names; the sharp equivalent is shown underneath.
const circleMajorSharps={8:'G♯',9:'D♯',10:'A♯'},circleMinorSharps={7:'A♯m'};
const circleSignatures=['0','1♯','2♯','3♯','4♯','5♯ · 7♭','6♯ · 6♭','5♭ · 7♯','4♭','3♭','2♭','1♭'];
const signatureWords=i=>circleSignatures[i].replace(/(\d)♯/g,(_,n)=>`${n} sharp${n==='1'?'':'s'}`).replace(/(\d)♭/g,(_,n)=>`${n} flat${n==='1'?'':'s'}`).replace(' · ',' or ').replace(/^0$/,'no sharps or flats');
function circle(){
 const fmt=p=>p.map(v=>v.toFixed(2)).join(' ');
 // Key labels go in a top layer so lesson arrows pass beneath them; clicks fall through to the keys.
 let labels='';
 let s='<svg viewBox="-30 -34 500 512" role="group" aria-label="Circle of fifths: major keys on the outer ring, relative minor keys on the inner ring, key signatures around the edge. Select a key to explore it."><g font-family="system-ui">';
 s+='<circle cx="220" cy="220" r="206" fill="#eef4f4" stroke="#dce5e7"/>';
 for(let i=0;i<12;i++){
  const root=mod(i*7),angle=i*Math.PI/6,p=circlePt(178,angle-Math.PI/12),q=circlePt(178,angle+Math.PI/12),name=circleMajors[i].replace(' / ',' or ')+(circleMajorSharps[i]?` or ${circleMajorSharps[i]}`:'');
  s+=svgText(...circlePt(192,angle),circleSignatures[i],`class="sig-ring" font-size="${i>=5&&i<=7?9.5:11}" fill="#60747a" font-weight="650"`);
  s+=`<g class="circle-key" data-pick="${root}" data-ring="major" data-root="${root}" data-title="${name} major · ${signatureWords(i)}" tabindex="0" role="button" aria-label="${name} major, ${signatureWords(i)}"><title>${name} major · ${signatureWords(i)}</title><path data-major="${root}" d="M220 220L${fmt(p)}A178 178 0 0 1 ${fmt(q)}Z" fill="${i%2?'#20383f':'#18282e'}" stroke="#fff" stroke-width="1"/></g>`;
  const pos=circlePt(149,angle);
  labels+=svgText(...pos,circleMajors[i],`fill="white" font-size="${i>=5&&i<=7?14:21}" font-weight="650"`);
  if(circleMajorSharps[i])labels+=svgText(pos[0],pos[1]+18,circleMajorSharps[i],'class="sharp-name" fill="#cfe4e6" font-size="11" font-weight="600"');
 }
 s+='<circle cx="220" cy="220" r="119" fill="#e6efef"/>';
 for(let i=0;i<12;i++){
  const pos=circlePt(96,i*Math.PI/6),name=circleMinors[i].replace('m / ',' minor or ').replace(/m$/,' minor')+(circleMinorSharps[i]?` or ${circleMinorSharps[i].replace('m',' minor')}`:'');
  s+=`<g class="circle-key" data-pick="${mod(i*7)}" data-ring="minor" data-root="${mod(i*7+9)}" data-title="${name} · ${signatureWords(i)}" tabindex="0" role="button" aria-label="${name}, relative of ${circleMajors[i].replace(' / ',' or ')} major, ${signatureWords(i)}"><title>${name} · ${signatureWords(i)}</title><circle class="hit" cx="${pos[0].toFixed(2)}" cy="${pos[1].toFixed(2)}" r="21" fill="transparent"/></g>`;
  labels+=svgText(...pos,circleMinors[i],`data-minor="${mod(i*7+9)}" fill="#176b70" font-size="${i===6?11:15}" font-weight="600"`);
  if(circleMinorSharps[i])labels+=svgText(pos[0],pos[1]+13,circleMinorSharps[i],'class="sharp-name" fill="#5c8c90" font-size="9" font-weight="600"');
 }
 s+='<circle cx="220" cy="220" r="63" fill="white"/><g id="circle-center">'+svgText(220,206,'RELATIVE','font-size="11" fill="#60747a" letter-spacing="1"')+svgText(220,225,'MAJOR / MINOR','font-size="10" fill="#60747a"')+svgText(220,244,'I · ii · iii · IV · V · vi · vii°','font-size="8" fill="#60747a"')+'</g><g id="circle-caption" class="circle-caption" aria-hidden="true"></g>';
 // Diatonic window: IV · I · V and their relative minors, drawn at C and rotated by the guide.
 const w=(r,a)=>fmt(circlePt(r,a)),A=Math.PI/4;
 // Roman numerals at C's position; they turn with the window and counter-rotate to stay upright.
 const S=Math.PI/6,numerals=[['IV',168,-S,'outer'],['I',168,0,'outer'],['V',168,S,'outer'],['ii',76,-S,'inner'],['vi',76,0,'inner'],['iii',76,S,'inner'],['vii°',72,2*S,'inner muted']]
  .map(([n,r,a,cls])=>svgText(...circlePt(r,a),n,`class="window-numeral ${cls}"`)).join('');
 s+=`<g id="circle-window" class="circle-window" aria-hidden="true"><path d="M${w(178,-A)}A178 178 0 0 1 ${w(178,A)}L${w(63,A)}A63 63 0 0 0 ${w(63,-A)}Z"/>${numerals}</g><g id="circle-distance" class="circle-distance" aria-hidden="true"></g><g id="circle-motion" class="circle-motion" aria-hidden="true"></g><g class="circle-labels" aria-hidden="true">${labels}</g>`;
 s+=svgText(220,-16,'FOURTHS ↶                 ↷ FIFTHS','font-size="13" fill="#60747a"')+svgText(220,450,'Flat keys ←                  → Sharp keys','font-size="13" fill="#60747a"')+svgText(220,470,'Clockwise: +1 sharp  ·  Counterclockwise: +1 flat','font-size="11" fill="#60747a"');return s+'</g></svg>';
}
document.getElementById('circle').innerHTML=circle();

// Diatonic spelling preserves letter names, including E♯, B♯ and double sharps.
const natural={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function spellScale(tonic,intervals){const letter=tonic[0],offset=tonic.slice(1)==='♯'?1:tonic.slice(1)==='♭'?-1:0;const base=natural[letter]+offset;const letters=Object.keys(natural),index=letters.indexOf(letter);return intervals.map((step,i)=>{const l=letters[(index+i)%7];let diff=mod(base+step-natural[l]);if(diff>6)diff-=12;return l+(diff>0?'♯'.repeat(diff):'♭'.repeat(-diff));});}
function keyTable(minor){const roots=minor?['A','B♭','B','C','C♯','D','D♯','E','F','F♯','G','G♯']:['C','D♭','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];const intervals=minor?[0,2,3,5,7,8,10]:[0,2,4,5,7,9,11];const suffix=minor?['m','°','','m','m','','']:['','m','m','','','m','°'];const roman=minor?['i','ii°','III','iv','v','VI','VII']:['I','ii','iii','IV','V','vi','vii°'];return `<h3>${minor?'Every minor key · natural minor':'Every major key'}</h3><table><thead><tr>${roman.map((r,i)=>`<th scope="col">${r}<small>${suffix[i]==='m'?'Minor':suffix[i]==='°'?'Dim.':'Major'}</small></th>`).join('')}</tr></thead><tbody>${roots.map(root=>'<tr>'+spellScale(root,intervals).map((note,i)=>`<${i===0?'th scope="row"':'td'}>${note+suffix[i]}</${i===0?'th':'td'}>`).join('')+'</tr>').join('')}</tbody></table>`;}
document.getElementById('major-keys').innerHTML=keyTable(false);
document.getElementById('minor-keys').innerHTML=keyTable(true);

function renderBasic(){
 renderedBasic.length=0;
 const rows=Object.entries(basicShapes).map(([name,shapes])=>{
  const family=families.find(f=>f.name===(name==='Dominant 7'?'7':name));
  const diagrams=shapes.map((_,root)=>{
   let shape=parseShape(shapes[mod(root+selectedTuning.down)]);
   if(selectedTuning.drop&&shape[0]>=0){
    shape[0]+=2;
    const fretted=shape.filter(f=>f>0);
    // Keep compact shapes; otherwise find a closed voicing in this tuning.
    if(Math.max(...fretted)-Math.min(...fretted)>3)shape=alternateVoicings(family,[],root)[0];
   }
   renderedBasic.push({family,root,shape});
   return '<td>'+chordDiagram(shape,root,noteNames[root]+' '+name)+'</td>';
  });
  return `<tr><th scope="row">${name}</th>${diagrams.join('')}</tr>`;
 });
 document.getElementById('basic-chart').innerHTML='<table><thead><tr><th scope="col">Chord family</th>'+noteNames.map(n=>`<th scope="col">${n}</th>`).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table>';
}
function setTuning(id){
 const preset=tuningPresets.find(p=>p.id===id);
 if(!preset)return;
 selectedTuning=preset;
 tuning=standardMidi.map((note,i)=>note-preset.down-(preset.drop&&i===0?2:0));
 document.getElementById('tuning-select').value=id;
 document.getElementById('tuning-notes').textContent=tuning.map(n=>shortNotes[mod(n)]+(Math.floor(n/12)-1)).join(' · ');
 document.getElementById('tuning-status').textContent=`${preset.name}. Strings shown low to high. Chord names stay at sounding pitch; scale maps follow the selected key.`;
 document.getElementById('notes-board').innerHTML=fretboard(null,null,{frets:24,clickable:true});
 scalePositions.clear();
 renderBasic();renderMoveable();renderScales();
 if(typeof renderLesson==='function')renderLesson();
}
document.getElementById('tuning-select').innerHTML=[false,true].map(drop=>`<optgroup label="${drop?'Drop D family':'Standard family'}">${tuningPresets.filter(p=>p.drop===drop).map(p=>`<option value="${p.id}">${p.name}</option>`).join('')}</optgroup>`).join('');
document.getElementById('tuning-select').addEventListener('change',event=>setTuning(event.target.value));
setTuning('standard-0');
