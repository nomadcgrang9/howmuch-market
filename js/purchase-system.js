// 구매 요청 시스템 관리

// 구매 요청 목록 새로고침
async function refreshPurchaseRequests() {
    try {
        console.log('🔄 구매 요청 목록 새로고침...');
        
        const requestsData = await fetchTableData('purchase_requests');
        
        if (!requestsData.data) {
            console.log('구매 요청 데이터 없음');
            return;
        }
        
        // 대기 중인 요청과 최근 처리된 요청 분리
        const pendingRequests = requestsData.data.filter(req => req.status === 'pending');
        const recentRequests = requestsData.data
            .filter(req => req.status !== 'pending')
            .sort((a, b) => new Date(b.response_time || b.request_time) - new Date(a.response_time || a.request_time))
            .slice(0, 10);
        
        // 반별 필터링 적용
        const currentClass = getCurrentUserClass();
        let filteredPending = pendingRequests;
        let filteredRecent = recentRequests;
        
        if (currentClass !== 'teacher' && typeof filterSameClassUsers === 'function') {
            // 학생은 자신과 관련된 요청만 볼 수 있음
            filteredPending = pendingRequests.filter(req => 
                req.buyer_id === currentUser.id || req.seller_id === currentUser.id
            );
            filteredRecent = recentRequests.filter(req => 
                req.buyer_id === currentUser.id || req.seller_id === currentUser.id
            );
        }
        
        // UI 업데이트
        updatePendingRequestsUI(filteredPending);
        updateRecentRequestsUI(filteredRecent);
        
        // 카운트 업데이트
        const countElement = document.getElementById('pending-requests-count');
        if (countElement) {
            countElement.textContent = filteredPending.length;
        }
        
    } catch (error) {
        console.error('❌ 구매 요청 새로고침 오류:', error);
        showMessage('구매 요청을 불러올 수 없습니다', 'error');
    }
}

