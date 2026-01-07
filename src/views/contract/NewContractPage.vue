<template>
  <!-- 🔹 상위 레이아웃 컨테이너 -->
  <div class="contract-create-page">
    <div class="page-container">
      <ContractStepIndicator
        :currentStep="currentStep"
        @move="goToStep"
      />
      <!-- Step 1 -->
      <Step1Customer
        v-if="currentStep === 1"
        :draft="draft"
        @next="nextStep"
        @update="updateDraft"
      />

      <!-- Step 2 -->
      <Step2ContractProduct
        v-if="currentStep === 2"
        :draft="draft"
        @next="nextStep"
        @prev="prevStep"
        @update="updateDraft"
      />

      <!-- Step 3 -->
      <Step3Payment
        v-if="currentStep === 3"
        :draft="draft"
        @next="nextStep"
        @prev="prevStep"
        @update="updateDraft"
      />

      <!-- Step 4 -->
      <Step4Approval
        v-if="currentStep === 4"
        :draft="draft"
        @next="nextStep"
        @prev="prevStep"
        @update="updateDraft"
      />

      <!-- Step 5 -->
      <Step5Review
        v-if="currentStep === 5"
        :draft="draft"
        @prev="prevStep"
        @submit="submitContract"
      />
    </div>
  </div>
</template>
<script setup>
  import { ref } from 'vue'
  import { createContract } from '@/api/contract'
  import { useRouter } from 'vue-router'
  import { useToastStore } from '@/store/useToast'
  
  import ContractStepIndicator from './ContractStepIndicator.vue'
  import Step1Customer from './Step1Customer.vue'
  import Step2ContractProduct from './Step2ContractProduct.vue'
  import Step3Payment from './Step3Payment.vue'
  import Step4Approval from './Step4Approval.vue'
  import Step5Review from './Step5Review.vue'
  
const router = useRouter()
const toastStore = useToastStore();
/* =========================
   Step 상태
========================= */
  const currentStep = ref(1)
  const goToStep = (step) => {
  currentStep.value = step
}
  
/* =========================
   계약 Draft
========================= */
const draft = ref({
  customerId: null,
  customerName: '',
  customerCode: '',
  inCharge: '',
  segmentId: null,
  segmentName: '',

  contract: {
    name: '',
    startDate: '',
    endDate: '',
    duration: null
  },

  assets: [],
  promotion: null,

  payment: {
    monthlyPayment: 0,
    totalAmount: 0,
    paymentDay: null,
    paymentMethod: 'AUTO',
    memo: '',
    coupon: null
  },

  approvalLine: []
})
  
/* =========================
   Draft 병합
========================= */
const updateDraft = (payload) => {
  draft.value = {
    ...draft.value,
    ...payload
  }
}
  
/* =========================
   Step 이동
========================= */
const nextStep = () => {
  if (currentStep.value < 5) currentStep.value++
}

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--
}


/* =========================
   계약 승인 요청 (POST)
========================= */
const submitContract = async () => {
  const body = {
    contractName: draft.value.contract.name,
    startDate: `${draft.value.contract.startDate}T00:00`,
    contractPeriod: draft.value.contract.duration,

    monthlyPayment: draft.value.payment.monthlyPayment,
    totalAmount: draft.value.payment.totalAmount,
    payMethod: draft.value.payment.paymentMethod === 'AUTO' ? 'A' : 'B',
    specialContent: draft.value.payment.memo,

    cumId: draft.value.customerId,

    items: draft.value.assets.map(a => ({
      itemName: a.itemName,
      quantity: a.quantity
    }))
  }

  /* =========================
     쿠폰 / 프로모션
  ========================= */
  if (draft.value.payment.coupon) {
    body.couponId = draft.value.payment.coupon.id
  }

  if (draft.value.promotion) {
    body.promotionId = draft.value.promotion.id
  }

   /* =========================
     승인자 분기
  ========================= */
  if (draft.value.approvalLine.length === 2) {
    body.leaderId = draft.value.approvalLine[0].id
    body.ceoId = draft.value.approvalLine[1].id
  }

  if (draft.value.approvalLine.length === 1) {
    body.ceoId = draft.value.approvalLine[0].id
  }

  try {

    console.log('계약 승인 요청 body', body)

    await createContract(body)

    toastStore.showToast('계약 승인 요청이 완료되었습니다.')

    // TODO: 계약 목록 또는 상세 페이지 이동
    router.push('/contracts')

  } catch (e) {
    console.error('계약 승인 요청 실패', e)
    toastStore.showToast('계약 승인 요청 중 오류가 발생했습니다.')
  }
}
  </script>
  <style scoped>
  /* 페이지 배경 */
  .contract-create-page {
    background: #f5f7fb;
    min-height: 100vh;
  }
  
  /* ⭐ 핵심: 좌우 여백 + 최대 너비 */
  .page-container {
    max-width: 1280px;      /* 너무 넓지 않게 */
    margin: 0 auto;         /* 가운데 정렬 */
    padding: 24px 32px;
  }
  
  /* 반응형 (태블릿/모바일) */
  @media (max-width: 768px) {
    .page-container {
      padding: 16px 20px;
    }
  }
  </style>
  