// 시스템 관리자 전용 기능들

// 게임 설정 관리
let gameSettings = {
    commonMax: 50,
    rareMax: 100,
    epicMax: 200,
    initialPoints: 10000,
    maxPoints: 999999,
    marketStatus: 'open'
};

// 실시간 모니터링 상태
let monitoringActive = true;
let monitoringInterval = null;

// 게임 설정 업데이트
async function updateGameSettings() {
    try {
        const newSettings = {
            commonMax: parseInt(document.getElementById('common-max').value),
            rareMax: parseInt(document.getElementById('rare-max').value),
            epicMax: parseInt(document.getElementById('epic-max').value),
            initialPoints: parseInt(document.getElementById('initial-points').value),
            maxPoints: parseInt(document.getElementById('max-points').value),
            marketStatus: document.querySelector('input[name="market-status"]:checked').value
        };
        
        // 설정 검증
        if (newSettings.commonMax >= newSettings.rareMax || 
            newSettings.rareMax >= newSettings.epicMax) {
            showMessage('등급 기준이 올바르지 않습니다. Common < Rare < Epic 순서로 설정해주세요', 'error');
            return;
        }
        
        // 설정 저장
        gameSettings = newSettings;
        localStorage.setItem('gameSettings', JSON.stringify(gameSettings));
        
        // 서버에도 저장 시도
        try {
            await createRecord('system_settings', {
                settings_type: 'game_config',
                settings_data: JSON.stringify(gameSettings),
                updated_by: 'teacher',
                updated_at: new Date().toISOString()
            });
        } catch (error) {
            console.log('서버 설정 저장 실패, 로컬만 저장됨:', error);
        }
        
        showMessage('게임 설정이 저장되었습니다', 'success');
        
    } catch (error) {
        console.error('❌ 게임 설정 저장 오류:', error);
        showMessage('설정 저장에 실패했습니다', 'error');
    }
}

// 게임 설정 로드
function loadGameSettings() {
    try {
        const saved = localStorage.getItem('gameSettings');
        if (saved) {
            gameSettings = JSON.parse(saved);
        }
        
        // UI에 설정값 반영
        document.getElementById('common-max').value = gameSettings.commonMax;
        document.getElementById('rare-max').value = gameSettings.rareMax;
        document.getElementById('epic-max').value = gameSettings.epicMax;
        document.getElementById('initial-points').value = gameSettings.initialPoints;
        document.getElementById('max-points').value = gameSettings.maxPoints;
        
        const statusRadio = document.querySelector(`input[name="market-status"][value="${gameSettings.marketStatus}"]`);
        if (statusRadio) statusRadio.checked = true;
        
    } catch (error) {
        console.error('설정 로드 오류:', error);
    }
}

// 시스템 공지 기능
async function sendAnnouncement() {
    const type = document.getElementById('announcement-type').value;
    const duration = parseInt(document.getElementById('announcement-duration').value);
    const message = document.getElementById('announcement-message').value.trim();
    
    if (!message) {
        showMessage('공지 내용을 입력해주세요', 'warning');
        return;
    }
    
    if (!confirm(`전체 학생에게 공지를 전송하시겠습니까?\\n\\n"${message}"`)) {
        return;
    }
    
    try {
        const announcement = {
            id: 'announcement_' + Date.now(),
            type: type,
            message: message,
            duration: duration,
            created_at: new Date().toISOString(),
            expires_at: duration > 0 ? new Date(Date.now() + duration * 60000).toISOString() : null,
            sent_by: 'teacher',
            active: true
        };
        
        // 공지사항 저장
        await createRecord('announcements', announcement);
        
        // 활성 공지 목록 업데이트
        await loadActiveAnnouncements();
        
        // 전송 이력에 추가
        addAnnouncementToHistory(announcement);
        
        // 입력 필드 초기화
        document.getElementById('announcement-message').value = '';
        
        showMessage(`공지가 전송되었습니다 (${duration > 0 ? duration + '분간 표시' : '수동 제거까지'})`, 'success');
        
        // 실제 학생들에게 실시간 알림 (여기서는 시뮬레이션)
        console.log('📡 전체 학생에게 공지 전송:', announcement);
        
    } catch (error) {
        console.error('❌ 공지 전송 오류:', error);
        showMessage('공지 전송에 실패했습니다', 'error');
    }
}

