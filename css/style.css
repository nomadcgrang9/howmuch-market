/* 창건샘의 How Much 마켓 - 아기자기한 커스텀 스타일 */

/* 부드러운 글씨체 추가 */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&family=Jua&display=swap');

/* 눈에 편안한 컬러 팔레트 */
:root {
    --primary-color: #6eb5ff;        /* 부드러운 파란색 */
    --primary-light: #a8d0ff;       /* 연한 파란색 */
    --primary-dark: #4a9eff;        /* 진한 파란색 */
    --secondary-color: #b3e5fc;     /* 하늘색 */
    --accent-color: #81c784;        /* 포인트용 연초록 */
    --background-light: #f8fbff;    /* 아주 연한 파랑 화이트 */
    --background-white: #ffffff;    /* 순백색 */
    --text-dark: #2c3e50;           /* 다크 네이비 */
    --text-medium: #546e7a;         /* 중간 그레이 블루 */
    --success-color: #81c784;       /* 성공 초록 */
    --warning-color: #ffcc80;       /* 경고 오렌지 */
    --error-color: #ef5350;         /* 에러 빨강 */
}

/* 전체 폰트 설정 */
* {
    font-family: 'Noto Sans KR', sans-serif;
}

/* 제목용 부드러운 폰트 */
.cute-font {
    font-family: 'Jua', cursive;
}

/* 메인 헤더 */
nav {
    background: linear-gradient(135deg, var(--primary-color), var(--primary-dark)) !important;
    box-shadow: 0 4px 20px rgba(110, 181, 255, 0.3);
}

