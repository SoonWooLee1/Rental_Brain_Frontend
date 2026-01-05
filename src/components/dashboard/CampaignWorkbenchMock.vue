<template>
  <div class="wb-card">
    <!-- Header -->
    <div class="wb-head">
      <div class="wb-title">프로모션 워크벤치</div>
    </div>

    <!-- List -->
    <div class="wb-list">
      <!-- Row 1 (HIGH) -->
      <div class="wb-row">
        <div class="wb-left">
          <span class="dot dot-high" aria-hidden="true"></span>

          <div class="wb-text">
            <div v-if="promotion">
              <div class="wb-main">{{ promotion.name }}</div>
              <div class="wb-sub">대상: {{ promotion.segmentName }}</div>
            </div>

            <el-empty v-else description="추천 프로모션이 없습니다" />

          </div>
        </div>

        <button
          v-if="promotion"
          class="wb-btn wb-btn--primary"
          type="button"
          @click.stop="go('PROMOTION_CREATE')"
        >
          프로모션 생성
        </button>
      </div>

      <div class="wb-divider"></div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ref, onMounted } from "vue";
import { ElMessage } from 'element-plus';
import api from '@/api/axios';

const router = useRouter();
const loading = ref(false);
const promotion = ref(null);

const fetchPromotionList = async () => {
  loading.value = true;
  try {
    const res = await api.get('/recommend/promotion/read-one');
    promotion.value = res.data;
  } catch (e) {
    ElMessage.error('추천 프로모션 목록을 불러오지 못했습니다.');
    console.error(e);
  } finally {
    loading.value = false;
  }
};


onMounted(() => {
  fetchPromotionList()
});

/**
 * 캠페인 관련 라우팅 맵
 * 👉 실제 프로젝트의 router name에 맞게 name만 조정하면 됨
 */
const routeMap = {
  PROMOTION_CREATE: { name: "promotion-list" }, // 프로모션 생성
};

const go = (key) => {
  const target = routeMap[key];
  if (!target) return;
  router.push(target);
};
</script>

<style scoped>
.wb-card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 12px;
  height: 48%;
  width: 100%;
  padding: 16px 16px 14px;
  margin-bottom: 12px;
}

/* Header */
.wb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.wb-title {
  font-size: 14px;
  font-weight: 800;
  color: #111827;
  letter-spacing: -0.2px;
}

/* List */
.wb-list {
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.wb-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 30px;
  padding: 20px 20px;
}

.wb-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.wb-text {
  min-width: 0;
}

.wb-main {
  font-size: 13px;
  font-weight: 750;
  color: #111827;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wb-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.wb-meta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(17, 24, 39, 0.55);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dot */
.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  margin-top: 3px;
  flex: 0 0 auto;
}

.dot-high { background: #ef4444; }
.dot-mid  { background: #6366f1; }
.dot-low  { background: #9ca3af; }

/* Buttons */
.wb-btn {
  font-size: 12px;
  font-weight: 750;
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #111827;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 120ms ease, opacity 120ms ease;
}

.wb-btn:hover { opacity: 0.92; }
.wb-btn:active { transform: translateY(1px); }

.wb-btn--primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

/* Footer */
.wb-foot {
  margin-top: 10px;
  text-align: center;
}

.wb-link {
  font-size: 12px;
  color: #2563eb;
  cursor: pointer;
}

.wb-link:hover { text-decoration: underline; }

/* Responsive */
@media (max-width: 700px) {
  .wb-row {
    align-items: flex-start;
    flex-direction: column;
  }

  .wb-btn {
    width: 100%;
  }

  .wb-main,
  .wb-sub,
  .wb-meta {
    white-space: normal;
  }
}
</style>
