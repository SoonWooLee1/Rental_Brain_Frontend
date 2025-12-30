<template>
    <el-dialog
        :model-value="modelValue"
        title="점검 일정 추가"
        width="520px"
        destroy-on-close
        align-center 
        @update:model-value="emit('update:modelValue', $event)"
        @closed="onClosed">

    <el-form :model="form" label-width="100px">

        <el-form-item label="점검 유형">
            <el-select v-model="form.type" placeholder="선택" style="width: 100%">
            <el-option label="정기점검" value="R" />
            <el-option label="AS" value="A" />
            </el-select>
        </el-form-item>

        <el-form-item label="담당 기사">
            <el-input v-model="form.engineer" />
        </el-form-item>

        <el-form-item label="예정일">
            <el-date-picker
            v-model="form.dueDate"
            type="datetime"
            style="width: 100%"
            />
        </el-form-item>

        <!-- 기업선택 -->
        <el-form-item label="기업">
            <el-select
            v-model="form.customerId"
            placeholder="기업 선택"
            filterable
            clearable
            style="width: 100%" >
            <el-option
                v-for="c in customers"
                :key="c.id"
                :label="c.name"
                :value="c.id"
            />
            </el-select>
        </el-form-item>

    <!-- 고객별 렌탈 제품 -->
    <el-form-item label="제품">
    <el-select
        v-model="form.itemId"
        placeholder="제품 선택"
        :disabled="rentalItems.length === 0"
        clearable
        style="width: 100%" >
        <el-option
        v-for="item in rentalItems"
        :key="item.itemId"
        :value="item.itemId"
        :label="`${item.itemName} (${item.itemCode})`"
        :disabled="isAlreadyScheduled(item)" >
        <div style="display:flex; align-items:center; gap:8px;">
            <span>{{ item.itemName }} ({{ item.itemCode }})</span>

            <el-tag
            size="small"
            :type="statusMap[item.itemStatus]?.type"
            >
            {{ statusMap[item.itemStatus]?.label }}
            </el-tag>

            <el-tag
            v-if="isAlreadyScheduled(item)"
            size="small"
            type="info" >
            점검 예정
            </el-tag>
        </div>
        </el-option>
    </el-select>
    </el-form-item>

        <el-form-item label="내용">
            <el-input
            v-model="form.contents"
            type="textarea"
            rows="3" />
        </el-form-item>

    </el-form>

    <template #footer>
        <div class="footer-actions">
            <el-button @click="close">취소</el-button>
            <el-button type="primary" @click="submit">저장</el-button>
        </div>
    </template>
    </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from '@/api/axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
    modelValue: Boolean
})

const emit = defineEmits(['update:modelValue', 'created'])

const getInitialForm = () => ({
    type: '',
    engineer: '',
    dueDate: '',
    contents: '',
    customerId: null,
    itemId: null
})

const form = ref(getInitialForm())
const customers = ref([])
const rentalItems = ref([])

watch(
    () => props.modelValue,
    async (v) => {
    if (!v) return

    form.value = getInitialForm()
    rentalItems.value = []

    const { data } = await axios.get('/customers/all', {
        params: { page: 1, size: 100 }
    })

    customers.value = data.contents
    }
)

watch(
    () => form.value.customerId,
    async (customerId) => {
    rentalItems.value = []
    form.value.itemId = null

    if (!customerId) return

    const { data } = await axios.get(
        `/as/customers/${customerId}/rental-items`
    )

    rentalItems.value = data
    }
)

const close = () => {
    form.value = getInitialForm()
    rentalItems.value = []
    emit('update:modelValue', false)
}

const onClosed = () => {
    form.value = getInitialForm()
    rentalItems.value = []
}

const submit = async () => {
    if (!form.value.type) {
        ElMessage.warning('점검 유형을 선택해주세요')
        return
    }
    if (!form.value.dueDate) {
        ElMessage.warning('예정일을 선택해주세요')
        return
    }
    if (!form.value.customerId) {
        ElMessage.warning('기업을 선택해주세요')
        return
    }
    if (!form.value.itemId) {
        ElMessage.warning('제품을 선택해주세요')
        return
    }

    // 프론트 중복 방지 최종 체크
    const selected = rentalItems.value.find(
        (i) => i.itemId === form.value.itemId
    )

    if (selected && isAlreadyScheduled(selected)) {
        await ElMessageBox.alert(
        '선택한 제품은 이미 점검 예정인 일정이 존재합니다.\n다른 제품을 선택해주세요.',
        '중복 일정',
        { type: 'warning', confirmButtonText: '확인' })
        return
    }

    try {
        await axios.post('/as', form.value)

        await ElMessageBox.alert(
        '점검 일정이 성공적으로 추가되었습니다.',
        '등록 완료',
        { type: 'success', confirmButtonText: '확인' })

    emit('created')
    close()
    } catch (e) { ElMessage.error('일정 등록 중 오류가 발생했습니다')}
}

/* 상태 태그 */
const statusMap = {
    S: { label: '정상', type: 'success' },
    R: { label: '수리중', type: 'warning' },
    O: { label: '연체', type: 'danger' }
}

/* 이미 점검 예정인 제품 비활성화 */
const isAlreadyScheduled = (item) => {
    if (!item.lastInspectDate) return false
    return new Date(item.lastInspectDate) > new Date()
}
</script>

<style scoped>
.footer-actions { display: flex; justify-content: flex-end; gap: 12px; }
</style>
