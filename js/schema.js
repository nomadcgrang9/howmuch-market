// 데이터베이스 스키마 자동 생성 유틸리티

// 테이블 스키마 정의
const TABLE_SCHEMAS = {
    users: [
        { name: 'id', type: 'text', description: '사용자 ID' },
        { name: 'student_number', type: 'text', description: '학번 (4자리)' },
        { name: 'name', type: 'text', description: '이름' },
        { name: 'purchase_points', type: 'number', description: '구매 포인트' },
        { name: 'sales_earnings', type: 'number', description: '판매 수익' },
        { name: 'is_teacher', type: 'bool', description: '선생님 여부' }
    ],
    items: [
        { name: 'id', type: 'text', description: '아이템 ID' },
        { name: 'name', type: 'text', description: '아이템 이름' },
        { name: 'description', type: 'text', description: '설명' },
        { name: 'price', type: 'number', description: '가격' },
        { name: 'category', type: 'text', description: '카테고리' },
        { name: 'image_url', type: 'rich_text', description: '이미지 URL' },
        { name: 'seller_id', type: 'text', description: '판매자 ID' },
        { name: 'status', type: 'text', description: '상태 (available/sold)' }
    ],
    transactions: [
        { name: 'id', type: 'text', description: '거래 ID' },
        { name: 'buyer_id', type: 'text', description: '구매자 ID' },
        { name: 'seller_id', type: 'text', description: '판매자 ID' },
        { name: 'item_id', type: 'text', description: '아이템 ID' },
        { name: 'amount', type: 'number', description: '거래 금액' },
        { name: 'transaction_time', type: 'datetime', description: '거래 시간' }
    ],
    point_history: [
        { name: 'id', type: 'text', description: '이력 ID' },
        { name: 'student_id', type: 'text', description: '학생 ID' },
        { name: 'student_name', type: 'text', description: '학생 이름' },
        { name: 'old_points', type: 'number', description: '변경 전 포인트' },
        { name: 'new_points', type: 'number', description: '변경 후 포인트' },
        { name: 'point_difference', type: 'number', description: '포인트 차이' },
        { name: 'reason', type: 'text', description: '변경 사유' },
        { name: 'changed_by', type: 'text', description: '변경자 (teacher/system)' },
        { name: 'change_time', type: 'datetime', description: '변경 시간' }
    ],
    announcements: [
        { name: 'id', type: 'text', description: '공지 ID' },
        { name: 'type', type: 'text', description: '공지 유형 (info/warning/success/urgent)' },
        { name: 'message', type: 'rich_text', description: '공지 내용' },
        { name: 'duration', type: 'number', description: '표시 시간 (분)' },
        { name: 'expires_at', type: 'datetime', description: '만료 시간' },
        { name: 'sent_by', type: 'text', description: '전송자' },
        { name: 'active', type: 'bool', description: '활성 상태' },
        { name: 'deactivated_at', type: 'datetime', description: '비활성화 시간' },
        { name: 'deactivated_by', type: 'text', description: '비활성화한 사용자' }
    ],
    system_settings: [
        { name: 'id', type: 'text', description: '설정 ID' },
        { name: 'settings_type', type: 'text', description: '설정 유형' },
        { name: 'settings_data', type: 'rich_text', description: '설정 데이터 (JSON)' },
        { name: 'updated_by', type: 'text', description: '수정자' },
        { name: 'updated_at', type: 'datetime', description: '수정 시간' }
    ],
    system_notices: [
        { name: 'id', type: 'text', description: '공지 ID' },
        { name: 'title', type: 'text', description: '공지 제목' },
        { name: 'content', type: 'rich_text', description: '공지 내용' },
        { name: 'notice_type', type: 'text', description: '공지 유형 (info/warning/success/urgent)' },
        { name: 'sent_by', type: 'text', description: '발송자' },
        { name: 'sent_time', type: 'datetime', description: '발송 시간' },
        { name: 'is_active', type: 'bool', description: '활성 상태' }
    ],
    game_settings: [
        { name: 'id', type: 'text', description: '설정 ID' },
        { name: 'setting_key', type: 'text', description: '설정 키' },
        { name: 'setting_value', type: 'text', description: '설정 값' },
        { name: 'description', type: 'text', description: '설정 설명' },
        { name: 'updated_by', type: 'text', description: '마지막 수정자' },
        { name: 'updated_time', type: 'datetime', description: '마지막 수정 시간' }
    ],
    activity_log: [
        { name: 'id', type: 'text', description: '로그 ID' },
        { name: 'user_id', type: 'text', description: '사용자 ID' },
        { name: 'user_name', type: 'text', description: '사용자 이름' },
        { name: 'action_type', type: 'text', description: '행동 유형 (login/logout/purchase/sell/etc)' },
        { name: 'action_description', type: 'text', description: '행동 상세 설명' },
        { name: 'target_item_id', type: 'text', description: '대상 아이템 ID (해당시)' },
        { name: 'action_time', type: 'datetime', description: '행동 시간' },
        { name: 'ip_address', type: 'text', description: 'IP 주소 (선택)' }
    ],
    purchase_requests: [
        { name: 'id', type: 'text', description: '구매 요청 ID' },
        { name: 'buyer_id', type: 'text', description: '구매자 ID' },
        { name: 'buyer_name', type: 'text', description: '구매자 이름' },
        { name: 'seller_id', type: 'text', description: '판매자 ID' },
        { name: 'seller_name', type: 'text', description: '판매자 이름' },
        { name: 'item_id', type: 'text', description: '아이템 ID' },
        { name: 'item_name', type: 'text', description: '아이템 이름' },
        { name: 'original_price', type: 'number', description: '원래 가격' },
        { name: 'offered_price', type: 'number', description: '제안 가격' },
        { name: 'buyer_message', type: 'text', description: '구매자 메시지' },
        { name: 'status', type: 'text', description: '상태 (pending/accepted/rejected/cancelled)' },
        { name: 'seller_response', type: 'text', description: '판매자 응답 메시지' },
        { name: 'final_price', type: 'number', description: '최종 합의 가격' },
        { name: 'request_time', type: 'datetime', description: '요청 시간' },
        { name: 'response_time', type: 'datetime', description: '응답 시간' }
    ]
};

