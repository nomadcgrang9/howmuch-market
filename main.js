// 잉글리시 마켓 - 메인 JavaScript 파일

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
            // 구매 성공 - 상승하는 멜로디
            createBeep(523.25, 0.15); // C5
            setTimeout(() => createBeep(659.25, 0.15), 100); // E5
            setTimeout(() => createBeep(783.99, 0.3), 200); // G5
            break;
            
        case 'legendary':
            // 전설급 - 화려한 멜로디
            createBeep(523.25, 0.1); // C5
            setTimeout(() => createBeep(659.25, 0.1), 50); // E5
            setTimeout(() => createBeep(783.99, 0.1), 100); // G5
            setTimeout(() => createBeep(1046.5, 0.3), 150); // C6
            break;
            
        case 'click':
            // 클릭 소리
            createBeep(800, 0.05, 0.05);
            break;
            
        case 'error':
            // 에러 소리 - 하강하는 톤
            createBeep(400, 0.2, 0.1, 'sawtooth');
            setTimeout(() => createBeep(300, 0.3, 0.1, 'sawtooth'), 100);
            break;
            
        case 'level-up':
            // 레벨업 - 트럼펫 같은 소리
            createBeep(523.25, 0.1);
            setTimeout(() => createBeep(659.25, 0.1), 80);
            setTimeout(() => createBeep(783.99, 0.1), 160);
            setTimeout(() => createBeep(1046.5, 0.4), 240);
            break;
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundIcon = document.getElementById('sound-icon');
    const soundText = document.getElementById('sound-text');
    const soundButton = document.getElementById('sound-toggle');
    
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

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
    initializeDrawing();
    initializeColorPalette();
    loadMarketplace();
    
    // 초기 상태에서는 사용자 정보 숨기기
    document.getElementById('user-info').style.display = 'none';
    
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
        updateUserInfo();
    }
});

// User Authentication Functions
async function login() {
    const studentNumberInput = document.getElementById('student-number').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    
    // 학번 검증: 4자리 숫자만 허용 (예: 4103)
    if (!studentNumberInput || !/^\d{4}$/.test(studentNumberInput)) {
        showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
        return;
    }
    
    const studentNumber = studentNumberInput;
    
    if (!studentName) {
        showMessage('이름을 입력해주세요', 'error');
        return;
    }
    
    try {
        // Check if user already exists
        const existingUsers = await fetchTableData('users');
        let user = existingUsers.data.find(u => u.student_number === studentNumber);
        
        if (user) {
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
            
            await updateRecord('users', user.id, user);
        } else {
            // Create new user
            user = await createRecord('users', {
                name: studentName,
                student_number: studentNumber,
                purchase_points: 10000,
                sales_earnings: 0,
                role: 'student',
                is_active: true
            });
        }
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateUserInfo();
        showMessage('🎉 창건샘의 How Much 마켓에 오신 것을 환영합니다! 🎊', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showMessage('로그인에 실패했습니다. 다시 시도해주세요.', 'error');
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
        updateRecord('users', currentUser.id, { ...currentUser, is_active: false });
    }
    currentUser = null;
    isTeacher = false;
    localStorage.removeItem('currentUser');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('user-info').style.display = 'none'; // 사용자 정보 숨기기
    document.getElementById('student-number').value = '';
    document.getElementById('student-name').value = '';
}

// UI Control Functions
function showMainApp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
    loadMarketplace();
    loadMyItems();
    loadTransactionHistory();
}

function updateUserInfo() {
    if (currentUser) {
        // 포인트 필드가 존재하는지 확인하고 기본값 설정
        const purchasePoints = currentUser.purchase_points || currentUser.points || 10000;
        const salesEarnings = currentUser.sales_earnings || 0;
        
        // 레벨 시스템 적용
        const userLevel = getUserLevel(salesEarnings);
        const levelText = getLevelText(userLevel);
        
        // 이름과 레벨 뱃지를 함께 표시
        const nameElement = document.getElementById('user-name');
        nameElement.innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
        
        document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
        document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
        document.getElementById('user-info').style.display = 'flex';
        
        // currentUser 객체도 업데이트해서 이후 로직에서 사용할 수 있도록
        if (!currentUser.purchase_points) {
            currentUser.purchase_points = purchasePoints;
        }
        if (!currentUser.sales_earnings) {
            currentUser.sales_earnings = salesEarnings;
        }
    } else {
        // 로그인하지 않은 상태에서는 사용자 정보 숨기기
        document.getElementById('user-info').style.display = 'none';
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // Add active class to selected button
    event.target.classList.add('active');
    
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
}

// Drawing Functions
function initializeDrawing() {
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
}

function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
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
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // 캔버스 배경을 하얀으로 설정
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// 색상 팔레트 초기화
function initializeColorPalette() {
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
            document.getElementById('brush-size-display').textContent = brushSize;
        });
    }
    
    // 기본 색상 선택 (검정)
    selectColor('#000000');
}

