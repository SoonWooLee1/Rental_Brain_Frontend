<template>
  <div class="wb-card">
    <!-- Header -->
    <div class="wb-head">
      <div class="wb-title">캠페인 워크벤치</div>
      <div class="wb-pill">승격 3건</div>
    </div>

    <!-- List -->
    <div class="wb-list">
      <!-- Row 1 (HIGH) -->
      <div class="wb-row">
        <div class="wb-left">
          <span class="dot dot-high" aria-hidden="true"></span>

          <div class="wb-text">
            <div class="wb-main">재계약 프로모션 생성</div>
            <div class="wb-sub">대상: 만료 임박 계약 고객</div>
            <div class="wb-meta">근거: 만료 14일 이내 계약 12건 감지</div>
          </div>
        </div>

        <button
          class="wb-btn wb-btn--primary"
          type="button"
          @click.stop="go('PROMOTION_CREATE')"
        >
          프로모션 생성
        </button>
      </div>

      <div class="wb-divider"></div>

      <!-- Row 2 (MEDIUM) -->
      <div class="wb-row">
        <div class="wb-left">
          <span class="dot dot-mid" aria-hidden="true"></span>

          <div class="wb-text">
            <div class="wb-main">20% 할인 쿠폰 발급</div>
            <div class="wb-sub">대상: 이탈 위험 고객 세그먼트</div>
            <div class="wb-meta">근거: 저만족 고객 비중 1위 (전월 대비 증가)</div>
          </div>
        </div>

        <button
          class="wb-btn"
          type="button"
          @click.stop="go('COUPON_CREATE')"
        >
          쿠폰 발급
        </button>
      </div>

      <div class="wb-divider"></div>

      <!-- Row 3 (LOW) -->
      <div class="wb-row">
        <div class="wb-left">
          <span class="dot dot-low" aria-hidden="true"></span>

          <div class="wb-text">
            <div class="wb-main">신규 고객 전환 캠페인 설정</div>
            <div class="wb-sub">대상: 최근 문의 후 미전환 고객</div>
            <div class="wb-meta">근거: 문의 후 7일 내 미계약 고객 9건</div>
          </div>
        </div>

        <button
          class="wb-btn"
          type="button"
          @click.stop="go('CAMPAIGN_SETTING')"
        >
          캠페인 설정
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

/**
 * 캠페인 관련 라우팅 맵
 * 👉 실제 프로젝트의 router name에 맞게 name만 조정하면 됨
 */
const routeMap = {
  PROMOTION_CREATE: { name: "promotion-list" }, // 프로모션 생성
  COUPON_CREATE: { name: "coupon-list" },       // 쿠폰 발급
  CAMPAIGN_SETTING: { name: "campaign-setting" }, // 캠페인 설정 -> 이부분 고민하기
};

const go = (key) => {
  const target = routeMap[key];
  if (!target) return;
  router.push(target);
};
</script>

<style scoped>
.wb-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  height: 100%;
  width: 100%;
  padding: 16px 16px 14px;
}

/* Header */
.wb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.wb-title {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.2px;
}

.wb-pill {
  font-size: 12px;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
  padding: 6px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

/* List */
.wb-list {
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.wb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 14px 14px;
}

.wb-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.wb-text {
  min-width: 0;
}

.wb-main {
  font-size: 13px;
  font-weight: 750;
  color: #111827;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wb-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wb-meta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.55);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dot */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 3px;
  flex: 0 0 auto;
}

.dot-high { background: #ef4444; }
.dot-mid  { background: #6366f1; }
.dot-low  { background: #9ca3af; }

/* Buttons */
.wb-btn {
  font-size: 12px;
  font-weight: 750;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 120ms ease, opacity 120ms ease;
}

.wb-btn:hover { opacity: 0.92; }
.wb-btn:active { transform: translateY(1px); }

.wb-btn--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

/* Footer */
.wb-foot {
  margin-top: 10px;
  text-align: center;
}

.wb-link {
  font-size: 12px;
  color: #2563eb;
  cursor: pointer;
}

.wb-link:hover { text-decoration: underline; }

/* Responsive */
@media (max-width: 700px) {
  .wb-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .wb-btn {
    width: 100%;
  }

  .wb-main,
  .wb-sub,
  .wb-meta {
    white-space: normal;
  }
}
</style>
