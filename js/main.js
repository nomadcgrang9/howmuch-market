// 잉글리시 마켓 - 메인 JavaScript 파일 (최종 완성본)

// Global variables
let currentUser = null;
let isTeacher = false;
let canvas = null;
let ctx = null;
let isDrawing = false;
let currentColor = '#000000';
let brushSize = 3;
let isEraser = false;

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

// =================================================================
// Event Listeners
// =================================================================

// Supabase가 준비되면 앱 초기화를 시작합니다.
document.addEventListener('supabaseIsReady', function() {
    console.log('🤝 Supabase 준비 완료! 마켓 앱을 시작합니다...');
    initializeApp();
});

// 로그인 버튼 이벤트 리스너
document.querySelector('button[onclick="login()"]').addEventListener('click', login);

// 선생님 로그인 버튼 이벤트 리스너
document.querySelector('button[onclick="teacherLogin()"]').addEventListener('click', teacherLogin);

// 아이템 판매 폼 제출 이벤트 리스너
document.getElementById('sell-form').addEventListener('submit', sellItem);


// =================================================================
// Initialization
// =================================================================

async function initializeApp() {
    console.log('🎪 창건샘의 How Much 마켓 초기화 🛍️');
    initializeDrawingAndPalette(); // 그림판 기능은 맨 처음에 딱 한번만 초기화합니다.
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showMainApp();
            updateUserInfo();
            await loadMarketplace();
        } catch (e) {
            localStorage.removeItem('currentUser');
        }
    }
}

// =================================================================
// Authentication
// =================================================================

async function login() {
    const studentNumber = document.getElementById('student-number').value.trim();
    const studentName = document.getElementById('student-name').value.trim();
    if (!/^\d{4}$/.test(studentNumber)) return showMessage('학번을 정확히 입력해주세요 (예: 4103)', 'error');
    if (!studentName) return showMessage('이름을 입력해주세요', 'error');

    try {
        let { data: users, error } = await window.supabaseClient.from('users').select('*').eq('student_number', studentNumber);
        if (error) throw error;
        let user = users[0];

        if (user) {
            if (user.name !== studentName) {
                user = await window.updateRecord('users', user.id, { name: studentName });
            }
        } else {
            user = await window.createRecord('users', {
                name: studentName, student_number: studentNumber, purchase_points: 10000,
                sales_earnings: 0, role: 'student', is_teacher: false, is_active: true
            });
        }
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateUserInfo();
        await loadMarketplace();
        showMessage('🎉 마켓에 오신 것을 환영합니다!', 'success');

    } catch (error) {
        console.error('❌ Login error:', error);
        showMessage('로그인 중 오류가 발생했습니다.', 'error');
    }
}

async function teacherLogin() {
    const password = prompt('선생님 비밀번호를 입력하세요:');
    if (password === 'teacher123') {
        try {
            let { data: teachers, error } = await window.supabaseClient.from('users').select('*').eq('student_number', '0000');
            if (error) throw error;
            let teacher = teachers[0];

            if (!teacher) {
                 teacher = await window.createRecord('users', {
                    name: 'Teacher', student_number: '0000', purchase_points: 999999,
                    sales_earnings: 999999, role: 'teacher', is_teacher: true, is_active: true
                });
            }
            
            currentUser = teacher;
            isTeacher = true;
            localStorage.setItem('currentUser', JSON.stringify(teacher));
            showMainApp();
            updateUserInfo();
            // showTeacherModal(); // This function needs to be defined
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
    const adminDashboard = document.getElementById('admin-dashboard');
    if(adminDashboard) adminDashboard.classList.add('hidden');
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('student-number').value = '';
    document.getElementById('student-name').value = '';
}


// =================================================================
// UI Control
// =================================================================

function showMainApp() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';
}

function updateUserInfo() {
    if (!currentUser) return;
    const purchasePoints = currentUser.purchase_points || 10000;
    const salesEarnings = currentUser.sales_earnings || 0;
    const levelInfo = getUserLevel(salesEarnings);
    const levelText = getLevelText(levelInfo);
    document.getElementById('user-name').innerHTML = `${currentUser.name} <span class="level-badge ${levelInfo.name.toLowerCase()}">${levelText}</span>`;
    document.getElementById('user-purchase-points').textContent = purchasePoints.toLocaleString();
    document.getElementById('user-sales-earnings').textContent = salesEarnings.toLocaleString();
    document.getElementById('user-info').style.display = 'flex';
}

function showTab(tabName, event) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) targetTab.style.display = 'block';
    
    // event가 있을 때만 currentTarget에 접근합니다.
    if(event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    } else {
        // event가 없을 경우(예: 아이템 생성 후 자동 전환) 첫 번째 탭을 활성화합니다.
        document.querySelector('.tab-btn').classList.add('active');
    }

    if (tabName === 'marketplace') loadMarketplace();
}

// =================================================================
// Drawing Canvas
// =================================================================

function initializeDrawingAndPalette() {
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
    canvas.addEventListener('touchstart', handleTouch, { passive: false });
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => selectColor(option.dataset.color));
    });
    
    const brushSlider = document.getElementById('brush-size');
    if(brushSlider) {
        brushSlider.addEventListener('input', function() {
            brushSize = parseInt(this.value);
            document.getElementById('brush-size-display').textContent = brushSize;
        });
    }

    const eraserBtn = document.getElementById('eraser-btn');
    if(eraserBtn) eraserBtn.addEventListener('click', toggleEraser);
    
    const clearBtn = document.getElementById('clear-canvas-btn');
    if(clearBtn) clearBtn.addEventListener('click', clearCanvas);

    selectColor('#000000');
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