// 테이블 스키마 생성 함수
async function createTableSchemas() {
    console.log('📋 테이블 스키마 생성 시작...');
    
    const results = {};
    
    for (const [tableName, fields] of Object.entries(TABLE_SCHEMAS)) {
        try {
            console.log(`🔧 ${tableName} 테이블 스키마 생성 중...`);
            
            // 테이블 스키마 API 호출
            const response = await fetch('tables/schema', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: tableName,
                    fields: fields
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${tableName} 테이블 생성 성공:`, result);
                results[tableName] = { success: true, data: result };
            } else {
                const errorText = await response.text().catch(() => '');
                console.log(`⚠️ ${tableName} 테이블 생성 실패 (${response.status}):`, errorText);
                results[tableName] = { success: false, error: errorText };
            }
            
        } catch (error) {
            console.error(`❌ ${tableName} 테이블 스키마 생성 오류:`, error);
            results[tableName] = { success: false, error: error.message };
        }
    }
    
    console.log('📋 테이블 스키마 생성 완료:', results);
    return results;
}

// 테이블 존재 확인 함수
async function checkTablesExist() {
    console.log('🔍 테이블 존재 여부 확인...');
    
    const tableStatus = {};
    
    for (const tableName of Object.keys(TABLE_SCHEMAS)) {
        try {
            const response = await fetch(`tables/${tableName}?limit=1`);
            tableStatus[tableName] = response.ok;
            console.log(`📊 ${tableName} 테이블:`, response.ok ? '존재' : '없음');
        } catch (error) {
            tableStatus[tableName] = false;
            console.log(`📊 ${tableName} 테이블: 확인 실패`);
        }
    }
    
    return tableStatus;
}

// 데이터베이스 초기화 함수
async function initializeDatabase() {
    console.log('🚀 데이터베이스 초기화 시작...');
    
    try {
        // 1단계: 테이블 존재 확인
        const tableStatus = await checkTablesExist();
        
        // 2단계: 없는 테이블이 있으면 스키마 생성
        const missingTables = Object.entries(tableStatus)
            .filter(([name, exists]) => !exists)
            .map(([name]) => name);
            
        if (missingTables.length > 0) {
            console.log('📋 누락된 테이블:', missingTables);
            await createTableSchemas();
        } else {
            console.log('✅ 모든 테이블이 존재합니다');
        }
        
        // 3단계: 다시 한 번 확인
        const finalStatus = await checkTablesExist();
        console.log('🎯 최종 테이블 상태:', finalStatus);
        
        return finalStatus;
        
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 실패:', error);
        throw error;
    }
}

// 전역으로 내보내기
window.initializeDatabase = initializeDatabase;
window.createTableSchemas = createTableSchemas;
window.checkTablesExist = checkTablesExist;