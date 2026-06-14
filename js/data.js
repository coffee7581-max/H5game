// ===== GameCenter Data Engine v2 =====
let GAMES_RAW = [], GAMES = [], CATEGORIES = [], DISPLAY_GAMES = [], ALL_DISPLAY_GAMES = [];
let displayedCount = 60;
const LOAD_MORE_BATCH = 40;
const REMOTE_BASE_DOMAIN = [['cool','game','spark'].join(''),'com'].join('.');
const ASSETS_BASE_URL = 'https://' + REMOTE_BASE_DOMAIN + '/_next/asset';

const GAME_TYPE_IDS = {
  action:[3,286],simulation:[4,279],battle:[5,287],parkour:[6,288],sports:[7,282],shooting:[8,289],'dress up':[10,290],'tower defense':[12,291],synthesis:[13,292],'break through':[14,293],'make up':[15,281,294],casino:[16,295],cardboard:[17,280],education:[18,296],music:[19,278],puzzle:[2,284],arcade:[20,297],io:[21,298],racing:[9,283],operate:[11,299],casual:[276],adventure:[277],strategy:[285],
};
const TYPE_ID_TO_NAME = {};
for (const [n, ids] of Object.entries(GAME_TYPE_IDS)) for (const id of ids) TYPE_ID_TO_NAME[id] = n;

