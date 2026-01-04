<template>
  <el-dialog :model-value="modelValue" width="85%" destroy-on-close @opened="onDialogOpened" @close="close">
    <!-- 로딩 -->
    <div v-if="loading" class="loading">
      <el-icon class="spin">
        <Loading />
      </el-icon>
      AI 결과 불러오는 중...
    </div>

    <!-- 에러 -->
    <el-alert v-else-if="errorMessage" type="error" :title="errorMessage" show-icon class="mb-12" />

    <!-- 본문 -->
    <div v-else class="content">
      <el-tabs v-model="activeTab" @tab-change="onTabChange">
        <!-- 요약 -->
        <el-tab-pane label="요약" name="summary">
          <div class="section">
            <div class="title-row">
              <h3 class="h3">{{ ai?.summary?.title || '요약' }}</h3>
              <el-tag type="info" v-if="ai?.generatedAt">
                생성: {{ ai.generatedAt }}
              </el-tag>
            </div>

            <el-empty v-if="!ai?.summary?.bullets?.length" description="요약 데이터가 없습니다" />

            <ul v-else class="bullets">
              <li v-for="(b, idx) in ai.summary.bullets" :key="idx">
                {{ b }}
              </li>
            </ul>
          </div>
        </el-tab-pane>

        <!-- 차트 -->
        <el-tab-pane :label="`차트 (${ai?.charts?.length || 0})`" name="charts">
          <el-empty v-if="!ai?.charts?.length" description="차트 데이터가 없습니다" />

          <div v-else class="charts">
            <el-card v-for="chart in ai.charts" :key="chart.id" shadow="never" class="chart-card">
              <div class="chart-head">
                <div>
                  <div class="chart-title">{{ chart.title }}</div>
                  <div class="chart-desc" v-if="chart?.options?.description">
                    {{ chart.options.description }}
                  </div>
                </div>
                <el-tag type="success">{{ chart.type }}</el-tag>
              </div>

              <!-- ECharts -->
              <v-chart class="echart" :option="toEChartOption(chart)" autoresize />

              <div class="chart-foot" v-if="chart?.options?.unit">
                단위: {{ chart.options.unit }}
              </div>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- 추천 -->
        <el-tab-pane :label="`추천 (${promotionList.length + couponList.length})`" name="reco">
          <el-empty 
            v-if="!promotionList.length && !couponList.length" 
            description="추천 데이터가 없습니다" 
          />

          <div v-else class="reco">
            <!-- 🎯 프로모션 섹션 -->
            <div v-if="promotionList.length" class="recommend-section">
              <div class="section-title">추천 프로모션</div>
              <el-card 
                v-for="p in promotionList" 
                :key="p.id" 
                shadow="never" 
                class="reco-card"
              >
                <div class="reco-title">{{ p.name }}</div>
                <div class="reco-desc">{{ p.content || '내용 없음' }}</div>
                <div class="reco-segment">
                  <el-tag type="warning">프로모션</el-tag>
                  <el-tag type="success"
                  :style="{ marginLeft: '8px' }">{{ p.segmentName }}</el-tag>
                </div>
                <div class="reco-actions">
                  <el-button 
                    type="primary"
                    @click="goToPromotion(p.id)"
                    class="move-btn"
                    :disabled="p.isUsed === 'Y'"
                  >
                    프로모션 생성
                  </el-button>
                </div>
              </el-card>
            </div>

            <!-- 🎯 쿠폰 섹션 -->
            <div v-if="couponList.length" class="recommend-section">
              <div class="section-title">추천 쿠폰</div>
              <el-card 
                v-for="c in couponList" 
                :key="c.id" 
                shadow="never" 
                class="reco-card"
              >
                <div class="reco-title">{{ c.name }}</div>
                <div class="reco-desc">
                  {{ c.content || '내용 없음' }}
                </div>
                <div class="reco-segment">
                  <el-tag type="warning">쿠폰</el-tag>
                  <el-tag type="success"
                  :style="{ marginLeft: '8px' }">{{ c.segmentName }}</el-tag>
                  <el-tag 
                    v-if="c.rate" 
                    type="danger" 
                    class="discount-tag"
                    :style="{ marginLeft: '8px' }"
                  >
                    {{ c.rate }}% 할인
                  </el-tag>
                </div>
                <div class="reco-actions">
                  <el-button 
                    type="primary"
                    @click="goToCoupon(c.id)"
                    class="move-btn"
                    :disabled="c.isUsed === 'Y'"
                  >
                    쿠폰 생성
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>


        <!-- 원본 JSON -->
        <el-tab-pane label="원본 JSON" name="raw">
          <el-input type="textarea" :rows="18" :model-value="rawJson" readonly />
        </el-tab-pane>
      </el-tabs>
    </div>

    <template #footer>
      <el-button @click="close">닫기</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Loading } from '@element-plus/icons-vue'
import api from '@/api/axios'
import { useRouter } from 'vue-router'

const router = useRouter()

/* =========================
   ECharts 설정
========================= */
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'

