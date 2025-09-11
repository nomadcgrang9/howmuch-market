// 잉글리시 마켓 - 메인 JavaScript 파일 (최종 수정본)

// Global variables
let currentUser = null;
let isTeacher = false;
let canvas = null;
let ctx = null;
let isDrawing = false;
let selectedItem = null;
let currentColor = '#000000';
let brushSize = 3;
let isEraser = false;
let soundEnabled = true;
let colorNames = {
    '#000000': '검정', '#FF0000': '빨간색', '#00FF00': '초록색', '#0000FF': '파란색',
    '#FFFF00': '노란색', '#FF00FF': '자주색', '#00FFFF': '청록색', '#FFA500': '주황색',
    '#800080': '보라색', '#FFC0CB': '분홍색', '#A52A2A': '갈색', '#808080': '회색',
    '#90EE90': '연초록', '#FFB6C1': '연분홍', '#87CEEB': '하늘색', '#FFFFFF': '하얀'
};
let categoryNames = {
    'toys': '장난감', 'food': '음식', 'clothes': '의류',
    'electronics': '전자제품', 'books': '책', 'other': '기타'
};
let selectedItemForPurchase = null;

// DOM이 로드되면 초기화 시작
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM 로드 완료, 앱 초기화 시작...');
    
    // 간단한 지연 후 앱 시작 (Supabase 로딩 시간 여유)
    setTimeout(() => {
        // Supabase 초기화 시도
        if (typeof window.initializeSupabase === 'function') {
            console.log('🚀 Supabase 초기화 시도 중...');
            window.initializeSupabase().then((success) => {
                console.log(success ? '✅ Supabase 초기화 성공!' : '⚠️ Supabase 연결 실패, 앱은 계속 실행');
            }).catch((error) => {
                console.error('❌ Supabase 초기화 오류:', error);
            });
        } else {
            console.warn('⚠️ Supabase 초기화 함수를 찾을 수 없음');
        }
        
        // Supabase 상태와 관계없이 앱은 시작
        initializeApp();
    }, 1000); // 1초 대기
});

// 애플리케이션의 모든 기능을 시작하는 메인 함수
async function initializeApp() {
    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');

    try {
        // 교사 로그인 버튼 이벤트 리스너 추가 (직접 방식)
        const teacherLoginBtn = document.getElementById('teacher-login-btn');
        if (teacherLoginBtn) {
            console.log('🔗 교사 로그인 버튼 이벤트 리스너 추가');
            teacherLoginBtn.addEventListener('click', function(event) {
                event.preventDefault();
                console.log('🎯 교사 로그인 버튼 클릭됨!');
                
                if (typeof teacherLogin === 'function') {
                    console.log('✅ teacherLogin 함수 실행');
                    teacherLogin();
                } else {
                    console.error('❌ teacherLogin 함수를 찾을 수 없음');
                    alert('오류: 교사 로그인 함수를 찾을 수 없습니다.');
                }
            });
        } else {
            console.warn('⚠️ 교사 로그인 버튼을 찾을 수 없음');
        }

        initializeDrawing();
        initializeColorPalette();
        
        // Supabase가 준비된 경우에만 마켓플레이스 로드
        if (window.supabaseClient) {
            await loadMarketplace();
        } else {
            console.log('📊 로컬 모드로 마켓플레이스 초기화');
        }

        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.style.display = 'none';

        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            try {
                const localUser = JSON.parse(savedUser);
                console.log('💾 localStorage에서 사용자 복구:', localUser.name, localUser.student_number);
                
                // Supabase 연결된 경우 최신 데이터로 동기화
                if (window.supabaseClient && localUser.id) {
                    console.log('🔄 사용자 데이터 동기화 중...');
                    try {
                        const { data: freshUser, error } = await window.supabaseClient
                            .from('users')
                            .select('*')
                            .eq('id', localUser.id)
                            .single();
                            
                        if (error) {
                            console.error('❌ 사용자 동기화 오류:', error);
                            currentUser = localUser; // 로컬 데이터 사용
                        } else {
                            console.log('✅ 최신 데이터 동기화 완료:', {
                                local_points: localUser.purchase_points,
                                db_points: freshUser.purchase_points,
                                synced: freshUser.purchase_points
                            });
                            currentUser = freshUser;
                            localStorage.setItem('currentUser', JSON.stringify(freshUser)); // localStorage도 업데이트
                        }
                    } catch (syncError) {
                        console.error('❌ 동기화 실패:', syncError);
                        currentUser = localUser;
                    }
                } else {
                    currentUser = localUser;
                }
                
                showMainApp();
                updateUserInfo();
            } catch (e) {
                console.error('❌ localStorage 파싱 오류:', e);
                localStorage.removeItem('currentUser');
            }
        }
    } catch (error) {
        console.error('❌ 앱 초기화 중 심각한 오류 발생:', error);
    }
}

// User Authentication Functions
async function login() {
    const studentNumber = document.getElementById('student-number').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    if (!/^\d{4}$/.test(studentNumber)) return showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
    if (!studentName) return showMessage('이름을 입력해주세요', 'error');

    try {
        let { data: users, error: fetchError } = await window.supabaseClient.from('users').select('*').eq('student_number', studentNumber);
        if(fetchError) throw fetchError;

        let user = users[0];

        if (user) {
            console.log('👤 기존 사용자 발견:', {
                name: user.name,
                student_number: user.student_number,
                purchase_points: user.purchase_points,
                sales_earnings: user.sales_earnings,
                last_updated: user.updated_at
            });
            
            // 이름이 다르면 업데이트
            if (user.name !== studentName) {
                console.log('📝 사용자 이름 업데이트:', user.name, '→', studentName);
                user = await window.updateRecord('users', user.id, { name: studentName });
            }
            
            // 최신 데이터로 다시 조회 (혹시 다른 곳에서 변경되었을 수 있음)
            console.log('🔄 최신 사용자 데이터 재조회 중...');
            const { data: freshUser, error: refreshError } = await window.supabaseClient
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();
                
            if (refreshError) {
                console.error('❌ 사용자 데이터 재조회 오류:', refreshError);
            } else {
                user = freshUser;
                console.log('✅ 최신 데이터 적용:', {
                    purchase_points: user.purchase_points,
                    sales_earnings: user.sales_earnings
                });
            }
        } else {
            user = await window.createRecord('users', {
                name: studentName,
                student_number: studentNumber,
                purchase_points: 10000,
                sales_earnings: 0,
                role: 'student',
                is_teacher: false,
                is_active: true
            });
        }
        
        // 최종 사용자 데이터 검증 및 저장
        console.log('💾 로그인 성공 - 최종 사용자 데이터:', {
            id: user.id,
            name: user.name,
            student_number: user.student_number,
            purchase_points: user.purchase_points,
            sales_earnings: user.sales_earnings,
            is_new: !users[0] // 새 사용자인지 여부
        });
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateUserInfo();
        
        const welcomeMsg = user.purchase_points === 0 ? 
            '🎉 다시 오신 것을 환영합니다! (구매 포인트 소진됨)' : 
            '🎉 마켓에 오신 것을 환영합니다!';
        showMessage(welcomeMsg, 'success');

    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage('로그인 중 오류가 발생했습니다.', 'error');
    }
}

