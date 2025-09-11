# 🏪 창건샘의 How Much 마켓 - 교육용 마켓플레이스

## 📋 프로젝트 개요

초등학교 영어수업을 위한 포켓몬 카드 스타일 게임화 마켓플레이스입니다. 학생들이 포인트를 사용하여 아이템을 구매/판매하고, 선생님이 전체 시스템을 관리할 수 있는 교육 게임화 플랫폼입니다.

## ✅ 현재 완료된 기능

### 🎓 학생용 기능
- **회원가입/로그인**: 학번으로 간편 로그인
- **포인트 시스템**: 구매 포인트와 판매 수익 분리 관리
- **아이템 브라우징**: 카테고리별 아이템 필터링 및 검색
- **구매 시스템**: 포인트 차감 및 거래 기록
- **판매 시스템**: 아이템 등록 및 판매 수익 관리
- **마이페이지**: 구매/판매 내역 확인

### 👩‍🏫 교사 관리자 기능
- **학생 관리**: 
  - 전체 학생 목록 조회
  - 개별 학생 포인트 수정 (구매P/판매P)
  - 전체 학생 일괄 포인트 지급
  - 학생별 포인트 변동 내역 조회
- **아이템 관리**:
  - 전체 아이템 목록 및 상태 확인
  - 개별 아이템 삭제 (관련 트랜잭션 자동 정리)
  - 실시간 판매 통계 확인

### 🔧 기술적 특징
- **정적 웹사이트**: HTML, CSS, JavaScript만으로 구현
- **Supabase 백엔드**: PostgreSQL 데이터베이스 및 실시간 API
- **반응형 디자인**: Tailwind CSS 기반 모바일 최적화
- **캐시 방지**: 강화된 브라우저 캐시 무효화 시스템

## 🌐 현재 기능 진입점 (URI 및 파라미터)

### 메인 페이지
- `index.html` - 메인 마켓플레이스 (학생용)

### 관리자 접근
- 메인 페이지 → "선생님이세요?" 버튼 → 비밀번호 입력 → 관리자 대시보드

### 주요 API 엔드포인트
- Supabase URL: `https://sflnnyqdwklcufuohnmj.supabase.co`
- 테이블: `users`, `items`, `transactions`
- 실시간 구독: 트랜잭션 변경 감지

## ❌ 미구현 기능

### 향후 추가 예정
- **알림 시스템**: 구매/판매 완료 시 푸시 알림
- **리뷰 시스템**: 아이템 구매 후 평점/리뷰 작성
- **랭킹 시스템**: 판매 수익 기반 리더보드
- **쿠폰 시스템**: 할인 쿠폰 발행 및 사용
- **배지 시스템**: 활동 기반 성취 배지

## 🚀 다음 개발 권장사항

1. **성능 최적화**
   - 이미지 lazy loading 구현
   - 페이지네이션 추가 (대용량 데이터 처리)
   
2. **사용자 경험 개선**
   - 로딩 애니메이션 추가
   - 오프라인 모드 지원
   
3. **보안 강화**
   - Rate limiting 구현
   - SQL 인젝션 방지 추가 검증

4. **분석 기능**
   - 판매 트렌드 차트
   - 학생별 활동 패턴 분석

## 📊 데이터 모델 및 구조

### 사용자 테이블 (users)
```sql
- id: UUID (Primary Key)
- student_number: TEXT (학번)
- name: TEXT (이름)
- class_name: TEXT (반 이름)
- purchase_points: INTEGER (구매 포인트)
- sales_earnings: INTEGER (판매 수익)
- created_at: TIMESTAMP
```

### 아이템 테이블 (items)
```sql
- id: UUID (Primary Key)
- name: TEXT (아이템명)
- price: INTEGER (가격)
- category: TEXT (카테고리)
- seller_id: UUID (판매자 ID)
- image_url: TEXT (이미지 URL)
- is_sold: BOOLEAN (판매 완료 여부)
- created_at: TIMESTAMP
```

### 거래 테이블 (transactions)
```sql
- id: UUID (Primary Key)
- buyer_id: UUID (구매자 ID)
- seller_id: UUID (판매자 ID)
- item_id: UUID (아이템 ID)
- price: INTEGER (거래 가격)
- created_at: TIMESTAMP
```

## 🔧 최근 해결된 주요 이슈

### 2025-09-11 수정사항
1. **관리자 대시보드 단순화**: "반별관리" 탭 제거, "학생관리"와 "아이템관리"만 유지
2. **JavaScript 함수 오류 해결**: ReferenceError 해결 위해 DOMContentLoaded 이벤트 기반 전역 함수 등록
3. **Foreign Key 제약조건 해결**: 아이템 삭제 시 관련 트랜잭션 자동 삭제 로직 추가
4. **CORS 문제 해결**: Supabase 클라이언트 설정 최적화
5. **브라우저 캐시 방지**: 강화된 버전 관리 및 캐시 무효화

## 📝 설치 및 실행

1. **Supabase 프로젝트 설정**
   ```bash
   # supabase-setup.sql 실행하여 테이블 생성
   # supabase-policies.sql 실행하여 RLS 정책 설정
   ```

2. **환경 설정**
   ```javascript
   // js/supabase-config.js에서 URL과 API 키 확인
   const SUPABASE_URL = 'your-project-url';
   const SUPABASE_ANON_KEY = 'your-anon-key';
   ```

3. **로컬 실행**
   - 정적 웹서버에서 index.html 실행
   - 또는 Live Server 확장으로 개발 서버 실행

## 🔒 관리자 접근

- **관리자 비밀번호**: `teacher2024!`
- **접근 경로**: 메인 페이지 → "선생님이세요?" → 비밀번호 입력

## 🛡️ 보안 고려사항

- 모든 민감한 작업은 Row Level Security(RLS) 정책으로 보호
- 관리자 기능은 클라이언트 사이드 인증으로 제한
- SQL 인젝션 방지를 위한 Supabase 내장 보안 사용

---

**마지막 업데이트**: 2025-09-11  
**버전**: v1.3.0  
**개발자**: AI Assistant  
**라이센스**: Educational Use Only
