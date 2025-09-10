// Supabase 설정 및 연결 (안정화 버전)
const SUPABASE_URL = 'https://sflnnyqdwklcufuohnmj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbG5ueXFkd2tsY3VmdW9obm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDIzNTksImV4cCI6MjA3MzA3ODM1OX0.BbmYbMYMlLky8uj5YrUnCvVKPZrbpSFtCdOaiEAgNOU';

let supabase = null;

// Supabase 라이브러리가 로드될 때까지 기다렸다가 초기화하는 함수
function initializeSupabaseWhenReady() {
    // window.supabase 객체가 존재하는지 확인
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        console.log('🚀 Supabase 라이브러리 로드 확인! 초기화를 시작합니다...');
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('✅ Supabase 클라이언트 생성 완료!');
            
            // 앱의 다른 부분들이 사용할 수 있도록 전역 함수로 만들어줍니다.
            window.supabaseClient = supabase;
            window.fetchTableData = async (tableName) => {
                const { data, error } = await supabase.from(tableName).select('*');
                if (error) throw error;
                return { data };
            };
            window.createRecord = async (tableName, recordData) => {
                const { data, error } = await supabase.from(tableName).insert([recordData]).select().single();
                if (error) throw error;
                return data;
            };
            window.updateRecord = async (tableName, recordId, updateData) => {
                const { data, error } = await supabase.from(tableName).update(updateData).eq('id', recordId).select().single();
                if (error) throw error;
                return data;
            };
            window.deleteRecord = async (tableName, recordId) => {
                 const { error } = await supabase.from(tableName).delete().eq('id', recordId);
                 if (error) throw error;
                 return true;
            };

            // "supabaseIsReady" 신호를 보내서 main.js가 앱을 시작하도록 합니다.
            document.dispatchEvent(new Event('supabaseIsReady'));

        } catch (error) {
            console.error('❌ Supabase 클라이언트 생성 중 오류 발생:', error);
        }
    } else {
        // 아직 준비되지 않았다면 100ms 후에 다시 시도합니다.
        console.log('...Supabase 라이브러리를 기다리는 중...');
        setTimeout(initializeSupabaseWhenReady, 100);
    }
}

// Supabase 초기화 시작
initializeSupabaseWhenReady();