// 교사 로그인 모달 표시
function teacherLogin() {
    console.log('🔑 teacherLogin 함수 호출됨');
    
    const modal = document.getElementById('teacher-login-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 비밀번호 입력란 포커스
        const passwordInput = document.getElementById('teacher-password');
        if (passwordInput) {
            setTimeout(() => passwordInput.focus(), 100);
        }
    } else {
        console.error('❌ 교사 로그인 모달을 찾을 수 없음, 기본 프롬프트 사용');
        legacyTeacherLogin();
    }
}

// 교사 로그인 모달 닫기
function closeTeacherLoginModal() {
    const modal = document.getElementById('teacher-login-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // 비밀번호 입력란 초기화
        const passwordInput = document.getElementById('teacher-password');
        if (passwordInput) {
            passwordInput.value = '';
        }
    }
}

// 교사 로그인 확인
async function confirmTeacherLogin() {
    const passwordInput = document.getElementById('teacher-password');
    const password = passwordInput ? passwordInput.value : '';
    
    console.log('🔐 입력된 비밀번호 확인:', password ? '있음' : '없음');
    
    if (password === 'teacher123') {
        try {
            console.log('✅ 비밀번호 확인, 선생님 로그인 시도...');
            
            let teacher = null;
            
            // Supabase가 준비된 경우 데이터베이스에서 교사 정보 조회
            if (window.supabaseClient) {
                console.log('🔍 데이터베이스에서 교사 정보 조회 중...');
                
                const { data: teachers, error: fetchError } = await window.supabaseClient
                    .from('users')
                    .select('*')
                    .eq('student_number', '0000');
                    
                if (fetchError) {
                    console.error('❌ 교사 조회 오류:', fetchError);
                    throw fetchError;
                }
                
                teacher = teachers && teachers.length > 0 ? teachers[0] : null;

                if (!teacher) {
                    console.log('👨‍🏫 새 교사 계정 생성...');
                    teacher = await window.createRecord('users', {
                        name: 'Teacher', 
                        student_number: '0000', 
                        purchase_points: 999999,
                        sales_earnings: 999999, 
                        role: 'teacher', 
                        is_teacher: true, 
                        is_active: true
                    });
                    console.log('✅ 새 교사 계정 생성 완료:', teacher);
                } else {
                    console.log('✅ 기존 교사 계정 발견:', teacher);
                }
            } else {
                // Supabase가 없는 경우 로컬 교사 계정 생성
                console.log('⚠️ Supabase 미준비, 로컬 교사 계정 생성');
                teacher = {
                    id: 'teacher-local',
                    name: 'Teacher (로컬)',
                    student_number: '0000',
                    purchase_points: 999999,
                    sales_earnings: 999999,
                    role: 'teacher',
                    is_teacher: true,
                    is_active: true
                };
                console.log('✅ 로컬 교사 계정 생성 완료:', teacher);
            }
            
            // 교사 로그인 성공 처리
            currentUser = teacher;
            isTeacher = true;
            localStorage.setItem('currentUser', JSON.stringify(teacher));
            showMainApp();
            updateUserInfo();
            
            // 관리자 대시보드가 있으면 표시, 없으면 일반 앱 유지
            const adminDashboard = document.getElementById('admin-dashboard');
            if (adminDashboard) {
                console.log('🎛️ 관리자 대시보드 표시');
                showTeacherModal();
            } else {
                console.log('ℹ️ 관리자 대시보드 없음, 메인 앱에서 교사 모드 유지');
                showMessage('선생님으로 로그인되었습니다!', 'success');
            }
            
            // 로그인 성공 시 모달 닫기 및 관리자 대시보드로 전환
            closeTeacherLoginModal();
            
            // 관리자 대시보드로 자동 전환
            console.log('🎯 관리자 대시보드로 자동 전환...');
            showAdminDashboard();
            
        } catch (error) {
            console.error('❌ Teacher login error:', error);
            showMessage('선생님 로그인에 실패했습니다: ' + error.message, 'error');
            closeTeacherLoginModal();
        }
    } else if (password && password !== '') {
        console.log('❌ 잘못된 비밀번호:', password);
        showMessage('잘못된 비밀번호입니다', 'error');
    } else {
        console.log('ℹ️ 교사 로그인 취소됨 (빈 비밀번호)');
        closeTeacherLoginModal();
    }
}

// 백업용 기존 prompt 방식 교사 로그인
async function legacyTeacherLogin() {
    console.log('🔄 백업 방식 교사 로그인 시도');
    
    const password = prompt('선생님 비밀번호를 입력하세요:');
    console.log('🔐 프롬프트 결과:', password ? '입력됨' : '취소됨');
    
    if (password === 'teacher123') {
        // confirmTeacherLogin과 동일한 로직을 재사용하기 위해
        // 임시로 input을 만들어서 값을 설정
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = `<input id="temp-teacher-password" value="${password}">`;
        document.body.appendChild(tempDiv);
        
        await confirmTeacherLogin();
        
        document.body.removeChild(tempDiv);
    } else if (password !== null) {
        showMessage('잘못된 비밀번호입니다', 'error');
    }
}

function logout() {
    console.log('🚪 로그아웃 시작...');
    currentUser = null;
    isTeacher = false;
    localStorage.removeItem('currentUser');
    
    // 관리자 대시보드 숨기기
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard) {
        adminDashboard.classList.add('hidden');
        adminDashboard.style.display = 'none';
    }
    
    // 메인 앱 화면 복원
    const app = document.getElementById('app');
    if (app) {
        app.style.display = 'block';
    }
    
    // 로그인 화면 표시
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('student-number').value = '';
    document.getElementById('student-name').value = '';
    
    console.log('✅ 로그아웃 완료 - 메인 화면으로 복귀');
}

// 현재 사용자 정보를 가져오는 헬퍼 함수
function getCurrentUser() {
    return currentUser;
}

// UI Control Functions
function showMainApp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    
    // 메인 앱이 표시될 때 그림판 기능을 다시 초기화합니다.
    initializeDrawing();
    initializeColorPalette();
    
    loadMarketplace();
    loadMyItems();
    loadTransactionHistory();
}

