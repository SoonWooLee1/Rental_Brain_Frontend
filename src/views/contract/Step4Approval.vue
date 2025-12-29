<template>
  <div class="step-container">
    <h2 class="title">결재선 지정</h2>

    <!-- 결재선 없음 -->
    <div
      v-if="approvalPolicy === 'NONE'"
      class="card info"
    >
      현재 직급에서는 결재선 지정이 필요하지 않습니다.
    </div>

    <!-- CEO만 선택 -->
    <section
      v-if="approvalPolicy === 'CEO_ONLY'"
      class="card"
    >
      <h3 class="section-title">CEO 결재자 선택</h3>

      <ul class="employee-list">
        <li
          v-for="e in ceos"
          :key="e.id"
          :class="{ selected: selectedCeo?.id === e.id }"
          @click="selectedCeo = e"
        >
          <strong>{{ e.name }}</strong>
          <span>{{ e.positionName }}</span>
        </li>
      </ul>
    </section>

    <!-- 팀장 + CEO -->
    <template v-if="approvalPolicy === 'LEADER_AND_CEO'">
      <section class="card">
        <h3 class="section-title">팀장 결재자 선택</h3>

        <ul class="employee-list">
          <li
            v-for="e in leaders"
            :key="e.id"
            :class="{ selected: selectedLeader?.id === e.id }"
            @click="selectedLeader = e"
          >
            <strong>{{ e.name }}</strong>
            <span>{{ e.positionName }}</span>
          </li>
        </ul>
      </section>

      <section class="card">
        <h3 class="section-title">CEO 결재자 선택</h3>

        <ul class="employee-list">
          <li
            v-for="e in ceos"
            :key="e.id"
            :class="{ selected: selectedCeo?.id === e.id }"
            @click="selectedCeo = e"
          >
            <strong>{{ e.name }}</strong>
            <span>{{ e.positionName }}</span>
          </li>
        </ul>
      </section>
    </template>

    <!-- 버튼 -->
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
  import { ref, computed, onMounted } from 'vue'
  import { useAuthStore } from '@/store/auth.store'
  import { getContractApprovers } from '@/api/contract'

  const authStore = useAuthStore()

  /* =========================
     로그인 사용자 정보
  ========================= */
  const loginPositionId = computed(() => authStore.positionId)
  
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
     직원 목록
  ========================= */
  const employees = ref([])
  
  /* =========================
     결재선 선택 상태
  ========================= */
  const selectedLeader = ref(null) // 팀장
  const selectedCeo = ref(null)    // CEO
  
  /* =========================
     직원 분류
  ========================= */
  const ceos = computed(() =>
    employees.value.filter(e => e.positionId === 1)
  )
  
  const leaders = computed(() =>
    employees.value.filter(e =>
      [2, 3, 4].includes(e.positionId)
    )
  )
  
  /* =========================
     결재 정책 계산
  ========================= */
  const approvalPolicy = computed(() => {
    const pos = Number(loginPositionId.value)

    if (pos === 1) return 'NONE'
    if ([2, 3, 4].includes(pos)) return 'CEO_ONLY'
    if ([5, 6, 7].includes(pos)) return 'LEADER_AND_CEO'
    return 'NONE'
  })
  
  /* =========================
     API
  ========================= */
  async function fetchEmployees() {
    const res = await getContractApprovers()
    employees.value = res.data ?? []
  }
  
  /* =========================
     다음 단계
  ========================= */
  function goNext() {
    let approvalLine = []
  
    if (approvalPolicy.value === 'CEO_ONLY') {
      if (!selectedCeo.value) {
        alert('CEO 결재자를 선택해주세요.')
        return
      }
      approvalLine.push(selectedCeo.value)
    }
  
    if (approvalPolicy.value === 'LEADER_AND_CEO') {
      if (!selectedLeader.value || !selectedCeo.value) {
        alert('팀장 및 CEO 결재자를 모두 선택해주세요.')
        return
      }
      approvalLine.push(selectedLeader.value, selectedCeo.value)
    }
  
    emit('update', {
      approvalLine
    })
  
    emit('next')
  }
  
  /* =========================
     init
  ========================= */
  onMounted(fetchEmployees)
  </script>
  <style scoped>
  .step-container {
    padding: 32px 48px;
  }
  
  .title {
    font-size: 22px;
    margin-bottom: 20px;
  }
  
  .card {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 24px;
  }
  
  .card.info {
    background: #f0f6ff;
    color: #1e40af;
  }
  
  .section-title {
    font-size: 16px;
    margin-bottom: 12px;
  }
  
  .employee-list {
    list-style: none;
    padding: 0;
  }
  
  .employee-list li {
    padding: 12px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: 0.2s;
  }
  
  .employee-list li:hover {
    background: #f9fafb;
  }
  
  .employee-list li.selected {
    border-color: #248eff;
    background: #f0f6ff;
  }
  
  .employee-list span {
    display: block;
    font-size: 13px;
    color: #666;
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
  </style>
  