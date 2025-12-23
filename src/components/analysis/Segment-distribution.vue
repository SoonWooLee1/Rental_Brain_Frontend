<template>
  <div class="segment-card">
    <div class="card-title">{{ title }}</div>

    <div v-if="!hasData" class="empty">
      세그먼트 데이터가 없습니다.
    </div>

    <div v-else class="segment-wrap">
      <v-chart :option="option" autoresize class="segment-chart" />

      <div v-if="showMiniList" class="mini-list">
        <div class="mini-total" v-if="total !== null && total !== undefined">
          <span class="t-label">전체</span>
          <span class="t-value">{{ fmt(total) }}개사</span>
        </div>

        <div
          v-for="s in segments"
          :key="s.segmentId ?? s.segmentName"
          class="mini-item"
        >
          <span class="name">{{ s.segmentName ?? s.name ?? 'Unknown' }}</span>
          <span class="pct">{{ round1(getPercent(s)) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const props = defineProps({
  title: { type: String, default: "고객 세그먼트 분석" },
  segments: { type: Array, default: () => [] },
  total: { type: [Number, String, null], default: null },
  showMiniList: { type: Boolean, default: true },
});

const fmt = (n) => (Number(n) || 0).toLocaleString();
const round1 = (n) => (Math.round((Number(n) || 0) * 10) / 10).toFixed(1);

/** ✅ 다양한 필드명 대응 */
const getCount = (s) =>
  Number(
    s?.count ??
    s?.customerCount ??
    s?.segmentCount ??
    s?.customer_count ??
    s?.segment_count ??
    0
  ) || 0;

const getName = (s) => s?.segmentName ?? s?.name ?? "Unknown";

/** percent도 여러 키 대응, 없으면 0 */
const getPercent = (s) =>
  Number(
    s?.countPercent ??
    s?.percent ??
    s?.ratio ??
    0
  ) || 0;

const hasData = computed(() => {
  if (!Array.isArray(props.segments) || props.segments.length === 0) return false;
  return props.segments.some((s) => getCount(s) > 0);
});

const option = computed(() => {
  const data = (props.segments || []).map((s) => ({
    value: getCount(s),
    name: getName(s),
  }));

  return {
    tooltip: {
      trigger: "item",
      formatter: ({ name, value, percent }) =>
        `${name}<br/>${fmt(value)}개사 (${percent}%)`,
    },

    // ✅ 범례를 카드 맨 아래에 “고정” + 겹침 방지
    legend: {
      bottom: 4,
      left: "center",
      type: "scroll",          // ✅ 항목 많으면 스크롤 처리(줄바꿈/겹침 방지)
      orient: "horizontal",
      icon: "roundRect",
      itemWidth: 10,
      itemHeight: 10,
      pageIconSize: 10,
      pageTextStyle: { fontSize: 11 },
      textStyle: { fontSize: 11 },
    },

    // ✅ 범례가 차트 영역을 안 먹게 padding(=grid) 잡아주기
    grid: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 32, // legend 높이만큼 비워두기
      containLabel: true,
    },

    series: [
      {
        type: "pie",
        radius: ["58%", "82%"],

        // ✅ 차트 중심을 “위로” 살짝 올려서 가운데 정렬되게
        center: props.showMiniList ? ["40%", "44%"] : ["50%", "44%"],

        avoidLabelOverlap: true,

        // ✅ 라벨이 너무 길어서 카드 밖으로 튀는 거 방지
        label: {
          show: true,
          formatter: (p) => {
            const n = p.name || "";
            return n.length > 8 ? n.slice(0, 8) + "…" : n; // ✅ 길면 말줄임
          },
          fontSize: 11,
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 6,
        },

        emphasis: { scale: true, scaleSize: 6 },
        data,
      },
    ],
  };
});
</script>

<style scoped>
.segment-card { width: 100%; }

.card-title {
  font-size: 14px;
  font-weight: 900;
  color: #111827;
  margin-bottom: 12px;
}

.segment-wrap {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 12px;
  align-items: center;
  height: 220px;
}

/* ✅ 범례까지 포함되는 echarts 전체 높이 */
.segment-chart {
  width: 100%;
  height: 220px;
}

.empty {
  height: 220px;
  border: 1px dashed #e5e7eb;
  border-radius: 10px;
  background: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
  font-size: 12px;
  font-weight: 700;
}

/* ✅ 오른쪽 리스트도 같은 높이에서 가운데 정렬 */
.mini-list {
  height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: center;  /* ✅ 세로 가운데 */
  gap: 8px;
}

.mini-total,
.mini-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
}

.t-label { color: #6b7280; font-size: 12px; font-weight: 800; }
.t-value { font-weight: 900; color: #111827; font-size: 12px; }
.name { font-size: 12px; color: #374151; font-weight: 800; }
.pct { font-size: 12px; font-weight: 900; color: #111827; }

@media (max-width: 900px) {
  .segment-wrap { grid-template-columns: 1fr; height: auto; }
  .segment-chart { height: 260px; }
}
</style>
