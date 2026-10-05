'use strict';
// Metronome: a floating button that opens a panel with tempo, a flexible meter, accents and Play/Stop.
// Clicks are scheduled ahead on the Web Audio clock, so timing stays exact; a timer only tops up the
// schedule. In a background tab, browsers slow timers to about once a second, so it schedules further ahead.
const METRO_MIN=30, METRO_MAX=300;
const metroPresets=[['4/4',4,4],['3/4',3,4],['2/4',2,4],['6/8',6,8],['5/4',5,4],['7/8',7,8],['9/8',9,8],['12/8',12,8],['5/8',5,8],['11/8',11,8],['13/16',13,16],['15/16',15,16],['17/16',17,16]];
const clampBpm=v=>Math.min(METRO_MAX,Math.max(METRO_MIN,Math.round(Number(v)||0)));
// Quarter-note (and slower) meters accent only beat 1. Eighth and faster meters are felt in groups of
// 3 and 2: 6/8 → 3+3, 7/8 → 3+2+2, 17/16 → 3+3+3+3+3+2.
function defaultGroups(beats,unit){
 if(unit<=4||beats<4)return '';
 if(beats%3===0)return Array(beats/3).fill(3).join('+');
 const groups=[];let left=beats;
 while(left>4){groups.push(3);left-=3;}
 groups.push(...(left===4?[2,2]:[left]));
 return groups.join('+');
}
// Returns the group sizes, null for "no groups", or an error message.
function parseGroups(text,beats){
 const t=String(text).replace(/\s/g,'');
 if(!t)return {groups:null};
 if(!/^\d+(\+\d+)*$/.test(t))return {error:'Use whole numbers joined by +, e.g. 3+3+2.'};
 const groups=t.split('+').map(Number);
 if(groups.some(g=>g<1))return {error:'Each group needs at least one click.'};
 const sum=groups.reduce((a,b)=>a+b,0);
 if(sum!==beats)return {error:`Groups add up to ${sum}, but the bar has ${beats} clicks.`};
 return {groups};
}
// Accent level per click: 2 = beat 1, 1 = start of a group, 0 = plain.
function accentPattern(beats,groups,accentFirst){
 const levels=Array(beats).fill(0);
 if(groups){let i=0;for(const g of groups){if(i>0)levels[i]=1;i+=g;}}
 if(accentFirst)levels[0]=2;else if(groups)levels[0]=1;
 return levels;
}
// Average of the last few tap intervals; a pause of 2 s or more starts a new count.
function tempoFromTaps(times){
 const recent=[];
 for(let i=times.length-1;i>0&&recent.length<4;i--){const gap=times[i]-times[i-1];if(gap>=2000)break;recent.push(gap);}
 return recent.length?clampBpm(60000/(recent.reduce((a,b)=>a+b,0)/recent.length)):null;
}
const tempoMarking=bpm=>bpm<60?'Largo':bpm<76?'Adagio':bpm<108?'Andante':bpm<120?'Moderato':bpm<168?'Allegro':bpm<200?'Presto':'Prestissimo';

const metro={bpm:100,beats:4,unit:4,groups:'',accent:true,volume:.7,playing:false,ctx:null,timer:null,frame:null,next:0,index:0,queue:[],taps:[]};
const $m=id=>document.getElementById(id);
function metroLevels(){const parsed=parseGroups(metro.groups,metro.beats);return accentPattern(metro.beats,parsed.groups??null,metro.accent);}
function saveMetro(){try{localStorage.setItem('metronome',JSON.stringify({bpm:metro.bpm,beats:metro.beats,unit:metro.unit,groups:metro.groups,accent:metro.accent,volume:metro.volume}));}catch{/* Storage unavailable: settings last for this visit only. */}}
function loadMetro(){try{const saved=JSON.parse(localStorage.getItem('metronome')||'null');if(saved)Object.assign(metro,saved,{bpm:clampBpm(saved.bpm)});}catch{/* Ignore unreadable settings. */}}

function renderMetro(){
 $m('metro-bpm').value=metro.bpm;$m('metro-slider').value=metro.bpm;
 $m('metro-marking').textContent=tempoMarking(metro.bpm);
 $m('metro-beats-count').value=metro.beats;$m('metro-unit').value=String(metro.unit);
 $m('metro-groups').value=metro.groups;$m('metro-accent').checked=metro.accent;$m('metro-volume').value=metro.volume;
 const preset=metroPresets.find(([,b,u])=>b===metro.beats&&u===metro.unit&&metro.groups===defaultGroups(b,u));
 $m('metro-preset').value=preset?preset[0]:'custom';
 const parsed=parseGroups(metro.groups,metro.beats);
 $m('metro-groups-note').textContent=parsed.error||(parsed.groups?`Accents on clicks ${metroLevels().map((l,i)=>l?i+1:0).filter(Boolean).join(', ')}.`:'Leave empty to accent only beat 1.');
 $m('metro-groups-note').classList.toggle('is-error',!!parsed.error);
 const name=metro.unit===4?'quarter':metro.unit===2?'half':metro.unit===8?'eighth':metro.unit===16?'sixteenth':'thirty-second';
 $m('metro-hint').textContent=`${metro.beats}/${metro.unit}: ${metro.beats} click${metro.beats===1?'':'s'} per bar, each a ${name} note. BPM counts every click.`;
 const levels=metroLevels();
 $m('metro-beats').innerHTML=levels.map((l,i)=>`<span class="metro-dot level-${l}" data-beat="${i}"></span>`).join('');
 $m('metro-beats').classList.toggle('is-dense',metro.beats>12);
 $m('metro-fab-bpm').textContent=metro.bpm;
}
function setMetro(changes){
 Object.assign(metro,changes);
 metro.bpm=clampBpm(metro.bpm);
 metro.beats=Math.min(32,Math.max(1,Math.round(Number(metro.beats)||1)));
 if(metro.index>=metro.beats)metro.index=0;
 renderMetro();saveMetro();
}

