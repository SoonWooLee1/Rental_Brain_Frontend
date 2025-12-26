<template>
  <div class="card ai-card">
    <!-- 헤더 -->
    <div class="ai-head">
      <div class="ai-title-area">
        <div class="ai-title">AI 견적 인사이트</div>
        <div class="ai-subtitle">월별 견적 데이터를 기반으로 성공·실패 요인과 키워드를 요약합니다.</div>
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

    <div v-if="error" class="ai-error">{{ error }}</div>

    <!-- 4개 카드 -->
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
  </div>
</template>

<script setup>
import { ref } from "vue";
import InsightTopListCard from "@/components/analysis/InsightTopListCard.vue";
import { getQuoteAnalyze } from "@/api/customeranalysis"; // ✅ 너희 API 모듈에 추가한 함수

const month = ref(new Date().toISOString().slice(0, 7));
const windowDays = ref(60);
const sampleEach = ref(50);

const loading = ref(false);
const error = ref("");
const result = ref(null);

const analyze = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getQuoteAnalyze(month.value, windowDays.value, sampleEach.value);
    result.value = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
  } catch (e) {
    console.error(e);
    error.value = "AI 분석 중 오류가 발생했습니다. (백엔드 로그/파라미터 확인)";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* ✅ CustomerSupportAnalysisView.vue의 .card 스타일을 그대로 따라감 */
.card.ai-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  margin-top: 16px;
}

/* 헤더 */
.ai-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-bottom: 14px;
}

.ai-title {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.ai-subtitle {
  margin-top: 6px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
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
  border-radius: 8px;
  padding: 6px 8px;
  background: #fff;
  font-size: 12px;
}

.ctrl-num {
  width: 80px;
}

.ctrl-btn {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  border-radius: 8px;
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
}
.ctrl-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 그리드 */
.ai-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
  margin-top: 10px;
}

/* notes */
.ai-notes {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f1f1f1;
}

.notes-title {
  font-size: 12px;
  font-weight: 800;
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
}

.ai-error {
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  color: #9f1239;
  font-size: 12px;
  font-weight: 700;
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