const TYPE_META = {
  action:{l:'Action',e:'⚡',c:1},simulation:{l:'Simulation',e:'🏗️',c:0},battle:{l:'Battle',e:'⚔️',c:1},parkour:{l:'Parkour',e:'🏃',c:1},sports:{l:'Sports',e:'⚽',c:1},shooting:{l:'Shooting',e:'🔫',c:1},'dress up':{l:'Dress Up',e:'👗',c:0},'tower defense':{l:'Tower Defense',e:'🏰',c:1},synthesis:{l:'Synthesis',e:'✨',c:0},'break through':{l:'Break Through',e:'💥',c:1},'make up':{l:'Make Up',e:'💄',c:0},casino:{l:'Casino',e:'🎰',c:0},cardboard:{l:'Cardboard',e:'📦',c:0},education:{l:'Education',e:'📚',c:0},music:{l:'Music',e:'🎵',c:0},puzzle:{l:'Puzzle',e:'🧩',c:0},arcade:{l:'Arcade',e:'🕹️',c:1},io:{l:'IO',e:'🌐',c:1},racing:{l:'Racing',e:'🏎️',c:1},operate:{l:'Operate',e:'🎛️',c:0},casual:{l:'Casual',e:'🎮',c:0},adventure:{l:'Adventure',e:'🗺️',c:0},strategy:{l:'Strategy',e:'♟️',c:1},
};
const CATEGORY_EDITORIAL = {
  all:{
    title:'Explore the catalog with a little more intention',
    intro:'WePlay works best when you treat it like a curated shelf instead of an endless scroll. Start with one mood, one session length, and one control style, then let the recommendations narrow the field for you.',
    bestFor:'Players who want a quick path to something that fits the moment instead of bouncing between random thumbnails.',
    session:'Best when you know whether you want a five-minute reset, a score chase, or a longer run.',
    tips:['Use category filters first, then compare ratings and tags.', 'If a game clicks fast, open the detail page and keep exploring similar picks.', 'Rotate between short session games and slower progression games so the catalog keeps feeling fresh.']
  },
  action:{
    title:'Action games here reward clean reactions, not just chaos',
    intro:'The best action picks in this catalog start quickly and teach through pressure. They work well when you want fast feedback, visible progress, and controls that make sense on a phone.',
    bestFor:'Short breaks, score chasing, and players who like quick retries.',
    session:'Usually strongest in 3 to 10 minute bursts.',
    tips:['Give the first two rounds to learning movement, not winning.', 'If a run feels messy, slow down and read enemy timing before forcing speed.', 'Look for games with one clear core action and master that first.']
  },
  simulation:{
    title:'Simulation picks are strongest when the loop feels satisfying',
    intro:'Good simulation games are about rhythm: place, organize, build, repeat. The strongest ones in this library feel readable on a small screen and reward steady attention instead of constant twitch input.',
    bestFor:'Players who like management loops, visual order, and light progression.',
    session:'Works well in 8 to 20 minute sessions when you want to settle into a flow.',
    tips:['Start by understanding the main loop before optimizing.', 'If a system feels crowded, look for one bottleneck and solve that first.', 'The best simulation sessions come from small improvements, not rushing every task.']
  },
  puzzle:{
    title:'Puzzle games do better when the rules stay readable',
    intro:'The most replayable puzzle games here are the ones with one strong idea and clear escalation. They are good for players who want a quiet challenge without a long learning curve.',
    bestFor:'Focused players, commuters, and anyone who likes neat problem solving.',
    session:'Great in 5 to 15 minute windows.',
    tips:['Treat early levels like a rules tutorial, even if they look easy.', 'When stuck, stop moving pieces for a second and map the board in your head.', 'Choose games with clean visuals first if you are playing on mobile.']
  },
  sports:{
    title:'Sports games live or die on immediate control feel',
    intro:'The strongest sports picks here are not trying to simulate everything. They usually succeed by making one mechanic, shot timing, lane choice, angle control, feel crisp enough to replay.',
    bestFor:'Players who want quick competition and visible improvement.',
    session:'Usually best in short repeated runs.',
    tips:['Repeat one skill move until it becomes automatic.', 'Ignore score ceilings at first and focus on consistency.', 'Portrait sports games often read better one-handed on a phone.']
  },
  racing:{
    title:'Racing picks should feel readable before they feel fast',
    intro:'The good racing games in this catalog give you enough visual clarity to plan turns, avoid walls, and build momentum. The weaker ones feel random; the stronger ones let you learn the track logic quickly.',
    bestFor:'Players who like speed, lane planning, and retry loops.',
    session:'Best in 4 to 12 minute bursts.',
    tips:['Learn the camera rhythm before chasing speed.', 'Protect clean lines through turns instead of over-correcting.', 'If a game feels too noisy, swap to one with simpler track reads.']
  },
  adventure:{
    title:'Adventure works best when the game gives you a reason to keep moving',
    intro:'Adventure games in a browser setting need momentum. The stronger ones give you clear hazards, a simple goal, and enough variety to make each run feel like a new route instead of the same hallway again.',
    bestFor:'Players who like light exploration with a bit of tension.',
    session:'Good for medium-length sessions when you want more than a score attack.',
    tips:['Use the first minutes to learn the world rules and hazard language.', 'If a route punishes rushing, slow down and read the screen edges.', 'Adventure games pair well with similar-game browsing because the mood matters as much as the mechanic.']
  },
  strategy:{
    title:'Strategy picks should create decisions, not just busywork',
    intro:'A strong strategy game makes you choose between tempo, safety, and long-term reward. In the browser, the best ones keep those choices visible enough that you can still reason clearly on a smaller screen.',
    bestFor:'Players who like planning, territory control, and gradual advantage.',
    session:'Most rewarding in 10 to 20 minute sessions.',
    tips:['Spend the opening minute reading win conditions.', 'Protect economy or territory first, then chase style points.', 'If the board gets noisy, look for one lane or zone you can fully control.']
  },
  casual:{
    title:'Casual should still feel sharp, not disposable',
    intro:'Casual games are where quick sessions either work beautifully or fall flat. The best ones start instantly, explain themselves fast, and leave you with one more reason to tap replay.',
    bestFor:'Phone-first players and anyone browsing without a fixed goal.',
    session:'Ideal for one-handed, low-friction sessions.',
    tips:['Pick a game with one obvious hook and test it for two rounds.', 'Use ratings plus tags together, not either one alone.', 'If a casual game does not click quickly, move on fast and keep the catalog moving.']
  },
  arcade:{
    title:'Arcade picks succeed when every second matters',
    intro:'Arcade games earn repeat play with tight loops, clear failure states, and fast restarts. They are at their best when you can improve one tiny habit every run.',
    bestFor:'Players who like rhythm, precision, and visible skill growth.',
    session:'Strong in rapid repeat sessions.',
    tips:['Restart often and treat each run like practice.', 'Track one mistake pattern instead of trying to fix everything at once.', 'Arcade games are best judged by how quickly they make you want another run.']
  },
  io:{
    title:'IO games should be readable under pressure',
    intro:'The good IO-style games in this library keep the rule set simple while letting the screen get busy. That balance matters on mobile, where clarity often matters more than complexity.',
    bestFor:'Players who like chaotic arenas with simple controls.',
    session:'Great for short sessions with high replay value.',
    tips:['Understand the growth loop before picking fights.', 'Keep screen awareness wider than your character.', 'If the arena feels too crowded, choose one objective and play around it.']
  }
};
const HOME_EDITORIAL_FEATURES = [
  {
    title:'Quick starts that actually hold up',
    copy:'A strong browser game should explain itself within the first minute, feel good on a phone, and still have enough friction to stay interesting after the novelty wears off. Our picks lean toward fast onboarding and clean replay loops.',
    cta:'Open casual picks',
    cat:'casual'
  },
  {
    title:'Builder games for longer sessions',
    copy:'When you have more than a few minutes, simulation and strategy games tend to deliver the best value. They reward patience, system reading, and small improvements instead of pure reaction speed.',
    cta:'Browse simulation',
    cat:'simulation'
  },
  {
    title:'Competitive games with clear controls',
    copy:'For score chasing and direct competition, the most reliable wins usually come from action, racing, and sports games with tight input rules. We bias toward games that stay readable on mobile instead of cluttered spectacle.',
    cta:'See action games',
    cat:'action'
  }
];
function m32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function hs(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);}
function formatCount(n){if(n>=1e8)return(n/1e8).toFixed(1)+'B';if(n>=1e6)return(n/1e6).toFixed(1)+'M';if(n>=1e3)return(n/1e3).toFixed(1)+'K';return n.toString();}
function sh(a,r){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}
function buildEmbedUrl(slug){return slug?('https://' + [slug,'apps',REMOTE_BASE_DOMAIN].join('.') + '/minigame-index.html'):'';}
function gv(a,b,d){return a!==undefined&&a!==null?a:b!==undefined&&b!==null?b:d;}
function getCategoryEditorial(cat){return CATEGORY_EDITORIAL[cat]||CATEGORY_EDITORIAL.all;}
function getHomeEditorialFeatures(){return HOME_EDITORIAL_FEATURES.slice();}
function getGameEditorial(game){
  const ed=getCategoryEditorial(game.category),tags=(game.tags||[]).slice(0,3);
  const tagText=tags.length?tags.join(', '):game.catLabel;
  return{
    kicker:ed.title,
    overview:game.title+' is one of the clearer '+game.catLabel.toLowerCase()+' picks in this catalog. It opens fast, reads well on a small screen, and suits players looking for '+tagText.toLowerCase()+' without a long setup.',
    why:'We feature this game because its first minutes communicate the core loop quickly. You can tell what matters, what to avoid, and whether the session is heading toward speed, control, or deliberate planning.',
    fit:'Best for players who want '+ed.bestFor.toLowerCase()+'. For mobile browsing, it is the kind of pick that makes sense after one or two exploratory runs.',
    tips:ed.tips.map(function(t,i){return i===0?game.title+': '+t:t;}),
    session:ed.session
  };
}

