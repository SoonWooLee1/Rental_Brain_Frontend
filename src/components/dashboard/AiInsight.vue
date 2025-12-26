<template>
  <div class="recommend-card">
    <!-- 헤더 -->
    <div class="card-header">
      <span class="title">
        🔍 시스템 추천
      </span>
    </div>

    <!-- 추천 항목 1 -->
    <div class="recommend-item orange">
      <span class="icon">🔔</span>
      <div class="text">
        <b>재계약 프로모션 적용 가능</b>
        <p>→ 만료임박 계약이 감지되었습니다</p>
      </div>
    </div>

    <!-- 추천 항목 2 -->
    <div class="recommend-item purple">
      <span class="icon">🎯</span>
      <div class="text">
        <b>20% 재계약 할인 쿠폰 발급 가능</b>
        <p>→ 이탈 위험 고객 세그먼트</p>
      </div>
    </div>

    <!-- 추천 항목 3 -->
    <div class="recommend-item pink">
      <span class="icon">📞</span>
      <div class="text">
        <b>담당자 우선 연락 권장</b>
        <p>→ 최근 불만/연체 이력 존재</p>
      </div>
    </div>

    <!-- 하단 링크 -->
    <div class="footer-link">
      고객분석에서 자세히 보기 >
    </div>
  </div>
</template>
<style scoped>
.recommend-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  min-height: 360px; /* 다른 카드 높이랑 통일 */
  width: 100%;
}

.card-header { margin-bottom: 14px; }

.title {
  font-weight: 700;
  font-size: 14px;
  color: #333;
}

/* 내부 아이템은 조금 더 “분석 페이지” 톤으로 */
.recommend-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: #fafafa;
  border: 1px solid #f1f1f1;
}

.recommend-item .icon { font-size: 18px; line-height: 1.4; }
.recommend-item b { font-size: 13px; color: #333; }
.recommend-item p { font-size: 12px; color: #6b7280; margin-top: 4px; }

.orange { border-left: 4px solid #f5a623; }
.purple { border-left: 4px solid #7b6cf6; }
.pink   { border-left: 4px solid #ff6b81; }

.footer-link {
  margin-top: 12px;
  text-align: center;
  font-size: 12px;
  color: #2563eb; /* 고객분석 탭 active 컬러 */
  cursor: pointer;
}
.footer-link:hover { text-decoration: underline; }
</style>