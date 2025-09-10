     1	// 잉글리시 마켓 - 메인 JavaScript 파일
     2	
     3	// Global variables
     4	let currentUser = null;
     5	let isTeacher = false;
     6	let canvas = null;
     7	let ctx = null;
     8	let isDrawing = false;
     9	let selectedItem = null;
    10	let currentColor = '#000000';
    11	let brushSize = 3;
    12	let isEraser = false;
    13	let soundEnabled = true;
    14	let colorNames = {
    15	    '#000000': '검정',
    16	    '#FF0000': '빨간색',
    17	    '#00FF00': '초록색',
    18	    '#0000FF': '파란색',
    19	    '#FFFF00': '노란색',
    20	    '#FF00FF': '자주색',
    21	    '#00FFFF': '청록색',
    22	    '#FFA500': '주황색',
    23	    '#800080': '보라색',
    24	    '#FFC0CB': '분홍색',
    25	    '#A52A2A': '갈색',
    26	    '#808080': '회색',
    27	    '#90EE90': '연초록',
    28	    '#FFB6C1': '연분홍',
    29	    '#87CEEB': '하늘색',
    30	    '#FFFFFF': '하얀'
    31	};
    32	
    33	// 포켓몬 카드 등급 시스템
    34	function getItemRarity(price) {
    35	    if (price <= 50) return 'common';
    36	    if (price <= 100) return 'rare';
    37	    if (price <= 200) return 'epic';
    38	    return 'legendary';
    39	}
    40	
    41	function getRarityText(rarity) {
    42	    const rarityTexts = {
    43	        'common': 'Common',
    44	        'rare': 'Rare ⭐',
    45	        'epic': 'Epic ⭐⭐',
    46	        'legendary': 'Legendary ⭐⭐⭐'
    47	    };
    48	    return rarityTexts[rarity] || 'Common';
    49	}
    50	
    51	// 사용자 레벨 시스템
    52	function getUserLevel(salesEarnings) {
    53	    if (salesEarnings < 100) return 'beginner';
    54	    if (salesEarnings < 300) return 'trader';
    55	    if (salesEarnings < 600) return 'merchant';
    56	    if (salesEarnings < 1000) return 'tycoon';
    57	    return 'master';
    58	}
    59	
    60	function getLevelText(level) {
    61	    const levelTexts = {
    62	        'beginner': '🌱 초보자',
    63	        'trader': '🏪 상인',
    64	        'merchant': '💰 거상',
    65	        'tycoon': '👑 재벌',
    66	        'master': '🌟 전설의 상인'
    67	    };
    68	    return levelTexts[level] || '🌱 초보자';
    69	}
    70	
    71	// 사운드 시스템
    72	function playSound(type) {
    73	    if (!soundEnabled) return;
    74	    
    75	    // Web Audio API를 사용해 간단한 사운드 생성
    76	    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    77	    
    78	    function createBeep(frequency, duration, volume = 0.1, type = 'sine') {
    79	        const oscillator = audioContext.createOscillator();
    80	        const gainNode = audioContext.createGain();
    81	        
    82	        oscillator.connect(gainNode);
    83	        gainNode.connect(audioContext.destination);
    84	        
    85	        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    86	        oscillator.type = type;
    87	        
    88	        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    89	        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    90	        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    91	        
    92	        oscillator.start(audioContext.currentTime);
    93	        oscillator.stop(audioContext.currentTime + duration);
    94	    }
    95	    
    96	    switch(type) {
    97	        case 'purchase':
    98	            // 구매 성공 - 상승하는 멜로디
    99	            createBeep(523.25, 0.15); // C5
   100	            setTimeout(() => createBeep(659.25, 0.15), 100); // E5
   101	            setTimeout(() => createBeep(783.99, 0.3), 200); // G5
   102	            break;
   103	            
   104	        case 'legendary':
   105	            // 전설급 - 화려한 멜로디
   106	            createBeep(523.25, 0.1); // C5
   107	            setTimeout(() => createBeep(659.25, 0.1), 50); // E5
   108	            setTimeout(() => createBeep(783.99, 0.1), 100); // G5
   109	            setTimeout(() => createBeep(1046.5, 0.3), 150); // C6
   110	            break;
   111	            
   112	        case 'click':
   113	            // 클릭 소리
   114	            createBeep(800, 0.05, 0.05);
   115	            break;
   116	            
   117	        case 'error':
   118	            // 에러 소리 - 하강하는 톤
   119	            createBeep(400, 0.2, 0.1, 'sawtooth');
   120	            setTimeout(() => createBeep(300, 0.3, 0.1, 'sawtooth'), 100);
   121	            break;
   122	            
   123	        case 'level-up':
   124	            // 레벨업 - 트럼펫 같은 소리
   125	            createBeep(523.25, 0.1);
   126	            setTimeout(() => createBeep(659.25, 0.1), 80);
   127	            setTimeout(() => createBeep(783.99, 0.1), 160);
   128	            setTimeout(() => createBeep(1046.5, 0.4), 240);
   129	            break;
   130	    }
   131	}
   132	
   133	function toggleSound() {
   134	    soundEnabled = !soundEnabled;
   135	    const soundIcon = document.getElementById('sound-icon');
   136	    const soundText = document.getElementById('sound-text');
   137	    const soundButton = document.getElementById('sound-toggle');
   138	    
   139	    if (soundEnabled) {
   140	        soundIcon.className = 'fas fa-volume-up mr-1';
   141	        soundText.textContent = '사운드';
   142	        soundButton.className = 'bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm';
   143	        playSound('click');
   144	    } else {
   145	        soundIcon.className = 'fas fa-volume-mute mr-1';
   146	        soundText.textContent = '무음';
   147	        soundButton.className = 'bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm';
   148	    }
   149	}
   150	
   151	// 불꽃놀이 애니메이션
   152	function createFireworks() {
   153	    const container = document.createElement('div');
   154	    container.className = 'fireworks-container';
   155	    document.body.appendChild(container);
   156	
   157	    // 여러 개의 불꽃놀이 생성
   158	    for (let i = 0; i < 30; i++) {
   159	        setTimeout(() => {
   160	            createSingleFirework(container);
   161	        }, i * 100);
   162	    }
   163	
   164	    // 3초 후 제거
   165	    setTimeout(() => {
   166	        if (container.parentNode) {
   167	            container.parentNode.removeChild(container);
   168	        }
   169	    }, 3000);
   170	}
   171	
   172	function createSingleFirework(container) {
   173	    const firework = document.createElement('div');
   174	    firework.className = `firework color-${Math.floor(Math.random() * 6) + 1}`;
   175	    
   176	    // 랜덤 위치 설정
   177	    firework.style.left = Math.random() * 100 + '%';
   178	    firework.style.top = Math.random() * 100 + '%';
   179	    
   180	    container.appendChild(firework);
   181	    
   182	    // 1.5초 후 제거
   183	    setTimeout(() => {
   184	        if (firework.parentNode) {
   185	            firework.parentNode.removeChild(firework);
   186	        }
   187	    }, 1500);
   188	}
   189	
   190	// 성공 메시지 표시
   191	function showSuccessMessage(message) {
   192	    const successDiv = document.createElement('div');
   193	    successDiv.className = 'success-message';
   194	    successDiv.textContent = message;
   195	    document.body.appendChild(successDiv);
   196	    
   197	    setTimeout(() => {
   198	        if (successDiv.parentNode) {
   199	            successDiv.parentNode.removeChild(successDiv);
   200	        }
   201	    }, 2000);
   202	}
   203	
   204	let categoryNames = {
   205	    'toys': '장난감',
   206	    'food': '음식',
   207	    'clothes': '의류',
   208	    'electronics': '전자제품',
   209	    'books': '책',
   210	    'other': '기타'
   211	};
   212	
   213	// Initialize application
   214	document.addEventListener('DOMContentLoaded', function() {
   215	    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
   216	    initializeDrawing();
   217	    initializeColorPalette();
   218	    loadMarketplace();
   219	    
   220	    // 초기 상태에서는 사용자 정보 숨기기
   221	    document.getElementById('user-info').style.display = 'none';
   222	    
   223	    // Check if user is already logged in
   224	    const savedUser = localStorage.getItem('currentUser');
   225	    if (savedUser) {
   226	        currentUser = JSON.parse(savedUser);
   227	        showMainApp();
   228	        updateUserInfo();
   229	    }
   230	});
   231	
   232	// User Authentication Functions
   233	async function login() {
   234	    const studentNumberInput = document.getElementById('student-number').value.trim();
   235	    const studentName = document.getElementById('student-name').value.trim();
   236	    
   237	    // 학번 검증: 4자리 숫자만 허용 (예: 4103)
   238	    if (!studentNumberInput || !/^\d{4}$/.test(studentNumberInput)) {
   239	        showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
   240	        return;
   241	    }
   242	    
   243	    const studentNumber = studentNumberInput;
   244	    
   245	    if (!studentName) {
   246	        showMessage('이름을 입력해주세요', 'error');
   247	        return;
   248	    }
   249	    
   250	    try {
   251	        // Check if user already exists
   252	        const existingUsers = await fetchTableData('users');
   253	        let user = existingUsers.data.find(u => u.student_number === studentNumber);
   254	        
   255	        if (user) {
   256	            // Update existing user
   257	            user.name = studentName;
   258	            user.is_active = true;
   259	            
   260	            // 기존 사용자의 포인트 필드를 새 시스템으로 마이그레이션
   261	            if (!user.purchase_points && user.points) {
   262	                user.purchase_points = user.points;
   263	                user.sales_earnings = 0;
   264	            } else if (!user.purchase_points) {
   265	                user.purchase_points = 10000;
   266	                user.sales_earnings = 0;
   267	            }
   268	            
   269	            await updateRecord('users', user.id, user);
   270	        } else {
   271	            // Create new user
   272	            user = await createRecord('users', {
   273	                name: studentName,
   274	                student_number: studentNumber,
   275	                purchase_points: 10000,
   276	                sales_earnings: 0,
   277	                role: 'student',
   278	                is_active: true
   279	            });
   280	        }
   281	        
   282	        currentUser = user;
   283	        localStorage.setItem('currentUser', JSON.stringify(user));
   284	        showMainApp();
   285	        updateUserInfo();
   286	        showMessage('🎉 창건샘의 How Much 마켓에 오신 것을 환영합니다! 🎊', 'success');
   287	        
   288	    } catch (error) {
   289	        console.error('Login error:', error);
   290	        showMessage('로그인에 실패했습니다. 다시 시도해주세요.', 'error');
   291	    }
   292	}
   293	
   294	async function teacherLogin() {
   295	    const password = prompt('Enter teacher password:');
   296	    if (password === 'teacher123') { // Simple password for demo
   297	        try {
   298	            let teacher = await createRecord('users', {
   299	                name: 'Teacher',
   300	                student_number: '0000',
   301	                purchase_points: 999999,
   302	                sales_earnings: 999999,
   303	                role: 'teacher',
   304	                is_active: true
   305	            });
   306	            
   307	            currentUser = teacher;
   308	            isTeacher = true;
   309	            localStorage.setItem('currentUser', JSON.stringify(teacher));
   310	            showMainApp();
   311	            updateUserInfo();
   312	            showTeacherModal();
   313	        } catch (error) {
   314	            console.error('Teacher login error:', error);
   315	            showMessage('선생님 로그인에 실패했습니다', 'error');
   316	        }
   317	    } else {
   318	        showMessage('잘못된 비밀번호입니다', 'error');
   319	    }
   320	}
   321	
   322	function logout() {
   323	    if (currentUser) {
   324	        updateRecord('users', currentUser.id, { ...currentUser, is_active: false });
   325	    }
   326	    currentUser = null;
   327	    isTeacher = false;
   328	    localStorage.removeItem('currentUser');
   329	    document.getElementById('login-section').style.display = 'block';
   330	    document.getElementById('main-app').style.display = 'none';
   331	    document.getElementById('user-info').style.display = 'none'; // 사용자 정보 숨기기
   332	    document.getElementById('student-number').value = '';
   333	    document.getElementById('student-name').value = '';
   334	}
   335	
   336	// UI Control Functions
   337	function showMainApp() {
   338	    document.getElementById('login-section').style.display = 'none';
   339	    document.getElementById('main-app').style.display = 'block';
   340	    loadMarketplace();
   341	    loadMyItems();
   342	    loadTransactionHistory();
   343	}
   344	
   345	function updateUserInfo() {
   346	    if (currentUser) {
   347	        // 포인트 필드가 존재하는지 확인하고 기본값 설정
   348	        const purchasePoints = currentUser.purchase_points || currentUser.points || 10000;
   349	        const salesEarnings = currentUser.sales_earnings || 0;
   350	        
   351	        // 레벨 시스템 적용
   352	        const userLevel = getUserLevel(salesEarnings);
   353	        const levelText = getLevelText(userLevel);
   354	        
   355	        // 이름과 레벨 뱃지를 함께 표시
   356	        const nameElement = document.getElementById('user-name');
   357	        nameElement.innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
   358	        
   359	        document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
   360	        document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
   361	        document.getElementById('user-info').style.display = 'flex';
   362	        
   363	        // currentUser 객체도 업데이트해서 이후 로직에서 사용할 수 있도록
   364	        if (!currentUser.purchase_points) {
   365	            currentUser.purchase_points = purchasePoints;
   366	        }
   367	        if (!currentUser.sales_earnings) {
   368	            currentUser.sales_earnings = salesEarnings;
   369	        }
   370	    } else {
   371	        // 로그인하지 않은 상태에서는 사용자 정보 숨기기
   372	        document.getElementById('user-info').style.display = 'none';
   373	    }
   374	}
   375	
   376	function showTab(tabName) {
   377	    // Hide all tabs
   378	    document.querySelectorAll('.tab-content').forEach(tab => {
   379	        tab.style.display = 'none';
   380	    });
   381	    
   382	    // Remove active class from all buttons
   383	    document.querySelectorAll('.tab-btn').forEach(btn => {
   384	        btn.classList.remove('active');
   385	    });
   386	    
   387	    // Show selected tab
   388	    document.getElementById(`tab-${tabName}`).style.display = 'block';
   389	    
   390	    // Add active class to selected button
   391	    event.target.classList.add('active');
   392	    
   393	    // Refresh content based on tab
   394	    switch(tabName) {
   395	        case 'marketplace':
   396	            loadMarketplace();
   397	            break;
   398	        case 'inventory':
   399	            loadMyItems();
   400	            break;
   401	        case 'history':
   402	            loadTransactionHistory();
   403	            break;
   404	    }
   405	}
   406	
   407	// Drawing Functions
   408	function initializeDrawing() {
   409	    canvas = document.getElementById('drawing-canvas');
   410	    if (canvas) {
   411	        ctx = canvas.getContext('2d');
   412	        ctx.lineWidth = brushSize;
   413	        ctx.lineCap = 'round';
   414	        ctx.lineJoin = 'round';
   415	        
   416	        // Mouse events
   417	        canvas.addEventListener('mousedown', startDrawing);
   418	        canvas.addEventListener('mousemove', draw);
   419	        canvas.addEventListener('mouseup', stopDrawing);
   420	        canvas.addEventListener('mouseout', stopDrawing);
   421	        
   422	        // Touch events for mobile
   423	        canvas.addEventListener('touchstart', handleTouch);
   424	        canvas.addEventListener('touchmove', handleTouch);
   425	        canvas.addEventListener('touchend', stopDrawing);
   426	    }
   427	}
   428	
   429	function startDrawing(e) {
   430	    isDrawing = true;
   431	    draw(e);
   432	}
   433	
   434	function draw(e) {
   435	    if (!isDrawing) return;
   436	    
   437	    const rect = canvas.getBoundingClientRect();
   438	    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
   439	    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
   440	    
   441	    if (isEraser) {
   442	        ctx.globalCompositeOperation = 'destination-out';
   443	        ctx.lineWidth = brushSize * 2; // 지우개는 브러시보다 크게
   444	    } else {
   445	        ctx.globalCompositeOperation = 'source-over';
   446	        ctx.strokeStyle = currentColor;
   447	        ctx.lineWidth = brushSize;
   448	    }
   449	    
   450	    ctx.lineTo(x, y);
   451	    ctx.stroke();
   452	    ctx.beginPath();
   453	    ctx.moveTo(x, y);
   454	}
   455	
   456	function stopDrawing() {
   457	    if (isDrawing) {
   458	        ctx.beginPath();
   459	        isDrawing = false;
   460	    }
   461	}
   462	
   463	function handleTouch(e) {
   464	    e.preventDefault();
   465	    const touch = e.touches[0];
   466	    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
   467	                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
   468	        clientX: touch.clientX,
   469	        clientY: touch.clientY
   470	    });
   471	    canvas.dispatchEvent(mouseEvent);
   472	}
   473	
   474	function clearCanvas() {
   475	    if (ctx) {
   476	        ctx.clearRect(0, 0, canvas.width, canvas.height);
   477	        // 캔버스 배경을 하얀으로 설정
   478	        ctx.fillStyle = '#FFFFFF';
   479	        ctx.fillRect(0, 0, canvas.width, canvas.height);
   480	    }
   481	}
   482	
   483	// 색상 팔레트 초기화
   484	function initializeColorPalette() {
   485	    // 색상 옵션 클릭 이벤트
   486	    document.querySelectorAll('.color-option').forEach(option => {
   487	        option.addEventListener('click', function() {
   488	            selectColor(this.dataset.color);
   489	        });
   490	    });
   491	    
   492	    // 브러시 크기 슬라이더
   493	    const brushSizeSlider = document.getElementById('brush-size');
   494	    if (brushSizeSlider) {
   495	        brushSizeSlider.addEventListener('input', function() {
   496	            brushSize = parseInt(this.value);
   497	            document.getElementById('brush-size-display').textContent = brushSize;
   498	        });
   499	    }
   500	    
   501	    // 기본 색상 선택 (검정)
   502	    selectColor('#000000');
   503	}
   504	
   505	// 색상 선택 함수
   506	function selectColor(color) {
   507	    currentColor = color;
   508	    isEraser = false;
   509	    
   510	    // 모든 색상 옵션에서 선택 해제
   511	    document.querySelectorAll('.color-option').forEach(option => {
   512	        option.classList.remove('ring-4', 'ring-blue-500');
   513	    });
   514	    
   515	    // 선택된 색상에 테두리 추가
   516	    const selectedOption = document.querySelector(`[data-color="${color}"]`);
   517	    if (selectedOption) {
   518	        selectedOption.classList.add('ring-4', 'ring-blue-500');
   519	    }
   520	    
   521	    // 현재 색상 표시 업데이트
   522	    document.getElementById('current-color').style.backgroundColor = color;
   523	    document.getElementById('current-color-name').textContent = colorNames[color] || '사용자 지정';
   524	    
   525	    // 지우개 버튼 상태 변경
   526	    const eraserBtn = document.getElementById('eraser-btn');
   527	    eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
   528	    eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
   529	    eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
   530	}
   531	
   532	// 지우개 토글
   533	function toggleEraser() {
   534	    isEraser = !isEraser;
   535	    const eraserBtn = document.getElementById('eraser-btn');
   536	    
   537	    if (isEraser) {
   538	        // 지우개 모드 활성화
   539	        eraserBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
   540	        eraserBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
   541	        eraserBtn.innerHTML = '<i class="fas fa-paint-brush mr-1"></i>그리기';
   542	        
   543	        // 모든 색상 선택 해제
   544	        document.querySelectorAll('.color-option').forEach(option => {
   545	            option.classList.remove('ring-4', 'ring-blue-500');
   546	        });
   547	        
   548	        // 현재 상태 표시
   549	        document.getElementById('current-color').style.backgroundColor = '#CCCCCC';
   550	        document.getElementById('current-color-name').textContent = '지우개 모드';
   551	        
   552	    } else {
   553	        // 그리기 모드로 복귀
   554	        selectColor(currentColor);
   555	    }
   556	}
   557	
   558	// Item Management Functions
   559	async function sellItem() {
   560	    if (!currentUser) {
   561	        showMessage('먼저 로그인해주세요', 'error');
   562	        return;
   563	    }
   564	    
   565	    const form = document.getElementById('sell-form');
   566	    const formData = new FormData(form);
   567	    
   568	    const itemName = document.getElementById('item-name').value.trim();
   569	    const description = document.getElementById('item-description').value.trim();
   570	    const price = parseInt(document.getElementById('item-price').value);
   571	    const category = document.getElementById('item-category').value;
   572	    
   573	    if (!itemName || !price || price <= 0) {
   574	        showMessage('모든 필수 정보를 입력해주세요', 'error');
   575	        return;
   576	    }
   577	    
   578	    // Convert canvas to image data
   579	    const imageData = canvas.toDataURL('image/png');
   580	    
   581	    try {
   582	        const item = await createRecord('items', {
   583	            seller_id: currentUser.id,
   584	            name: itemName,
   585	            description: description,
   586	            price: price,
   587	            image_url: imageData,
   588	            status: 'available',
   589	            category: category
   590	        });
   591	        
   592	        showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
   593	        form.reset();
   594	        clearCanvas();
   595	        loadMarketplace();
   596	        loadMyItems();
   597	        
   598	    } catch (error) {
   599	        console.error('Error listing item:', error);
   600	        showMessage('아이템 등록에 실패했습니다. 다시 시도해주세요.', 'error');
   601	    }
   602	}
   603	
   604	// Attach form submit event
   605	document.getElementById('sell-form').addEventListener('submit', function(e) {
   606	    e.preventDefault();
   607	    sellItem();
   608	});
   609	
   610	// Marketplace Functions
   611	async function loadMarketplace() {
   612	    try {
   613	        const items = await fetchTableData('items');
   614	        const users = await fetchTableData('users');
   615	        
   616	        const availableItems = items.data.filter(item => {
   617	            // 판매 가능한 상태인지 확인
   618	            if (item.status !== 'available') return false;
   619	            
   620	            // 현재 사용자가 있다면 자신의 아이템은 제외
   621	            if (currentUser && item.seller_id === currentUser.id) return false;
   622	            
   623	            return true;
   624	        });
   625	        
   626	        console.log('Available items:', availableItems.length);
   627	        
   628	        const itemsGrid = document.getElementById('items-grid');
   629	        itemsGrid.innerHTML = '';
   630	        
   631	        if (availableItems.length === 0) {
   632	            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요. 처음으로 무언가를 판매해보세요!</div>';
   633	            return;
   634	        }
   635	        
   636	        availableItems.forEach(item => {
   637	            const seller = users.data.find(u => u.id === item.seller_id);
   638	            const itemCard = createItemCard(item, seller);
   639	            itemsGrid.appendChild(itemCard);
   640	        });
   641	        
   642	    } catch (error) {
   643	        console.error('Error loading marketplace:', error);
   644	        showMessage('Failed to load marketplace', 'error');
   645	    }
   646	}
   647	
   648	function createItemCard(item, seller, showActions = true, isMyItem = false) {
   649	    const card = document.createElement('div');
   650	    
   651	    // 가격에 따른 카드 등급 결정
   652	    const rarity = getItemRarity(item.price);
   653	    card.className = `item-card slide-in ${rarity}`;
   654	    
   655	    const canAfford = currentUser && currentUser.purchase_points >= item.price;
   656	    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
   657	    const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '구매 포인트 부족';
   658	    
   659	    card.innerHTML = `
   660	        <div class="relative">
   661	            <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
   662	            <img src="${item.image_url}" alt="${item.name}" class="item-image">
   663	            ${item.status === 'sold' ? '<div class="sold-overlay">SOLD</div>' : ''}
   664	        </div>
   665	        <div class="item-info">
   666	            <div class="flex justify-between items-start mb-2">
   667	                <h4 class="font-semibold text-gray-900 truncate">${item.name}</h4>
   668	                <span class="category-badge category-${item.category}">${categoryNames[item.category] || item.category}</span>
   669	            </div>
   670	            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${item.description}</p>
   671	            <div class="flex justify-between items-center mb-3">
   672	                <span class="price-tag">
   673	                    <i class="fas fa-coins mr-1"></i>
   674	                    ${item.price} 포인트
   675	                </span>
   676	                <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : '알 수 없음'}</span>
   677	            </div>
   678	            ${showActions && currentUser && item.status === 'available' ? `
   679	                ${isMyItem ? `
   680	                    <button onclick="openEditModal('${item.id}')" 
   681	                            class="w-full cute-btn py-2 px-4 rounded-full mb-2 font-bold">
   682	                        ✏️ 수정하기
   683	                    </button>
   684	                ` : `
   685	                    <button onclick="openPurchaseModal('${item.id}')" 
   686	                            class="${buyButtonClass}" 
   687	                            ${!canAfford ? 'disabled' : ''}>
   688	                        <i class="fas fa-shopping-cart mr-1"></i>
   689	                        ${buyButtonText}
   690	                    </button>
   691	                `}
   692	            ` : ''}
   693	        </div>
   694	    `;
   695	    
   696	    return card;
   697	}
   698	
   699	// Purchase Functions
   700	function openPurchaseModal(itemId) {
   701	    selectedItem = itemId;
   702	    fetchTableData('items').then(items => {
   703	        const item = items.data.find(i => i.id === itemId);
   704	        if (!item) return;
   705	        
   706	        return fetchTableData('users').then(users => {
   707	            const seller = users.data.find(u => u.id === item.seller_id);
   708	            
   709	            document.getElementById('purchase-details').innerHTML = `
   710	                <div class="text-center mb-4">
   711	                    <img src="${item.image_url}" alt="${item.name}" class="w-24 h-24 object-cover mx-auto rounded-lg mb-3">
   712	                    <h4 class="font-bold text-lg">${item.name}</h4>
   713	                    <p class="text-gray-600">${item.description}</p>
   714	                    <p class="text-sm text-gray-500 mt-2">판매자: ${seller ? seller.name : '알 수 없음'}</p>
   715	                </div>
   716	                <div class="bg-gray-50 p-3 rounded">
   717	                    <div class="flex justify-between items-center">
   718	                        <span>가격:</span>
   719	                        <span class="font-bold text-lg text-green-600">${item.price} 포인트</span>
   720	                    </div>
   721	                    <div class="flex justify-between items-center mt-1">
   722	                        <span>내 구매 포인트:</span>
   723	                        <span class="font-bold text-blue-600">${currentUser.purchase_points} 포인트</span>
   724	                    </div>
   725	                    <div class="flex justify-between items-center mt-1">
   726	                        <span>내 판매 수익:</span>
   727	                        <span class="font-bold text-yellow-600">${currentUser.sales_earnings} 포인트</span>
   728	                    </div>
   729	                    <div class="flex justify-between items-center mt-2 pt-2 border-t">
   730	                        <span>구매 후 구매 포인트:</span>
   731	                        <span class="font-bold ${currentUser.purchase_points - item.price >= 0 ? 'text-green-600' : 'text-red-600'}">
   732	                            ${currentUser.purchase_points - item.price} 포인트
   733	                        </span>
   734	                    </div>
   735	                    <div class="text-xs text-gray-600 mt-3 p-2 bg-blue-50 rounded">
   736	                        💰 구매는 구매 포인트에서만 차감! 판매하면 판매 수익이 올라가요!
   737	                    </div>
   738	                </div>
   739	            `;
   740	            
   741	            document.getElementById('purchase-modal').classList.remove('hidden');
   742	            document.getElementById('purchase-modal').classList.add('flex');
   743	        });
   744	    });
   745	}
   746	
   747	function closePurchaseModal() {
   748	    document.getElementById('purchase-modal').classList.add('hidden');
   749	    document.getElementById('purchase-modal').classList.remove('flex');
   750	    selectedItem = null;
   751	}
   752	
   753	async function confirmPurchase() {
   754	    if (!selectedItem || !currentUser) return;
   755	    
   756	    try {
   757	        const items = await fetchTableData('items');
   758	        const users = await fetchTableData('users');
   759	        
   760	        const item = items.data.find(i => i.id === selectedItem);
   761	        const seller = users.data.find(u => u.id === item.seller_id);
   762	        
   763	        if (!item || !seller || item.status === 'sold') {
   764	            showMessage('Item is no longer available', 'error');
   765	            closePurchaseModal();
   766	            return;
   767	        }
   768	        
   769	        if (currentUser.purchase_points < item.price) {
   770	            showMessage('구매 포인트가 부족합니다', 'error');
   771	            closePurchaseModal();
   772	            return;
   773	        }
   774	        
   775	        // Update buyer purchase points (구매자의 구매 포인트에서 차감)
   776	        currentUser.purchase_points -= item.price;
   777	        await updateRecord('users', currentUser.id, currentUser);
   778	        
   779	        // Update seller sales earnings (판매자의 판매 수익에 추가)
   780	        seller.sales_earnings += item.price;
   781	        await updateRecord('users', seller.id, seller);
   782	        
   783	        // Mark item as sold
   784	        await updateRecord('items', item.id, { ...item, status: 'sold' });
   785	        
   786	        // Record transaction
   787	        await createRecord('transactions', {
   788	            buyer_id: currentUser.id,
   789	            seller_id: seller.id,
   790	            item_id: item.id,
   791	            amount: item.price,
   792	            transaction_time: new Date().toISOString()
   793	        });
   794	        
   795	        // 🎉 구매 성공 애니메이션과 메시지
   796	        const rarity = getItemRarity(item.price);
   797	        let successMessage = `🎉 구매 성공! ${item.name}을(를) 획득했어요!`;
   798	        
   799	        if (rarity === 'legendary') {
   800	            successMessage = `🌟 전설급 아이템 획득! ${item.name}`;
   801	            createFireworks(); // 전설급 아이템일 때만 불꽃놀이
   802	            playSound('legendary'); // 전설급 사운드
   803	        } else if (rarity === 'epic') {
   804	            successMessage = `⭐⭐ 에픽 아이템 획득! ${item.name}`;
   805	            playSound('purchase'); // 일반 구매 사운드
   806	        } else if (rarity === 'rare') {
   807	            successMessage = `⭐ 레어 아이템 획득! ${item.name}`;
   808	            playSound('purchase'); // 일반 구매 사운드
   809	        } else {
   810	            playSound('purchase'); // 일반 구매 사운드
   811	        }
   812	        
   813	        showSuccessMessage(successMessage);
   814	        
   815	        // Update UI
   816	        updateUserInfo();
   817	        loadMarketplace();
   818	        loadMyItems();
   819	        loadTransactionHistory();
   820	        closePurchaseModal();
   821	        
   822	        // Animate points update
   823	        document.getElementById('user-purchase-points').classList.add('points-animate');
   824	        setTimeout(() => {
   825	            document.getElementById('user-purchase-points').classList.remove('points-animate');
   826	        }, 500);
   827	        
   828	        showMessage(`🎉 ${item.name}을(를) 성공적으로 구매했습니다! 🛒`, 'success');
   829	        
   830	    } catch (error) {
   831	        console.error('Purchase error:', error);
   832	        showMessage('Purchase failed. Please try again.', 'error');
   833	    }
   834	}
   835	
   836	// My Items Functions
   837	async function loadMyItems() {
   838	    if (!currentUser) return;
   839	    
   840	    try {
   841	        const items = await fetchTableData('items');
   842	        const transactions = await fetchTableData('transactions');
   843	        const users = await fetchTableData('users');
   844	        
   845	        // Items I'm selling
   846	        const mySellingItems = items.data.filter(item => item.seller_id === currentUser.id);
   847	        const sellingContainer = document.getElementById('my-selling-items');
   848	        sellingContainer.innerHTML = '';
   849	        
   850	        if (mySellingItems.length === 0) {
   851	            sellingContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">아직 등록한 아이템이 없어요.</div>';
   852	        } else {
   853	            mySellingItems.forEach(item => {
   854	                const card = createItemCard(item, currentUser, true, true); // isMyItem = true
   855	                sellingContainer.appendChild(card);
   856	            });
   857	        }
   858	        
   859	        // Items I bought
   860	        const myPurchases = transactions.data.filter(t => t.buyer_id === currentUser.id);
   861	        const boughtContainer = document.getElementById('my-bought-items');
   862	        boughtContainer.innerHTML = '';
   863	        
   864	        if (myPurchases.length === 0) {
   865	            boughtContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">아직 구매한 아이템이 없어요.</div>';
   866	        } else {
   867	            for (const transaction of myPurchases) {
   868	                const item = items.data.find(i => i.id === transaction.item_id);
   869	                const seller = users.data.find(u => u.id === transaction.seller_id);
   870	                if (item) {
   871	                    const card = createItemCard(item, seller, false);
   872	                    boughtContainer.appendChild(card);
   873	                }
   874	            }
   875	        }
   876	        
   877	    } catch (error) {
   878	        console.error('Error loading my items:', error);
   879	        showMessage('내 아이템 로딩에 실패했습니다', 'error');
   880	    }
   881	}
   882	
   883	// Transaction History Functions
   884	async function loadTransactionHistory() {
   885	    if (!currentUser) return;
   886	    
   887	    try {
   888	        const transactions = await fetchTableData('transactions');
   889	        const items = await fetchTableData('items');
   890	        const users = await fetchTableData('users');
   891	        
   892	        const myTransactions = transactions.data.filter(t => 
   893	            t.buyer_id === currentUser.id || t.seller_id === currentUser.id
   894	        );
   895	        
   896	        const historyContainer = document.getElementById('transaction-history');
   897	        historyContainer.innerHTML = '';
   898	        
   899	        if (myTransactions.length === 0) {
   900	            historyContainer.innerHTML = '<div class="text-center text-gray-500 py-8">아직 거래 내역이 없어요.</div>';
   901	            return;
   902	        }
   903	        
   904	        // Sort by date (newest first)
   905	        myTransactions.sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time));
   906	        
   907	        myTransactions.forEach(transaction => {
   908	            const item = items.data.find(i => i.id === transaction.item_id);
   909	            const isBuyer = transaction.buyer_id === currentUser.id;
   910	            const otherUser = users.data.find(u => u.id === (isBuyer ? transaction.seller_id : transaction.buyer_id));
   911	            
   912	            if (item) {
   913	                const transactionElement = document.createElement('div');
   914	                transactionElement.className = `transaction-item ${isBuyer ? 'transaction-buy' : 'transaction-sell'}`;
   915	                
   916	                transactionElement.innerHTML = `
   917	                    <div class="flex items-center space-x-4">
   918	                        <img src="${item.image_url}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
   919	                        <div>
   920	                            <h4 class="font-medium">${item.name}</h4>
   921	                            <p class="text-sm text-gray-600">
   922	                                ${isBuyer ? '구매처:' : '판매처:'} ${otherUser ? otherUser.name : '알 수 없음'}
   923	                            </p>
   924	                            <p class="text-xs text-gray-500">
   925	                                ${new Date(transaction.transaction_time).toLocaleString()}
   926	                            </p>
   927	                        </div>
   928	                    </div>
   929	                    <div class="text-right">
   930	                        <div class="font-bold ${isBuyer ? 'text-red-600' : 'text-green-600'}">
   931	                            ${isBuyer ? '-' : '+'}${transaction.amount} points
   932	                        </div>
   933	                    </div>
   934	                `;
   935	                
   936	                historyContainer.appendChild(transactionElement);
   937	            }
   938	        });
   939	        
   940	    } catch (error) {
   941	        console.error('Error loading transaction history:', error);
   942	        showMessage('거래 내역 로딩에 실패했습니다', 'error');
   943	    }
   944	}
   945	
   946	// Teacher Dashboard Functions
   947	function showTeacherModal() {
   948	    document.getElementById('teacher-modal').classList.remove('hidden');
   949	    document.getElementById('teacher-modal').classList.add('flex');
   950	    loadTeacherDashboard();
   951	}
   952	
   953	function closeTeacherModal() {
   954	    document.getElementById('teacher-modal').classList.add('hidden');
   955	    document.getElementById('teacher-modal').classList.remove('flex');
   956	}
   957	
   958	async function loadTeacherDashboard() {
   959	    try {
   960	        const users = await fetchTableData('users');
   961	        const items = await fetchTableData('items');
   962	        const transactions = await fetchTableData('transactions');
   963	        
   964	        // Load students list
   965	        const students = users.data.filter(u => u.role === 'student');
   966	        const studentsList = document.getElementById('students-list');
   967	        studentsList.innerHTML = '';
   968	        
   969	        students.sort((a, b) => a.student_number.localeCompare(b.student_number));
   970	        
   971	        students.forEach(student => {
   972	            const studentElement = document.createElement('div');
   973	            studentElement.className = student.is_active ? 'student-online' : 'student-offline';
   974	            
   975	            studentElement.innerHTML = `
   976	                <div>
   977	                    <span class="font-medium">${student.student_number} ${student.name}</span>
   978	                    <span class="ml-2 text-sm ${student.is_active ? 'text-green-600' : 'text-gray-500'}">
   979	                        ${student.is_active ? '온라인' : '오프라인'}
   980	                    </span>
   981	                    <div class="text-xs text-gray-600 mt-1">
   982	                        구매P: ${student.purchase_points} | 판매P: ${student.sales_earnings}
   983	                    </div>
   984	                </div>
   985	                <div class="flex items-center space-x-2">
   986	                    <button onclick="resetStudentPoints('${student.id}')" 
   987	                            class="text-blue-600 hover:text-blue-800 text-sm">
   988	                        초기화
   989	                    </button>
   990	                </div>
   991	            `;
   992	            
   993	            studentsList.appendChild(studentElement);
   994	        });
   995	        
   996	        // Load market statistics
   997	        const totalItems = items.data.length;
   998	        const soldItems = items.data.filter(i => i.status === 'sold').length;
   999	        const totalTransactions = transactions.data.length;
  1000	        const totalValue = transactions.data.reduce((sum, t) => sum + t.amount, 0);
  1001	        
  1002	        // Sales earnings ranking (판매수익 랭킹)
  1003	        const salesRanking = students
  1004	            .filter(s => s.sales_earnings > 0)
  1005	            .sort((a, b) => b.sales_earnings - a.sales_earnings)
  1006	            .slice(0, 5);
  1007	        
  1008	        const rankingHTML = salesRanking.length > 0 ? 
  1009	            salesRanking.map((student, index) => {
  1010	                const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
  1011	                const medal = medals[index] || '🏅';
  1012	                return `
  1013	                    <div class="flex items-center justify-between p-2 ${index < 3 ? 'bg-yellow-50' : 'bg-gray-50'} rounded">
  1014	                        <span>${medal} ${index + 1}등: ${student.name}</span>
  1015	                        <span class="font-bold text-yellow-600">${student.sales_earnings}P</span>
  1016	                    </div>
  1017	                `;
  1018	            }).join('') : 
  1019	            '<div class="text-center text-gray-500 py-4">아직 판매한 학생이 없습니다</div>';
  1020	        
  1021	        document.getElementById('market-stats').innerHTML = `
  1022	            <div class="space-y-4">
  1023	                <div class="grid grid-cols-2 gap-4">
  1024	                    <div class="bg-blue-50 p-3 rounded">
  1025	                        <div class="text-2xl font-bold text-blue-600">${totalItems}</div>
  1026	                        <div class="text-sm text-blue-800">등록된 아이템</div>
  1027	                    </div>
  1028	                    <div class="bg-green-50 p-3 rounded">
  1029	                        <div class="text-2xl font-bold text-green-600">${soldItems}</div>
  1030	                        <div class="text-sm text-green-800">판매된 아이템</div>
  1031	                    </div>
  1032	                    <div class="bg-purple-50 p-3 rounded">
  1033	                        <div class="text-2xl font-bold text-purple-600">${totalTransactions}</div>
  1034	                        <div class="text-sm text-purple-800">총 거래 횟수</div>
  1035	                    </div>
  1036	                    <div class="bg-yellow-50 p-3 rounded">
  1037	                        <div class="text-2xl font-bold text-yellow-600">${totalValue.toLocaleString()}</div>
  1038	                        <div class="text-sm text-yellow-800">거래된 포인트</div>
  1039	                    </div>
  1040	                </div>
  1041	                
  1042	                <div class="bg-white p-4 rounded border">
  1043	                    <h5 class="font-bold text-lg mb-3 text-center">🏆 판매왕 랭킹 (시상용)</h5>
  1044	                    <div class="space-y-2">
  1045	                        ${rankingHTML}
  1046	                    </div>
  1047	                    ${salesRanking.length > 0 ? `
  1048	                        <div class="mt-4 text-center">
  1049	                            <button onclick="printRanking()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm">
  1050	                                📋 랭킹 출력하기
  1051	                            </button>
  1052	                        </div>
  1053	                    ` : ''}
  1054	                </div>
  1055	            </div>
  1056	        `;
  1057	        
  1058	    } catch (error) {
  1059	        console.error('Error loading teacher dashboard:', error);
  1060	        showMessage('선생님 대시보드 로딩에 실패했습니다', 'error');
  1061	    }
  1062	}
  1063	
  1064	async function resetStudentPoints(studentId) {
  1065	    if (!confirm('이 학생의 포인트를 10,000으로 초기화하시겠습니까?')) return;
  1066	    
  1067	    try {
  1068	        const users = await fetchTableData('users');
  1069	        const student = users.data.find(u => u.id === studentId);
  1070	        
  1071	        if (student) {
  1072	            student.purchase_points = 10000;
  1073	            await updateRecord('users', studentId, student);
  1074	            loadTeacherDashboard();
  1075	            showMessage('학생 포인트가 성공적으로 초기화되었습니다', 'success');
  1076	        }
  1077	    } catch (error) {
  1078	        console.error('Error resetting points:', error);
  1079	        showMessage('포인트 초기화에 실패했습니다', 'error');
  1080	    }
  1081	}
  1082	
  1083	async function resetAllPoints() {
  1084	    const choice = confirm('모든 학생의 구매 포인트를 10,000으로 초기화하시겠습니까?\n\n• 구매 포인트만 초기화됩니다\n• 판매 수익은 그대로 유지됩니다\n\n이 작업은 되돌릴 수 없습니다.');
  1085	    if (!choice) return;
  1086	    
  1087	    try {
  1088	        const users = await fetchTableData('users');
  1089	        const students = users.data.filter(u => u.role === 'student');
  1090	        
  1091	        for (const student of students) {
  1092	            student.purchase_points = 10000;
  1093	            // 판매수익은 그대로 유지 (sales_earnings 바꾸지 않음)
  1094	            await updateRecord('users', student.id, student);
  1095	        }
  1096	        
  1097	        loadTeacherDashboard();
  1098	        showMessage('모든 학생의 구매 포인트가 성공적으로 초기화되었습니다', 'success');
  1099	    } catch (error) {
  1100	        console.error('Error resetting all points:', error);
  1101	        showMessage('전체 구매 포인트 초기화에 실패했습니다', 'error');
  1102	    }
  1103	}
  1104	
  1105	// Utility Functions
  1106	function showMessage(message, type = 'info') {
  1107	    const messageDiv = document.createElement('div');
  1108	    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm message-${type}`;
  1109	    messageDiv.innerHTML = `
  1110	        <div class="flex items-center">
  1111	            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
  1112	            <span>${message}</span>
  1113	        </div>
  1114	    `;
  1115	    
  1116	    document.body.appendChild(messageDiv);
  1117	    
  1118	    setTimeout(() => {
  1119	        messageDiv.remove();
  1120	    }, 5000);
  1121	}
  1122	
  1123	// API Helper Functions - GitHub Pages 호환 버전
  1124	const API_BASE_URL = 'https://api.gensparksite.com';
  1125	
  1126	async function fetchTableData(tableName) {
  1127	    const response = await fetch(`${API_BASE_URL}/tables/${tableName}`);
  1128	    if (!response.ok) {
  1129	        throw new Error(`Failed to fetch ${tableName}`);
  1130	    }
  1131	    return await response.json();
  1132	}
  1133	
  1134	async function createRecord(tableName, data) {
  1135	    const response = await fetch(`${API_BASE_URL}/tables/${tableName}`, {
  1136	        method: 'POST',
  1137	        headers: {'Content-Type': 'application/json'},
  1138	        body: JSON.stringify(data)
  1139	    });
  1140	    if (!response.ok) {
  1141	        throw new Error(`Failed to create record in ${tableName}`);
  1142	    }
  1143	    return await response.json();
  1144	}
  1145	
  1146	async function updateRecord(tableName, recordId, data) {
  1147	    const response = await fetch(`${API_BASE_URL}/tables/${tableName}/${recordId}`, {
  1148	        method: 'PUT',
  1149	        headers: {'Content-Type': 'application/json'},
  1150	        body: JSON.stringify(data)
  1151	    });
  1152	    if (!response.ok) {
  1153	        throw new Error(`Failed to update record in ${tableName}`);
  1154	    }
  1155	    return await response.json();
  1156	}
  1157	
  1158	// 아이템 수정 기능
  1159	let editingItemId = null;
  1160	
  1161	function openEditModal(itemId) {
  1162	    editingItemId = itemId;
  1163	    
  1164	    // 아이템 정보 가져오기
  1165	    fetchTableData('items').then(items => {
  1166	        const item = items.data.find(i => i.id === itemId);
  1167	        if (!item) return;
  1168	        
  1169	        // 폼에 기존 데이터 채우기
  1170	        document.getElementById('edit-item-name').value = item.name;
  1171	        document.getElementById('edit-item-description').value = item.description;
  1172	        document.getElementById('edit-item-price').value = item.price;
  1173	        document.getElementById('edit-item-category').value = item.category;
  1174	        
  1175	        // 모달 표시
  1176	        document.getElementById('edit-item-modal').classList.remove('hidden');
  1177	        document.getElementById('edit-item-modal').classList.add('flex');
  1178	    });
  1179	}
  1180	
  1181	function closeEditModal() {
  1182	    document.getElementById('edit-item-modal').classList.add('hidden');
  1183	    document.getElementById('edit-item-modal').classList.remove('flex');
  1184	    editingItemId = null;
  1185	}
  1186	
  1187	async function updateItem() {
  1188	    if (!editingItemId || !currentUser) return;
  1189	    
  1190	    const name = document.getElementById('edit-item-name').value.trim();
  1191	    const description = document.getElementById('edit-item-description').value.trim();
  1192	    const price = parseInt(document.getElementById('edit-item-price').value);
  1193	    const category = document.getElementById('edit-item-category').value;
  1194	    
  1195	    if (!name || !price || price <= 0) {
  1196	        showMessage('모든 필수 정보를 입력해주세요', 'error');
  1197	        return;
  1198	    }
  1199	    
  1200	    try {
  1201	        // 기존 아이템 정보 가져오기
  1202	        const items = await fetchTableData('items');
  1203	        const item = items.data.find(i => i.id === editingItemId);
  1204	        
  1205	        if (!item) {
  1206	            showMessage('아이템을 찾을 수 없습니다', 'error');
  1207	            return;
  1208	        }
  1209	        
  1210	        // 아이템 업데이트 (이미지는 그대로 유지)
  1211	        const updatedItem = {
  1212	            ...item,
  1213	            name: name,
  1214	            description: description,
  1215	            price: price,
  1216	            category: category
  1217	        };
  1218	        
  1219	        await updateRecord('items', editingItemId, updatedItem);
  1220	        
  1221	        showMessage('아이템이 성공적으로 수정되었습니다!', 'success');
  1222	        closeEditModal();
  1223	        loadMarketplace();
  1224	        loadMyItems();
  1225	        
  1226	    } catch (error) {
  1227	        console.error('Error updating item:', error);
  1228	        showMessage('아이템 수정에 실패했습니다. 다시 시도해주세요.', 'error');
  1229	    }
  1230	}
  1231	
  1232	// 수정 폼 제출 이벤트
  1233	document.getElementById('edit-item-form').addEventListener('submit', function(e) {
  1234	    e.preventDefault();
  1235	    updateItem();
  1236	});
  1237	
  1238	// 판매왕 랭킹 출력 기능
  1239	function printRanking() {
  1240	    // 새 창에서 랭킹 출력 페이지 열기
  1241	    const printWindow = window.open('', '_blank', 'width=600,height=800');
  1242	    
  1243	    // 현재 날짜
  1244	    const today = new Date().toLocaleDateString('ko-KR');
  1245	    
  1246	    fetchTableData('users').then(users => {
  1247	        const students = users.data.filter(u => u.role === 'student');
  1248	        const salesRanking = students
  1249	            .filter(s => s.sales_earnings > 0)
  1250	            .sort((a, b) => b.sales_earnings - a.sales_earnings);
  1251	        
  1252	        const rankingHTML = salesRanking.map((student, index) => {
  1253	            const medals = ['🥇 1등', '🥈 2등', '🥉 3등', '🏅 4등', '🏅 5등'];
  1254	            const ranking = medals[index] || `🏅 ${index + 1}등`;
  1255	            return `
  1256	                <tr class="${index < 3 ? 'gold-rank' : ''}">
  1257	                    <td style="text-align: center; padding: 10px; font-size: 18px;">${ranking}</td>
  1258	                    <td style="text-align: center; padding: 10px; font-size: 18px; font-weight: bold;">${student.name}</td>
  1259	                    <td style="text-align: center; padding: 10px; font-size: 18px; color: #f59e0b; font-weight: bold;">${student.sales_earnings}P</td>
  1260	                </tr>
  1261	            `;
  1262	        }).join('');
  1263	        
  1264	        printWindow.document.write(`
  1265	            <!DOCTYPE html>
  1266	            <html>
  1267	            <head>
  1268	                <title>잉글리시 마켓 판매왕 랭킹</title>
  1269	                <meta charset="utf-8">
  1270	                <style>
  1271	                    body { 
  1272	                        font-family: 'Arial', sans-serif; 
  1273	                        margin: 40px; 
  1274	                        background: #f9fafb;
  1275	                    }
  1276	                    .container { 
  1277	                        background: white; 
  1278	                        padding: 40px; 
  1279	                        border-radius: 15px; 
  1280	                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  1281	                        max-width: 500px;
  1282	                        margin: 0 auto;
  1283	                    }
  1284	                    h1 { 
  1285	                        text-align: center; 
  1286	                        color: #1f2937; 
  1287	                        margin-bottom: 10px;
  1288	                        font-size: 28px;
  1289	                    }
  1290	                    .subtitle {
  1291	                        text-align: center;
  1292	                        color: #6b7280;
  1293	                        margin-bottom: 30px;
  1294	                        font-size: 16px;
  1295	                    }
  1296	                    table { 
  1297	                        width: 100%; 
  1298	                        border-collapse: collapse; 
  1299	                        margin: 20px 0;
  1300	                    }
  1301	                    th { 
  1302	                        background: linear-gradient(135deg, #fbbf24, #f59e0b); 
  1303	                        color: white; 
  1304	                        padding: 15px; 
  1305	                        font-size: 16px;
  1306	                        font-weight: bold;
  1307	                    }
  1308	                    td { 
  1309	                        border-bottom: 1px solid #e5e7eb; 
  1310	                        padding: 12px;
  1311	                    }
  1312	                    .gold-rank {
  1313	                        background: linear-gradient(135deg, #fef3c7, #fbbf24);
  1314	                    }
  1315	                    .footer {
  1316	                        text-align: center;
  1317	                        margin-top: 30px;
  1318	                        color: #6b7280;
  1319	                        font-size: 14px;
  1320	                    }
  1321	                    .print-btn {
  1322	                        background: #3b82f6;
  1323	                        color: white;
  1324	                        padding: 10px 20px;
  1325	                        border: none;
  1326	                        border-radius: 5px;
  1327	                        cursor: pointer;
  1328	                        font-size: 16px;
  1329	                        margin: 20px auto;
  1330	                        display: block;
  1331	                    }
  1332	                    @media print {
  1333	                        .print-btn { display: none; }
  1334	                        body { margin: 0; background: white; }
  1335	                        .container { box-shadow: none; }
  1336	                    }
  1337	                </style>
  1338	            </head>
  1339	            <body>
  1340	                <div class="container">
  1341	                    <h1>🏆 잉글리시 마켓 판매왕 🏆</h1>
  1342	                    <div class="subtitle">영어수업 마켓플레이스 판매 랭킹 (${today})</div>
  1343	                    
  1344	                    <table>
  1345	                        <thead>
  1346	                            <tr>
  1347	                                <th>순위</th>
  1348	                                <th>이름</th>
  1349	                                <th>판매 수익</th>
  1350	                            </tr>
  1351	                        </thead>
  1352	                        <tbody>
  1353	                            ${rankingHTML}
  1354	                        </tbody>
  1355	                    </table>
  1356	                    
  1357	                    <div class="footer">
  1358	                        🌟 축하합니다! 여러분의 창의적인 아이템과 영어 실력이 빛났어요! 🌟
  1359	                    </div>
  1360	                    
  1361	                    <button class="print-btn" onclick="window.print()">📄 인쇄하기</button>
  1362	                </div>
  1363	            </body>
  1364	            </html>
  1365	        `);
  1366	        
  1367	        printWindow.document.close();
  1368	        printWindow.focus();
  1369	    });
  1370	}
