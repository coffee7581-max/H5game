// ===== GameCenter Data Engine v2 =====
let GAMES_RAW = [], GAMES = [], CATEGORIES = [], DISPLAY_GAMES = [], ALL_DISPLAY_GAMES = [];
let displayedCount = 60;
const LOAD_MORE_BATCH = 40, ASSETS_BASE_URL = 'https://coolgamespark.com/_next/asset';

const GAME_TYPE_IDS = {
  action:[3,286],simulation:[4,279],battle:[5,287],parkour:[6,288],sports:[7,282],shooting:[8,289],'dress up':[10,290],'tower defense':[12,291],synthesis:[13,292],'break through':[14,293],'make up':[15,281,294],casino:[16,295],cardboard:[17,280],education:[18,296],music:[19,278],puzzle:[2,284],arcade:[20,297],io:[21,298],racing:[9,283],operate:[11,299],casual:[276],adventure:[277],strategy:[285],
};
const TYPE_ID_TO_NAME = {};
for (const [n, ids] of Object.entries(GAME_TYPE_IDS)) for (const id of ids) TYPE_ID_TO_NAME[id] = n;

const TYPE_META = {
  action:{l:'Action',e:'⚡',c:1},simulation:{l:'Simulation',e:'🏗️',c:0},battle:{l:'Battle',e:'⚔️',c:1},parkour:{l:'Parkour',e:'🏃',c:1},sports:{l:'Sports',e:'⚽',c:1},shooting:{l:'Shooting',e:'🔫',c:1},'dress up':{l:'Dress Up',e:'👗',c:0},'tower defense':{l:'Tower Defense',e:'🏰',c:1},synthesis:{l:'Synthesis',e:'✨',c:0},'break through':{l:'Break Through',e:'💥',c:1},'make up':{l:'Make Up',e:'💄',c:0},casino:{l:'Casino',e:'🎰',c:0},cardboard:{l:'Cardboard',e:'📦',c:0},education:{l:'Education',e:'📚',c:0},music:{l:'Music',e:'🎵',c:0},puzzle:{l:'Puzzle',e:'🧩',c:0},arcade:{l:'Arcade',e:'🕹️',c:1},io:{l:'IO',e:'🌐',c:1},racing:{l:'Racing',e:'🏎️',c:1},operate:{l:'Operate',e:'🎛️',c:0},casual:{l:'Casual',e:'🎮',c:0},adventure:{l:'Adventure',e:'🗺️',c:0},strategy:{l:'Strategy',e:'♟️',c:1},
};
function m32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hs(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function fc(n){if(n>=1e8)return(n/1e8).toFixed(1)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n.toString();}
function sh(a,r){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

const WORLD_NAMES = [
  'Akira Tanaka','Mei Lin','Sven Olsson','Fatima Al-Rashid','Diego Fernandez','Yuki Nakamura','Olga Petrova','Chen Wei','Priya Sharma','Ahmed Hassan','Lars Johansson','Maria Silva','Hiroshi Yamamoto','Chloe Martin','Bao Nguyen','Kwame Asante','Anastasia Popov','Ravi Patel','Ingrid Larsen','Thiago Costa','Sakura Ito','Dmitri Volkov','Aisha Mohammed','Liam O\'Brien','Yuna Park','Carlos Ruiz','Giulia Rossi','Jun Takahashi','Nadia Fedorova','Omar Khalid','Freya Andersen','Pedro Alvarez','Keiko Sato','Viktor Novak','Leila Benali','Erik Magnusson','Sofia Gonzalez','Takeshi Mori','Irina Sokolova','Malik Diallo','Emma Larsson','Daniel Kowalski','Amara Okafor','Hans Mueller','Lena Berg','Zara Khoury','Kenji Watanabe','Bella Rossi','Arjun Mehta',
];

function genDesc(g){
  const c=g.categoryLabel||g.category,n=g.title,r=m32(g.id*7919+3);
  const I=['Dive into '+n+', a captivating '+c+' game. Play instantly in your browser!',n+' delivers an incredible '+c+' experience. No download needed!','Get ready for an amazing '+c+' adventure with '+n+'. Click and play!',n+' – the ultimate '+c+' game for quick, fun sessions anytime.'];
  const T=['Take your time to learn the mechanics.','Look for power-ups hidden in levels.','Watch for patterns – obstacles follow rhythms.','Try different strategies to find your style.','Collect bonus items for extra points.','Timing is everything – wait for the perfect moment.','Share high scores and challenge friends!','Master the controls early for best results.'];
  return I[Math.floor(r()*I.length)]+' '+T[Math.floor(r()*T.length)]+' '+T[Math.floor(r()*T.length)];
}

function genReviews(g){
  const r=m32(g.id*4931+7),c=3+Math.floor(r()*18),rev=[],used=new Set();
  const bs=(g.id*7919+g.likeCount)%100;
  let cr;
  if(bs<20)cr=3.1+r()*0.4;       // 20%: center 3.1-3.5 -> avg ~3 stars
  else if(bs<70)cr=3.6+r()*0.5;  // 50%: center 3.6-4.1 -> avg ~4 stars (peak)
  else cr=4.2+r()*0.4;            // 30%: center 4.2-4.6 -> avg ~4.5 stars
  const rats=[];
  for(let i=0;i<c;i++){const o=(r()-0.5)*2.4;rats.push(Math.max(1,Math.min(5,Math.round(cr+o))));}
  const tps=["Absolutely love this! Been playing for weeks.","One of the best {cat} games I've tried.","Great game to kill time. Well designed!","My kids love this. Fun for all ages.","Addictive gameplay! Come back every day.","Beautiful graphics, smooth controls.","Finally a {cat} game that's actually fun.","Perfect for quick breaks during the day.","Challenging but fair – great balance.","Simple but incredibly fun. Love it!","Sound effects really add to the vibe.","Great level variety and challenges.","Relaxing way to unwind after work.","Runs smoothly even on older devices.","Hidden gem, deserves more attention!","Pretty fun! Could use more levels.","Good game but later levels get tough.","Nice concept. Looking forward to updates.","Decent {cat} game. Few minor bugs.","Would love a multiplayer mode added.","Enjoyable though a bit repetitive.","Solid game. Better tutorial would help.","Good time killer. More power-ups pls!","Took time to learn but now I'm hooked.","Not bad at all for a free browser game.","It's okay. Entertaining enough I guess.","Average {cat} game. Passes the time."];
  for(let i=0;i<c;i++){let n;do{n=WORLD_NAMES[Math.floor(r()*WORLD_NAMES.length)];}while(used.has(n)&&used.size<WORLD_NAMES.length);used.add(n);const rt=rats[i],tx=tps[Math.floor(r()*tps.length)].replace('{cat}',g.categoryLabel||g.category);const d=new Date();d.setDate(d.getDate()-Math.floor(r()*180));rev.push({user:n,avatar:n.charAt(0),rating:rt,date:d.toISOString().split('T')[0],text:tx});}
  rev.sort((a,b)=>b.date.localeCompare(a.date));var avg=rev.reduce(function(s,r){return s+r.rating;},0)/rev.length;g.rating=Math.round(avg*10)/10;return rev;
}

function genLeaderboard(g,count=15){const r=m32(g.id*6271+11),used=new Set(),b=[];for(let i=0;i<count;i++){let n;do{n=WORLD_NAMES[Math.floor(r()*WORLD_NAMES.length)];}while(used.has(n)&&used.size<WORLD_NAMES.length);used.add(n);b.push({rank:i+1,name:n,avatar:n.charAt(0),avatarColor:`hsl(${hs(n)%360},55%,50%)`,score:(Math.floor(r()*900000)+50000).toLocaleString(),medal:i===0?'🥇':i===1?'🥈':i===2?'🥉':''});}return b;}

function getCat(types){if(!types?.length)return'casual';for(const t of types){const n=TYPE_ID_TO_NAME[t];if(n)return n;}return'casual';}
function getTypeNames(types){if(!types?.length)return['casual'];const ns=[];for(const t of types){const n=TYPE_ID_TO_NAME[t];if(n&&!ns.includes(n))ns.push(n);}return ns.length?ns:['casual'];}

function mapGame(raw){
  const b=raw.base||{},m=raw.game_material||{},tns=getTypeNames(b.types||[]),cat=getCat(b.types||[]),mt=TYPE_META[cat]||TYPE_META['casual'];
  let tags=[...new Set(tns.map(n=>TYPE_META[n]?.l||n))];
  const kw=b.keywords?.contentArray||[];if(kw.length)for(const t of kw.flatMap(x=>x.split(/[，,]/).map(s=>s.trim()).filter(Boolean))){if(!tags.includes(t))tags.push(t);}
  tags=tags.slice(0,5);
  const ip=m.icon||m.small_icon||'',fp=m.banner||m.big_icon||m.flash||'';
  const hue=hs(raw.app_id||(b.display_name||''))%360;
  return{
    id:raw.id,slug:raw.app_id||'',title:b.display_name||'Unknown',tagLine:b.tag_line||'',
    category:cat,catLabel:mt.l,catEmoji:mt.e,isComp:mt.c,
    tags,rating:b.rating||0,players:fc(b.like_count||0),likeCount:b.like_count||0,
    desc:b.description?.content||'',autoDesc:'',
    coverColor:`hsl(${hue},50%,42%)`,coverColor2:`hsl(${hue},40%,22%)`,coverEmoji:mt.e,
    embedUrl:b.app_url||'',iconUrl:ip?ASSETS_BASE_URL+ip:'',bannerUrl:fp?ASSETS_BASE_URL+fp:'',
    recommends:raw.recommend_hot_games||[],mode:b.mode||[],createdAt:raw.created_at||0,
    features:{featured:!1,new:!1,hot:!1},reviews:[],leaderboard:null,
  };
}

async function loadGames(){
  try{const r=await fetch('js/all.json');GAMES_RAW=await r.json();}catch(e){GAMES_RAW=[];}
  GAMES=GAMES_RAW.map(mapGame);
  const byLikes=[...GAMES].sort((a,b)=>b.likeCount-a.likeCount),byNew=[...GAMES].sort((a,b)=>b.createdAt-a.createdAt);
  const fIds=new Set(byLikes.slice(0,10).map(g=>g.id)),nIds=new Set(byNew.slice(0,10).map(g=>g.id)),hIds=new Set(byLikes.slice(0,20).map(g=>g.id));
  GAMES.forEach(g=>{g.features.featured=fIds.has(g.id);g.features.new=nIds.has(g.id);g.features.hot=hIds.has(g.id);g.autoDesc=genDesc(g);g.reviews=genReviews(g);if(g.isComp)g.leaderboard=genLeaderboard(g);});
  const cg={};GAMES.forEach(g=>{if(!cg[g.category])cg[g.category]=[];cg[g.category].push(g);});
  const ts=Date.now()%1000000;ALL_DISPLAY_GAMES=[];
  for(const[cat,games]of Object.entries(cg)){let cnt=games.length>=60?Math.ceil(games.length/3):Math.ceil(games.length/2);const r=m32(hs(cat)+ts);ALL_DISPLAY_GAMES.push(...sh(games,r).slice(0,cnt));}
  DISPLAY_GAMES=ALL_DISPLAY_GAMES.slice(0,displayedCount);
  const cs=new Set(ALL_DISPLAY_GAMES.map(g=>g.category));
  CATEGORIES=[{id:'all',name:'All Games',e:'🎯'}];
  [...cs].sort().forEach(function(c){
    var mt=TYPE_META[c]||{l:c,e:'🎯'};
    CATEGORIES.push({id:c,name:mt.e+' '+mt.l,e:mt.e});
  });
}

// API
function getGameById(id){return DISPLAY_GAMES.find(g=>g.id===parseInt(id))||ALL_DISPLAY_GAMES.find(g=>g.id===parseInt(id))||GAMES.find(g=>g.id===parseInt(id));}
function getGameBySlug(slug){return GAMES.find(g=>g.slug===slug);}
function getDGByCat(cat){return cat==='all'?DISPLAY_GAMES:DISPLAY_GAMES.filter(g=>g.category===cat);}
function getAllByCat(cat){return cat==='all'?ALL_DISPLAY_GAMES:ALL_DISPLAY_GAMES.filter(g=>g.category===cat);}
function getFeatured(){return ALL_DISPLAY_GAMES.filter(g=>g.features.featured);}
function getHot(){return ALL_DISPLAY_GAMES.filter(g=>g.features.hot);}
function getNew(){return ALL_DISPLAY_GAMES.filter(g=>g.features.new);}
function getRelated(game,c=5){return ALL_DISPLAY_GAMES.filter(g=>g.id!==game.id&&g.category===game.category).sort((a,b)=>b.likeCount-a.likeCount).slice(0,c);}
function getPopular(c=6){return[...ALL_DISPLAY_GAMES].sort((a,b)=>b.likeCount-a.likeCount).slice(0,c);}
function getRandom(c=6,ex=null){const p=ALL_DISPLAY_GAMES.filter(g=>g.id!==ex);return sh(p,m32(Date.now()%100000+1)).slice(0,c);}
function getRecommended(game,c=6){if(!game.recommends?.length)return getRandom(c,game.id);const rs=game.recommends.map(s=>getGameBySlug(s)).filter(Boolean);if(rs.length<c){const m=getRandom(c-rs.length,game.id);return[...rs,...m.filter(g=>!rs.find(r=>r.id===g.id))];}return rs.slice(0,c);}
function stars(r){const x=Math.round(r);return'★'.repeat(x)+'☆'.repeat(5-x);}
function starsHtml(r){const x=Math.round(r);let h='';for(let i=0;i<x;i++)h+='<span class="star active">★</span>';for(let i=x;i<5;i++)h+='<span class="star">★</span>';return h;}
function hasMoreG(){return DISPLAY_GAMES.length<ALL_DISPLAY_GAMES.length;}
const params=new URLSearchParams(window.location.search);
