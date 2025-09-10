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
            try {
                currentUser = JSON.parse(savedUser);
                showMainApp();
                updateUserInfo();
            } catch (e) {
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
            if (user.name !== studentName) {
                 user = await window.updateRecord('users', user.id, { name: studentName });
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
        
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        updateUserInfo();
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
            let { data: teachers, error: fetchError } = await window.supabaseClient.from('users').select('*').eq('student_number', '0000');
            if(fetchError) throw fetchError;
            
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
    
    // =============================================================
    // 중요: 메인 앱이 표시될 때 그림판 기능을 다시 초기화합니다.
    // =============================================================
    initializeDrawing();
    initializeColorPalette();
    
    loadMarketplace();
    // loadMyItems and loadTransactionHistory can be called here if implemented
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
    const targetTab = document.getElementById(`tab-${tabName}`);
    if(targetTab) targetTab.style.display = 'block';
    if(event.currentTarget) event.currentTarget.classList.add('active');
    
    // Refresh content based on tab
    if (tabName === 'marketplace') loadMarketplace();
    // Other tabs can be loaded here
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
        itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아이템을 불러오는 중...</div>';
        
        const { data: items } = await window.fetchTableData('items');
        const { data: users } = await window.fetchTableData('users');
        
        let availableItems = items.filter(item => item.status === 'available');
        
        itemsGrid.innerHTML = '';
        if (availableItems.length === 0) {
            itemsGrid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">아직 판매 중인 아이템이 없어요.</div>';
            return;
        }
        availableItems.forEach(item => {
            const seller = users.find(u => u.id === item.seller_id);
            if(currentUser && item.seller_id !== currentUser.id) {
                 itemsGrid.appendChild(createItemCard(item, seller));
            } else if (!currentUser) {
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
            ${currentUser && item.status === 'available' ? `
                <button onclick="openPurchaseModal('${item.id}')" class="${buyButtonClass}" ${!canAfford ? 'disabled' : ''}>
                    <i class="fas fa-shopping-cart mr-1"></i>${buyButtonText}
                </button>
            ` : ''}
        </div>
    `;
    return card;
}


document.getElementById('sell-form').addEventListener('submit', async function(e) {
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
            name: itemName,
            description: itemDescription,
            price: itemPrice,
            category: itemCategory,
            image_url: imageUrl,
            seller_id: currentUser.id,
            status: 'available'
        });
        showMessage('아이템이 성공적으로 등록되었습니다!', 'success');
        this.reset();
        clearCanvas();
        showTab('marketplace');
    } catch (error) {
        console.error('아이템 등록 오류:', error);
        showMessage('아이템 등록에 실패했습니다.', 'error');
    }
});


// Admin Dashboard
async function showTeacherModal() {
    document.getElementById('main-app').style.display = 'none';
    const adminDashboard = document.getElementById('admin-dashboard');
    adminDashboard.classList.remove('hidden');
    // await loadAdminDashboard();
}

function exitAdminMode() {
    document.getElementById('admin-dashboard').classList.add('hidden');
    showMainApp();
}

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

// Helper functions for levels, sounds, etc.
// These are not directly related to the main logic flow but are needed for UI
// ... (The rest of the helper functions: getUserLevel, getLevelText, playSound, etc.)
function getUserLevel(salesEarnings) {
    if (salesEarnings < 100) return { name: '🌱 초보자', color: 'text-gray-500' };
    if (salesEarnings < 300) return { name: '🏪 상인', color: 'text-blue-500' };
    if (salesEarnings < 600) return { name: '💰 거상', color: 'text-green-500' };
    if (salesEarnings < 1000) return { name: '👑 재벌', color: 'text-purple-500' };
    return { name: '🌟 전설의 상인', color: 'text-yellow-500' };
}

// Dummy functions for unimplemented features to avoid errors
async function loadMyItems() { console.log("loadMyItems called"); }
async function loadTransactionHistory() { console.log("loadTransactionHistory called"); }
function openPurchaseModal(itemId) { console.log("openPurchaseModal called with", itemId); }

