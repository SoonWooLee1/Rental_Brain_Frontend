<template>
  <div class="insight-card">
    <div class="header">
      <h3>AI 인사이트</h3>
      <el-tag type="success" size="small">실시간</el-tag>
    </div>

    <div class="item green">
      <b>매출 트렌드</b>
      <p>VIP 고객군 +23% 증가</p>
    </div>

    <div class="item red">
      <b>이탈 위험</b>
      <p>32개사 징후 감지</p>
    </div>

    <div class="item blue">
      <b>크로스셀 기회</b>
      <p>24개사 잠재 고객 발견</p>
    </div>

  </div>
</template>

<style scoped>
.insight-card {
  background: white;
  padding: 20px;
  height: 360px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.header {
  display: flex;
  justify-content: space-between;
}

.item {
  margin-top: 14px;
  padding: 12px;
  border-radius: 12px;
}

.green { background: #e8f7ec; }
.red { background: #ffeaea; }
.blue { background: #e8f0ff; }
</style>