function selectColor(color) {
    currentColor = color;
    isEraser = false;
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('ring-4', 'ring-blue-500'));
    const selectedOption = document.querySelector(`[data-color="${color}"]`);
    if (selectedOption) selectedOption.classList.add('ring-4', 'ring-blue-500');
    document.getElementById('current-color').style.backgroundColor = color;
    document.getElementById('current-color-name').textContent = colorNames[color] || '사용자 지정';
    const eraserBtn = document.getElementById('eraser-btn');
    if(eraserBtn) {
        eraserBtn.classList.remove('bg-blue-500', 'hover:bg-blue-600');
        eraserBtn.classList.add('bg-yellow-500', 'hover:bg-yellow-600');
        eraserBtn.innerHTML = '<i class="fas fa-eraser mr-1"></i>지우개';
    }
}

function toggleEraser() {
    isEraser = !isEraser;
    const eraserBtn = document.getElementById('eraser-btn');
    if (eraserBtn) {
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
}

// =================================================================
// Marketplace & Items
// =================================================================

async function loadMarketplace() {
    try {
        const itemsGrid = document.getElementById('items-grid');
        itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아이템을 불러오는 중...</div>';
        
        const { data: items } = await window.fetchTableData('items');
        const { data: users } = await window.fetchTableData('users');
        
        const availableItems = items.filter(item => item.status === 'available');
        
        itemsGrid.innerHTML = '';
        if (availableItems.length === 0) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요.</div>';
            return;
        }
        availableItems.forEach(item => {
            const seller = users.find(u => u.id === item.seller_id);
            if(!currentUser || (currentUser && item.seller_id !== currentUser.id)) {
                 itemsGrid.appendChild(createItemCard(item, seller));
            }
        });
    } catch (error) {
        console.error('❌ Error loading marketplace:', error);
        document.getElementById('items-grid').innerHTML = '<div class="col-span-full text-center text-red-500 py-8">아이템 로딩에 실패했습니다.</div>';
    }
}

function createItemCard(item, seller) {
    const card = document.createElement('div');
    const rarity = getItemRarity(item.price);
    card.className = `item-card slide-in ${rarity}`;
    const canAfford = currentUser && currentUser.purchase_points >= item.price;
    const buyButtonClass = canAfford ? 'buy-btn' : 'buy-btn-disabled';
    const buyButtonText = canAfford ? `${item.price}P에 구매` : '포인트 부족';
    
    card.innerHTML = `
        <div class="relative">
            <div class="rarity-badge ${rarity}">${getRarityText(rarity)}</div>
            <img src="${item.image_url}" alt="${item.name}" class="item-image">
            ${item.status === 'sold' ? '<div class="sold-overlay">SOLD</div>' : ''}
        </div>
        <div class="item-info">
            <h4 class="font-bold truncate">${item.name}</h4>
            <p class="text-sm text-gray-500 truncate">${item.description || ' '}</p>
            <div class="flex justify-between items-center mt-2">
                <span class="price-tag">${item.price} P</span>
                <span class="text-xs text-gray-500">판매자: ${seller ? seller.name : 'Unknown'}</span>
            </div>
             ${currentUser && !isTeacher && item.status === 'available' ? `
                <button class="${buyButtonClass}" ${!canAfford ? 'disabled' : ''}>${buyButtonText}</button>
            ` : ''}
        </div>
    `;
    return card;
}


async function sellItem(e) {
    e.preventDefault();
    if (!currentUser) return showMessage('로그인이 필요합니다.', 'error');

    const itemName = document.getElementById('item-name').value;
    const itemDescription = document.getElementById('item-description').value;
    const itemPrice = parseInt(document.getElementById('item-price').value);
    const itemCategory = document.getElementById('item-category').value;
    const imageUrl = canvas.toDataURL('image/png');

    if (!itemName || !itemPrice || !itemCategory) {
        return showMessage('이름, 가격, 카테고리는 필수 항목입니다.', 'warning');
    }

    try {
        await window.createRecord('items', {
            name: itemName, description: itemDescription, price: itemPrice,
            category: itemCategory, image_url: imageUrl, seller_id: currentUser.id, status: 'available'
        });
        showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
        document.getElementById('sell-form').reset();
        clearCanvas();
        showTab('marketplace', null); // event 객체 없이 호출
    } catch (error) {
        console.error('아이템 등록 오류:', error);
        showMessage('아이템 등록에 실패했습니다.', 'error');
    }
}

// =================================================================
// Utility & Helper Functions
// =================================================================

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


function getItemRarity(price) {
    if (price <= 50) return 'common';
    if (price <= 100) return 'rare';
    if (price <= 200) return 'epic';
    return 'legendary';
}

function getRarityText(rarity) {
    const rarityMap = { common: 'Common', rare: 'Rare ⭐', epic: 'Epic ⭐⭐', legendary: 'Legendary ⭐⭐⭐' };
    return rarityMap[rarity] || 'Common';
}

function getUserLevel(salesEarnings) {
    if (salesEarnings < 100) return { name: '초보자', icon: '🌱' };
    if (salesEarnings < 300) return { name: '상인', icon: '🏪' };
    if (salesEarnings < 600) return { name: '거상', icon: '💰' };
    if (salesEarnings < 1000) return { name: '재벌', icon: '👑' };
    return { name: '전설의 상인', icon: '🌟' };
}

// 이 함수가 없어서 오류가 발생했습니다. 다시 추가합니다!
function getLevelText(levelInfo) {
    return `${levelInfo.icon} ${levelInfo.name}`;
}

