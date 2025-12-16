<template>
  <div class="chart-card">
    <h3>제품 현황</h3>
    <v-chart :option="option" autoresize class="chart" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import VChart from "vue-echarts";
import { PieChart } from "echarts/charts";
import { TooltipComponent, LegendComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { use } from "echarts/core";

use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

const option = ref({
  tooltip: {},
  legend: { bottom: 0 },
  series: [
    {
      type: "pie",
      radius: ["50%", "80%"],
      data: [
        { value: 342, name: "렌탈 중" },
        { value: 158, name: "대여 가능" },
        { value: 28, name: "수리/점검" },
      ]
    }
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