const WORLD_NAMES = [
  'Akira Tanaka','Mei Lin','Sven Olsson','Fatima Al-Rashid','Diego Fernandez','Yuki Nakamura','Olga Petrova','Chen Wei','Priya Sharma','Ahmed Hassan','Lars Johansson','Maria Silva','Hiroshi Yamamoto','Chloe Martin','Bao Nguyen','Kwame Asante','Anastasia Popov','Ravi Patel','Ingrid Larsen','Thiago Costa','Sakura Ito','Dmitri Volkov','Aisha Mohammed','Liam O\'Brien','Yuna Park','Carlos Ruiz','Giulia Rossi','Jun Takahashi','Nadia Fedorova','Omar Khalid','Freya Andersen','Pedro Alvarez','Keiko Sato','Viktor Novak','Leila Benali','Erik Magnusson','Sofia Gonzalez','Takeshi Mori','Irina Sokolova','Malik Diallo','Emma Larsson','Daniel Kowalski','Amara Okafor','Hans Mueller','Lena Berg','Zara Khoury','Kenji Watanabe','Bella Rossi','Arjun Mehta',
];

function genDesc(g){
  const c=g.categoryLabel||g.category,n=g.title,r=m32(g.id*7919+3);
  const I=['Dive into '+n+', a captivating '+c+' game. Play instantly in your browser!',n+' delivers an incredible '+c+' experience. No download needed!','Get ready for an amazing '+c+' adventure with '+n+'. Click and play!',n+' – the ultimate '+c+' game for quick, fun sessions anytime.'];
  const T=['Take your time to learn the mechanics.','Look for power-ups hidden in levels.','Watch for patterns – obstacles follow rhythms.','Try different strategies to find your style.','Collect bonus items for extra points.','Timing is everything – wait for the perfect moment.','Share high scores and challenge friends!','Master the controls early for best results.'];
  return I[Math.floor(r()*I.length)]+' '+T[Math.floor(r()*T.length)]+' '+T[Math.floor(r()*T.length)];
}


