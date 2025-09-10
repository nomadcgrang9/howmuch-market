// 잉글리시 마켓 - 메인 JavaScript 파일

// 🔍 환경별 API URL 자동 감지
function getAPIBaseURL() {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    const pathname = window.location.pathname;
    
    console.log('🌐 현재 환경 정보:', {
        hostname,
        protocol, 
        pathname,
        fullURL: window.location.href
    });
    
    // GenSpark 게시 환경 감지
    if (hostname.includes('genspark.app') || hostname.includes('genspark.')) {
        console.log('🚀 GenSpark 게시 환경 감지됨');
        return ''; // 상대 경로 유지
    }
    
    // 미리보기 환경 (localhost 등)
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('preview')) {
        console.log('🔧 미리보기 환경 감지됨');
        return ''; // 상대 경로 유지
    }
    
    // 기타 환경
    console.log('📦 기본 환경 설정 사용');
    return ''; // 기본값
}

const API_BASE_URL = getAPIBaseURL();
console.log('🔗 API_BASE_URL 설정됨:', API_BASE_URL || '(상대 경로)');

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
    '#000000': '검정',
    '#FF0000': '빨간색',
    '#00FF00': '초록색',
    '#0000FF': '파란색',
    '#FFFF00': '노란색',
    '#FF00FF': '자주색',
    '#00FFFF': '청록색',
    '#FFA500': '주황색',
    '#800080': '보라색',
    '#FFC0CB': '분홍색',
    '#A52A2A': '갈색',
    '#808080': '회색',
    '#90EE90': '연초록',
    '#FFB6C1': '연분홍',
    '#87CEEB': '하늘색',
    '#FFFFFF': '하얀'
};

// 포켓몬 카드 등급 시스템
function getItemRarity(price) {
    if (price <= 50) return 'common';
    if (price <= 100) return 'rare';
    if (price <= 200) return 'epic';
    return 'legendary';
}

function getRarityText(rarity) {
    const rarityTexts = {
        'common': 'Common',
        'rare': 'Rare ⭐',
        'epic': 'Epic ⭐⭐',
        'legendary': 'Legendary ⭐⭐⭐'
    };
    return rarityTexts[rarity] || 'Common';
}

// 사용자 레벨 시스템
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

// 사운드 시스템
function playSound(type) {
    if (!soundEnabled) return;
    
    try {
        // Web Audio API를 사용해 간단한 사운드 생성
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        function createBeep(frequency, duration, volume = 0.1, type = 'sine') {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration);
        }
        
        switch(type) {
            case 'purchase':
                createBeep(523.25, 0.15);
                setTimeout(() => createBeep(659.25, 0.15), 100);
                setTimeout(() => createBeep(783.99, 0.3), 200);
                break;
            case 'legendary':
                createBeep(523.25, 0.1);
                setTimeout(() => createBeep(659.25, 0.1), 50);
                setTimeout(() => createBeep(783.99, 0.1), 100);
                setTimeout(() => createBeep(1046.5, 0.3), 150);
                break;
            case 'click':
                createBeep(800, 0.05, 0.05);
                break;
            case 'error':
                createBeep(400, 0.2, 0.1, 'sawtooth');
                setTimeout(() => createBeep(300, 0.3, 0.1, 'sawtooth'), 100);
                break;
            case 'level-up':
                createBeep(523.25, 0.1);
                setTimeout(() => createBeep(659.25, 0.1), 80);
                setTimeout(() => createBeep(783.99, 0.1), 160);
                setTimeout(() => createBeep(1046.5, 0.4), 240);
                break;
        }
    } catch (error) {
        console.log('사운드 재생 실패:', error);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const soundButton = document.getElementById('sound-toggle');
    
    if (soundIcon && soundText && soundButton) {
        if (soundEnabled) {
            soundIcon.className = 'fas fa-volume-up mr-1';
            soundText.textContent = '사운드';
            soundButton.className = 'bg-blue-500 hover:bg-blue-600 px-3 py-1 rounded text-sm';
            playSound('click');
        } else {
            soundIcon.className = 'fas fa-volume-mute mr-1';
            soundText.textContent = '무음';
            soundButton.className = 'bg-gray-500 hover:bg-gray-600 px-3 py-1 rounded text-sm';
        }
    }
}

// 불꽃놀이 애니메이션
function createFireworks() {
    const container = document.createElement('div');
    container.className = 'fireworks-container';
    document.body.appendChild(container);

    // 여러 개의 불꽃놀이 생성
    for (let i = 0; i < 30; i++) {
        setTimeout(() => {
            createSingleFirework(container);
        }, i * 100);
    }

    // 3초 후 제거
    setTimeout(() => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    }, 3000);
}

function createSingleFirework(container) {
    const firework = document.createElement('div');
    firework.className = `firework color-${Math.floor(Math.random() * 6) + 1}`;
    
    // 랜덤 위치 설정
    firework.style.left = Math.random() * 100 + '%';
    firework.style.top = Math.random() * 100 + '%';
    
    container.appendChild(firework);
    
    // 1.5초 후 제거
    setTimeout(() => {
        if (firework.parentNode) {
            firework.parentNode.removeChild(firework);
        }
    }, 1500);
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 2000);
}

let categoryNames = {
    'toys': '장난감',
    'food': '음식',
    'clothes': '의류',
    'electronics': '전자제품',
    'books': '책',
    'other': '기타'
};

// Supabase가 준비되었다는 신호를 받으면 앱 초기화를 시작합니다.
document.addEventListener('supabaseIsReady', function() {
    console.log('🤝 Supabase 준비 완료! 마켓 앱을 시작합니다...');
    initializeApp();
});

// 애플리케이션의 모든 기능을 시작하는 메인 함수
async function initializeApp() {
    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
    
    // 이 부분은 기존 'DOMContentLoaded' 안에 있던 내용과 동일합니다.
    try {
        initializeDrawing();
        initializeColorPalette();
        await loadMarketplace();
        
        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.style.display = 'none';
        
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            currentUser = JSON.parse(savedUser);
            showMainApp();
            updateUserInfo();
        }
    } catch (error) {
        console.error('❌ 앱 초기화 중 심각한 오류 발생:', error);
    }
}

