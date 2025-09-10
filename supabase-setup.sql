-- 창건샘의 How Much 마켓 - Supabase 테이블 생성 SQL
-- 이 코드를 Supabase SQL Editor에 붙여넣고 실행하세요!

-- 1. users 테이블 (사용자 정보)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_number TEXT NOT NULL,
    name TEXT NOT NULL,
    purchase_points INTEGER DEFAULT 10000,
    sales_earnings INTEGER DEFAULT 0,
    is_teacher BOOLEAN DEFAULT FALSE,
    role TEXT DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. items 테이블 (아이템 정보)
CREATE TABLE IF NOT EXISTS items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    seller_id UUID REFERENCES users(id),
    status TEXT DEFAULT 'available',
    buyer_id UUID REFERENCES users(id),
    final_price INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. transactions 테이블 (거래 내역)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    item_id UUID REFERENCES items(id),
    amount INTEGER NOT NULL,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. purchase_requests 테이블 (구매 요청)
CREATE TABLE IF NOT EXISTS purchase_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    buyer_id UUID REFERENCES users(id),
    buyer_name TEXT NOT NULL,
    seller_id UUID REFERENCES users(id),
    seller_name TEXT NOT NULL,
    item_id UUID REFERENCES items(id),
    item_name TEXT NOT NULL,
    original_price INTEGER NOT NULL,
    offered_price INTEGER NOT NULL,
    buyer_message TEXT,
    status TEXT DEFAULT 'pending',
    seller_response TEXT,
    final_price INTEGER,
    request_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    response_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. point_history 테이블 (포인트 변경 이력)
CREATE TABLE IF NOT EXISTS point_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES users(id),
    student_name TEXT NOT NULL,
    old_points INTEGER NOT NULL,
    new_points INTEGER NOT NULL,
    point_difference INTEGER NOT NULL,
    reason TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    change_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_users_student_number ON users(student_number);
CREATE INDEX IF NOT EXISTS idx_items_seller_id ON items(seller_id);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_status ON purchase_requests(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requests_seller_id ON purchase_requests(seller_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블에 updated_at 자동 업데이트 트리거 추가
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at 
    BEFORE UPDATE ON items 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requests_updated_at 
    BEFORE UPDATE ON purchase_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 테스트용 선생님 계정 생성
INSERT INTO users (student_number, name, purchase_points, sales_earnings, is_teacher, role)
VALUES ('0000', 'Teacher', 999999, 999999, TRUE, 'teacher')
ON CONFLICT DO NOTHING;

-- 테스트용 학생 계정들 생성 (4학년 1반)
INSERT INTO users (student_number, name, purchase_points, sales_earnings, is_teacher, role) VALUES 
('4101', '김철수', 10000, 0, FALSE, 'student'),
('4102', '이영희', 10000, 0, FALSE, 'student'),
('4103', '박민수', 10000, 0, FALSE, 'student'),
('4104', '정수빈', 10000, 0, FALSE, 'student'),
('4105', '최유진', 10000, 0, FALSE, 'student')
ON CONFLICT DO NOTHING;

-- 테스트용 학생 계정들 생성 (4학년 2반)
INSERT INTO users (student_number, name, purchase_points, sales_earnings, is_teacher, role) VALUES 
('4201', '김민지', 10000, 0, FALSE, 'student'),
('4202', '이준호', 10000, 0, FALSE, 'student'),
('4203', '박서연', 10000, 0, FALSE, 'student')
ON CONFLICT DO NOTHING;

-- 성공 메시지
SELECT '🎉 모든 테이블이 성공적으로 생성되었습니다!' as result;