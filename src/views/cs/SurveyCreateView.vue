<template>
    <div class="page">
        <el-card shadow="never" class="card">
            <h2>설문조사 등록</h2>

            <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
                <!-- 설문명 -->
                <el-form-item label="설문 제목" prop="name">
                    <el-input v-model="form.name" />
                </el-form-item>

                <!-- 기간 -->
                <el-form-item label="설문 기간" required>
                    <el-date-picker v-model="period" type="daterange" format="YYYY-MM-DD" value-format="YYYY-MM-DD"
                        start-placeholder="시작일" end-placeholder="종료일" />
                </el-form-item>

                <!-- 카테고리 -->
                <el-form-item label="카테고리" prop="categoryId">
                    <el-select v-model="form.categoryId">
                        <el-option label="만족도 설문" value="1" />
                        <el-option label="확장 니즈 설문" value="2" />
                        <el-option label="이탈/재계약 설문" value="3" />
                    </el-select>
                </el-form-item>

                <!-- CSV -->
                <el-form-item label="설문 문항 CSV" prop="file">
                    <el-upload drag accept=".csv" :auto-upload="false" :on-change="onFileChange">
                        <el-icon>
                            <Upload />
                        </el-icon>
                        <div class="el-upload__text">
                            CSV 파일 업로드
                        </div>
                    </el-upload>
                </el-form-item>

                <!-- 버튼 -->
                <div class="actions">
                    <el-button @click="goBack">취소</el-button>
                    <el-button type="primary" @click="submit">
                        설문 등록
                    </el-button>
                </div>
            </el-form>
        </el-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElLoading } from 'element-plus'
import axios from 'axios'
import { Upload } from '@element-plus/icons-vue'
import api from '@/api/axios'

const router = useRouter()
const formRef = ref()

const period = ref([])

const form = ref({
    name: '',
    link: '',
    status: '설문 등록',
    startDate: '',
    endDate: '',
    aiResponse: null,
    categoryId: '',
    file: null
})

const rules = {
    name: [{ required: true, message: '설문명을 입력해주세요', trigger: 'blur' }],
    categoryId: [{ required: true, message: '카테고리를 선택해주세요', trigger: 'change' }],
    file: [{ required: true, message: 'CSV 파일을 업로드해주세요', trigger: 'change' }]
}

const onFileChange = (file) => {
    form.value.file = file.raw
}

const submit = async () => {
    formRef.value.validate(async (valid) => {
        if (!valid || period.value.length !== 2) {
            ElMessage.warning('설문 기간을 선택해주세요')
            return
        }

        const loading = ElLoading.service({
            lock: true,
            text: 'AI가 설문조사 결과를 분석하는 중입니다...',
            background: 'rgba(0,0,0,0.4)'
        })

        try {
            /** 1️⃣ CSV → AI 분석 */
            const csvForm = new FormData()
            csvForm.append('file', form.value.file)

            const analysisRes = await api.post(
                '/survey/csv/analysis',
                csvForm,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )

            // 서버가 내려주는 값 기준
            form.value.link = "https://docs.google.com/forms/u/0/";
            form.value.aiResponse = JSON.stringify(analysisRes.data)
            console.log(form.value.aiResponse);

            /** 2️⃣ 설문 생성 JSON */
            const res = await api.post('/survey/start', {
                name: form.value.name,
                link: form.value.link,
                status: form.value.status,
                startDate: period.value[0],
                endDate: period.value[1],
                aiResponse: form.value.aiResponse,
                categoryId: form.value.categoryId
            })

            const surveyId = res.data.surveyId;
            const recs = analysisRes.data.recommendations || [];

            const promotionPayloads = recs
            .filter(r => r.rate === undefined || r.rate === null)   // rate 없음 → 프로모션
            .map(r => ({
                name: r.name,
                content: r.content,
                segmentName: r.segmentName,
                surveyId,
            }))

            const couponPayloads = recs
            .filter(r => r.rate !== undefined && r.rate !== null)   // rate 있음 → 쿠폰
            .map(r => ({
                name: r.name,
                rate: r.rate,
                content: r.content,
                segmentName: r.segmentName,
                surveyId,
            }))

            await Promise.all([
            ...promotionPayloads.map(p =>
                api.post('/recommend/promotion/insert', p)
            ),
            ...couponPayloads.map(c =>
                api.post('/recommend/coupon/insert', c)
            ),
            ])

            ElMessage.success('설문이 등록되었습니다')
            router.push('/cs/survey')
        } catch (e) {
            console.error(e)
            ElMessage.error('설문 등록 실패')
        } finally {
            loading.close()
        }
    })
}

const goBack = () => router.back()
</script>

<style scoped>
.page {
    max-width: 760px;
    margin: 40px auto;
    padding: 0 16px;
}

.card {
    padding: 24px;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 24px;
}
</style>