// User Authentication Functions
async function login() {
    const studentNumberInput = document.getElementById('student-number');
    const studentNameInput = document.getElementById('student-name');
    
    if (!studentNumberInput || !studentNameInput) {
        showMessage('입력 필드를 찾을 수 없습니다', 'error');
        return;
    }
    
    const studentNumber = studentNumberInput.value.trim();
    const studentName = studentNameInput.value.trim();
    
    // 학번 검증: 4자리 숫자만 허용 (예: 4103)
    if (!studentNumber || !/^\d{4}$/.test(studentNumber)) {
        showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
        return;
    }
    
    if (!studentName) {
        showMessage('이름을 입력해주세요', 'error');
        return;
    }
    
    try {
        console.log('🔑 로그인 시도:', studentNumber, studentName);
        
        // 🚀 데이터베이스 초기화 (게시 환경 대응)
        if (typeof initializeDatabase === 'function') {
            try {
                console.log('📋 데이터베이스 초기화 시작...');
                await initializeDatabase();
                console.log('✅ 데이터베이스 초기화 완료');
            } catch (initError) {
                console.warn('⚠️ 데이터베이스 초기화 실패, 계속 진행:', initError);
            }
        }
        
        // Check if user already exists
        let existingUsers;
        try {
            existingUsers = await fetchTableData('users');
            console.log('👥 기존 사용자 목록:', existingUsers);
        } catch (error) {
            console.log('❌ 사용자 목록 로딩 실패:', error);
            
            // 테이블이 없는 경우 스키마 생성 시도
            if (error.message.includes('404') || error.message.includes('not found')) {
                console.log('🔧 사용자 테이블이 없어서 생성 시도...');
                try {
                    if (typeof createTableSchemas === 'function') {
                        await createTableSchemas();
                        console.log('🔄 테이블 생성 후 다시 시도...');
                        existingUsers = await fetchTableData('users');
                    }
                } catch (schemaError) {
                    console.error('❌ 테이블 생성 실패:', schemaError);
                    existingUsers = { data: [] };
                }
            } else {
                existingUsers = { data: [] };
            }
        }
        
        let user = existingUsers.data ? existingUsers.data.find(u => u.student_number === studentNumber) : null;
        
        if (user) {
            console.log('✅ 기존 사용자 발견:', user);
            
            // Update existing user
            user.name = studentName;
            user.is_active = true;
            
            // 기존 사용자의 포인트 필드를 새 시스템으로 마이그레이션
            if (!user.purchase_points && user.points) {
                user.purchase_points = user.points;
                user.sales_earnings = 0;
            } else if (!user.purchase_points) {
                user.purchase_points = 10000;
                user.sales_earnings = 0;
            }
            
            try {
                await updateRecord('users', user.id, user);
            } catch (error) {
                console.error('사용자 업데이트 실패:', error);
            }
        } else {
            console.log('🆕 새 사용자 생성');
            
            // Create new user
            try {
                user = await createRecord('users', {
                    name: studentName,
                    student_number: studentNumber,
                    purchase_points: 10000,
                    sales_earnings: 0,
                    role: 'student',
                    is_active: true
                });
            } catch (error) {
                console.error('새 사용자 생성 실패:', error);
                // 오프라인 모드로 생성
                user = {
                    id: 'temp_' + Date.now(),
                    name: studentName,
                    student_number: studentNumber,
                    purchase_points: 10000,
                    sales_earnings: 0,
                    role: 'student',
                    is_active: true
                };
            }
        }
        
        console.log('✅ 로그인 성공:', user);
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateUserInfo();
        showMessage('🎉 창건샘의 How Much 마켓에 오신 것을 환영합니다! 🎊', 'success');
        
    } catch (error) {
        console.error('❌ Login error:', error);
        
        // 오프라인 모드로 로그인 시도
        const offlineUser = {
            id: 'offline_' + Date.now(),
            name: studentName,
            student_number: studentNumber,
            purchase_points: 10000,
            sales_earnings: 0,
            role: 'student',
            is_active: true
        };
        
        currentUser = offlineUser;
        localStorage.setItem('currentUser', JSON.stringify(offlineUser));
        showMainApp();
        updateUserInfo();
        showMessage('오프라인 모드로 로그인되었습니다. 일부 기능이 제한될 수 있습니다.', 'info');
    }
}

async function teacherLogin() {
    const password = prompt('Enter teacher password:');
    if (password === 'teacher123') { // Simple password for demo
        try {
            let teacher = await createRecord('users', {
                name: 'Teacher',
                student_number: '0000',
                purchase_points: 999999,
                sales_earnings: 999999,
                role: 'teacher',
                is_active: true
            });
            
            currentUser = teacher;
            isTeacher = true;
            localStorage.setItem('currentUser', JSON.stringify(teacher));
            showMainApp();
            updateUserInfo();
            showTeacherModal();
        } catch (error) {
            console.error('Teacher login error:', error);
            showMessage('선생님 로그인에 실패했습니다', 'error');
        }
    } else {
        showMessage('잘못된 비밀번호입니다', 'error');
    }
}

function logout() {
    if (currentUser) {
        try {
            updateRecord('users', currentUser.id, { ...currentUser, is_active: false });
        } catch (error) {
            console.log('로그아웃 업데이트 실패:', error);
        }
    }
    currentUser = null;
    isTeacher = false;
    localStorage.removeItem('currentUser');
    
    const loginSection = document.getElementById('login-section');
    const mainApp = document.getElementById('main-app');
    const userInfo = document.getElementById('user-info');
    const studentNumber = document.getElementById('student-number');
    const studentName = document.getElementById('student-name');
    
    if (loginSection) loginSection.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (studentNumber) studentNumber.value = '';
    if (studentName) studentName.value = '';
}

// UI Control Functions
function showMainApp() {
    const loginSection = document.getElementById('login-section');
    const mainApp = document.getElementById('main-app');
    
    if (loginSection) loginSection.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
    
    loadMarketplace();
    loadMyItems();
    loadTransactionHistory();
}

function updateUserInfo() {
    if (!currentUser) {
        const userInfo = document.getElementById('user-info');
        if (userInfo) userInfo.style.display = 'none';
        return;
    }
    
    try {
        // 포인트 필드가 존재하는지 확인하고 기본값 설정
        const purchasePoints = currentUser.purchase_points || currentUser.points || 10000;
        const salesEarnings = currentUser.sales_earnings || 0;
        
        // 레벨 시스템 적용
        const userLevel = getUserLevel(salesEarnings);
        const levelText = getLevelText(userLevel);
        
        // 이름과 레벨 뱃지를 함께 표시
        const nameElement = document.getElementById('user-name');
        if (nameElement) {
            nameElement.innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
        }
        
        const purchasePointsElement = document.getElementById('user-purchase-points');
        const salesEarningsElement = document.getElementById('user-sales-earnings');
        const userInfo = document.getElementById('user-info');
        
        if (purchasePointsElement) purchasePointsElement.textContent = purchasePoints.toLocaleString();
        if (salesEarningsElement) salesEarningsElement.textContent = salesEarnings.toLocaleString();
        if (userInfo) userInfo.style.display = 'flex';
        
        // 반 정보 업데이트
        if (typeof updateClassInfo === 'function') {
            updateClassInfo();
        }
        
        // currentUser 객체도 업데이트해서 이후 로직에서 사용할 수 있도록
        if (!currentUser.purchase_points) {
            currentUser.purchase_points = purchasePoints;
        }
        if (!currentUser.sales_earnings) {
            currentUser.sales_earnings = salesEarnings;
        }
    } catch (error) {
        console.error('사용자 정보 업데이트 오류:', error);
    }
}

