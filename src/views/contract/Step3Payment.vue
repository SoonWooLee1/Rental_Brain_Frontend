<template>
  <div class="step-container">
    <h2 class="title">결제 정보 설정</h2>

    <!-- 금액 정보 -->
    <section class="card">
      <h3 class="section-title">결제 금액</h3>

      <div class="price-grid">
        <div class="price-item">
          <label>월 납부액 (할인 전)</label>
          <strong>{{ formatPrice(originalMonthlyPayment) }}</strong>
        </div>

        <div v-if="selectedCoupon" class="price-item discount">
          <label>할인 
            <span v-if="selectedCoupon.type === 'R'">
             ({{ selectedCoupon.rate }}%)
            </span>
            <span v-else>
             ({{ formatPrice(selectedCoupon.rate) }})
            </span></label>
          <strong>-{{ formatPrice(discountAmount) }}</strong>
        </div>

        <div class="price-item">
          <label>월 납부액 (할인 후)</label>
          <strong class="final">
            {{ formatPrice(discountedMonthlyPayment) }}
          </strong>
        </div>

        <div class="price-item">
          <label>계약 기간</label>
          <strong>{{ contractDuration }} 개월</strong>
        </div>

        <div class="price-item">
          <label>계약 총액</label>
          <strong>{{ formatPrice(totalAmount) }}</strong>
        </div>

        <div class="price-item">
          <label>결제일</label>
          <strong>매월 {{ paymentDay }}일</strong>
        </div>
      </div>
    </section>

    <!-- 결제 방법 -->
    <section class="card">
      <h3 class="section-title">결제 방법</h3>

      <div class="radio-group">
        <label class="radio-item">
          <input
            type="radio"
            value="AUTO"
            v-model="paymentMethod"
          />
          자동이체
        </label>

        <label class="radio-item">
          <input
            type="radio"
            value="ACCOUNT"
            v-model="paymentMethod"
          />
          계좌이체
        </label>
      </div>
    </section>

    <!-- 특약 사항 -->
    <section class="card">
      <h3 class="section-title">특약 사항</h3>

      <textarea
        v-model="memo"
        rows="4"
        placeholder="특약 사항 또는 참고 메모를 입력하세요."
      />
    </section>

    <section class="card">
  <h3 class="section-title">적용 가능한 쿠폰</h3>

  <div v-if="coupons.length === 0" class="empty">
    사용 가능한 쿠폰이 없습니다.
  </div>

  <ul v-else>
    <li
      v-for="c in coupons"
      :key="c.id"
      class="coupon-list"
      :class="{ selected: selectedCoupon?.id === c.id }"
      @click="toggleCoupon(c)"
    >
      <div class="coupon-text">
        <strong>{{ c.name }}</strong>
        <p class="desc">
          {{ c.content }}
          <span v-if="c.type === 'R'">({{ c.rate }}%)</span>
          <span v-else>({{ formatPrice(c.rate) }})</span>
        </p>
      </div>
    
      <span class="check">
        <span v-if="selectedCoupon?.id === c.id">✔</span>
      </span>
    </li>

  </ul>
</section>

    <!-- 하단 버튼 -->
    <div class="footer">
      <button class="secondary-btn" @click="$emit('prev')">
        이전
      </button>
      <button class="primary-btn" @click="goNext">
        다음
      </button>
    </div>
  </div>
</template>
<script setup>
  import { ref, computed, watch } from 'vue'
  import { getCouponsForContract } from '@/api/contract';

  /* =========================
     props / emits
  ========================= */
  const props = defineProps({
    draft: {
      type: Object,
      required: true
    }
  })
  
  const emit = defineEmits(['prev', 'next', 'update'])
  
  /* =========================
     결제 정보 상태
  ========================= */
  const coupons = ref([])
  const selectedCoupon = ref(props.draft.payment?.coupon || null)
  const paymentMethod = ref(
    props.draft.payment?.paymentMethod || 'AUTO'
  )
  const memo = ref(props.draft.payment?.memo || '')
  
  /* =========================
     Step2 데이터 기반 계산
  ========================= */
  
  /* 할인 전 월 납부액 (선택된 상품 기준) */
  const originalMonthlyPayment = computed(() => {
    if (!props.draft.assets) return 0
    return props.draft.assets.reduce(
      (sum, item) => sum + item.monthlyTotal,
      0
    )
  })

  /* 할인율 */
  const discountRate = computed(() => {
  return selectedCoupon.value?.rate || 0
  })

  /* 할인 금액 */
