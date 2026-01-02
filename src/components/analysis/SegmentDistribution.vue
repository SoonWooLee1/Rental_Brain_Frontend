<template>
  <BaseCard class="segdist-card">
    <template #header>
      <div class="card-head">
        <h3 class="card-title">{{ title }}</h3>
        <span class="meta-badge">전체 {{ fmt(total) }}개사</span>
      </div>
    </template>

    <div v-if="loading" class="empty">불러오는 중...</div>
    <div v-else-if="error" class="empty">{{ error }}</div>
    <div v-else-if="!hasData" class="empty">세그먼트 데이터가 없습니다.</div>

    <v-chart
      v-else
      :option="option"
      autoresize
      class="chart chart-md"
      @click="onChartClick"
    />
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

const emit = defineEmits(["select-segment"]);

const props = defineProps({
  title: { type: String, default: "고객 세그먼트 분석" },
  segments: { type: Array, default: () => [] },
  total: { type: [Number, String, null], default: null },
});

const loading = ref(false);
const error = ref("");
const localSegments = ref([]);
const localTotal = ref(0);

/* ✅ 모바일 판단 */
const isMobile = ref(false);
const setIsMobile = () => (isMobile.value = window.innerWidth <= 900);

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
const getId = (s) => s?.segmentId ?? s?.id ?? null;

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

const onChartClick = (params) => {
  const segId = params?.data?.segmentId;
  if (!segId) return;
  emit("select-segment", Number(segId));
};

const option = computed(() => {
  // 여기서만 data 생성 (segmentId 포함)
  const data = (segments.value || [])
    .map((s) => ({
      value: getCount(s),
      name: getName(s),
      segmentId: getId(s),
    }))
    .filter((d) => d.value > 0);

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
        formatter: (name) => {
          const t = data.find((d) => d.name === name);
          return `${name} · ${fmt(t?.value ?? 0)}개사`;
        },
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
        formatter: (name) => {
          const t = data.find((d) => d.name === name);
          return `${name} · ${fmt(t?.value ?? 0)}개사`;
        },
      };

  const grid = isMobile.value
    ? { left: 0, right: 0, top: 0, bottom: 56, containLabel: true }
    : { left: 0, right: 0, top: 0, bottom: 0, containLabel: true };

  return {
    tooltip: {
      trigger: "item",
      formatter: ({ name, value, percent }) =>
        `${name}<br/>${fmt(value)}개사 (${Math.round(percent)}%)`,
    },
    legend,
    grid,
    series: [
      {
        type: "pie",
        radius: ["58%", "82%"],
        center: isMobile.value ? ["50%", "45%"] : ["35%", "50%"],

        avoidLabelOverlap: true,
        labelLayout: { hideOverlap: true },

        label: {
          show: true,
          formatter: (p) =>
            `${Math.round(p.percent)}% (${fmt(p.value)}개사)`,
          fontSize: 12,
          fontWeight: 800,
          color: "#374151",
        },

        labelLine: {
          show: true,
          length: 12,
          length2: 8,
          smooth: false,
        },

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

.chart-md {
  width: 100%;
  height: 260px;
}

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