function showTab(tabName) {
    try {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        
        // Remove active class from all buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const targetTab = document.getElementById(`tab-${tabName}`);
        if (targetTab) {
            targetTab.style.display = 'block';
        }
        
        // Add active class to selected button
        if (event && event.target) {
            event.target.classList.add('active');
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

// Drawing Functions
function initializeDrawing() {
    try {
        canvas = document.getElementById('drawing-canvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            // Mouse events
            canvas.addEventListener('mousedown', startDrawing);
            canvas.addEventListener('mousemove', draw);
            canvas.addEventListener('mouseup', stopDrawing);
            canvas.addEventListener('mouseout', stopDrawing);
            
            // Touch events for mobile
            canvas.addEventListener('touchstart', handleTouch);
            canvas.addEventListener('touchmove', handleTouch);
            canvas.addEventListener('touchend', stopDrawing);
        }
    } catch (error) {
        console.error('드로잉 초기화 오류:', error);
    }
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing || !ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    if (isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = brushSize * 2; // 지우개는 브러시보다 크게
    } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor;
        ctx.lineWidth = brushSize;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (isDrawing) {
        ctx.beginPath();
        isDrawing = false;
    }
}

function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                     e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

function clearCanvas() {
    if (ctx && canvas) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 캔버스 배경을 하얀으로 설정
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// 색상 팔레트 초기화
function initializeColorPalette() {
    try {
        // 색상 옵션 클릭 이벤트
        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', function() {
                selectColor(this.dataset.color);
            });
        });
        
        // 브러시 크기 슬라이더
        const brushSizeSlider = document.getElementById('brush-size');
        if (brushSizeSlider) {
            brushSizeSlider.addEventListener('input', function() {
                brushSize = parseInt(this.value);
                const brushSizeDisplay = document.getElementById('brush-size-display');
                if (brushSizeDisplay) {
                    brushSizeDisplay.textContent = brushSize;
                }
            });
        }
        
        // 기본 색상 선택 (검정)
        selectColor('#000000');
    } catch (error) {
        console.error('색상 팔레트 초기화 오류:', error);
    }
}

// 색상 선택 함수
function selectColor(color) {
    currentColor = color;
    isEraser = false;
    
    try {
        // 모든 색상 옵션에서 선택 해제
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('ring-4', 'ring-blue-500');
        });
        
        // 선택된 색상에 테두리 추가
        const selectedOption = document.querySelector(`[data-color="${color}"]`);
        if (selectedOption) {
            selectedOption.classList.add('ring-4', 'ring-blue-500');
        }
        
        // 현재 색상 표시 업데이트
        const currentColorElement = document.getElementById('current-color');
        const currentColorNameElement = document.getElementById('current-color-name');
        
        if (currentColorElement) {
            currentColorElement.style.backgroundColor = color;
        }
        if (currentColorNameElement) {
            currentColorNameElement.textContent = colorNames[color] || '사용자 지정';
        }
        
        // 지우개 버튼 상태 변경
        const eraserBtn = document.getElementById('eraser-btn');
        if (eraserBtn) {
            eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
            eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
            eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
        }
    } catch (error) {
        console.error('색상 선택 오류:', error);
    }
}

// 지우개 토글
function toggleEraser() {
    isEraser = !isEraser;
    const eraserBtn = document.getElementById('eraser-btn');
    
    if (!eraserBtn) return;
    
    try {
        if (isEraser) {
            // 지우개 모드 활성화
            eraserBtn.classList.remove('bg-yellow-500', 'hover:bg-yellow-600');
            eraserBtn.classList.add('bg-blue-500', 'hover:bg-blue-600');
            eraserBtn.innerHTML = '<i class="fas fa-paint-brush mr-1"></i>그리기';
            
            // 모든 색상 선택 해제
            document.querySelectorAll('.color-option').forEach(option => {
                option.classList.remove('ring-4', 'ring-blue-500');
            });
            
            // 현재 상태 표시
            const currentColorElement = document.getElementById('current-color');
            const currentColorNameElement = document.getElementById('current-color-name');
            
            if (currentColorElement) {
                currentColorElement.style.backgroundColor = '#CCCCCC';
            }
            if (currentColorNameElement) {
                currentColorNameElement.textContent = '지우개 모드';
            }
            
        } else {
            // 그리기 모드로 복귀
            selectColor(currentColor);
        }
    } catch (error) {
        console.error('지우개 토글 오류:', error);
    }
}

// Marketplace Functions
async function loadMarketplace() {
    try {
        console.log('🛒 마켓플레이스 로딩 중...');
        
        const itemsGrid = document.getElementById('items-grid');
        if (!itemsGrid) return;
        
        let items, users;
        
        try {
            items = await fetchTableData('items');
            users = await fetchTableData('users');
            
            console.log('📦 아이템 데이터:', items);
            console.log('👥 사용자 데이터:', users);
        } catch (error) {
            console.log('데이터 로딩 실패, 빈 상태로 시작:', error);
            items = { data: [] };
            users = { data: [] };
        }
        
        // 반별 필터링 적용
        let availableItems = items.data ? items.data.filter(item => {
            // 판매 가능한 상태인지 확인
            if (item.status !== 'available') return false;
            
            // 현재 사용자가 있다면 자신의 아이템은 제외
            if (currentUser && item.seller_id === currentUser.id) return false;
            
            return true;
        }) : [];
        
        // 같은 반 아이템들만 필터링 (선생님은 모든 아이템 볼 수 있음)
        if (typeof filterSameClassItems === 'function') {
            availableItems = filterSameClassItems(availableItems, users.data || []);
        }
        
        console.log('✅ 판매 가능한 아이템:', availableItems.length);
        
        itemsGrid.innerHTML = '';
        
        if (availableItems.length === 0) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요. 처음으로 무언가를 판매해보세요!</div>';
            return;
        }
        
        availableItems.forEach(item => {
            const seller = users.data ? users.data.find(u => u.id === item.seller_id) : null;
            const itemCard = createItemCard(item, seller);
            itemsGrid.appendChild(itemCard);
        });
        
    } catch (error) {
        console.error('❌ Error loading marketplace:', error);
        const itemsGrid = document.getElementById('items-grid');
        if (itemsGrid) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">마켓플레이스 로딩 중 오류가 발생했습니다.</div>';
        }
    }
}

