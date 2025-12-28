<template>
  <div class="chart-card">
    <div class="head">
      <h3>제품 현황</h3>
      <div class="meta">
        <span class="total">전체 {{ wholeCount }}개</span>
      </div>
    </div>

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

const wholeCount = ref(0);

const option = ref({
  tooltip: {
    trigger: "item",
    formatter: "{b}: {c}개 ({d}%)",
  },
  legend: {
    bottom: 0,
    left: "center",
  },
  series: [
    {
      type: "pie",
      radius: ["55%", "80%"],
      center: ["50%", "45%"],
        label: {
              show: true,
              position: "outside",
              formatter: "{d}%",
              },
              labelLine: {
                show: false,
              },
      labelLine: {
        show: true,
        length: 18,
        length2: 12,
      },
      itemStyle: {
        borderRadius: 6,
        borderColor: "#fff",
        borderWidth: 2,
      },
      data: [],
    },
  ],
});

const load = async () => {
  const { data } = await getProductKpiCount();

  const rental = Number(data?.rentalCount ?? 0);
  const available = Number(data?.availableCount ?? 0);
  const repair = Number(data?.repairCount ?? 0);
  const overdue = Number(data?.overdueCount ?? 0);

  wholeCount.value = Number(data?.wholeCount ?? 0);

  option.value.series[0].data = [
    { value: rental, name: "렌탈 중", itemStyle: { color: "#4F6EF7" } },
    { value: available, name: "대여 가능", itemStyle: { color: "#B9D532" } },
    { value: repair, name: "수리/점검", itemStyle: { color: "#4B5563" } },
    { value: overdue, name: "연체", itemStyle: { color: "#EF4444" } }, // 🔴 연체
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
  color: #000;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-card h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.meta .total {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 6px 10px;
  border-radius: 999px;
}

.chart {
  width: 100%;
  height: 280px;
}
</style>
