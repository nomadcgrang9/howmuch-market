1	// 잉글리시 마켓 - 메인 JavaScript 파일 (최종 수정본)
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
    15	    '#000000': '검정', '#FF0000': '빨간색', '#00FF00': '초록색', '#0000FF': '파란색',
    16	    '#FFFF00': '노란색', '#FF00FF': '자주색', '#00FFFF': '청록색', '#FFA500': '주황색',
    17	    '#800080': '보라색', '#FFC0CB': '분홍색', '#A52A2A': '갈색', '#808080': '회색',
    18	    '#90EE90': '연초록', '#FFB6C1': '연분홍', '#87CEEB': '하늘색', '#FFFFFF': '하얀'
    19	};
    20	let categoryNames = {
    21	    'toys': '장난감', 'food': '음식', 'clothes': '의류',
    22	    'electronics': '전자제품', 'books': '책', 'other': '기타'
    23	};
    24	let selectedItemForPurchase = null;
    25	
    26	// Supabase가 준비되었다는 신호를 받으면 앱 초기화를 시작합니다.
    27	document.addEventListener('supabaseIsReady', function() {
    28	    console.log('🤝 Supabase 준비 완료! 마켓 앱을 시작합니다...');
    29	    initializeApp();
    30	});
    31	
    32	// 애플리케이션의 모든 기능을 시작하는 메인 함수
    33	async function initializeApp() {
    34	    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
    35	
    36	    try {
    37	        initializeDrawing();
    38	        initializeColorPalette();
    39	        await loadMarketplace();
    40	
    41	        const userInfo = document.getElementById('user-info');
    42	        if (userInfo) userInfo.style.display = 'none';
    43	
    44	        const savedUser = localStorage.getItem('currentUser');
    45	        if (savedUser) {
    46	            try {
    47	                currentUser = JSON.parse(savedUser);
    48	                showMainApp();
    49	                updateUserInfo();
    50	            } catch (e) {
    51	                 localStorage.removeItem('currentUser');
    52	            }
    53	        }
    54	    } catch (error) {
    55	        console.error('❌ 앱 초기화 중 심각한 오류 발생:', error);
    56	    }
    57	}
    58	
    59	// User Authentication Functions
    60	async function login() {
    61	    const studentNumber = document.getElementById('student-number').value.trim();
    62	    const studentName = document.getElementById('student-name').value.trim();
    63	    if (!/^\d{4}$/.test(studentNumber)) return showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
    64	    if (!studentName) return showMessage('이름을 입력해주세요', 'error');
    65	
    66	    try {
    67	        let { data: users, error: fetchError } = await window.supabaseClient.from('users').select('*').eq('student_number', studentNumber);
    68	        if(fetchError) throw fetchError;
    69	
    70	        let user = users[0];
    71	
    72	        if (user) {
    73	            if (user.name !== studentName) {
    74	                 user = await window.updateRecord('users', user.id, { name: studentName });
    75	            }
    76	        } else {
    77	            user = await window.createRecord('users', {
    78	                name: studentName,
    79	                student_number: studentNumber,
    80	                purchase_points: 10000,
    81	                sales_earnings: 0,
    82	                role: 'student',
    83	                is_teacher: false,
    84	                is_active: true
    85	            });
    86	        }
    87	        
    88	        currentUser = user;
    89	        localStorage.setItem('currentUser', JSON.stringify(user));
    90	        showMainApp();
    91	        updateUserInfo();
    92	        showMessage('🎉 마켓에 오신 것을 환영합니다!', 'success');
    93	
    94	    } catch (error) {
    95	        console.error('❌ Login error:', error);
    96	        showMessage('로그인 중 오류가 발생했습니다.', 'error');
    97	    }
    98	}
    99	
   100	async function teacherLogin() {
   101	    const password = prompt('선생님 비밀번호를 입력하세요:');
   102	    if (password === 'teacher123') {
   103	        try {
   104	            let { data: teachers, error: fetchError } = await window.supabaseClient.from('users').select('*').eq('student_number', '0000');
   105	            if(fetchError) throw fetchError;
   106	            
   107	            let teacher = teachers[0];
   108	
   109	            if (!teacher) {
   110	                 teacher = await window.createRecord('users', {
   111	                    name: 'Teacher', student_number: '0000', purchase_points: 999999,
   112	                    sales_earnings: 999999, role: 'teacher', is_teacher: true, is_active: true
   113	                });
   114	            }
   115	            
   116	            currentUser = teacher;
   117	            isTeacher = true;
   118	            localStorage.setItem('currentUser', JSON.stringify(teacher));
   119	            showMainApp();
   120	            updateUserInfo();
   121	            showTeacherModal();
   122	        } catch (error) {
   123	            console.error('Teacher login error:', error);
   124	            showMessage('선생님 로그인에 실패했습니다', 'error');
   125	        }
   126	    } else {
   127	        showMessage('잘못된 비밀번호입니다', 'error');
   128	    }
   129	}
   130	
   131	function logout() {
   132	    currentUser = null;
   133	    isTeacher = false;
   134	    localStorage.removeItem('currentUser');
   135	    document.getElementById('login-section').style.display = 'block';
   136	    document.getElementById('main-app').style.display = 'none';
   137	    document.getElementById('admin-dashboard').classList.add('hidden');
   138	    document.getElementById('user-info').style.display = 'none';
   139	    document.getElementById('student-number').value = '';
   140	    document.getElementById('student-name').value = '';
   141	}
   142	
   143	// 현재 사용자 정보를 가져오는 헬퍼 함수
   144	function getCurrentUser() {
   145	    return currentUser;
   146	}
   147	
   148	// UI Control Functions
   149	function showMainApp() {
   150	    document.getElementById('login-section').style.display = 'none';
   151	    document.getElementById('main-app').style.display = 'block';
   152	    
   153	    // 메인 앱이 표시될 때 그림판 기능을 다시 초기화합니다.
   154	    initializeDrawing();
   155	    initializeColorPalette();
   156	    
   157	    loadMarketplace();
   158	    loadMyItems();
   159	    loadTransactionHistory();
   160	}
   161	
   162	function updateUserInfo() {
   163	    if (!currentUser) return;
   164	    const purchasePoints = currentUser.purchase_points || 10000;
   165	    const salesEarnings = currentUser.sales_earnings || 0;
   166	    const userLevel = getUserLevel(salesEarnings);
   167	    const levelText = getLevelText(userLevel);
   168	    document.getElementById('user-name').innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
   169	    document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
   170	    document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
   171	    document.getElementById('user-info').style.display = 'flex';
   172	    if (typeof updateClassInfo === 'function') updateClassInfo();
   173	}
   174	
   175	function showTab(tabName, event = null) {
   176	    try {
   177	        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
   178	        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
   179	        
   180	        const targetTab = document.getElementById(`tab-${tabName}`);
   181	        if(targetTab) targetTab.style.display = 'block';
   182	        
   183	        if(event && event.currentTarget) {
   184	            event.currentTarget.classList.add('active');
   185	        }
   186	        
   187	        // Refresh content based on tab
   188	        switch(tabName) {
   189	            case 'marketplace':
   190	                loadMarketplace();
   191	                break;
   192	            case 'inventory':
   193	                loadMyItems();
   194	                break;
   195	            case 'history':
   196	                loadTransactionHistory();
   197	                break;
   198	        }
   199	    } catch (error) {
   200	        console.error('탭 전환 오류:', error);
   201	    }
   202	}
   203	
   204	// Drawing Functions
   205	function initializeDrawing() {
   206	    const oldCanvas = document.getElementById('drawing-canvas');
   207	    if (!oldCanvas) return;
   208	
   209	    // 기존 이벤트 리스너를 모두 제거하기 위해 캔버스를 복제하고 교체합니다.
   210	    const newCanvas = oldCanvas.cloneNode(true);
   211	    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
   212	    canvas = newCanvas; // 이제부터 이 새로운 캔버스를 사용합니다.
   213	    
   214	    ctx = canvas.getContext('2d');
   215	    ctx.lineWidth = brushSize;
   216	    ctx.lineCap = 'round';
   217	    ctx.lineJoin = 'round';
   218	
   219	    // 새로운 캔버스에 이벤트 리스너를 딱 한 번만 추가합니다.
   220	    canvas.addEventListener('mousedown', startDrawing);
   221	    canvas.addEventListener('mousemove', draw);
   222	    canvas.addEventListener('mouseup', stopDrawing);
   223	    canvas.addEventListener('mouseout', stopDrawing);
   224	    canvas.addEventListener('touchstart', handleTouch, { passive: false });
   225	    canvas.addEventListener('touchmove', handleTouch, { passive: false });
   226	    canvas.addEventListener('touchend', stopDrawing);
   227	}
   228	
   229	function startDrawing(e) { isDrawing = true; draw(e); }
   230	function stopDrawing() { if (isDrawing) { ctx.beginPath(); isDrawing = false; } }
   231	
   232	function draw(e) {
   233	    if (!isDrawing || !ctx) return;
   234	    const rect = canvas.getBoundingClientRect();
   235	    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
   236	    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
   237	    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
   238	    ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
   239	    ctx.strokeStyle = currentColor;
   240	    ctx.lineTo(x, y);
   241	    ctx.stroke();
   242	    ctx.beginPath();
   243	    ctx.moveTo(x, y);
   244	}
   245	
   246	function handleTouch(e) {
   247	    e.preventDefault();
   248	    const touch = e.touches[0];
   249	    const mouseEvent = new MouseEvent(e.type.replace('touch', 'mouse'), {
   250	        clientX: touch.clientX, clientY: touch.clientY
   251	    });
   252	    canvas.dispatchEvent(mouseEvent);
   253	}
   254	
   255	function clearCanvas() {
   256	    if (ctx && canvas) {
   257	        ctx.clearRect(0, 0, canvas.width, canvas.height);
   258	        ctx.fillStyle = '#FFFFFF';
   259	        ctx.fillRect(0, 0, canvas.width, canvas.height);
   260	    }
   261	}
   262	
   263	function initializeColorPalette() {
   264	    // 그림판 도구들(색상, 브러시, 버튼)이 담긴 부모 요소를 찾습니다.
   265	    const toolsContainer = document.querySelector('.mt-4.space-y-3');
   266	    if (!toolsContainer) return;
   267	
   268	    // 부모 요소를 통째로 복제해서 모든 하위 요소의 이벤트 리스너를 한번에 제거합니다.
   269	    const newToolsContainer = toolsContainer.cloneNode(true);
   270	    toolsContainer.parentNode.replaceChild(newToolsContainer, toolsContainer);
   271	
   272	    // 이제 새로운, 깨끗한 도구들에 이벤트 리스너를 추가합니다.
   273	    newToolsContainer.querySelectorAll('.color-option').forEach(option => {
   274	        option.addEventListener('click', () => selectColor(option.dataset.color));
   275	    });
   276	    
   277	    const brushSlider = newToolsContainer.querySelector('#brush-size');
   278	    if(brushSlider) {
   279	        brushSlider.addEventListener('input', function() {
   280	            brushSize = parseInt(this.value);
   281	            document.getElementById('brush-size-display').textContent = brushSize;
   282	        });
   283	    }
   284	
   285	    const eraserBtn = newToolsContainer.querySelector('#eraser-btn');
   286	    if(eraserBtn) eraserBtn.addEventListener('click', toggleEraser);
   287	    
   288	    const clearBtn = newToolsContainer.querySelector('button[onclick="clearCanvas()"]');
   289	    if(clearBtn) clearBtn.addEventListener('click', clearCanvas);
   290	
   291	    selectColor('#000000'); // 기본 색상 선택
   292	}
   293	
   294	function selectColor(color) {
   295	    currentColor = color;
   296	    isEraser = false;
   297	    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('ring-4', 'ring-blue-500'));
   298	    const selectedOption = document.querySelector(`[data-color="${color}"]`);
   299	    if (selectedOption) selectedOption.classList.add('ring-4', 'ring-blue-500');
   300	    document.getElementById('current-color').style.backgroundColor = color;
   301	    document.getElementById('current-color-name').textContent = colorNames[color] || '사용자 지정';
   302	    const eraserBtn = document.getElementById('eraser-btn');
   303	    if (eraserBtn) {
   304	        eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
   305	        eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
   306	        eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
   307	    }
   308	}
   309	
   310	function toggleEraser() {
   311	    isEraser = !isEraser;
   312	    const eraserBtn = document.getElementById('eraser-btn');
   313	    if (isEraser) {
   314	        eraserBtn.classList.replace('bg-yellow-500', 'bg-blue-500');
   315	        eraserBtn.classList.replace('hover:bg-yellow-600', 'hover:bg-blue-600');
   316	        eraserBtn.innerHTML = '<i class="fas fa-paint-brush mr-1"></i>그리기';
   317	        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('ring-4', 'ring-blue-500'));
   318	        document.getElementById('current-color-name').textContent = '지우개 모드';
   319	    } else {
   320	        selectColor(currentColor);
   321	    }
   322	}
   323	
   324	// Marketplace Functions
   325	async function loadMarketplace() {
   326	    try {
   327	        const itemsGrid = document.getElementById('items-grid');
   328	        if (!itemsGrid) return;
   329	        
   330	        itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아이템을 불러오는 중...</div>';
   331	        
   332	        const { data: items } = await window.fetchTableData('items');
   333	        const { data: users } = await window.fetchTableData('users');
   334	        
   335	        let availableItems = items.filter(item => {
   336	            // 판매 가능한 상태인지 확인
   337	            if (item.sold !== false && item.status !== 'available') return false;
   338	            
   339	            // 현재 사용자가 있다면 자신의 아이템은 제외 (creator 또는 seller_id로 확인)
   340	            if (currentUser) {
   341	                const isMyItem = (item.creator && item.creator === currentUser.student_number) || 
   342	                               (item.seller_id && item.seller_id === currentUser.id);
   343	                if (isMyItem) return false;
   344	            }
   345	            
   346	            return true;
   347	        });
   348	        
   349	        // 같은 반 아이템들만 필터링 (선생님은 모든 아이템 볼 수 있음)
   350	        if (typeof filterSameClassItems === 'function') {
   351	            availableItems = filterSameClassItems(availableItems, users);
   352	        }
   353	        
   354	        itemsGrid.innerHTML = '';
   355	        if (availableItems.length === 0) {
   356	            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요.</div>';
   357	            return;
   358	        }
   359	        
   360	        availableItems.forEach(item => {
   361	            const seller = users.find(u => u.student_number === item.creator);
   362	            itemsGrid.appendChild(createItemCard(item, seller));
   363	        });
   364	    } catch (error) {
   365	        console.error('❌ Error loading marketplace:', error);
   366	        const itemsGrid = document.getElementById('items-grid');
   367	        if (itemsGrid) {
   368	            itemsGrid.innerHTML = '<div class="col-span-full text-center text-red-500 py-8">아이템 로딩에 실패했습니다.</div>';
   369	        }
   370	    }
   371	}
   372	
   373	function createItemCard(item, seller) {
   374	    const card = document.createElement('div');
   375	    const rarity = getItemRarity(item.price);
   376	    card.className = `item-card slide-in ${rarity}`;
   377	    const canAfford = currentUser && currentUser.purchase_points >= item.price;
   378	    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
   379	    const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '포인트 부족';
   380	    
   381	    card.innerHTML = `
   382	        <div class="relative">
   383	            <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
   384	            ${item.drawing_data ? `
   385	                <canvas width="200" height="150" class="item-image border rounded" 
   386	                        style="background: white;"
   387	                        onload="drawItemPreview(this, '${item.drawing_data}')"></canvas>
   388	            ` : `
   389	                <img src="${item.image_url}" alt="${item.name}" class="item-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngDwvdGV4dD48L3N2Zz4=';">
   390	            `}
   391	            ${item.sold ? '<div class="sold-overlay">SOLD</div>' : ''}
   392	        </div>
   393	        <div class="item-info">
   394	            <div class="flex justify-between items-start mb-2">
   395	                <h4 class="font-semibold text-gray-900 truncate">${escapeHtml(item.name)}</h4>
   396	                <span class="category-badge category-${item.category}">${categoryNames[item.category] || item.category}</span>
   397	            </div>
   398	            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '')}</p>
   399	            <div class="flex justify-between items-center mb-3">
   400	                <span class="price-tag"><i class="fas fa-coins mr-1"></i>${item.price} 코인</span>
   401	                <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : '알 수 없음'}</span>
   402	            </div>
   403	            ${currentUser && !item.sold ? `
   404	                <button onclick="openPurchaseModal('${item.id}')" class="${buyButtonClass}" ${!canAfford ? 'disabled' : ''}>
   405	                    <i class="fas fa-shopping-cart mr-1"></i>${buyButtonText}
   406	                </button>
   407	            ` : ''}
   408	        </div>
   409	    `;
   410	    
   411	    // 캔버스 이미지 로딩
   412	    setTimeout(() => {
   413	        const canvas = card.querySelector('canvas[onload]');
   414	        if (canvas) {
   415	            drawItemPreview(canvas, item.drawing_data);
   416	        }
   417	    }, 100);
   418	    
   419	    return card;
   420	}
   421	
   422	// My Items Functions
   423	async function loadMyItems() {
   424	    console.log('🔄 내 아이템 로딩 시작...');
   425	    
   426	    try {
   427	        const currentUser = getCurrentUser();
   428	        if (!currentUser) {
   429	            console.log('❌ 사용자 정보 없음');
   430	            return;
   431	        }
   432	
   433	        console.log('👤 현재 사용자:', currentUser.student_number);
   434	        
   435	        // 내가 판매 중인 아이템 컨테이너 확인
   436	        const mySellingContainer = document.getElementById('my-selling-items');
   437	        const myBoughtContainer = document.getElementById('my-bought-items');
   438	        
   439	        console.log('📦 판매 컨테이너 존재:', !!mySellingContainer);
   440	        console.log('🛒 구매 컨테이너 존재:', !!myBoughtContainer);
   441	        
   442	        if (!mySellingContainer || !myBoughtContainer) {
   443	            console.error('❌ My Items 컨테이너를 찾을 수 없습니다');
   444	            return;
   445	        }
   446	
   447	        // 내가 생성한 아이템들 로드 (기존 스키마에 맞춤)
   448	        console.log('🔍 내 판매 아이템 검색 중...');
   449	        
   450	        // 먼저 creator 필드가 있는지 확인하고, 없으면 seller_id 사용
   451	        let myItemsQuery;
   452	        try {
   453	            // creator 필드로 시도
   454	            const { data: testData, error: testError } = await window.supabaseClient
   455	                .from('items')
   456	                .select('creator')
   457	                .limit(1);
   458	            
   459	            if (testError && testError.code === '42703') {
   460	                // creator 필드가 없으면 seller_id 사용
   461	                console.log('🔄 creator 필드가 없어서 seller_id로 검색...');
   462	                myItemsQuery = window.supabaseClient
   463	                    .from('items')
   464	                    .select('*')
   465	                    .eq('seller_id', currentUser.id)
   466	                    .neq('status', 'sold');
   467	            } else {
   468	                // creator 필드가 있으면 사용
   469	                myItemsQuery = window.supabaseClient
   470	                    .from('items')
   471	                    .select('*')
   472	                    .eq('creator', currentUser.student_number)
   473	                    .eq('sold', false);
   474	            }
   475	        } catch (error) {
   476	            console.error('필드 확인 오류:', error);
   477	            // 기본적으로 seller_id 사용
   478	            myItemsQuery = window.supabaseClient
   479	                .from('items')
   480	                .select('*')
   481	                .eq('seller_id', currentUser.id)
   482	                .neq('status', 'sold');
   483	        }
   484	        
   485	        const { data: myItems, error: itemsError } = await myItemsQuery.order('created_at', { ascending: false });
   486	
   487	        if (itemsError) {
   488	            console.error('❌ 내 아이템 로드 오류:', itemsError);
   489	            throw itemsError;
   490	        }
   491	
   492	        console.log('📊 내가 만든 아이템 개수:', myItems?.length || 0);
   493	        console.log('📋 아이템 상세:', myItems);
   494	
   495	        // 판매 중인 아이템 표시
   496	        if (myItems && myItems.length > 0) {
   497	            mySellingContainer.innerHTML = myItems.map(item => createMyItemCard(item)).join('');
   498	            console.log('✅ 판매 아이템 표시 완료');
   499	            
   500	            // 캔버스 이미지 로딩
   501	            setTimeout(() => loadCanvasImages(mySellingContainer), 100);
   502	        } else {
   503	            mySellingContainer.innerHTML = `
   504	                <div class="col-span-full text-center py-8 text-gray-500">
   505	                    <i class="fas fa-box-open text-4xl mb-4"></i>
   506	                    <p>아직 판매 중인 아이템이 없습니다.</p>
   507	                    <p class="text-sm mt-2">새 아이템을 만들어보세요!</p>
   508	                </div>
   509	            `;
   510	            console.log('📝 판매 아이템 없음 메시지 표시');
   511	        }
   512	
   513	        // 구매한 아이템들 로드
   514	        console.log('🔍 내 구매 아이템 검색 중...');
   515	        
   516	        // 거래 테이블이 있는지 확인하고 구매한 아이템 로드
   517	        let myPurchases = [];
   518	        try {
   519	            const { data: transactions, error: purchasesError } = await window.supabaseClient
   520	                .from('transactions')
   521	                .select('*')
   522	                .eq('buyer_id', currentUser.id)
   523	                .order('created_at', { ascending: false });
   524	            
   525	            if (purchasesError) {
   526	                console.log('거래 테이블 없음, 빈 배열로 설정');
   527	                myPurchases = [];
   528	            } else {
   529	                // 거래된 아이템 정보를 별도로 가져오기
   530	                if (transactions && transactions.length > 0) {
   531	                    const itemIds = transactions.map(t => t.item_id);
   532	                    const { data: purchasedItems } = await window.supabaseClient
   533	                        .from('items')
   534	                        .select('*')
   535	                        .in('id', itemIds);
   536	                    
   537	                    // 거래와 아이템 정보 결합
   538	                    myPurchases = transactions.map(transaction => ({
   539	                        ...transaction,
   540	                        item: purchasedItems.find(item => item.id === transaction.item_id)
   541	                    })).filter(t => t.item); // 아이템 정보가 있는 것만 포함
   542	                }
   543	            }
   544	        } catch (error) {
   545	            console.log('구매 내역 로드 실패:', error);
   546	            myPurchases = [];
   547	        }
   548	
   549	        if (purchasesError) {
   550	            console.error('❌ 구매 내역 로드 오류:', purchasesError);
   551	            throw purchasesError;
   552	        }
   553	
   554	        console.log('🛒 구매한 아이템 개수:', myPurchases?.length || 0);
   555	
   556	        // 구매한 아이템 표시
   557	        if (myPurchases && myPurchases.length > 0) {
   558	            myBoughtContainer.innerHTML = myPurchases.map(transaction => 
   559	                createPurchasedItemCard(transaction.item, transaction)
   560	            ).join('');
   561	            console.log('✅ 구매 아이템 표시 완료');
   562	            
   563	            // 캔버스 이미지 로딩
   564	            setTimeout(() => loadCanvasImages(myBoughtContainer), 100);
   565	        } else {
   566	            myBoughtContainer.innerHTML = `
   567	                <div class="col-span-full text-center py-8 text-gray-500">
   568	                    <i class="fas fa-shopping-cart text-4xl mb-4"></i>
   569	                    <p>아직 구매한 아이템이 없습니다.</p>
   570	                    <p class="text-sm mt-2">마켓에서 멋진 아이템을 찾아보세요!</p>
   571	                </div>
   572	            `;
   573	            console.log('📝 구매 아이템 없음 메시지 표시');
   574	        }
   575	
   576	    } catch (error) {
   577	        console.error('❌ loadMyItems 오류:', error);
   578	        showMessage('내 아이템을 불러오는 중 오류가 발생했습니다.', 'error');
   579	    }
   580	}
   581	
   582	// 내 판매 아이템 카드 생성
   583	function createMyItemCard(item) {
   584	    return `
   585	        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border-2 border-blue-200 hover:shadow-md transition-all duration-200">
   586	            <div class="flex justify-between items-start mb-3">
   587	                <h4 class="text-lg font-bold text-gray-800 truncate">${escapeHtml(item.name)}</h4>
   588	                <div class="flex space-x-1">
   589	                    <button onclick="editMyItem('${item.id}')" 
   590	                            class="text-blue-600 hover:text-blue-800 text-sm" 
   591	                            title="수정">
   592	                        <i class="fas fa-edit"></i>
   593	                    </button>
   594	                    <button onclick="deleteMyItem('${item.id}')" 
   595	                            class="text-red-600 hover:text-red-800 text-sm" 
   596	                            title="삭제">
   597	                        <i class="fas fa-trash"></i>
   598	                    </button>
   599	                </div>
   600	            </div>
   601	            
   602	            ${item.drawing_data ? `
   603	                <div class="mb-3 flex justify-center">
   604	                    <canvas width="200" height="150" class="border rounded" 
   605	                            style="background: white;"
   606	                            onload="drawItemPreview(this, '${item.drawing_data}')"></canvas>
   607	                </div>
   608	            ` : ''}
   609	            
   610	            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '설명 없음')}</p>
   611	            
   612	            <div class="flex justify-between items-center">
   613	                <div class="text-right">
   614	                    <div class="text-lg font-bold text-green-600">${item.price}코인</div>
   615	                    <div class="text-xs text-gray-500">${formatDate(item.created_at)}</div>
   616	                </div>
   617	                <div class="flex flex-col items-end">
   618	                    <div class="text-xs text-gray-500 mb-1">조회수: ${item.views || 0}</div>
   619	                    <div class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">판매중</div>
   620	                </div>
   621	            </div>
   622	        </div>
   623	    `;
   624	}
   625	
   626	// 구매한 아이템 카드 생성
   627	function createPurchasedItemCard(item, transaction) {
   628	    return `
   629	        <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border-2 border-green-200">
   630	            <div class="flex justify-between items-start mb-3">
   631	                <h4 class="text-lg font-bold text-gray-800 truncate">${escapeHtml(item.name)}</h4>
   632	                <div class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">구매완료</div>
   633	            </div>
   634	            
   635	            ${item.drawing_data ? `
   636	                <div class="mb-3 flex justify-center">
   637	                    <canvas width="200" height="150" class="border rounded" 
   638	                            style="background: white;"
   639	                            onload="drawItemPreview(this, '${item.drawing_data}')"></canvas>
   640	                </div>
   641	            ` : ''}
   642	            
   643	            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '설명 없음')}</p>
   644	            
   645	            <div class="flex justify-between items-center text-sm">
   646	                <div>
   647	                    <div class="text-gray-600">판매자: ${item.creator}</div>
   648	                    <div class="text-gray-500">구매일: ${formatDate(transaction.created_at)}</div>
   649	                </div>
   650	                <div class="text-right">
   651	                    <div class="text-lg font-bold text-green-600">${transaction.final_price || item.price}코인</div>
   652	                    ${transaction.final_price !== item.price ? 
   653	                        `<div class="text-xs text-gray-500 line-through">${item.price}코인</div>` : ''
   654	                    }
   655	                </div>
   656	            </div>
   657	        </div>
   658	    `;
   659	}
   660	
   661	// 내 아이템 수정 함수
   662	async function editMyItem(itemId) {
   663	    try {
   664	        // 아이템 정보 가져오기
   665	        const { data: item, error } = await window.supabaseClient
   666	            .from('items')
   667	            .select('*')
   668	            .eq('id', itemId)
   669	            .single();
   670	
   671	        if (error) throw error;
   672	
   673	        // 현재 사용자가 소유자인지 확인 (creator 또는 seller_id로)
   674	        const currentUser = getCurrentUser();
   675	        const isOwner = (item.creator && item.creator === currentUser.student_number) || 
   676	                       (item.seller_id && item.seller_id === currentUser.id);
   677	        
   678	        if (!currentUser || !isOwner) {
   679	            showMessage('본인의 아이템만 수정할 수 있습니다.', 'error');
   680	            return;
   681	        }
   682	
   683	        // 아이템 수정 모달 표시
   684	        showItemEditModal(item);
   685	        
   686	    } catch (error) {
   687	        console.error('아이템 수정 오류:', error);
   688	        showMessage('아이템을 불러오는 중 오류가 발생했습니다.', 'error');
   689	    }
   690	}
   691	
   692	// 내 아이템 삭제 함수
   693	async function deleteMyItem(itemId) {
   694	    try {
   695	        // 삭제 확인
   696	        if (!confirm('정말 이 아이템을 삭제하시겠습니까?\n삭제된 아이템은 복구할 수 없습니다.')) {
   697	            return;
   698	        }
   699	
   700	        // 현재 사용자 확인
   701	        const currentUser = getCurrentUser();
   702	        if (!currentUser) {
   703	            showMessage('로그인이 필요합니다.', 'error');
   704	            return;
   705	        }
   706	
   707	        // 아이템 정보 확인
   708	        const { data: item, error: fetchError } = await window.supabaseClient
   709	            .from('items')
   710	            .select('*')
   711	            .eq('id', itemId)
   712	            .single();
   713	
   714	        if (fetchError) throw fetchError;
   715	
   716	        // 소유권 확인 (creator 또는 seller_id로)
   717	        const isOwner = (item.creator && item.creator === currentUser.student_number) || 
   718	                       (item.seller_id && item.seller_id === currentUser.id);
   719	        
   720	        if (!isOwner) {
   721	            showMessage('본인의 아이템만 삭제할 수 있습니다.', 'error');
   722	            return;
   723	        }
   724	
   725	        // 아이템 삭제
   726	        const { error: deleteError } = await window.supabaseClient
   727	            .from('items')
   728	            .delete()
   729	            .eq('id', itemId);
   730	
   731	        if (deleteError) throw deleteError;
   732	
   733	        showMessage('아이템이 성공적으로 삭제되었습니다.', 'success');
   734	        
   735	        // 내 아이템 목록 새로고침
   736	        loadMyItems();
   737	        
   738	    } catch (error) {
   739	        console.error('아이템 삭제 오류:', error);
   740	        showMessage('아이템 삭제 중 오류가 발생했습니다.', 'error');
   741	    }
   742	}
   743	
   744	// 아이템 편집 모달 표시
   745	function showItemEditModal(item) {
   746	    // 간단한 프롬프트로 구현 (추후 모달로 개선 가능)
   747	    const newName = prompt('아이템 이름을 수정하세요:', item.name);
   748	    if (newName === null) return; // 취소
   749	
   750	    const newDescription = prompt('아이템 설명을 수정하세요:', item.description || '');
   751	    if (newDescription === null) return; // 취소
   752	
   753	    const newPrice = prompt('아이템 가격을 수정하세요:', item.price);
   754	    if (newPrice === null) return; // 취소
   755	
   756	    const price = parseInt(newPrice);
   757	    if (isNaN(price) || price < 1) {
   758	        showMessage('올바른 가격을 입력해주세요. (1코인 이상)', 'error');
   759	        return;
   760	    }
   761	
   762	    updateMyItem(item.id, {
   763	        name: newName.trim(),
   764	        description: newDescription.trim(),
   765	        price: price
   766	    });
   767	}
   768	
   769	// 내 아이템 업데이트
   770	async function updateMyItem(itemId, updates) {
   771	    try {
   772	        const { error } = await window.supabaseClient
   773	            .from('items')
   774	            .update({
   775	                ...updates,
   776	                updated_at: new Date().toISOString()
   777	            })
   778	            .eq('id', itemId);
   779	
   780	        if (error) throw error;
   781	
   782	        showMessage('아이템이 성공적으로 수정되었습니다.', 'success');
   783	        loadMyItems(); // 목록 새로고침
   784	        
   785	    } catch (error) {
   786	        console.error('아이템 수정 오류:', error);
   787	        showMessage('아이템 수정 중 오류가 발생했습니다.', 'error');
   788	    }
   789	}
   790	
   791	// 아이템 미리보기 캔버스 그리기
   792	function drawItemPreview(canvas, drawingData) {
   793	    try {
   794	        if (!drawingData) return;
   795	        
   796	        const ctx = canvas.getContext('2d');
   797	        const img = new Image();
   798	        
   799	        img.onload = function() {
   800	            ctx.clearRect(0, 0, canvas.width, canvas.height);
   801	            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
   802	        };
   803	        
   804	        img.src = drawingData;
   805	    } catch (error) {
   806	        console.error('미리보기 그리기 오류:', error);
   807	    }
   808	}
   809	
   810	// 컨테이너 내 모든 캔버스 이미지 로드
   811	function loadCanvasImages(container) {
   812	    const canvases = container.querySelectorAll('canvas[onload]');
   813	    canvases.forEach(canvas => {
   814	        const onloadAttr = canvas.getAttribute('onload');
   815	        if (onloadAttr) {
   816	            // onload 속성에서 drawingData 추출
   817	            const match = onloadAttr.match(/drawItemPreview\(this,\s*'([^']+)'\)/);
   818	            if (match && match[1]) {
   819	                drawItemPreview(canvas, match[1]);
   820	            }
   821	        }
   822	    });
   823	}
   824	
   825	// Purchase System Functions
   826	function openPurchaseModal(itemId) {
   827	    console.log('🛒 구매 모달 열기:', itemId);
   828	    
   829	    // 간단한 구매 확인 시스템 (모달 대신 confirm 사용)
   830	    const confirmed = confirm('이 아이템을 구매하시겠습니까?');
   831	    if (confirmed) {
   832	        confirmPurchase(itemId);
   833	    }
   834	}
   835	
   836	function closePurchaseModal() {
   837	    const modal = document.getElementById('purchase-modal');
   838	    if (modal) {
   839	        modal.classList.add('hidden');
   840	        modal.classList.remove('flex');
   841	    }
   842	    selectedItemForPurchase = null;
   843	}
   844	
   845	async function confirmPurchase(itemId) {
   846	    if (!currentUser) {
   847	        showMessage('로그인이 필요합니다.', 'error');
   848	        return;
   849	    }
   850	    
   851	    try {
   852	        // 아이템 정보 가져오기
   853	        const { data: item, error: itemError } = await window.supabaseClient
   854	            .from('items')
   855	            .select('*')
   856	            .eq('id', itemId)
   857	            .single();
   858	
   859	        if (itemError) throw itemError;
   860	        
   861	        // 구매 포인트 확인
   862	        if (currentUser.purchase_points < item.price) {
   863	            showMessage('구매 포인트가 부족합니다', 'error');
   864	            return;
   865	        }
   866	        
   867	        // 구매 처리 (간단 버전 - 실제로는 구매 요청 시스템 사용)
   868	        showMessage('구매 요청이 전송되었습니다!', 'success');
   869	        
   870	    } catch (error) {
   871	        console.error('구매 오류:', error);
   872	        showMessage('구매 처리 중 오류가 발생했습니다.', 'error');
   873	    }
   874	}
   875	
   876	// Transaction History Functions
   877	async function loadTransactionHistory() {
   878	    console.log("거래 내역 로딩 중...");
   879	    // 추후 구현 예정
   880	}
   881	
   882	// Item selling form handler
   883	document.addEventListener('DOMContentLoaded', function() {
   884	    const sellForm = document.getElementById('sell-form');
   885	    if (sellForm) {
   886	        sellForm.addEventListener('submit', async function(e) {
   887	            e.preventDefault();
   888	            if (!currentUser) return showMessage('로그인이 필요합니다.', 'error');
   889	
   890	            const itemName = document.getElementById('item-name').value;
   891	            const itemDescription = document.getElementById('item-description').value;
   892	            const itemPrice = parseInt(document.getElementById('item-price').value);
   893	            const itemCategory = document.getElementById('item-category').value;
   894	            const drawingData = canvas.toDataURL('image/png');
   895	
   896	            if (!itemName || !itemPrice || !itemCategory) {
   897	                return showMessage('이름, 가격, 카테고리는 필수 항목입니다.', 'warning');
   898	            }
   899	
   900	            try {
   901	                await window.createRecord('items', {
   902	                    name: itemName,
   903	                    description: itemDescription,
   904	                    price: itemPrice,
   905	                    category: itemCategory,
   906	                    drawing_data: drawingData,
   907	                    creator: currentUser.student_number,
   908	                    sold: false,
   909	                    views: 0,
   910	                    status: 'available'
   911	                });
   912	                showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
   913	                this.reset();
   914	                clearCanvas();
   915	                showTab('marketplace');
   916	                loadMarketplace(); // 마켓플레이스 새로고침
   917	            } catch (error) {
   918	                console.error('아이템 등록 오류:', error);
   919	                showMessage('아이템 등록에 실패했습니다.', 'error');
   920	            }
   921	        });
   922	    }
   923	});
   924	
   925	// 선생님용 아이템 삭제 함수
   926	async function deleteItemAsTeacher(itemId) {
   927	    console.log('🗑️ 선생님이 아이템 삭제 시도:', itemId);
   928	    
   929	    if (!confirm('정말로 이 아이템을 삭제하시겠습니까?\n삭제된 아이템은 복구할 수 없습니다.')) {
   930	        return;
   931	    }
   932	    
   933	    try {
   934	        // Supabase를 사용하여 아이템 삭제
   935	        const { error } = await window.supabaseClient
   936	            .from('items')
   937	            .delete()
   938	            .eq('id', itemId);
   939	        
   940	        if (error) throw error;
   941	        
   942	        showMessage('아이템이 성공적으로 삭제되었습니다', 'success');
   943	        
   944	        // 관리자 목록 새로고침 (함수가 있을 경우)
   945	        if (typeof loadAllItems === 'function') {
   946	            await loadAllItems();
   947	        }
   948	        
   949	    } catch (error) {
   950	        console.error('❌ 아이템 삭제 오류:', error);
   951	        showMessage('아이템 삭제에 실패했습니다', 'error');
   952	    }
   953	}
   954	
   955	// Admin Dashboard
   956	async function showTeacherModal() {
   957	    document.getElementById('main-app').style.display = 'none';
   958	    const adminDashboard = document.getElementById('admin-dashboard');
   959	    adminDashboard.classList.remove('hidden');
   960	    
   961	    // 관리자 대시보드 로드 (함수가 있을 경우)
   962	    if (typeof loadAdminDashboard === 'function') {
   963	        await loadAdminDashboard();
   964	    }
   965	}
   966	
   967	function exitAdminMode() {
   968	    document.getElementById('admin-dashboard').classList.add('hidden');
   969	    showMainApp();
   970	}
   971	
   972	// Utility Functions
   973	function showMessage(message, type = 'info') {
   974	    const container = document.body;
   975	    const messageDiv = document.createElement('div');
   976	    const typeClasses = {
   977	        info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500'
   978	    };
   979	    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${typeClasses[type] || typeClasses.info}`;
   980	    messageDiv.innerHTML = `<span>${message}</span>`;
   981	    container.appendChild(messageDiv);
   982	    setTimeout(() => {
   983	        if(messageDiv.parentNode === container) {
   984	            container.removeChild(messageDiv);
   985	        }
   986	    }, 3000);
   987	}
   988	
   989	// 날짜 포맷팅 함수
   990	function formatDate(dateString) {
   991	    try {
   992	        const date = new Date(dateString);
   993	        const now = new Date();
   994	        const diffTime = Math.abs(now - date);
   995	        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
   996	        
   997	        if (diffDays === 1) return '오늘';
   998	        if (diffDays === 2) return '어제';
   999	        if (diffDays <= 7) return `${diffDays - 1}일 전`;
  1000	        
  1001	        return date.toLocaleDateString('ko-KR', {
  1002	            month: 'short',
  1003	            day: 'numeric'
  1004	        });
  1005	    } catch (error) {
  1006	        return '날짜 오류';
  1007	    }
  1008	}
  1009	
  1010	// HTML 이스케이프 함수 (XSS 방지)
  1011	function escapeHtml(text) {
  1012	    const map = {
  1013	        '&': '&amp;',
  1014	        '<': '&lt;',
  1015	        '>': '&gt;',
  1016	        '"': '&quot;',
  1017	        "'": '&#039;'
  1018	    };
  1019	    return text ? text.replace(/[&<>"']/g, function(m) { return map[m]; }) : '';
  1020	}
  1021	
  1022	// Helper functions for levels, sounds, etc.
  1023	function getUserLevel(salesEarnings) {
  1024	    if (salesEarnings < 100) return 'beginner';
  1025	    if (salesEarnings < 300) return 'trader';
  1026	    if (salesEarnings < 600) return 'merchant';
  1027	    if (salesEarnings < 1000) return 'tycoon';
  1028	    return 'master';
  1029	}
  1030	
  1031	function getLevelText(level) {
  1032	    const levelTexts = {
  1033	        'beginner': '🌱 초보자',
  1034	        'trader': '🏪 상인',
  1035	        'merchant': '💰 거상',
  1036	        'tycoon': '👑 재벌',
  1037	        'master': '🌟 전설의 상인'
  1038	    };
  1039	    return levelTexts[level] || '🌱 초보자';
  1040	}
  1041	
  1042	function getItemRarity(price) {
  1043	    if (price <= 50) return 'common';
  1044	    if (price <= 100) return 'rare';  
  1045	    if (price <= 200) return 'epic';
  1046	    return 'legendary';
  1047	}
  1048	
  1049	function getRarityText(rarity) {
  1050	    const rarityNames = {
  1051	        'common': '일반',
  1052	        'rare': '레어 ⭐',
  1053	        'epic': '에픽 ⭐⭐', 
  1054	        'legendary': '전설 ⭐⭐⭐'
  1055	    };
  1056	    return rarityNames[rarity] || '일반';
  1057	}
  1058	
  1059	// 사운드 관련 함수들
  1060	function playSound(type) {
  1061	    if (!soundEnabled) return;
  1062	    // 사운드 재생 로직 (선택사항)
  1063	}
  1064	
  1065	function toggleSound() {
  1066	    soundEnabled = !soundEnabled;
  1067	    const icon = document.getElementById('sound-icon');
  1068	    const text = document.getElementById('sound-text');
  1069	    if (icon && text) {
  1070	        if (soundEnabled) {
  1071	            icon.className = 'fas fa-volume-up mr-1';
  1072	            text.textContent = '사운드';
  1073	        } else {
  1074	            icon.className = 'fas fa-volume-mute mr-1';
  1075	            text.textContent = '음소거';
  1076	        }
  1077	    }
  1078	}