const discountAmount = computed(() => {
  if (!selectedCoupon.value) return 0

  const coupon = selectedCoupon.value

  // 비율 할인 (%)
  if (coupon.type === 'R') {
    return Math.floor(
      originalMonthlyPayment.value * coupon.rate / 100
    )
  }

  // 정액 할인 (금액 차감)
  if (coupon.type === 'A') {
    return coupon.rate
  }

  return 0
})


  /* 할인 적용된 월 납부액 */
  const discountedMonthlyPayment = computed(() => {
  const result =
    originalMonthlyPayment.value - discountAmount.value

  // 음수 방지
  return Math.max(result, 0)
})
  /* 계약 기간 */
  const contractDuration = computed(() => {
    return props.draft.contract?.duration || 0
  })
  
  /* 계약 총액 */
  const totalAmount = computed(() => {
  return discountedMonthlyPayment.value * contractDuration.value
  })
  
  /* 결제일 (계약 시작일 기준) */
  const paymentDay = computed(() => {
    const start = props.draft.contract?.startDate
    if (!start) return ''
    return new Date(start).getDate()
  })

  const fetchCoupons = async () => {
  if (!props.draft.segmentId) return
  // 예: 고객 ID 기준
  const res = await getCouponsForContract(props.draft.segmentId)
  coupons.value = res.data || []
  }

  const toggleCoupon = (coupon) => {
  // 이미 선택된 쿠폰이면 → 해제
  if (selectedCoupon.value?.id === coupon.id) {
    selectedCoupon.value = null
  } else {
    selectedCoupon.value = coupon
  }
}


  watch(
  () => props.draft.segmentId,
  (val) => {
    if (!val) return
    fetchCoupons()
  },
  { immediate: true }
  )
  
  /* =========================
     다음 단계
  ========================= */
  function goNext() {
    emit('update', {
      payment: {
        monthlyPayment: discountedMonthlyPayment.value,
        totalAmount: totalAmount.value,
        paymentDay: paymentDay.value,
        paymentMethod: paymentMethod.value,
        memo: memo.value,
        coupon: selectedCoupon.value
      }
    })
  
    emit('next')
  }
  
  /* =========================
     util
  ========================= */
  const formatPrice = v => v.toLocaleString() + '원'

  </script>
  <style scoped>
  .step-container {
    padding: 32px 48px;
  }
  
  .title {font-size: 20px;font-weight: 600;margin-bottom: 16px;}
  
  .card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .section-title {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .price-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .price-item label {
    font-size: 13px;
    color: #666;
  }
  
  .price-item strong {
    display: block;
    font-size: 18px;
    margin-top: 4px;
  }
  
  .radio-group {
    display: flex;
    gap: 24px;
  }
  
  .radio-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  
  textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #e0e4f0;
    border-radius: 6px;
    resize: vertical;
  }
  
  .footer {
    display: flex;
    justify-content: space-between;
  }
  
  .primary-btn {
    background: #248eff;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
  }
  
  .secondary-btn {
    background: #eee;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
  }

  .coupon-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 16px 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.coupon-text {
  flex: 1;
}

.coupon-label {
  margin-left: 18px;
  margin-right: 30px;
}

.coupon-list input[name="coupon"] {
  accent-color: #248eff;
  transform: scale(1.5);
  cursor: pointer;
}

.coupon-list {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 16px 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.coupon-list:hover {
  border-color: #248eff;
}

.coupon-list.selected {
  border-color: #248eff;
  background: #f3f8ff;
}

.check {
  font-size: 20px;
  color: #248eff;
  width: 24px;
  text-align: center;
}

  </style>
  