function scheduleClick(time,level){
 const ctx=metro.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type='triangle';osc.frequency.value=[1000,1450,1900][level];
 const peak=metro.volume*[.5,.75,1][level];
 gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(peak,time+.002);gain.gain.exponentialRampToValueAtTime(.0001,time+.06);
 osc.connect(gain);gain.connect(ctx.destination);
 osc.start(time);osc.stop(time+.07);
 osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function topUp(){
 const ahead=document.hidden?1.6:.12,levels=metroLevels();
 while(metro.next<metro.ctx.currentTime+ahead){
  const beat=metro.index%metro.beats;
  scheduleClick(metro.next,levels[beat]??0);
  metro.queue.push({beat,time:metro.next,level:levels[beat]??0});
  metro.next+=60/metro.bpm;
  metro.index=(beat+1)%metro.beats;
 }
}
// Light the beat dot and pulse the floating button when each scheduled click actually sounds.
function animateBeats(){
 const now=metro.ctx.currentTime;
 while(metro.queue.length&&metro.queue[0].time<=now){
  const {beat,level}=metro.queue.shift();
  document.querySelectorAll('#metro-beats .metro-dot').forEach(d=>d.classList.toggle('is-on',Number(d.dataset.beat)===beat));
  const fab=$m('metro-fab');fab.classList.remove('beat','beat-strong');void fab.offsetWidth;fab.classList.add(level===2?'beat-strong':'beat');
 }
 metro.frame=requestAnimationFrame(animateBeats);
}
async function startMetro(){
 try{
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw new Error('Web Audio unavailable');
  metro.ctx??=new Audio();
  // Browsers only allow sound after a real click; if unlocking stalls, say so instead of waiting forever.
  await Promise.race([metro.ctx.resume(),new Promise(r=>setTimeout(r,1500))]);
  if(metro.ctx.state!=='running'){$m('metro-hint').textContent='The browser blocked sound. Click Play again, or check that this tab is allowed to play audio.';return;}
 }catch{$m('metro-hint').textContent='Sound is unavailable in this browser.';return;}
 metro.playing=true;metro.index=0;metro.queue=[];metro.next=metro.ctx.currentTime+.06;
 topUp();metro.timer=setInterval(topUp,25);metro.frame=requestAnimationFrame(animateBeats);
 $m('metro-play').textContent='Stop';$m('metro-play').setAttribute('aria-pressed','true');
 $m('metronome').classList.add('is-playing');
}
function stopMetro(){
 metro.playing=false;clearInterval(metro.timer);cancelAnimationFrame(metro.frame);metro.timer=metro.frame=null;metro.queue=[];
 document.querySelectorAll('#metro-beats .metro-dot').forEach(d=>d.classList.remove('is-on'));
 $m('metro-play').textContent='Play';$m('metro-play').setAttribute('aria-pressed','false');
 $m('metronome').classList.remove('is-playing');
}
function toggleMetroPanel(open){
 const panel=$m('metro-panel'),fab=$m('metro-fab');
 open??=panel.hidden;
 panel.hidden=!open;
 fab.setAttribute('aria-expanded',String(open));fab.setAttribute('aria-label',open?'Close metronome':'Open metronome');
 if(open)$m('metro-play').focus();
}

$m('metro-preset').innerHTML=metroPresets.map(([n])=>`<option value="${n}">${n}</option>`).join('')+'<option value="custom">Custom</option>';
loadMetro();renderMetro();
$m('metro-fab').addEventListener('click',()=>toggleMetroPanel());
$m('metro-close').addEventListener('click',()=>{toggleMetroPanel(false);$m('metro-fab').focus();});
$m('metro-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){toggleMetroPanel(false);$m('metro-fab').focus();}});
$m('metro-play').addEventListener('click',()=>metro.playing?stopMetro():startMetro());
$m('metro-down').addEventListener('click',()=>setMetro({bpm:metro.bpm-1}));
$m('metro-up').addEventListener('click',()=>setMetro({bpm:metro.bpm+1}));
$m('metro-bpm').addEventListener('change',e=>setMetro({bpm:e.target.value}));
$m('metro-slider').addEventListener('input',e=>setMetro({bpm:e.target.value}));
$m('metro-tap').addEventListener('click',()=>{
 const now=performance.now();
 metro.taps=[...metro.taps.filter(t=>now-t<8000),now].slice(-6);
 const bpm=tempoFromTaps(metro.taps);if(bpm)setMetro({bpm});
});
$m('metro-preset').addEventListener('change',e=>{
 const preset=metroPresets.find(([n])=>n===e.target.value);
 if(preset)setMetro({beats:preset[1],unit:preset[2],groups:defaultGroups(preset[1],preset[2])});
});
// Changing the top or bottom number refreshes the suggested grouping.
$m('metro-beats-count').addEventListener('change',e=>{const beats=Math.min(32,Math.max(1,Math.round(Number(e.target.value)||1)));setMetro({beats,groups:defaultGroups(beats,metro.unit)});});
$m('metro-unit').addEventListener('change',e=>{const unit=Number(e.target.value);setMetro({unit,groups:defaultGroups(metro.beats,unit)});});
$m('metro-groups').addEventListener('change',e=>setMetro({groups:e.target.value.replace(/\s/g,'')}));
$m('metro-accent').addEventListener('change',e=>setMetro({accent:e.target.checked}));
$m('metro-volume').addEventListener('input',e=>setMetro({volume:Number(e.target.value)}));
