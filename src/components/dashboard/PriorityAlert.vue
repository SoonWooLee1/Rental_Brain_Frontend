<template>
  <div class="priority-card">
    <!-- 헤더 -->
    <div class="card-header">
      <span class="bell">🔔</span>
      <h3>우선순위 알림</h3>
    </div>

    <!-- 1) 결제 연체 -->
    <div class="priority-item pink">
      <div class="left">
        <span class="icon danger">⚠️</span>
        <div class="texts">
          <b>결제 연체 중</b>
          <p>11개 기업 결제 연체</p>
        </div>
      </div>
      <span class="badge">11</span>
    </div>

    <!-- 2) 계약 갱신 임박 -->
    <div class="priority-item beige">
      <div class="left">
        <span class="icon warn">📅</span>
        <div class="texts">
          <b>계약 갱신 임박</b>
          <p>5건 만료 임박</p>
        </div>
      </div>
      <span class="badge">5</span>
    </div>

    <!-- 3) 고객 문의 대기 -->
    <div class="priority-item sky">
      <div class="left">
        <span class="icon info">💬</span>
        <div class="texts">
          <b>고객 문의 대기</b>
          <p>8건 문의 대기 중</p>
        </div>
      </div>
      <span class="badge">8</span>
    </div>
  </div>
</template>

<style scoped>
.priority-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
  min-height: 360px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.card-header h3 {
  font-size: 14px;
  font-weight: 700;
  margin: 0;
  color: #333;
}

.bell { font-size: 16px; line-height: 1; }

.priority-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
  border: 1px solid #f1f1f1;
}

.left { display: flex; align-items: center; gap: 12px; }

.icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-size: 16px;
  background: rgba(255,255,255,0.8);
}

.texts b { display: block; font-size: 13px; color: #333; }
.texts p { margin: 4px 0 0 0; font-size: 12px; color: #6b7280; }

.badge {
  min-width: 28px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: grid;
  place-items: center;
}

/* 이미지 느낌 유지 */
.pink  { background: #fdecec; }
.beige { background: #fff4e5; }
.sky   { background: #eaf3ff; }
</style>