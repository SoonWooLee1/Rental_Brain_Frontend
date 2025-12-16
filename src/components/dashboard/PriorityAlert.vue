<template>
  <div class="alert-card">
    <h3>우선순위 알림</h3>

    <div class="alert red">
      결제 연체 중
      <el-tag size="small" type="danger">11</el-tag>
    </div>

    <div class="alert orange">
      계약 갱신 임박
      <el-tag size="small" type="warning">5</el-tag>
    </div>

    <div class="alert blue">
      고객 문의 대기
      <el-tag size="small" type="info">8</el-tag>
    </div>
  </div>
</template>

<style scoped>
.alert-card {
  background: white;
  padding: 20px;
  height: 360px;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.alert {
  margin-top: 12px;
  padding: 14px;
  border-radius: 12px;
  display: flex;
  justify-content: space-between;
}

.red { background: #ffe5e5; }
.orange { background: #fff4db; }
.blue { background: #e6f1ff; }
</style>
