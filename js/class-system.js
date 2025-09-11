// 반별 마켓플레이스 분리 시스템

// 학번을 통한 반 정보 추출
function getClassFromStudentNumber(studentNumber) {
    if (!studentNumber || studentNumber === '0000') {
        return 'teacher'; // 선생님은 모든 반 접근 가능
    }
    
    // 4자리 학번의 첫 두 자리로 반 구분
    // 예: 4101 -> 4학년 1반, 4201 -> 4학년 2반, 4301 -> 4학년 3반
    const classCode = studentNumber.substring(0, 2);
    
    const classMapping = {
        '41': '4-1', // 4학년 1반
        '42': '4-2', // 4학년 2반  
        '43': '4-3', // 4학년 3반
        '44': '4-4', // 4학년 4반 (필요시)
        '45': '4-5', // 4학년 5반 (필요시)
    };
    
    return classMapping[classCode] || 'unknown';
}

// 반 이름 한글 변환
function getClassDisplayName(classCode) {
    const classNames = {
        'teacher': '전체 관리',
        '4-1': '4학년 1반',
        '4-2': '4학년 2반', 
        '4-3': '4학년 3반',
        '4-4': '4학년 4반',
        '4-5': '4학년 5반',
        'unknown': '미확인 반'
    };
    
    return classNames[classCode] || '미확인 반';
}

// 현재 사용자의 반 정보 가져오기
function getCurrentUserClass() {
    if (!currentUser) return null;
    return getClassFromStudentNumber(currentUser.student_number);
}

// 같은 반 학생들만 필터링
function filterSameClassUsers(users) {
    if (!currentUser) return [];
    
    const currentClass = getCurrentUserClass();
    
    // 선생님은 모든 학생 볼 수 있음
    if (currentClass === 'teacher') {
        return users.filter(user => user.student_number !== '0000' && !user.is_teacher);
    }
    
    // 학생은 같은 반 학생들만
    return users.filter(user => {
        if (user.student_number === '0000' || user.is_teacher) return false;
        return getClassFromStudentNumber(user.student_number) === currentClass;
    });
}

// 같은 반 아이템들만 필터링
function filterSameClassItems(items, users) {
    if (!currentUser) return [];
    
    const currentClass = getCurrentUserClass();
    
    // 선생님은 모든 아이템 볼 수 있음
    if (currentClass === 'teacher') {
        return items;
    }
    
    // 같은 반 학생들의 아이템만 반환
    const sameClassUserIds = filterSameClassUsers(users).map(user => user.id);
    return items.filter(item => sameClassUserIds.includes(item.seller_id));
}

// 반별 통계 계산
function getClassStatistics(users, items, transactions) {
    const currentClass = getCurrentUserClass();
    
    if (currentClass === 'teacher') {
        // 선생님은 반별 통계 제공
        return getAllClassStatistics(users, items, transactions);
    } else {
        // 학생은 자신의 반 통계만
        return getSingleClassStatistics(currentClass, users, items, transactions);
    }
}

function getAllClassStatistics(users, items, transactions) {
    const classStats = {};
    const classes = ['4-1', '4-2', '4-3', '4-4', '4-5'];
    
    classes.forEach(classCode => {
        const classUsers = users.filter(user => 
            getClassFromStudentNumber(user.student_number) === classCode
        );
        const classUserIds = classUsers.map(user => user.id);
        const classItems = items.filter(item => classUserIds.includes(item.seller_id));
        const classTransactions = transactions.filter(txn => 
            classUserIds.includes(txn.buyer_id) || classUserIds.includes(txn.seller_id)
        );
        
        classStats[classCode] = {
            name: getClassDisplayName(classCode),
            studentCount: classUsers.length,
            itemCount: classItems.length,
            transactionCount: classTransactions.length,
            totalRevenue: classTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0)
        };
    });
    
    return classStats;
}

function getSingleClassStatistics(classCode, users, items, transactions) {
    const classUsers = filterSameClassUsers(users);
    const classUserIds = classUsers.map(user => user.id);
    const classItems = items.filter(item => classUserIds.includes(item.seller_id));
    const classTransactions = transactions.filter(txn => 
        classUserIds.includes(txn.buyer_id) && classUserIds.includes(txn.seller_id)
    );
    
    return {
        [classCode]: {
            name: getClassDisplayName(classCode),
            studentCount: classUsers.length,
            itemCount: classItems.length,
            transactionCount: classTransactions.length,
            totalRevenue: classTransactions.reduce((sum, txn) => sum + (txn.amount || 0), 0)
        }
    };
}

