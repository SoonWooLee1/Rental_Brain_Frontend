<template>
  <BaseCard class="chart-card">
    <template #header>
      <h3 class="card-title">고객 세그먼트</h3>
    </template>

    <div v-if="loading" class="chart-placeholder">
      <div class="hint">불러오는 중...</div>
    </div>

    <div v-else-if="error" class="chart-placeholder">
      <div class="hint">세그먼트 차트 데이터를 불러오지 못했습니다.</div>
      <div class="error">{{ error }}</div>
    </div>

    <div v-else-if="!hasData" class="chart-placeholder">
      <div class="hint">표시할 데이터가 없습니다.</div>
    </div>

    <v-chart
      v-else
      :option="option"
      autoresize
      class="chart"
      @click="onChartClick"
    />
  </BaseCard>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

import BaseCard from "@/components/common/BaseCard.vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import { getSegmentTradeChart } from "@/api/customeranalysis";

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const route = useRoute();

const loading = ref(false);
const error = ref("");
const rows = ref([]);

/** ✅ 파이차트처럼 부모와 이벤트명 통일 */
const emit = defineEmits(["select-segment"]);

/** ✅ month: query.month 있으면 사용, 없으면 현재월 */
const month = computed(() => {
  const q = route.query.month;
  if (typeof q === "string" && /^\d{4}-\d{2}$/.test(q)) return q;

  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
});

const hasData = computed(() => {
  if (!Array.isArray(rows.value) || rows.value.length === 0) return false;
  return rows.value.some(
    (r) => (Number(r.customerCount) || 0) > 0 || (Number(r.totalTradeAmount) || 0) > 0
  );
});

/** ✅ 원(₩) → "n억 m만원" 자동 포맷 */
const fmtMoneyAuto = (won) => {
  const v = Number(won) || 0;
  const man = Math.floor(v / 10000);
  if (man >= 10000) {
    const eok = Math.floor(man / 10000);
    const restMan = man % 10000;
    return restMan > 0 ? `${eok}억 ${restMan.toLocaleString()}만원` : `${eok}억`;
  }
  return `${man.toLocaleString()}만원`;
};

/** ✅ 클릭 → segId 찾아서 emit (파이차트랑 동일 패턴) */
const onChartClick = (params) => {
  if (!params || params.componentType !== "series") return;

  const idx = params.dataIndex;

  // 1) series data에 segmentId를 심어놨으면 그걸 우선 사용
  const segIdFromSeries = params?.data?.segmentId;

  // 2) 아니면 rows에서 꺼내기
  const segIdFromRows = rows.value?.[idx]?.segmentId;

  const segId = segIdFromSeries ?? segIdFromRows;
  if (!segId) return;

  emit("select-segment", Number(segId));
};

const option = computed(() => {
  const labels = (rows.value ?? []).map((r) => r.segmentName ?? "Unknown");

  // ✅ 중요: series data를 객체로 만들어 segmentId를 같이 심어둠
  const customerCounts = (rows.value ?? []).map((r) => ({
    value: Number(r.customerCount) || 0,
    segmentId: r.segmentId,
  }));
  const totalSales = (rows.value ?? []).map((r) => ({
    value: Number(r.totalTradeAmount) || 0,
    segmentId: r.segmentId,
  }));
  const avgSales = (rows.value ?? []).map((r) => ({
    value: Number(r.avgTradeAmount) || 0,
    segmentId: r.segmentId,
  }));

  return {
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        return params
          .map((p) => {
            const val = typeof p.value === "object" ? p.value?.value : p.value;

            if (String(p.seriesName).includes("매출")) {
              return `${p.marker}${p.seriesName}: ${fmtMoneyAuto(val)}`;
            }
            return `${p.marker}${p.seriesName}: ${(Number(val) || 0).toLocaleString()}개사`;
          })
          .join("<br/>");
      },
    },

    legend: { bottom: 0 },
    grid: { left: 40, right: 20, top: 20, bottom: 45, containLabel: true },
    xAxis: { type: "category", data: labels },

    yAxis: [
      { type: "value", name: "고객수" },
      {
        type: "value",
        name: "매출(억)",
        axisLabel: {
          formatter: (v) => `${Math.floor((Number(v) || 0) / 100000000).toLocaleString()}`,
        },
      },
    ],

    series: [
      { name: "고객수", type: "bar", yAxisIndex: 0, data: customerCounts, barMaxWidth: 26 },
      { name: "총매출", type: "bar", yAxisIndex: 1, data: totalSales, barMaxWidth: 26 },
      { name: "평균매출", type: "bar", yAxisIndex: 1, data: avgSales, barMaxWidth: 26 },
    ],
  };
});

const fetchChart = async () => {
  loading.value = true;
  error.value = "";
  try {
    const res = await getSegmentTradeChart(month.value);
    rows.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    error.value = e?.response?.data?.message ?? e?.message ?? String(e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(fetchChart);
watch(month, fetchChart);
</script>

<style scoped>
.chart-card { width: 100%; }
.card-title { margin: 0; font-size: 14px; font-weight: 900; color: #111827; }
.chart { width: 100%; height: 280px; }
.chart-placeholder {
  height: 280px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.hint { color: #9ca3af; font-size: 12px; font-weight: 700; }
.error { color: #ef4444; font-size: 12px; font-weight: 800; }
</style>
