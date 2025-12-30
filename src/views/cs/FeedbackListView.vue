<template>
  <div class="page-container" v-loading="loading">
    <div class="header-row">
      <h2 class="page-title">피드백 관리</h2>
      <el-button type="primary" class="btn-register" @click="openCreateModal">
        <el-icon><Plus /></el-icon> 신규 피드백 등록
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
          placeholder="카테고리" 
          style="width: 140px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="서비스 만족" :value="5" />
          <el-option label="제품 불량" :value="6" />
          <el-option label="제품 품질" :value="7" />
          <el-option label="AS 관련" :value="8" />
        </el-select>

        <el-select 
          v-model="search.status" 
          placeholder="상태" 
          style="width: 120px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="미답변" value="미답변" />
          <el-option label="답변완료" value="답변완료" />
        </el-select>

        <el-select 
          v-model="search.star" 
          placeholder="평점" 
          style="width: 120px;"
          clearable
          @change="handleSearch"
        >
          <el-option label="5점" value="5" />
          <el-option label="4점" value="4" />
          <el-option label="3점" value="3" />
          <el-option label="2점" value="2" />
          <el-option label="1점" value="1" />
        </el-select>

        <el-button type="primary" class="btn-search" @click="handleSearch">검색</el-button>
      </div>
    </div>

    <div class="list-area card-box">
      <div class="list-header">
        <span class="total-count">총 <strong>{{ page.totalCount }}</strong>건</span>
      </div>

      <el-table 
        :data="feedbackList" 
        border 
        style="width: 100%" 
        class="table-card"
        @row-click="handleRowClick" 
        v-loading="loading"
      >
        <el-table-column prop="feedbackId" label="No" width="80" align="center" />
        <el-table-column prop="category" label="카테고리" width="120" align="center">
          <template #default="scope">
            <el-tag>{{ getCategoryName(scope.row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="feedbackContent" label="내용" min-width="300">
          <template #default="scope">
            <div class="truncated-text">{{ scope.row.feedbackContent }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="star" label="평점" width="150" align="center">
          <template #default="scope">
            <el-rate v-model="scope.row.star" disabled text-color="#ff9900" />
          </template>
        </el-table-column>
        <el-table-column prop="authorName" label="작성자" width="120" align="center" />
        <el-table-column prop="createdAt" label="작성일" width="150" align="center">
          <template #default="scope">{{ formatDate(scope.row.createdAt) }}</template>
        </el-table-column>
        <el-table-column prop="status" label="상태" width="100" align="center">
          <template #default="scope">
            <el-tag :type="scope.row.status === '답변완료' ? 'success' : 'warning'">
              {{ scope.row.status || '미답변' }}
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
import { getFeedbackList } from '@/api/feedback';

const router = useRouter();
const loading = ref(false);
const feedbackList = ref([]);

const search = reactive({
  keyword: '',
  category: '',
  status: '', 
  star: ''
});

const page = reactive({
  currentPage: 1,
  pageSize: 10,
  totalCount: 0
});

const categoryMap = { 5: '서비스 만족', 6: '제품 불량', 7: '제품 품질', 8: 'AS 관련' };
const getCategoryName = (code) => categoryMap[code] || '기타';

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

// [수정된 부분] 데이터 조회 로직 강화
const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.currentPage,
      amount: page.pageSize, 
      keyword: search.keyword,
      category: search.category || null,
      status: search.status || null,
      star: (search.star && !isNaN(Number(search.star))) ? Number(search.star) : null,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };

    const res = await getFeedbackList(params);
    console.log("피드백 리스트 응답:", res.data); // 디버깅용

    if (res.data) {
      // 1. 리스트 데이터 찾기 (data, list, content 등)
      const dataList = res.data.data || res.data.list || res.data.content || [];
      feedbackList.value = dataList;

      // 2. 페이지 정보 찾기 (pageInfo가 없을 경우 대비)
      const pageInfo = res.data.pageInfo || res.data.pagination || res.data.page;
      if (pageInfo) {
        page.totalCount = pageInfo.totalElements || pageInfo.totalCount || 0;
      } else {
        page.totalCount = dataList.length;
      }
    }
  } catch (error) {
    console.error("데이터 로드 실패:", error);
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
  router.push(`/cs/feedback/${row.feedbackId}`);
};

const openCreateModal = () => {
  console.log("신규 등록");
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
.truncated-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 400px; color: #606266; }
</style>