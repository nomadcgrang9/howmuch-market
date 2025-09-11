// Supabase 설정 및 연결 - 실제 프로젝트 연결됨 ✅
const SUPABASE_URL = 'https://sflnnyqdwklcufuohnmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbG5ueXFkd2tsY3VmdW9obm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDIzNTksImV4cCI6MjA3MzA3ODM1OX0.BbmYbMYMlLky8uj5YrUnCvVKPZrbpSFtCdOaiEAgNOU';

// Supabase 클라이언트 초기화
let supabase = null;

// Supabase 라이브러리 로딩 및 초기화
async function initializeSupabase() {
    try {
        console.log('🚀 Supabase 초기화 시작...');
        console.log('📍 연결 대상:', SUPABASE_URL);
        
        // Supabase 라이브러리 로딩 대기 (최대 5초)
        let attempts = 0;
        const maxAttempts = 25;
        
        while (attempts < maxAttempts) {
            if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
                console.log('📦 Supabase 라이브러리 로딩 완료');
                break;
            }
            if (typeof supabase !== 'undefined' && supabase.createClient) {
                window.supabase = supabase;
                console.log('📦 Supabase 라이브러리 로딩 완료 (전역)');
                break;
            }
            
            console.log(`⏳ Supabase 라이브러리 로딩 대기 중... (${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        // 라이브러리 확인
        const supabaseLib = window.supabase || (typeof supabase !== 'undefined' ? supabase : null);
        
        if (!supabaseLib || typeof supabaseLib.createClient !== 'function') {
            console.error('❌ Supabase 라이브러리를 로드할 수 없습니다');
            console.log('🔍 사용 가능한 전역 객체:', Object.keys(window).filter(key => key.toLowerCase().includes('supabase')));
            return false;
        }
        
        // Supabase 클라이언트 생성 (CORS 설정 포함)
        console.log('🔗 Supabase 클라이언트 생성 중...');
        window.supabaseClient = supabaseLib.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            db: {
                schema: 'public'
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            },
            global: {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        });
        
        // 연결 테스트
        console.log('🧪 Supabase 연결 테스트 중...');
        const { data, error } = await window.supabaseClient
            .from('users')
            .select('count', { count: 'exact', head: true });
            
        if (error) {
            if (error.message.includes('relation "users" does not exist')) {
                console.warn('⚠️ users 테이블이 존재하지 않습니다. 테이블을 생성해야 합니다.');
                console.info('📋 해결 방법: Supabase 대시보드에서 SQL을 실행하여 테이블을 생성하세요.');
                console.info('🔗 SQL 파일: supabase-setup.sql 참조');
                return false;
            } else if (error.message.includes('JWT') || error.message.includes('API key')) {
                console.error('❌ 인증 오류: API 키가 올바르지 않거나 만료되었습니다');
                return false;
            } else {
                console.error('❌ Supabase 연결 테스트 실패:', error.message);
                console.info('🔍 오류 상세:', error);
                return false;
            }
        }
        
        console.log('✅ Supabase 연결 및 테스트 성공!');
        console.log('📊 users 테이블 확인 완료');
        return true;
        
    } catch (error) {
        console.error('❌ Supabase 초기화 오류:', error);
        return false;
    }
}

// Supabase API 함수들 (기존 API와 동일한 인터페이스)
async function fetchTableData(tableName, options = {}) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        console.log(`🔗 Supabase에서 ${tableName} 데이터 조회...`, options);
        
        let query = client.from(tableName).select('*', { count: 'exact' });
        
        // 정렬 적용 (created_at 기본)
        const sortField = options.sort || 'created_at';
        query = query.order(sortField, { ascending: false });
        
        // 페이지네이션 적용
        if (options.page && options.limit) {
            const from = (options.page - 1) * options.limit;
            const to = from + options.limit - 1;
            query = query.range(from, to);
        }
        
        // 검색 조건 적용
        if (options.search && options.searchField) {
            query = query.ilike(options.searchField, `%${options.search}%`);
        }
        
        const { data, error, count } = await query;
        
        if (error) {
            console.error(`❌ Supabase ${tableName} 조회 오류:`, error);
            throw error;
        }
        
        console.log(`✅ ${tableName} 데이터 조회 성공:`, data?.length || 0, '건 (총', count, '건)');
        
        return {
            data: data || [],
            total: count || 0,
            page: options.page || 1,
            limit: options.limit || 100,
            table: tableName
        };
        
    } catch (error) {
        console.error(`❌ ${tableName} 조회 오류:`, error.message);
        throw error;
    }
}

async function createRecord(tableName, recordData) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        console.log(`➕ ${tableName}에 새 레코드 생성:`, recordData);
        
        // 시스템 필드 자동 추가 (Supabase에서 자동 처리되지만 명시적으로 포함)
        const recordWithTimestamps = {
            ...recordData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await client
            .from(tableName)
            .insert([recordWithTimestamps])
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Supabase ${tableName} 생성 오류:`, error);
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 생성 성공:`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ ${tableName} 생성 오류:`, error.message);
        throw error;
    }
}

async function updateRecord(tableName, recordId, updateData) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        console.log(`📝 ${tableName} 레코드 ${recordId} 업데이트:`, updateData);
        
        // updated_at 필드 자동 추가
        const updateWithTimestamp = {
            ...updateData,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await client
            .from(tableName)
            .update(updateWithTimestamp)
            .eq('id', recordId)
            .select()
            .single();
        
        if (error) {
            console.error(`❌ Supabase ${tableName} 업데이트 오류:`, error);
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 업데이트 성공:`, data);
        return data;
        
    } catch (error) {
        console.error(`❌ ${tableName} 업데이트 오류:`, error.message);
        throw error;
    }
}

async function deleteRecord(tableName, recordId) {
    try {
        const client = window.supabaseClient;
        if (!client) {
            throw new Error('Supabase 클라이언트가 초기화되지 않았습니다');
        }
        
        console.log(`🗑️ ${tableName} 레코드 ${recordId} 삭제`);
        
        const { error } = await client
            .from(tableName)
            .delete()
            .eq('id', recordId);
        
        if (error) {
            console.error(`❌ Supabase ${tableName} 삭제 오류:`, error);
            throw error;
        }
        
        console.log(`✅ ${tableName} 레코드 삭제 성공`);
        return true;
        
    } catch (error) {
        console.error(`❌ ${tableName} 삭제 오류:`, error.message);
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
