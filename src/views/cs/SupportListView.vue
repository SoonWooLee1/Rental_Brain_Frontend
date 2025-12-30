<template>
  <div class="page-container" v-loading="loading">
    <div class="header-row">
      <h2 class="page-title">고객 문의 관리</h2>
      <el-button type="primary" class="btn-register" @click="openCreateModal">
        <el-icon><Plus /></el-icon> 신규 문의 등록
      </el-button>
    </div>

    <div class="search-area card-box">
      <div class="filter-wrapper">
        <el-input 
          v-model="search.keyword" 
          placeholder="기업명, 제목, 내용 검색" 
          class="search-input"
          @keyup.enter="handleSearch"
          clearable
          style="width: 300px;"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>

        <el-select 
          v-model="search.category" 
          placeholder="문의 카테고리" 
          style="width: 160px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="가격 문의" :value="1" />
          <el-option label="제품 문의" :value="2" />
          <el-option label="계약 문의" :value="3" />
          <el-option label="기술 지원" :value="4" />
        </el-select>

        <el-select 
          v-model="search.status" 
          placeholder="처리 상태" 
          style="width: 120px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="접수" value="접수" />
          <el-option label="처리중" value="처리중" />
          <el-option label="처리완료" value="처리완료" />
        </el-select>

        <el-button type="primary" class="btn-search" @click="handleSearch">검색</el-button>
      </div>
    </div>

    <div class="list-area card-box">
      <div class="list-header">
        <span class="total-count">총 <strong>{{ page.totalCount }}</strong>건</span>
      </div>

      <el-table 
        :data="supportList" 
        border 
        style="width: 100%" 
        class="table-card"
        @row-click="handleRowClick"
      >
        <el-table-column prop="csId" label="No" width="80" align="center" />
        <el-table-column prop="csType" label="유형" width="120" align="center" />
        <el-table-column prop="csTitle" label="제목" min-width="250">
          <template #default="scope">
            <div class="truncated-text">{{ scope.row.csTitle }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="customerName" label="고객명" width="120" align="center" />
        <el-table-column prop="createdAt" label="접수일" width="150" align="center">
           <template #default="scope">{{ formatDate(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="csStatus" label="상태" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getStatusColor(scope.row.csStatus)">
              {{ scope.row.csStatus }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="page.totalCount"
          :page-size="page.pageSize"
          :current-page="page.currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Plus } from '@element-plus/icons-vue';
import { getSupportList } from '@/api/customersupport';

const router = useRouter();
const loading = ref(false);
const supportList = ref([]);

const search = reactive({
  keyword: '',
  category: '',
  status: ''
});

const page = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: 0
});

const formatDate = (date) => {
    if(!date) return '-';
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

const getStatusColor = (status) => {
  if (status === '처리완료') return 'success';
  if (status === '처리중') return 'warning';
  return 'info';
};

// [수정된 부분] 데이터 조회 로직 (에러 방지)
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.currentPage,
      amount: page.pageSize,
      keyword: search.keyword,
      csType: search.category || null,
      csStatus: search.status || null
    };
    
    const res = await getSupportList(params);
    console.log("문의 리스트 응답:", res.data); // 디버깅용 로그 확인하세요

    if(res.data) {
      // 1. 리스트 데이터 안전하게 가져오기 (필드명이 다를 경우 대비)
      const dataList = res.data.data || res.data.list || res.data.content || [];
      supportList.value = dataList;

      // 2. 페이지 정보 안전하게 가져오기 (pageInfo가 없어도 에러 안 나게 처리)
      const pageInfo = res.data.pageInfo || res.data.pagination || res.data.page;
      if (pageInfo) {
        page.totalCount = pageInfo.totalElements || pageInfo.totalCount || 0;
      } else {
        // 페이지 정보가 없으면 리스트 길이로 대체
        page.totalCount = dataList.length;
      }
    }
  } catch (error) {
    console.error("문의 조회 실패:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  page.currentPage = 1;
  fetchData();
};

const handlePageChange = (val) => {
  page.currentPage = val;
  fetchData();
};

const handleRowClick = (row) => {
  router.push(`/cs/support/${row.csId}`);
};

const openCreateModal = () => {
  console.log('Open Create Modal');
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
.page-container { padding: 20px; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-title { font-size: 24px; font-weight: bold; color: #333; margin: 0; }
.card-box { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05); margin-bottom: 20px; }
.filter-wrapper { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.table-card { border-radius: 8px; cursor: pointer; }
.pagination-wrapper { margin-top: 20px; display: flex; justify-content: center; }
.truncated-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 300px; color: #606266; }
</style>