const MULTI_TPS = [
  "\u8d85\u597d\u73a9\uff01\u5df2\u7ecf\u73a9\u4e86\u597d\u51e0\u5468\u4e86\uff0c\u505c\u4e0d\u4e0b\u6765",
  "\u8fd9\u662f\u6211\u73a9\u8fc7\u6700\u597d\u7684{cat}\u6e38\u620f",
  "\u753b\u9762\u7cbe\u7f8e\uff0c\u64cd\u4f5c\u6d41\u7545\uff0c\u6253\u53d1\u65f6\u95f4\u7684\u5229\u5668",
  "\u7b80\u5355\u6613\u4e0a\u624b\uff0c\u4f46\u8d8a\u5230\u540e\u9762\u8d8a\u6709\u6311\u6218",
  "\u3081\u3063\u3061\u3083\u9762\u767d\u3044\uff01\u6bce\u65e5\u30d7\u30ec\u30a4\u3057\u3066\u307e\u3059",
  "\u6700\u9ad8\u306e{cat}\u30b2\u30fc\u30e0\uff01\u53cb\u9054\u306b\u3082\u52e7\u3081\u307e\u3057\u305f",
  "\uc9c4\uc9dc \uc7ac\ubc0c\uc5b4\uc694! \ub9e4\uc77c\ub9e4\uc77c \ud558\uace0 \uc788\uc5b4\uc694",
  "\uc774\ub7f0 {cat} \uac8c\uc784 \ucc98\uc74c\uc774\uc5d0\uc694. \ucd5c\uace0!",
  "\u00a1Me encanta! Llevo semanas jugando sin parar",
  "Uno de los mejores juegos de {cat} que he probado",
  "J'adore ce jeu ! J'y joue depuis des semaines",
  "Un des meilleurs jeux {cat} que j'ai essay\u00e9s",
  "\u0644\u0639\u0628\u0629 \u0631\u0627\u0626\u0639\u0629! \u0623\u0644\u0639\u0628\u0647\u0627 \u0643\u0644 \u064a\u0648\u0645",
  "\u041e\u0442\u043b\u0438\u0447\u043d\u0430\u044f \u0438\u0433\u0440\u0430! \u0418\u0433\u0440\u0430\u044e \u043a\u0430\u0436\u0434\u044b\u0439 \u0434\u0435\u043d\u044c",
  "Harika bir oyun! Her g\u00fcn oynuyorum",
  "Tr\u00f2 ch\u01a1i r\u1ea5t hay! T\u00f4i ch\u01a1i h\u00e0ng tu\u1ea7n r\u1ed3i"
];

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
  for(let i=0;i<c;i++){let n;do{n=WORLD_NAMES[Math.floor(r()*WORLD_NAMES.length)];}while(used.has(n)&&used.size<WORLD_NAMES.length);used.add(n);const allTps=tps.concat(MULTI_TPS),isEn=r()<0.6,pool=isEn?tps:allTps,rt=rats[i],tx=pool[Math.floor(r()*pool.length)].replace('{cat}',g.categoryLabel||g.category);const d=new Date();d.setDate(d.getDate()-Math.floor(r()*180));rev.push({user:n,avatar:n.charAt(0),rating:rt,date:d.toISOString().split('T')[0],text:tx});}
  rev.sort((a,b)=>b.date.localeCompare(a.date));var avg=rev.reduce(function(s,r){return s+r.rating;},0)/rev.length;g.rating=Math.round(avg*10)/10;return rev;
}

function genLeaderboard(g,count=15){const r=m32(g.id*6271+11),used=new Set(),b=[];for(let i=0;i<count;i++){let n;do{n=WORLD_NAMES[Math.floor(r()*WORLD_NAMES.length)];}while(used.has(n)&&used.size<WORLD_NAMES.length);used.add(n);b.push({rank:i+1,name:n,avatar:n.charAt(0),avatarColor:`hsl(${hs(n)%360},55%,50%)`,score:(Math.max(10,350-i*45-Math.floor(r()*45))).toLocaleString(),medal:i===0?'🥇':i===1?'🥈':i===2?'🥉':''});}return b;}

function getCat(types){if(!types?.length)return'casual';for(const t of types){const n=TYPE_ID_TO_NAME[t];if(n)return n;}return'casual';}
function getTypeNames(types){if(!types?.length)return['casual'];const ns=[];for(const t of types){const n=TYPE_ID_TO_NAME[t];if(n&&!ns.includes(n))ns.push(n);}return ns.length?ns:['casual'];}

