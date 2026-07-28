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
  '어사대장 Jito': '어사대장 지토', '어사대장 Salmu': '어사대장 살무', '어사대장 Gapcheol': '어사대장 갑철',
  '노스단 Grunt': '노스단 조무래기', '노스단 Admin': '노스단 간부',
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

  // ── Common overworld prompts ──
  'SPACE to continue': 'SPACE: 계속',
  'SPACE to advance': 'SPACE: 넘기기',
};
