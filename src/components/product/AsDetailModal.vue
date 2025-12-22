<template>
    <el-dialog
    v-model="visible"
    width="720px"
    destroy-on-close
    align-center
    class="as-detail-dialog" >

    <!-- Header -->
    <template #header>
        <div class="modal-header">
            <h3>점검 상세 정보</h3>
            <p>{{ detail.after_service_code }} · {{ detail.customerName }}</p>
        </div>
    </template>

    <!-- BODY -->
    <div class="dialog-body">
        <!-- 기업 정보 -->
        <el-card class="section">
            <h4>🏢 기업 정보</h4>
            <el-row>
            <el-col :span="12">기업명: {{ detail.customerName }}</el-col>
            <el-col :span="12">담당자: {{ detail.customerManager }}</el-col>
            <el-col :span="24">렌탈 자산: {{ detail.itemName }}</el-col>
            </el-row>
        </el-card>

        <!-- 점검 정보 -->
        <el-card class="section">
            <h4>🔧 점검 정보</h4>

            <!-- 조회 모드 -->
            <template v-if="!editMode">
            <el-row>
                <el-col :span="12">점검 유형: {{ typeLabel }}</el-col>
                <el-col :span="12">담당 기사: {{ detail.engineer }}</el-col>
                <el-col :span="12">예정일: {{ formatDate(detail.dueDate) }}</el-col>
                <el-col :span="12">마지막 점검일: {{ formatDate(detail.lastInspectDate) }}</el-col>
                <el-col :span="12">점검 주기: {{ detail.inspectCycleLabel }}</el-col>
            </el-row>
            </template>

            <!-- 수정 모드 -->
            <el-form
            v-else
            :model="form"
            label-width="80px"
            size="small" >
            <el-form-item label="담당 기사">
                <el-input v-model="form.engineer" />
            </el-form-item>

            <el-form-item label="예정일">
                <el-date-picker
                v-model="form.dueDate"
                type="datetime"
                style="width: 100%" />
            </el-form-item>

            <el-form-item label="상태">
                <el-select v-model="form.status">
                <el-option label="예정" value="P" />
                <el-option label="완료" value="C" />
                </el-select>
            </el-form-item>
            </el-form>
        </el-card>

        <!-- 처리 상세 -->
        <el-card class="section highlight">
            <h4>📋 처리 상세</h4>
            <el-input
            v-if="editMode"
            v-model="form.contents"
            type="textarea"
            :rows="2" />
            <p v-else>{{ detail.contents || '상세 내용 없음' }}</p>
        </el-card>

        <!-- 상태 -->
        <el-card class="section status">
            <h4>⏱ 처리 상태</h4>
            <el-tag :type="statusTagType">{{ statusLabel }}</el-tag>
            <span class="dday">{{ ddayText }}</span>
        </el-card>
    </div>

    <!-- Footer -->
    <template #footer>
        <div class="footer-actions">
            <el-button @click="close">닫기</el-button>

            <el-tooltip
            content="완료된 점검은 수정할 수 없습니다"
            placement="top"
            :disabled="detail.status !== 'C'" >
            <span>
                <el-button v-if="!editMode" type="primary"
                :disabled="detail.status === 'C'"
                @click="editMode = true" > 수정하기
                </el-button>
            </span>
            </el-tooltip>

            <el-button v-if="editMode" type="success" @click="submit" > 저장 </el-button>
        </div>
    </template>
    </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import axios from '@/api/axios'
import { fetchAsDetail } from '@/api/as/as'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({ asId: Number, modelValue: Boolean })

const emit = defineEmits(['update:modelValue', 'updated'])

const visible = ref(false)
const editMode = ref(false)
const detail = ref({})

const form = ref({engineer: '', dueDate: '', status: '', contents: '' })

watch(
    () => props.modelValue,
    async (v) => {
        visible.value = v
        if (v && props.asId) {
        const { data } = await fetchAsDetail(props.asId)
        detail.value = data

        form.value = {
            engineer: data.engineer,
            dueDate: data.dueDate,
            status: data.status,
            contents: data.contents
        }
        }
    }
)

watch(editMode, (v) => {
    if (v && detail.value.status === 'C') {
        editMode.value = false
    }
})

const close = () => {
    editMode.value = false
    emit('update:modelValue', false)
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
.section { margin-bottom: 16px; }
.highlight { background: #f0f7ff; }
.status { background: #fff4e6; }
.dday { margin-left: 12px; color: #f56c6c; }
.modal-header h3 { margin: 0; }
.modal-header p { margin: 4px 0 0; color: #888; }
.footer-actions { display: flex; justify-content: flex-end; gap: 12px; }
.as-detail-dialog :deep(.el-dialog) { max-height: 90vh; display: flex; flex-direction: column; }

/* Header + Footer 제외한 영역 */
.dialog-body { flex: 1; overflow: hidden; }

/* 카드 간격 축소 → 화면 압축 */
.section { margin-bottom: 12px; }

/* footer는 항상 보이게 */
.footer-actions { display: flex; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid #eee; }

</style>
