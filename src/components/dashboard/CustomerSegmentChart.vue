<template>
  <div class="chart-card">
    <h3>고객 세그먼트</h3>
    <v-chart :option="option" autoresize class="chart" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import VChart from "vue-echarts";
import { use } from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const option = ref({
  tooltip: {},
  legend: { bottom: 0 },
  xAxis: { data: ["VIP", "안정고객", "신규", "리턴", "AS", "이탈", "잠재"] },
  yAxis: {},
  series: [
    { name: "고객수", type: "bar", data: [60, 150, 40, 80, 30, 20, 70], itemStyle: { color: "#6366F1" } },
    { name: "매출", type: "bar", data: [500, 900, 200, 300, 90, 70, 400], itemStyle: { color: "#A78BFA" } },
  ]
});
</script>

<style scoped>
.chart-card {
  background: white;
  padding: 20px;
  height: 360px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.chart {
  width: 100%;
  height: 280px;
}
</style>