echarts.use([
  CanvasRenderer,
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

/* =========================
   Props / Emits
========================= */
const props = defineProps({
  surveyId: { type: Number, required: true },
  modelValue: { type: Boolean, required: true }
})

const emit = defineEmits(['update:modelValue'])

/* =========================
   State
========================= */
const loading = ref(false)
const errorMessage = ref('')
const ai = ref(null)

const activeTab = ref('summary')

// 🔑 핵심 상태 플래그
const dialogOpened = ref(false)
const dataReady = ref(false)

/* =========================
   Dialog lifecycle
========================= */
function onDialogOpened() {
  dialogOpened.value = true;
  nextTick(() => {
    if (activeTab.value === 'charts') {
      resizeCharts()
    }
  })
}

function onTabChange(tabName) {
  if (tabName === 'charts') {
    nextTick(() => {
      resizeCharts()
    })
  }
}

function resizeCharts() {
  const charts = document.querySelectorAll('.echart')
  charts.forEach(el => {
    if (el.__echarts__) {
      el.__echarts__.resize()
    }
  })
}


watch(
  () => [props.modelValue, props.surveyId],
  ([open, id]) => {
    if (open && id) {
      fetchAiResponse(),
      initRecommendData()
    }
  }
)

/* =========================
   API
========================= */
async function fetchAiResponse() {
  loading.value = true
  errorMessage.value = ''
  ai.value = null
  dataReady.value = false
  activeTab.value = 'summary'

  try {
    const res = await api.get(`/survey/list/${props.surveyId}`)
    const payload = res.data?.aiResponse

    if (!payload) {
      errorMessage.value = 'AI 결과가 비어 있습니다.'
      return
    }

    if (typeof payload === 'object') {
      ai.value = payload
    } else if (typeof payload === 'string') {
      ai.value = JSON.parse(payload)
    } else {
      errorMessage.value = 'AI 결과 타입을 처리할 수 없습니다.'
      return
    }

    dataReady.value = true
    tryRenderCharts()
  } catch (e) {
    errorMessage.value = 'AI 결과를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

/* =========================
   Chart render sync
========================= */
function tryRenderCharts() {
  if (!dialogOpened.value || !dataReady.value) return

  nextTick(() => {
    resizeCharts()
  })
}

/* =========================
   Utils
========================= */
const rawJson = computed(() =>
  ai.value ? JSON.stringify(ai.value, null, 2) : ''
)

function close() {
  emit('update:modelValue', false)
}

/* =========================
   JSON → ECharts Option
========================= */
function toEChartOption(chart) {
  const labels = chart?.data?.labels ?? []
  const datasets = chart?.data?.datasets ?? []
  const first = datasets[0] ?? { label: '', values: [] }
  const indexAxis = chart?.options?.indexAxis ?? 'x'

  // pie / doughnut
  if (chart.type === 'pie' || chart.type === 'doughnut') {
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [
        {
          type: 'pie',
          radius: chart.type === 'doughnut' ? ['40%', '70%'] : '70%',
          data: labels.map((name, i) => ({
            name,
            value: first.values?.[i] ?? 0
          }))
        }
      ]
    }
  }

  const isHorizontal = indexAxis === 'y'

  return {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0 },
    grid: {
      left: 24,
      right: 24,
      top: 20,
      bottom: 60,
      containLabel: true
    },
    xAxis: isHorizontal
      ? { type: 'value', name: chart?.options?.unit || '' }
      : { type: 'category', data: labels },
    yAxis: isHorizontal
      ? { type: 'category', data: labels }
      : { type: 'value', name: chart?.options?.unit || '' },
    series: datasets.map(ds => ({
      name: ds.label,
      type: chart.type === 'line' ? 'line' : 'bar',
      data: ds.values
    }))
  }
}
const promotionList = ref([]);
const couponList = ref([]);

const fetchRecommendPromotionList = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/recommend/promotion/all-read/${props.surveyId}`);
    promotionList.value = res.data || [];
  } catch (e) {
    ElMessage.error('추천 프로모션 목록을 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};
const fetchRecommendCouponList = async () => {
  loading.value = true;
  try {
    const res = await api.get(`/recommend/coupon/all-read/${props.surveyId}`);
    couponList.value = res.data || [];
  } catch (e) {
    ElMessage.error('추천 프로모션 목록을 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const initRecommendData = async () => {
  await Promise.all([
    fetchRecommendPromotionList(),
    fetchRecommendCouponList()
  ])
}

const goToPromotion = (promotionId) => {
  router.push({
    name: 'promotion-list',
    query: { recommendId: promotionId }
  })
}

const goToCoupon = (couponId) => {
  router.push({
    name: 'coupon-list',
    query: { recommendId: couponId }
  })
}
</script>

<style scoped>

.reco-title {
  font-size: 16px;
  font-weight: 500;
  color: #1f2329;
  margin-bottom: 8px;
  line-height: 1.4;
}
  
.reco-desc {
  color: #636e72;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}
.move-btn {
    padding: 6px 16px;
    border-radius: 6px;
    display: flex;
    margin-left: auto;
}
  
.mb-12 {
  margin-bottom: 12px;
}

.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  font-size: 14px;
  color: #409eff;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

.content {
  padding-top: 8px;
}

.section {
  padding: 8px 4px;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.h3 {
  margin: 0;
  font-size: 18px;
}

.bullets {
  margin: 0;
  padding-left: 18px;
  line-height: 1.7;
}

.charts {
  display: grid;
  gap: 12px;
}

.chart-card {
  border-radius: 10px;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 8px;
}

.chart-title {
  font-weight: 700;
  font-size: 15px;
}

.chart-desc {
  color: #6b7280;
  font-size: 13px;
  margin-top: 4px;
}

.echart {
  width: 100%;
  height: 340px;
}

.chart-foot {
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
}

.reco {
  display: grid;
  gap: 12px;
}

.reco-title {
  font-weight: 700;
  margin-bottom: 6px;
}

.reco-desc {
  color: #374151;
  line-height: 1.6;
}

.reco-tags {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  border-radius: 999px;
}
</style>
