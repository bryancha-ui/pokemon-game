// ── Korean string dictionary ────────────────────────────────────────────────
// Exact-match English → Korean. Used by i18n `tr()` at the central chokepoints
// (DialogBox lines, menus, battle UI). Lines not present here fall back to English,
// so the game never breaks — the map can be extended incrementally.

export const KO_TYPES: Record<string, string> = {
  normal: '노멀', fire: '불꽃', water: '물', grass: '풀', electric: '전기',
  ice: '얼음', fighting: '격투', poison: '독', ground: '땅', flying: '비행',
  psychic: '에스퍼', bug: '벌레', rock: '바위', ghost: '고스트', dragon: '드래곤',
  dark: '악', steel: '강철', fairy: '페어리',
};

// Speaker names (the part before ": " in a dialogue line). tr() translates these
// separately so a line only needs its spoken text translated to localize fully.
export const KO_SPEAKERS: Record<string, string> = {
  'Prof. Song': '송 박사', 'Professor Song': '송 박사', 'Prof. Kim': '김 박사',
  'Rival': '라이벌', 'Mom': '엄마', 'Nurse Joy': '조이 간호사', 'Mart Clerk': '마트 점원',
  "Trainer's PC": '트레이너 PC', 'Ranger': '레인저', 'Ranger Sooyeon': '레인저 수연',
  'Byeoksan': '벽산', 'Leader Byeoksan': '관장 벽산', 'Champion Hwangeum': '챔피언 황금',
  'Taewang': '태왕', 'Sovereign Clemont': '군주 클레몽',
  '어사대장 Jinnok': '어사대장 진옥', '어사대장 Jito': '어사대장 지토',
  'Team Suri Grunt A': '수리단 조무래기 A', 'Team Suri Operative': '수리단 대원',
  // Gym leaders + their trainers
  'Taeguk': '태극', 'Nari': '나리', 'Boram': '보람', 'Junho': '준호',
  'Namsun': '남순', 'Leader Namsun': '관장 남순', 'Haedo': '해도',
  'Harang': '하랑', 'Leader Harang': '관장 하랑',
  'Contest Hall Usher': '콘테스트 홀 안내원', 'Usher': '안내원',
  'Chungha': '청하', 'Noksaek': '녹색', 'Leader Noksaek': '관장 녹색',
  'Seongwoo': '성우', 'Beonge': '번개', 'Leader Beonge': '관장 번개',
  'Miso': '미소', 'Jin': '진', 'Leader Jin': '관장 진', 'Jaemin': '재민', 'Yuna': '유나',
  'Commander Ryeo': '사령관 려', 'Director Suri': '수리 국장', 'Admin Chaeyeon': '간부 채연',
  'Grunt': '조무래기', 'Nurse': '간호사',
  // Northern League Elite Four + champion
  'Seorak': '서락', 'Hanseol': '한설', 'Cheolgang': '철강', 'Baekho': '백호',
};

