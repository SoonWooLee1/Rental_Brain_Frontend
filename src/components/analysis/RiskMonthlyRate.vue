<template>
  <BaseCard class="risk-card">
    <template #header>
      <div class="card-head">
        <div class="card-title">{{ title }}</div>

        <button class="ghost-btn" @click="showGuide = true">
          권장 기준표 보기
        </button>
      </div>
    </template>

    <div v-if="loading" class="chart-placeholder">
      <div class="hint">불러오는 중...</div>
    </div>

    <div v-else-if="error" class="chart-placeholder">
      <div class="hint">이탈률 데이터를 불러오지 못했습니다.</div>
      <div class="error">{{ error }}</div>
    </div>

    <div v-else class="risk-wrap">
      <!-- ✅ 차트 클릭 이벤트 -->
      <v-chart
        :option="option"
        autoresize
        class="risk-chart"
        @click="onChartClick"
      />
    </div>

    <!-- ✅ 기준표 모달(기존 유지) -->
    <teleport to="body">
      <div v-if="showGuide" class="modal-backdrop" @click.self="closeGuide">
        <div class="modal">
          <div class="modal-head">
            <div class="modal-title">권장 기준표 (B2B 렌탈 CRM 기준)</div>
            <button class="close-btn" @click="closeGuide">✕</button>
          </div>
          <div class="modal-body">
            <RiskGuideTable />
          </div>
        </div>
      </div>
    </teleport>
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import BaseCard from "@/components/common/BaseCard.vue";

import VChart from "vue-echarts";
import { use } from "echarts/core";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import { getMonthlyRiskRate } from "@/api/customeranalysis";
import RiskGuideTable from "@/components/analysis/RiskGuideTable.vue";

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const emit = defineEmits(["monthClick"]);

const props = defineProps({
  title: { type: String, default: "월별 이탈 위험률 추이" },
  months: { type: Number, default: 12 },
});

const route = useRoute();
const loading = ref(false);
const error = ref("");
const rows = ref([]);
const showGuide = ref(false);

const closeGuide = () => {
  showGuide.value = false;
};

// 최근 N개월 from/to (YYYY-MM)
const range = computed(() => {
  const qFrom = route.query.from;
  const qTo = route.query.to;
  if (typeof qFrom === "string" && typeof qTo === "string") return { from: qFrom, to: qTo };

  const now = new Date();
  const toY = now.getFullYear();
  const toM = now.getMonth() + 1;

  const fromDate = new Date(now.getFullYear(), now.getMonth() - (props.months - 1), 1);
  const fromY = fromDate.getFullYear();
  const fromM = fromDate.getMonth() + 1;

  return {
    from: `${fromY}-${String(fromM).padStart(2, "0")}`,
    to: `${toY}-${String(toM).padStart(2, "0")}`,
  };
});

const labels = computed(() =>
  (rows.value ?? []).map((r) => {
    const s = String(r.snapshotMonth ?? r.month ?? "");
    const m = Number(s.slice(5, 7));
    return Number.isNaN(m) ? s : `${m}월`;
  })
);

const values = computed(() => (rows.value ?? []).map((r) => Number(r.riskRate ?? r.rate ?? 0) || 0));

const option = computed(() => ({
  tooltip: { trigger: "axis", valueFormatter: (v) => `${v}%` },
  grid: { left: 45, right: 20, top: 40, bottom: 30 },
  xAxis: { type: "category", data: labels.value, axisTick: { alignWithLabel: true } },
  yAxis: { type: "value", min: 0, axisLabel: { formatter: "{value}%" }, splitLine: { lineStyle: { type: "dashed" } } },
  series: [
    {
      name: "이탈 위험률",
      type: "line",
      smooth: true,
      data: values.value,
      symbol: "circle",
      symbolSize: 8,

      // ✅ 빨간색 유지
      lineStyle: { width: 3, color: "#ef4444" },
      itemStyle: { color: "#ef4444" },
      areaStyle: { color: "rgba(239,68,68,0.12)" },

      emphasis: {
        itemStyle: { color: "#b91c1c" },
        lineStyle: { width: 4 },
      },

      markPoint: {
        symbol: "pin",
        symbolSize: 50,
        label: { formatter: "{b}\n{c}%", fontWeight: "bold" },
        data: [{ type: "max", name: "최고 이탈 위험률" }],
      },

      markLine: {
        symbol: "none",
        label: { fontSize: 11, fontWeight: 700 },
        data: [
          { yAxis: 10, lineStyle: { color: "#f59e0b", type: "dashed" }, label: { formatter: "주의 10%" } },
          { yAxis: 15, lineStyle: { color: "#fb7185", type: "dashed" }, label: { formatter: "경고 15%" } },
          { yAxis: 20, lineStyle: { color: "#dc2626", type: "solid" }, label: { formatter: "위험 20%" } },
        ],
      },
    },
  ],
}));

const onChartClick = (params) => {
  // series point click만 받기
  if (!params || params.componentType !== "series") return;

  const idx = params.dataIndex;
  const month = rows.value?.[idx]?.snapshotMonth;
  if (!month) return;

  // ✅ 부모로 month 전달
  emit("monthClick", month);
};

const fetchData = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getMonthlyRiskRate(range.value.from, range.value.to);
    const body = res?.data ?? res;

    rows.value =
      Array.isArray(body) ? body :
      Array.isArray(body?.monthly) ? body.monthly :
      Array.isArray(body?.data) ? body.data :
      Array.isArray(body?.list) ? body.list :
      [];
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? String(e);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchData);
watch(range, fetchData);
</script>

<style scoped>
.risk-card { width: 100%; }

.card-head {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

.ghost-btn {
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #111827;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}
.ghost-btn:hover { background: #f9fafb; }

.risk-chart { width: 100%; height: 320px; }

.chart-placeholder {
  height: 320px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.hint { color: #6b7280; font-size: 13px; font-weight: 700; }
.error { color: #ef4444; font-size: 12px; font-weight: 800; }

/* ===== 기존 기준표 모달 ===== */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  width: 720px;
  max-width: calc(100vw - 32px);
  max-height: 80vh;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}
.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 18px;
  border-bottom: 1px solid #eef2f7;
}
.modal-title { font-size: 14px; font-weight: 900; color: #111827; }
.close-btn {
  border: 0;
  background: transparent;
  font-size: 18px;
  font-weight: 900;
  cursor: pointer;
  color: #6b7280;
}
.close-btn:hover { color: #111827; }
.modal-body { padding: 16px 18px; overflow-y: auto; }
</style>
