<template>
  <div class="step-container">
    <h2 class="title">계약 정보 및 렌탈 제품 선택</h2>

    <!-- 계약 정보 -->
    <section class="card">
      <h3 class="section-title">계약 정보</h3>

      <div class="form-grid">
        <div>
          <label>계약명</label>
          <input v-model="contractName" placeholder="계약명을 입력하세요" />
        </div>

        <div>
          <label>계약 시작일</label>
          <input type="date" v-model="startDate" :min="today"
          />
        </div>

        <div>
          <label>계약 기간 (개월)</label>
          <input type="number" min="1" v-model.number="duration" />
        </div>

        <div>
          <label>계약 만료일</label>
          <input type="date" :value="endDate" disabled />
        </div>
      </div>
    </section>

    <!-- 제품 선택 -->
    <section class="card">
      <h3 class="section-title">렌탈 제품 선택</h3>

      <div class="product-select">
        <select v-model="selectedItemName">
          <option value="">제품 선택</option>

          <optgroup
            v-for="(items, category) in groupedItems"
            :key="category"
            :label="category"
          >
            <option
              v-for="item in items"
              :key="item.itemName"
              :value="item.itemName"
              :disabled="item.possibleAmount === 0"
            >
              {{ item.itemName }}
              (가능 {{ item.possibleAmount }}대)
            </option>
          </optgroup>
        </select>

        <input
          type="number"
          min="1"
          :max="selectedItem?.possibleAmount || 1"
          v-model.number="selectedQuantity"
          :disabled="!selectedItem || selectedItem.possibleAmount === 0"
        />

        <button class="primary-btn" @click="addItem">
          추가
        </button>
      </div>

      <!-- 선택된 제품 목록 -->
      <table class="item-table" v-if="selectedItems.length">
        <thead>
          <tr>
            <th>제품명</th>
            <th>수량</th>
            <th>월 납입금</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in selectedItems" :key="item.itemName">
            <td>{{ item.itemName }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ formatPrice(item.monthlyTotal) }}</td>
            <td>
              <button class="link-btn" @click="removeItem(item.itemName)">
                제거
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="total-price">
        총 월 납입금:
        <strong>{{ formatPrice(totalMonthlyPrice) }}</strong>
      </div>
    </section>

    <!-- 프로모션 -->
    <section class="card">
      <h3 class="section-title">적용 가능한 프로모션</h3>

      <div v-if="promotions.length === 0" class="empty">
        적용 가능한 프로모션이 없습니다.
      </div>

      <ul v-else >
        <li v-for="p in promotions" :key="p.id" class="promotion-list">
          <div class="promotion-text">
            <strong>{{ p.name }}</strong>
            <p class="desc">{{ p.content }}</p>
          </div>
          <label class="promotion-label">
            <input
              type="radio"
              name="promotion"
              :value="p"
              v-model="selectedPromotion"
            />
          </label>
        </li>
      </ul>
    </section>

    <!-- 버튼 -->
    <div class="footer">
      <button class="secondary-btn" @click="$emit('prev')">이전</button>
      <button class="primary-btn" @click="handleNext">다음</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getProductNameList } from '@/api/product'
import { getPromotionsForContract } from '@/api/contract'

const props = defineProps({
  draft: Object,
})

const emit = defineEmits(['update', 'next', 'prev'])

/* 계약 정보 */
const contractName = ref('')
const startDate = ref('')
const duration = ref('')

/* 만료일 계산 */
const endDate = computed(() => {
  if (!startDate.value || !duration.value) return ''
  const d = new Date(startDate.value)
  d.setMonth(d.getMonth() + duration.value)
  return d.toISOString().slice(0, 10)
})

/* 제품 데이터 */
const items = ref([])
const selectedItemName = ref('')
const selectedQuantity = ref(1)
const selectedItems = ref([])

/* 프로모션 */
const promotions = ref([])
const selectedPromotion = ref(null)

const today = computed(() => {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
})

watch(startDate, (val) => {
  if (!val) return

  if (val < today.value) {
    alert('계약 시작일은 오늘 이후 날짜만 선택할 수 있습니다.')
    startDate.value = today.value
  }
})

watch(
  () => props.draft,
  (draft) => {
    // 계약 정보
    contractName.value = draft.contract?.name || ''
    startDate.value = draft.contract?.startDate || ''
    duration.value = draft.contract?.duration || ''

    // 제품
    selectedItems.value = draft.assets
      ? JSON.parse(JSON.stringify(draft.assets))
      : []

    // 프로모션
    selectedPromotion.value = draft.promotion || null
  },
  { immediate: true }
)

/* API 호출 */
const fetchItems = async () => {
  const res = await getProductNameList()
  items.value = res.data.contents || []
}

