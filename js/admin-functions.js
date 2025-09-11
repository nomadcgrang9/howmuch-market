// 관리자 전용 함수들

// 관리자용 학생 목록 로드 (상세한 관리 기능 포함)
async function loadAdminStudentsList() {
    console.log('👥 관리자용 학생 목록 로드');
    
    try {
        const usersData = await fetchTableData('users');
        const studentsList = document.getElementById('admin-students-list');
        
        if (!studentsList) {
            console.error('❌ admin-students-list 엘리먼트 없음');
            return;
        }
        
        if (!usersData.data || usersData.data.length === 0) {
            studentsList.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 학생이 없습니다</p>';
            return;
        }
        
        // 선생님 제외하고 학생만 필터링
        let students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        // 반별 필터링 적용 (선생님은 모든 학생 보기, 학생은 같은 반만 보기)
        if (typeof filterSameClassUsers === 'function') {
            students = filterSameClassUsers(students);
        }
        
        if (students.length === 0) {
            studentsList.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 학생이 없습니다</p>';
            return;
        }
        
        // 판매 수익 기준으로 내림차순 정렬
        students.sort((a, b) => (b.sales_earnings || 0) - (a.sales_earnings || 0));
        
        studentsList.innerHTML = students.map((student, index) => {
            const level = getUserLevel(student.sales_earnings || 0);
            return `
                <div class="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <h4 class="font-medium text-lg">${index + 1}등. ${student.name}</h4>
                            <p class="text-sm text-gray-600">학번: ${student.student_number}</p>
                            <div class="flex items-center gap-2 mt-1">
                                <span class="text-sm ${level.color}">${level.name}</span>
                                ${typeof getClassFromStudentNumber === 'function' ? 
                                    `<span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">${getClassDisplayName(getClassFromStudentNumber(student.student_number))}</span>` : 
                                    ''
                                }
                            </div>
                        </div>
                    </div>
                    
                    <!-- 포인트 현황 -->
                    <div class="grid grid-cols-2 gap-3 mb-3">
                        <div class="bg-blue-50 p-2 rounded">
                            <div class="text-xs text-gray-600">구매 포인트</div>
                            <div class="font-bold text-blue-600">${(student.purchase_points || 0).toLocaleString()}P</div>
                        </div>
                        <div class="bg-green-50 p-2 rounded">
                            <div class="text-xs text-gray-600">판매 수익</div>
                            <div class="font-bold text-green-600">${(student.sales_earnings || 0).toLocaleString()}P</div>
                        </div>
                    </div>
                    
                    <!-- 개별 관리 버튼들 -->
                    <div class="grid grid-cols-2 gap-2">
                        <button onclick="showEditPointsModal('${student.id}', '${student.name}')" 
                                class="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-3 rounded">
                            ✏️ 포인트 수정
                        </button>
                        <button onclick="showPointHistoryModal('${student.id}', '${student.name}')" 
                                class="bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-3 rounded">
                            📋 변경 이력
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ 관리자용 학생 목록 ${students.length}명 로드 완료`);
        
    } catch (error) {
        console.error('❌ 관리자용 학생 목록 로드 오류:', error);
        const studentsList = document.getElementById('admin-students-list');
        if (studentsList) {
            studentsList.innerHTML = '<p class="text-red-500 text-center py-4">학생 목록을 불러올 수 없습니다</p>';
        }
    }
}

// 관리자용 아이템 목록 로드
async function loadAdminItemsList() {
    console.log('📦 관리자용 아이템 목록 로드');
    
    try {
        const itemsData = await fetchTableData('items');
        const itemsList = document.getElementById('admin-items-list');
        
        if (!itemsList) {
            console.error('❌ admin-items-list 엘리먼트 없음');
            return;
        }
        
        if (!itemsData.data || itemsData.data.length === 0) {
            itemsList.innerHTML = '<p class="text-gray-500 text-center py-4">등록된 아이템이 없습니다</p>';
            updateItemCounts(0, 0, 0);
            return;
        }
        
        const items = itemsData.data;
        const totalItems = items.length;
        const availableItems = items.filter(item => item.status === 'available' || !item.status).length;
        const soldItems = items.filter(item => item.status === 'sold').length;
        
        // 통계 업데이트
        updateItemCounts(totalItems, availableItems, soldItems);
        
        // 최신순 정렬
        items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        
        itemsList.innerHTML = items.slice(0, 20).map(item => {
            const rarity = getItemRarity(item.price);
            const rarityText = getRarityText(rarity);
            const statusText = item.status === 'sold' ? '판매완료' : '판매중';
            const statusColor = item.status === 'sold' ? 'text-red-600' : 'text-green-600';
            
            return `
                <div class="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="font-medium">${item.name}</h5>
                            <p class="text-sm text-gray-600 mt-1">${item.description || '설명 없음'}</p>
                            <div class="flex items-center gap-2 mt-2">
                                <span class="font-bold text-blue-600">${item.price}P</span>
                                <span class="text-xs ${rarity}-rarity px-2 py-1 rounded">${rarityText}</span>
                                <span class="text-xs ${statusColor}">${statusText}</span>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1">
                            <button onclick="deleteItemAsTeacher('${item.id}')" 
                                    class="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded border border-red-300">
                                🗑️ 삭제
                            </button>
                            ${item.status !== 'sold' ? `
                                <button onclick="forceCompleteItem('${item.id}')" 
                                        class="text-orange-500 hover:text-orange-700 text-xs px-2 py-1 rounded border border-orange-300">
                                    ✅ 완료 처리
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        console.log(`✅ 관리자용 아이템 목록 ${items.length}개 로드 완료`);
        
    } catch (error) {
        console.error('❌ 관리자용 아이템 목록 로드 오류:', error);
        const itemsList = document.getElementById('admin-items-list');
        if (itemsList) {
            itemsList.innerHTML = '<p class="text-red-500 text-center py-4">아이템 목록을 불러올 수 없습니다</p>';
        }
        updateItemCounts(0, 0, 0);
    }
}

// 아이템 통계 업데이트
function updateItemCounts(total, available, sold) {
    const totalElement = document.getElementById('total-items-count');
    const availableElement = document.getElementById('available-items-count');
    const soldElement = document.getElementById('sold-items-count');
    
    if (totalElement) totalElement.textContent = total;
    if (availableElement) availableElement.textContent = available;
    if (soldElement) soldElement.textContent = sold;
}

// 최근 거래 내역 로드
async function loadRecentTransactions() {
    console.log('💰 최근 거래 내역 로드');
    
    try {
        const transactionsData = await fetchTableData('transactions');
        const transactionsList = document.getElementById('recent-transactions');
        
        if (!transactionsList) {
            console.log('⚠️ recent-transactions 엘리먼트 없음');
            return;
        }
        
        if (!transactionsData.data || transactionsData.data.length === 0) {
            transactionsList.innerHTML = '<p class="text-gray-500 text-center py-2">거래 내역이 없습니다</p>';
            return;
        }
        
        // 최신순 정렬하고 최근 10건만
        const transactions = transactionsData.data
            .sort((a, b) => new Date(b.transaction_time || b.created_at || 0) - new Date(a.transaction_time || a.created_at || 0))
            .slice(0, 10);
        
        transactionsList.innerHTML = transactions.map(transaction => {
            const date = new Date(transaction.transaction_time || transaction.created_at);
            const timeString = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
            
            return `
                <div class="flex justify-between items-center py-2 px-3 bg-gray-50 rounded text-sm">
                    <div>
                        <span class="font-medium">${transaction.amount}P 거래</span>
                        <div class="text-xs text-gray-500">${timeString}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xs text-gray-600">아이템: ${transaction.item_id || '알 수 없음'}</div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('❌ 최근 거래 내역 로드 오류:', error);
        const transactionsList = document.getElementById('recent-transactions');
        if (transactionsList) {
            transactionsList.innerHTML = '<p class="text-red-500 text-center py-2">거래 내역을 불러올 수 없습니다</p>';
        }
    }
}

// 마켓 통계 로드
async function loadMarketStatistics() {
    console.log('📊 마켓 통계 로드');
    
    try {
        const [transactionsData, itemsData, usersData] = await Promise.all([
            fetchTableData('transactions'),
            fetchTableData('items'),
            fetchTableData('users')
        ]);
        
        // 통계 계산
        const totalTransactions = transactionsData.data ? transactionsData.data.length : 0;
        const totalAmount = transactionsData.data ? 
            transactionsData.data.reduce((sum, t) => sum + (t.amount || 0), 0) : 0;
        
        const items = itemsData.data || [];
        const avgPrice = items.length > 0 ? 
            items.reduce((sum, item) => sum + (item.price || 0), 0) / items.length : 0;
        
        const students = usersData.data ? 
            usersData.data.filter(u => u.student_number !== '0000' && !u.is_teacher) : [];
        const mostActiveStudent = students.length > 0 ? 
            students.reduce((max, student) => 
                (student.sales_earnings || 0) > (max.sales_earnings || 0) ? student : max
            ) : null;
        
        // DOM 업데이트
        const totalTransactionsEl = document.getElementById('total-transactions');
        const totalAmountEl = document.getElementById('total-transaction-amount');
        const avgPriceEl = document.getElementById('average-item-price');
        const mostActiveEl = document.getElementById('most-active-student');
        
        if (totalTransactionsEl) totalTransactionsEl.textContent = `${totalTransactions}건`;
        if (totalAmountEl) totalAmountEl.textContent = `${totalAmount.toLocaleString()}P`;
        if (avgPriceEl) avgPriceEl.textContent = `${Math.round(avgPrice).toLocaleString()}P`;
        if (mostActiveEl) mostActiveEl.textContent = mostActiveStudent ? 
            `${mostActiveStudent.name} (${mostActiveStudent.sales_earnings || 0}P)` : '없음';
        
    } catch (error) {
        console.error('❌ 마켓 통계 로드 오류:', error);
    }
}

// 새로고침 함수들
async function refreshStudentsList() {
    console.log('🔄 학생 목록 새로고침');
    await loadAdminStudentsList();
    showMessage('학생 목록을 새로고침했습니다', 'success');
}

async function refreshItemsList() {
    console.log('🔄 아이템 목록 새로고침');
    await loadAdminItemsList();
    showMessage('아이템 목록을 새로고침했습니다', 'success');
}

// 아이템 강제 완료 처리
async function forceCompleteItem(itemId) {
    if (!confirm('이 아이템을 강제로 판매 완료 처리하시겠습니까?')) {
        return;
    }
    
    try {
        await updateRecord('items', itemId, {
            status: 'sold'
        });
        
        showMessage('아이템이 판매 완료 처리되었습니다', 'success');
        await refreshItemsList();
        
    } catch (error) {
        console.error('❌ 아이템 강제 완료 처리 오류:', error);
        showMessage('아이템 처리에 실패했습니다', 'error');
    }
}

// 포인트 일괄 지급 모달 표시
function showBulkPointGiveModal() {
    console.log('💰 포인트 일괄 지급 모달 표시');
    const modal = document.getElementById('bulk-point-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        // 입력값 초기화
        document.getElementById('bulk-point-amount').value = '';
        document.getElementById('bulk-point-reason').value = '';
    } else {
        console.error('❌ bulk-point-modal 엘리먼트를 찾을 수 없습니다.');
    }
}

// 포인트 일괄 지급 모달 닫기
function closeBulkPointModal() {
    console.log('❌ 포인트 일괄 지급 모달 닫기');
    const modal = document.getElementById('bulk-point-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// 포인트 일괄 지급 실행
async function executeBulkPointGive() {
    const amountInput = document.getElementById('bulk-point-amount');
    const reasonInput = document.getElementById('bulk-point-reason');
    
    const amount = parseInt(amountInput.value);
    const reason = reasonInput.value || '일괄 포인트 지급';
    
    if (!amount || amount <= 0) {
        showMessage('유효한 포인트 수를 입력해주세요.', 'error');
        return;
    }
    
    if (amount > 50000) {
        showMessage('한 번에 지급할 수 있는 최대 포인트는 50,000P입니다.', 'error');
        return;
    }
    
    if (!confirm(`모든 학생에게 ${amount.toLocaleString()}P를 지급하시겠습니까?\n\n사유: ${reason}`)) {
        return;
    }
    
    try {
        console.log(`💰 전체 학생 포인트 일괄 지급 시작: ${amount}P`);
        
        // 모든 학생 조회 (선생님 제외)
        const usersData = await fetchTableData('users');
        const students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        let successCount = 0;
        let errorCount = 0;
        
        // 각 학생에게 포인트 지급
        for (const student of students) {
            try {
                const currentPoints = student.purchase_points || 0;
                const newPoints = currentPoints + amount;
                
                await updateRecord('users', student.id, {
                    purchase_points: newPoints
                });
                
                successCount++;
                console.log(`✅ ${student.name}(${student.student_number}): ${currentPoints} → ${newPoints}P`);
                
            } catch (error) {
                console.error(`❌ ${student.name} 포인트 지급 실패:`, error);
                errorCount++;
            }
        }
        
        // 결과 메시지
        if (errorCount === 0) {
            showMessage(`${successCount}명의 학생에게 ${amount.toLocaleString()}P를 성공적으로 지급했습니다.`, 'success');
        } else {
            showMessage(`${successCount}명 성공, ${errorCount}명 실패로 포인트 지급이 완료되었습니다.`, 'warning');
        }
        
        // 모달 닫기 및 목록 새로고침
        closeBulkPointModal();
        
        if (typeof loadAdminStudentsList === 'function') {
            await loadAdminStudentsList();
        }
        
    } catch (error) {
        console.error('❌ 일괄 포인트 지급 오류:', error);
        showMessage('포인트 지급 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// 개별 학생 포인트 수정 모달 표시
function showEditPointsModal(studentId, studentName) {
    console.log(`✏️ ${studentName} 포인트 수정 모달 표시`);
    
    const modal = document.getElementById('edit-points-modal');
    const nameSpan = document.getElementById('edit-student-name');
    
    if (modal && nameSpan) {
        nameSpan.textContent = studentName;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 학생 ID 저장 (나중에 수정 시 사용)
        modal.setAttribute('data-student-id', studentId);
        
        // 현재 포인트 정보 로드
        loadCurrentPointsInfo(studentId);
        
    } else {
        console.error('❌ edit-points-modal 또는 edit-student-name 엘리먼트를 찾을 수 없습니다.');
    }
}

// 현재 포인트 정보 로드
async function loadCurrentPointsInfo(studentId) {
    try {
        const student = await fetchRecord('users', studentId);
        if (student) {
            // 현재 포인트 정보 표시
            const purchaseSpan = document.getElementById('current-purchase-points');
            const salesSpan = document.getElementById('current-sales-earnings');
            
            if (purchaseSpan) {
                purchaseSpan.textContent = (student.purchase_points || 0).toLocaleString() + 'P';
            }
            if (salesSpan) {
                salesSpan.textContent = (student.sales_earnings || 0).toLocaleString() + 'P';
            }
            
            // 입력 필드 초기화
            document.getElementById('point-change-amount').value = '';
            document.getElementById('point-change-reason').value = '';
            
            const actionSelect = document.getElementById('point-change-action');
            if (actionSelect) {
                actionSelect.value = 'add';
            }
        }
    } catch (error) {
        console.error('❌ 학생 정보 로드 오류:', error);
    }
}

// 포인트 변경 이력 모달 표시
function showPointHistoryModal(studentId, studentName) {
    console.log(`📋 ${studentName} 포인트 변경 이력 표시`);
    
    // 간단한 알림으로 대체 (향후 구현 예정)
    alert(`${studentName}의 포인트 변경 이력\n\n이 기능은 향후 업데이트에서 구현될 예정입니다.`);
}

// 전역으로 내보내기
window.loadAdminStudentsList = loadAdminStudentsList;
window.loadAdminItemsList = loadAdminItemsList;
window.loadRecentTransactions = loadRecentTransactions;
window.loadMarketStatistics = loadMarketStatistics;
window.refreshStudentsList = refreshStudentsList;
window.refreshItemsList = refreshItemsList;
window.forceCompleteItem = forceCompleteItem;

// 개별 포인트 수정 모달 닫기
function closeEditPointsModal() {
    console.log('❌ 포인트 수정 모달 닫기');
    const modal = document.getElementById('edit-points-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        modal.removeAttribute('data-student-id');
    }
}

// 포인트 지급/차감
async function adjustPoints(action) {
    const modal = document.getElementById('edit-points-modal');
    const studentId = modal?.getAttribute('data-student-id');
    const adjustmentInput = document.getElementById('point-adjustment');
    const reasonInput = document.getElementById('point-change-reason');
    
    if (!studentId) {
        showMessage('학생 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const adjustment = parseInt(adjustmentInput.value);
    if (!adjustment || adjustment === 0) {
        showMessage('유효한 포인트 수를 입력해주세요.', 'error');
        return;
    }
    
    const reason = reasonInput.value || (action === 'add' ? '포인트 지급' : '포인트 차감');
    const finalAdjustment = action === 'subtract' ? -Math.abs(adjustment) : Math.abs(adjustment);
    
    try {
        console.log(`${action === 'add' ? '➕' : '➖'} 포인트 조정: ${finalAdjustment}P`);
        
        // 현재 학생 정보 조회
        const student = await fetchRecord('users', studentId);
        if (!student) {
            throw new Error('학생 정보를 찾을 수 없습니다.');
        }
        
        const currentPoints = student.purchase_points || 0;
        const newPoints = Math.max(0, currentPoints + finalAdjustment); // 음수 방지
        
        if (currentPoints + finalAdjustment < 0) {
            showMessage('포인트는 0 이하로 떨어질 수 없습니다.', 'error');
            return;
        }
        
        const actionText = action === 'add' ? '지급' : '차감';
        if (!confirm(`${student.name}에게 ${Math.abs(finalAdjustment).toLocaleString()}P를 ${actionText}하시겠습니까?\n\n현재: ${currentPoints.toLocaleString()}P → 변경 후: ${newPoints.toLocaleString()}P\n사유: ${reason}`)) {
            return;
        }
        
        // 포인트 업데이트
        await updateRecord('users', studentId, {
            purchase_points: newPoints
        });
        
        showMessage(`${student.name}에게 ${Math.abs(finalAdjustment).toLocaleString()}P를 ${actionText}했습니다.`, 'success');
        
        // 입력값 초기화 및 현재 포인트 정보 다시 로드
        adjustmentInput.value = '';
        reasonInput.value = '';
        await loadCurrentPointsInfo(studentId);
        
        // 학생 목록 새로고침
        if (typeof loadAdminStudentsList === 'function') {
            await loadAdminStudentsList();
        }
        
    } catch (error) {
        console.error(`❌ 포인트 ${action === 'add' ? '지급' : '차감'} 오류:`, error);
        showMessage(`포인트 조정 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

// 포인트 직접 설정
async function savePointChanges() {
    const modal = document.getElementById('edit-points-modal');
    const studentId = modal?.getAttribute('data-student-id');
    const newPointsInput = document.getElementById('new-purchase-points');
    const reasonInput = document.getElementById('point-change-reason');
    
    if (!studentId) {
        showMessage('학생 정보를 찾을 수 없습니다.', 'error');
        return;
    }
    
    const newPoints = parseInt(newPointsInput.value);
    if (newPoints === null || newPoints === undefined || newPoints < 0) {
        showMessage('유효한 포인트 수를 입력해주세요. (0 이상)', 'error');
        return;
    }
    
    if (newPoints > 999999) {
        showMessage('포인트는 999,999P를 초과할 수 없습니다.', 'error');
        return;
    }
    
    const reason = reasonInput.value || '포인트 직접 설정';
    
    try {
        console.log(`💾 포인트 직접 설정: ${newPoints}P`);
        
        // 현재 학생 정보 조회
        const student = await fetchRecord('users', studentId);
        if (!student) {
            throw new Error('학생 정보를 찾을 수 없습니다.');
        }
        
        const currentPoints = student.purchase_points || 0;
        
        if (!confirm(`${student.name}의 구매 포인트를 ${newPoints.toLocaleString()}P로 설정하시겠습니까?\n\n현재: ${currentPoints.toLocaleString()}P → 변경 후: ${newPoints.toLocaleString()}P\n사유: ${reason}`)) {
            return;
        }
        
        // 포인트 업데이트
        await updateRecord('users', studentId, {
            purchase_points: newPoints
        });
        
        showMessage(`${student.name}의 포인트를 ${newPoints.toLocaleString()}P로 설정했습니다.`, 'success');
        
        // 모달 닫기
        closeEditPointsModal();
        
        // 학생 목록 새로고침
        if (typeof loadAdminStudentsList === 'function') {
            await loadAdminStudentsList();
        }
        
    } catch (error) {
        console.error('❌ 포인트 설정 오류:', error);
        showMessage(`포인트 설정 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

// 새로 추가된 함수들
window.showBulkPointGiveModal = showBulkPointGiveModal;
window.closeBulkPointModal = closeBulkPointModal;
window.executeBulkPointGive = executeBulkPointGive;
window.showEditPointsModal = showEditPointsModal;
window.showPointHistoryModal = showPointHistoryModal;
window.loadCurrentPointsInfo = loadCurrentPointsInfo;
// 순위별 포인트 지급
async function giveRankPoints(rank, points) {
    try {
        console.log(`🏆 ${rank}등에게 ${points}P 지급 시작`);
        
        if (!confirm(`현재 판매수익 ${rank}등 학생에게 ${points.toLocaleString()}P를 지급하시겠습니까?`)) {
            return;
        }
        
        // 모든 학생 조회 (선생님 제외)
        const usersData = await fetchTableData('users');
        const students = usersData.data.filter(user => 
            user.student_number !== '0000' && !user.is_teacher
        );
        
        if (students.length === 0) {
            showMessage('등록된 학생이 없습니다.', 'error');
            return;
        }
        
        // 판매 수익 기준으로 내림차순 정렬
        students.sort((a, b) => (b.sales_earnings || 0) - (a.sales_earnings || 0));
        
        // 해당 순위 학생 확인
        if (students.length < rank) {
            showMessage(`${rank}등 학생이 없습니다. (전체 학생: ${students.length}명)`, 'error');
            return;
        }
        
        const targetStudent = students[rank - 1]; // 0-based index
        const currentPoints = targetStudent.purchase_points || 0;
        const newPoints = currentPoints + points;
        
        // 포인트 지급
        await updateRecord('users', targetStudent.id, {
            purchase_points: newPoints
        });
        
        const rankEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉';
        showMessage(`${rankEmoji} ${rank}등 ${targetStudent.name}에게 ${points.toLocaleString()}P를 지급했습니다!\n(${currentPoints.toLocaleString()}P → ${newPoints.toLocaleString()}P)`, 'success');
        
        // 학생 목록 새로고침
        if (typeof loadAdminStudentsList === 'function') {
            await loadAdminStudentsList();
        }
        
    } catch (error) {
        console.error(`❌ ${rank}등 포인트 지급 오류:`, error);
        showMessage(`포인트 지급 중 오류가 발생했습니다: ${error.message}`, 'error');
    }
}

window.closeEditPointsModal = closeEditPointsModal;
window.adjustPoints = adjustPoints;
window.savePointChanges = savePointChanges;
window.giveRankPoints = giveRankPoints;
