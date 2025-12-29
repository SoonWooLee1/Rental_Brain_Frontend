<template>
  <div class="step-container">
    <h2 class="title">계약 검토 및 승인 요청</h2>
    <p class="desc">
      입력한 계약 정보를 최종 확인한 후 승인 요청을 진행하세요.
    </p>

    <!-- 계약 기본 정보 -->
    <section class="card">
      <h3 class="section-title">계약 기본 정보</h3>

      <div class="review-grid">
        <div class="review-item">
          <span class="label">계약명</span>
          <span class="value">{{ draft.contract.name }}</span>
        </div>

        <div class="review-item">
          <span class="label">계약 기간</span>
          <span class="value">{{ draft.contract.duration }} 개월</span>
        </div>

      </div>
    </section>

    <!-- 고객 정보 -->
    <section class="card">
      <h3 class="section-title">고객 정보</h3>

      <div class="review-grid">
        <div class="review-item">
          <span class="label">고객명</span>
          <span class="value">{{ draft.customerName }}</span>
        </div>

        <div class="review-item">
          <span class="label">고객 코드</span>
          <span class="value">{{ draft.customerCode }}</span>
        </div>

        <div class="review-item">
          <span class="label">담당자</span>
          <span class="value">{{ draft.inCharge }}</span>
        </div>
      </div>
    </section>

    <!-- 계약 기간 -->
    <section class="card">
      <h3 class="section-title">계약 기간</h3>

      <div class="review-grid">
        <div class="review-item">
          <span class="label">시작일</span>
          <span class="value">{{ draft.contract.startDate }}</span>
        </div>

        <div class="review-item">
          <span class="label">종료일</span>
          <span class="value">{{ draft.contract.endDate }}</span>
        </div>
      </div>
    </section>

    <!-- 렌탈 제품 -->
    <section class="card">
      <h3 class="section-title">렌탈 제품</h3>

      <table class="item-table" v-if="draft.assets.length">
        <thead>
          <tr>
            <th>제품명</th>
            <th>수량</th>
            <th>월 렌탈금</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in draft.assets" :key="item.itemName">
            <td>{{ item.itemName }}</td>
            <td>{{ item.quantity }}</td>
            <td class="price">{{ formatPrice(item.monthlyTotal) }}</td>
          </tr>
        </tbody>
      </table>

      <div v-else class="empty">선택된 제품이 없습니다.</div>
    </section>

    <!-- 결제 정보 -->
    <section class="card">
      <h3 class="section-title">결제 정보</h3>

      <div class="review-grid">
        <div class="review-item">
          <span class="label">월 납부액</span>
          <span class="value price">
            {{ formatPrice(draft.payment.monthlyPayment) }}
          </span>
        </div>

        <div class="review-item">
          <span class="label">계약 총액</span>
          <span class="value price">
            {{ formatPrice(draft.payment.totalAmount) }}
          </span>
        </div>

        <div class="review-item">
          <span class="label">결제 방법</span>
          <span class="value">
            {{ draft.payment.paymentMethod === 'AUTO' ? '자동이체' : '계좌이체' }}
          </span>
        </div>

        <div class="review-item">
          <span class="label">결제일</span>
          <span class="value">
            매월 {{ draft.payment.paymentDay }}일
          </span>
        </div>
      </div>
    </section>

    <!-- 결재선 -->
    <section class="card">
      <h3 class="section-title">결재선</h3>

      <ul class="approval-line">
        <li
          v-for="(emp, idx) in draft.approvalLine"
          :key="emp.id"
        >
          <span class="step">{{ idx + 1 }}차 승인</span>
          <span class="role">
            {{ emp.name }} ({{ emp.positionName }})
          </span>
        </li>
      </ul>
    </section>

    <!-- 버튼 -->
    <div class="action-row">
      <button class="secondary-btn" @click="$emit('prev')">
        이전 단계
      </button>

      <button class="primary-btn" @click="$emit('submit')">
        계약 승인 요청
      </button>
    </div>
  </div>
</template>
<script setup>
  const props = defineProps({
    draft: {
      type: Object,
      required: true
    }
  })
  
  const formatPrice = v =>
    v ? v.toLocaleString() + '원' : '-'
  </script>
  <style scoped>
    /* =========================
   Layout
========================= */
.step-container {
  max-width: 1100px;
  margin: 0 auto;
}

.title {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 6px;
}

.desc {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 28px;
}

/* =========================
   Card
========================= */
.card {
  background: #ffffff;
  border-radius: 14px;
  padding: 26px 28px;
  margin-bottom: 22px;
  border: 1px solid #eef1f6;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.04);
}

.section-title {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 18px;
  color: #111827;
}

/* =========================
   Review Grid
========================= */
.review-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px 28px;
}

.review-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 12px;
  color: #9ca3af;
  letter-spacing: 0.02em;
}

.value {
  font-size: 15px;
  font-weight: 500;
  color: #111827;
}

.value.price {
  font-size: 16px;
  font-weight: 700;
  color: #1f2937;
}

/* =========================
   Status Badge
========================= */
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge.pending {
  background: #fff7ed;
  color: #c2410c;
  border: 1px solid #fed7aa;
}

/* =========================
   Item Table
========================= */
.item-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.item-table th {
  text-align: left;
  font-size: 13px;
  color: #6b7280;
  padding: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.item-table td {
  padding: 14px 12px;
  font-size: 14px;
  border-bottom: 1px solid #f1f5f9;
}

.item-table td.price {
  font-weight: 600;
  color: #1f2937;
}

.empty {
  padding: 30px;
  text-align: center;
  font-size: 14px;
  color: #9ca3af;
}

/* =========================
   Approval Line
========================= */
.approval-line {
  list-style: none;
  padding: 0;
  margin: 0;
}

.approval-line li {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  margin-bottom: 10px;
}

.approval-line .step {
  min-width: 72px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
}

.approval-line .role {
  font-size: 14px;
  color: #111827;
}

/* =========================
   Action Buttons
========================= */
.action-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 36px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.primary-btn {
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #ffffff;
  padding: 14px 36px;
  border-radius: 10px;
  font-size: 15px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.25);
  transition: all 0.2s ease;
}

.primary-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px rgba(37, 99, 235, 0.3);
}

.secondary-btn {
  background: #f3f4f6;
  color: #374151;
  padding: 14px 30px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.secondary-btn:hover {
  background: #e5e7eb;
}

/* =========================
   Responsive
========================= */
@media (max-width: 900px) {
  .review-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .review-grid {
    grid-template-columns: 1fr;
  }

  .action-row {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .primary-btn,
  .secondary-btn {
    width: 100%;
  }
}

  </style>