const fetchPromotions = async () => {
  if (!props.draft.segmentId) return
  const res = await getPromotionsForContract(props.draft.segmentId)
  promotions.value = res.data || []
}

/* 카테고리 그룹화 */
const groupedItems = computed(() => {
  return items.value.reduce((acc, cur) => {
    acc[cur.categoryName] = acc[cur.categoryName] || []
    acc[cur.categoryName].push(cur)
    return acc
  }, {})
})

const selectedItem = computed(() =>
  items.value.find(i => i.itemName === selectedItemName.value)
)

/* 제품 추가 */
const addItem = () => {
  if (!selectedItem.value) return

  // 수량 검증
  if (selectedQuantity.value > selectedItem.value.possibleAmount) {
    alert(
      `렌탈 가능 수량은 최대 ${selectedItem.value.possibleAmount}대입니다.`
    )
    return
  }

  if (selectedQuantity.value <= 0) {
    alert('수량은 1 이상이어야 합니다.')
    return
  }

  const exists = selectedItems.value.find(
    i => i.itemName === selectedItem.value.itemName
  )
  if (exists) return alert('이미 추가된 제품입니다.')

  selectedItems.value.push({
    itemName: selectedItem.value.itemName,
    quantity: selectedQuantity.value,
    monthlyPrice: selectedItem.value.monthlyPrice,
    monthlyTotal:
      selectedItem.value.monthlyPrice * selectedQuantity.value,
  })
}

/* 제품 제거 */
const removeItem = name => {
  selectedItems.value = selectedItems.value.filter(i => i.itemName !== name)
}

watch(selectedQuantity, (val) => {
  if (!selectedItem.value) return

  const max = selectedItem.value.possibleAmount

  // 숫자가 아니면 초기화
  if (!val || val < 1) {
    selectedQuantity.value = 1
    return
  }

   // 🔥 max가 10 미만일 때 → 두 자리 입력 시 마지막 자리만 유지
  if (max < 10 && val >= 10) {
    selectedQuantity.value = val % 10 || 1
    return
  }

  // 일반적인 초과 방지
  if (val > max) {
    selectedQuantity.value = max
  }
})

/* 월 납입금 */
const totalMonthlyPrice = computed(() =>
  selectedItems.value.reduce((sum, i) => sum + i.monthlyTotal, 0)
)

/* 다음 단계 */
const handleNext = () => {

  // 계약명
  if (!contractName.value.trim()) {
    alert('계약명을 입력해주세요.')
    return
  }

  // 계약 시작일
  if (!startDate.value) {
    alert('계약 시작일을 선택해주세요.')
    return
  }

  // 계약 기간
  if (!duration.value || duration.value < 1) {
    alert('계약 기간을 1개월 이상 입력해주세요.')
    return
  }

  // 렌탈 제품 최소 1개
  if (selectedItems.value.length === 0) {
    alert('렌탈 제품을 최소 1개 이상 선택해주세요.')
    return
  }

  emit('update', {
    contract: {
      name: contractName.value,
      startDate: startDate.value,
      endDate: endDate.value,
      duration: duration.value,
    },
    assets: selectedItems.value,
    promotion: selectedPromotion.value,
  })
  emit('next')
}

/* 초기 로딩 */
onMounted(() => {
  fetchItems()
  fetchPromotions()
})

/* 유틸 */
const formatPrice = v =>
  v.toLocaleString() + '원'
</script>

<style scoped>
.step-container {padding: 32px 48px;}
.title {font-size: 22px;margin-bottom: 20px;}
.card {background: #fff;border-radius: 8px;padding: 20px;margin-bottom: 24px;}
.section-title {font-size: 16px; margin-bottom: 12px;}
.form-grid {display: grid;grid-template-columns: repeat(2, 1fr);gap: 16px;}
input, select {width: 100%;padding: 8px 10px;}
.product-select {display: flex;gap: 8px;margin-bottom: 16px;}
.item-table {width: 100%;border-collapse: collapse;}
.item-table th, .item-table td {padding: 10px;border-bottom: 1px solid #eee;}
.total-price {margin-top: 12px;font-size: 16px;}
.promotion-list {display: flex;justify-content: space-between ;align-items: center; margin: 20px 0; padding: 16px 20px; border: 1px solid #eee; border-radius: 8px;}
.promotion-text {flex: 1;}
.promotion-label {margin-left: 18px; margin-right: 30px;}
.promotion-list input[name="promotion"] {accent-color: #248eff;transform: scale(1.5);cursor: pointer;}
.desc {margin-top: 10px;font-size: 13px;color: #666;line-height: 1.4;}
.footer {display: flex;justify-content: space-between;}
.primary-btn {background: #248eff;color: #fff;border: none;padding: 8px 16px;}
.secondary-btn {background: #eee;border: none;padding: 8px 16px;}
.link-btn {background: none;border: none;color: #248eff;}
</style>