function createItemCard(item, seller, showActions = true, isMyItem = false) {
    const card = document.createElement('div');
    
    try {
        // 가격에 따른 카드 등급 결정
        const rarity = getItemRarity(item.price);
        card.className = `item-card slide-in ${rarity}`;
        
        const canAfford = currentUser && currentUser.purchase_points >= item.price;
        const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
        const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '구매 포인트 부족';
        
        card.innerHTML = `
            <div class="relative">
                <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
                <img src="${item.image_url}" alt="${item.name}" class="item-image" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuydtOuvuOyngDwvdGV4dD48L3N2Zz4=';">
                ${item.status === 'sold' ? '<div class="sold-overlay">SOLD</div>' : ''}
            </div>
            <div class="item-info">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold text-gray-900 truncate">${item.name}</h4>
                    <span class="category-badge category-${item.category}">${categoryNames[item.category] || item.category}</span>
                </div>
                <p class="text-gray-600 text-sm mb-3 line-clamp-2">${item.description}</p>
                <div class="flex justify-between items-center mb-3">
                    <span class="price-tag">
                        <i class="fas fa-coins mr-1"></i>
                        ${item.price} 포인트
                    </span>
                    <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : '알 수 없음'}</span>
                </div>
                ${showActions && currentUser && item.status === 'available' ? `
                    ${isMyItem ? `
                        <button onclick="openEditModal('${item.id}')" 
                                class="w-full cute-btn py-2 px-4 rounded-full mb-2 font-bold">
                            ✏️ 수정하기
                        </button>
                    ` : `
                        <button onclick="openPurchaseModal('${item.id}')" 
                                class="${buyButtonClass}" 
                                ${!canAfford ? 'disabled' : ''}>
                            <i class="fas fa-shopping-cart mr-1"></i>
                            ${buyButtonText}
                        </button>
                    `}
                ` : ''}
            </div>
        `;
    } catch (error) {
        console.error('아이템 카드 생성 오류:', error);
        card.innerHTML = '<div class="p-4 text-red-500">아이템 로딩 오류</div>';
    }
    
    return card;
}

// My Items Functions
async function loadMyItems() {
    // 구현 예정
}

// Transaction History Functions
async function loadTransactionHistory() {
    // 구현 예정
}

