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

// Supabase가 준비되었다는 신호를 받으면 앱 초기화를 시작합니다.
document.addEventListener('supabaseIsReady', function() {
    console.log('🤝 Supabase 준비 완료! 마켓 앱을 시작합니다...');
    initializeApp();
});

// 애플리케이션의 모든 기능을 시작하는 메인 함수
async function initializeApp() {
    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
    
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


// 포켓몬 카드 등급 시스템
function getItemRarity(price) {
    if (price <= 50) return 'common';
    if (price <= 100) return 'rare';
    if (price <= 200) return 'epic';
    return 'legendary';
}

function getRarityText(rarity) {
    const rarityTexts = {
        'common': 'Common', 'rare': 'Rare ⭐',
        'epic': 'Epic ⭐⭐', 'legendary': 'Legendary ⭐⭐⭐'
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
        'beginner': '🌱 초보자', 'trader': '🏪 상인', 'merchant': '💰 거상',
        'tycoon': '👑 재벌', 'master': '🌟 전설의 상인'
    };
    return levelTexts[level] || '🌱 초보자';
}

// 사운드 시스템
function playSound(type) {
    if (!soundEnabled) return;
    try {
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
            case 'click': createBeep(800, 0.05, 0.05); break;
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
    } catch (error) { console.log('사운드 재생 실패:', error); }
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
    for (let i = 0; i < 30; i++) {
        setTimeout(() => createSingleFirework(container), i * 100);
    }
    setTimeout(() => container.parentNode && container.parentNode.removeChild(container), 3000);
}

function createSingleFirework(container) {
    const firework = document.createElement('div');
    firework.className = `firework color-${Math.floor(Math.random() * 6) + 1}`;
    firework.style.left = Math.random() * 100 + '%';
    firework.style.top = Math.random() * 100 + '%';
    container.appendChild(firework);
    setTimeout(() => firework.parentNode && firework.parentNode.removeChild(firework), 1500);
}

// 성공 메시지 표시
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.parentNode && successDiv.parentNode.removeChild(successDiv), 2000);
}

let categoryNames = {
    'toys': '장난감', 'food': '음식', 'clothes': '의류',
    'electronics': '전자제품', 'books': '책', 'other': '기타'
};

// User Authentication Functions
async function login() {
    const studentNumber = document.getElementById('student-number').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    if (!/^\d{4}$/.test(studentNumber)) return showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
    if (!studentName) return showMessage('이름을 입력해주세요', 'error');

    try {
        let { data: users } = await supabaseClient.from('users').select('*').eq('student_number', studentNumber);
        let user = users[0];

        if (user) {
            user.name = studentName;
            user = await updateRecord('users', user.id, { name: studentName });
        } else {
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
        console.error('❌ Login error:', error);
        showMessage('로그인 중 오류가 발생했습니다. 다시 시도해주세요.', 'error');
    }
}

async function teacherLogin() {
    const password = prompt('Enter teacher password:');
    if (password === 'teacher123') {
        try {
            let { data: teachers } = await supabaseClient.from('users').select('*').eq('student_number', '0000');
            let teacher = teachers[0];

            if (!teacher) {
                 teacher = await createRecord('users', {
                    name: 'Teacher', student_number: '0000', purchase_points: 999999,
                    sales_earnings: 999999, role: 'teacher', is_teacher: true, is_active: true
                });
            }
            
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
    currentUser = null;
    isTeacher = false;
    localStorage.removeItem('currentUser');
    document.getElementById('login-section').style.display = 'block';
    document.getElementById('main-app').style.display = 'none';
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('user-info').style.display = 'none';
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
    if (!currentUser) return;
    const purchasePoints = currentUser.purchase_points || 10000;
    const salesEarnings = currentUser.sales_earnings || 0;
    const userLevel = getUserLevel(salesEarnings);
    const levelText = getLevelText(userLevel);
    document.getElementById('user-name').innerHTML = `${currentUser.name} <span class="level-badge ${userLevel}">${levelText}</span>`;
    document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
    document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
    document.getElementById('user-info').style.display = 'flex';
    if (typeof updateClassInfo === 'function') updateClassInfo();
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    event.target.classList.add('active');
    if (tabName === 'marketplace') loadMarketplace();
    if (tabName === 'inventory') loadMyItems();
    if (tabName === 'history') loadTransactionHistory();
}

// Drawing Functions
function initializeDrawing() {
    canvas = document.getElementById('drawing-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
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
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => selectColor(option.dataset.color));
    });
    document.getElementById('brush-size').addEventListener('input', function() {
        brushSize = parseInt(this.value);
        document.getElementById('brush-size-display').textContent = brushSize;
    });
    selectColor('#000000');
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
    eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
    eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
    eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
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
        const { data: items } = await fetchTableData('items');
        const { data: users } = await fetchTableData('users');
        
        let availableItems = items.filter(item => item.status === 'available' && item.seller_id !== currentUser.id);
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
    }
}

