<template>
  <BaseCard class="segdist-card">
    <!-- ✅ 헤더: 좌측 타이틀 / 우측 전체 배지 (정렬 보장 래퍼) -->
    <template #header>
      <div class="card-head">
        <h3 class="card-title">{{ title }}</h3>
        <span class="meta-badge">전체 {{ fmt(total) }}개사</span>
      </div>
    </template>

    <div v-if="loading" class="empty">불러오는 중...</div>
    <div v-else-if="error" class="empty">{{ error }}</div>
    <div v-else-if="!hasData" class="empty">세그먼트 데이터가 없습니다.</div>

    <v-chart v-else :option="option" autoresize class="chart chart-md" />
  </BaseCard>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

import { getSegmentDistribution } from "@/api/customeranalysis";
import BaseCard from "@/components/common/BaseCard.vue";

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const loading = ref(false);
const error = ref("");
const localSegments = ref([]);
const localTotal = ref(0);

/* ✅ 모바일 판단 */
const isMobile = ref(false);
const setIsMobile = () => (isMobile.value = window.innerWidth <= 900);

const props = defineProps({
  title: { type: String, default: "고객 세그먼트 분석" },
  segments: { type: Array, default: () => [] },
  total: { type: [Number, String, null], default: null },
});

const segments = computed(() =>
  props.segments?.length ? props.segments : localSegments.value
);
const total = computed(() =>
  props.total != null ? props.total : localTotal.value
);

const fmt = (n) => (Number(n) || 0).toLocaleString();

/** 다양한 필드명 대응 */
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

const hasData = computed(() => {
  if (!Array.isArray(segments.value) || segments.value.length === 0) return false;
  return segments.value.some((s) => getCount(s) > 0);
});

const fetchData = async () => {
  if (props.segments?.length) return;

  loading.value = true;
  error.value = "";
  try {
    const res = await getSegmentDistribution();
    localSegments.value = res.data?.segments ?? [];
    localTotal.value = res.data?.totalCustomerCount ?? 0;
  } catch (e) {
    error.value = e?.message ?? "세그먼트 데이터를 불러오지 못했습니다.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  setIsMobile();
  window.addEventListener("resize", setIsMobile);
  fetchData();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", setIsMobile);
});

const option = computed(() => {
  const data = (segments.value || [])
    .map((s) => ({ value: getCount(s), name: getName(s) }))
    .filter((d) => d.value > 0);

  // ✅ 모바일이면 legend를 아래로, 데스크탑이면 오른쪽 세로
  const legend = isMobile.value
    ? {
        bottom: 0,
        top: "auto",
        left: "center",
        orient: "horizontal",
        type: "scroll",
        icon: "roundRect",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        pageIconSize: 10,
        pageTextStyle: { fontSize: 11 },
        textStyle: { fontSize: 11, color: "#374151" },
      }
    : {
        top: "middle",
        right: 8,
        orient: "vertical",
        type: "scroll",
        icon: "roundRect",
        itemWidth: 10,
        itemHeight: 10,
        itemGap: 10,
        pageIconSize: 10,
        pageTextStyle: { fontSize: 11 },
        textStyle: { fontSize: 11, color: "#374151" },
      };

  // ✅ 모바일이면 아래 legend 공간 확보
  const grid = isMobile.value
    ? { left: 0, right: 0, top: 0, bottom: 56, containLabel: true }
    : { left: 0, right: 0, top: 0, bottom: 0, containLabel: true };

  return {
    tooltip: {
      trigger: "item",
      formatter: ({ name, value, percent }) =>
        `${name}<br/>${fmt(value)}개사 (${percent}%)`,
    },

    legend,
    grid,

    series: [
      {
        type: "pie",
        radius: ["58%", "82%"],

        // ✅ 모바일은 정중앙(legend 아래), 데스크탑은 legend 때문에 왼쪽 치우치기
        center: isMobile.value ? ["50%", "45%"] : ["35%", "50%"],

        avoidLabelOverlap: true,
label: {
  show: true,
  formatter: (p) => `${p.percent}%`,
  fontSize: 12,
  fontWeight: 800,
  color: "#374151",
},
labelLine: {
  show: false,
},
        labelLine: { show: true, length: 10, length2: 6 },

        // (원하면 hover를 더 티나게 하려면 여기 emphasis/itemStyle 강화 가능)
        emphasis: { scale: true, scaleSize: 6 },

        data,
      },
    ],
  };
});
</script>

<style scoped>
.segdist-card {
  width: 100%;
}

/* ✅ 헤더 정렬 보장 */
.card-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  margin: 0;
  font-size: 14px;
  font-weight: 900;
  color: #111827;
}

/* ✅ 우측 상단 총합 배지 */
.meta-badge {
  font-size: 12px;
  font-weight: 800;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 999px;
  white-space: nowrap;
}

/* ✅ 차트 규격 통일 */
.chart-md {
  width: 100%;
  height: 260px;
}

/* 모바일: legend 아래로 내려가면 차트 높이 조금 확보 */
@media (max-width: 900px) {
  .chart-md {
    height: 320px;
  }
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
</style>
