-- 창건샘의 How Much 마켓 - 보안 정책(Policy) 설정
-- 이 코드를 Supabase SQL Editor에 붙여넣고 실행하세요!

-- 1. 모든 테이블에 RLS(Row Level Security) 활성화
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_history ENABLE ROW LEVEL SECURITY;

-- 2. users 테이블 정책 (모든 사용자가 모든 작업 가능)
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update users" ON users FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete users" ON users FOR DELETE USING (true);

-- 3. items 테이블 정책 (모든 사용자가 모든 작업 가능)
CREATE POLICY "Anyone can view items" ON items FOR SELECT USING (true);
CREATE POLICY "Anyone can insert items" ON items FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update items" ON items FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete items" ON items FOR DELETE USING (true);

-- 4. transactions 테이블 정책 (모든 사용자가 모든 작업 가능)
CREATE POLICY "Anyone can view transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete transactions" ON transactions FOR DELETE USING (true);

-- 5. purchase_requests 테이블 정책 (모든 사용자가 모든 작업 가능)
CREATE POLICY "Anyone can view purchase_requests" ON purchase_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can insert purchase_requests" ON purchase_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update purchase_requests" ON purchase_requests FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete purchase_requests" ON purchase_requests FOR DELETE USING (true);

-- 6. point_history 테이블 정책 (모든 사용자가 모든 작업 가능)
CREATE POLICY "Anyone can view point_history" ON point_history FOR SELECT USING (true);
CREATE POLICY "Anyone can insert point_history" ON point_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update point_history" ON point_history FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete point_history" ON point_history FOR DELETE USING (true);

-- 성공 메시지
SELECT '🔐 모든 보안 정책이 성공적으로 설정되었습니다!' as result;