// Utility Functions
function showMessage(message, type = 'info') {
    try {
        const messageDiv = document.createElement('div');
        messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm message-${type}`;
        
        let iconClass = 'fa-info-circle';
        if (type === 'success') iconClass = 'fa-check-circle';
        else if (type === 'error') iconClass = 'fa-exclamation-circle';
        
        messageDiv.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${iconClass} mr-2"></i>
                <span>${message}</span>
            </div>
        `;
        
        // 스타일 적용
        if (type === 'success') {
            messageDiv.style.backgroundColor = '#10B981';
            messageDiv.style.color = 'white';
        } else if (type === 'error') {
            messageDiv.style.backgroundColor = '#EF4444';
            messageDiv.style.color = 'white';
        } else {
            messageDiv.style.backgroundColor = '#3B82F6';
            messageDiv.style.color = 'white';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    } catch (error) {
        console.error('메시지 표시 오류:', error);
        alert(message); // 폴백으로 alert 사용
    }
}

async function createRecord(tableName, data, retryCount = 0) {
    const maxRetries = 2;
    const apiUrl = `${API_BASE_URL}tables/${tableName}`;
    
    try {
        console.log('🔗 API 생성 호출:', {
            url: apiUrl,
            tableName,
            data,
            attempt: retryCount + 1
        });
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        console.log('📊 생성 응답 상태:', {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            ok: response.ok
        });
        
        if (!response.ok) {
            const errorText = await response.text().catch(() => '응답 텍스트를 읽을 수 없음');
            throw new Error(`HTTP ${response.status}: ${response.statusText}\n응답: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ 생성 성공:', result);
        return result;
        
    } catch (error) {
        console.error(`❌ 생성 오류 (시도 ${retryCount + 1}/${maxRetries + 1}):`, {
            tableName,
            error: error.message,
            data
        });
        
        if (retryCount < maxRetries && (
            error.message.includes('fetch') || 
            error.message.includes('network') ||
            error.message.includes('Failed to fetch')
        )) {
            console.log(`🔄 ${retryCount + 2}초 후 재시도...`);
            await new Promise(resolve => setTimeout(resolve, (retryCount + 2) * 1000));
            return createRecord(tableName, data, retryCount + 1);
        }
        
        throw error;
    }
}

async function updateRecord(tableName, recordId, data) {
    try {
        console.log('🔗 API 업데이트:', `tables/${tableName}/${recordId}`, data);
        
        const response = await fetch(`tables/${tableName}/${recordId}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        console.log('✅ 업데이트 완료:', result);
        return result;
    } catch (error) {
        console.error(`❌ Error updating ${tableName} record:`, error);
        throw error;
    }
}

// 구매 요청 시스템
let selectedItemForPurchase = null;

function openPurchaseModal(itemId) {
    try {
        console.log('🛒 구매 모달 열기:', itemId);
        
        // 아이템 정보 찾기
        const itemsGrid = document.getElementById('items-grid');
        const itemCards = itemsGrid ? itemsGrid.querySelectorAll('.item-card') : [];
        let targetItem = null;
        
        // 현재 로딩된 아이템들에서 찾기 (임시 방법)
        // 향후 전역 아이템 저장소 또는 API 재호출로 개선
        for (const card of itemCards) {
            const buyButton = card.querySelector(`button[onclick*="${itemId}"]`);
            if (buyButton) {
                // 카드에서 정보 추출
                const nameElement = card.querySelector('.font-semibold');
                const priceElement = card.querySelector('.price-tag');
                const sellerElement = card.querySelector('.text-xs.text-gray-500');
                
                if (nameElement && priceElement && sellerElement) {
                    targetItem = {
                        id: itemId,
                        name: nameElement.textContent.trim(),
                        price: parseInt(priceElement.textContent.match(/\d+/)[0]),
                        seller: sellerElement.textContent.replace('판매자: ', '').trim()
                    };
                }
                break;
            }
        }
        
        if (!targetItem) {
            showMessage('아이템 정보를 불러올 수 없습니다', 'error');
            return;
        }
        
        selectedItemForPurchase = targetItem;
        
        // 모달에 정보 채우기
        const purchaseDetails = document.getElementById('purchase-details');
        if (purchaseDetails) {
            purchaseDetails.innerHTML = `
                <div class="space-y-4">
                    <div class="border rounded-lg p-4 bg-gray-50">
                        <h4 class="font-semibold text-lg mb-2">${targetItem.name}</h4>
                        <div class="flex justify-between items-center mb-3">
                            <span class="text-sm text-gray-600">판매자: ${targetItem.seller}</span>
                            <span class="font-bold text-lg text-blue-600">${targetItem.price} P</span>
                        </div>
                    </div>
                    
                    <div class="space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                💰 제안하고 싶은 가격 (선택사항)
                            </label>
                            <input type="number" id="offered-price" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                   placeholder="${targetItem.price}" 
                                   value="${targetItem.price}"
                                   min="1" max="99999">
                            <div class="text-xs text-gray-500 mt-1">
                                다른 가격을 제안하면 판매자가 검토 후 수락/거절할 수 있습니다
                            </div>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                💌 판매자에게 메시지 (선택사항)
                            </label>
                            <textarea id="buyer-message" 
                                      class="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" 
                                      rows="3" 
                                      placeholder="예: 정말 갖고 싶어요! 조금 깎아주실 수 있나요?"></textarea>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // 모달 표시
        const modal = document.getElementById('purchase-modal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
        
    } catch (error) {
        console.error('❌ 구매 모달 오류:', error);
        showMessage('구매 모달을 열 수 없습니다', 'error');
    }
}

function closePurchaseModal() {
    try {
        const modal = document.getElementById('purchase-modal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
        selectedItemForPurchase = null;
        
        // 입력 필드 초기화
        const offeredPrice = document.getElementById('offered-price');
        const buyerMessage = document.getElementById('buyer-message');
        if (offeredPrice) offeredPrice.value = '';
        if (buyerMessage) buyerMessage.value = '';
        
    } catch (error) {
        console.error('❌ 구매 모달 닫기 오류:', error);
    }
}

async function confirmPurchase() {
    if (!selectedItemForPurchase || !currentUser) {
        showMessage('구매 정보가 없습니다', 'error');
        return;
    }
    
    try {
        const offeredPriceInput = document.getElementById('offered-price');
        const buyerMessageInput = document.getElementById('buyer-message');
        
        const offeredPrice = offeredPriceInput ? parseInt(offeredPriceInput.value) || selectedItemForPurchase.price : selectedItemForPurchase.price;
        const buyerMessage = buyerMessageInput ? buyerMessageInput.value.trim() : '';
        
        // 구매 포인트 확인
        if (currentUser.purchase_points < offeredPrice) {
            showMessage('구매 포인트가 부족합니다', 'error');
            return;
        }
        
        showMessage('구매 요청을 전송하는 중...', 'info');
        
        // 구매 요청 생성
        const purchaseRequest = {
            buyer_id: currentUser.id,
            buyer_name: currentUser.name,
            seller_id: 'seller_id_placeholder', // 실제로는 아이템에서 가져와야 함
            seller_name: selectedItemForPurchase.seller,
            item_id: selectedItemForPurchase.id,
            item_name: selectedItemForPurchase.name,
            original_price: selectedItemForPurchase.price,
            offered_price: offeredPrice,
            buyer_message: buyerMessage,
            status: 'pending',
            request_time: new Date().toISOString()
        };
        
        // 동일 가격이면 즉시 거래 완료
        if (offeredPrice === selectedItemForPurchase.price && !buyerMessage) {
            await processInstantPurchase(purchaseRequest);
        } else {
            await createRecord('purchase_requests', purchaseRequest);
            showMessage(`🎯 구매 요청을 ${selectedItemForPurchase.seller}님에게 전송했습니다!`, 'success');
        }
        
        closePurchaseModal();
        
    } catch (error) {
        console.error('❌ 구매 요청 오류:', error);
        showMessage('구매 요청에 실패했습니다', 'error');
    }
}

// 즉시 구매 처리 (가격 변경 없음)
async function processInstantPurchase(purchaseRequest) {
    try {
        // 1. 거래 기록 생성
        const transaction = {
            buyer_id: purchaseRequest.buyer_id,
            seller_id: purchaseRequest.seller_id,
            item_id: purchaseRequest.item_id,
            amount: purchaseRequest.offered_price,
            transaction_time: new Date().toISOString()
        };
        
        await createRecord('transactions', transaction);
        
        // 2. 아이템 상태 변경 (sold)
        await updateRecord('items', purchaseRequest.item_id, {
            status: 'sold',
            buyer_id: purchaseRequest.buyer_id
        });
        
        // 3. 구매자 포인트 차감
        const newPurchasePoints = currentUser.purchase_points - purchaseRequest.offered_price;
        await updateRecord('users', currentUser.id, {
            purchase_points: newPurchasePoints
        });
        
        // 4. 판매자 수익 증가 (나중에 구현)
        
        showMessage(`🎉 "${purchaseRequest.item_name}"을(를) ${purchaseRequest.offered_price}P에 구매했습니다!`, 'success');
        
        // UI 새로고침
        currentUser.purchase_points = newPurchasePoints;
        updateUserInfo();
        await loadMarketplace();
        
    } catch (error) {
        console.error('❌ 즉시 구매 처리 오류:', error);
        throw error;
    }
}

// 더미 함수들
async function sellItem() { console.log('아이템 판매 기능 구현 예정'); }
function openEditModal(itemId) { console.log('수정 모달 열기:', itemId); }
function closeEditModal() { console.log('수정 모달 닫기'); }
async function updateItem() { console.log('아이템 업데이트 기능 구현 예정'); }
// 관리자 독립 대시보드 표시
async function showTeacherModal() {
    console.log('🎯 관리자 대시보드 열기');
    
    try {
        // 학생 화면 숨기기
        const loginScreen = document.getElementById('login-screen');
        const mainApp = document.getElementById('main-app');
        if (loginScreen) loginScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
        
        // 관리자 대시보드 표시
        const adminDashboard = document.getElementById('admin-dashboard');
        if (adminDashboard) {
            adminDashboard.classList.remove('hidden');
            
            // 관리자 데이터 로드
            await loadAdminDashboard();
            
            console.log('✅ 관리자 대시보드 열기 완료');
        } else {
            console.error('❌ admin-dashboard 엘리먼트를 찾을 수 없습니다');
        }
    } catch (error) {
        console.error('❌ 관리자 대시보드 열기 오류:', error);
        showMessage('관리자 대시보드를 열 수 없습니다', 'error');
    }
}

// 관리자 모드 종료 (학생 화면으로 복귀)
function exitAdminMode() {
    console.log('🏠 관리자 모드 종료');
    
    // 관리자 대시보드 숨기기
    const adminDashboard = document.getElementById('admin-dashboard');
    if (adminDashboard) {
        adminDashboard.classList.add('hidden');
    }
    
    // 학생 화면 표시
    showMainApp();
    
    showMessage('학생 화면으로 돌아갔습니다', 'success');
}

// 관리자 대시보드 데이터 로드
async function loadAdminDashboard() {
    console.log('📊 관리자 대시보드 데이터 로드 시작');
    
    try {
        // 병렬로 모든 데이터 로드
        await Promise.all([
            loadAdminStudentsList(),
            loadAdminItemsList(),
            loadRecentTransactions(),
            loadMarketStatistics()
        ]);
        
        // 시스템 관리 기능 초기화
        if (typeof initializeSystemAdmin === 'function') {
            initializeSystemAdmin();
        }
        
        console.log('✅ 관리자 대시보드 데이터 로드 완료');
        
    } catch (error) {
        console.error('❌ 관리자 대시보드 데이터 로드 오류:', error);
        showMessage('일부 데이터를 불러오지 못했습니다', 'warning');
    }
}
function closeTeacherModal() {
    console.log('🚪 선생님 모달 닫기');
    const modal = document.getElementById('teacher-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
// 학생 목록 로드 함수
async function loadStudentsList() {
    console.log('👥 학생 목록 로드 시작');
    
    try {
        const usersData = await fetchTableData('users');
        console.log('📊 사용자 데이터:', usersData);
        
        const studentsList = document.getElementById('students-list');
        if (!studentsList) {
            console.error('❌ students-list 엘리먼트를 찾을 수 없습니다');
            return;
        }
        
        if (!usersData.data || usersData.data.length === 0) {
            studentsList.innerHTML = '<p class="text-gray-500">등록된 학생이 없습니다</p>';
            return;
        }
        
        // 선생님 제외하고 학생만 필터링
        const students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p class="text-gray-500">등록된 학생이 없습니다</p>';
            return;
        }
        
        // 판매 수익 기준으로 내림차순 정렬
        students.sort((a, b) => (b.sales_earnings || 0) - (a.sales_earnings || 0));
        
        studentsList.innerHTML = students.map((student, index) => {
            const level = getUserLevel(student.sales_earnings || 0);
            return `
                <div class="bg-gray-50 p-3 rounded flex justify-between items-center">
                    <div>
                        <span class="font-medium">${index + 1}등. ${student.name}</span>
                        <span class="text-sm text-gray-600">(${student.student_number})</span>
                        <div class="text-sm">
                            <span class="text-blue-600">구매: ${(student.purchase_points || 0).toLocaleString()}P</span>
                            <span class="ml-2 text-green-600">판매: ${(student.sales_earnings || 0).toLocaleString()}P</span>
                            <span class="ml-2 ${level.color}">${level.name}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ ${students.length}명의 학생 목록 로드 완료`);
        
    } catch (error) {
        console.error('❌ 학생 목록 로드 오류:', error);
        const studentsList = document.getElementById('students-list');
        if (studentsList) {
            studentsList.innerHTML = '<p class="text-red-500">학생 목록을 불러올 수 없습니다</p>';
        }
    }
}

// 전체 아이템 목록 로드 함수
async function loadAllItems() {
    console.log('📦 전체 아이템 목록 로드 시작');
    
    try {
        const itemsData = await fetchTableData('items');
        console.log('📊 아이템 데이터:', itemsData);
        
        const itemsList = document.getElementById('all-items-list');
        if (!itemsList) {
            console.log('⚠️ all-items-list 엘리먼트가 없습니다 (선택사항)');
            return;
        }
        
        if (!itemsData.data || itemsData.data.length === 0) {
            itemsList.innerHTML = '<p class="text-gray-500">등록된 아이템이 없습니다</p>';
            return;
        }
        
        // 최신순으로 정렬
        const items = itemsData.data.sort((a, b) => 
            new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );
        
        itemsList.innerHTML = items.map(item => {
            const rarity = getItemRarity(item.price);
            const rarityText = getRarityText(rarity);
            
            return `
                <div class="bg-gray-50 p-3 rounded">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="font-medium">${item.name}</h5>
                            <p class="text-sm text-gray-600">${item.description || '설명 없음'}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-lg font-bold text-blue-600">${item.price}P</span>
                                <span class="text-sm ${rarity}-rarity">${rarityText}</span>
                                <span class="text-sm text-gray-500">${item.status || 'available'}</span>
                            </div>
                        </div>
                        <div class="flex gap-1">
                            <button onclick="deleteItemAsTeacher('${item.id}')" 
                                    class="text-red-500 hover:text-red-700 text-sm px-2 py-1 rounded">
                                삭제
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ ${items.length}개의 아이템 목록 로드 완료`);
        
    } catch (error) {
        console.error('❌ 아이템 목록 로드 오류:', error);
        const itemsList = document.getElementById('all-items-list');
        if (itemsList) {
            itemsList.innerHTML = '<p class="text-red-500">아이템 목록을 불러올 수 없습니다</p>';
        }
    }
}
// 선생님용 아이템 삭제 함수
async function deleteItemAsTeacher(itemId) {
    console.log('🗑️ 선생님이 아이템 삭제 시도:', itemId);
    
    if (!confirm('정말로 이 아이템을 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        // 아이템 삭제 (실제로는 상태 변경)
        await updateRecord('items', itemId, {
            status: 'deleted'
        });
        
        showMessage('아이템이 삭제되었습니다', 'success');
        await loadAllItems(); // 목록 새로고침
        
    } catch (error) {
        console.error('❌ 아이템 삭제 오류:', error);
        showMessage('아이템 삭제에 실패했습니다', 'error');
    }
}
async function resetAllPoints() {
    console.log('🔄 전체 포인트 리셋 시작');
    
    if (!confirm('정말로 모든 학생의 구매 포인트를 10,000으로 초기화하시겠습니까?')) {
        return;
    }
    
    try {
        // 모든 사용자 데이터 가져오기
        const usersData = await fetchTableData('users');
        console.log('👥 전체 사용자:', usersData);
        
        if (!usersData.data || usersData.data.length === 0) {
            showMessage('초기화할 학생이 없습니다', 'warning');
            return;
        }
        
        let resetCount = 0;
        
        // 각 학생의 포인트 초기화 (선생님 제외)
        for (const user of usersData.data) {
            if (user.student_number !== '0000' && !user.is_teacher) {
                try {
                    const updatedUser = await updateRecord('users', user.id, {
                        ...user,
                        purchase_points: 10000
                    });
                    console.log(`✅ ${user.name}(${user.student_number}) 포인트 초기화 완료`);
                    resetCount++;
                } catch (error) {
                    console.error(`❌ ${user.name} 포인트 초기화 실패:`, error);
                }
            }
        }
        
        showMessage(`${resetCount}명의 학생 포인트를 초기화했습니다`, 'success');
        await loadStudentsList(); // 목록 새로고침
        
    } catch (error) {
        console.error('❌ 포인트 초기화 오류:', error);
        showMessage('포인트 초기화에 실패했습니다', 'error');
    }
}
function printRanking() { console.log('랭킹 출력 기능 예정'); }

// ===== 포인트 관리 시스템 =====

let currentEditingStudentId = null;
let currentEditingStudentData = null;

// 포인트 수정 모달 열기
async function showEditPointsModal(studentId, studentName) {
    console.log('✏️ 포인트 수정 모달 열기:', studentId, studentName);
    
    try {
        // 학생 데이터 가져오기
        const usersData = await fetchTableData('users');
        const student = usersData.data.find(u => u.id === studentId);
        
        if (!student) {
            showMessage('학생 정보를 찾을 수 없습니다', 'error');
            return;
        }
        
        currentEditingStudentId = studentId;
        currentEditingStudentData = student;
        
        // 모달 정보 설정
        document.getElementById('edit-student-name').textContent = studentName;
        document.getElementById('current-purchase-points').textContent = `${(student.purchase_points || 0).toLocaleString()}P`;
        document.getElementById('current-sales-earnings').textContent = `${(student.sales_earnings || 0).toLocaleString()}P`;
        
        // 입력 필드 초기화
        document.getElementById('new-purchase-points').value = student.purchase_points || 0;
        document.getElementById('point-adjustment').value = '';
        document.getElementById('point-change-reason').value = '';
        
        // 모달 표시
        const modal = document.getElementById('edit-points-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
    } catch (error) {
        console.error('❌ 포인트 수정 모달 열기 오류:', error);
        showMessage('포인트 수정 모달을 열 수 없습니다', 'error');
    }
}

// 포인트 수정 모달 닫기
function closeEditPointsModal() {
    const modal = document.getElementById('edit-points-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    currentEditingStudentId = null;
    currentEditingStudentData = null;
}

// 포인트 조정 (지급/차감)
async function adjustPoints(action) {
    const adjustmentInput = document.getElementById('point-adjustment');
    const adjustment = parseInt(adjustmentInput.value);
    
    if (!adjustment || adjustment === 0) {
        showMessage('조정할 포인트를 입력해주세요', 'warning');
        return;
    }
    
    const currentPoints = currentEditingStudentData.purchase_points || 0;
    let newPoints;
    
    if (action === 'add') {
        newPoints = currentPoints + Math.abs(adjustment);
    } else if (action === 'subtract') {
        newPoints = Math.max(0, currentPoints - Math.abs(adjustment));
    }
    
    // 직접 설정 필드에 새 값 설정
    document.getElementById('new-purchase-points').value = newPoints;
    document.getElementById('current-purchase-points').textContent = `${newPoints.toLocaleString()}P`;
    
    const actionText = action === 'add' ? '지급' : '차감';
    showMessage(`${Math.abs(adjustment).toLocaleString()}P ${actionText} 적용됨 (저장 버튼을 눌러 확정)`, 'info');
}

// 포인트 변경 저장
async function savePointChanges() {
    if (!currentEditingStudentId || !currentEditingStudentData) {
        showMessage('잘못된 접근입니다', 'error');
        return;
    }
    
    const newPurchasePoints = parseInt(document.getElementById('new-purchase-points').value);
    const reason = document.getElementById('point-change-reason').value || '관리자 수정';
    
    if (isNaN(newPurchasePoints) || newPurchasePoints < 0) {
        showMessage('올바른 포인트 값을 입력해주세요', 'warning');
        return;
    }
    
    try {
        const oldPoints = currentEditingStudentData.purchase_points || 0;
        const pointDiff = newPurchasePoints - oldPoints;
        
        // 사용자 데이터 업데이트
        await updateRecord('users', currentEditingStudentId, {
            ...currentEditingStudentData,
            purchase_points: newPurchasePoints
        });
        
        // 변경 이력 저장
        await savePointChangeHistory(
            currentEditingStudentId, 
            currentEditingStudentData.name,
            oldPoints, 
            newPurchasePoints, 
            pointDiff, 
            reason
        );
        
        showMessage(`${currentEditingStudentData.name}의 포인트가 수정되었습니다`, 'success');
        closeEditPointsModal();
        
        // 학생 목록 새로고침
        await loadAdminStudentsList();
        
    } catch (error) {
        console.error('❌ 포인트 변경 저장 오류:', error);
        showMessage('포인트 변경 저장에 실패했습니다', 'error');
    }
}

// 포인트 변경 이력 저장
async function savePointChangeHistory(studentId, studentName, oldPoints, newPoints, pointDiff, reason) {
    try {
        await createRecord('point_history', {
            student_id: studentId,
            student_name: studentName,
            old_points: oldPoints,
            new_points: newPoints,
            point_difference: pointDiff,
            reason: reason,
            changed_by: 'teacher',
            change_time: new Date().toISOString()
        });
        
        console.log('✅ 포인트 변경 이력 저장 완료');
    } catch (error) {
        console.error('❌ 포인트 변경 이력 저장 오류:', error);
        // 이력 저장 실패해도 포인트 변경은 완료되도록
    }
}

// 포인트 변경 이력 모달 열기
async function showPointHistoryModal(studentId, studentName) {
    console.log('📋 포인트 변경 이력 모달 열기:', studentId, studentName);
    
    try {
        // 모달 정보 설정
        document.getElementById('history-student-name').textContent = studentName;
        
        // 모달 표시
        const modal = document.getElementById('point-history-modal');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 이력 로드
        await loadPointHistory(studentId);
        
    } catch (error) {
        console.error('❌ 포인트 이력 모달 열기 오류:', error);
        showMessage('포인트 이력을 불러올 수 없습니다', 'error');
    }
}

// 포인트 변경 이력 로드
async function loadPointHistory(studentId) {
    try {
        const historyData = await fetchTableData('point_history');
        const historyList = document.getElementById('point-history-list');
        
        if (!historyData.data || historyData.data.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 text-center py-4">변경 이력이 없습니다</p>';
            return;
        }
        
        // 해당 학생의 이력만 필터링하고 최신순 정렬
        const studentHistory = historyData.data
            .filter(h => h.student_id === studentId)
            .sort((a, b) => new Date(b.change_time || 0) - new Date(a.change_time || 0));
        
        if (studentHistory.length === 0) {
            historyList.innerHTML = '<p class="text-gray-500 text-center py-4">변경 이력이 없습니다</p>';
            return;
        }
        
        historyList.innerHTML = studentHistory.map(history => {
            const changeTime = new Date(history.change_time);
            const timeString = changeTime.toLocaleDateString() + ' ' + changeTime.toLocaleTimeString();
            const diffText = history.point_difference > 0 ? 
                `+${history.point_difference.toLocaleString()}P` : 
                `${history.point_difference.toLocaleString()}P`;
            const diffColor = history.point_difference > 0 ? 'text-green-600' : 'text-red-600';
            
            return `
                <div class="border rounded p-3 bg-gray-50">
                    <div class="flex justify-between items-start">
                        <div>
                            <div class="font-medium">
                                ${history.old_points.toLocaleString()}P → ${history.new_points.toLocaleString()}P
                                <span class="${diffColor} font-bold">(${diffText})</span>
                            </div>
                            <div class="text-sm text-gray-600 mt-1">${history.reason}</div>
                        </div>
                        <div class="text-right text-sm text-gray-500">
                            <div>${timeString}</div>
                            <div>by ${history.changed_by}</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ 포인트 이력 로드 오류:', error);
        const historyList = document.getElementById('point-history-list');
        if (historyList) {
            historyList.innerHTML = '<p class="text-red-500 text-center py-4">이력을 불러올 수 없습니다</p>';
        }
    }
}

// 포인트 이력 모달 닫기
function closePointHistoryModal() {
    const modal = document.getElementById('point-history-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 전체 학생 포인트 지급 모달 열기
function showBulkPointGiveModal() {
    const modal = document.getElementById('bulk-point-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // 입력 필드 초기화
    document.getElementById('bulk-point-amount').value = '';
    document.getElementById('bulk-point-reason').value = '';
}

// 전체 학생 포인트 지급 모달 닫기
function closeBulkPointModal() {
    const modal = document.getElementById('bulk-point-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// 전체 학생 포인트 지급 실행
async function executeBulkPointGive() {
    const amount = parseInt(document.getElementById('bulk-point-amount').value);
    const reason = document.getElementById('bulk-point-reason').value || '관리자 일괄 지급';
    
    if (!amount || amount <= 0) {
        showMessage('올바른 포인트를 입력해주세요', 'warning');
        return;
    }
    
    if (!confirm(`모든 학생에게 ${amount.toLocaleString()}P를 지급하시겠습니까?`)) {
        return;
    }
    
    try {
        const usersData = await fetchTableData('users');
        const students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        let successCount = 0;
        
        for (const student of students) {
            try {
                const oldPoints = student.purchase_points || 0;
                const newPoints = oldPoints + amount;
                
                await updateRecord('users', student.id, {
                    ...student,
                    purchase_points: newPoints
                });
                
                // 이력 저장
                await savePointChangeHistory(
                    student.id,
                    student.name,
                    oldPoints,
                    newPoints,
                    amount,
                    reason
                );
                
                successCount++;
            } catch (error) {
                console.error(`❌ ${student.name} 포인트 지급 실패:`, error);
            }
        }
        
        showMessage(`${successCount}명의 학생에게 포인트를 지급했습니다`, 'success');
        closeBulkPointModal();
        await loadAdminStudentsList();
        
    } catch (error) {
        console.error('❌ 전체 포인트 지급 오류:', error);
        showMessage('포인트 지급에 실패했습니다', 'error');
    }
}

// 학생용 실시간 공지 시스템
let studentAnnouncementInterval = null;

function startStudentAnnouncementCheck() {
    if (studentAnnouncementInterval) {
        clearInterval(studentAnnouncementInterval);
    }
    
    studentAnnouncementInterval = setInterval(async () => {
        try {
            await checkForNewAnnouncements();
        } catch (error) {
            console.log('공지 확인 오류:', error);
        }
    }, 10000); // 10초마다 체크
}

async function checkForNewAnnouncements() {
    try {
        const announcementsData = await fetchTableData('announcements');
        
        if (!announcementsData.data) return;
        
        const now = new Date();
        const activeAnnouncements = announcementsData.data.filter(ann => {
            if (!ann.active) return false;
            if (ann.expires_at && new Date(ann.expires_at) < now) return false;
            
            // 최근 1분 내 생성된 공지만 표시 (실시간 성격)
            const created = new Date(ann.created_at);
            const diffMinutes = (now - created) / (1000 * 60);
            return diffMinutes < 1;
        });
        
        activeAnnouncements.forEach(ann => {
            showStudentAnnouncement(ann);
        });
        
    } catch (error) {
        console.log('공지 확인 실패:', error);
    }
}

function showStudentAnnouncement(announcement) {
    const container = document.getElementById('student-announcements');
    if (!container) return;
    
    const typeStyles = {
        'info': 'bg-blue-500 border-blue-600',
        'warning': 'bg-yellow-500 border-yellow-600', 
        'success': 'bg-green-500 border-green-600',
        'urgent': 'bg-red-500 border-red-600 animate-pulse'
    };
    
    const typeIcons = {
        'info': '📘',
        'warning': '⚠️', 
        'success': '✅',
        'urgent': '🚨'
    };
    
    const announcementDiv = document.createElement('div');
    announcementDiv.className = `${typeStyles[announcement.type] || typeStyles.info} text-white p-4 rounded-lg shadow-lg mb-3 border-l-4 slide-in-top`;
    announcementDiv.id = `announcement-${announcement.id}`;
    
    announcementDiv.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="flex items-start space-x-2">
                <span class="text-lg">${typeIcons[announcement.type] || '📘'}</span>
                <div>
                    <div class="font-bold text-sm">📢 선생님 공지</div>
                    <div class="text-sm mt-1">${announcement.message}</div>
                </div>
            </div>
            <button onclick="dismissAnnouncement('${announcement.id}')" 
                    class="text-white hover:text-gray-200 ml-2 text-lg">
                ✕
            </button>
        </div>
    `;
    
    container.appendChild(announcementDiv);
    
    // 자동 제거 (duration이 있는 경우)
    if (announcement.duration > 0) {
        setTimeout(() => {
            dismissAnnouncement(announcement.id);
        }, announcement.duration * 60 * 1000);
    }
    
    // 사운드 재생
    if (announcement.type === 'urgent') {
        playSound('error');
    } else {
        playSound('purchase');
    }
}

function dismissAnnouncement(announcementId) {
    const element = document.getElementById(`announcement-${announcementId}`);
    if (element) {
        element.style.transform = 'translateX(100%)';
        element.style.opacity = '0';
        setTimeout(() => {
            element.remove();
        }, 300);
    }
}

// 학생이 로그인할 때 공지 체크 시작
function initializeStudentFeatures() {
    if (currentUser && !isTeacher) {
        startStudentAnnouncementCheck();
        console.log('👥 학생용 실시간 기능 활성화됨');
    }
}

// 로그인 후 학생 기능 초기화 추가
const originalShowMainApp = showMainApp;
showMainApp = function() {
    originalShowMainApp();
    initializeStudentFeatures();
};

console.log('🎉 잉글리시 마켓 JavaScript 로딩 완료!');
