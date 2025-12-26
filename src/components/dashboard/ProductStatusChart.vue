<template>
  <div class="chart-card">
    <h3>제품 현황</h3>
    <v-chart :option="option" autoresize class="chart" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import VChart from "vue-echarts";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";
import { getProductKpiCount } from "@/api/product";

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const option = ref({
  tooltip: { trigger: "item", formatter: "{b}: {c}개 ({d}%)" },
  legend: { bottom: 0, left: "center" },
  series: [
    {
      type: "pie",
      radius: ["55%", "80%"],
      center: ["50%", "45%"],
      label: { show: true, position: "outside", formatter: "{b}" },
      labelLine: { show: true, length: 18, length2: 12 },
      itemStyle: { borderRadius: 6, borderColor: "#fff", borderWidth: 2 },
      data: [
        { value: 0, name: "렌탈 중", itemStyle: { color: "#4F6EF7" } },
        { value: 0, name: "대여 가능", itemStyle: { color: "#B9D532" } },
        { value: 0, name: "수리/점검", itemStyle: { color: "#4B5563" } },
      ],
    },
  ],
});

const load = async () => {
  const { data } = await getProductKpiCount();

  const whole = Number(data?.wholeCount ?? 0) || 0;
  const rental = Number(data?.rentalCount ?? 0) || 0;
  const repair = Number(data?.repairCount ?? 0) || 0;

  // ✅ 대여 가능 계산 (전체 - 렌탈 - 수리)
  const available = Math.max(0, whole - rental - repair);

  option.value.series[0].data = [
    { value: rental, name: "렌탈 중", itemStyle: { color: "#4F6EF7" } },
    { value: available, name: "대여 가능", itemStyle: { color: "#B9D532" } },
    { value: repair, name: "수리/점검", itemStyle: { color: "#4B5563" } },
  ];
};

onMounted(load);
</script>


<style scoped>
.chart-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  min-height: 360px;
  color: #000000;
}

.chart-card h3 {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.chart {
  width: 100%;
  height: 280px; /* 260보다 약간 키워도 카드 높이 통일됨 */
}
</style>