function updateUserInfo() {
    if (!currentUser) return;
    
    // 포인트 값이 정확히 0일 수도 있으므로 || 대신 ?? 사용
    const purchasePoints = currentUser.purchase_points ?? 10000;
    const salesEarnings = currentUser.sales_earnings ?? 0;
    
    // 디버깅용 로그
    console.log('💰 사용자 포인트 정보:', {
        name: currentUser.name,
        raw_purchase_points: currentUser.purchase_points,
        display_purchase_points: purchasePoints,
        raw_sales_earnings: currentUser.sales_earnings,
        display_sales_earnings: salesEarnings
    });
    const userLevel = getUserLevel(salesEarnings);
    const levelText = getLevelText(userLevel);
    document.getElementById('user-name').innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
    document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
    document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
    document.getElementById('user-info').style.display = 'flex';
    if (typeof updateClassInfo === 'function') updateClassInfo();
}

function showTab(tabName, event = null) {
    try {
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        
        const targetTab = document.getElementById(`tab-${tabName}`);
        if(targetTab) targetTab.style.display = 'block';
        
        if(event && event.currentTarget) {
            event.currentTarget.classList.add('active');
        }
        
        // Refresh content based on tab
        switch(tabName) {
            case 'marketplace':
                loadMarketplace();
                break;
            case 'inventory':
                loadMyItems();
                break;
            case 'history':
                loadTransactionHistory();
                break;
        }
    } catch (error) {
        console.error('탭 전환 오류:', error);
    }
}

// 관리자 대시보드 표시 함수
function showAdminDashboard() {
    console.log('🎯 관리자 대시보드 표시 중...');
    
    try {
        // 기본 앱 화면 숨기기
        const app = document.getElementById('app');
        if (app) {
            app.style.display = 'none';
        }
        
        // 관리자 대시보드 표시
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
            adminDashboard.style.display = 'block';
            
            // 관리자 데이터 로드
            console.log('📊 관리자 데이터 로딩 시작...');
            
            setTimeout(() => {
                if (typeof loadAdminItemsList === 'function') {
                    console.log('📦 아이템 목록 로딩...');
                    loadAdminItemsList();
                }
                if (typeof loadAdminStudentsList === 'function') {
                    console.log('👥 학생 목록 로딩...');
                    loadAdminStudentsList();
                }
                if (typeof loadRecentTransactions === 'function') {
                    console.log('📊 거래 내역 로딩...');
                    loadRecentTransactions();
                }
                if (typeof loadMarketStatistics === 'function') {
                    console.log('📈 시장 통계 로딩...');
                    loadMarketStatistics();
                }
            }, 100); // 약간의 지연으로 DOM 렌더링 완료 후 실행
            
        } else {
            console.error('❌ admin-dashboard 엘리먼트를 찾을 수 없습니다.');
        }
        
    } catch (error) {
        console.error('❌ 관리자 대시보드 표시 오류:', error);
    }
}

// Drawing Functions
function initializeDrawing() {
    const oldCanvas = document.getElementById('drawing-canvas');
    if (!oldCanvas) return;

    // 기존 이벤트 리스너를 모두 제거하기 위해 캔버스를 복제하고 교체합니다.
    const newCanvas = oldCanvas.cloneNode(true);
    oldCanvas.parentNode.replaceChild(newCanvas, oldCanvas);
    canvas = newCanvas; // 이제부터 이 새로운 캔버스를 사용합니다.
    
    ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 새로운 캔버스에 이벤트 리스너를 딱 한 번만 추가합니다.
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function startDrawing(e) { isDrawing = true; draw(e); }
function stopDrawing() { if (isDrawing) { ctx.beginPath(); isDrawing = false; } }

function draw(e) {
    if (!isDrawing || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    ctx.globalCompositeOperation = isEraser ? 'destination-out' : 'source-over';
    ctx.lineWidth = isEraser ? brushSize * 2 : brushSize;
    ctx.strokeStyle = currentColor;
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type.replace('touch', 'mouse'), {
        clientX: touch.clientX, clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function clearCanvas() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

function initializeColorPalette() {
    // 그림판 도구들(색상, 브러시, 버튼)이 담긴 부모 요소를 찾습니다.
    const toolsContainer = document.querySelector('.mt-4.space-y-3');
    if (!toolsContainer) return;

    // 부모 요소를 통째로 복제해서 모든 하위 요소의 이벤트 리스너를 한번에 제거합니다.
    const newToolsContainer = toolsContainer.cloneNode(true);
    toolsContainer.parentNode.replaceChild(newToolsContainer, toolsContainer);

    // 이제 새로운, 깨끗한 도구들에 이벤트 리스너를 추가합니다.
    newToolsContainer.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => selectColor(option.dataset.color));
    });
    
    const brushSlider = newToolsContainer.querySelector('#brush-size');
    if(brushSlider) {
        brushSlider.addEventListener('input', function() {
            brushSize = parseInt(this.value);
            document.getElementById('brush-size-display').textContent = brushSize;
        });
    }

    const eraserBtn = newToolsContainer.querySelector('#eraser-btn');
    if(eraserBtn) eraserBtn.addEventListener('click', toggleEraser);
    
    const clearBtn = newToolsContainer.querySelector('button[onclick="clearCanvas()"]');
    if(clearBtn) clearBtn.addEventListener('click', clearCanvas);

    selectColor('#000000'); // 기본 색상 선택
}

function selectColor(color) {
    currentColor = color;
    isEraser = false;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('ring-4', 'ring-blue-500'));
    const selectedOption = document.querySelector(`[data-color="${color}"]`);
    if (selectedOption) selectedOption.classList.add('ring-4', 'ring-blue-500');
    document.getElementById('current-color').style.backgroundColor = color;
    document.getElementById('current-color-name').textContent = colorNames[color] || '사용자 지정';
    const eraserBtn = document.getElementById('eraser-btn');
    if (eraserBtn) {
        eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
    }
}

function toggleEraser() {
    isEraser = !isEraser;
    const eraserBtn = document.getElementById('eraser-btn');
    if (isEraser) {
        eraserBtn.classList.replace('bg-yellow-500', 'bg-blue-500');
        eraserBtn.classList.replace('hover:bg-yellow-600', 'hover:bg-blue-600');
        eraserBtn.innerHTML = '<i class="fas fa-paint-brush mr-1"></i>그리기';
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('ring-4', 'ring-blue-500'));
        document.getElementById('current-color-name').textContent = '지우개 모드';
    } else {
        selectColor(currentColor);
    }
}