export const KO_STRINGS: Record<string, string> = {
  // ── Intro (Prof. Song's welcome) ──
  'Hello there! Welcome to the world of Pokémon!': '안녕! 포켓몬의 세계에 온 걸 환영해!',
  'My name is Song. Song Nam-woo. But everyone in the region simply calls me the Professor.':
    '내 이름은 송. 송남우란다. 하지만 이 지방 사람들은 모두 나를 박사님이라 부르지.',
  'But first — tell me a little about yourself. Are you a boy? Or are you a girl?':
    '하지만 먼저 — 너에 대해 조금 알려주렴. 남자아이니? 아니면 여자아이니?',

  // ── Starter select ──
  'Prof. Song: Welcome! Three Pokémon from this region are waiting for a trainer.\nChoose the one who calls to you.':
    '송 박사: 어서 오렴! 이 지방의 포켓몬 세 마리가 트레이너를 기다리고 있단다.\n마음이 이끄는 포켓몬을 골라보렴.',
  '◀ ▶ to browse     SPACE to choose': '◀ ▶ 둘러보기     SPACE 선택',

  // ── Pokémon Center (nurse / clerk / PC) — spoken text (speaker auto-translated) ──
  'Welcome to the Pokémon Center! 🌸': '포켓몬 센터에 오신 걸 환영합니다! 🌸',
  'We restore your tired Pokémon.\nShall I heal your Pokémon?':
    '지친 포켓몬을 회복시켜 드려요.\n포켓몬을 회복할까요?',
  "We'll take your Pokémon for just a moment!": '포켓몬을 잠시 맡아둘게요!',
  '...  ✨  ...  ✨  ...  ✨': '...  ✨  ...  ✨  ...  ✨',
  'Your Pokémon have been fully restored!\nPlease come again! 🌸':
    '포켓몬이 완전히 회복되었습니다!\n또 오세요! 🌸',
  'Okay! Please come again anytime. 🌸': '알겠어요! 언제든 다시 오세요. 🌸',
  'Welcome! Take a look at our wares.': '어서 오세요! 상품을 둘러보세요.',
  'Accessing Pokémon storage system...': '포켓몬 보관 시스템에 접속 중...',

  // ── Common battle lines (dynamic name lines handled in-scene) ──
  'Go!': '가랏!',
  // ── Title / save ──
  '▶  NEW GAME': '▶  새 게임',
  '▶  CONTINUE': '▶  이어하기',
  'Language': '언어',
  'Start a new game?': '새 게임을 시작할까요?',
  'Your current saved game will be erased.\nAre you sure you want to start over?':
    '현재 저장된 게임이 삭제됩니다.\n정말 새로 시작하시겠어요?',
  '  No, keep my save  ': '  아니요, 저장 유지  ',
  '  Yes, start over  ': '  네, 새로 시작  ',
  '↩  Restore previous save': '↩  이전 저장 복구',

  // ── Battle: action menu ──
  'FIGHT': '싸운다', 'BAG': '가방', 'POKÉMON': '포켓몬', 'RUN': '도망',
  'No usable items in the bag.': '가방에 사용할 수 있는 아이템이 없습니다.',
  'Choose your next Pokémon!': '다음 포켓몬을 선택하세요!',

  // ── Battle: outcome / status lines (static) ──
  'A critical hit!': '급소에 맞았다!',
  "It's super effective!": '효과가 굉장했다!',
  "It's not very effective...": '효과가 별로인 듯하다...',
  'It had no effect...': '효과가 없는 것 같다...',
  'But it missed!': '하지만 빗나갔다!',
  'Got away safely!': '무사히 도망쳤다!',
  "Can't escape!": '도망칠 수 없다!',
  'You have no more Pokémon!': '더 이상 싸울 수 있는 포켓몬이 없다!',
  "You're out of Pokémon!": '포켓몬이 모두 쓰러졌다!',

  // ── Menu (pause) ──
  'POKéDEX': '도감', 'POKÉDEX': '도감',
  'POKéMON': '포켓몬', 'SAVE': '저장', 'OPTION': '설정',
  'EXIT': '닫기', 'BACK': '뒤로', 'CANCEL': '취소', 'YES': '예', 'NO': '아니오',

  // ── City arrivals / building entries ──
  'You have arrived at Capitol City!': '수도 시티에 도착했다!',
  'This vast capital holds the heart of the nation.': '이 거대한 수도는 나라의 중심지다.',
  'You reach Baekdu City (백두 시티).': '백두 시티에 도착했다.',
  'You descend into Haean City (해안 시티).': '해안 시티로 내려간다.',
  'You reach Sunrise City (일출 시티) — the easternmost city, first to greet the dawn.':
    '일출 시티에 도착했다 — 새벽을 가장 먼저 맞이하는 가장 동쪽의 도시.',
  'You entered the Capitol Gym!': '수도 체육관에 들어섰다!',
  'You entered the Summit Dojo (정상 도장)!': '정상 도장에 들어섰다!',
  'You enter the Living Temple (생명 신전)!': '생명 신전에 들어섰다!',
  'You enter the Tidal Arena (조류 경기장)!': '조류 경기장에 들어섰다!',

  // ── Control hints (shared across scenes) ──
  'WASD: move  SPACE: enter/talk  M: menu': 'WASD: 이동  SPACE: 입장/대화  M: 메뉴',
  'WASD: move  SHIFT: run  SPACE: talk  M: menu': 'WASD: 이동  SHIFT: 달리기  SPACE: 대화  M: 메뉴',
  'WASD: move  SPACE: interact  M: menu': 'WASD: 이동  SPACE: 상호작용  M: 메뉴',

  // ── Baekdu City ──
  'A rugged highland city built around a brilliant blue crater lake — Cheonji, the Heaven Lake.':
    '눈부시게 푸른 화구호 — 천지를 중심으로 세워진 험준한 고산 도시.',
  'Mountaineers in heavy coats trade gear and soak in hot springs.':
    '두꺼운 코트를 입은 등산가들이 장비를 거래하고 온천에 몸을 담근다.',
  'But here and there, figures in black coats with red thread linger... watching.':
    '하지만 곳곳에 붉은 실이 새겨진 검은 코트의 인물들이 서성인다... 지켜보면서.',
  'A ranger blocks the eastern trail to Diamond Gorge.':
    '레인저가 다이아몬드 협곡으로 가는 동쪽 길을 막고 있다.',
  'Center & Rescue Station': '센터 & 구조대',
  'Mountain Gear Shop': '등산 장비점',

  // ── Geumgang City ──
  'You arrive in Geumgang City (금강 시티).': '금강 시티에 도착했다.',
  'An elegant river city famous for its Contest Hall and thousand-lantern stage.':
    '콘테스트 홀과 천 개의 등불 무대로 유명한 우아한 강변 도시.',
  'Contest Hall Usher: Welcome to the Geumgang Contest Hall!':
    '콘테스트 홀 안내원: 금강 콘테스트 홀에 오신 걸 환영합니다!',
  'Usher: Coordinators dazzle the crowd here with their Pokémon. (Contests coming soon!)':
    '안내원: 코디네이터들이 포켓몬으로 관중을 매료시키는 곳이에요. (콘테스트 곧 추가 예정!)',

  // ── Route 2 / signposts ──
  '↑ Pine Needle Town': '↑ 솔잎 마을',
  '🏯 Roadside Pavilion': '🏯 길가 정자',
  '↑ Coastal Road (Route 4)': '↑ 해안 도로 (4번 도로)',

  // ── Haean City ──
  'Hillside houses stacked to the ridge, a roaring fish market, a container port, and a black-sand beach.':
    '능선까지 층층이 쌓인 언덕 위 집들, 활기찬 어시장, 컨테이너 항구, 그리고 검은 모래 해변.',

  // ── Forest City ──
  'A city grown INTO the forest — homes nestled between titanic trees, linked by rope bridges.':
    '숲 속으로 자라난 도시 — 거대한 나무들 사이에 둥지를 튼 집들이 밧줄 다리로 이어져 있다.',
  'Bioluminescent plants light the paths with a soft green glow.':
    '생체발광 식물들이 은은한 초록빛으로 길을 밝힌다.',
  'The Living Temple gym rises among the roots ahead.':
    '앞쪽 뿌리 사이로 생명 신전 체육관이 솟아 있다.',
  'Prof. Song (over the Pokédex): There she is. She never truly left you — the bond holds.':
    '송 박사 (도감 너머로): 저기 있구나. 그녀는 결코 널 떠난 적이 없었어 — 유대는 이어져 있단다.',

  // ── Sunrise City ──
  'Volcanic rock, a black-sand beach, and a lighthouse over the East Sea. The great Gym crowns the plaza.':
    '화산암, 검은 모래 해변, 그리고 동해를 굽어보는 등대. 광장 꼭대기엔 거대한 체육관이 있다.',

  // ── Capitol City ──
  'Explore the city, visit the Capitol Tower,\nand challenge the Capitol Gym!':
    '도시를 둘러보고, 수도 타워를 방문하고,\n수도 체육관에 도전하세요!',
  'The Gym Leader Jin awaits at the northern gym.\nPrepare well — her shadow Pokémon are powerful.':
    '관장 진이 북쪽 체육관에서 기다리고 있어요.\n잘 준비하세요 — 그녀의 섀도우 포켓몬은 강력합니다.',

  // ── Baekdu Gym (Summit Dojo) ──
  'Open-walled training hall built into the mountainside, overlooking the highland lake.':
    '산비탈에 지어진 개방형 수련장, 고산 호수를 굽어본다.',
  'Cross the weighted stepping stones and defeat the two Gym Trainers to reach Leader Byeoksan.':
    '무게추가 달린 징검다리를 건너 두 체육관 트레이너를 물리치고 관장 벽산에게 도달하라.',
  'You may leave the dojo through the south door whenever you are ready.':
    '준비가 되면 언제든 남쪽 문으로 도장을 나갈 수 있다.',
  'The mountain does not move for anyone. Neither do I!': '산은 누구에게도 움직이지 않아. 나도 마찬가지다!',
  'Speed is more important than strength. Let me prove it!': '속도가 힘보다 중요해. 증명해 보이겠어!',
  '(He turns his weathered gaze toward the highland lake.)': '(그는 풍상에 닳은 시선을 고산 호수로 돌린다.)',
  'Something is disturbing the deep. Be watchful.': '깊은 곳에서 무언가가 요동치고 있어. 경계를 늦추지 마라.',

  // ── Geumgang Gym (Lantern Stage) ──
  'You step onto the Lantern Stage (등불 무대)!': '등불 무대에 올라섰다!',
  'The lanterns choose who advances. Tonight, they chose me!': '등불이 나아갈 자를 고른다. 오늘 밤, 등불은 나를 골랐어!',
  '(She lowers her voice.)': '(그녀가 목소리를 낮춘다.)',
  'A group in dark uniforms passed through carrying large sealed containers, moving south.':
    '어두운 제복을 입은 무리가 커다란 밀봉 용기를 들고 남쪽으로 지나갔어.',
  'My Pokémon were agitated all night. Whatever they carry, it does not sit right with the living world.':
    '내 포켓몬들이 밤새 안절부절못했어. 그들이 무얼 나르든, 살아있는 세계와는 맞지 않는 것 같아.',
  'You may leave through the south door whenever you are ready.': '준비가 되면 언제든 남쪽 문으로 나갈 수 있다.',

  // ── Haean Gym (Tidal Arena) ──
  'A port-edge arena, half-submerged at high tide. Tidal gates rise and fall on a timer.':
    '만조 때 절반쯤 잠기는 항구 끝의 경기장. 조수 관문이 시간에 맞춰 오르내린다.',
  'The tide waits for no challenger. Neither will I!': '파도는 어떤 도전자도 기다리지 않아. 나도 그럴 거다!',
  'Those dark-coated ones — they loaded sealed crates onto a barge at the Midnight Port and sailed south.':
    '그 검은 코트를 입은 자들 — 자정 항구에서 밀봉된 상자들을 바지선에 싣고 남쪽으로 항해했어.',
  'Whatever the sea is carrying for them, it should have stayed sunk. Watch yourself out there.':
    '바다가 그들을 위해 무얼 나르든, 그건 가라앉은 채로 있어야 했어. 밖에서 조심해.',

  // ── Sudo City finale party ──
  'The whole region floods the streets. Lanterns, music, confetti; north and south celebrating as one people for the first time in living memory.':
    '온 지방 사람들이 거리로 쏟아져 나온다. 등불, 음악, 색종이; 남과 북이 기억하는 한 처음으로 한 민족으로서 축하한다.',
  '🎉 The city celebrates deep into the night in your honour.': '🎉 도시는 너를 기리며 밤늦도록 축하한다.',

  // ── Forest Gym (Living Temple) ──
  'A vast greenhouse-shrine where vines and roots grow in real time, opening and blocking the way.':
    '덩굴과 뿌리가 실시간으로 자라며 길을 열고 막는 거대한 온실 신전.',
  'Defeat the two Gym Trainers, then face Leader Noksaek, the Ancient Keeper.':
    '두 체육관 트레이너를 물리치고, 고대의 수호자 관장 녹색과 맞서라.',
  'The temple grows as it pleases. So do my Pokémon — endlessly!': '신전은 제멋대로 자라나. 내 포켓몬들도 마찬가지지 — 끝없이!',
  'The seventh seal lies near the eastern coast — the Sunrise Cliffs.': '일곱 번째 봉인은 동쪽 해안 — 일출 절벽 근처에 있어.',
  'But I sense something stirring far to the south as well. The Grandmother wakes uneasily.':
    '하지만 남쪽 멀리서도 무언가 꿈틀대는 게 느껴져. 할망이 불안하게 깨어나고 있어.',

  // ── Sunrise Gym (Cliff Observatory) ──
  'You climb into the Cliff Observatory (절벽 천문대)!': '절벽 천문대에 올랐다!',
  'Half gym, half observatory, bolted into the sea-cliffs. Current crackles through rotating panels.':
    '절반은 체육관, 절반은 천문대로 바다 절벽에 박혀 있다. 회전하는 패널 사이로 전류가 튄다.',
  'Defeat the two Gym Trainers, then face Leader Beonge, the Stormwatcher.':
    '두 체육관 트레이너를 물리치고, 폭풍지기 관장 번개와 맞서라.',
  'Read the current, or it reads you. Light it up!': '전류를 읽든지, 전류에 읽히든지. 불을 밝혀!',
  'The sky over Baekdu has been wrong for days — charged, waiting. Whatever you mean to do up there, do it soon.':
    '백두 위 하늘이 며칠째 이상해 — 잔뜩 충전된 채 기다리고 있어. 거기서 뭘 할 생각이든, 서둘러.',
  'Perfect timing. The sky is yours.': '완벽한 타이밍이야. 하늘은 네 거다.',

  // ── Capitol Gym ──
  'The air feels cold and heavy with shadow...': '공기가 차갑고 그림자로 무겁게 느껴진다...',
  'Defeat the three Shadow Trainers to reach Leader Jin.': '세 명의 섀도우 트레이너를 물리치고 관장 진에게 도달하라.',
  'In darkness, only the strong survive!': '어둠 속에선 강한 자만이 살아남아!',
  'You defeated all my Shadow Trainers. Impressive.': '내 섀도우 트레이너들을 모두 물리쳤군. 인상적이야.',

  // ── Route signs / prompts ──
  '🏞️ Route 3 — Diamond Gorge (금강 협곡)': '🏞️ 3번 도로 — 다이아몬드 협곡 (금강 협곡)',
  '🌊 Route 4 — Coastal Cliffside Road (해안 절벽길)': '🌊 4번 도로 — 해안 절벽길',
  '🌳 Route 5 — The Ancient Forest (고목 숲길)': '🌳 5번 도로 — 고목 숲길',
  'SPACE — Enter the Forest Shrine': 'SPACE — 숲 신전 입장',

  // ── Forest Shrine (lullaby event) ──
  '(A vine-wreathed spirit lurches awake, hissing without its lullaby.)':
    '(덩굴에 감긴 정령이 자장가 없이 쉭쉭대며 깨어난다.)',
  '(A fox-shadow bares its teeth, grieving and afraid.)': '(여우 그림자가 슬픔과 두려움에 이를 드러낸다.)',
  'The rhythm falters and fades... the bells fall silent.': '리듬이 흔들리다 사그라든다... 종소리가 조용해진다.',

  // ── Northern League (Coliseum) ──
  'Four of the Northern Elite guard the way up. Beat each to unseal the next. Every hall restores your team before the match.':
    '북방 엘리트 넷이 위로 가는 길을 지킨다. 각자를 물리쳐 다음을 개방하라. 각 홀은 대결 전에 팀을 회복시킨다.',
  'Let us see if a southerner can move stone. Begin.': '남부인이 돌을 움직일 수 있는지 보자. 시작.',
  'Freeze, southerner — or prove you can weather the cold.': '얼어붙어라, 남부인 — 아니면 추위를 견딜 수 있음을 증명해.',
  'Strike it. See what breaks first.': '내리쳐라. 무엇이 먼저 부서지는지 보자.',
  'My storm-dragons have thrown down every challenger before you. Rise — or fall.':
    '내 폭풍룡들은 네 앞의 모든 도전자를 쓰러뜨렸다. 일어서라 — 아니면 쓰러져라.',
  "You've come a long way from your waterfalls and lantern festivals, southerner.":
    '폭포와 등불 축제에서 참 멀리도 왔구나, 남부인.',
  'Let us see if the journey made you strong — or merely lucky.':
    '그 여정이 널 강하게 만들었는지 — 아니면 그저 운이 좋았는지 보자.',

  // ── Northern Plaza ──
  'Heal at the Center, stock up at the Mart, then approach the great doors when you are ready.':
    '센터에서 회복하고, 마트에서 물품을 챙긴 뒤, 준비가 되면 거대한 문으로 향하라.',
  'WASD: move  SPACE: enter / use  M: menu': 'WASD: 이동  SPACE: 입장 / 사용  M: 메뉴',
  'SPACE — Heal your team (Pokémon Center)': 'SPACE — 팀 회복 (포켓몬 센터)',
  'SPACE — Shop (Poké Mart)': 'SPACE — 상점 (포켓몬 마트)',

  // ── Sacred Peak (finale) ──
  "어사대장 Jinnok: They're here. I'll scatter them — you reach the spirit! Prove yourself its worthy keeper!":
    '어사대장 진옥: 놈들이 왔다. 내가 흩어놓을 테니 — 넌 정령에게 다다르라! 그 자격 있는 지킴이임을 증명해!',

  // ── 어사대 circuit (Eosa cities) ──
  'WASD move  SPACE enter/exam  C bike  M menu': 'WASD 이동  SPACE 입장/시험  C 자전거  M 메뉴',
  "Churned up out of the depths, one of Gyarados's brood lunges at you!":
    '심연에서 솟구쳐, 갸라도스의 무리 하나가 네게 달려든다!',

  // ── Common overworld prompts ──
  'SPACE to continue': 'SPACE: 계속',
  'SPACE to advance': 'SPACE: 넘기기',
};
