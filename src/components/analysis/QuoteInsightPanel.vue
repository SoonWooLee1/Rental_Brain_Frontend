<template>
  <BaseCard class="ai-card">
    <!-- ✅ BaseCard 헤더 -->
    <template #header>
      <div class="ai-head">
        <div class="ai-title-area">
          <div class="ai-title">AI 응대 인사이트</div>
          <div class="ai-subtitle">
            월별 고객 응대 데이터를 기반으로 성공·실패 요인과 키워드를 요약합니다.
          </div>
        </div>

        <div class="ai-controls">
          <input type="month" v-model="month" class="ctrl-month" />
          <input class="ctrl-num" type="number" v-model.number="windowDays" min="1" max="365" />
          <input class="ctrl-num" type="number" v-model.number="sampleEach" min="5" max="200" />
          <button class="ctrl-btn" @click="analyze" :disabled="loading">
            {{ loading ? "분석 중..." : "AI 분석" }}
          </button>
        </div>
      </div>
    </template>

    <div v-if="error" class="ai-error">{{ error }}</div>

    <!-- 4개 미니 카드 -->
    <div v-if="result" class="ai-grid">
      <InsightTopListCard title="✅ 성공 요인 TOP3" tone="success" :items="result.successFactorsTop3" />
      <InsightTopListCard title="❌ 실패 요인 TOP3" tone="danger" :items="result.failFactorsTop3" />
      <InsightTopListCard title="🙂 긍정 키워드 TOP5" tone="info" :items="result.positiveKeywords" />
      <InsightTopListCard title="⚠️ 컴플레인 TOP3" tone="warning" :items="result.complaintTop3" />
    </div>

    <!-- notes -->
    <div v-if="result?.notes?.length" class="ai-notes">
      <div class="notes-title">요약 인사이트</div>
      <ul class="notes-list">
        <li v-for="(n, i) in result.notes" :key="i">{{ n }}</li>
      </ul>
    </div>

    <div v-if="!result && !loading" class="ai-hint">
      월을 선택하고 <b>AI 분석</b>을 눌러 결과를 확인하세요.
    </div>
  </BaseCard>
</template>

<script setup>
import { ref } from "vue";
import BaseCard from "@/components/common/BaseCard.vue";
import InsightTopListCard from "@/components/analysis/InsightTopListCard.vue";

const month = ref(new Date().toISOString().slice(0, 7));
const windowDays = ref(60);
const sampleEach = ref(50);

const loading = ref(false);
const error = ref("");
const result = ref(null);

</script>

<style scoped>
/* ✅ 바깥 카드 외형은 BaseCard가 담당
   - 여기서는 레이아웃만 관리 */
.ai-card {
  width: 100%;
}

/* 헤더(슬롯 내부) */
.ai-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.ai-title {
  font-size: 14px;
  font-weight: 900; /* ✅ 통일: 900 */
  color: #111827;
}

.ai-subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

/* 컨트롤 */
.ai-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.ctrl-month,
.ctrl-num {
  border: 1px solid #e5e7eb;
  border-radius: 10px; /* ✅ 프로젝트 토글/인풋과 통일 */
  padding: 8px 10px;
  background: #fff;
  font-size: 12px;
  font-weight: 700;
}

.ctrl-num {
  width: 90px;
}

.ctrl-btn {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.ctrl-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 그리드 */
.ai-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 10px;
}

/* notes */
.ai-notes {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #eef2f7;
}

.notes-title {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 10px;
}

.notes-list {
  margin: 0;
  padding-left: 18px;
  color: #374151;
  font-size: 12px;
}
.notes-list li {
  margin-bottom: 6px;
  line-height: 1.35;
}

.ai-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #6b7280;
  font-weight: 700;
}

.ai-error {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  font-size: 12px;
  font-weight: 800;
}

/* 반응형 */
@media (max-width: 1200px) {
  .ai-grid {
    grid-template-columns: 1fr;
  }
  .ai-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