// UI 업데이트: 현재 반 정보 표시
function updateClassInfo() {
    const currentClass = getCurrentUserClass();
    const className = getClassDisplayName(currentClass);
    
    // 헤더에 반 정보 표시
    const classInfoElement = document.getElementById('current-class-info');
    if (classInfoElement) {
        if (currentClass === 'teacher') {
            classInfoElement.innerHTML = `
                <span class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    👩‍🏫 ${className}
                </span>
            `;
        } else {
            classInfoElement.innerHTML = `
                <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    🏫 ${className}
                </span>
            `;
        }
    }
    
    console.log(`📚 현재 접속 반: ${className} (${currentClass})`);
}

// 데이터 초기화 관련 함수들
async function confirmDataReset(resetType) {
    const resetTypes = {
        'items': '모든 아이템',
        'transactions': '모든 거래 내역', 
        'points': '모든 학생 포인트',
        'all': '전체 데이터 (아이템 + 거래 + 포인트)'
    };
    
    const targetName = resetTypes[resetType] || '선택된 데이터';
    
    // 1차 확인
    if (!confirm(`⚠️ 정말로 ${targetName}를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)) {
        return false;
    }
    
    // 2차 비밀번호 확인
    const password = prompt('🔐 관리자 비밀번호를 입력해주세요:');
    if (password !== 'teacher123') {
        showMessage('잘못된 비밀번호입니다', 'error');
        return false;
    }
    
    // 3차 최종 확인
    if (!confirm(`🚨 최종 확인\n\n${targetName}를 완전히 삭제합니다.\n정말 진행하시겠습니까?`)) {
        return false;
    }
    
    return true;
}

// 반별 또는 전체 아이템 초기화
async function resetItems(classCode = 'all') {
    try {
        if (!(await confirmDataReset('items'))) {
            return;
        }
        
        showMessage('아이템 초기화 중...', 'info');
        
        const itemsData = await fetchTableData('items');
        if (!itemsData.data || itemsData.data.length === 0) {
            showMessage('초기화할 아이템이 없습니다', 'warning');
            return;
        }
        
        let targetItems = itemsData.data;
        
        // 특정 반만 초기화하는 경우
        if (classCode !== 'all' && classCode !== 'teacher') {
            const usersData = await fetchTableData('users');
            const classUserIds = usersData.data
                .filter(user => getClassFromStudentNumber(user.student_number) === classCode)
                .map(user => user.id);
            targetItems = itemsData.data.filter(item => classUserIds.includes(item.seller_id));
        }
        
        let deletedCount = 0;
        for (const item of targetItems) {
            try {
                await updateRecord('items', item.id, {
                    ...item,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'admin_reset'
                });
                deletedCount++;
            } catch (error) {
                console.error(`아이템 ${item.id} 삭제 실패:`, error);
            }
        }
        
        showMessage(`${deletedCount}개의 아이템이 초기화되었습니다`, 'success');
        
        // 관련 데이터 새로고침
        if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
        }
        if (typeof loadMarketplace === 'function') {
            await loadMarketplace();
        }
        
    } catch (error) {
        console.error('❌ 아이템 초기화 오류:', error);
        showMessage('아이템 초기화에 실패했습니다', 'error');
    }
}

// 거래 내역 초기화
async function resetTransactions(classCode = 'all') {
    try {
        if (!(await confirmDataReset('transactions'))) {
            return;
        }
        
        showMessage('거래 내역 초기화 중...', 'info');
        
        const transactionsData = await fetchTableData('transactions');
        if (!transactionsData.data || transactionsData.data.length === 0) {
            showMessage('초기화할 거래 내역이 없습니다', 'warning');
            return;
        }
        
        let targetTransactions = transactionsData.data;
        
        // 특정 반만 초기화하는 경우
        if (classCode !== 'all' && classCode !== 'teacher') {
            const usersData = await fetchTableData('users');
            const classUserIds = usersData.data
                .filter(user => getClassFromStudentNumber(user.student_number) === classCode)
                .map(user => user.id);
            targetTransactions = transactionsData.data.filter(txn => 
                classUserIds.includes(txn.buyer_id) || classUserIds.includes(txn.seller_id)
            );
        }
        
        let deletedCount = 0;
        for (const transaction of targetTransactions) {
            try {
                await updateRecord('transactions', transaction.id, {
                    ...transaction,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'admin_reset'
                });
                deletedCount++;
            } catch (error) {
                console.error(`거래 ${transaction.id} 삭제 실패:`, error);
            }
        }
        
        showMessage(`${deletedCount}건의 거래 내역이 초기화되었습니다`, 'success');
        
        // 관련 데이터 새로고침
        if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
        }
        
    } catch (error) {
        console.error('❌ 거래 내역 초기화 오류:', error);
        showMessage('거래 내역 초기화에 실패했습니다', 'error');
    }
}

// 전체 데이터 초기화
async function resetAllData() {
    try {
        if (!(await confirmDataReset('all'))) {
            return;
        }
        
        showMessage('전체 데이터 초기화 중... (시간이 걸릴 수 있습니다)', 'info');
        
        // 순차적으로 초기화 실행 (비밀번호는 이미 확인했으므로 스킵)
        await Promise.all([
            resetItemsInternal(),
            resetTransactionsInternal(),
            resetAllPointsInternal()
        ]);
        
        showMessage('🎉 전체 데이터가 초기화되었습니다', 'success');
        
        // 전체 데이터 새로고침
        if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
        }
        if (typeof loadMarketplace === 'function') {
            await loadMarketplace();
        }
        
    } catch (error) {
        console.error('❌ 전체 데이터 초기화 오류:', error);
        showMessage('전체 데이터 초기화에 실패했습니다', 'error');
    }
}

// 내부 초기화 함수들 (비밀번호 확인 스킵)
async function resetItemsInternal() {
    const itemsData = await fetchTableData('items');
    if (itemsData.data) {
        for (const item of itemsData.data) {
            try {
                await updateRecord('items', item.id, {
                    ...item,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'admin_reset'
                });
            } catch (error) {
                console.error(`아이템 ${item.id} 삭제 실패:`, error);
            }
        }
    }
}

async function resetTransactionsInternal() {
    const transactionsData = await fetchTableData('transactions');
    if (transactionsData.data) {
        for (const transaction of transactionsData.data) {
            try {
                await updateRecord('transactions', transaction.id, {
                    ...transaction,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: 'admin_reset'
                });
            } catch (error) {
                console.error(`거래 ${transaction.id} 삭제 실패:`, error);
            }
        }
    }
}

async function resetAllPointsInternal() {
    const usersData = await fetchTableData('users');
    if (usersData.data) {
        for (const user of usersData.data) {
            if (user.student_number !== '0000' && !user.is_teacher) {
                try {
                    await updateRecord('users', user.id, {
                        ...user,
                        purchase_points: 10000,
                        sales_earnings: 0
                    });
                } catch (error) {
                    console.error(`사용자 ${user.id} 포인트 초기화 실패:`, error);
                }
            }
        }
    }
}

// 반별 포인트 초기화 (wrapper)
async function resetAllPointsWithConfirm() {
    try {
        if (!(await confirmDataReset('points'))) {
            return;
        }
        
        showMessage('모든 학생 포인트 초기화 중...', 'info');
        
        const usersData = await fetchTableData('users');
        if (!usersData.data) {
            showMessage('초기화할 사용자 데이터가 없습니다', 'warning');
            return;
        }
        
        let resetCount = 0;
        for (const user of usersData.data) {
            if (user.student_number !== '0000' && !user.is_teacher) {
                try {
                    await updateRecord('users', user.id, {
                        ...user,
                        purchase_points: 10000,
                        sales_earnings: 0
                    });
                    resetCount++;
                } catch (error) {
                    console.error(`사용자 ${user.id} 포인트 초기화 실패:`, error);
                }
            }
        }
        
        showMessage(`${resetCount}명의 학생 포인트가 초기화되었습니다 (구매P: 10000, 판매P: 0)`, 'success');
        
        // 관련 데이터 새로고침
        if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
        }
        
    } catch (error) {
        console.error('❌ 포인트 초기화 오류:', error);
        showMessage('포인트 초기화에 실패했습니다', 'error');
    }
}

// 반별 초기화 모달 관련 함수들
function showClassResetModal() {
    const modal = document.getElementById('class-reset-modal');
    if (modal) {
        modal.style.display = 'flex';
        modal.setAttribute('aria-hidden', 'false');
        
        // 현재 반 목록 갱신
        refreshClassOverview();
    }
}

function closeClassResetModal() {
    const modal = document.getElementById('class-reset-modal');
    if (modal) {
        modal.style.display = 'none';
        modal.setAttribute('aria-hidden', 'true');
    }
}

// 반별 개요 정보 새로고침
async function refreshClassOverview() {
    try {
        showMessage('반별 현황을 불러오는 중...', 'info');
        
        const [usersData, itemsData, transactionsData] = await Promise.all([
            fetchTableData('users'),
            fetchTableData('items'),
            fetchTableData('transactions')
        ]);
        
        const classStats = getAllClassStatistics(
            usersData.data || [], 
            itemsData.data || [], 
            transactionsData.data || []
        );
        
        // 반별 현황 표시
        const overviewElement = document.getElementById('class-overview');
        if (overviewElement) {
            let overviewHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            `;
            
            Object.keys(classStats).forEach(classCode => {
                const stats = classStats[classCode];
                const hasData = stats.studentCount > 0 || stats.itemCount > 0 || stats.transactionCount > 0;
                
                overviewHTML += `
                    <div class="bg-white p-4 rounded-lg border ${hasData ? 'border-blue-200' : 'border-gray-200'}">
                        <div class="flex items-center justify-between mb-2">
                            <h4 class="font-semibold text-gray-800">${stats.name}</h4>
                            <span class="text-xs px-2 py-1 rounded ${hasData ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}">
                                ${hasData ? '활성' : '비활성'}
                            </span>
                        </div>
                        <div class="space-y-1 text-sm text-gray-600">
                            <div>👥 학생: ${stats.studentCount}명</div>
                            <div>📦 아이템: ${stats.itemCount}개</div>
                            <div>💱 거래: ${stats.transactionCount}건</div>
                            <div>💰 총 거래액: ${stats.totalRevenue}P</div>
                        </div>
                        ${hasData ? `
                            <button onclick="executeClassReset('${classCode}')" 
                                    class="mt-3 w-full bg-red-100 hover:bg-red-200 text-red-700 text-xs py-2 px-3 rounded transition-colors">
                                ${stats.name} 데이터 초기화
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            
            overviewHTML += '</div>';
            overviewElement.innerHTML = overviewHTML;
        }
        
        // 전체 통계 업데이트
        const totalStats = Object.values(classStats).reduce((acc, stats) => ({
            students: acc.students + stats.studentCount,
            items: acc.items + stats.itemCount,
            transactions: acc.transactions + stats.transactionCount,
            revenue: acc.revenue + stats.totalRevenue
        }), { students: 0, items: 0, transactions: 0, revenue: 0 });
        
        const summaryElement = document.getElementById('overall-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 class="font-semibold text-blue-800 mb-2">📊 전체 현황 요약</h4>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">${totalStats.students}</div>
                            <div class="text-blue-700">총 학생수</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">${totalStats.items}</div>
                            <div class="text-green-700">총 아이템</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-orange-600">${totalStats.transactions}</div>
                            <div class="text-orange-700">총 거래</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600">${totalStats.revenue}</div>
                            <div class="text-purple-700">총 거래액</div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        console.log('✅ 반별 현황 갱신 완료');
        
    } catch (error) {
        console.error('❌ 반별 현황 갱신 오류:', error);
        showMessage('반별 현황을 불러오는데 실패했습니다', 'error');
    }
}

// 특정 반 데이터 초기화 실행
async function executeClassReset(classCode = null) {
    // classCode가 없으면 모달에서 선택된 것 또는 현재 사용자 반 사용
    if (!classCode) {
        const selectedClass = getCurrentUserClass();
        if (selectedClass === 'teacher') {
            showMessage('선생님은 전체 데이터 초기화를 사용해주세요', 'warning');
            return;
        }
        classCode = selectedClass;
    }
    try {
        const className = getClassDisplayName(classCode);
        
        // 추가 확인
        if (!confirm(`⚠️ ${className}의 모든 데이터(아이템, 거래내역, 포인트)를 초기화하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다!`)) {
            return;
        }
        
        // 비밀번호 확인
        const password = prompt('🔐 관리자 비밀번호를 입력해주세요:');
        if (password !== 'teacher123') {
            showMessage('잘못된 비밀번호입니다', 'error');
            return;
        }
        
        showMessage(`${className} 데이터 초기화 중...`, 'info');
        
        // 해당 반의 사용자들 찾기
        const usersData = await fetchTableData('users');
        const classUsers = usersData.data.filter(user => 
            getClassFromStudentNumber(user.student_number) === classCode
        );
        const classUserIds = classUsers.map(user => user.id);
        
        if (classUserIds.length === 0) {
            showMessage(`${className}에 소속된 학생이 없습니다`, 'warning');
            return;
        }
        
        let totalOperations = 0;
        
        // 1. 해당 반 아이템 초기화
        const itemsData = await fetchTableData('items');
        const classItems = itemsData.data.filter(item => classUserIds.includes(item.seller_id));
        for (const item of classItems) {
            try {
                await updateRecord('items', item.id, {
                    ...item,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: `admin_reset_${classCode}`
                });
                totalOperations++;
            } catch (error) {
                console.error(`아이템 ${item.id} 삭제 실패:`, error);
            }
        }
        
        // 2. 해당 반 거래내역 초기화
        const transactionsData = await fetchTableData('transactions');
        const classTransactions = transactionsData.data.filter(txn => 
            classUserIds.includes(txn.buyer_id) || classUserIds.includes(txn.seller_id)
        );
        for (const transaction of classTransactions) {
            try {
                await updateRecord('transactions', transaction.id, {
                    ...transaction,
                    status: 'deleted',
                    deleted_at: new Date().toISOString(),
                    deleted_by: `admin_reset_${classCode}`
                });
                totalOperations++;
            } catch (error) {
                console.error(`거래 ${transaction.id} 삭제 실패:`, error);
            }
        }
        
        // 3. 해당 반 학생들 포인트 초기화
        for (const user of classUsers) {
            if (user.student_number !== '0000' && !user.is_teacher) {
                try {
                    await updateRecord('users', user.id, {
                        ...user,
                        purchase_points: 10000,
                        sales_earnings: 0
                    });
                    totalOperations++;
                } catch (error) {
                    console.error(`사용자 ${user.id} 포인트 초기화 실패:`, error);
                }
            }
        }
        
        showMessage(`🎉 ${className} 데이터 초기화 완료! (${totalOperations}건 처리)`, 'success');
        
        // UI 새로고침
        await refreshClassOverview();
        if (typeof loadAdminDashboard === 'function') {
            await loadAdminDashboard();
        }
        if (typeof loadMarketplace === 'function') {
            await loadMarketplace();
        }
        
    } catch (error) {
        console.error('❌ 반별 데이터 초기화 오류:', error);
        showMessage('반별 데이터 초기화에 실패했습니다', 'error');
    }
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const modal = document.getElementById('class-reset-modal');
        if (modal && modal.style.display === 'flex') {
            closeClassResetModal();
        }
    }
});

// 전역으로 내보내기
window.getClassFromStudentNumber = getClassFromStudentNumber;
window.getClassDisplayName = getClassDisplayName;
window.getCurrentUserClass = getCurrentUserClass;
window.filterSameClassUsers = filterSameClassUsers;
window.filterSameClassItems = filterSameClassItems;
window.getClassStatistics = getClassStatistics;
window.updateClassInfo = updateClassInfo;
window.resetItems = resetItems;
window.resetTransactions = resetTransactions;
window.resetAllData = resetAllData;
window.resetAllPointsWithConfirm = resetAllPointsWithConfirm;
window.resetAllPoints = resetAllPointsWithConfirm; // HTML onclick 호환성을 위한 별칭
window.showClassResetModal = showClassResetModal;
window.closeClassResetModal = closeClassResetModal;
window.refreshClassOverview = refreshClassOverview;
window.executeClassReset = executeClassReset;