// 색상 선택 함수
function selectColor(color) {
    currentColor = color;
    isEraser = false;
    
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
    document.getElementById('current-color').style.backgroundColor = color;
    document.getElementById('current-color-name').textContent = colorNames[color] || '사용자 지정';
    
    // 지우개 버튼 상태 변경
    const eraserBtn = document.getElementById('eraser-btn');
    eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
}

// 지우개 토글
function toggleEraser() {
    isEraser = !isEraser;
    const eraserBtn = document.getElementById('eraser-btn');
    
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
        document.getElementById('current-color').style.backgroundColor = '#CCCCCC';
        document.getElementById('current-color-name').textContent = '지우개 모드';
        
    } else {
        // 그리기 모드로 복귀
        selectColor(currentColor);
    }
}

// Item Management Functions
async function sellItem() {
    if (!currentUser) {
        showMessage('먼저 로그인해주세요', 'error');
        return;
    }
    
    const form = document.getElementById('sell-form');
    const formData = new FormData(form);
    
    const itemName = document.getElementById('item-name').value.trim();
    const description = document.getElementById('item-description').value.trim();
    const price = parseInt(document.getElementById('item-price').value);
    const category = document.getElementById('item-category').value;
    
    if (!itemName || !price || price <= 0) {
        showMessage('모든 필수 정보를 입력해주세요', 'error');
        return;
    }
    
    // Convert canvas to image data
    const imageData = canvas.toDataURL('image/png');
    
    try {
        const item = await createRecord('items', {
            seller_id: currentUser.id,
            name: itemName,
            description: description,
            price: price,
            image_url: imageData,
            status: 'available',
            category: category
        });
        
        showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
        form.reset();
        clearCanvas();
        loadMarketplace();
        loadMyItems();
        
    } catch (error) {
        console.error('Error listing item:', error);
        showMessage('아이템 등록에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// Attach form submit event
document.getElementById('sell-form').addEventListener('submit', function(e) {
    e.preventDefault();
    sellItem();
});

// Marketplace Functions
async function loadMarketplace() {
    try {
        const items = await fetchTableData('items');
        const users = await fetchTableData('users');
        
        const availableItems = items.data.filter(item => {
            // 판매 가능한 상태인지 확인
            if (item.status !== 'available') return false;
            
            // 현재 사용자가 있다면 자신의 아이템은 제외
            if (currentUser && item.seller_id === currentUser.id) return false;
            
            return true;
        });
        
        console.log('Available items:', availableItems.length);
        
        const itemsGrid = document.getElementById('items-grid');
        itemsGrid.innerHTML = '';
        
        if (availableItems.length === 0) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요. 처음으로 무언가를 판매해보세요!</div>';
            return;
        }
        
        availableItems.forEach(item => {
            const seller = users.data.find(u => u.id === item.seller_id);
            const itemCard = createItemCard(item, seller);
            itemsGrid.appendChild(itemCard);
        });
        
    } catch (error) {
        console.error('Error loading marketplace:', error);
        showMessage('Failed to load marketplace', 'error');
    }
}

function createItemCard(item, seller, showActions = true, isMyItem = false) {
    const card = document.createElement('div');
    
    // 가격에 따른 카드 등급 결정
    const rarity = getItemRarity(item.price);
    card.className = `item-card slide-in ${rarity}`;
    
    const canAfford = currentUser && currentUser.purchase_points >= item.price;
    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
    const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '구매 포인트 부족';
    
    card.innerHTML = `
        <div class="relative">
            <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
            <img src="${item.image_url}" alt="${item.name}" class="item-image">
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
    
    return card;
}

// Purchase Functions
function openPurchaseModal(itemId) {
    selectedItem = itemId;
    fetchTableData('items').then(items => {
        const item = items.data.find(i => i.id === itemId);
        if (!item) return;
        
        return fetchTableData('users').then(users => {
            const seller = users.data.find(u => u.id === item.seller_id);
            
            document.getElementById('purchase-details').innerHTML = `
                <div class="text-center mb-4">
                    <img src="${item.image_url}" alt="${item.name}" class="w-24 h-24 object-cover mx-auto rounded-lg mb-3">
                    <h4 class="font-bold text-lg">${item.name}</h4>
                    <p class="text-gray-600">${item.description}</p>
                    <p class="text-sm text-gray-500 mt-2">판매자: ${seller ? seller.name : '알 수 없음'}</p>
                </div>
                <div class="bg-gray-50 p-3 rounded">
                    <div class="flex justify-between items-center">
                        <span>가격:</span>
                        <span class="font-bold text-lg text-green-600">${item.price} 포인트</span>
                    </div>
                    <div class="flex justify-between items-center mt-1">
                        <span>내 구매 포인트:</span>
                        <span class="font-bold text-blue-600">${currentUser.purchase_points} 포인트</span>
                    </div>
                    <div class="flex justify-between items-center mt-1">
                        <span>내 판매 수익:</span>
                        <span class="font-bold text-yellow-600">${currentUser.sales_earnings} 포인트</span>
                    </div>
                    <div class="flex justify-between items-center mt-2 pt-2 border-t">
                        <span>구매 후 구매 포인트:</span>
                        <span class="font-bold ${currentUser.purchase_points - item.price >= 0 ? 'text-green-600' : 'text-red-600'}">
                            ${currentUser.purchase_points - item.price} 포인트
                        </span>
                    </div>
                    <div class="text-xs text-gray-600 mt-3 p-2 bg-blue-50 rounded">
                        💰 구매는 구매 포인트에서만 차감! 판매하면 판매 수익이 올라가요!
                    </div>
                </div>
            `;
            
            document.getElementById('purchase-modal').classList.remove('hidden');
            document.getElementById('purchase-modal').classList.add('flex');
        });
    });
}

function closePurchaseModal() {
    document.getElementById('purchase-modal').classList.add('hidden');
    document.getElementById('purchase-modal').classList.remove('flex');
    selectedItem = null;
}

async function confirmPurchase() {
    if (!selectedItem || !currentUser) return;
    
    try {
        const items = await fetchTableData('items');
        const users = await fetchTableData('users');
        
        const item = items.data.find(i => i.id === selectedItem);
        const seller = users.data.find(u => u.id === item.seller_id);
        
        if (!item || !seller || item.status === 'sold') {
            showMessage('Item is no longer available', 'error');
            closePurchaseModal();
            return;
        }
        
        if (currentUser.purchase_points < item.price) {
            showMessage('구매 포인트가 부족합니다', 'error');
            closePurchaseModal();
            return;
        }
        
        // Update buyer purchase points (구매자의 구매 포인트에서 차감)
        currentUser.purchase_points -= item.price;
        await updateRecord('users', currentUser.id, currentUser);
        
        // Update seller sales earnings (판매자의 판매 수익에 추가)
        seller.sales_earnings += item.price;
        await updateRecord('users', seller.id, seller);
        
        // Mark item as sold
        await updateRecord('items', item.id, { ...item, status: 'sold' });
        
        // Record transaction
        await createRecord('transactions', {
            buyer_id: currentUser.id,
            seller_id: seller.id,
            item_id: item.id,
            amount: item.price,
            transaction_time: new Date().toISOString()
        });
        
        // 🎉 구매 성공 애니메이션과 메시지
        const rarity = getItemRarity(item.price);
        let successMessage = `🎉 구매 성공! ${item.name}을(를) 획득했어요!`;
        
        if (rarity === 'legendary') {
            successMessage = `🌟 전설급 아이템 획득! ${item.name}`;
            createFireworks(); // 전설급 아이템일 때만 불꽃놀이
            playSound('legendary'); // 전설급 사운드
        } else if (rarity === 'epic') {
            successMessage = `⭐⭐ 에픽 아이템 획득! ${item.name}`;
            playSound('purchase'); // 일반 구매 사운드
        } else if (rarity === 'rare') {
            successMessage = `⭐ 레어 아이템 획득! ${item.name}`;
            playSound('purchase'); // 일반 구매 사운드
        } else {
            playSound('purchase'); // 일반 구매 사운드
        }
        
        showSuccessMessage(successMessage);
        
        // Update UI
        updateUserInfo();
        loadMarketplace();
        loadMyItems();
        loadTransactionHistory();
        closePurchaseModal();
        
        // Animate points update
        document.getElementById('user-purchase-points').classList.add('points-animate');
        setTimeout(() => {
            document.getElementById('user-purchase-points').classList.remove('points-animate');
        }, 500);
        
        showMessage(`🎉 ${item.name}을(를) 성공적으로 구매했습니다! 🛒`, 'success');
        
    } catch (error) {
        console.error('Purchase error:', error);
        showMessage('Purchase failed. Please try again.', 'error');
    }
}

// My Items Functions
async function loadMyItems() {
    if (!currentUser) return;
    
    try {
        const items = await fetchTableData('items');
        const transactions = await fetchTableData('transactions');
        const users = await fetchTableData('users');
        
        // Items I'm selling
        const mySellingItems = items.data.filter(item => item.seller_id === currentUser.id);
        const sellingContainer = document.getElementById('my-selling-items');
        sellingContainer.innerHTML = '';
        
        if (mySellingItems.length === 0) {
            sellingContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">아직 등록한 아이템이 없어요.</div>';
        } else {
            mySellingItems.forEach(item => {
                const card = createItemCard(item, currentUser, true, true); // isMyItem = true
                sellingContainer.appendChild(card);
            });
        }
        
        // Items I bought
        const myPurchases = transactions.data.filter(t => t.buyer_id === currentUser.id);
        const boughtContainer = document.getElementById('my-bought-items');
        boughtContainer.innerHTML = '';
        
        if (myPurchases.length === 0) {
            boughtContainer.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4">아직 구매한 아이템이 없어요.</div>';
        } else {
            for (const transaction of myPurchases) {
                const item = items.data.find(i => i.id === transaction.item_id);
                const seller = users.data.find(u => u.id === transaction.seller_id);
                if (item) {
                    const card = createItemCard(item, seller, false);
                    boughtContainer.appendChild(card);
                }
            }
        }
        
    } catch (error) {
        console.error('Error loading my items:', error);
        showMessage('내 아이템 로딩에 실패했습니다', 'error');
    }
}

// Transaction History Functions
async function loadTransactionHistory() {
    if (!currentUser) return;
    
    try {
        const transactions = await fetchTableData('transactions');
        const items = await fetchTableData('items');
        const users = await fetchTableData('users');
        
        const myTransactions = transactions.data.filter(t => 
            t.buyer_id === currentUser.id || t.seller_id === currentUser.id
        );
        
        const historyContainer = document.getElementById('transaction-history');
        historyContainer.innerHTML = '';
        
        if (myTransactions.length === 0) {
            historyContainer.innerHTML = '<div class="text-center text-gray-500 py-8">아직 거래 내역이 없어요.</div>';
            return;
        }
        
        // Sort by date (newest first)
        myTransactions.sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time));
        
        myTransactions.forEach(transaction => {
            const item = items.data.find(i => i.id === transaction.item_id);
            const isBuyer = transaction.buyer_id === currentUser.id;
            const otherUser = users.data.find(u => u.id === (isBuyer ? transaction.seller_id : transaction.buyer_id));
            
            if (item) {
                const transactionElement = document.createElement('div');
                transactionElement.className = `transaction-item ${isBuyer ? 'transaction-buy' : 'transaction-sell'}`;
                
                transactionElement.innerHTML = `
                    <div class="flex items-center space-x-4">
                        <img src="${item.image_url}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
                        <div>
                            <h4 class="font-medium">${item.name}</h4>
                            <p class="text-sm text-gray-600">
                                ${isBuyer ? '구매처:' : '판매처:'} ${otherUser ? otherUser.name : '알 수 없음'}
                            </p>
                            <p class="text-xs text-gray-500">
                                ${new Date(transaction.transaction_time).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div class="text-right">
                        <div class="font-bold ${isBuyer ? 'text-red-600' : 'text-green-600'}">
                            ${isBuyer ? '-' : '+'}${transaction.amount} points
                        </div>
                    </div>
                `;
                
                historyContainer.appendChild(transactionElement);
            }
        });
        
    } catch (error) {
        console.error('Error loading transaction history:', error);
        showMessage('거래 내역 로딩에 실패했습니다', 'error');
    }
}

// Teacher Dashboard Functions
function showTeacherModal() {
    document.getElementById('teacher-modal').classList.remove('hidden');
    document.getElementById('teacher-modal').classList.add('flex');
    loadTeacherDashboard();
}

function closeTeacherModal() {
    document.getElementById('teacher-modal').classList.add('hidden');
    document.getElementById('teacher-modal').classList.remove('flex');
}

async function loadTeacherDashboard() {
    try {
        const users = await fetchTableData('users');
        const items = await fetchTableData('items');
        const transactions = await fetchTableData('transactions');
        
        // Load students list
        const students = users.data.filter(u => u.role === 'student');
        const studentsList = document.getElementById('students-list');
        studentsList.innerHTML = '';
        
        students.sort((a, b) => a.student_number.localeCompare(b.student_number));
        
        students.forEach(student => {
            const studentElement = document.createElement('div');
            studentElement.className = student.is_active ? 'student-online' : 'student-offline';
            
            studentElement.innerHTML = `
                <div>
                    <span class="font-medium">${student.student_number} ${student.name}</span>
                    <span class="ml-2 text-sm ${student.is_active ? 'text-green-600' : 'text-gray-500'}">
                        ${student.is_active ? '온라인' : '오프라인'}
                    </span>
                    <div class="text-xs text-gray-600 mt-1">
                        구매P: ${student.purchase_points} | 판매P: ${student.sales_earnings}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="resetStudentPoints('${student.id}')" 
                            class="text-blue-600 hover:text-blue-800 text-sm">
                        초기화
                    </button>
                </div>
            `;
            
            studentsList.appendChild(studentElement);
        });
        
        // Load market statistics
        const totalItems = items.data.length;
        const soldItems = items.data.filter(i => i.status === 'sold').length;
        const totalTransactions = transactions.data.length;
        const totalValue = transactions.data.reduce((sum, t) => sum + t.amount, 0);
        
        // Sales earnings ranking (판매수익 랭킹)
        const salesRanking = students
            .filter(s => s.sales_earnings > 0)
            .sort((a, b) => b.sales_earnings - a.sales_earnings)
            .slice(0, 5);
        
        const rankingHTML = salesRanking.length > 0 ? 
            salesRanking.map((student, index) => {
                const medals = ['🥇', '🥈', '🥉', '🏅', '🏅'];
                const medal = medals[index] || '🏅';
                return `
                    <div class="flex items-center justify-between p-2 ${index < 3 ? 'bg-yellow-50' : 'bg-gray-50'} rounded">
                        <span>${medal} ${index + 1}등: ${student.name}</span>
                        <span class="font-bold text-yellow-600">${student.sales_earnings}P</span>
                    </div>
                `;
            }).join('') : 
            '<div class="text-center text-gray-500 py-4">아직 판매한 학생이 없습니다</div>';
        
        document.getElementById('market-stats').innerHTML = `
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50 p-3 rounded">
                        <div class="text-2xl font-bold text-blue-600">${totalItems}</div>
                        <div class="text-sm text-blue-800">등록된 아이템</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded">
                        <div class="text-2xl font-bold text-green-600">${soldItems}</div>
                        <div class="text-sm text-green-800">판매된 아이템</div>
                    </div>
                    <div class="bg-purple-50 p-3 rounded">
                        <div class="text-2xl font-bold text-purple-600">${totalTransactions}</div>
                        <div class="text-sm text-purple-800">총 거래 횟수</div>
                    </div>
                    <div class="bg-yellow-50 p-3 rounded">
                        <div class="text-2xl font-bold text-yellow-600">${totalValue.toLocaleString()}</div>
                        <div class="text-sm text-yellow-800">거래된 포인트</div>
                    </div>
                </div>
                
                <div class="bg-white p-4 rounded border">
                    <h5 class="font-bold text-lg mb-3 text-center">🏆 판매왕 랭킹 (시상용)</h5>
                    <div class="space-y-2">
                        ${rankingHTML}
                    </div>
                    ${salesRanking.length > 0 ? `
                        <div class="mt-4 text-center">
                            <button onclick="printRanking()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded text-sm">
                                📋 랭킹 출력하기
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading teacher dashboard:', error);
        showMessage('선생님 대시보드 로딩에 실패했습니다', 'error');
    }
}

async function resetStudentPoints(studentId) {
    if (!confirm('이 학생의 포인트를 10,000으로 초기화하시겠습니까?')) return;
    
    try {
        const users = await fetchTableData('users');
        const student = users.data.find(u => u.id === studentId);
        
        if (student) {
            student.purchase_points = 10000;
            await updateRecord('users', studentId, student);
            loadTeacherDashboard();
            showMessage('학생 포인트가 성공적으로 초기화되었습니다', 'success');
        }
    } catch (error) {
        console.error('Error resetting points:', error);
        showMessage('포인트 초기화에 실패했습니다', 'error');
    }
}

async function resetAllPoints() {
    const choice = confirm('모든 학생의 구매 포인트를 10,000으로 초기화하시겠습니까?\n\n• 구매 포인트만 초기화됩니다\n• 판매 수익은 그대로 유지됩니다\n\n이 작업은 되돌릴 수 없습니다.');
    if (!choice) return;
    
    try {
        const users = await fetchTableData('users');
        const students = users.data.filter(u => u.role === 'student');
        
        for (const student of students) {
            student.purchase_points = 10000;
            // 판매수익은 그대로 유지 (sales_earnings 바꾸지 않음)
            await updateRecord('users', student.id, student);
        }
        
        loadTeacherDashboard();
        showMessage('모든 학생의 구매 포인트가 성공적으로 초기화되었습니다', 'success');
    } catch (error) {
        console.error('Error resetting all points:', error);
        showMessage('전체 구매 포인트 초기화에 실패했습니다', 'error');
    }
}

// Utility Functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm message-${type}`;
    messageDiv.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.remove();
    }, 5000);
}

// API Helper Functions
async function fetchTableData(tableName) {
    const response = await fetch(`tables/${tableName}`);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${tableName}`);
    }
    return await response.json();
}

async function createRecord(tableName, data) {
    const response = await fetch(`tables/${tableName}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Failed to create record in ${tableName}`);
    }
    return await response.json();
}

async function updateRecord(tableName, recordId, data) {
    const response = await fetch(`tables/${tableName}/${recordId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error(`Failed to update record in ${tableName}`);
    }
    return await response.json();
}

// 아이템 수정 기능
let editingItemId = null;

function openEditModal(itemId) {
    editingItemId = itemId;
    
    // 아이템 정보 가져오기
    fetchTableData('items').then(items => {
        const item = items.data.find(i => i.id === itemId);
        if (!item) return;
        
        // 폼에 기존 데이터 채우기
        document.getElementById('edit-item-name').value = item.name;
        document.getElementById('edit-item-description').value = item.description;
        document.getElementById('edit-item-price').value = item.price;
        document.getElementById('edit-item-category').value = item.category;
        
        // 모달 표시
        document.getElementById('edit-item-modal').classList.remove('hidden');
        document.getElementById('edit-item-modal').classList.add('flex');
    });
}

function closeEditModal() {
    document.getElementById('edit-item-modal').classList.add('hidden');
    document.getElementById('edit-item-modal').classList.remove('flex');
    editingItemId = null;
}

async function updateItem() {
    if (!editingItemId || !currentUser) return;
    
    const name = document.getElementById('edit-item-name').value.trim();
    const description = document.getElementById('edit-item-description').value.trim();
    const price = parseInt(document.getElementById('edit-item-price').value);
    const category = document.getElementById('edit-item-category').value;
    
    if (!name || !price || price <= 0) {
        showMessage('모든 필수 정보를 입력해주세요', 'error');
        return;
    }
    
    try {
        // 기존 아이템 정보 가져오기
        const items = await fetchTableData('items');
        const item = items.data.find(i => i.id === editingItemId);
        
        if (!item) {
            showMessage('아이템을 찾을 수 없습니다', 'error');
            return;
        }
        
        // 아이템 업데이트 (이미지는 그대로 유지)
        const updatedItem = {
            ...item,
            name: name,
            description: description,
            price: price,
            category: category
        };
        
        await updateRecord('items', editingItemId, updatedItem);
        
        showMessage('아이템이 성공적으로 수정되었습니다!', 'success');
        closeEditModal();
        loadMarketplace();
        loadMyItems();
        
    } catch (error) {
        console.error('Error updating item:', error);
        showMessage('아이템 수정에 실패했습니다. 다시 시도해주세요.', 'error');
    }
}

// 수정 폼 제출 이벤트
document.getElementById('edit-item-form').addEventListener('submit', function(e) {
    e.preventDefault();
    updateItem();
});

// 판매왕 랭킹 출력 기능
function printRanking() {
    // 새 창에서 랭킹 출력 페이지 열기
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    
    // 현재 날짜
    const today = new Date().toLocaleDateString('ko-KR');
    
    fetchTableData('users').then(users => {
        const students = users.data.filter(u => u.role === 'student');
        const salesRanking = students
            .filter(s => s.sales_earnings > 0)
            .sort((a, b) => b.sales_earnings - a.sales_earnings);
        
        const rankingHTML = salesRanking.map((student, index) => {
            const medals = ['🥇 1등', '🥈 2등', '🥉 3등', '🏅 4등', '🏅 5등'];
            const ranking = medals[index] || `🏅 ${index + 1}등`;
            return `
                <tr class="${index < 3 ? 'gold-rank' : ''}">
                    <td style="text-align: center; padding: 10px; font-size: 18px;">${ranking}</td>
                    <td style="text-align: center; padding: 10px; font-size: 18px; font-weight: bold;">${student.name}</td>
                    <td style="text-align: center; padding: 10px; font-size: 18px; color: #f59e0b; font-weight: bold;">${student.sales_earnings}P</td>
                </tr>
            `;
        }).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>잉글리시 마켓 판매왕 랭킹</title>
                <meta charset="utf-8">
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        margin: 40px; 
                        background: #f9fafb;
                    }
                    .container { 
                        background: white; 
                        padding: 40px; 
                        border-radius: 15px; 
                        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                        max-width: 500px;
                        margin: 0 auto;
                    }
                    h1 { 
                        text-align: center; 
                        color: #1f2937; 
                        margin-bottom: 10px;
                        font-size: 28px;
                    }
                    .subtitle {
                        text-align: center;
                        color: #6b7280;
                        margin-bottom: 30px;
                        font-size: 16px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                    }
                    th { 
                        background: linear-gradient(135deg, #fbbf24, #f59e0b); 
                        color: white; 
                        padding: 15px; 
                        font-size: 16px;
                        font-weight: bold;
                    }
                    td { 
                        border-bottom: 1px solid #e5e7eb; 
                        padding: 12px;
                    }
                    .gold-rank {
                        background: linear-gradient(135deg, #fef3c7, #fbbf24);
                    }
                    .footer {
                        text-align: center;
                        margin-top: 30px;
                        color: #6b7280;
                        font-size: 14px;
                    }
                    .print-btn {
                        background: #3b82f6;
                        color: white;
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 16px;
                        margin: 20px auto;
                        display: block;
                    }
                    @media print {
                        .print-btn { display: none; }
                        body { margin: 0; background: white; }
                        .container { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>🏆 잉글리시 마켓 판매왕 🏆</h1>
                    <div class="subtitle">영어수업 마켓플레이스 판매 랭킹 (${today})</div>
                    
                    <table>
                        <thead>
                            <tr>
                                <th>순위</th>
                                <th>이름</th>
                                <th>판매 수익</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rankingHTML}
                        </tbody>
                    </table>
                    
                    <div class="footer">
                        🌟 축하합니다! 여러분의 창의적인 아이템과 영어 실력이 빛났어요! 🌟
                    </div>
                    
                    <button class="print-btn" onclick="window.print()">📄 인쇄하기</button>
                </div>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.focus();
    });
}