function mapGame(raw){
  const slug=gv(raw.s,raw.app_id,'');
  const b=raw.b||raw.base||{},m=raw.m||raw.game_material||{},types=gv(b.y,b.types,[]),tns=getTypeNames(types),cat=getCat(types),mt=TYPE_META[cat]||TYPE_META['casual'];
  let tags=[...new Set(tns.map(n=>TYPE_META[n]?.l||n))];
  const kw=gv(b.k?.a,b.keywords?.contentArray,[]);if(kw.length)for(const t of kw.flatMap(x=>x.split(/[，,]/).map(s=>s.trim()).filter(Boolean))){if(!tags.includes(t))tags.push(t);}
  tags=tags.slice(0,5);
  const ip=gv(m.i,gv(m.icon,m.small_icon,''),''),fp=gv(m.b,gv(m.banner,gv(m.big_icon,m.flash,''),''),'');
  const title=gv(b.n,b.display_name,'Unknown');
  const tagLine=gv(b.g,b.tag_line,'');
  const likes=gv(b.l,b.like_count,0);
  const rating=gv(b.v,b.rating,0);
  const mode=gv(b.o,b.mode,[]);
  const desc=gv(b.d?.c,b.description?.content,'');
  const recommends=gv(raw.r,raw.recommend_hot_games,[]);
  const createdAt=gv(raw.t,raw.created_at,0);
  const hue=hs(slug||title)%360;
  return{
    id:raw.id,slug,title,tagLine,
    category:cat,catLabel:mt.l,catEmoji:mt.e,isComp:mt.c,
    tags,rating,players:formatCount(likes),likeCount:likes,
    desc,autoDesc:'',
    coverColor:`hsl(${hue},50%,42%)`,coverColor2:`hsl(${hue},40%,22%)`,coverEmoji:mt.e,
    embedUrl:buildEmbedUrl(slug),iconUrl:ip?ASSETS_BASE_URL+ip:'',bannerUrl:fp?ASSETS_BASE_URL+fp:'',
    recommends,mode,createdAt,
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
  for(const[cat,games]of Object.entries(cg)){let cnt=games.length>=60?Math.ceil(games.length/3):Math.ceil(games.length/2);const r=m32(hs(cat)+ts);ALL_DISPLAY_GAMES.push(...[...games].sort(()=>Math.random()-0.5).slice(0,cnt));}
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
function getFeatured(c=10){var pool=[...ALL_DISPLAY_GAMES].sort(()=>Math.random()-0.5);return pool.slice(0,c);}
function getHot(){return ALL_DISPLAY_GAMES.filter(g=>g.features.hot).sort(()=>Math.random()-0.5);}
function getNew(){return ALL_DISPLAY_GAMES.filter(g=>g.features.new).sort(()=>Math.random()-0.5);}
function getRelated(game,c=5){var pool=ALL_DISPLAY_GAMES.filter(g=>g.id!==game.id&&g.category===game.category).sort((a,b)=>b.likeCount-a.likeCount).slice(0,c*4);return pool.sort(()=>Math.random()-0.5).slice(0,c);}
function getPopular(c=6){var pool=[...ALL_DISPLAY_GAMES].sort((a,b)=>b.likeCount-a.likeCount).slice(0,c*4);return pool.sort(()=>Math.random()-0.5).slice(0,c);}
function getRandom(c=6,ex=null){const p=ALL_DISPLAY_GAMES.filter(g=>g.id!==ex);return sh(p,m32(Date.now()%100000+1)).slice(0,c);}
function getRecommended(game,c=6){if(!game.recommends?.length)return getRandom(c,game.id);const rs=game.recommends.map(s=>getGameBySlug(s)).filter(Boolean);if(rs.length<c){const m=getRandom(c-rs.length,game.id);return[...rs,...m.filter(g=>!rs.find(r=>r.id===g.id))];}return rs.slice(0,c);}
function stars(r){const x=Math.round(r);return'★'.repeat(x)+'☆'.repeat(5-x);}
function starsHtml(r){const x=Math.round(r);let h='';for(let i=0;i<x;i++)h+='<span class="star active">★</span>';for(let i=x;i<5;i++)h+='<span class="star">★</span>';return h;}
function hasMoreG(){return DISPLAY_GAMES.length<ALL_DISPLAY_GAMES.length;}
const params=new URLSearchParams(window.location.search);
