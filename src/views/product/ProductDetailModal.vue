<template>
  <div class="detail-backdrop" @click.self="emitClose">
    <div class="detail-modal">
      <!-- 헤더 -->
      <div class="detail-header">
        <div>
          <h2>{{ itemName }}</h2>
          <p>{{ categoryName }}</p>
        </div>
        <button class="icon-btn" @click="emitClose">✕</button>
      </div>

      <!-- 상단 KPI 카드 4개 -->
      <!-- <div class="detail-kpi-row">
        <div class="detail-kpi-card blue">
          <p class="label">총 보유</p>
          <p class="value">{{ kpiDetail.totalCount }}개</p>
        </div>
        <div class="detail-kpi-card indigo">
          <p class="label">렌탈 중</p>
          <p class="value">{{ kpiDetail.rentCount }}개</p>
        </div>
        <div class="detail-kpi-card green">
          <p class="label">대여 가능</p>
          <p class="value">{{ kpiDetail.availableCount }}개</p>
        </div>
        <div class="detail-kpi-card orange">
          <p class="label">수리 중</p>
          <p class="value">{{ kpiDetail.repairCount }}개</p>
        </div>
      </div> -->

      <!-- 개별 제품 목록 -->
      <div class="detail-table-wrapper">
        <div class="detail-table-title">개별 제품 목록</div>
        <table class="detail-table">
          <thead>
            <tr>
              <th>제품 ID</th>
              <th>상태</th>
              <th>렌탈 기업</th>
              <th>렌탈 시작일</th>
              <th>최근 점검일</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="unit in unitList" :key="unit.unitId">
              <td>{{ unit.itemCode }}</td>
              <td>
                <span
                  class="status-pill"
                  :class="statusClass(unit.status)"
                >
                  {{ statusText(unit.status) }}
                </span>
              </td>
              <td>{{ unit.firmName || "-" }}</td>
              <td>{{ formatDate(unit.startDate) }}</td>
              <td>{{ formatDate(unit.lastInspectDate) }}</td>
              <td>
                <button
                  class="text-btn"
                  @click="openEditModal(unit)"
                >
                  수정
                </button>
                <button
                  class="text-btn danger"
                  @click="deleteUnit(unit)"
                >
                  삭제
                </button>
              </td>
            </tr>
            <tr v-if="unitList.length === 0">
              <td colspan="6">등록된 개별 제품이 없습니다.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 하단 버튼 영역 -->
      <div class="detail-footer">
        <button class="primary-btn" @click="emitClose">
          확인
        </button>
      </div>

      <!-- 개별 수정 모달 -->
      <ProductUnitEditModal
        v-if="isEditModalOpen"
        :unit="selectedUnit"
        @close="closeEditModal"
        @updated="handleUnitUpdated"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import api from '@/api/axios';
import ProductUnitEditModal from "./ProductUnitEditModal.vue";

const props = defineProps({
  itemName: {
    type: String,
    required: true,
  },
  categoryName: {
    type: String,
    required:true,
  },
});

const STATUS_MAP = {
  S: { text: "렌탈 중", class: "blue" },
  P: { text: "대여 가능", class: "green" },
  R: { text: "점검", class: "orange" },
  O: { text: "연체", class: "red" },
};

const emit = defineEmits(["close", "updated", "deleted"]);

// const kpiDetail = ref({
//   totalCount: 0,
//   rentCount: 0,
//   availableCount: 0,
//   repairCount: 0,
//   categoryName: '',
// });



const unitList = ref([]);

const isEditModalOpen = ref(false);
const selectedUnit = ref(null);

// 상단 카드 데이터
// async function fetchKpiDetail() {
//   try {
//     const res = await api.get(
//       `/item/kpi-detail-count/${props.itemName}`
//     );
//     kpiDetail.value = res.data;
//   } catch (err) {
//     console.error("상세 KPI 조회 실패", err);
//   }
// }

// 개별 제품 목록
async function fetchUnitList() {
  try {
    const res = await api.get(
      `/item/read-all/${encodeURIComponent(props.itemName)}`
    );
    // 응답 구조에 맞게 필드 이름 수정
    unitList.value = res.data;
    console.log('개별제품 조회:', res.data);
  } catch (err) {
    console.error("개별 제품 목록 조회 실패", err);
  }
}

