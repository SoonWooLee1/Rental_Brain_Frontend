<template>
    <div class="product-list-page">
    <!-- 상단 타이틀 및 버튼 -->
    <div class="header">
      <div>
        <h1>렌탈 자산 목록</h1>
        <p>전체 자산 현황 및 수익성 관리</p>
      </div>
      <button class="primary-btn" @click="openCreateModal">
        신규 자산 등록
      </button>
    </div>

    <!-- KPI 카드 3개 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <p class="label">총 자산</p>
        <p class="value">{{ kpi.wholeCount }}개</p>
        <p class="sub">오피스 관련 제품</p>
      </div>
      <div class="kpi-card">
        <p class="label">렌탈 중</p>
        <p class="value">{{ kpi.rentalCount }}개</p>
      </div>
      <div class="kpi-card">
        <p class="label">수리/점검 중</p>
        <p class="value">{{ kpi.repairCount }}개</p>
        <p class="sub">AS 처리 중</p>
      </div>
    </div>

    <!-- 검색 / 카테고리 / 필터 -->
    <div class="toolbar">
      <div class="search-box">
    <span class="search-icon">🔍</span>
      <input
        v-model="searchKeyword"
        @keyup.enter="handleSearch"
        type="text"
        placeholder="제품명으로 검색..."
      />
      </div>

      <select v-model="selectedCategory" @change="handleCategoryFilter">
        <option value="">전체 카테고리</option>
        <option
          v-for="category in categoryOptions"
          :key="category"
          :value="category"
        >
          {{ category }}
        </option>
      </select>

      <!-- 필요하면 추가 필터 버튼들 -->
    </div>


    <!-- 자산 목록 테이블 -->
    <table class="asset-table">
      <thead>
        <tr>
          <th>자산명</th>
          <th>카테고리</th>
          <th>월 렌탈료</th>
          <th>재고 현황</th>
          <th>총 매출</th>
          <th>수리비</th>
          <th>운용률</th>
          <th>목록</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in itemList" :key="item.itemName">
          <td>{{ item.itemName }}</td>
          <td>{{ item.categoryName }}</td>
          <td>{{ item.monthlyPrice }}원</td>
          <td>
            <div class="stock-line">
              <span class="label">총</span>
              <span class="value">{{ item.stockAmount }}개</span>
            </div>
            <div class="stock-line blue">
              <span class="label">렌탈</span>
              <span class="value">{{ item.rentalAmount }}개</span>
              <span class="label">가능</span>
              <span class="value">{{ item.possibleAmount }}개</span>
            </div>
            <div class="stock-line green">
              <span class="label">수리</span>
              <span class="value">{{ item.repairAmount }}개</span>
              <span class="label">연체</span>
              <span class="value">{{ item.overdueAmount }}개</span>
            </div>
          </td>
          <td>{{ item.wholeSales }}</td>
          <td>{{ item.wholeRepairCost }}</td>
          <!-- 운용률 -->
          <td>
            <div class="usage-cell">
              <div class="usage-bar-bg">
                <div
                  class="usage-bar-fill"
                  :style="{ width: item.utilizationRate + '%' }"
                ></div>
              </div>
              <span class="usage-text">{{ item.utilizationRate }}%</span>
            </div>
          </td>
          <td>
            <button class="link-btn" @click="openDetailModal(item)">
              상세보기
            </button>
          </td>
        </tr>
        <tr v-if="itemList.length === 0">
          <td colspan="9">조회된 자산이 없습니다.</td>
        </tr>
      </tbody>
    </table>

    <!-- 등록 모달 -->
    <ProductCreateModal
      v-if="isCreateModalOpen"
      @close="isCreateModalOpen = false"
      @success="reloadList"
    />

    <!-- 상세/수정/삭제 모달 -->
    <ProductDetailModal
      v-if="isDetailModalOpen"
      :item-name="selectedItemName"
      :item-categoryName="selectedCategoryName"
      @close="closeDetailModal"
      @updated="reloadList"
      @deleted="reloadList"
    />
  </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import api from '@/api/axios';
    import ProductCreateModal from './ProductCreateModal.vue';
import ProductDetailModal from './ProductDetailModal.vue';

const kpi = ref({
  totalCount: 0,
  rentalCount: 0,
  repairCount: 0,
});

const itemList = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('');

const categoryOptions = ref([]); // 필요 시 백엔드에서 따로 가져오거나 itemList 기반으로 추출

const isCreateModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const selectedItemName = ref('');
const selectedCategoryName = ref('');