// Marketplace Functions
async function loadMarketplace() {
    try {
        const itemsGrid = document.getElementById('items-grid');
        if (!itemsGrid) return;
        
        itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아이템을 불러오는 중...</div>';
        
        const { data: items } = await window.fetchTableData('items');
        const { data: users } = await window.fetchTableData('users');
        
        let availableItems = items.filter(item => {
            // 판매 가능한 상태인지 확인
            if (item.status !== 'available') return false;
            
            // 현재 사용자가 있다면 자신의 아이템은 제외
            if (currentUser && item.seller_id === currentUser.id) {
                return false;
            }
            
            return true;
        });
        
        // 같은 반 아이템들만 필터링 (선생님은 모든 아이템 볼 수 있음)
        if (typeof filterSameClassItems === 'function') {
            availableItems = filterSameClassItems(availableItems, users);
        }
        
        itemsGrid.innerHTML = '';
        if (availableItems.length === 0) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요.</div>';
            return;
        }
        
        availableItems.forEach(item => {
            const seller = users.find(u => u.id === item.seller_id);
            itemsGrid.appendChild(createItemCard(item, seller));
        });
    } catch (error) {
        console.error('❌ Error loading marketplace:', error);
        const itemsGrid = document.getElementById('items-grid');
        if (itemsGrid) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-red-500 py-8">아이템 로딩에 실패했습니다.</div>';
        }
    }
}

