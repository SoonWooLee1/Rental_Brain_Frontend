<template>
  <div class="product-list-page">
    <!-- 상단 타이틀 및 버튼 -->
    <div class="header">
      <div>
        <h1>렌탈 제품 목록</h1>
        <p>전체 제품 현황 및 수익성 관리</p>
      </div>
      <button class="primary-btn" :disabled="!canCreateItem" @click="canCreateItem && openCreateModal()">
        신규 제품 등록
      </button>
    </div>

    <!-- 검색 / 카테고리 / 필터 -->
    <div class="search-area card-box">
      <div class="filter-wrapper">
        <!-- 검색 -->
        <el-input v-model="searchKeyword" placeholder="제품명으로 검색..." class="search-input" @keyup.enter="handleSearch"
          clearable style="width: 500px;">
          <template #prefix>
            <el-icon>
              <Search />
            </el-icon>
          </template>
        </el-input>

        <!-- 카테고리 필터 -->
        <el-select v-model="selectedCategory" placeholder="전체 카테고리" style="width: 180px;"
          @change="handleCategoryFilter">
          <el-option label="전체 카테고리" value="" />
          <el-option v-for="category in categoryOptions" :key="category" :label="category" :value="category" />
        </el-select>

        <!-- 검색 버튼 -->
        <el-button type="primary" @click="handleSearch">검색</el-button>
      </div>

    </div>



    <el-card shadow="never" :body-style="{ padding: '0' }">
      <!-- 자산 목록 테이블 -->
      <el-table :data="itemList" style="width: 100%" v-loading="loading">
        <!-- 제품명 -->
        <el-table-column prop="itemName" label="제품명" min-width="140" />

        <!-- 카테고리 -->
        <el-table-column prop="categoryName" label="카테고리" min-width="120" />

        <!-- 월 렌탈료 -->
        <el-table-column label="월 렌탈료" min-width="120">
          <template #default="{ row }">
            {{ formatToManWon(row.monthlyPrice) }}
          </template>
        </el-table-column>

        <!-- 재고 현황 -->
        <el-table-column label="재고 현황" min-width="180">
          <template #default="{ row }">
            <div class="stock-line">
              <span class="label">총</span>
              <span class="value">{{ row.stockAmount }}개</span>
            </div>
            <div class="stock-line blue">
              <span class="label">렌탈</span>
              <span class="value">{{ row.rentalAmount }}개</span>
              <span class="label">가능</span>
              <span class="value">{{ row.possibleAmount }}개</span>
            </div>
            <div class="stock-line green">
              <span class="label">수리</span>
              <span class="value">{{ row.repairAmount }}개</span>
              <span class="label">연체</span>
              <span class="value">{{ row.overdueAmount }}개</span>
            </div>
          </template>
        </el-table-column>

        <!-- 총 매출 -->
        <el-table-column label="총 매출" min-width="120">
          <template #default="{ row }">
            {{ formatToManWon(row.wholeSales) }}
          </template>
        </el-table-column>

        <!-- 수리비 -->
        <el-table-column label="수리비" min-width="120">
          <template #default="{ row }">
            {{ formatToManWon(row.wholeRepairCost) }}
          </template>
        </el-table-column>

        <!-- 운용률 -->
        <el-table-column label="운용률" min-width="160">
          <template #default="{ row }">
            <div class="usage-cell">
              <div class="usage-bar-bg">
                <div class="usage-bar-fill" :style="{ width: row.utilizationRate + '%' }"></div>
              </div>
              <span class="usage-text">{{ row.utilizationRate }}%</span>
            </div>
          </template>
        </el-table-column>

        <!-- 목록 / 상세보기 -->
        <el-table-column label="목록" width="120" align="center">
          <template #default="{ row }">
            <el-button class="link-btn" link type="primary" size="small" @click="openDetailModal(row)">
              상세보기
            </el-button>
          </template>
        </el-table-column>
      </el-table>


      <!-- 페이지네이션 -->
      <div class="pagination-area">
        <el-pagination layout="prev, pager, next" :total="totalCount" v-model:current-page="page" :page-size="pageSize"
          @current-change="fetchItemList" />
      </div>
    </el-card>

    <!-- 등록 모달 -->
    <ProductCreateModal v-if="isCreateModalOpen" @close="isCreateModalOpen = false" @success="reloadList" />

    <!-- 상세/수정/삭제 모달 -->
    <ProductDetailModal v-if="isDetailModalOpen" :item-name="selectedItemName" :monthly-price="selectedMonthlyPrice"
      :category-name="selectedCategoryName" @close="closeDetailModal" @updated="reloadList" @deleted="reloadList" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import api from '@/api/axios';
