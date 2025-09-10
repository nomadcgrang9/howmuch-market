// Supabase 설정 및 연결
const SUPABASE_URL = 'https://sflnnyqdwklcufuohnmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbG5ueXFkd2tsY3VmdW9obm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDIzNTksImV4cCI6MjA3MzA3ODM1OX0.BbmYbMYMlLky8uj5YrUnCvVKPZrbpSFtCdOaiEAgNOU';

// Supabase 클라이언트 초기화
let supabase = null;

// Supabase 라이브러리 로딩 및 초기화
async function initializeSupabase() {
    try {
        console.log('🚀 Supabase 초기화 시작...');
        
        // Supabase 클라이언트 생성
        if (typeof supabase?.createClient === 'function') {
            window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase 연결 성공!');
            return true;
        } else if (typeof window.supabase?.createClient === 'function') {
            window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase 연결 성공!');
            return true;
        } else {
            console.error('❌ Supabase 라이브러리가 로드되지 않았습니다');
            console.log('사용 가능한 객체들:', Object.keys(window));
            return false;
        }
    } catch (error) {
        console.error('❌ Supabase 초기화 오류:', error);
        return false;
    }
}

// Supabase API 함수들 (기존 API와 동일한 인터페이스)
async function fetchTableData(tableName, options = {}) {
    try {
        const client = window.supabase;
        if (!client) {
            throw new Error('Supabase가 초기화되지 않았습니다');
        }
        
        console.log(`🔗 Supabase에서 ${tableName} 데이터 조회...`);
        
        let query = client.from(tableName).select('*');
        
        // 페이지네이션 적용
        if (options.page && options.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }
        
        // 정렬 적용
        if (options.sort) {
            query = query.order(options.sort, { ascending: false });
        }
        
        const { data, error, count } = await query;
        
        if (error) {
            throw error;
        }
        
        console.log(`✅ ${tableName} 데이터 조회 성공:`, data?.length || 0, '건');
        
        return {
            data: data || [],
            total: count || data?.length || 0,
            page: options.page || 1,
            limit: options.limit || 100,
            table: tableName
        };
        
    } catch (error) {
        console.error(`❌ ${tableName} 조회 오류:`, error);
        
        // 오프라인 모드 또는 에러 시 빈 데이터 반환
        return {
            data: [],
            total: 0,
            page: 1,
            limit: 100,
            table: tableName,
            error: error.message
        };
    }
}

async function createRecord(tableName, recordData) {
    try {
        const client = window.supabase;
        if (!client) {
            throw new Error('Supabase가 초기화되지 않았습니다');
        }
        
        console.log(`➕ ${tableName}에 새 레코드 생성:`, recordData);
        
        const { data, error } = await client
            .from(tableName)
            .insert([recordData])
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 생성 성공:`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ ${tableName} 생성 오류:`, error);
        throw error;
    }
}

async function updateRecord(tableName, recordId, updateData) {
    try {
        const client = window.supabase;
        if (!client) {
            throw new Error('Supabase가 초기화되지 않았습니다');
        }
        
        console.log(`📝 ${tableName} 레코드 ${recordId} 업데이트:`, updateData);
        
        const { data, error } = await client
            .from(tableName)
            .update(updateData)
            .eq('id', recordId)
            .select()
            .single();
        
        if (error) {
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 업데이트 성공:`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ ${tableName} 업데이트 오류:`, error);
        throw error;
    }
}

async function deleteRecord(tableName, recordId) {
    try {
        const client = window.supabase;
        if (!client) {
            throw new Error('Supabase가 초기화되지 않았습니다');
        }
        
        console.log(`🗑️ ${tableName} 레코드 ${recordId} 삭제`);
        
        const { error } = await client
            .from(tableName)
            .delete()
            .eq('id', recordId);
        
        if (error) {
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 삭제 성공`);
        return true;
        
    } catch (error) {
        console.error(`❌ ${tableName} 삭제 오류:`, error);
        throw error;
    }
}

// Supabase 테이블 생성 함수
async function createSupabaseTables() {
    try {
        console.log('📋 Supabase 테이블 생성 시작...');
        
        // 테이블이 이미 있는지 확인하고 없으면 생성 안내
        const tables = ['users', 'items', 'transactions', 'purchase_requests'];
        
        for (const tableName of tables) {
            try {
                const client = window.supabase;
                if (!client) continue;
                
                const { data, error } = await client
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                    
                if (!error) {
                    console.log(`✅ ${tableName} 테이블이 이미 존재합니다`);
                }
            } catch (error) {
                console.warn(`⚠️ ${tableName} 테이블을 확인할 수 없습니다:`, error.message);
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ 테이블 확인 오류:', error);
        return false;
    }
}

// 기존 코드 호환성을 위한 전역 변수 설정
window.supabase = null;
window.fetchTableData = fetchTableData;
window.createRecord = createRecord;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.initializeSupabase = initializeSupabase;
window.createSupabaseTables = createSupabaseTables;

console.log('📱 Supabase 설정 파일 로드 완료');