function createItemCard(item, seller, showActions = true, isMyItem = false) {
    const card = document.createElement('div');
    const rarity = getItemRarity(item.price);
    card.className = `item-card slide-in ${rarity}`;
    const canAfford = currentUser && currentUser.purchase_points >= item.price;
    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn insufficient-funds';
    const buyButtonText = canAfford ? `${item.price} 포인트로 구매` : '포인트 부족';
    
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
            <p class="text-gray-600 text-sm mb-3 line-clamp-2">${item.description || ''}</p>
            <div class="flex justify-between items-center mb-3">
                <span class="price-tag"><i class="fas fa-coins mr-1"></i>${item.price} P</span>
                <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : '알 수 없음'}</span>
            </div>
            ${showActions && currentUser && item.status === 'available' ? `
                ${isMyItem ? `
                    <button onclick="openEditModal('${item.id}')" class="w-full cute-btn py-2 px-4 rounded-full mb-2 font-bold">✏️ 수정하기</button>
                ` : `
                    <button onclick="openPurchaseModal('${item.id}')" class="${buyButtonClass}" ${!canAfford ? 'disabled' : ''}>
                        <i class="fas fa-shopping-cart mr-1"></i>${buyButtonText}
                    </button>
                `}
            ` : ''}
        </div>
    `;
    return card;
}

// My Items Functions
async function loadMyItems() { /* ... */ }
// Transaction History Functions
async function loadTransactionHistory() { /* ... */ }

// Utility Functions
function showMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    const typeClasses = {
        info: 'bg-blue-500', success: 'bg-green-500', error: 'bg-red-500', warning: 'bg-yellow-500'
    };
    messageDiv.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white ${typeClasses[type]}`;
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    setTimeout(() => messageDiv.remove(), 3000);
}

// Purchase and Edit Modals
let selectedItemForPurchase = null;
function openPurchaseModal(itemId) { /* ... */ }
function closePurchaseModal() { /* ... */ }
async function confirmPurchase() { /* ... */ }
async function processInstantPurchase(purchaseRequest) { /* ... */ }
function openEditModal(itemId) { /* ... */ }
function closeEditModal() { /* ... */ }
async function updateItem() { /* ... */ }

// Admin Dashboard
async function showTeacherModal() {
    document.getElementById('main-app').classList.add('hidden');
    const adminDashboard = document.getElementById('admin-dashboard');
    adminDashboard.classList.remove('hidden');
    await loadAdminDashboard();
}

function exitAdminMode() {
    document.getElementById('admin-dashboard').classList.add('hidden');
    showMainApp();
}

async function loadAdminDashboard() {
    await Promise.all([
        loadAdminStudentsList(),
        loadAdminItemsList(),
        loadRecentTransactions(),
    ]);
    if (typeof initializeSystemAdmin === 'function') initializeSystemAdmin();
}

// Dummy functions for brevity
async function sellItem() { console.log('아이템 판매 기능 구현 예정'); }
