-- 창건샘의 How Much 마켓 - Supabase RLS 보안 정책 설정
-- 이 코드를 Supabase SQL Editor에서 실행하여 보안 정책을 설정하세요!

-- 🔧 기존 정책이 있다면 삭제 (충돌 방지)
DROP POLICY IF EXISTS "Anyone can view users" ON users;
DROP POLICY IF EXISTS "Anyone can insert users" ON users;
DROP POLICY IF EXISTS "Anyone can update users" ON users;
DROP POLICY IF EXISTS "Anyone can delete users" ON users;

DROP POLICY IF EXISTS "Anyone can view items" ON items;
DROP POLICY IF EXISTS "Anyone can insert items" ON items;
DROP POLICY IF EXISTS "Anyone can update items" ON items;
DROP POLICY IF EXISTS "Anyone can delete items" ON items;

DROP POLICY IF EXISTS "Anyone can view transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can insert transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can update transactions" ON transactions;
DROP POLICY IF EXISTS "Anyone can delete transactions" ON transactions;

DROP POLICY IF EXISTS "Anyone can view purchase_requests" ON purchase_requests;
DROP POLICY IF EXISTS "Anyone can insert purchase_requests" ON purchase_requests;
DROP POLICY IF EXISTS "Anyone can update purchase_requests" ON purchase_requests;
DROP POLICY IF EXISTS "Anyone can delete purchase_requests" ON purchase_requests;

-- 🛡️ RLS(Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;

-- 🎓 교육용 환경을 위한 개방적 정책
-- (실제 운영 환경에서는 더 엄격한 정책 필요)

-- users 테이블 정책
CREATE POLICY "Educational access for users" ON users
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- items 테이블 정책  
CREATE POLICY "Educational access for items" ON items
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- transactions 테이블 정책
CREATE POLICY "Educational access for transactions" ON transactions
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- purchase_requests 테이블 정책
CREATE POLICY "Educational access for purchase_requests" ON purchase_requests
FOR ALL 
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 🔐 향후 보안 강화 참고 (주석)
/*
더 안전한 정책 예시:

-- 사용자별 데이터 접근 제한
CREATE POLICY "Users own data only" ON users
FOR UPDATE USING (auth.uid() = id);

-- 판매자만 자신의 아이템 수정
CREATE POLICY "Sellers edit own items" ON items  
FOR UPDATE USING (auth.uid() = seller_id);

-- 거래 당사자만 내역 조회
CREATE POLICY "Transaction parties only" ON transactions
FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
*/

-- ✅ 성공 메시지
SELECT '🛡️ 교육용 RLS 정책이 성공적으로 설정되었습니다!' as result;
SELECT '📚 모든 사용자가 데이터에 접근할 수 있습니다.' as note;
SELECT '🔐 운영 환경 시 더 엄격한 정책으로 변경하세요.' as warning;