/* 눈에 편안한 배경 */
body {
    background-color: var(--background-light);
    background-image: 
        radial-gradient(circle at 20% 80%, rgba(179, 229, 252, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(168, 208, 255, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 40% 80%, var(--primary-light) 0%, transparent 50%);
}

.tab-btn {
    color: var(--text-dark);
    @apply border-b-2 border-transparent transition-all duration-200 ease-in-out;
    border-radius: 15px 15px 0 0;
    background: transparent;
    position: relative;
}

.tab-btn::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 3px;
    background: var(--primary-color);
    transition: all 0.3s ease;
    transform: translateX(-50%);
    border-radius: 2px;
}

.tab-btn.active {
    background: var(--primary-color);
    color: white;
    @apply shadow-md font-bold;
}

.tab-btn.active::before {
    width: 80%;
    background: white;
}

.tab-btn:hover:not(.active) {
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.tab-btn:hover:not(.active)::before {
    width: 60%;
}

/* 포켓몬 카드 스타일의 아이템 카드 */
.item-card {
    background: linear-gradient(145deg, #ffffff 0%, #f8fbff 100%);
    @apply overflow-hidden relative;
    border-radius: 20px;
    border: 3px solid var(--primary-light);
    box-shadow: 
        0 8px 25px rgba(110, 181, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transform: translateY(0);
    position: relative;
    transition: all 0.2s ease-out;
}

.item-card:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 
        0 12px 28px rgba(110, 181, 255, 0.2),
        0 0 15px rgba(129, 199, 132, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    border-color: var(--accent-color);
}

/* 홀로그램 효과 */
.item-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
        135deg, 
        transparent 25%, 
        rgba(110, 181, 255, 0.1) 50%, 
        rgba(129, 199, 132, 0.1) 75%, 
        transparent 100%
    );
    border-radius: 17px;
    opacity: 0;
    transition: opacity 0.3s ease;
}

.item-card:hover::before {
    opacity: 1;
}

/* 반짝이는 효과 */
.item-card::after {
    content: '✨';
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 16px;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
}

.item-card:hover::after {
    opacity: 1;
    transform: scale(1) rotate(15deg);
    animation: twinkle 1s ease-in-out infinite alternate;
}

@keyframes twinkle {
    0% { transform: scale(1) rotate(15deg); opacity: 0.7; }
    100% { transform: scale(1.2) rotate(-15deg); opacity: 1; }
}

/* 포켓몬 카드 등급 시스템 */
.item-card.rare {
    border-color: #ffd700;
    background: linear-gradient(145deg, #fff9c4 0%, #f8fbff 100%);
    box-shadow: 
        0 8px 25px rgba(255, 215, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.item-card.rare:hover {
    box-shadow: 
        0 20px 40px rgba(255, 215, 0, 0.4),
        0 0 30px rgba(255, 215, 0, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.item-card.epic {
    border-color: #9c27b0;
    background: linear-gradient(145deg, #f3e5f5 0%, #f8fbff 100%);
    box-shadow: 
        0 8px 25px rgba(156, 39, 176, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.item-card.epic:hover {
    box-shadow: 
        0 20px 40px rgba(156, 39, 176, 0.4),
        0 0 30px rgba(156, 39, 176, 0.5),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.item-card.legendary {
    border-color: #ff5722;
    background: linear-gradient(145deg, #fff3e0 0%, #f8fbff 100%);
    box-shadow: 
        0 8px 25px rgba(255, 87, 34, 0.2),
        0 0 15px rgba(255, 87, 34, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.item-card.legendary:hover {
    box-shadow: 
        0 12px 30px rgba(255, 87, 34, 0.3),
        0 0 20px rgba(255, 87, 34, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

/* 레어리티 뱃지 */
.rarity-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    z-index: 10;
}

.rarity-badge.common {
    background: linear-gradient(45deg, #90a4ae, #b0bec5);
    color: white;
}

.rarity-badge.rare {
    background: linear-gradient(45deg, #ffd700, #ffeb3b);
    color: #333;
    box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
}

.rarity-badge.epic {
    background: linear-gradient(45deg, #9c27b0, #e91e63);
    color: white;
    box-shadow: 0 2px 8px rgba(156, 39, 176, 0.3);
}

.rarity-badge.legendary {
    background: linear-gradient(45deg, #ff5722, #ff9800);
    color: white;
    box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3);
    animation: subtle-glow 3s ease-in-out infinite alternate;
}

/* 전설급만 아주 미묘한 글로우 유지 */
@keyframes subtle-glow {
    0% { box-shadow: 0 2px 8px rgba(255, 87, 34, 0.3); }
    100% { box-shadow: 0 2px 12px rgba(255, 87, 34, 0.5); }
}

/* 불꽃놀이 애니메이션 */
.fireworks-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 9999;
}

.firework {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    animation: firework-explosion 1.5s ease-out forwards;
}

.firework.color-1 { background: #ff6b6b; }
.firework.color-2 { background: #4ecdc4; }
.firework.color-3 { background: #45b7d1; }
.firework.color-4 { background: #96ceb4; }
.firework.color-5 { background: #ffeaa7; }
.firework.color-6 { background: #dda0dd; }

@keyframes firework-explosion {
    0% {
        transform: scale(1);
        opacity: 1;
    }
    100% {
        transform: scale(20);
        opacity: 0;
    }
}

/* 성공 메시지 애니메이션 */
.success-message {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, #81c784, #66bb6a);
    color: white;
    padding: 20px 40px;
    border-radius: 20px;
    font-size: 24px;
    font-weight: bold;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    z-index: 10000;
    animation: success-bounce 2s ease-out forwards;
}

@keyframes success-bounce {
    0% {
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
    }
    50% {
        transform: translate(-50%, -50%) scale(1.2);
        opacity: 1;
    }
    70% {
        transform: translate(-50%, -50%) scale(0.9);
    }
    85% {
        transform: translate(-50%, -50%) scale(1.1);
    }
    100% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
    }
}

/* 레벨업 배지 시스템 */
.level-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    margin-left: 8px;
}

.level-badge.beginner {
    background: linear-gradient(45deg, #90a4ae, #b0bec5);
    color: white;
}

.level-badge.trader {
    background: linear-gradient(45deg, #4ecdc4, #45b7d1);
    color: white;
}

.level-badge.merchant {
    background: linear-gradient(45deg, #ffd700, #ffeb3b);
    color: #333;
}

.level-badge.tycoon {
    background: linear-gradient(45deg, #9c27b0, #e91e63);
    color: white;
}

.level-badge.master {
    background: linear-gradient(45deg, #ff5722, #ff9800);
    color: white;
    box-shadow: 0 2px 10px rgba(255, 87, 34, 0.4);
}

.item-image {
    @apply w-full h-40 object-cover bg-gray-100;
}

.item-info {
    @apply p-4;
}

/* 가격 태그 스타일 */
.price-tag {
    background: linear-gradient(145deg, var(--accent-color), #66bb6a);
    color: white;
    @apply inline-flex items-center px-3 py-2 rounded-full text-sm font-bold shadow-lg;
    border: 2px solid rgba(255, 255, 255, 0.8);
    position: relative;
    transition: all 0.3s ease;
}

.price-tag:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 15px rgba(129, 199, 132, 0.4);
}

.sold-tag {
    background: linear-gradient(145deg, #ef5350, #d32f2f);
    color: white;
    @apply inline-flex items-center px-2 py-1 rounded-full text-sm font-medium shadow-lg;
    border: 2px solid #ffcdd2;
}

/* 카테고리 배지 */
.category-badge {
    @apply inline-flex items-center px-2 py-1 rounded-full text-xs font-bold shadow-lg;
    border: 1px solid rgba(255, 255, 255, 0.8);
    color: white;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 카테고리별 색상 */
.category-badge.category-toys {
    background: linear-gradient(145deg, #ff6b9d, #e91e63);
}

.category-badge.category-books {
    background: linear-gradient(145deg, #4ecdc4, #26a69a);
}

.category-badge.category-stationery {
    background: linear-gradient(145deg, #45b7d1, #2196f3);
}

.category-badge.category-snacks {
    background: linear-gradient(145deg, #ffd93d, #ffc107);
}

.category-badge.category-electronics {
    background: linear-gradient(145deg, #a8e6cf, #66bb6a);
}

.category-badge.category-clothes {
    background: linear-gradient(145deg, #dda0dd, #ba68c8);
}

.category-badge.category-sports {
    background: linear-gradient(145deg, #ff8a65, #ff5722);
}

.category-badge.category-art {
    background: linear-gradient(145deg, #81c784, #4caf50);
}

.category-badge.category-other {
    background: linear-gradient(145deg, #90a4ae, #607d8b);
}

/* Drawing Canvas */
#drawing-canvas {
    border: 2px solid #e5e7eb;
    cursor: crosshair;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Color Palette */
.color-option {
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.color-option:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

.color-option.ring-4 {
    transform: scale(1.15);
    box-shadow: 0 0 0 4px #3b82f6;
}

/* Brush Size Slider */
#brush-size {
    -webkit-appearance: none;
    appearance: none;
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(to right, #e5e7eb, #6b7280);
    outline: none;
}

#brush-size::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

#brush-size::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
    border: 2px solid #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Current Color Display */
#current-color {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    transition: all 0.2s ease;
}

/* Drawing Tools */
.drawing-tools {
    background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #d1d5db;
}

/* Transaction History */
.transaction-item {
    @apply flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50;
}

.transaction-buy {
    @apply border-l-4 border-red-500;
}

.transaction-sell {
    @apply border-l-4 border-green-500;
}

/* Loading Animation */
.loading {
    @apply animate-pulse bg-gray-200;
}

/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
    width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Student Status Indicators */
.student-online {
    @apply flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg;
}

.student-offline {
    @apply flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg;
}

/* Success/Error Messages */
.message-success {
    @apply p-4 mb-4 text-green-700 bg-green-100 border border-green-200 rounded-lg;
}

.message-error {
    @apply p-4 mb-4 text-red-700 bg-red-100 border border-red-200 rounded-lg;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .container {
        padding-left: 1rem;
        padding-right: 1rem;
    }
    
    #drawing-canvas {
        width: 100%;
        max-width: 350px;
        height: 250px;
    }
    
    .item-card {
        margin-bottom: 1rem;
    }
}

/* Animation for new items */
@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.slide-in {
    animation: slideIn 0.3s ease-out;
}

/* 포인트 애니메이션 */
@keyframes pointsUpdate {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); color: var(--accent-color); }
    100% { transform: scale(1); }
}

.points-animate {
    animation: pointsUpdate 0.5s ease-in-out;
}

/* 귀여운 버튼 */
/* 귀여운 버튼 스타일 */
.cute-btn {
    background: linear-gradient(145deg, var(--primary-color), var(--primary-dark));
    color: white;
    transition: all 0.3s ease;
    transform: translateY(0);
    border: 2px solid var(--primary-light);
    box-shadow: 0 4px 15px rgba(110, 181, 255, 0.2);
}

.cute-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(110, 181, 255, 0.3);
    background: linear-gradient(145deg, var(--accent-color), #66bb6a);
}

/* 구매 버튼 스타일 */
.buy-btn {
    background: linear-gradient(145deg, var(--primary-color), var(--primary-dark));
    color: white;
    @apply font-bold py-3 px-6 shadow-lg transition-all duration-300;
    border-radius: 25px;
    border: 2px solid var(--primary-light);
    transform: translateY(0);
    position: relative;
    overflow: hidden;
}

.buy-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
}

.buy-btn:hover::before {
    left: 100%;
}

.buy-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px rgba(110, 181, 255, 0.25);
    background: linear-gradient(145deg, var(--accent-color), #66bb6a);
}

.buy-btn:active {
    transform: translateY(1px) scale(0.98);
}

.buy-btn:disabled {
    background: linear-gradient(145deg, #e0e0e0, #bdbdbd);
    color: #999;
    @apply cursor-not-allowed;
    transform: none;
    box-shadow: none;
}

.buy-btn.insufficient-funds {
    background: linear-gradient(145deg, var(--error-color), #d32f2f);
    color: white;
    border-color: #ffcdd2;
}

/* Item status overlays */
.item-overlay {
    @apply absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center;
}

.sold-overlay {
    @apply absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded;
}

/* 파스텔 그린 톤 카테고리 색상 */
.category-toys { 
    background: #b8e6b8;
    color: var(--text-dark);
}
.category-food { 
    background: #c8f0c8;
    color: var(--text-dark);
}
.category-clothes { 
    background: #a8e6a8;
    color: var(--text-dark);
}
.category-electronics { 
    background: #98e098;
    color: var(--text-dark);
}
.category-books { 
    background: #88d688;
    color: var(--text-dark);
}
.category-other { 
    background: #d0f0d0;
    color: var(--text-dark);
}

/* 실시간 공지 애니메이션 */
.slide-in-top {
    animation: slideInTop 0.5s ease-out;
}

@keyframes slideInTop {
    from {
        transform: translateY(-100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

/* 모니터링 상태 표시 */
.monitoring-active {
    background: linear-gradient(45deg, #10b981, #059669);
}

.monitoring-paused {
    background: linear-gradient(45deg, #ef4444, #dc2626);
}

/* 시스템 관리 패널 스타일 */
.system-panel {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 관리자 대시보드 그리드 개선 */
.admin-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

/* 실시간 데이터 표시 */
.live-data {
    position: relative;
}

.live-data::after {
    content: '🔴';
    position: absolute;
    top: -5px;
    right: -5px;
    font-size: 12px;
    animation: pulse 1s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.1); }
}

/* 공지사항 타입별 스타일 */
.announcement-info {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

.announcement-warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
}

.announcement-success {
    background: linear-gradient(135deg, #10b981, #059669);
}

.announcement-urgent {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    animation: urgent-pulse 1s ease-in-out infinite;
}

@keyframes urgent-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
}
