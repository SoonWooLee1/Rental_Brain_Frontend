<template>
  <div class="detail-backdrop" @click.self="emitClose">
    <div class="detail-modal">
      <!-- ===== Header ===== -->
      <div class="detail-header">
  <!-- 왼쪽 영역 -->
  <div class="header-left">
    <div class="title-row">
      <h2>점검 상세 정보</h2>
    </div>

    <!-- 서브 정보는 아래 줄 -->
    <p class="sub">
      {{ detail.after_service_code }} · {{ detail.customerName }}
    </p>
  </div>

  <!-- 오른쪽 끝 -->
  <button class="icon-btn" @click="emitClose">✕</button>
</div>


      <!-- ===== KPI ===== -->
      <div class="detail-kpi-row">
        <div class="detail-kpi-card">
          <p class="label">점검 유형</p>
          <p class="value">{{ typeLabel }}</p>
        </div>
        <div class="detail-kpi-card">
          <p class="label">상태</p>
          <p class="value">{{ statusLabel }}</p>
        </div>
        <div class="detail-kpi-card">
          <p class="label">담당 기사</p>
          <p class="value">{{ detail.engineer || '-' }}</p>
        </div>
        <div class="detail-kpi-card">
          <p class="label">예정일</p>
          <p class="value">{{ formatDate(detail.dueDate) }}</p>
        </div>
      </div>

      <!-- ===== Content ===== -->
      <div class="detail-content">
        <div class="detail-section info-grid">
          <h4>기업 정보</h4>
          <div class="info-row">
            <span class="label">기업명</span>
            <span class="value">{{ detail.customerName }}</span>
          </div>
          <div class="info-row">
            <span class="label">담당자</span>
            <span class="value">{{ detail.customerManager }}</span>
          </div>
          <div class="info-row">
            <span class="label">렌탈 자산</span>
            <span class="value">{{ detail.itemName }}</span>
          </div>
        </div>


        <div class="detail-section info-grid">
          <h4>점검 정보</h4>

           <template v-if="!editMode">
            <div class="info-row">
              <span class="label">점검 유형</span>
              <span class="value">{{ typeLabel }}</span>
            </div>
            <div class="info-row">
              <span class="label">마지막 점검일</span>
              <span class="value">{{ formatDate(detail.lastInspectDate) }}</span>
            </div>
            <div class="info-row">
              <span class="label">점검 주기</span>
              <span class="value">{{ detail.inspectCycleLabel }}</span>
            </div>
          </template>

          <template v-else>
            <el-input v-model="form.engineer" placeholder="담당 기사" />
            <el-date-picker
              v-model="form.dueDate"
              type="datetime"
              style="width: 100%; margin-top: 8px;"
            />
            <el-select v-model="form.status" style="width: 100%; margin-top: 8px;">
              <el-option label="예정" value="P" />
              <el-option label="완료" value="C" />
            </el-select>
          </template>
        </div>

        <div class="detail-section info-grid">
  <div class="section-header">
    <h4>처리 상태</h4>
    <span class="dday-badge">{{ ddayText }}</span>
  </div>

  <el-input
    v-if="editMode"
    v-model="form.contents"
    type="textarea"
    rows="3"
    placeholder="처리 내용을 입력하세요"
  />
  <p v-else class="contents-text">
    {{ detail.contents || '상세 내용 없음' }}
  </p>
</div>

      </div>

      <!-- ===== Footer ===== -->
<div class="detail-footer">
  <!-- 좌측: 위험 행동 -->
  <div class="footer-left">
    <el-button
      v-if="!editMode"
      type="danger"
      plain
      :disabled="detail.status === 'C' || !canUpdateAs"
      @click="onDelete"
    >
      삭제
    </el-button>
  </div>

  <!-- 우측: 주요 행동 -->
  <div class="footer-right">
    <!-- 조회 모드 -->
    <template v-if="!editMode">
      <el-button
        :disabled="detail.status === 'C' || !canUpdateAs"
        @click="editMode = true"
      >
        수정
      </el-button>
      <el-button type="primary" @click="emitClose">
        확인
      </el-button>
    </template>

    <!-- 수정 모드 -->
    <template v-else>
      <el-button @click="editMode = false">
        취소
      </el-button>
      <el-button type="primary" @click="submit">
        저장
      </el-button>
    </template>
  </div>
</div>

    </div>
  </div>
</template>


<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import axios from '@/api/axios'
import { fetchAsDetail } from '@/api/as/as'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/store/auth.store'

const props = defineProps({
  asId: {
    type: Number,
    required: true
  },
  modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'updated', 'closed'])

const editMode = ref(false)
const detail = ref({})
const authStore = useAuthStore();

const canUpdateAs = computed(() =>
  authStore.hasAuth('AS_SCHEDULE')
)

const form = ref({engineer: '', dueDate: '', status: '', contents: '' })

const emitClose = () => {
  editMode.value = false
  emit('update:modelValue', false)
  emit('closed')
}


watch(
  () => [props.modelValue, props.asId],
  async ([open, asId]) => {
    if (!open || !asId) return

    try {
      const { data } = await fetchAsDetail(asId)

      detail.value = data
      form.value = {
        engineer: data.engineer,
        dueDate: data.dueDate,
        status: data.status,
        contents: data.contents
      }
    } catch (e) {
      console.error('AS 상세 조회 실패', e)
      ElMessage.error('점검 상세 정보를 불러오지 못했습니다.')
      emit('update:modelValue', false)
    }
  },
  { immediate: true }
)