// 대기 중인 요청 UI 업데이트
function updatePendingRequestsUI(pendingRequests) {
    const container = document.getElementById('pending-requests');
    if (!container) return;
    
    if (pendingRequests.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4">대기 중인 구매 요청이 없습니다</p>';
        return;
    }
    
    container.innerHTML = pendingRequests.map(request => {
        const isForCurrentUser = currentUser && request.seller_id === currentUser.id;
        const requestTime = new Date(request.request_time).toLocaleString();
        const priceClass = request.offered_price !== request.original_price ? 'text-orange-600 font-bold' : 'text-green-600';
        
        return `
            <div class="border rounded-lg p-4 ${isForCurrentUser ? 'border-blue-300 bg-blue-50' : 'bg-gray-50'}">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h5 class="font-medium text-gray-800">${request.item_name}</h5>
                        <p class="text-sm text-gray-600">
                            ${request.buyer_name} → ${request.seller_name}
                        </p>
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">원가: ${request.original_price}P</div>
                        <div class="text-lg ${priceClass}">제안: ${request.offered_price}P</div>
                    </div>
                </div>
                
                ${request.buyer_message ? `
                    <div class="mb-3 p-2 bg-white rounded border-l-4 border-blue-300">
                        <div class="text-xs text-gray-600 mb-1">💌 구매자 메시지:</div>
                        <div class="text-sm">${request.buyer_message}</div>
                    </div>
                ` : ''}
                
                <div class="flex justify-between items-center text-xs text-gray-500 mb-3">
                    <span>⏰ ${requestTime}</span>
                    ${request.offered_price !== request.original_price ? 
                        `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded">가격 협상</span>` : 
                        `<span class="bg-green-100 text-green-700 px-2 py-1 rounded">정가 구매</span>`
                    }
                </div>
                
                ${isForCurrentUser ? `
                    <div class="flex gap-2">
                        <button onclick="acceptPurchaseRequest('${request.id}')" 
                                class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm">
                            ✅ 수락 (${request.offered_price}P에 판매)
                        </button>
                        <button onclick="showRejectModal('${request.id}')" 
                                class="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm">
                            ❌ 거절
                        </button>
                    </div>
                ` : `
                    <div class="text-center">
                        <span class="text-sm text-gray-500">판매자의 응답을 기다리는 중...</span>
                    </div>
                `}
            </div>
        `;
    }).join('');
}

// 최근 처리된 요청 UI 업데이트
function updateRecentRequestsUI(recentRequests) {
    const container = document.getElementById('recent-requests');
    if (!container) return;
    
    if (recentRequests.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-4 text-sm">처리 내역이 없습니다</p>';
        return;
    }
    
    container.innerHTML = recentRequests.map(request => {
        const responseTime = request.response_time ? new Date(request.response_time).toLocaleString() : '미처리';
        const statusClass = {
            'accepted': 'bg-green-100 text-green-800',
            'rejected': 'bg-red-100 text-red-800',
            'cancelled': 'bg-gray-100 text-gray-800'
        };
        const statusText = {
            'accepted': '✅ 수락됨',
            'rejected': '❌ 거절됨',
            'cancelled': '⏹️ 취소됨'
        };
        
        return `
            <div class="flex items-center justify-between p-2 border rounded text-sm">
                <div class="flex-1">
                    <div class="font-medium truncate">${request.item_name}</div>
                    <div class="text-xs text-gray-600">${request.buyer_name} → ${request.seller_name}</div>
                </div>
                <div class="text-right ml-2">
                    <div class="text-xs ${statusClass[request.status]} px-2 py-1 rounded mb-1">
                        ${statusText[request.status]}
                    </div>
                    <div class="text-xs text-gray-500">${responseTime}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 구매 요청 수락
async function acceptPurchaseRequest(requestId) {
    if (!confirm('이 구매 요청을 수락하시겠습니까?')) {
        return;
    }
    
    try {
        showMessage('구매 요청을 처리하는 중...', 'info');
        
        // 요청 정보 가져오기
        const requestsData = await fetchTableData('purchase_requests');
        const request = requestsData.data.find(req => req.id === requestId);
        
        if (!request || request.status !== 'pending') {
            showMessage('유효하지 않은 요청입니다', 'error');
            return;
        }
        
        // 1. 거래 기록 생성
        const transaction = {
            buyer_id: request.buyer_id,
            seller_id: request.seller_id,
            item_id: request.item_id,
            amount: request.offered_price,
            transaction_time: new Date().toISOString()
        };
        
        await createRecord('transactions', transaction);
        
        // 2. 아이템 상태 변경
        await updateRecord('items', request.item_id, {
            status: 'sold',
            buyer_id: request.buyer_id,
            final_price: request.offered_price
        });
        
        // 3. 구매자 포인트 차감
        const usersData = await fetchTableData('users');
        const buyer = usersData.data.find(user => user.id === request.buyer_id);
        const seller = usersData.data.find(user => user.id === request.seller_id);
        
        if (buyer) {
            await updateRecord('users', buyer.id, {
                purchase_points: buyer.purchase_points - request.offered_price
            });
        }
        
        // 4. 판매자 수익 증가
        if (seller) {
            await updateRecord('users', seller.id, {
                sales_earnings: (seller.sales_earnings || 0) + request.offered_price
            });
        }
        
        // 5. 요청 상태 업데이트
        await updateRecord('purchase_requests', requestId, {
            status: 'accepted',
            final_price: request.offered_price,
            response_time: new Date().toISOString(),
            seller_response: '구매 요청이 수락되었습니다'
        });
        
        showMessage(`🎉 구매 요청을 수락했습니다! ${request.offered_price}P를 받으셨습니다.`, 'success');
        
        // UI 새로고침
        await refreshPurchaseRequests();
        await loadMarketplace();
        
    } catch (error) {
        console.error('❌ 구매 요청 수락 오류:', error);
        showMessage('구매 요청 수락에 실패했습니다', 'error');
    }
}

// 거절 모달 표시
function showRejectModal(requestId) {
    const reason = prompt('거절 사유를 입력해주세요 (선택사항):');
    if (reason !== null) { // 취소하지 않은 경우
        rejectPurchaseRequest(requestId, reason || '판매자가 거절했습니다');
    }
}

// 구매 요청 거절
async function rejectPurchaseRequest(requestId, reason = '') {
    try {
        showMessage('구매 요청을 거절하는 중...', 'info');
        
        await updateRecord('purchase_requests', requestId, {
            status: 'rejected',
            response_time: new Date().toISOString(),
            seller_response: reason
        });
        
        showMessage('구매 요청을 거절했습니다', 'info');
        
        // UI 새로고침
        await refreshPurchaseRequests();
        
    } catch (error) {
        console.error('❌ 구매 요청 거절 오류:', error);
        showMessage('구매 요청 거절에 실패했습니다', 'error');
    }
}

// 전역으로 내보내기
window.refreshPurchaseRequests = refreshPurchaseRequests;
window.acceptPurchaseRequest = acceptPurchaseRequest;
window.rejectPurchaseRequest = rejectPurchaseRequest;
window.showRejectModal = showRejectModal;