function emitClose() {
  emit("close");
}

function statusText(statusCode) {
  return STATUS_MAP[statusCode]?.text || "알수없음";
}

function statusClass(statusCode) {
  return STATUS_MAP[statusCode]?.class || "gray";
}

// 날짜 포맷 함수
function formatDate(dateTime) {
  if (!dateTime) return "-";
  // ISO 문자열이거나 '2024-11-25 10:20:30' 같은 형식 모두 처리
  if (typeof dateTime === "string") {
    // 공백/타임존을 기준으로 앞부분만 자르기
    return dateTime.split("T")[0].split(" ")[0];
  }
}

// 수정 모달 열기/닫기
function openEditModal(unit) {
  selectedUnit.value = unit;
  isEditModalOpen.value = true;
}

function closeEditModal() {
  isEditModalOpen.value = false;
  selectedUnit.value = null;
}

// 수정 완료 시 목록 재조회
async function handleUnitUpdated() {
  await fetchUnitList();
//   await fetchKpiDetail();
  emit("updated");
}

// 삭제
async function deleteUnit(unit) {
  if (!confirm("해당 개별 제품을 삭제하시겠습니까?")) return;
  try {
    await api.delete(`/item/delete/${unit.unitId}`);
    await fetchUnitList();
    // await fetchKpiDetail();
    emit("deleted");
  } catch (err) {
    console.error("개별 제품 삭제 실패", err);
  }
}

onMounted(async () => {
  // await Promise.all([fetchKpiDetail(), fetchUnitList()]);  kpi api 추가하면 아래줄 지우고 이거 주석풀기
    await Promise.all([fetchUnitList()]);
});

// 혹시 부모에서 itemName이 바뀌는 경우를 대비
watch(
  () => [props.itemName, props.categoryName],
  async () => {
    // await Promise.all([fetchKpiDetail(), fetchUnitList()]);  kpi api 추가하면 아래줄 지우고 이거 주석풀기
    await Promise.all([fetchUnitList()]);
  }
);
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

.detail-header h2 {
  margin: 0;
  font-size: 20px;
}

.detail-header p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6b7280;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

/* .detail-kpi-row {
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

.detail-kpi-card .label {
  font-size: 12px;
  color: #6b7280;
}

.detail-kpi-card .value {
  font-size: 18px;
  font-weight: 600;
  margin-top: 4px;
}

.detail-kpi-card.blue {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.detail-kpi-card.indigo {
  border-color: #c7d2fe;
  background: #e0e7ff;
}

.detail-kpi-card.green {
  border-color: #bbf7d0;
  background: #ecfdf3;
}

.detail-kpi-card.orange {
  border-color: #fed7aa;
  background: #fff7ed;
} */

.detail-table-wrapper {
  padding: 8px 24px 0;
  flex: 1;
  overflow: hidden;
}

.detail-table-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  background: #fff;
}

.detail-table thead {
  background: #f9fafb;
}

.detail-table th,
.detail-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #edf0f7;
  text-align: left;
}

.detail-table tbody {
  display: block;
  max-height: 360px;
  overflow-y: auto;
}

.detail-table thead tr,
.detail-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status-pill.blue {
  background: #eff6ff;
  color: #2563eb;
}

.status-pill.green {
  background: #ecfdf3;
  color: #16a34a;
}

.status-pill.orange {
  background: #fff7ed;
  color: #f97316;
}

.status-pill.red {
  background: #ffeded;
  color: #f91d16f2;
}

.status-pill.gray {
  background: #f3f4f6;
  color: #6b7280;
}

.text-btn {
  border: none;
  background: transparent;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
  margin-right: 6px;
}

.text-btn.danger {
  color: #ef4444;
}

.detail-footer {
  padding: 12px 24px 16px;
  border-top: 1px solid #edf0f7;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.primary-btn {
  background: #248efff2;
  color: #fff;
  border-radius: 8px;
  padding: 8px 18px;
  border: none;
  cursor: pointer;
}
</style>