import ProductCreateModal from './ProductCreateModal.vue';
import ProductDetailModal from './ProductDetailModal.vue';
import { useAuthStore } from '@/store/auth.store';

const itemList = ref([]);
const searchKeyword = ref('');
const selectedCategory = ref('');

const categoryOptions = ref([]); // 필요 시 백엔드에서 따로 가져오거나 itemList 기반으로 추출

const isCreateModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const selectedItemName = ref('');
const selectedCategoryName = ref('');
const selectedMonthlyPrice = ref(0);

const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(5);

const authStore = useAuthStore();

const canCreateItem = computed(() =>
  authStore.hasAuth('ASSET_WRITE')
)

// 기본 목록 조회
async function fetchItemList() {
  try {
    const res = await api.get('/item/read-groupby-name', {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    console.log('기본 목록 조회 결과:', res.data);
    console.log('기본 목록 조회 결과:', res.data.contents);

    itemList.value = res.data.contents;
    totalCount.value = res.data.totalCount;
    fetchCategory();
  } catch (err) {
    console.error("제품 목록 조회 실패", err);
  }
}

// 검색
async function handleSearch() {
  const keyword = searchKeyword.value.trim();
  if (!keyword) {
    await fetchItemList();
    return;
  }
  try {
    const res = await api.get(`/item/search/${encodeURIComponent(keyword)}`, {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    itemList.value = res.data.contents;
    totalCount.value = res.data.totalCount;
  } catch (err) {
    console.error("제품명 검색 실패", err);
  }
}

// 카테고리 필터
async function handleCategoryFilter() {
  const category = selectedCategory.value;
  if (!category) {
    await fetchItemList();
    return;
  }
  try {
    const res = await api.get(
      `/item/filtering/${encodeURIComponent(category)}`, {
      params: {
        page: page.value,
        size: pageSize.value,
      }
    });
    itemList.value = res.data.contents;
    totalCount.value = res.data.totalCount;
  } catch (err) {
    console.error("카테고리 필터링 실패", err);
  }
}

// 카테고리 조회(// 카테고리 select 옵션 구성)
async function fetchCategory() {
  try {
    const res = await api.get('item/category');
    categoryOptions.value = res.data.map((c) => c.name);
  } catch (err) {
    console.error('카테고리 조회 실패', err);
  }
}

// 숫자 포맷 함수
function formatToManWon(value) {
  if (value == null) return '0';

  const num = Number(value);
  if (isNaN(num)) return '0';

  const man = num / 10000;              // 만원 단위
  const fixed = Number(man.toFixed(1)); // 1자리까지 반올림 후 숫자로 변환

  if (fixed === 0) {
    // 0.0만원 -> 0
    return '0';
  }

  if (Number.isInteger(fixed)) {
    // 26.0만원 -> 26만원
    return fixed.toString() + '만원';
  }

  // 그 외: 26.5만원 등
  return fixed.toString() + '만원';
}

// 모달 open/close
function openCreateModal() {
  isCreateModalOpen.value = true;
}

function openDetailModal(item) {
  // item 객체 안에 있는 필드 이름은 실제 응답에 맞게 사용
  selectedItemName.value = item.itemName;
  selectedMonthlyPrice.value = item.monthlyPrice;
  selectedCategoryName.value = item.categoryName;
  console.log('제품 카테고리:', item.categoryName);
  console.log('제품 월 렌탈료:', item.monthlyPrice);
  console.log('제품명:', item.itemName);
  isDetailModalOpen.value = true;
}

function closeDetailModal() {
  isDetailModalOpen.value = false;
  selectedItemName.value = '';
  selectedMonthlyPrice.value = 0;
  selectedCategoryName.value = '';
}

const changePage = (p) => {
  page.value.current = p
  fetchList()
}

// 목록 리로드 (모달에서 성공 이벤트 발생 시 사용)
async function reloadList() {
  await Promise.all([fetchItemList()]);
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

.primary-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
  opacity: 0.7;
}

.search-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #eee;
}

.filter-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
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

.stock-line+.stock-line {
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

.pagination-area {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>