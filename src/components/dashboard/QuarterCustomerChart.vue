<template>
  <div class="chart-card">
    <div class="card-head">
      <h3>분기별 신규 고객 유입</h3>
      <span class="chip">{{ yearLabel }}</span>
    </div>

    <v-chart :option="option" autoresize class="chart" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import VChart from "vue-echarts";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";
import { getQuarterlyCustomerTrend } from "@/api/dashboard";

use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

const year = ref(null); // 서버 기본(현재연도) 쓰려면 null 유지
const yearLabel = computed(() => (year.value ? String(year.value) : "현재 연도"));

const option = ref({
  tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
  grid: { left: 18, right: 18, top: 26, bottom: 24, containLabel: true },
  xAxis: {
    type: "category",
    data: ["1분기", "2분기", "3분기", "4분기"],
    axisTick: { show: false },
  },
  yAxis: { type: "value" },
  series: [
    {
      name: "신규 고객",
      type: "bar",
      data: [0, 0, 0, 0],
      barWidth: 32,
      itemStyle: { borderRadius: [6, 6, 0, 0] },
    },
  ],
});

const quarterIndex = (q) => ({ Q1: 0, Q2: 1, Q3: 2, Q4: 3 }[q] ?? null);

const load = async () => {
  try {
    // year 미지정이면 서버에서 현재 연도 기본 처리
    const { data } = year.value
      ? await getQuarterlyCustomerTrend(year.value)
      : await getQuarterlyCustomerTrend();

    const list = Array.isArray(data?.series) ? data.series : [];
    const arr = [0, 0, 0, 0];

    list.forEach((it) => {
      const idx = quarterIndex(it.quarter);
      if (idx === null) return;
      arr[idx] = Number(it.newCustomerCount ?? 0);
    });

    // 서버가 year 내려주면 화면에도 표기
    if (data?.year) year.value = Number(data.year);

    option.value = {
      ...option.value,
      series: [{ ...option.value.series[0], data: arr }],
    };
  } catch (e) {
    console.error("분기별 신규 고객 유입 조회 실패:", e);
  }
};

onMounted(load);
</script>

<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.04);
  min-height: 360px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.chart-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
  color: #111827;
}

.chip {
  font-size: 11px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #eef2f7;
  padding: 4px 8px;
  border-radius: 999px;
}

.chart {
  width: 100%;
  height: 280px;
}
</style>