// 1. KPI 조회
async function fetchKpi() {
  try {
    const res = await api.get('/item/kpi-count');
    kpi.value.wholeCount = res.data.wholeCount;
    kpi.value.rentalCount = res.data.rentalCount;
    kpi.value.repairCount = res.data.repairCount;
  } catch (err) {
    console.error("KPI 조회 실패", err);
  }
}

// 2. 기본 목록 조회
async function fetchItemList() {
  try {
    const res = await api.get('/item/read-groupby-name');
    console.log('기본 목록 조회 결과:', res.data);
    console.log('기본 목록 조회 결과:', res.data.contents);
    
    itemList.value = res.data.contents;
    buildCategoryOptions();
  } catch (err) {
    console.error("제품 목록 조회 실패", err);
  }
}

// 3. 검색
async function handleSearch() {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    await fetchItemList();
    return;
  }
  try {
    const res = await api.get(`/item/search/${encodeURIComponent(keyword)}`);
    itemList.value = res.data.contents;
  } catch (err) {
    console.error("제품명 검색 실패", err);
  }
}

// 4. 카테고리 필터
async function handleCategoryFilter() {
  const category = selectedCategory.value;
  if (!category) {
    await fetchItemList();
    return;
  }
  try {
    const res = await api.get(
      `/item/filtering/${encodeURIComponent(category)}`
    );
    itemList.value = res.data.contents;
  } catch (err) {
    console.error("카테고리 필터링 실패", err);
  }
}

// 5. 카테고리 조회
async function fetchCategory() {
  try {
    const res = await api.get('item/category');
    categoryOptions.value = res.data;
  } catch (err) {
    console.error('카테고리 조회 실패', err);
  }
}

// 카테고리 select 옵션 구성
function buildCategoryOptions() {
  const set = new Set();
  itemList.value.forEach((item) => set.add(item.categoryName));
  categoryOptions.value = Array.from(set);
}

// 모달 open/close
function openCreateModal() {
  isCreateModalOpen.value = true;
}

function openDetailModal(item) {
  // item 객체 안에 있는 필드 이름은 실제 응답에 맞게 사용
  selectedItemName.value = item.itemName;
  selectedCategoryName.value = item.categoryName;
  console.log('제품 카테고리:', item.categoryName);
  console.log('제품명:', item.itemName);
  isDetailModalOpen.value = true;
}

function closeDetailModal() {
  isDetailModalOpen.value = false;
  selectedItemName.value = '';
  selectedCategoryName.value = item.categoryName;
}

// 목록 리로드 (모달에서 성공 이벤트 발생 시 사용)
async function reloadList() {
  await Promise.all([fetchKpi(), fetchItemList()]);
}

onMounted(async () => {
  await reloadList();
});
</script>

<style scoped>
.product-list-page {
  padding: 24px;
  background: #f5f7fb;
  color: #222;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.kpi-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.kpi-card .label {
  font-size: 14px;
  color: #888;
}

.kpi-card .value {
  font-size: 24px;
  font-weight: 600;
  margin: 4px 0;
}

.kpi-card .sub {
  font-size: 12px;
  color: #999;
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  align-items: center;
}

.search-box {
  flex: 1;
  display: flex;
  align-items: center;
  background: #f5f7fb;
  border-radius: 999px;
  padding: 0 16px;
  border: 1px solid #e0e4f0;
}

.search-box input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 10px 8px;
  font-size: 14px;
}

.search-icon {
  font-size: 14px;
  color: #a0a5b8;
}

.toolbar select {
  height: 40px;
  border-radius: 999px;
  border: 1px solid #e0e4f0;
  padding: 0 12px;
  background: #fff;
  font-size: 14px;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.asset-table th,
.asset-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
  text-align: left;
  font-size: 14px;
}

.asset-table thead {
  background: #fafafa;
}

/* 제품 현황 */
.stock-line {
  display: flex;
  gap: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.stock-line + .stock-line {
  margin-top: 2px;
}

.stock-line .label {
  color: #8a8fa2;
}

.stock-line .value {
  font-weight: 500;
}

.stock-line.blue .value {
  color: #2563eb;
}

.stock-line.green .value {
  color: #16a34a;
}

.stock-line.blue {
  font-size: 12px;
}

.stock-line.green {
  font-size: 12px;
}

/* 운용률 바 */
.usage-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.usage-bar-bg {
  position: relative;
  width: 50px;
  height: 5px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.usage-bar-fill {
  height: 100%;
  border-radius: 999px;
  background: #16a34a;
  transition: width 0.3s ease;
}

.usage-text {
  font-size: 12px;
  color: #374151;
}

.primary-btn {
  background: #248efff2;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
}

.link-btn {
  background: none;
  border: none;
  color: #248efff2;
  cursor: pointer;
}
</style>