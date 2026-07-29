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
  'Driver': '기사',
  // 어사대 chiefs (마패 circuit)
  '어사대장 Haemin': '어사대장 해민', '어사대장 Haegang': '어사대장 해강',
  '어사대장 Cheolju': '어사대장 철주', '어사대장 Mukyeong': '어사대장 무경',
  '어사대장 Amrok': '어사대장 압록', '어사대장 Seolwon': '어사대장 설원',
  '어사대장 Jeongan': '어사대장 정안', '어사대장 Hyeon': '어사대장 현',
  // 어사대 city NPC roles
  'Salt Farmer': '소금 농부', 'Old Woodsman': '늙은 나무꾼', 'Gate Guard': '관문 경비병',
  'Disciple Baekho': '제자 백호', 'Disciple Miru': '제자 미루', 'Noodle Lover': '국수 애호가',
  'Bridge Elder': '다리 어르신', 'Bathhouse Regular': '목욕탕 단골', 'Old Sailor': '늙은 뱃사람',
  'Night-crew Worker': '야간 작업자', 'Foghorn Keeper': '무적 지기', 'Rail Porter': '철도 짐꾼',
  'Border Guard': '국경 경비병', 'Fur Trader': '모피 상인', 'Ice Fisher': '얼음 낚시꾼',
  'Larch Cutter': '낙엽송 벌목꾼', 'Aurora Watcher': '오로라 관측자', '노스단 Lookout': '노스단 감시병',
  // Scholars' Road (victory road)
  'Hyeonu': '현우', 'Dawon': '다원', 'Munseok': '문석', 'Badge Scanner': '배지 스캐너',
  // 어사대 inspectors (Northern Reaches) + 노스단 ranks
  '어사대장 Salmu': '어사대장 살무', '어사대장 Gapcheol': '어사대장 갑철',
  '노스단 Grunt': '노스단 조무래기', '노스단 Admin': '노스단 간부',
  'Chaeyeon': '채연', 'Executive Mubaek': '간부 무백', 'Forest Elder': '숲 어르신',
  // Dolmoe / Seorae (side cities + gyms)
  'Stonemason': '석공', 'Potter': '옹기장이', 'Child': '아이',
  'Bawoo': '바우', 'Doran': '도란', 'Sandol': '산돌',
  'Skater': '스케이터', 'Sculptor': '조각가', 'Innkeeper': '여관 주인', 'Vendor': '노점상',
  'Tourist': '관광객', 'Coach': '코치', 'Youth': '청년',
  'Nunsong': '눈송', 'Baram': '바람', 'Yeona': '연아', 'Quarry Worker': '채석장 인부',
  'Observer Park': '관찰자 박', 'Observer': '관찰자', 'Guard': '경비병', 'Curator': '큐레이터',
  'Royal Warden': '왕실 관리인',
  // Hanbando League Elite Four + champion
  'Gyeoul': '겨울', 'Hwageum': '화금', 'Saleum': '살음', 'Hwangeum': '황금',
  // Misc trainers (defeat lines)
  'Bug Catcher': '벌레잡이 소년', 'Hiker': '등산가', 'Youngster': '꼬마', 'Team Suri': '수리단',
  'Watchtower Sentry': '망루 감시병', 'Seollan': '설란', '노스단 Soldier': '노스단 병사',
  '노스단 Sovereign-Claimant': '노스단 군주 참칭자',
  'Monk': '스님', 'Team Suri Grunt': '수리단 조무래기', '노스단 Operative': '노스단 대원',
  '노스단 Garrison Officer': '노스단 수비대 장교', 'Gate Captain Seollan': '문지기 대장 설란', 'Daejangseung': '대장승',
  'Artist Sora': '화가 소라',
};