watch(editMode, (v) => {
    if (v && detail.value.status === 'C') {
        editMode.value = false
    }
})

const safeFetchDetail = async () => {
  if (!props.asId) return

  try {
    const { data } = await fetchAsDetail(props.asId)
    detail.value = data
  } catch (e) {
    console.error(e)
  }
}

const close = () => {
    editMode.value = false
    emit('update:modelValue', false)
}

const onClosed = () => {
    editMode.value = false
    detail.value = {}
    form.value = {
        engineer: '',
        dueDate: '',
        status: '',
        contents: ''
    }
    emit('closed')
}

// ===== 수정 저장 =====
const submit = async () => {
    // 완료 처리 전 확인 팝업
    if (detail.value.status !== 'C' && form.value.status === 'C') {
        try {
        await ElMessageBox({
            title: '점검 완료 확인',
            message: `
            점검 상태를 완료로 변경하면 다시 수정할 수 없습니다.<br/>
            정말 완료 처리하시겠습니까?
            `,
            type: 'warning',
            confirmButtonText: '완료 처리',
            cancelButtonText: '취소',
            showCancelButton: true,
            dangerouslyUseHTMLString: true
        })
        } catch {
        // 취소 / 닫기 시 저장 중단
        return
        }
    }

    // 실제 저장
    await axios.put(`/as/${props.asId}`, form.value)

    ElMessage.success('점검 정보가 수정되었습니다')

    // 상세 재조회 (리스트로 안 가고 상세 유지)
    const { data } = await fetchAsDetail(props.asId)
    detail.value = data

    // 수정 모드 종료 (상세 모달 유지)
    editMode.value = false
}

// 삭제
const onDelete = async () => {
  try {
    await ElMessageBox({
      title: '점검 삭제 확인',
      message: `
        해당 점검 정보를 삭제하면 복구할 수 없습니다.<br/>
        정말 삭제하시겠습니까?
      `,
      type: 'warning',
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      showCancelButton: true,
      dangerouslyUseHTMLString: true
    })

    await axios.delete(`/as/${props.asId}`)

    ElMessage.success('점검 정보가 삭제되었습니다.')

    // 부모 리스트 갱신 요청
    emit('updated')

    // 모달 닫기
    emitClose()

  } catch (e) {
    // 취소 클릭 시 무시
    if (e !== 'cancel') {
      console.error(e)
      ElMessage.error('삭제 중 오류가 발생했습니다.')
    }
  }
}

// ===== computed =====
const typeLabel = computed(() =>
    detail.value.type === 'A' ? 'AS' : '정기점검'
)

const statusLabel = computed(() =>
    detail.value.status === 'C' ? '완료' : '예정'
)

const statusTagType = computed(() =>
    detail.value.status === 'C' ? 'success' : 'warning'
)

const ddayText = computed(() => {
    if (!detail.value.dueDate) return ''
    const diff = dayjs(detail.value.dueDate).diff(dayjs(), 'day')
    return diff >= 0
        ? `점검 예정일까지 ${diff}일 남음`
        : `점검일 ${Math.abs(diff)}일 경과`
})

const formatDate = (d) =>
    d ? dayjs(d).format('YYYY-MM-DD') : '-'
</script>

<style scoped>
.detail-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-modal {
  width: 1000px;
  max-height: 90vh;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf0f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-kpi-row {
  display: flex;
  gap: 12px;
  padding: 16px 24px 8px;
}

.detail-kpi-card {
  flex: 1;
  border-radius: 10px;
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  background: #f9fafb;
}

.detail-content {
  padding: 16px 24px;
  flex: 1;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 16px;
}

.detail-footer {
  padding: 12px 24px 16px;
  border-top: 1px solid #edf0f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-left {
  display: flex;
  gap: 8px;
}

.footer-right {
  display: flex;
  gap: 8px;
}

.info-grid {
  background: #fafafa;
  border-radius: 10px;
  padding: 12px 14px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  padding: 4px 0;
}

.info-row .label {
  color: #6b7280;
}

.info-row .value {
  font-weight: 500;
  color: #111827;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dday-badge {
  font-size: 12px;
  color: #ef4444;
  background: #fee2e2;
  padding: 2px 8px;
  border-radius: 999px;
}

.contents-text {
  font-size: 13px;
  color: #374151;
  margin-top: 6px;
  white-space: pre-line;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.edit-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 15px;
  cursor: pointer;
}

.edit-btn:disabled {
  color: #9ca3af;
  cursor: default;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #374151;
}

.icon-btn:hover {
  color: #111827;
}

.primary-btn {
  background: #248efff2;
  color: #fff;
  border-radius: 8px;
  padding: 8px 18px;
  border: none;
  cursor: pointer;
}

.detail-header {
  padding: 20px 24px;
  border-bottom: 1px solid #edf0f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 왼쪽 전체 */
.header-left {
  display: flex;
  flex-direction: column;
}

/* 제목 + 수정 버튼 */
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 서브 텍스트 */
.sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
}

/* 수정 버튼 */
.edit-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 15px;
  cursor: pointer;
}

.edit-btn:disabled {
  color: #9ca3af;
  cursor: default;
}

/* X 버튼 */
.icon-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
  color: #374151;
}

.icon-btn:hover {
  color: #111827;
}

.delete-btn {
  border: none;
  background: transparent;
  color: #ef4444;
  font-size: 15px;
  cursor: pointer;
}

.delete-btn:disabled {
  color: #fca5a5;
  cursor: default;
}

</style>
