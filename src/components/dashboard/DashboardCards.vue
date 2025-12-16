<template>
  <div class="cards">
    <div class="card" v-for="card in cards" :key="card.title">
      <h4>{{ card.title }}</h4>

      <el-progress
        type="circle"
        :percentage="card.percent"
        :stroke-width="10"
        :color="card.color"
        :width="120"
      />

      <p class="value">{{ card.value }}</p>
      <p class="desc">{{ card.desc }}</p>
    </div>
  </div>
</template>

<script setup>
const cards = [
  { title: "월 매출 분석", percent: 92, value: "₩17.0억", desc: "목표 18.5억", color: "#7C3AED" },
  { title: "상담 처리 현황", percent: 25, value: "1", desc: "전체 4건", color: "#6B7280" },
  { title: "고객사 이용률", percent: 85, value: "87", desc: "총 103개사", color: "#F43F5E" },
  { title: "자동 캠페인 현황", percent: 73, value: "22", desc: "총 30개", color: "#3B82F6" },
];
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 25px;
}

.card {
  background: white;
  padding: 20px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  text-align: center;
}

.value {
  margin-top: 12px;
  font-size: 22px;
  font-weight: 600;
}

.desc {
  font-size: 13px;
  color: #6b7280;
}
</style>