function createItemCard(item, seller) {
    const card = document.createElement('div');
    const rarity = getItemRarity(item.price);
    card.className = `item-card slide-in ${rarity}`;
    const canAfford = currentUser && currentUser.purchase_points >= item.price;
    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
    const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '포인트 부족';
    
    card.innerHTML = `
        <div class="relative">
            <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
            ${item.image_url ? `
                <canvas width="200" height="150" class="item-image border rounded" 
                        style="background: white;"
                        onload="drawItemPreview(this, '${item.image_url}')"></canvas>
            ` : `
                <div class="item-image border rounded bg-gray-100 flex items-center justify-center" style="width: 200px; height: 150px;">
                    <span class="text-gray-500 text-sm">이미지 없음</span>
                </div>
            `}
            ${item.sold ? '<div class="sold-overlay">SOLD</div>' : ''}
        </div>
        <div class="item-info">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-gray-900 truncate">${escapeHtml(item.name)}</h4>
                <span class="category-badge category-${item.category}">${categoryNames[item.category] || item.category}</span>
            </div>
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '')}</p>
            <div class="flex justify-between items-center mb-3">
                <span class="price-tag"><i class="fas fa-coins mr-1"></i>${item.price} 코인</span>
                <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : '알 수 없음'}</span>
            </div>
            ${currentUser && !item.sold ? `
                <button onclick="openPurchaseModal('${item.id}')" class="${buyButtonClass}" ${!canAfford ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart mr-1"></i>${buyButtonText}
                </button>
            ` : ''}
        </div>
    `;
    
    // 캔버스 이미지 로딩
    setTimeout(() => {
        const canvas = card.querySelector('canvas[onload]');
        if (canvas) {
            drawItemPreview(canvas, item.image_url);
        }
    }, 100);
    
    return card;
}

// My Items Functions
async function loadMyItems() {
    console.log('🔄 내 아이템 로딩 시작...');
    
    try {
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('❌ 사용자 정보 없음');
            return;
        }

        console.log('👤 현재 사용자:', currentUser.student_number);
        
        // 내가 판매 중인 아이템 컨테이너 확인
        const mySellingContainer = document.getElementById('my-selling-items');
        const myBoughtContainer = document.getElementById('my-bought-items');
        
        console.log('📦 판매 컨테이너 존재:', !!mySellingContainer);
        console.log('🛒 구매 컨테이너 존재:', !!myBoughtContainer);
        
        if (!mySellingContainer || !myBoughtContainer) {
            console.error('❌ My Items 컨테이너를 찾을 수 없습니다');
            return;
        }

        // 내가 생성한 아이템들 로드 (기존 데이터베이스 스키마 사용)
        console.log('🔍 내 판매 아이템 검색 중...');
        console.log('🆔 검색 기준 - seller_id:', currentUser.id);
        
        // seller_id로 내 아이템 검색 (실제 데이터베이스 스키마에 맞춤)
        const { data: myItems, error: itemsError } = await window.supabaseClient
            .from('items')
            .select('*')
            .eq('seller_id', currentUser.id)
            .eq('status', 'available')  // status가 available인 것만
            .order('created_at', { ascending: false });

        if (itemsError) {
            console.error('❌ 내 아이템 로드 오류:', itemsError);
            throw itemsError;
        }

        console.log('📊 내가 만든 아이템 개수:', myItems?.length || 0);
        console.log('📋 아이템 상세:', myItems);

        // 판매 중인 아이템 표시
        if (myItems && myItems.length > 0) {
            mySellingContainer.innerHTML = myItems.map(item => createMyItemCard(item)).join('');
            console.log('✅ 판매 아이템 표시 완료');
            
            // 캔버스 이미지 로딩
            setTimeout(() => loadCanvasImages(mySellingContainer), 100);
        } else {
            mySellingContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-box-open text-4xl mb-4"></i>
                    <p>아직 판매 중인 아이템이 없습니다.</p>
                    <p class="text-sm mt-2">새 아이템을 만들어보세요!</p>
                </div>
            `;
            console.log('📝 판매 아이템 없음 메시지 표시');
        }

        // 구매한 아이템들 로드
        console.log('🔍 내 구매 아이템 검색 중...');
        
        // 거래 테이블이 있는지 확인하고 구매한 아이템 로드
        let myPurchases = [];
        try {
            const { data: transactions, error: purchasesError } = await window.supabaseClient
                .from('transactions')
                .select('*')
                .eq('buyer_id', currentUser.id)
                .order('created_at', { ascending: false });
            
            if (purchasesError) {
                console.log('거래 테이블 없음, 빈 배열로 설정');
                myPurchases = [];
            } else {
                // 거래된 아이템 정보를 별도로 가져오기
                if (transactions && transactions.length > 0) {
                    const itemIds = transactions.map(t => t.item_id);
                    const { data: purchasedItems } = await window.supabaseClient
                        .from('items')
                        .select('*')
                        .in('id', itemIds);
                    
                    // 거래와 아이템 정보 결합
                    myPurchases = transactions.map(transaction => ({
                        ...transaction,
                        item: purchasedItems.find(item => item.id === transaction.item_id)
                    })).filter(t => t.item); // 아이템 정보가 있는 것만 포함
                }
            }
        } catch (error) {
            console.log('구매 내역 로드 실패:', error);
            myPurchases = [];
        }

        // 위에서 이미 purchasesError 처리했으므로 제거

        console.log('🛒 구매한 아이템 개수:', myPurchases?.length || 0);

        // 구매한 아이템 표시
        if (myPurchases && myPurchases.length > 0) {
            myBoughtContainer.innerHTML = myPurchases.map(transaction => 
                createPurchasedItemCard(transaction.item, transaction)
            ).join('');
            console.log('✅ 구매 아이템 표시 완료');
            
            // 캔버스 이미지 로딩
            setTimeout(() => loadCanvasImages(myBoughtContainer), 100);
        } else {
            myBoughtContainer.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500">
                    <i class="fas fa-shopping-cart text-4xl mb-4"></i>
                    <p>아직 구매한 아이템이 없습니다.</p>
                    <p class="text-sm mt-2">마켓에서 멋진 아이템을 찾아보세요!</p>
                </div>
            `;
            console.log('📝 구매 아이템 없음 메시지 표시');
        }

    } catch (error) {
        console.error('❌ loadMyItems 오류:', error);
        showMessage('내 아이템을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 내 판매 아이템 카드 생성
function createMyItemCard(item) {
    return `
        <div class="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-4 border-2 border-blue-200 hover:shadow-md transition-all duration-200">
            <div class="flex justify-between items-start mb-3">
                <h4 class="text-lg font-bold text-gray-800 truncate">${escapeHtml(item.name)}</h4>
                <div class="flex space-x-1">
                    <button onclick="editMyItem('${item.id}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm" 
                            title="수정">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteMyItem('${item.id}')" 
                            class="text-red-600 hover:text-red-800 text-sm px-2 py-1 border rounded hover:bg-red-50" 
                            title="삭제">
                        <i class="fas fa-trash"></i> 삭제
                    </button>
                </div>
            </div>
            
            ${item.image_url ? `
                <div class="mb-3 flex justify-center">
                    <canvas width="200" height="150" class="border rounded" 
                            style="background: white;"
                            onload="drawItemPreview(this, '${item.image_url}')"></canvas>
                </div>
            ` : ''}
            
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '설명 없음')}</p>
            
            <div class="flex justify-between items-center">
                <div class="text-right">
                    <div class="text-lg font-bold text-green-600">${item.price}코인</div>
                    <div class="text-xs text-gray-500">${formatDate(item.created_at)}</div>
                </div>
                <div class="flex flex-col items-end">
                    <div class="text-xs text-gray-500 mb-1">조회수: ${item.views || 0}</div>
                    <div class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">판매중</div>
                </div>
            </div>
        </div>
    `;
}

// 구매한 아이템 카드 생성
function createPurchasedItemCard(item, transaction) {
    return `
        <div class="bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg p-4 border-2 border-green-200">
            <div class="flex justify-between items-start mb-3">
                <h4 class="text-lg font-bold text-gray-800 truncate">${escapeHtml(item.name)}</h4>
                <div class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">구매완료</div>
            </div>
            
            ${item.image_url ? `
                <div class="mb-3 flex justify-center">
                    <canvas width="200" height="150" class="border rounded" 
                            style="background: white;"
                            onload="drawItemPreview(this, '${item.image_url}')"></canvas>
                </div>
            ` : ''}
            
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${escapeHtml(item.description || '설명 없음')}</p>
            
            <div class="flex justify-between items-center text-sm">
                <div>
                    <div class="text-gray-600">판매자: ${item.seller_id}</div>
                    <div class="text-gray-500">구매일: ${formatDate(transaction.created_at)}</div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-bold text-green-600">${transaction.final_price || item.price}코인</div>
                    ${transaction.final_price !== item.price ? 
                        `<div class="text-xs text-gray-500 line-through">${item.price}코인</div>` : ''
                    }
                </div>
            </div>
        </div>
    `;
}

// 내 아이템 수정 함수
async function editMyItem(itemId) {
    try {
        // 아이템 정보 가져오기
        const { data: item, error } = await window.supabaseClient
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (error) throw error;

        // 현재 사용자가 소유자인지 확인
        const currentUser = getCurrentUser();
        
        if (!currentUser || item.seller_id !== currentUser.id) {
            showMessage('본인의 아이템만 수정할 수 있습니다.', 'error');
            return;
        }

        // 아이템 수정 모달 표시
        showItemEditModal(item);
        
    } catch (error) {
        console.error('아이템 수정 오류:', error);
        showMessage('아이템을 불러오는 중 오류가 발생했습니다.', 'error');
    }
}

// 내 아이템 삭제 함수
async function deleteMyItem(itemId) {
    try {
        console.log('🗑️ 아이템 삭제 시도:', itemId);
        
        // 삭제 확인
        if (!confirm('정말 이 아이템을 삭제하시겠습니까?\n삭제된 아이템은 복구할 수 없습니다.')) {
            console.log('❌ 사용자가 삭제 취소');
            return;
        }

        // 현재 사용자 확인
        const currentUser = getCurrentUser();
        if (!currentUser) {
            console.log('❌ 로그인된 사용자 없음');
            showMessage('로그인이 필요합니다.', 'error');
            return;
        }

        console.log('👤 현재 사용자:', currentUser.id);

        // 아이템 정보 확인
        console.log('🔍 아이템 정보 조회 중...');
        const { data: item, error: fetchError } = await window.supabaseClient
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (fetchError) {
            console.error('❌ 아이템 조회 오류:', fetchError);
            throw fetchError;
        }

        console.log('📦 아이템 정보:', item);

        // 소유권 확인
        if (item.seller_id !== currentUser.id) {
            console.log('❌ 소유권 없음:', item.seller_id, 'vs', currentUser.id);
            showMessage('본인의 아이템만 삭제할 수 있습니다.', 'error');
            return;
        }

        console.log('✅ 소유권 확인됨, 삭제 진행...');

        // 아이템 삭제
        const { error: deleteError } = await window.supabaseClient
            .from('items')
            .delete()
            .eq('id', itemId);

        if (deleteError) {
            console.error('❌ 삭제 오류:', deleteError);
            throw deleteError;
        }

        console.log('✅ 삭제 성공');
        showMessage('아이템이 성공적으로 삭제되었습니다.', 'success');
        
        // 내 아이템 목록 새로고침
        loadMyItems();
        
    } catch (error) {
        console.error('❌ 아이템 삭제 오류:', error);
        showMessage('아이템 삭제 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 아이템 편집 모달 표시
function showItemEditModal(item) {
    // 간단한 프롬프트로 구현 (추후 모달로 개선 가능)
    const newName = prompt('아이템 이름을 수정하세요:', item.name);
    if (newName === null) return; // 취소

    const newDescription = prompt('아이템 설명을 수정하세요:', item.description || '');
    if (newDescription === null) return; // 취소

    const newPrice = prompt('아이템 가격을 수정하세요:', item.price);
    if (newPrice === null) return; // 취소

    const price = parseInt(newPrice);
    if (isNaN(price) || price < 1) {
        showMessage('올바른 가격을 입력해주세요. (1코인 이상)', 'error');
        return;
    }

    updateMyItem(item.id, {
        name: newName.trim(),
        description: newDescription.trim(),
        price: price
    });
}

// 내 아이템 업데이트
async function updateMyItem(itemId, updates) {
    try {
        const { error } = await window.supabaseClient
            .from('items')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', itemId);

        if (error) throw error;

        showMessage('아이템이 성공적으로 수정되었습니다.', 'success');
        loadMyItems(); // 목록 새로고침
        
    } catch (error) {
        console.error('아이템 수정 오류:', error);
        showMessage('아이템 수정 중 오류가 발생했습니다.', 'error');
    }
}

// 아이템 미리보기 캔버스 그리기
function drawItemPreview(canvas, drawingData) {
    try {
        if (!drawingData) return;
        
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        
        img.src = drawingData;
    } catch (error) {
        console.error('미리보기 그리기 오류:', error);
    }
}

// 컨테이너 내 모든 캔버스 이미지 로드
function loadCanvasImages(container) {
    const canvases = container.querySelectorAll('canvas[onload]');
    canvases.forEach(canvas => {
        const onloadAttr = canvas.getAttribute('onload');
        if (onloadAttr) {
            // onload 속성에서 drawingData 추출
            const match = onloadAttr.match(/drawItemPreview\(this,\s*'([^']+)'\)/);
            if (match && match[1]) {
                drawItemPreview(canvas, match[1]);
            }
        }
    });
}

// Purchase System Functions
function openPurchaseModal(itemId) {
    console.log('🛒 구매 모달 열기:', itemId);
    
    try {
        if (!currentUser) {
            showMessage('로그인이 필요합니다.', 'error');
            return;
        }

        // 모달 요소 찾기
        const modal = document.getElementById('purchase-modal');
        if (!modal) {
            console.log('❌ 구매 모달을 찾을 수 없음, confirm으로 대체');
            // 모달이 없으면 간단한 확인 창 사용
            const confirmed = confirm('이 아이템을 구매하시겠습니까?');
            if (confirmed) {
                confirmPurchase(itemId);
            }
            return;
        }

        console.log('✅ 구매 모달 발견, 표시 중...');
        
        // 모달 표시
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 전역 변수에 아이템 ID 저장
        selectedItemForPurchase = { id: itemId };
        
        console.log('🎯 구매 모달 표시 완료');
        
    } catch (error) {
        console.error('❌ 구매 모달 오류:', error);
        // 오류 발생 시 간단한 확인 창으로 대체
        const confirmed = confirm('이 아이템을 구매하시겠습니까?');
        if (confirmed) {
            confirmPurchase(itemId);
        }
    }
}

function closePurchaseModal() {
    try {
        const modal = document.getElementById('purchase-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            console.log('✅ 구매 모달 닫기 완료');
        }
        selectedItemForPurchase = null;
    } catch (error) {
        console.error('❌ 모달 닫기 오류:', error);
    }
}

async function confirmPurchase(itemId) {
    // itemId가 없으면 전역 변수에서 가져오기
    if (!itemId && selectedItemForPurchase) {
        itemId = selectedItemForPurchase.id;
    }
    
    if (!currentUser) {
        showMessage('로그인이 필요합니다.', 'error');
        return;
    }
    
    if (!itemId) {
        console.error('❌ 구매할 아이템 ID가 없습니다');
        showMessage('구매할 아이템 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    try {
        console.log('💰 구매 처리 시작:', itemId);
        
        // 아이템 정보 가져오기
        const { data: item, error: itemError } = await window.supabaseClient
            .from('items')
            .select('*')
            .eq('id', itemId)
            .single();

        if (itemError) {
            console.error('❌ 아이템 조회 오류:', itemError);
            throw itemError;
        }

        console.log('📦 구매할 아이템:', item);
        console.log('💳 현재 포인트:', currentUser.purchase_points);
        console.log('💵 아이템 가격:', item.price);
        
        // 구매 포인트 확인
        if (currentUser.purchase_points < item.price) {
            showMessage(`구매 포인트가 부족합니다. (보유: ${currentUser.purchase_points}, 필요: ${item.price})`, 'error');
            closePurchaseModal();
            return;
        }
        
        // 자신의 아이템인지 확인
        if (item.seller_id === currentUser.id) {
            showMessage('본인의 아이템은 구매할 수 없습니다.', 'error');
            closePurchaseModal();
            return;
        }
        
        console.log('✅ 구매 가능, 거래 처리 중...');
        
        // 임시 구매 처리 (실제로는 구매 요청 시스템 사용해야 함)
        const buyerNewPoints = currentUser.purchase_points - item.price;
        
        // 구매자 포인트 차감
        const { error: updateBuyerError } = await window.supabaseClient
            .from('users')
            .update({ purchase_points: buyerNewPoints })
            .eq('id', currentUser.id);
            
        if (updateBuyerError) throw updateBuyerError;
        
        // 판매자 정보 가져오기 및 포인트 증가 (디버깅 강화)
        console.log('🔍 판매자 조회 시작 - seller_id:', item.seller_id);
        
        const { data: seller, error: sellerFetchError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', item.seller_id)
            .single();
            
        if (sellerFetchError) {
            console.error('❌ 판매자 정보 조회 오류:', sellerFetchError);
            console.error('❌ 조회 실패한 seller_id:', item.seller_id);
            throw new Error('판매자 정보를 찾을 수 없습니다: ' + sellerFetchError.message);
        }
        
        if (!seller) {
            console.error('❌ 판매자 데이터가 null입니다');
            throw new Error('판매자 정보가 존재하지 않습니다');
        }
        
        console.log('👤 판매자 정보:', {
            id: seller.id,
            name: seller.name,
            student_number: seller.student_number,
            current_sales_earnings: seller.sales_earnings
        });
        
        // 판매자 sales_earnings 증가
        const currentEarnings = seller.sales_earnings || 0;
        const sellerNewEarnings = currentEarnings + item.price;
        
        console.log('💰 판매자 수익 업데이트:');
        console.log('  - 현재 수익:', currentEarnings);
        console.log('  - 아이템 가격:', item.price);
        console.log('  - 새 수익:', sellerNewEarnings);
        
        const { data: updatedSeller, error: updateSellerError } = await window.supabaseClient
            .from('users')
            .update({ 
                sales_earnings: sellerNewEarnings,
                updated_at: new Date().toISOString()
            })
            .eq('id', item.seller_id)
            .select()
            .single();
            
        if (updateSellerError) {
            console.error('❌ 판매자 포인트 업데이트 오류:', updateSellerError);
            throw new Error('판매자 포인트 업데이트 실패: ' + updateSellerError.message);
        }
        
        if (updatedSeller) {
            console.log('✅ 판매자 포인트 업데이트 성공!');
            console.log('  - 업데이트된 데이터:', {
                name: updatedSeller.name,
                new_sales_earnings: updatedSeller.sales_earnings,
                updated_at: updatedSeller.updated_at
            });
        } else {
            console.warn('⚠️ 판매자 업데이트 결과가 없음');
        }
        
        // 아이템 상태 변경
        const { error: updateItemError } = await window.supabaseClient
            .from('items')
            .update({ 
                status: 'sold',
                buyer_id: currentUser.id,
                final_price: item.price
            })
            .eq('id', itemId);
            
        if (updateItemError) {
            console.error('❌ 아이템 상태 업데이트 오류:', updateItemError);
            throw updateItemError;
        }
        
        // 거래 내역 기록
        console.log('📝 거래 내역 기록 중...');
        const { error: transactionError } = await window.supabaseClient
            .from('transactions')
            .insert({
                buyer_id: currentUser.id,
                seller_id: item.seller_id,
                item_id: itemId,
                amount: item.price,
                status: 'completed'
            });
            
        if (transactionError) {
            console.error('❌ 거래 내역 기록 오류:', transactionError);
            // 거래 내역 기록 실패는 치명적이지 않으므로 계속 진행
        } else {
            console.log('✅ 거래 내역 기록 완료');
        }
        
        // 구매자 데이터베이스에서도 업데이트 확인
        console.log('🔍 구매자 포인트 데이터베이스 재확인...');
        const { data: updatedBuyer, error: buyerCheckError } = await window.supabaseClient
            .from('users')
            .select('*')
            .eq('id', currentUser.id)
            .single();
            
        if (buyerCheckError) {
            console.error('❌ 구매자 포인트 재확인 오류:', buyerCheckError);
            // 로컬만 업데이트
            currentUser.purchase_points = buyerNewPoints;
        } else {
            // 데이터베이스 값으로 정확히 업데이트
            console.log('✅ 구매자 최신 데이터 적용:', {
                old_points: currentUser.purchase_points,
                new_points: updatedBuyer.purchase_points,
                calculated_points: buyerNewPoints
            });
            currentUser = updatedBuyer; // 전체 사용자 정보 업데이트
        }
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserInfo();
        
        // 디버깅: 판매자 포인트 재조회해서 확인
        console.log('🔍 구매 완료 후 판매자 포인트 재확인...');
        const { data: finalSellerCheck, error: finalCheckError } = await window.supabaseClient
            .from('users')
            .select('name, student_number, sales_earnings')
            .eq('id', item.seller_id)
            .single();
            
        if (finalCheckError) {
            console.error('❌ 최종 판매자 포인트 확인 오류:', finalCheckError);
        } else {
            console.log('✅ 최종 판매자 포인트 확인:');
            console.log(`  👤 ${finalSellerCheck.name} (${finalSellerCheck.student_number})`);
            console.log(`  💰 판매 포인트: ${finalSellerCheck.sales_earnings}`);
            
            // 성공 메시지에 판매자 정보도 포함
            showMessage(`구매 완료! 판매자 ${finalSellerCheck.name}님의 포인트: ${finalSellerCheck.sales_earnings}P`, 'success');
        }
        
        // showMessage는 위에서 상세 정보와 함께 이미 표시됨
        closePurchaseModal();
        loadMarketplace(); // 마켓플레이스 새로고침
        loadTransactionHistory(); // 거래 내역 새로고침
        loadMyItems(); // 내 아이템 새로고침
        
        console.log('✅ 구매 완료!');
        
    } catch (error) {
        console.error('❌ 구매 오류:', error);
        showMessage('구매 처리 중 오류가 발생했습니다: ' + error.message, 'error');
        closePurchaseModal();
    }
}

// Transaction History Functions
async function loadTransactionHistory() {
    console.log("📊 거래 내역 로딩 시작...");
    
    if (!currentUser) {
        console.error('❌ 사용자 로그인 필요');
        return;
    }
    
    const container = document.getElementById('transaction-history');
    if (!container) {
        console.error('❌ 거래 내역 컨테이너를 찾을 수 없음');
        return;
    }
    
    try {
        // 내가 관련된 모든 거래 조회 (구매자이거나 판매자인 경우)
        console.log('🔍 거래 내역 조회 - 사용자 ID:', currentUser.id);
        
        const { data: transactions, error } = await window.supabaseClient
            .from('transactions')
            .select(`
                *,
                items:item_id (
                    name,
                    image_url
                )
            `)
            .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.error('❌ 거래 내역 조회 오류:', error);
            throw error;
        }
        
        console.log('📋 조회된 거래 내역:', transactions.length, '건');
        console.log('📄 거래 상세:', transactions);
        
        if (!transactions || transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-receipt text-4xl mb-4"></i>
                    <p>거래 내역이 없습니다.</p>
                    <p class="text-sm">아이템을 구매하거나 판매하면 여기에 표시됩니다.</p>
                </div>
            `;
            return;
        }
        
        // 사용자 정보 조회 (이름 표시용)
        const userIds = [...new Set([
            ...transactions.map(t => t.buyer_id),
            ...transactions.map(t => t.seller_id)
        ])];
        
        const { data: users, error: userError } = await window.supabaseClient
            .from('users')
            .select('id, name, student_number')
            .in('id', userIds);
            
        if (userError) {
            console.error('⚠️ 사용자 정보 조회 오류:', userError);
        }
        
        const userMap = {};
        if (users) {
            users.forEach(user => {
                userMap[user.id] = user;
            });
        }
        
        // 거래 내역 HTML 생성
        let historyHTML = '';
        
        transactions.forEach(transaction => {
            const buyer = userMap[transaction.buyer_id] || { name: '알 수 없음', student_number: '?' };
            const seller = userMap[transaction.seller_id] || { name: '알 수 없음', student_number: '?' };
            const item = transaction.items || { name: '삭제된 아이템', image_url: null };
            
            const isBuyer = transaction.buyer_id === currentUser.id;
            const isSeller = transaction.seller_id === currentUser.id;
            
            const transactionType = isBuyer ? '구매' : '판매';
            const transactionColor = isBuyer ? 'text-blue-600' : 'text-green-600';
            const partnerName = isBuyer ? seller.name : buyer.name;
            const partnerNumber = isBuyer ? seller.student_number : buyer.student_number;
            
            historyHTML += `
                <div class="bg-white rounded-lg p-4 shadow-sm border">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                                ${item.image_url ? 
                                    `<img src="${item.image_url}" class="w-full h-full object-cover">` : 
                                    '<i class="fas fa-image text-gray-400"></i>'
                                }
                            </div>
                            <div>
                                <div class="font-medium text-gray-900">${item.name}</div>
                                <div class="text-sm text-gray-500">
                                    ${transactionType} • ${partnerName} (${partnerNumber})
                                </div>
                                <div class="text-xs text-gray-400">
                                    ${new Date(transaction.created_at).toLocaleDateString('ko-KR', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold ${transactionColor}">
                                ${isBuyer ? '-' : '+'}${transaction.amount.toLocaleString()}P
                            </div>
                            <div class="text-sm text-gray-500">${transactionType}</div>
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = historyHTML;
        console.log('✅ 거래 내역 로딩 완료');
        
    } catch (error) {
        console.error('❌ 거래 내역 로딩 오류:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-4xl mb-4"></i>
                <p>거래 내역을 불러오는데 실패했습니다.</p>
                <p class="text-sm">${error.message}</p>
                <button onclick="loadTransactionHistory()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    다시 시도
                </button>
            </div>
        `;
    }
}

// Item selling form handler
document.addEventListener('DOMContentLoaded', function() {
    const sellForm = document.getElementById('sell-form');
    if (sellForm) {
        sellForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (!currentUser) return showMessage('로그인이 필요합니다.', 'error');

            const itemName = document.getElementById('item-name').value;
            const itemDescription = document.getElementById('item-description').value;
            const itemPrice = parseInt(document.getElementById('item-price').value);
            const itemCategory = document.getElementById('item-category').value;
            const drawingData = canvas.toDataURL('image/png');

            if (!itemName || !itemPrice || !itemCategory) {
                return showMessage('이름, 가격, 카테고리는 필수 항목입니다.', 'warning');
            }

            try {
                await window.createRecord('items', {
                    name: itemName,
                    description: itemDescription,
                    price: itemPrice,
                    category: itemCategory,
                    image_url: drawingData, // drawing_data 대신 image_url 사용
                    seller_id: currentUser.id,
                    status: 'available'
                });
                showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
                this.reset();
                clearCanvas();
                showTab('marketplace');
                loadMarketplace(); // 마켓플레이스 새로고침
            } catch (error) {
                console.error('아이템 등록 오류:', error);
                showMessage('아이템 등록에 실패했습니다.', 'error');
            }
        });
    }
});

// 선생님용 아이템 삭제 함수
async function deleteItemAsTeacher(itemId) {
    console.log('🗑️ 선생님이 아이템 삭제 시도:', itemId);
    
    if (!confirm('정말로 이 아이템을 삭제하시겠습니까?\n삭제된 아이템은 복구할 수 없습니다.')) {
        return;
    }
    
    try {
        // Supabase를 사용하여 아이템 삭제
        const { error } = await window.supabaseClient
            .from('items')
            .delete()
            .eq('id', itemId);
        
        if (error) throw error;
        
        showMessage('아이템이 성공적으로 삭제되었습니다', 'success');
        
        // 관리자 목록 새로고침
        console.log('🔄 아이템 목록 새로고침 시도...');
        if (typeof refreshItemsList === 'function') {
            console.log('✅ refreshItemsList 함수 호출');
            await refreshItemsList();
        } else if (typeof loadAdminItemsList === 'function') {
            console.log('✅ loadAdminItemsList 함수 호출');
            await loadAdminItemsList();
        } else {
            console.warn('⚠️ 아이템 목록 새로고침 함수를 찾을 수 없음 - 페이지 새로고침 권장');
            showMessage('아이템이 삭제되었습니다. 목록을 다시 불러오려면 페이지를 새로고침하세요.', 'success');
        }
        
    } catch (error) {
        console.error('❌ 아이템 삭제 오류:', error);
        showMessage('아이템 삭제에 실패했습니다', 'error');
    }
}

// Admin Dashboard
async function showTeacherModal() {
    // 학생용 앱과 네비게이션 숨기기
    document.getElementById('main-app').style.display = 'none';
    
    // 학생용 포인트 정보 숨기기 (교사는 볼 필요 없음)
    const userInfo = document.getElementById('user-info');
    if (userInfo) {
        userInfo.style.display = 'none';
    }
    
    // 관리자 대시보드 표시
    const adminDashboard = document.getElementById('admin-dashboard');
    adminDashboard.classList.remove('hidden');
    
    console.log('👩‍🏫 교사 관리자 모드 활성화');
    
    // 관리자 대시보드 데이터 로드
    if (typeof loadAdminStudentsList === 'function') {
        await loadAdminStudentsList();
    }
    if (typeof loadAdminItemsList === 'function') {
        await loadAdminItemsList();
    }
}

// exitAdminMode 함수 제거 (더 이상 필요하지 않음)
// 교사는 로그아웃으로만 관리자 모드를 나갈 수 있음

// Utility Functions
function showMessage(message, type = 'info') {
    const container = document.body;
    const messageDiv = document.createElement('div');
    const typeClasses = {
        info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500'
    };
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${typeClasses[type] || typeClasses.info}`;
    messageDiv.innerHTML = `<span>${message}</span>`;
    container.appendChild(messageDiv);
    setTimeout(() => {
        if(messageDiv.parentNode === container) {
            container.removeChild(messageDiv);
        }
    }, 3000);
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '오늘';
        if (diffDays === 2) return '어제';
        if (diffDays <= 7) return `${diffDays - 1}일 전`;
        
        return date.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric'
        });
    } catch (error) {
        return '날짜 오류';
    }
}

// HTML 이스케이프 함수 (XSS 방지)
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text ? text.replace(/[&<>"']/g, function(m) { return map[m]; }) : '';
}

// Helper functions for levels, sounds, etc.
function getUserLevel(salesEarnings) {
    if (salesEarnings < 100) return 'beginner';
    if (salesEarnings < 300) return 'trader';
    if (salesEarnings < 600) return 'merchant';
    if (salesEarnings < 1000) return 'tycoon';
    return 'master';
}

function getLevelText(level) {
    const levelTexts = {
        'beginner': '🌱 초보자',
        'trader': '🏪 상인',
        'merchant': '💰 거상',
        'tycoon': '👑 재벌',
        'master': '🌟 전설의 상인'
    };
    return levelTexts[level] || '🌱 초보자';
}

function getItemRarity(price) {
    if (price <= 50) return 'common';
    if (price <= 100) return 'rare';  
    if (price <= 200) return 'epic';
    return 'legendary';
}

function getRarityText(rarity) {
    const rarityNames = {
        'common': '일반',
        'rare': '레어 ⭐',
        'epic': '에픽 ⭐⭐', 
        'legendary': '전설 ⭐⭐⭐'
    };
    return rarityNames[rarity] || '일반';
}

// 사운드 관련 함수들
function playSound(type) {
    if (!soundEnabled) return;
    // 사운드 재생 로직 (선택사항)
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('sound-icon');
    const text = document.getElementById('sound-text');
    if (icon && text) {
        if (soundEnabled) {
            icon.className = 'fas fa-volume-up mr-1';
            text.textContent = '사운드';
        } else {
            icon.className = 'fas fa-volume-mute mr-1';
            text.textContent = '음소거';
        }
    }
}

// 전역 함수 등록 (HTML에서 onclick으로 사용)
window.deleteMyItem = deleteMyItem;
window.editMyItem = editMyItem;
window.openPurchaseModal = openPurchaseModal;
window.closePurchaseModal = closePurchaseModal;
window.confirmPurchase = confirmPurchase;
window.login = login;
window.teacherLogin = teacherLogin;
window.closeTeacherLoginModal = closeTeacherLoginModal;
window.confirmTeacherLogin = confirmTeacherLogin;
window.legacyTeacherLogin = legacyTeacherLogin;
window.loadTransactionHistory = loadTransactionHistory;
window.deleteItemAsTeacher = deleteItemAsTeacher;
window.showAdminDashboard = showAdminDashboard;
window.logout = logout;
window.showTab = showTab;