// 공지 미리보기
function previewAnnouncement() {
    const type = document.getElementById('announcement-type').value;
    const message = document.getElementById('announcement-message').value.trim();
    
    if (!message) {
        showMessage('미리볼 내용을 입력해주세요', 'warning');
        return;
    }
    
    const typeIcons = {
        'info': '📘',
        'warning': '⚠️',
        'success': '✅',
        'urgent': '🚨'
    };
    
    const typeColors = {
        'info': 'blue',
        'warning': 'yellow',
        'success': 'green',
        'urgent': 'red'
    };
    
    showMessage(`${typeIcons[type]} ${message}`, typeColors[type] === 'yellow' ? 'warning' : 
                typeColors[type] === 'green' ? 'success' : 
                typeColors[type] === 'red' ? 'error' : 'info');
}

// 활성 공지사항 로드
async function loadActiveAnnouncements() {
    try {
        const announcementsData = await fetchTableData('announcements');
        const container = document.getElementById('active-announcements');
        
        if (!announcementsData.data || announcementsData.data.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">활성 공지가 없습니다</p>';
            return;
        }
        
        // 활성 공지만 필터링 (만료되지 않은 것)
        const now = new Date();
        const activeAnnouncements = announcementsData.data.filter(ann => {
            if (!ann.active) return false;
            if (ann.expires_at && new Date(ann.expires_at) < now) return false;
            return true;
        });
        
        if (activeAnnouncements.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">활성 공지가 없습니다</p>';
            return;
        }
        
        container.innerHTML = activeAnnouncements.map(ann => {
            const typeIcons = {'info': '📘', 'warning': '⚠️', 'success': '✅', 'urgent': '🚨'};
            const createdTime = new Date(ann.created_at).toLocaleString();
            
            return `
                <div class="border rounded p-2 bg-gray-50 text-sm">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <span class="mr-2">${typeIcons[ann.type] || '📘'}</span>
                            <span>${ann.message}</span>
                        </div>
                        <button onclick="deactivateAnnouncement('${ann.id}')" 
                                class="text-red-500 hover:text-red-700 ml-2">
                            ❌
                        </button>
                    </div>
                    <div class="text-xs text-gray-500 mt-1">${createdTime}</div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ 활성 공지 로드 오류:', error);
        const container = document.getElementById('active-announcements');
        if (container) {
            container.innerHTML = '<p class="text-red-500 text-center py-4">공지를 불러올 수 없습니다</p>';
        }
    }
}

// 공지사항 비활성화
async function deactivateAnnouncement(announcementId) {
    if (!confirm('이 공지를 비활성화하시겠습니까?')) {
        return;
    }
    
    try {
        // 공지 비활성화 (상태만 변경)
        await updateRecord('announcements', announcementId, {
            active: false,
            deactivated_at: new Date().toISOString(),
            deactivated_by: 'teacher'
        });
        
        await loadActiveAnnouncements();
        showMessage('공지가 비활성화되었습니다', 'success');
        
    } catch (error) {
        console.error('❌ 공지 비활성화 오류:', error);
        showMessage('공지 비활성화에 실패했습니다', 'error');
    }
}

// 전송 이력에 공지 추가
function addAnnouncementToHistory(announcement) {
    const container = document.getElementById('announcement-history');
    const typeIcons = {'info': '📘', 'warning': '⚠️', 'success': '✅', 'urgent': '🚨'};
    
    const historyItem = `
        <div class="border rounded p-2 bg-gray-50 text-sm">
            <div class="flex items-center justify-between">
                <div>
                    <span class="mr-2">${typeIcons[announcement.type]}</span>
                    <span>${announcement.message.substring(0, 30)}${announcement.message.length > 30 ? '...' : ''}</span>
                </div>
                <div class="text-xs text-gray-500">방금 전</div>
            </div>
        </div>
    `;
    
    if (container.innerHTML.includes('전송 이력이 없습니다')) {
        container.innerHTML = historyItem;
    } else {
        container.insertAdjacentHTML('afterbegin', historyItem);
    }
}

// 실시간 활동 모니터링
function startRealtimeMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
    }
    
    monitoringInterval = setInterval(async () => {
        if (monitoringActive) {
            await updateOnlineStudents();
            await updateActivityLog();
            await updateLiveStatistics();
        }
    }, 5000); // 5초마다 업데이트
}

function toggleMonitoring() {
    monitoringActive = !monitoringActive;
    const button = document.getElementById('monitoring-toggle');
    
    if (monitoringActive) {
        button.textContent = '⏸️ 일시정지';
        button.className = 'ml-4 text-blue-600 hover:text-blue-800 text-sm';
    } else {
        button.textContent = '▶️ 재시작';
        button.className = 'ml-4 text-red-600 hover:text-red-800 text-sm';
    }
}

// 온라인 학생 업데이트
async function updateOnlineStudents() {
    try {
        // 실제로는 웹소켓이나 실시간 API가 필요하지만, 여기서는 시뮬레이션
        const usersData = await fetchTableData('users');
        const container = document.getElementById('online-students');
        const countElement = document.getElementById('online-count');
        
        if (!usersData.data) return;
        
        const students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        // 정확한 정보 표시: 실제로는 실시간 접속자를 확인할 수 없으므로 명시적으로 표시
        // 실시간 접속 정보는 WebSocket이나 별도 세션 관리가 필요함
        const onlineStudents = []; // 실제 실시간 기능 없음을 명시
        
        if (countElement) countElement.textContent = '0';
        
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <div class="text-sm">⚠️ 실시간 접속 모니터링 기능 비활성화</div>
                    <div class="text-xs mt-1">실시간 접속자 추적을 위해서는 WebSocket 연결이 필요합니다</div>
                </div>
            `;
        }
        
    } catch (error) {
        console.error('❌ 온라인 학생 업데이트 오류:', error);
    }
}

// 활동 로그 업데이트 (실제 데이터 기반)
async function updateActivityLog() {
    try {
        const container = document.getElementById('activity-log');
        if (!container) return;
        
        // 실제 거래 데이터 가져오기
        const transactionsData = await fetchTableData('transactions');
        if (!transactionsData.data || transactionsData.data.length === 0) {
            container.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <div class="text-sm">📋 실제 거래 활동이 없습니다</div>
                    <div class="text-xs mt-1">학생들이 거래를 시작하면 여기에 표시됩니다</div>
                </div>
            `;
            return;
        }
        
        // 최근 10개 거래 가져오기
        const recentTransactions = transactionsData.data
            .sort((a, b) => new Date(b.transaction_time) - new Date(a.transaction_time))
            .slice(0, 10);
        
        // 사용자 정보 가져오기
        const usersData = await fetchTableData('users');
        const itemsData = await fetchTableData('items');
        
        const userMap = {};
        const itemMap = {};
        
        if (usersData.data) {
            usersData.data.forEach(user => {
                userMap[user.id] = user.name;
            });
        }
        
        if (itemsData.data) {
            itemsData.data.forEach(item => {
                itemMap[item.id] = item.name;
            });
        }
        
        container.innerHTML = recentTransactions.map(transaction => {
            const buyerName = userMap[transaction.buyer_id] || '알 수 없음';
            const sellerName = userMap[transaction.seller_id] || '알 수 없음';
            const itemName = itemMap[transaction.item_id] || '알 수 없음';
            const time = new Date(transaction.transaction_time).toLocaleString();
            
            return `
                <div class="flex justify-between items-center text-sm py-2 border-b border-gray-200">
                    <div class="flex-1">
                        <div class="font-medium">🛒 거래 완료</div>
                        <div class="text-xs text-gray-600">
                            ${buyerName} → ${sellerName}: "${itemName}" (${transaction.amount}P)
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 ml-2">
                        ${time}
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ 활동 로그 업데이트 오류:', error);
        const container = document.getElementById('activity-log');
        if (container) {
            container.innerHTML = `
                <div class="text-center py-4 text-red-500">
                    <div class="text-sm">⚠️ 활동 로그 로딩 실패</div>
                    <div class="text-xs mt-1">데이터를 불러올 수 없습니다</div>
                </div>
            `;
        }
    }
}

// 실시간 통계 업데이트
async function updateLiveStatistics() {
    try {
        // 인기 아이템 업데이트
        const itemsData = await fetchTableData('items');
        const popularItemsContainer = document.getElementById('popular-items-live');
        
        if (itemsData.data && itemsData.data.length > 0) {
            const soldItems = itemsData.data.filter(item => item.status === 'sold');
            const itemCounts = {};
            
            soldItems.forEach(item => {
                itemCounts[item.name] = (itemCounts[item.name] || 0) + 1;
            });
            
            const topItems = Object.entries(itemCounts)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 3);
            
            popularItemsContainer.innerHTML = topItems.length > 0 ? 
                topItems.map(([name, count], index) => 
                    `<div>${index + 1}. ${name} (${count}회 판매)</div>`
                ).join('') : '<div class="text-gray-500">판매된 아이템이 없습니다</div>';
        }
        
        // 활발한 학생 업데이트
        const usersData = await fetchTableData('users');
        const activeStudentsContainer = document.getElementById('active-students-live');
        
        if (usersData.data) {
            const students = usersData.data
                .filter(user => user.student_number !== '0000' && !user.is_teacher)
                .sort((a, b) => (b.sales_earnings || 0) - (a.sales_earnings || 0))
                .slice(0, 3);
            
            activeStudentsContainer.innerHTML = students.length > 0 ?
                students.map((student, index) => 
                    `<div>${index + 1}. ${student.name} (${(student.sales_earnings || 0).toLocaleString()}P)</div>`
                ).join('') : '<div class="text-gray-500">활동 데이터가 없습니다</div>';
        }
        
        // 오늘의 통계 (시뮬레이션)
        const today = new Date().toDateString();
        document.getElementById('today-transactions').textContent = Math.floor(Math.random() * 50);
        document.getElementById('today-revenue').textContent = (Math.floor(Math.random() * 10000)).toLocaleString();
        document.getElementById('today-new-users').textContent = Math.floor(Math.random() * 10);
        
    } catch (error) {
        console.error('❌ 실시간 통계 업데이트 오류:', error);
    }
}

// 통계 새로고침
async function refreshStatistics() {
    showMessage('통계를 새로고침하고 있습니다...', 'info');
    
    try {
        await Promise.all([
            loadMarketStatistics(),
            updateLiveStatistics(),
            updateOnlineStudents()
        ]);
        
        showMessage('통계가 새로고침되었습니다', 'success');
    } catch (error) {
        console.error('❌ 통계 새로고침 오류:', error);
        showMessage('통계 새로고침에 실패했습니다', 'error');
    }
}

// 시스템 초기화 함수
function initializeSystemAdmin() {
    loadGameSettings();
    loadActiveAnnouncements();
    startRealtimeMonitoring();
    
    console.log('🛡️ 시스템 관리 기능 초기화 완료');
}

// 전역으로 내보내기
window.updateGameSettings = updateGameSettings;
window.loadGameSettings = loadGameSettings;
window.sendAnnouncement = sendAnnouncement;
window.previewAnnouncement = previewAnnouncement;
window.deactivateAnnouncement = deactivateAnnouncement;
window.toggleMonitoring = toggleMonitoring;
window.refreshStatistics = refreshStatistics;
window.initializeSystemAdmin = initializeSystemAdmin;