export const KO_STRINGS: Record<string, string> = {
  // ── Intro (Prof. Song's welcome) ──
  'Hello there! Welcome to the world of Pokémon!': '안녕! 포켓몬의 세계에 온 걸 환영해!',
  'My name is Song. Song Nam-woo. But everyone in the region simply calls me the Professor.':
    '내 이름은 송. 송남우란다. 하지만 이 지방 사람들은 모두 나를 박사님이라 부르지.',
  'But first — tell me a little about yourself. Are you a boy? Or are you a girl?':
    '하지만 먼저 — 너에 대해 조금 알려주렴. 남자아이니? 아니면 여자아이니?',
  'This world is inhabited far and wide by wonderful creatures called Pokémon. We live alongside them — as friends, as partners, and sometimes as rivals in battle.':
    '이 세계는 널리, 포켓몬이라 불리는 멋진 생명체들이 살고 있단다. 우리는 그들과 함께 살아가지 — 친구로, 파트너로, 때로는 배틀의 라이벌로.',
  'This land is the Hanbando region: a peninsula of pine-needle towns and misty highlands, of volcanic isles in the south and a cold, watchful North.':
    '이 땅은 한반도 지방 — 솔잎 마을과 안개 낀 고원, 남쪽의 화산섬과 차갑고 경계 어린 북쪽으로 이루어진 반도란다.',
  'For some, Pokémon are beloved companions. For others, they are a subject of study. I have devoted my whole life to understanding the bond between people and Pokémon.':
    '누군가에겐 포켓몬은 사랑하는 동반자이고, 누군가에겐 연구의 대상이지. 나는 사람과 포켓몬의 유대를 이해하는 데 평생을 바쳐 왔단다.',
  "Your very own story is about to unfold. A world of dreams and adventures with Pokémon awaits! Let's go!":
    '이제 너만의 이야기가 펼쳐지려 하고 있어. 포켓몬과 함께하는 꿈과 모험의 세계가 기다린다! 자, 가자!',

  // ── Name entry (new game) ──
  'What is your name?': '이름이 뭐니?',
  'And what shall I call you, new trainer?': '그래, 새 트레이너여, 널 뭐라고 부를까?',
  'Your name': '너의 이름',
  "Your rival's name?": '라이벌의 이름은?',
  "Rival's name": '라이벌 이름',
  'OK': '확인',

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
  '▶ SPACE to advance  |  A to throw Pokéball': '▶ SPACE 넘기기  |  A 몬스터볼 던지기',
  'Switch to which Pokémon?': '어느 포켓몬으로 교체할까요?',
  "CAN'T RUN": '도망 불가',
  "You can't run from a trainer battle!": '트레이너 배틀에서는 도망칠 수 없어!',
  "You can't flee a Gym Battle!": '체육관 배틀에서는 도망칠 수 없어!',
  'What will you do?': '무엇을 할까?',
  'Choose a move!': '기술을 선택해!',
  'No PP left!': 'PP가 없어!',

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

  // ── Jeju / Ferry ──
  '🏝️ Jeju City — Island Heart': '🏝️ 제주 시티 — 섬의 심장',
  'The volcanic coast of Jeju rises ahead — and far above, the vents glow at the summit.':
    '제주의 화산 해안이 앞에 솟아 있다 — 그리고 저 높이, 정상의 분화구가 빛난다.',
  'The ferry idles at the pier. Sail back to Haean City on the mainland?':
    '연락선이 부두에 정박해 있다. 본토의 해안 시티로 돌아갈까?',
  '↑ Disembark — Jeju City': '↑ 하선 — 제주 시티',
  '⛴️ The Overnight Ferry (남해 연락선)': '⛴️ 밤배 (남해 연락선)',

  // ── Sudo finale party (cont.) ──
  'Rival: Two leagues, a whole villain syndicate, and now an actual GOD. ...I stopped trying to catch up a long time ago. I just get to say I knew you.':
    '라이벌: 리그 두 개, 악당 조직 하나, 그리고 이제 진짜 신까지. ...난 오래전에 널 따라잡길 포기했어. 그냥 널 알았다고 말할 수 있는 걸로 만족해.',
  'Prof. Song: 환웅, 풍백, 우사, 운사, 나비할망 — the entire pantheon, at peace and in your care. Hanbando has never been safer, or more whole.':
    '송 박사: 환웅, 풍백, 우사, 운사, 나비할망 — 모든 신들이 평화롭게 너의 보살핌 아래에 있어. 한반도는 이보다 더 안전하거나 온전한 적이 없었어.',
  'Prof. Song: Whatever legend they tell about this region a thousand years from now, it starts with you. Thank you, Champion.':
    '송 박사: 천 년 뒤 이 지방에 대해 어떤 전설을 이야기하든, 그건 너로부터 시작될 거야. 고맙다, 챔피언.',

  // ── World map / express bus ──
  'SPACE — 🚌 Express Bus to Kaesong (개성)': 'SPACE — 🚌 개성행 급행 버스',
  '🚌 The northern express coach idles at the stop, engine rumbling.':
    '🚌 북부행 급행 버스가 엔진을 울리며 정류장에 서 있다.',
  'Driver: Non-stop to Kaesong — first of the eight 어사대 provinces, up across the old border. Riding with me?':
    '기사: 개성까지 논스톱 — 옛 국경 너머, 여덟 어사대 지방의 첫 번째지. 같이 갈래?',

  // ── Pine Needle Town ──
  '🏡 Pine Needle Town (솔잎 마을)': '🏡 솔잎 마을',
  'A quiet artisan village famous for ink painting and hanji paper-making.':
    '수묵화와 한지 제작으로 유명한 조용한 장인 마을.',
  'Paper lanterns sway between the houses. The air smells of pine and ink.':
    '집들 사이로 종이 등불이 흔들린다. 공기에서 소나무와 먹 냄새가 난다.',
  'The path north climbs steeply into snow and cloud.': '북쪽 길은 눈과 구름 속으로 가파르게 오른다.',

  // ── 어사대 circuit — Nampo (representative; chief lines reused across cities) ──
  'Nampo (남포) — the great West-Sea barrage holds back the tide beyond the quay, its sluice-gates gleaming with salt.':
    '남포 — 거대한 서해 방조제가 부두 너머의 조수를 막아서고, 수문이 소금으로 반짝인다.',
  '어사대장 Haemin waits by the water, patient as the turning tide.':
    '어사대장 해민이 물가에서, 밀물처럼 인내심 있게 기다린다.',
  'Power without patience drowns itself. Read the tide, and read me. Begin.':
    '인내 없는 힘은 스스로를 익사시킨다. 조수를 읽고, 나를 읽어라. 시작.',
  'You waited for the right wave. Good.': '알맞은 파도를 기다렸구나. 좋다.',
  'Before any exam — the province needs you.': '시험에 앞서 — 이 지방이 널 필요로 한다.',
  'The barrage still groans under that beast. Head to Nampo Beach, surf out past the whirlpools and quell the Gyarados, then return.':
    '방조제가 아직도 그 괴수 아래서 신음한다. 남포 해변으로 가 소용돌이 너머로 파도타기해 갸라도스를 잠재우고 돌아오라.',
  'The Gyarados rears from the swell, sluice-water sheeting off its coils, and fixes its glare on you.':
    '갸라도스가 물결에서 몸을 일으키고, 똬리에서 수문물이 쏟아지며, 네게 시선을 고정한다.',
  '🐎 You received the Nampo 마패!': '🐎 남포 마패를 받았다!',

  // ── Capitol post-game (epilogue) ──
  'In the weeks after Baekdu Peak, the region steadies. Director Suri turns herself in with full documentation; her late repentance is noted in her case.':
    '백두봉 이후 몇 주 동안 지방이 안정된다. 수리 국장은 모든 자료와 함께 자수하고, 뒤늦은 뉘우침이 사건 기록에 남는다.',
  "Professor Song: The Spirit's return stabilized the region. The three old spirits are free. And 나비할망 found her guardian. Remarkable. Both of you.":
    '송 박사: 정령의 귀환이 지방을 안정시켰어. 세 옛 정령은 자유로워졌고. 그리고 나비할망은 자신의 수호자를 찾았지. 놀라워. 너희 둘 다.',
  "A grand stone gate has opened behind the palace. ⛩ Scholars' Road is now open.":
    '궁궐 뒤로 웅장한 돌문이 열렸다. ⛩ 선비의 길이 이제 열렸다.',
  "Here — I had this prepared the moment I heard the news. Champions shouldn't have to walk everywhere.":
    '자 — 소식을 듣자마자 준비해 뒀단다. 챔피언이 어디든 걸어다닐 순 없지.',

  // ══ 어사대 circuit — full city scripts ══
  // Nampo
  'Rampaging Gyarados (난동 갸라도스)': '난동 갸라도스',
  'A great Gyarados has been battering the West-Sea barrage from out on the open water. One more night and the sluice-gates give way, and the tide takes the lower town.':
    '거대한 갸라도스가 먼바다에서 서해 방조제를 들이받고 있어. 하룻밤만 더 지나면 수문이 무너지고, 조수가 아랫마을을 삼킬 거야.',
  'Take the shore path west out to Nampo Beach, then Surf out to it. But mind the water — its 부하 (underlings) stir up whirlpools that wander the whole bay. Weave between them, or be dragged under.':
    '서쪽 해안길을 따라 남포 해변으로 가서 파도타기로 다가가라. 하지만 물을 조심해 — 그 부하들이 만 전체를 떠도는 소용돌이를 일으키니까. 그 사이를 헤쳐 나가지 않으면 끌려 들어갈 거야.',
  'It lunges, jaws wide. No turning back now!': '녀석이 아가리를 벌리고 달려든다. 이제 물러설 수 없다!',
  '어사대장 Haemin: The gates hold, and the town sleeps easy. Word travels fast on the water — they already speak your name.':
    '어사대장 해민: 수문은 버티고, 마을은 편히 잠든다. 물길엔 소문이 빠르지 — 벌써 네 이름을 입에 올리더군.',
  'Now I will see it for myself.': '이제 내가 직접 확인하겠다.',
  'Since you dealt with that Gyarados, the gates run smooth. The whole town owes you a bowl.':
    '네가 그 갸라도스를 처리해 준 뒤로 수문이 매끄럽게 돌아가. 온 마을이 네게 한 그릇 빚졌지.',
  'We rake the flats at low tide. Nampo salt seasons half the northern coast!':
    '썰물 때 갯벌을 긁는단다. 남포 소금이 북부 해안 절반을 간 맞추지!',
  // Wonsan
  '🐎 You received the Wonsan 마패!': '🐎 원산 마패를 받았다!',
  'Hah — eager for a bout? Not yet. Anyone can win one fight. A fighter is forged by fighting through exhaustion.':
    '하 — 한판 붙고 싶은가? 아직이야. 한 번 이기는 건 누구나 해. 투사는 지쳐 쓰러질 때까지 싸우며 단련되는 법.',
  'Best all three, back to back, then come to me. Show me you can keep your feet when your legs are burning!':
    '셋을 연달아 꺾은 뒤 내게 오라. 다리가 타들어가도 버티고 서 있음을 보여라!',
  "You didn't just win — you outlasted. Now let's see if you've anything left for ME. Begin!":
    '넌 그저 이긴 게 아니라 — 끝까지 버텼다. 이제 나를 상대할 힘이 남았는지 보자. 시작!',
  "Best his three disciples and he'll respect you. He respects nothing else.":
    '그의 제자 셋을 꺾으면 널 인정할 거야. 그것 말곤 아무것도 인정하지 않지.',
  'The Songdowon pines have shaded this shore for a thousand years. Sit awhile.':
    '송도원 소나무들이 천 년 동안 이 해안에 그늘을 드리웠지. 잠시 앉았다 가게.',
  'The Pyeongseong checkpoint is just ahead. Have your 마패 ready.': '평성 검문소가 바로 앞이야. 마패를 준비해 두게.',
  "Master Haegang sent you? Then you'll start with me — down here by the pier. Come on!":
    '해강 사부가 보냈다고? 그럼 나부터 시작이다 — 여기 부두에서. 덤벼!',
  'Still on your feet after Baekho? Good. The training ground is MY dojo. Show me your stance!':
    '백호를 이기고도 서 있군? 좋아. 이 훈련장은 내 도장이다. 네 자세를 보여라!',
  // Hamhung
  'Berserk Steelix (폭주 강철톤)': '폭주 강철톤',
  'A Steelix has burrowed up from the ore mine that feeds our furnaces and gone berserk in the tunnels. It thrashes when the miners come near — and if it collapses the main gallery, the whole steelworks goes cold.':
    '용광로에 광석을 대는 광산에서 강철톤이 파고 올라와 갱도에서 폭주하고 있어. 광부가 다가가면 날뛰지 — 주 갱도가 무너지면 제철소 전체가 식어버려.',
  'Take the pit road at the south edge of town down to the mine, and subdue it. No forge runs while it rages. See to it.':
    '마을 남쪽 끝의 갱도길을 따라 광산으로 내려가 제압하라. 녀석이 날뛰는 한 용광로는 돌지 않는다. 처리해라.',
  'Heat and ore-dust roll through the gallery. The Steelix rears from the rock, plates glowing dull red.':
    '열기와 광석 먼지가 갱도를 휘감는다. 강철톤이 바위에서 몸을 일으키고, 비늘이 붉게 달아오른다.',
  'It lunges, shaking the whole tunnel. Hold your ground!': '녀석이 갱도 전체를 뒤흔들며 달려든다. 자리를 지켜라!',
  'You did not flinch from the heat. Good. Neither will I. Begin.': '넌 열기 앞에서 움츠리지 않았다. 좋아. 나도 그럴 것이다. 시작.',
  'The Songchon river has fed this plain for centuries. The steel came later — the water was always here.':
    '성천강이 수백 년 동안 이 평야를 먹여 살렸지. 강철은 나중이야 — 물은 늘 여기 있었어.',
  // Chongjin
  "s edge stands the old Fogbound Manor — abandoned for years. Lately a Gengar has nested inside, and from its windows the fog spills out to lead our night crews off the pier. Two boats are lost.":
    '가장자리엔 오래된 안개저택이 서 있어 — 수년째 버려진 채로. 근래 팬텀 하나가 안에 둥지를 틀고, 그 창문에서 안개가 새어 나와 야간 인부들을 부두 밖으로 홀려내지. 배 두 척을 잃었어.',
  'Take the fog road and go into the manor. End its game. What you cannot see can still be faced... if you keep your nerve. Go.':
    '안개길을 따라 저택으로 들어가라. 그 장난을 끝내라. 보이지 않는 것도 맞설 수 있다... 담대함을 잃지 않는다면. 가라.',
  'The Fog-Wraith Gengar\'s laugh echoes from everywhere at once. Steady yourself!':
    '안개망령 팬텀의 웃음이 사방에서 한꺼번에 울린다. 마음을 다잡아라!',
  'You cleared my harbor of what I could not see. Now show me your steel directly, Champion. Face me — pass my exam, and the 마패 is yours by right.':
    '내가 보지 못한 것을 항구에서 몰아냈군. 이제 네 강함을 직접 보여라, 챔피언. 나와 맞서 — 시험을 통과하면 마패는 정당히 네 것이다.',
  // Sinuiju
  'Ice-Bound Beartic (얼음 툰베어)': '얼음 툰베어',
  'You wish to cross. But no one crosses while the ice is unsafe.': '건너고 싶겠지. 하지만 얼음이 위험한 동안엔 누구도 건너지 못한다.',
  'Below the frozen Amrok lies an ice cave, and in its heart a Beartic has woken. Its roars crack the whole sheet — every hour the split creeps closer to the town side. If it reaches us, the crossing is gone until spring.':
    '얼어붙은 압록강 아래 얼음 동굴이 있고, 그 중심에서 툰베어가 깨어났다. 그 포효가 얼음판 전체를 갈라놓지 — 매시간 균열이 마을 쪽으로 다가온다. 우리에게 닿으면 봄까지 강을 건널 수 없어.',
  '어사대장 Amrok: The ice still splinters from below. Slide your way to the heart of the ice cave, drive the Beartic out, then return to me.':
    '어사대장 압록: 아직도 얼음이 아래에서 쪼개지고 있다. 얼음 동굴 중심까지 미끄러져 나아가 툰베어를 몰아낸 뒤, 내게 돌아오라.',
  'That is the coldest kind of courage. The gate is yours to earn. Begin.':
    '그것이야말로 가장 차가운 용기다. 관문을 얻을 자격이 있다. 시작.',

  // ── 어사대 city + landmark labels ──
  'Nampo (남포)': '남포', 'Wonsan (원산)': '원산', 'Hamhung (함흥)': '함흥',
  'Chongjin (청진)': '청진', 'Sinuiju (신의주)': '신의주', 'Samjiyon (삼지연)': '삼지연',
  '🗼 Nampo Lighthouse (등대)': '🗼 남포 등대', '⚓ Harbour Warehouse (부두)': '⚓ 부두 창고',
  '🗼 Kalma Lighthouse (등대)': '🗼 칼마 등대', '🐟 Wonsan Seafood Market (수산시장)': '🐟 원산 수산시장',
  'Nampo Beach': '남포 해변', 'Kalma Beach': '칼마 해변', 'Fogbound Manor': '안개저택',
  '노스단 산책로 (Nosdan Path)': '노스단 산책로',

  // ── Chongjin NPCs (fog port) ──
  "Fifty years I've sailed off this coast.": '이 해안에서 오십 년을 항해했지.',
  'The sea gives, and the sea takes. Lately... it only takes.': '바다는 주고, 바다는 앗아가지. 요즘은... 앗아가기만 해.',
  'This town gets into your bones, stranger.': '이 마을은 뼛속까지 스며든다네, 나그네.',
  "Two boats lost this month, right at the pier's edge.": '이번 달에 배 두 척을 잃었어, 바로 부두 끝에서.',
  "The Chief says it's no accident. ...After what I've seen, I believe him.":
    '대장님은 사고가 아니라고 해. ...내가 본 걸 생각하면, 그 말이 맞아.',
  'I sound the horn every hour, on the hour.': '매시 정각마다 무적을 울리지.',
  'Some nights... I swear something out in the fog answers back.': '어떤 밤엔... 안개 속에서 뭔가가 대답하는 것 같아.',
  'Everyone says a GHOST lives there! ...I dare you to go in. Heehee!': '다들 거기 유령이 산대! ...들어가 볼 테면 봐. 히히!',
  "Whose cargo? ...Best not to ask that too loudly. Not in Chongjin.": '누구의 화물이냐고? ...그건 너무 크게 묻지 않는 게 좋아. 여기 청진에선.',

  // ── Sinuiju NPCs (frozen border) ──
  'Still... from this overlook I can feel it out there, past the frozen Amrok. A whole continent, waiting to be walked.':
    '그래도... 이 전망대에서 얼어붙은 압록강 너머로 그게 느껴져. 걸어볼 날을 기다리는 대륙 전체가.',
  "Mind the platform, Champion. These rails haven't felt a train in years, but we sweep them every morning all the same.":
    '승강장을 조심해요, 챔피언. 이 철로엔 몇 년째 기차가 안 다녔지만, 그래도 매일 아침 쓸어낸답니다.',
  'Old-timers say when the line to the 미지의 대륙 reopens, the whole plaza will fill with travellers again.':
    '노인들은 미지의 대륙으로 가는 노선이 다시 열리면 광장이 다시 여행자들로 가득 찰 거라고 해.',
  'The far bank is another country. The bridge broke years ago — now only the ice connects us, and only in winter.':
    '건너편 강기슭은 다른 나라야. 다리는 몇 년 전에 끊겼고 — 이제 오직 얼음만이, 그것도 겨울에만 우릴 잇지.',
  'Sable, ermine, jade from across the river — the Trading Post has it all. If you can pay.':
    '검은담비, 흰담비, 강 건너 옥까지 — 교역소엔 다 있어. 값을 치를 수 있다면.',
  'Since you drove that Beartic off, the ice holds firm again. My whole village fishes it once more.':
    '네가 그 툰베어를 몰아낸 뒤로 얼음이 다시 단단해졌어. 우리 마을 전체가 다시 얼음낚시를 한다네.',

  // ── Samjiyon NPCs (highland plateau) ──
  "The larch forests run right up to Baekdu's foot. Good timber — if the blizzards let you fell it.":
    '낙엽송 숲이 백두산 발치까지 이어져. 좋은 목재지 — 눈보라가 베게 놔둔다면.',
  "On clear nights the sky burns green and violet over the three lakes. There's no sight like it in all Hanbando.":
    '맑은 밤이면 세 호수 위로 하늘이 초록과 보라로 타올라. 한반도 어디에도 그런 광경은 없지.',
  "The 노스단 산책로 runs east off the plateau, up to our 아지트. Don't take that path unless you mean to climb.":
    '노스단 산책로는 고원 동쪽으로, 우리 아지트까지 이어져. 오를 각오가 아니면 그 길로 들어서지 마.',

  // ── Gym badge names (Scholars' Road gate + menu badge screen) ──
  'Shadow Court Badge (Capitol)': '섀도우 코트 배지 (수도)',
  'Summit Dojo Badge (Baekdu)': '정상 도장 배지 (백두)',
  'Lantern Stage Badge (Geumgang)': '등불 무대 배지 (금강)',
  'Tidal Arena Badge (Haean)': '조류 경기장 배지 (해안)',
  'Ancient Keeper Badge (Forest)': '고대 수호자 배지 (숲)',
  'Bedrock Badge (Dolmoe)': '암반 배지 (돌뫼)',
  'Frostbell Badge (Seorae)': '서리종 배지 (서래)',
  'Stormwatcher Badge (Sunrise)': '폭풍지기 배지 (일출)',

  // ── Scholars' Road trainers ──
  'Scholar-Trainer Hyeonu': '학자 트레이너 현우',
  'Ace Trainer Dawon': '에이스 트레이너 다원',
  'The road tests the prepared. Recite your answer in battle.': '이 길은 준비된 자를 시험한다. 네 답을 배틀로 읊어라.',
  'Forty years a trainer. The League gate is just over my shoulder — earn your way past me.':
    '트레이너 생활 사십 년. 리그 관문이 바로 내 어깨 너머에 있다 — 날 지나갈 자격을 얻어라.',

  // ══ ENDING — Northern League party → 노스단 alarm → Rangrim shortcut → finale ══
  'The Northern League throws a party in your honour — the whole city out in the streets, cheering the Champion who united north and south.':
    '북방 리그가 너를 기리는 파티를 연다 — 온 도시가 거리로 나와, 남과 북을 하나로 만든 챔피언을 환호한다.',
  "Rival: I never thought anyone would beat Taewang. But it's you — so of course you did.":
    '라이벌: 누가 태왕을 이길 줄은 몰랐어. 근데 너잖아 — 그러니 당연한 거지.',
  "📟 Then, mid-celebration, your Pokédex screams an alarm. Prof. Song's face drains of colour.":
    '📟 그때, 축제 한가운데서 도감이 경보를 울린다. 송 박사의 얼굴이 새하얗게 질린다.',
  "Prof. Song: It's 노스단. They're moving on the Rangrim Mountains — RIGHT NOW — racing to reach 환웅 (Hwanwoong), the Sovereign Who Descended, before anyone can stop them.":
    '송 박사: 노스단이야. 놈들이 지금 — 바로 지금 — 낭림 산맥으로 움직이고 있어. 아무도 막기 전에 강림한 군주 환웅에게 닿으려 하고 있어.',
  "Prof. Song: They've sealed the whole range behind their lines. But there is another way in — the 고대 제단 (Ancient Altar) opens a hidden stair straight to the Sacred Peak.":
    '송 박사: 놈들이 산맥 전체를 봉쇄했어. 하지만 다른 길이 있지 — 고대 제단이 성스러운 봉우리로 곧장 이어지는 숨겨진 계단을 연단다.',
  "Rival: The party can wait. Go — we'll hold things here. Beat them to the top, Champion!":
    '라이벌: 파티는 나중에 해도 돼. 가 — 여긴 우리가 맡을게. 정상까지 놈들보다 먼저 도착해, 챔피언!',
  '🎉 The music fades behind you as you race for the Rangrim Mountains...':
    '🎉 음악이 등 뒤로 멀어지고, 너는 낭림 산맥으로 달려간다...',
  // Altar (shortcut past the blockade)
  '노스단 has sealed every pass up the Rangrim Mountains — but they never knew about this.':
    '노스단이 낭림 산맥의 모든 길목을 봉쇄했다 — 하지만 이곳만은 몰랐다.',
  'You lay your hand on the 고대 제단 (Ancient Altar). The stone hums with divine energy, and it responds to your presence.':
    '고대 제단에 손을 얹는다. 돌이 신성한 기운으로 진동하며, 너의 존재에 응답한다.',
  'The hidden stair opens — a shortcut straight past the blockade to the Sacred Peak, where 환웅 (Hwanwoong) awaits...':
    '숨겨진 계단이 열린다 — 봉쇄를 곧장 지나 성스러운 봉우리로 이어지는 지름길, 그곳엔 환웅이 기다린다...',
  // Finale party + rival one-on-one
  'You beat 노스단 to the summit, defeated Sovereign Clemont, and 환웅 itself descended to your side. The threat is over.':
    '너는 노스단보다 먼저 정상에 올라 군주 클레몽을 물리쳤고, 환웅이 몸소 네 곁으로 강림했다. 위협은 끝났다.',
  "You come home to a hero's welcome — and the party the alarm cut short picks up right where it left off, louder than ever.":
    '영웅의 환대 속에 돌아온다 — 경보로 중단됐던 파티가 그 어느 때보다 뜨겁게 다시 이어진다.',
  'Prof. Song: 노스단 is finished. 환웅, 풍백, 우사, 운사, 나비할망 — the entire pantheon, at peace and in your care.':
    '송 박사: 노스단은 끝났어. 환웅, 풍백, 우사, 운사, 나비할망 — 모든 신들이 평화롭게 너의 보살핌 아래 있어.',
  'Prof. Song: Whatever legend they tell of this region a thousand years from now, it starts with you. Thank you, Champion.':
    '송 박사: 천 년 뒤 이 지방에 대해 어떤 전설을 이야기하든, 그건 너로부터 시작될 거야. 고맙다, 챔피언.',
  '— Later, when the lanterns have burned low, the Rival finds you alone. —':
    '— 이윽고, 등불이 사그라들 무렵, 라이벌이 홀로 있는 너를 찾아온다. —',
  'Rival: ...We really did it. Every gym, both leagues, a whole syndicate, and a god at the end of it.':
    '라이벌: ...우리 정말 해냈어. 모든 체육관, 두 리그, 조직 하나, 그리고 마지막엔 신까지.',
  'Rival: So — what now? Are you going to keep adventuring from here?':
    '라이벌: 그래서 — 이제 어쩔 거야? 앞으로도 모험을 계속할 거야?',
  "(You look out over the sleeping region — north and south, whole at last. Wherever the road goes next... it's yours to walk.)":
    '(잠든 지방을 내려다본다 — 남과 북이 마침내 하나가 되었다. 다음 길이 어디로 향하든... 그건 네가 걸어갈 길이다.)',

  // ── Sacred Peak (climb) ──
  "The Ancient Altar's hidden stair delivers you to a realm above the clouds. Three sealed shrines rise along the ridge to the Sacred Peak, where the oldest myth says the heavens once touched the earth.":
    '고대 제단의 숨겨진 계단이 너를 구름 위의 세계로 데려간다. 능선을 따라 봉인된 세 사당이 성스러운 봉우리로 솟아 있고, 가장 오래된 신화는 이곳에서 하늘이 땅에 닿았다고 전한다.',
  "어사대장 Jinnok: 노스단 is already climbing. Reach the Wind, the Rain and the Clouds before they do. I'll hold the lower wards and heal you as you pass. Go, Champion.":
    '어사대장 진옥: 노스단이 이미 오르고 있어. 놈들보다 먼저 바람, 비, 구름에 다다르라. 아래쪽 결계는 내가 지키고, 지나갈 때 회복시켜 주마. 가라, 챔피언.',
  '🌋 Cheonji — the summit lake': '🌋 천지 — 정상의 호수',

  // ── Northern Reaches (어사대 gauntlet) ──
  'Far enough, southerner. You crossed our woods without a guide — few outsiders manage even that.':
    '거기까지다, 남부인. 안내인도 없이 우리 숲을 건넜군 — 외지인 중 그마저 해내는 자는 드물지.',
  'But the shrines lie beyond me, and I do not move for reputation. Prove your intent — or turn back the way you came.':
    '하지만 사당은 나를 지나야 있고, 나는 명성 따위로 비켜서지 않아. 네 뜻을 증명하라 — 아니면 왔던 길로 돌아가라.',
  "We charted the shrines from the stars already. You're too late — but I'll enjoy slowing you down among the trees.":
    '우린 이미 별자리로 사당의 위치를 파악했어. 넌 너무 늦었지 — 그래도 이 숲에서 널 붙잡아 두는 건 즐겁겠군.',
  'Charming. But the 어사대 do not run on rumor. Show me the trainer beneath the legend.':
    '귀엽군. 하지만 어사대는 소문으로 움직이지 않아. 그 전설 아래의 트레이너를 보여봐.',
  'Iron does not bend for sentiment. Come.': '강철은 감정으로 휘지 않는다. 와라.',

  // ══ Villain arc: Team Suri / 노스단 ══
  // Sudo Lab revelation (Ch.7)
  "...You really are something. Okay. Let's go save a giant moth grandmother.":
    '...너 정말 대단하다. 좋아. 거대 나방 할머니를 구하러 가자.',
  "A sentence I never thought I'd say.": '평생 할 줄 몰랐던 말이네.',
  "노스단 has already moved south, toward the Jeju vents. There's no time to lose.":
    '노스단이 이미 남쪽, 제주 분화구로 이동했어. 지체할 시간이 없어.',
  'Protect 나비할망 — and through her, the whole south. Go. Now.':
    '나비할망을 지켜 — 그리고 그녀를 통해 남부 전체를. 가. 지금.',
  '▶ Chapter 8 — Route 5 & the Ancient Forest — continues your journey south.':
    '▶ 8장 — 5번 도로 & 고목 숲 — 남쪽으로의 여정이 이어진다.',
  "Thank you for coming so fast. I finally understand what we're facing.":
    '이렇게 빨리 와줘서 고마워. 드디어 우리가 뭘 마주하고 있는지 알아냈어.',
  'Team Suri wants to wake the Spirit of Cheonji and control it — to heal the region. Misguided, dangerous.':
    '수리단은 천지의 정령을 깨워 통제하려 해 — 지방을 치유하려고. 그릇되고 위험한 생각이지.',
  "But 노스단 doesn't care about the Spirit. They want to be PRESENT when it wakes —":
    '하지만 노스단은 정령엔 관심 없어. 그들은 정령이 깨어날 때 그 자리에 있으려 해 —',
  '— to harvest the catastrophic awakening energy and weaponize it against the south.':
    '— 그 파국적인 각성 에너지를 수확해 남부를 향한 무기로 삼으려는 거야.',
  // Jeju Vent (나비할망 + Commander Ryeo)
  "Turn back! The Director's orders — no one reaches the summit before our transport secures the moth!":
    '돌아가! 국장님 명령이야 — 우리 수송선이 나방을 확보하기 전엔 누구도 정상에 못 가!',
  'You climb fast for a tourist. It ends here!': '관광객치곤 빨리 오르는군. 여기서 끝이다!',
  '나비할망 folds her glowing, dancheong-patterned wings and settles beside you at last.':
    '나비할망이 단청 무늬로 빛나는 날개를 접고 마침내 네 곁에 내려앉는다.',
  "She's chosen you as her guardian — and the south's. You truly earned her.":
    '그녀가 널 자신의 — 그리고 남부의 수호자로 택했어. 넌 그녀를 얻을 자격이 있었어.',
  'A sound like metal grinding. Commander Ryeo emerges from the shadows of the rig — bloodied, furious, movements sharp with desperation.':
    '금속이 갈리는 듯한 소리. 사령관 려가 굴착 장치의 그림자에서 나타난다 — 피투성이에, 분노에 차, 절박함으로 날카로운 몸짓으로.',
  'That moth was supposed to be OUR key to reshaping this peninsula! And you—':
    '그 나방은 이 반도를 다시 빚을 우리의 열쇠였어! 그런데 네가—',
  "...Then I'll take it from your corpse. One final test. You and me. No team. Just will.":
    '...그럼 네 시체에서 빼앗겠어. 마지막 시험이다. 너와 나. 팀도 없이. 오직 의지로.',
  "...She looks at you like you're not a tool to be used. Like you matter. That's what I never understood about this region. That's what we tried to control.":
    '...그녀는 널 이용할 도구가 아닌 것처럼 봐. 네가 소중한 것처럼. 그게 내가 이 지방에 대해 끝내 이해하지 못한 거야. 그게 우리가 통제하려 했던 거고.',
  // Baekdu Summit (matrix / Director Suri sacrifice)
  "The matrix is almost complete. You're too late to matter!": '매트릭스가 거의 완성됐어. 넌 너무 늦어서 아무 소용 없어!',
  "Commander Ryeo gave the order. The trio's power will wake Hwanwoong — and the south will kneel.":
    '사령관 려가 명령을 내렸어. 세 정령의 힘이 환웅을 깨울 거야 — 그리고 남부는 무릎 꿇겠지.',
  "Keep moving. I'll patch your Pokémon between their patrols. You'll need every one of them at full strength up top.":
    '계속 움직여. 놈들 순찰 사이사이에 네 포켓몬을 회복시켜 줄게. 위에선 전부 최상의 상태여야 할 거야.',
  "I ran the numbers on 노스단's matrix. They didn't. The trio's siphoned energy isn't stabilizing anything — it's CONCENTRATING heat into the magma chamber beneath this peak.":
    '내가 노스단의 매트릭스를 계산해 봤어. 놈들은 안 했지. 세 정령에게서 빨아들인 에너지는 아무것도 안정시키지 못해 — 이 봉우리 아래 마그마 방으로 열을 응집시키고 있어.',
  "If that machine runs to completion, it won't just wake Hwanwoong. It will trigger an eruption that takes the entire northern range with it.":
    '그 기계가 완성되면 환웅만 깨우는 게 아니야. 북방 산맥 전체를 삼키는 분화를 일으킬 거야.',
  "I spent thirty years chasing a way to heal this region. I won't let my work be the thing that ends it. You carry the seventh tablet — and 나비할망. Stop them. Please.":
    '난 삼십 년을 이 지방을 치유할 방법을 좇았어. 내 일이 이 지방을 끝장내는 게 되게 놔둘 순 없어. 넌 일곱 번째 석판과 나비할망을 지녔지. 놈들을 막아줘. 부탁이야.',
  "I've got your team — go!": '네 팀은 내가 맡을게 — 가!',
  'Executive Mubaek: Commander Ryeo retreated. I did not. The matrix completes in minutes, and you will not reach the altar before it does.':
    '간부 무백: 사령관 려는 물러났지만, 나는 아니야. 매트릭스는 몇 분이면 완성돼. 넌 그 전에 제단에 못 닿아.',
  "I didn't take the title of Magistrate just for show. Go! I'll break their line — you fix the sky!":
    '내가 괜히 관찰사 직함을 받은 게 아니야. 가! 놈들 방어선은 내가 뚫을 테니 — 넌 하늘을 되돌려!',
  // Forest City
  'Your Pokédex chirps — Professor Song checking in.': '도감이 삑 울린다 — 송 박사의 연락이다.',
  'The Ancient Keeper Badge is yours — well done. The road climbs north from Forest City, up Route 6 to Dolmoe City. Keep pressing on.':
    '고대 수호자 배지를 얻었구나 — 잘했어. 숲 시티에서 북쪽으로 6번 도로를 따라 돌뫼 시티까지 길이 오른단다. 계속 나아가.',
  'The trees whisper of black-coated strangers heading for the eastern coast.':
    '나무들이 동쪽 해안으로 향하는 검은 코트의 낯선 자들에 대해 속삭여.',
  'Keeper Noksaek guards the Living Temple. Earn his seal, and he may share what the roots remember.':
    '수호자 녹색이 생명 신전을 지키지. 그의 인장을 얻으면, 뿌리가 기억하는 것을 나눠줄지도 몰라.',

  // ── Route trainers (pre-battle taunts) ──
  'Strong, for someone fresh from the capital!': '수도에서 갓 온 사람치곤 강하군!',
  'Fascinating data! Thank you for the sample.': '흥미로운 데이터야! 표본 고마워.',
  'Hold still! ...Actually, my Pokémon are better subjects. And better fighters. Smile!':
    '가만있어! ...아니, 내 포켓몬이 더 나은 피사체지. 그리고 더 잘 싸우고. 웃어!',
  'Ahoy! Salt in my beard, salt in my blood. My sea-Pokémon will wash you right off this cliff!':
    '어이! 수염에도 소금, 피에도 소금. 내 바다 포켓몬이 널 이 절벽에서 씻어내 버릴 거다!',
  'These old trees are crawling with my favourites! Wanna see my best ones? They bite!':
    '이 고목들엔 내가 제일 좋아하는 녀석들이 우글거려! 최고의 녀석들 볼래? 물어!',
  'My birds ride the sea wind off these cliffs. Catch them if you can!':
    '내 새들은 이 절벽의 바닷바람을 타지. 잡을 수 있으면 잡아봐!',
  'The old 용 dragons sleep beneath this coast. My partners carry their blood. Face them!':
    '오래된 용들이 이 해안 아래 잠들어 있어. 내 파트너들은 그 피를 이어받았지. 맞서봐!',
  // Route trainer names
  'Photographer Seulgi': '사진사 슬기',
  'Bug Catcher Beomseok': '벌레잡이 소년 범석',
  'Dragon Tamer Yunho': '드래곤 조련사 윤호',

  // ── Dolmoe City + Gym ──
  'Every dolmen in this valley was raised by hand. My grandfather cut those capstones himself.':
    '이 골짜기의 모든 고인돌은 손으로 세운 거야. 저 덮개돌은 우리 할아버지가 직접 깎으셨지.',
  '옹기 jars breathe, you know. Ferment anything in them and it keeps through the hardest winter.':
    '옹기 항아리는 숨을 쉰단다. 뭐든 그 안에 발효시키면 가장 혹독한 겨울도 버티지.',
  "The Stonemason's Quarry gym lies to the west; the road north climbs into snow toward Seorae. Heal at the Center first if you like.":
    '석공 채석장 체육관은 서쪽에 있고, 북쪽 길은 눈을 헤치며 서래로 오른다. 원한다면 먼저 센터에서 회복해라.',
  '↑ Dolmoe Mine (→ Seorae)': '↑ 돌뫼 광산 (→ 서래)',
  'Mind the rockslides — one wrong push and the quarry pushes back!': '낙석을 조심해 — 잘못 밀면 채석장이 되받아쳐!',
  'Stone and steel, stone and fist. Break one, the next still stands.': '돌과 강철, 돌과 주먹. 하나를 부숴도 다음이 버티고 서 있지.',
  "The road climbs on to Seorae, and the snow. Carry your load steady. Leave through the south door when you're ready.":
    '길은 서래로, 눈 속으로 이어져. 짐을 흔들림 없이 짊어져. 준비되면 남쪽 문으로 나가라.',
  "You descend onto the quarry floor of the Stonemason's Quarry (석공 채석장)!": '석공 채석장 바닥으로 내려선다!',
  'Hewn granite tiers, dolmen slabs, and rock-cut carvings loom overhead.':
    '깎아낸 화강암 층계, 고인돌 판석, 암각 조각이 머리 위로 우뚝 솟아 있다.',
  'Defeat the two Gym Trainers, then face Leader Sandol — The Bedrock.': '두 체육관 트레이너를 물리치고, 암반 관장 산돌과 맞서라.',

  // ── Seorae Town + Gym ──
  'The Skate Link is the fastest way east. Keep your balance when the wind picks up!':
    '스케이트 링크가 동쪽으로 가는 가장 빠른 길이야. 바람이 세지면 균형을 잘 잡아!',
  'Snow remembers every chisel stroke—until the spring asks it to become water again.':
    '눈은 끌질 하나하나를 기억해 — 봄이 다시 물이 되라고 청할 때까지.',
  'The hot spring is open to every traveler. Steam is Seorae’s warmest welcome.':
    '온천은 모든 여행자에게 열려 있어요. 김은 서래의 가장 따뜻한 환영이죠.',
  'These frost-berry skewers stay cold all day. Perfect for a hike!': '이 서리열매 꼬치는 하루 종일 시원해요. 등산에 딱이죠!',
  'The old pine grove shelters more than people realize. Listen closely in the snow.':
    '오래된 소나무 숲은 사람들 생각보다 많은 걸 품고 있어. 눈 속에서 귀 기울여 봐.',
  'What a beautiful resort town! I could stay here all winter.': '정말 아름다운 휴양 도시야! 겨우내 여기 머물 수 있겠어.',
  'The mountain trains champions. Come back strong after your climb.': '산은 챔피언을 단련하지. 등반을 마치고 강해져서 돌아와.',
  'The snow sculptures here are incredible!': '여기 눈 조각들 정말 대단해!',
  'Ring the wrong bell, and the winter answers. Let it answer for you!': '엉뚱한 종을 울리면 겨울이 응답하지. 그 응답을 네가 받아봐!',
  'The frost-bells chose me to slow you. Do not take that lightly.': '서리종이 널 늦추라고 날 골랐어. 가볍게 여기지 마.',
  "Above Seorae the road drops to Sunrise City, and the first light of Hanbando. Leave by the south door when you're ready.":
    '서래 위로 길은 일출 시티, 한반도의 첫 빛으로 내려가. 준비되면 남쪽 문으로 나가.',
  '📟 Your Pokédex buzzes — Professor Song, urgent.': '📟 도감이 울린다 — 송 박사, 긴급.',
  'A sheet of blue ice, frost-bells hung in rows, hot-spring steam curling at the eaves.':
    '푸른 얼음판, 줄지어 걸린 서리종, 처마 끝에 감기는 온천의 김.',

  // ══ Gyms — complete (trainer names, leader intros/wins, descriptions, badges) ══
  // Trainer names
  'Shadow Trainer Miso': '섀도우 트레이너 미소', 'Shadow Trainer Jaemin': '섀도우 트레이너 재민',
  'Shade Trainer Yuna': '섀도우 트레이너 유나',
  'Gym Trainer Taeguk': '체육관 트레이너 태극', 'Gym Trainer Nari': '체육관 트레이너 나리',
  'Gym Trainer Boram': '체육관 트레이너 보람', 'Gym Trainer Junho': '체육관 트레이너 준호',
  'Gym Trainer Haedo': '체육관 트레이너 해도', 'Gym Trainer Byungchan': '체육관 트레이너 병찬',
  'Gym Trainer Chungha': '체육관 트레이너 청하', 'Gym Trainer Minho': '체육관 트레이너 민호',
  'Gym Trainer Bawoo': '체육관 트레이너 바우', 'Gym Trainer Doran': '체육관 트레이너 도란',
  'Gym Trainer Nunsong': '체육관 트레이너 눈송', 'Attendant Baram': '신전 시종 바람',
  'Gym Trainer Seongwoo': '체육관 트레이너 성우', 'Gym Trainer Daehwi': '체육관 트레이너 대휘',
  // Badge names
  'Summit Seal Badge': '정상 봉인 배지', 'Lantern Stage Badge': '등불 무대 배지',
  'Tidekeeper Badge': '조수지기 배지', 'Ancient Keeper Badge': '고대 수호자 배지',
  'Frostbell Badge': '서리종 배지', 'Stormwatcher Badge': '폭풍지기 배지',
  // Capitol — Leader Jin
  'A figure steps out from the shadows...': '그림자에서 한 인물이 걸어 나온다...',
  "I am Jin, Guardian of Capitol City's shadows.": '나는 진, 수도 시티의 그림자를 지키는 자다.',
  'My Corrpanda and I will test your resolve.': '나의 콜판다와 내가 너의 각오를 시험하겠다.',
  'Darkness is not evil — it is the truth behind light.': '어둠은 악이 아니야 — 빛 뒤에 숨은 진실이지.',
  'Come. Show me what you are made of.': '와라. 네가 어떤 자인지 보여봐.',
  // Baekdu — Byeoksan
  '(A broad-shouldered man sits cross-legged on a flat boulder, eyes closed. He rises as you approach.)':
    '(넓은 어깨의 남자가 평평한 바위에 가부좌를 틀고 눈을 감고 있다. 네가 다가가자 일어선다.)',
  'Come. Show me what that potential looks like.': '와라. 그 잠재력이 어떤 것인지 보여봐.',
  'The mountain tested you and you stood.': '산이 널 시험했고 넌 버텼다.',
  'Those black-coated people circling my city — the wild Pokémon near Cheonji Lake have been agitated for weeks.':
    '내 도시 주위를 맴도는 저 검은 코트의 자들 — 천지 호수 근처의 야생 포켓몬들이 몇 주째 동요하고 있어.',
  // Geumgang — Namsun
  'A namsadang performance stage lit by a thousand swaying lanterns.':
    '천 개의 흔들리는 등불로 밝혀진 남사당 공연 무대.',
  'Defeat the two Gym Trainers, then face Leader Namsun, the Eternal Performer.':
    '두 체육관 트레이너를 물리치고, 영원한 광대 관장 남순과 맞서라.',
  'I am Namsun — the Eternal Performer. I have danced this stage forty years.':
    '나는 남순 — 영원한 광대야. 이 무대에서 사십 년을 춤췄지.',
  'Fairy magic is not gentleness. It is the spell that holds a crowd breathless.':
    '페어리의 마법은 상냥함이 아니야. 관중의 숨을 멎게 하는 주문이지.',
  'Let us see if your Pokémon can hold mine. Begin!': '네 포켓몬이 내 것을 감당할 수 있는지 보자. 시작!',
  'A fine performance. The lanterns will remember you.': '멋진 공연이었어. 등불이 널 기억할 거야.',
  'Beautiful. The lanterns have never shone for a finer challenger.': '아름다워. 등불이 이보다 훌륭한 도전자를 위해 빛난 적은 없었어.',
  // Haean — Harang
  'Defeat the two Gym Trainers, then face Leader Harang, the Tidekeeper.':
    '두 체육관 트레이너를 물리치고, 조수지기 관장 하랑과 맞서라.',
  'Cold currents, poison spines — the deep is not kind. Show me you can swim in it.':
    '차가운 해류, 독 가시 — 심해는 자비롭지 않아. 그 속에서 헤엄칠 수 있음을 보여줘.',
  'I am Harang, the Tidekeeper. I read the sea the way you read a face.':
    '나는 하랑, 조수지기야. 나는 네가 얼굴을 읽듯 바다를 읽지.',
  'My Pokémon ride the current and strike when it turns. Can you hold your footing?':
    '내 포켓몬은 해류를 타고 흐름이 바뀔 때 친다. 발을 딛고 버틸 수 있겠어?',
  'High tide rises. Let us begin.': '만조가 차오른다. 시작하자.',
  'The tide turned in your favour. Well earned.': '물결이 네게 유리하게 돌아섰군. 마땅히 얻은 거야.',
  'The tide chose you. Few can say that.': '파도가 널 택했어. 그렇게 말할 수 있는 자는 드물지.',
  // Forest — Noksaek
  'Roots run deeper than you think. Mind your footing.': '뿌리는 네 생각보다 깊어. 발밑을 조심해.',
  'I am Noksaek, Keeper of the Living Temple. I have tended these roots for a hundred years.':
    '나는 녹색, 생명 신전의 수호자야. 백 년 동안 이 뿌리들을 돌봐 왔지.',
  'Grass is not weakness. It is patience that splits stone. Show me yours.':
    '풀은 나약함이 아니야. 돌을 쪼개는 인내지. 네 것을 보여봐.',
  'Let the temple judge you. Begin.': '신전이 널 판단하게 하라. 시작.',
  'The roots accept you. Well fought.': '뿌리가 널 받아들였어. 잘 싸웠다.',
  'The forest has spoken. You are worthy to pass.': '숲이 말했어. 넌 지나갈 자격이 있다.',
  // Dolmoe — Sandol
  "(A broad, quiet man with granite-dust in his hair hefts a chisel-hammer over one shoulder.)":
    '(머리에 화강암 먼지를 뒤집어쓴, 과묵하고 다부진 남자가 정끌망치를 한쪽 어깨에 둘러멘다.)',
  "Sandol: Leader Sandol? Gone up to the 고인돌 유적 — the dolmen ruins west of town. Black-coated diggers were sniffing around the old graves.":
    '채석장 인부: 관장 산돌 말이야? 고인돌 유적으로 올라갔어 — 마을 서쪽의 고인돌 폐허 말이야. 검은 코트의 발굴자들이 옛 무덤 주위를 킁킁대고 있었거든.',
  'Quarry Worker: Leader Sandol? Gone up to the 고인돌 유적 — the dolmen ruins west of town. Black-coated diggers were sniffing around the old graves.':
    '채석장 인부: 관장 산돌 말이야? 고인돌 유적으로 올라갔어 — 마을 서쪽의 고인돌 폐허 말이야. 검은 코트의 발굴자들이 옛 무덤 주위를 킁킁대고 있었거든.',
  'Quarry Worker: No badge today unless you fetch him. Follow the western trail out of the city.':
    '채석장 인부: 그를 데려오지 않으면 오늘 배지는 없어. 도시 서쪽 오솔길을 따라가.',
  "The mountain doesn't rush. Doesn't boast. It just endures, and outlasts everything that tries to break it.":
    '산은 서두르지 않아. 뽐내지도 않지. 그저 견디고, 자신을 부수려는 모든 것보다 오래 버티지.',
  "Let's see if you've got that in you. Or if you crack.": '네게 그런 게 있는지 보자. 아니면 부서지는지.',
  "The mountain remembers those who don't crack. It remembers you now.": '산은 부서지지 않는 자를 기억하지. 이제 널 기억한다.',
  "...Didn't crack. Good. The mountain respects that. Carry it steady.": '...부서지지 않았군. 좋아. 산은 그런 걸 존중해. 흔들림 없이 짊어져.',
  // Seorae — Yeona
  'Defeat the two Gym Trainers, then face Leader Yeona — The Winter Bell.':
    '두 체육관 트레이너를 물리치고, 겨울종 관장 연아와 맞서라.',
  "You've climbed a long way in the cold to reach me. Most turn back at the treeline.":
    '나에게 오려고 추위 속을 멀리도 올라왔군. 대부분은 수목한계선에서 돌아서지.',
  "Winter doesn't ask if you're ready. It simply arrives. So — let it arrive.":
    '겨울은 네가 준비됐는지 묻지 않아. 그냥 찾아오지. 그러니 — 오게 두렴.',
  'Yeona: ...The thaw comes even to the deepest winter. You are that thaw. Go warmly.':
    '연아: ...가장 깊은 겨울에도 해빙은 찾아와. 네가 그 해빙이야. 따뜻하게 가렴.',
  // Sunrise — Beonge
  'The panels only turn for the quick. Keep up!': '패널은 빠른 자에게만 돌아가지. 따라와!',
  'I am Beonge, the Stormwatcher. I have read these skies my whole life.':
    '나는 번개, 폭풍지기야. 평생 이 하늘을 읽어 왔지.',
  'Electricity is not power. It is TIMING — the instant the sky decides to strike.':
    '전기는 힘이 아니야. 타이밍이지 — 하늘이 내리치기로 정하는 그 찰나.',
  'Five partners ride my current. Show me your timing. Begin!':
    '다섯 파트너가 내 전류를 타지. 네 타이밍을 보여봐. 시작!',
  'The storm answered to you. Take the Stormwatcher Badge.': '폭풍이 네게 응답했어. 폭풍지기 배지를 받아.',

  // ── Capitol Tower / Palace NPCs ──
  'WASD/Arrows  |  SPACE: enter  |  SHIFT: run  |  M: menu': 'WASD/방향키  |  SPACE: 입장  |  SHIFT: 달리기  |  M: 메뉴',
  'Welcome to the top of Capitol Tower!': '수도 타워 꼭대기에 오신 걸 환영합니다!',
  'From here you can see the entire city... look at all those lights.': '여기서는 도시 전체가 보여요... 저 불빛들 좀 봐요.',
  "See that green patch to the north? That's the palace grounds.": '북쪽에 저 초록빛 구역 보여요? 저게 궁궐 부지예요.',
  'And to the south — Route 1 cutting through the mountains.': '그리고 남쪽으로는 — 산을 가로지르는 1번 도로가 있죠.',
  'Somewhere out there, the next great trainer is on their journey.': '저 어딘가에서, 다음 위대한 트레이너가 여정을 걷고 있어요.',
  "Maybe that's you! 🌟": '어쩌면 그게 당신일지도! 🌟',
  'This is the Ancient Palace, 600 years of history.': '이곳은 고궁, 육백 년의 역사죠.',
  'The original rulers once walked these halls.': '옛 통치자들이 한때 이 회랑을 거닐었습니다.',
  'They say their spirits still watch over the city.': '그들의 혼이 여전히 도시를 지켜본다고들 하죠.',
  'Welcome to the Capitol Palace Museum!': '수도 궁궐 박물관에 오신 걸 환영합니다!',
  'That artifact was used by the first city founder.': '저 유물은 도시의 첫 창건자가 사용했습니다.',
  'And that sword? It slayed a shadow beast long ago...': '그리고 저 검이요? 아주 오래전 그림자 짐승을 베었죠...',

  // ── Rangrim Mountains / Nosdan Hideout / Cheonji ──
  '⛰ 낭림산 기슭 (Rangrim Foothills)': '⛰ 낭림산 기슭',
  '↑ 하부 동굴 (Lower Cavern)': '↑ 하부 동굴',
  '⛰ 낭림 하부 동굴 (Lower Cavern)': '⛰ 낭림 하부 동굴',
  'Far as you climb, runt. 노스단 owns this tower now — and soon all of Samjiyon!':
    '올라올 테면 올라와, 애송이. 노스단이 이제 이 탑을 차지했어 — 곧 삼지연 전체도!',
  'The 노스단 flag is torn down. Their grip on Samjiyon is broken, and the grunts flee down the mountain road.':
    '노스단 깃발이 찢겨 내려온다. 삼지연에 대한 그들의 지배가 무너지고, 조무래기들은 산길 아래로 달아난다.',
  'A profound peace settles over you as you gaze across the ancient waters. This is a place of deep contemplation, where the sacred waters gather in eternal stillness.':
    '태고의 물결을 바라보노라니 깊은 평화가 내려앉는다. 이곳은 깊은 사색의 장소, 성스러운 물이 영원한 고요 속에 모이는 곳이다.',

  // ── Northern League (coliseum, cont.) ──
  "(The hall's healing machine restores your team to full health.)": '(홀의 회복 장치가 네 팀을 완전히 회복시킨다.)',
  'Taewang rises from his throne for the first time — slowly, deliberately.': '태왕이 처음으로 옥좌에서 일어선다 — 천천히, 신중하게.',
  'Taewang: ...In thirty years on this throne, I have beaten every Hanbando Champion sent to me. Every one.':
    '태왕: ...이 옥좌에 앉은 삼십 년간, 내게 보내진 모든 한반도 챔피언을 이겼다. 하나도 빠짐없이.',
  "Taewang (inclining his head — a king's respect): The peninsula bred a real trainer at last. Your team is enshrined in the Northern Hall of Fame, beside the north's own legends.":
    '태왕 (고개를 숙이며 — 왕의 예우): 반도가 마침내 진짜 트레이너를 길러냈군. 너의 팀은 북방 명예의 전당에, 북부 자신의 전설들 곁에 봉안된다.',

  // ── Pyeongseong Checkpoint ──
  '🛡 평성 관문 (Pyeongseong Checkpoint)': '🛡 평성 관문',
  'Royal Warden: The gate to Pyeongseong is open to you. Seek Supreme Gwang in the capital — he holds the final test.':
    '왕실 관리인: 평성으로 가는 문이 네게 열렸다. 수도에서 최고위 광을 찾아라 — 그가 마지막 시험을 쥐고 있다.',

  // ══ Hanbando League (Elite Four + Champion Hwangeum) ══
  '🏛 Hanbando Pokémon League': '🏛 한반도 포켓몬 리그',
  'The League is a single trial — best all four masters again, in one unbroken run, to reach the Champion.':
    '리그는 하나의 시련 — 네 명의 명인을 한 번에, 끊김 없이 다시 꺾어야 챔피언에 이른다.',
  'Defeat one to unseal the way to the next. Each hall has a healing machine, so your team is restored to full before every match.':
    '하나를 물리치면 다음으로 가는 길이 열린다. 각 홀엔 회복 장치가 있어, 매 대결 전에 팀이 완전히 회복된다.',
  'The cold does not rush. Neither will I. Begin.': '추위는 서두르지 않아. 나도 그렇지. 시작.',
  'Let us see what your edge is made of.': '네 칼날이 무엇으로 벼려졌는지 보자.',
  'Rise to meet me — or be swept aside.': '일어서서 나와 맞서 — 아니면 휩쓸려 나가.',
  'Whether the vision holds is up to you. Come.': '환영이 버티는지는 네게 달렸어. 와라.',
  "Eight gyms, one legendary moth, and you still climbed back up here. I became Champion three years ago and called it a fluke for a year. I don't take many battles seriously anymore.":
    '체육관 여덟 개, 전설의 나방 하나, 그런데도 넌 여기까지 다시 올라왔군. 나는 삼 년 전 챔피언이 됐고, 일 년은 그걸 요행이라 여겼지. 이젠 어지간한 배틀은 진지하게 임하지 않아.',
  "This one — I will. Show me everything you've become.": '이번만은 — 진지하게 임하겠다. 네가 되어온 모든 것을 보여봐.',
  "...Good. Three years I've wondered when someone would come who could do this. I think I've been waiting for you specifically.":
    '...훌륭해. 삼 년간 이걸 해낼 수 있는 자가 언제 올까 궁금했지. 아무래도 난 바로 널 기다려 왔던 것 같아.',
  'Hwangeum (extending his hand): Welcome to the Hall of Fame. You earned every step of it.':
    '황금 (손을 내밀며): 명예의 전당에 온 걸 환영해. 그 한 걸음 한 걸음을 네가 이뤄냈어.',
  '🏆 Your team is recorded in the Hall of Fame!': '🏆 너의 팀이 명예의 전당에 기록되었다!',
  '— The credits roll over a montage of the Hanbando League arc — Capitol City, the Diamond Gorge, the tidal coasts, the ancient forest, the Jeju vents, the Jeju Summit —':
    '— 한반도 리그 여정의 몽타주 위로 크레딧이 흐른다 — 수도 시티, 다이아몬드 협곡, 조수의 해안, 고목 숲, 제주 분화구, 제주 정상 —',
  'At the bottom of the League steps, your Rival is waiting — because of course they are.':
    '리그 계단 아래, 라이벌이 기다리고 있다 — 당연하게도.',
  'Rival: I found something while you were climbing the league. In the far north, beyond Baekdu Peak — old texts, older than the gym records. References to another spirit. One that predates the Dancheong calendar.':
    '라이벌: 네가 리그를 오르는 동안 뭔가를 찾았어. 저 먼 북쪽, 백두봉 너머 — 체육관 기록보다 오래된 옛 문헌들. 또 다른 정령에 대한 언급. 단청 달력보다도 앞선 존재에 대한 거야.',
  "Prof. Song (comms): That's... troubling. The north has always been volatile. If something wakes there before we understand it, the whole peninsula could—":
    '송 박사 (통신): 그건... 심상치 않은데. 북쪽은 늘 불안정했어. 우리가 이해하기도 전에 거기서 뭔가 깨어난다면, 반도 전체가—',
  "Rival: Easy, Professor. We're barely sitting down. But when you're ready, Champion — the Taebaek range has some climbing left to do.":
    '라이벌: 진정해요, 박사님. 이제 겨우 한숨 돌리는 중이잖아요. 하지만 준비되면, 챔피언 — 태백 산맥엔 아직 오를 곳이 남아 있어.',
  'Phase 1: Hanbando League — COMPLETE ✓': '1막: 한반도 리그 — 완료 ✓',
  'Phase 2: Northern League — UNLOCKED': '2막: 북방 리그 — 해금',
  'Post-game unlocked: rechallenge the Rival in the Shadow Court, rematch Champion Hwangeum, explore the postgame world, and track the freed trio — 풍백, 우사, 운사 — at their mountain shrines.':
    '포스트게임 해금: 섀도우 코트에서 라이벌 재도전, 챔피언 황금 재대결, 포스트게임 세계 탐험, 그리고 풀려난 세 정령 — 풍백, 우사, 운사 — 을 산속 사당에서 추적하기.',

  // ══ Trainer battle: flow + defeat lines ══
  'Loading…': '불러오는 중…',
  'Choose an item!': '아이템을 선택해!',
  "Can't run from a trainer!": '트레이너에게서는 도망칠 수 없어!',
  // Defeat lines (spoken text; speaker auto-translated)
  'Whoa! Your Pokémon is so strong!': '우와! 네 포켓몬 진짜 세다!',
  "You've got real mountain spirit, kid.": '너 진짜 산사나이 기질이 있구나, 꼬마.',
  'No way! I just polished my sneakers…': '말도 안 돼! 방금 운동화도 닦았는데…',
  "...You're stronger than the locals. The Director will hear of this.": '...현지인들보다 세군. 국장님께 보고하겠어.',
  "...The Spirit of Cheonji will be awakened. The only question is who controls what happens next — and it will NOT be Team Suri.":
    '...천지의 정령은 깨어날 거야. 문제는 그다음을 누가 통제하느냐지 — 그건 수리단이 아니야.',
  "...This changes nothing. The array will be ready when the Spirit wakes. (She withdraws south.)":
    '...이걸로 달라지는 건 없어. 정령이 깨어날 때 장치는 준비돼 있을 거야. (그녀는 남쪽으로 물러난다.)',
  "...Okay. Not luck. You're the real thing. My starter's almost ready for its final form. Next time, you won't recognize it.":
    '...좋아. 운이 아니었어. 넌 진짜야. 내 스타터도 최종 진화가 거의 준비됐어. 다음엔 못 알아볼걸.',
  "Final form and all — and you STILL beat me. You're the real deal. Let's go save that moth grandmother.":
    '최종 진화까지 했는데도 — 넌 날 이겼어. 넌 진짜배기야. 그 나방 할머니를 구하러 가자.',
  "Team Suri isn't the only organization moving through this region anymore. And the other one — they're not here for research.":
    '이 지방을 움직이는 조직은 이제 수리단만이 아니야. 그리고 다른 하나는 — 연구하러 온 게 아니야.',
  "...You've beaten me on the cliff. But the array is the real threat — and it is not yet finished.":
    '...절벽에서 날 이겼군. 하지만 진짜 위협은 장치야 — 아직 완성되지 않았지.',
  "...Enough. You and your friend fight like the region itself is at your back. Perhaps it is.":
    '...그만하면 됐어. 너와 네 친구는 마치 이 지방 전체를 등에 업은 듯 싸우는군. 어쩌면 정말 그런지도.',
  "The perimeter's yours. It won't matter — the towers will hold.": '경계선은 네 거다. 소용없어 — 탑들이 버틸 테니.',
  'Fall back! Fall back to the courtyard!': '후퇴! 안뜰로 후퇴하라!',
  "The west light's dead... the courtyard's exposed!": '서쪽 조명이 꺼졌다... 안뜰이 노출됐어!',
  "Searchlight down! The captain's on her own now.": '탐조등이 나갔다! 이제 대장은 홀로다.',
  "...The Commander said you might reach this far. I didn't believe her. The gate is yours — but the mountain will not forgive you the way I have.":
    '...사령관이 네가 여기까지 올지도 모른다고 했지. 난 안 믿었어. 관문은 네 거다 — 하지만 산은 나처럼 널 용서하지 않을 거야.',
  "You don't understand — the machine doesn't care who wins down here!": '넌 몰라 — 저 기계는 여기서 누가 이기든 상관 안 해!',
  'Climb all you like. The matrix completes with or without us.': '얼마든지 올라가 봐. 매트릭스는 우리가 있든 없든 완성돼.',
  "...Six partners, and still you broke through. Go, then. The Spirit will not be so easily reasoned with.":
    '...여섯 파트너를 두고도 넌 뚫고 왔군. 그럼 가라. 정령은 그리 쉽게 설득되지 않을 거다.',
  'A clean answer. The road has measured you well.': '깔끔한 답이군. 이 길이 널 제대로 가늠했어.',
  "My dragons bow to yours. Go — the gate's just above.": '내 드래곤들이 네 것에 고개를 숙인다. 가 — 관문은 바로 위야.',
  "Forty years, and you've still got something to teach me. Hah! Go on up.": '사십 년인데도 넌 아직 내게 가르칠 게 있군. 하! 올라가라.',
  "...Yeah. Yeah, that's the trainer I've been chasing this whole time. Go on — the Four are waiting, and so is HE.":
    '...그래. 그래, 저게 내가 내내 쫓아온 트레이너야. 가 — 사천왕이 기다리고, 그분도 기다려.',
  "The thaw comes for us all. You've earned the next hall.": '해빙은 우리 모두에게 찾아와. 다음 홀을 얻을 자격이 있어.',
  'My steel held nothing back, and you broke through it. Impressive.': '내 강철은 아무것도 아끼지 않았는데, 넌 그걸 뚫었어. 인상적이야.',
  "Like the wind itself — I couldn't pin you down. Go higher.": '바람 그 자체처럼 — 널 붙잡을 수 없었어. 더 높이 올라가.',
  'The vision held after all. The throne is yours to challenge.': '결국 환영이 버텼군. 옥좌에 도전할 자격은 네 거야.',
  'Yeah. YEAH. Go show these northerners what a Hanbando trainer looks like. I\'ll be in the stands, losing my voice for you.':
    '그래. 그렇지! 가서 저 북부인들에게 한반도 트레이너가 어떤지 보여줘. 난 관중석에서 널 위해 목이 터져라 응원할게.',
  '...You moved the stone. The next hall is yours to enter, southerner.': '...돌을 움직였군. 다음 홀에 들어갈 자격이 있다, 남부인.',
  "The cold couldn't hold you. Go on — climb higher.": '추위도 널 붙잡지 못했군. 가 — 더 높이 올라가.',
  'My steel broke before you did. That has not happened in years. Pass.': '내 강철이 너보다 먼저 부서졌다. 몇 년 만의 일이지. 지나가라.',
  'The white tiger yields. Only the Great King remains above you now.': '백호가 물러선다. 이제 네 위엔 대왕만이 남았다.',
  '...Thirty years, and the first to take my throne is a southerner. The north acknowledges Hanbando.':
    '...삼십 년 만에, 내 옥좌를 빼앗은 첫 번째가 남부인이라니. 북부가 한반도를 인정한다.',
  "...Strong, and you fight clean — no tricks, no cruelty. That tells me more than words. Travel our cities. Show me WHY you're here.":
    '...강하고, 깨끗하게 싸우는군 — 속임수도, 잔인함도 없이. 그게 말보다 많은 걸 말해줘. 우리 도시들을 여행해라. 네가 왜 여기 왔는지 보여봐.',
  "...The stars already gave us the shrines. Beating me changes nothing — the Sovereign will descend for US.":
    '...별들이 이미 우리에게 사당을 알려줬어. 날 이겨도 달라지는 건 없어 — 군주는 우리를 위해 강림한다.',
  'The trainer beneath the legend is real after all. The order takes note.': '전설 아래의 트레이너는 결국 진짜였군. 우리 어사대가 주목하겠다.',
  "Iron tested, iron held. You have the 어사대's respect — and mine.": '강철을 시험했고, 강철은 버텼다. 넌 어사대의 존중을 얻었어 — 그리고 나의 존중도.',
  'The head of the order is satisfied. The wards will open. We climb together, Champion.':
    '어사대의 수장이 만족했다. 결계가 열릴 거야. 함께 오르자, 챔피언.',
  '...Impossible. The throne was ours to take — the pantheon, the peninsula, all of it... (The 어사대 close in around the fallen claimant.)':
    '...말도 안 돼. 옥좌는 우리 것이었어 — 신들도, 반도도, 전부 다... (어사대가 쓰러진 참칭자를 에워싼다.)',

  // ── Forest Shrine (lullaby quest, cont.) ──
  'Heart first, then Dusk, then Dawn. Let the old lullaby lead you.': '먼저 중심, 그다음 황혼, 그다음 새벽. 오래된 자장가가 널 이끌게 하렴.',
  'The vines guarding the inner altar loosen and draw back.': '안쪽 제단을 지키던 덩굴이 느슨해지며 물러난다.',
  'Beyond them, something small and sorrowful drifts in the candlelight... still keeping the rhythm.':
    '그 너머, 작고 슬픈 무언가가 촛불 속을 떠돈다... 여전히 박자를 지키면서.',
  "Traveler — you carry the Keeper's seal. Then perhaps the forest sent you.":
    '나그네여 — 그대는 수호자의 인장을 지녔군. 그렇다면 어쩌면 숲이 그대를 보낸 것이겠지.',
  'Our 목탁 is gone. For a hundred years its beat sang the tree-spirits to sleep.':
    '우리의 목탁이 사라졌소. 백 년 동안 그 소리가 나무 정령들을 잠재웠는데.',
  'Without it the Ancient Forest wakes in grief. The spirits you see are not cruel — only frightened.':
    '그것 없이는 고목 숲이 슬픔 속에 깨어나오. 그대가 보는 정령들은 잔인한 게 아니라 — 그저 겁에 질린 것이오.',
  'The thief fled to the inner altar, but the roused guardians bar the aisle, and the prayer-gate is sealed.':
    '도둑은 안쪽 제단으로 달아났지만, 깨어난 수호령들이 통로를 막고, 기도의 문이 봉인되었소.',

  // ── Jeju Vents (ascent, cont.) ──
  '🌋 Jeju Vents — The Ascent (제주 분화구)': '🌋 제주 분화구 — 등정',
  'The vent trail rises sharply from the port — a long, switchbacked climb through lava and ash.':
    '분화구 길이 항구에서 가파르게 솟는다 — 용암과 재를 지나는 길고 구불구불한 오르막.',
  'For the Director!': '국장님을 위하여!',
  'The vent summit is quiet — only wind, steam and black rock. Nothing stirs here yet.':
    '분화구 정상은 고요하다 — 오직 바람, 김, 검은 바위뿐. 아직 아무것도 움직이지 않는다.',
  'Commander Ryeo: Tighten the restraint field! Her wings can neutralize the Cheonji energy — secure her and the weapon completes itself even without the lake!':
    '사령관 려: 억제장을 조여! 저 나방의 날개는 천지 에너지를 중화할 수 있어 — 저것을 확보하면 호수 없이도 무기가 완성된다!',
  '노스단 Operative: Commander, her output is climbing—': '노스단 대원: 사령관님, 저것의 출력이 치솟고 있습니다—',
  'Commander Ryeo staggers backward, her Pokémon recalled. She looks at the towering moth beside you — at the glow of her wings — and something breaks in her expression.':
    '사령관 려가 비틀거리며 물러서고, 포켓몬을 회수한다. 네 곁에 우뚝 선 나방을 바라본다 — 그 날개의 빛을 — 그러자 그녀의 표정에서 무언가가 무너진다.',
  'Prof. Song: Reach the Hanbando League, prove yourself champion. Then the world opens up. The north has lessons too.':
    '송 박사: 한반도 리그에 도달해, 챔피언임을 증명해. 그러면 세계가 열릴 거야. 북쪽에도 배울 것들이 있단다.',

  // ── Baekdu Checkpoint (노스단 garrison) ──
  'The plane sets down on a wind-scoured snowfield at the foot of Baekdu. The highland pass ahead has been sealed — a fortified 노스단 checkpoint blocks the trail, with an iron gate, watchtowers, and searchlights sweeping the snow.':
    '비행기가 백두산 발치의 바람에 깎인 설원에 내려앉는다. 앞쪽 고원 고갯길은 봉쇄되었다 — 요새화된 노스단 검문소가 철문, 망루, 눈밭을 훑는 탐조등과 함께 길을 막고 있다.',
  'The southern road ends at this gate. You should have turned back.': '남쪽 길은 이 문에서 끝난다. 돌아섰어야 했어.',
  'Hold the line! Nothing reaches the towers!': '전선을 사수하라! 아무것도 탑에 닿지 못하게!',
  'The east light stays lit. Come and put it out.': '동쪽 조명은 켜져 있다. 와서 꺼봐.',
  '노스단 Garrison Officer: This pass is closed by order of the Commander. The southern road ends here. There is nothing past this gate but the future of the north.':
    '노스단 수비대 장교: 이 고갯길은 사령관의 명으로 폐쇄됐다. 남쪽 길은 여기서 끝이야. 이 문 너머엔 오직 북방의 미래뿐이다.',
  "Chaeyeon: This is a full garrison — they've dug in. We push through one position at a time, take the watchtowers, and force the gate. Stay close. I'll keep your team standing.":
    '채연: 완전한 수비대야 — 진지를 구축했어. 한 거점씩 밀고 나가, 망루를 점령하고, 문을 강행 돌파하자. 바짝 붙어. 네 팀은 내가 계속 세워둘게.',
  'Gate Captain Seollan: My searchlights still sweep this courtyard. Cut them both before you dare approach my gate.':
    '문지기 대장 설란: 내 탐조등이 아직 이 안뜰을 훑고 있다. 감히 내 문에 다가오기 전에 둘 다 꺼라.',

  // ── Dolmoe Ruins (대장승 Daejangseung) ──
  'The great sealed capstone splits with a groan like the mountain waking...': '거대한 봉인된 덮개돌이 산이 깨어나는 듯한 신음과 함께 갈라진다...',
  'From the broken dolmen rises 대장승 Daejangseung — a towering guardian-totem of the ancestors, eyes blazing, furious at the desecration.':
    '부서진 고인돌에서 대장승이 일어선다 — 조상들의 우뚝 솟은 수호 토템, 눈을 이글거리며, 신성모독에 분노한다.',
  '대장승 Daejangseung looms over the shattered dolmen, radiating ancient wrath.': '대장승이 부서진 고인돌 위로 우뚝 솟아, 태고의 분노를 내뿜는다.',
  'Daejangseung: (It fixes its blazing gaze on you — soothe it in battle, or catch it with a Poké Ball!)':
    '대장승: (이글거리는 시선을 네게 고정한다 — 배틀로 달래거나, 몬스터볼로 잡아라!)',
  'Spent and settled, 대장승 Daejangseung sinks back into the mended dolmen, its wrath eased. The ruins fall quiet.':
    '기운을 다하고 가라앉은 대장승이 아문 고인돌 속으로 도로 잠긴다, 분노가 누그러진 채. 폐허가 고요해진다.',
  'Sandol: The 노스단 will answer for this another day. The ancestors rest — thanks to you.':
    '산돌: 노스단은 언젠가 이 일에 대가를 치를 거야. 조상들은 안식한다 — 네 덕분에.',
  "Sandol: Come to the Quarry when you're ready. A challenger who guards the old stones has earned my full attention.":
    '산돌: 준비되면 채석장으로 와. 옛 돌을 지킨 도전자는 내 온전한 관심을 얻을 자격이 있지.',

  // ══ Capitol hub: champion return → Fly → northern invite → reunion → Part II ══
  'The cause was just. The method was wrong. I know the difference now.': '대의는 옳았어. 방법이 틀렸지. 이제 그 차이를 알아.',
  'Freed from the matrix, 풍백, 우사, and 운사 return to roaming the wild peaks — Wind on the high ridges, Rain in the storm valleys, Clouds at the cloud-wreathed summits.':
    '매트릭스에서 풀려난 풍백, 우사, 운사가 야생의 봉우리로 돌아가 떠돈다 — 바람은 높은 능선에, 비는 폭풍의 골짜기에, 구름은 구름에 감긴 정상에.',
  "Professor Song: There's one road left to walk. The Hanbando Pokémon League sits beyond the mountains — and Scholars' Road begins right here, behind the palace where your journey started.":
    '송 박사: 이제 걸어야 할 길이 하나 남았어. 한반도 포켓몬 리그가 산 너머에 있고 — 선비의 길이 바로 여기, 네 여정이 시작된 궁궐 뒤에서 시작돼.',
  "Professor Song: The HM stays in your Bag — teach Fly to any Flying-type. Then open the Town Map, pick a city you've visited, and Fly straight there.":
    '송 박사: 비전머신은 가방에 남아 있어 — 비행 타입 아무에게나 하늘을날기를 가르쳐. 그런 다음 마을 지도를 열어, 가본 도시를 골라 곧장 날아가.',
  "Professor Song: And there's something else. Word from beyond the northern border — the Northern League, and the eight 어사대 provinces that guard the road to it. They've heard of you.":
    '송 박사: 그리고 한 가지 더. 북쪽 국경 너머에서 소식이 왔어 — 북방 리그, 그리고 그곳으로 가는 길을 지키는 여덟 어사대 지방. 그들이 네 소문을 들었대.',
  "Professor Song: They say a coach runs from Waterfall City now, all the way up to Kaesong — first of the eight. If you mean to go north, that bus is how you'll get there. Go — see the region you saved, and the one beyond it.":
    '송 박사: 폭포 시티에서 개성까지 — 여덟 곳 중 첫 번째까지 버스가 다닌다더군. 북쪽으로 갈 생각이면 그 버스로 가면 돼. 가 — 네가 구한 지방을, 그리고 그 너머의 지방을 보렴.',
  'Champion Hwangeum: ...You actually did it. You beat Taewang. Three years I carried that loss — you lifted it clean off me. Thank you.':
    '챔피언 황금: ...정말 해냈군. 태왕을 이기다니. 삼 년간 그 패배를 짊어졌는데 — 네가 깨끗이 걷어내 줬어. 고마워.',
  "Professor Song: Two leagues, north and south. There has never been a trainer like you in all of Hanbando's history.":
    '송 박사: 리그 둘, 남과 북. 한반도 역사를 통틀어 너 같은 트레이너는 없었어.',
  "Rival: I always said I'd catch up to you someday. ...Yeah, I'm nowhere close. And honestly? I have never been prouder to lose.":
    '라이벌: 언젠가 널 따라잡겠다고 늘 말했지. ...그래, 근처도 못 갔어. 그리고 솔직히? 이렇게 자랑스럽게 진 적은 없어.',
  'Admin Chaeyeon: Even the people you once fought stood in this crowd tonight. The region you healed came out for you.':
    '간부 채연: 네가 한때 맞서 싸운 사람들조차 오늘 밤 이 인파 속에 서 있었어. 네가 치유한 지방이 널 위해 나온 거야.',
  'Leader Byeoksan: Every Gym in Hanbando shut its doors today. Tonight — we drink to the Champion of Champions!':
    '관장 벽산: 오늘 한반도의 모든 체육관이 문을 닫았어. 오늘 밤 — 챔피언 중의 챔피언을 위해 건배하자!',
  'The plaza erupts. Lanterns go up over the Han River, the markets roll out food, and music starts.':
    '광장이 터져 나온다. 한강 위로 등불이 오르고, 시장은 음식을 내오고, 음악이 시작된다.',
  '🎉  The Capitol throws a party in your honour!': '🎉  수도가 너를 기리는 파티를 연다!',
  'Hwangeum: For one night — no titles, no battles. Just us and the region we love. Eat. Dance. You earned this.':
    '황금: 하룻밤만은 — 직함도, 배틀도 없이. 그저 우리와 우리가 사랑하는 지방뿐. 먹고. 춤춰. 넌 이걸 누릴 자격이 있어.',
  "Rival: Come on, Champion — one last race. First to the fountain! ...For old times' sake.":
    '라이벌: 자, 챔피언 — 마지막으로 한 판 달리기. 분수까지 먼저! ...옛정을 봐서.',
  'The night blurs into music and light. For the first time since your journey began, there is nothing left to fight for. Only this.':
    '밤이 음악과 빛 속으로 흐려진다. 여정을 시작한 이래 처음으로, 싸워야 할 것이 아무것도 없다. 오직 이것뿐.',
  "📟 Your Pokédex buzzes before you're even fully awake — an incoming call from Professor Song.":
    '📟 채 잠에서 깨기도 전에 도감이 울린다 — 송 박사의 전화다.',
  'Prof. Song (over the Pokédex, quietly): Champion. I let you have your night — you deserved a hundred of them. But those reports I mentioned...':
    '송 박사 (도감 너머로, 조용히): 챔피언. 너에게 그 밤을 누리게 했어 — 백 번은 누릴 자격이 있었으니까. 하지만 내가 말했던 그 보고들 말이야...',
  'Prof. Song: Something is stirring in the sealed northern reaches. 노스단 is moving again — and this time they reach for something far older than the Spirit of Cheonji.':
    '송 박사: 봉인된 북방 관문에서 무언가 꿈틀대고 있어. 노스단이 다시 움직이고 있어 — 이번엔 천지의 정령보다 훨씬 오래된 무언가를 노리고 있어.',
  "Prof. Song: Rest today. Tomorrow, the last road begins. I'll call again when it's time.  (To be continued…)":
    '송 박사: 오늘은 쉬어. 내일, 마지막 길이 시작돼. 때가 되면 다시 연락할게.  (다음에 계속…)',
  "Prof. Song (over the Pokédex, grim): 노스단. Again — but bigger. With Commander Ryeo imprisoned, someone new has taken the banner, and they've abandoned the old plan entirely.":
    '송 박사 (도감 너머로, 심각하게): 노스단이야. 또 — 하지만 더 커졌어. 사령관 려가 투옥되자, 누군가 새로 깃발을 잡았고, 옛 계획을 완전히 버렸어.',
  "Prof. Song: I'm sending an image to your Pokédex now — an old scroll. A radiant figure descending, three spirits at its side. They reach for the one power above all others. 환웅 — Hwanung, the Sovereign Who Descended.":
    '송 박사: 지금 네 도감으로 이미지를 보내고 있어 — 오래된 두루마리야. 세 정령을 곁에 두고 강림하는 빛나는 존재. 그들은 무엇보다 위대한 단 하나의 힘을 노려. 환웅 — 강림한 군주.',
  'Prof. Song: If 노스단 captures Hwanung, they command the very force that shaped the region — north and south, in a single stroke.':
    '송 박사: 노스단이 환웅을 잡으면, 이 지방을 빚어낸 바로 그 힘을 손에 넣어 — 남과 북을, 단번에.',
  'Prof. Song: But the Sovereign only descends for one who has gathered his three attendants — 풍백 the Wind, 우사 the Rain, 운사 the Clouds. Find and catch them before 노스단 does.':
    '송 박사: 하지만 군주는 세 시종을 모은 자에게만 강림해 — 바람의 풍백, 비의 우사, 구름의 운사. 노스단보다 먼저 그들을 찾아 잡아.',
  "Prof. Song: One more thing. The northern reaches are guarded by the 어사대 — the Royal Inspectorate. They trust outsiders even less than 노스단 does. You'll have to earn them, city by city.":
    '송 박사: 한 가지 더. 북방 관문은 어사대 — 왕실 감찰부가 지켜. 그들은 노스단보다도 외지인을 안 믿어. 도시 하나하나 신뢰를 얻어야 할 거야.',
  "Prof. Song: Ready the strongest team you have ever fielded, then take the road north. I'll stay on the Pokédex the whole way. Shall we go?":
    '송 박사: 네가 꾸린 가장 강한 팀을 준비하고, 북쪽 길에 올라. 가는 내내 내가 도감으로 함께할게. 갈까?',
  '📟 Your Pokédex buzzes — Professor Song.': '📟 도감이 울린다 — 송 박사.',
  'Prof. Song (over the Pokédex): The northern reaches are waiting, Champion — and 노스단 is already climbing toward the shrines. Ready to head north?':
    '송 박사 (도감 너머로): 북방 관문이 기다리고 있어, 챔피언 — 그리고 노스단은 이미 사당을 향해 오르고 있어. 북쪽으로 갈 준비됐어?',
  '❄  Beyond the border tunnels — into the Northern Reaches…': '❄  국경 터널 너머 — 북방 관문으로…',
  'NEWS: Researchers from the Hanbando Pokémon Institute are investigating a pattern linked to rare Pokémon migrations near Cheonji Lake...':
    '뉴스: 한반도 포켓몬 연구소의 연구원들이 천지 호수 근처의 희귀 포켓몬 이동과 연관된 패턴을 조사하고 있습니다...',
  'Route 2 is now open to the NORTH of the city.': '이제 도시 북쪽으로 2번 도로가 열렸다.',

  // ══ Baekdu Summit finale (Ch.11 — 나비할망 shield, Hwanwoong calmed) ══
  '▶ You release 나비할망.': '▶ 나비할망을 풀어놓는다.',
  '나비할망 launches into the center of the storm. Her metallic, dancheong-patterned wings unfurl — wider, and wider — into a vast translucent dome whose patterns exactly match the ancient tablets.':
    '나비할망이 폭풍의 중심으로 날아든다. 금속성 단청 무늬 날개가 펼쳐진다 — 점점, 더 넓게 — 고대 석판의 무늬와 정확히 일치하는 거대한 반투명 돔으로.',
  'The dome drinks in the chaotic red-and-purple spikes torn from 풍백, 우사, and 운사 — and converts them into a slow, gentle aurora that washes down across the peak.':
    '돔이 풍백, 우사, 운사에게서 뜯겨 나온 혼돈의 붉고 보랏빛 가시들을 빨아들인다 — 그리고 그것을 봉우리를 타고 흘러내리는 느리고 부드러운 오로라로 바꾼다.',
  'Far across the Taebaek range, three cries echo — Wind, Rain, and Clouds, set free. The chains of the matrix shatter; the trio scatter back into the wild peaks.':
    '태백 산맥 저편에서 세 울음이 메아리친다 — 풀려난 바람, 비, 구름. 매트릭스의 사슬이 부서지고, 세 정령은 야생의 봉우리로 흩어져 돌아간다.',
  'Hwanwoong, his borrowed agony lifted, slowly stills. His corona fades from violent red to a calm, deep blue.':
    '빌려온 고통이 걷힌 환웅이 천천히 잦아든다. 그의 코로나가 격렬한 붉은빛에서 차분한 짙은 파랑으로 옅어진다.',
  'The aura grows more violent each round as the towers strain... until the moment comes.':
    '탑들이 버티는 동안 오라가 매 턴 더 격렬해진다... 그 순간이 올 때까지.',
  '▶ RELEASE 나비할망?  (Yes — release her / No — hold on)': '▶ 나비할망을 풀어놓을까?  (예 — 풀어놓기 / 아니오 — 기다리기)',
  "He is not attacking out of malice. He is in agony — the matrix is wrenching at his waking mind, and the trio's chained energy feeds the overload.":
    '그는 악의로 공격하는 게 아니다. 고통에 빠진 것이다 — 매트릭스가 깨어나는 그의 정신을 비틀어 대고, 사슬에 묶인 세 정령의 에너지가 과부하를 부추긴다.',
  'Hwanwoong is yours — its corona gone, the lake mirror-still beneath a clearing sky.':
    '환웅은 이제 네 것이다 — 코로나가 사라지고, 개어가는 하늘 아래 호수는 거울처럼 고요하다.',
  'Rival climbs to the summit, Executive Mubaek defeated behind them, and joins you at the central altar.':
    '라이벌이 간부 무백을 뒤에 물리치고 정상에 올라, 중앙 제단에서 너와 합류한다.',
  'Rival: ...We actually did it. Together, then. Like always.': '라이벌: ...우리 정말 해냈어. 그럼 함께한 거네. 늘 그렇듯이.',
  'The bruised red sky clears. Gentle lines of golden light spread outward from the peak, flowing back down across the entire peninsula, settling the disturbed land and restoring its natural balance.':
    '멍든 붉은 하늘이 개인다. 부드러운 황금빛 선들이 봉우리에서 바깥으로 퍼져 나가, 반도 전체를 타고 도로 흘러내리며, 어지러워진 땅을 가라앉히고 그 자연의 균형을 회복시킨다.',
  'Prof. Song (comms, quiet with relief): The geothermal readings are stabilizing. The eruption threat is gone. The trio are free. And the whole region is breathing again.':
    '송 박사 (통신, 안도로 잦아든 목소리): 지열 수치가 안정되고 있어. 분화 위협은 사라졌어. 세 정령은 자유야. 그리고 온 지방이 다시 숨 쉬고 있어.',
  '나비할망 folds her glowing wings and settles beside you. The first clean stars appear over Baekdu Peak.':
    '나비할망이 빛나는 날개를 접고 네 곁에 내려앉는다. 백두봉 위로 첫 맑은 별들이 나타난다.',
  'You and the Rival make the long descent together, off the sacred mountain.':
    '너와 라이벌은 함께 성스러운 산을 내려가는 긴 하산길에 오른다.',
  '▶ Chapter 11 complete. Phase 2: Northern League — COMPLETE ✓': '▶ 11장 완료. 2막: 북방 리그 — 완료 ✓',
  'Post-game begins: The world is yours to explore, and some say the 어사대 still stirs in the unreached corners of the realm.':
    '포스트게임 시작: 세계는 네가 탐험할 몫이고, 어떤 이들은 어사대가 아직 닿지 않은 세상의 구석에서 꿈틀댄다고 말한다.',

  // ── Route 3 / Kaesong / Pine Needle Studio / Kaema Plateau ──
  'A woman in a dark, silver-trimmed coat blocks the gorge. This is no Team Suri grunt.':
    '은빛 테두리의 어두운 코트를 입은 여자가 협곡을 막는다. 이건 수리단 조무래기가 아니다.',
  'Commander Ryeo: We have no quarrel with you. Step aside.': '사령관 려: 너와는 다툴 일 없어. 비켜.',
  '어사대장 Hyeon presents a small bronze horse-tablet — a 마패.': '어사대장 현이 작은 청동 말 패 하나를 내민다 — 마패다.',
  '🐎 You received the Kaesong 마패! (1 of 8 the Northern League requires.)':
    '🐎 개성 마패를 받았다! (북방 리그에 필요한 8개 중 1개.)',
  '어사대장 Hyeon: Seven Chiefs remain, across the northern provinces. Earn all eight and the League gate at the far north will know you by them.':
    '어사대장 현: 북방 지방 곳곳에 일곱 어사대장이 남아 있다. 여덟을 모두 얻으면 저 먼 북쪽의 리그 관문이 그것으로 널 알아볼 것이다.',
  'The Seonjukgyo bridge arches over the stream toward the 어사대 Hall, once a Confucian academy.':
    '선죽교가 개울 위로 아치를 그리며 어사대 전당으로 이어진다, 한때 성균관이었던 곳.',
  'Take it back to Artist Sora!': '화가 소라에게 돌려주자!',
  'Artist Sora: Please, take these — a TM for Calm Mind, and a hand-painted map of the highland region.':
    '화가 소라: 이걸 받아줘 — 자기암시 기술머신하고, 손으로 그린 고원 지방 지도야.',
  '📀 Received TM — Calm Mind!  (Check your Bag to teach it.)': '📀 기술머신 — 자기암시를 받았다!  (가방에서 가르칠 수 있어.)',
  '🗺️ Received the Highland Map!': '🗺️ 고원 지도를 받았다!',
  'Artist Sora: One more thing... while searching, did you see those black markings near the northern pass?':
    '화가 소라: 한 가지 더... 찾는 동안, 북쪽 고갯길 근처의 그 검은 표식들 봤어?',
  'I patrol the highland fields for poachers. The frost mist rolls in fast up here — travellers get lost. But you? You battle first.':
    '난 밀렵꾼을 잡으러 고원 들판을 순찰해. 여긴 서리 안개가 빨리 몰려와 — 여행자들이 길을 잃지. 근데 너? 넌 먼저 배틀이다.',
  '❄ 서리 안개 (frost mist)': '❄ 서리 안개',
  '⛰ Kaema Plateau (개마고원)': '⛰ 개마고원',

  // ── Common overworld prompts ──
  'SPACE to continue': 'SPACE: 계속',
  'SPACE to advance': 'SPACE: 넘기기',
};
