<template>
  <div class="chart-card">
    <h3>분기별 고객 수</h3>
    <v-chart :option="option" autoresize class="chart" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import VChart from "vue-echarts";
import { LineChart } from "echarts/charts";
import { GridComponent, TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

const option = ref({
  tooltip: {},
  legend: { bottom: 0 },
  xAxis: { data: ["1분기", "2분기", "3분기", "4분기"] },
  yAxis: {},
  series: [
    { name: "전체 고객", type: "line", data: [50, 80, 100, 110], smooth: true },
    { name: "신규 고객", type: "line", data: [20, 40, 60, 70], smooth: true },
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
  height: 260px;
}
</style>
