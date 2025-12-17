<template>
  <div class="sidebar">

    <!-- 로고 영역 -->
    <div class="logo">
      <h1>Rental Brain</h1>
      <p>CRM · ERP Platform</p>
    </div>

    <!-- 사용자 정보 -->
    <div class="user-section">
      <el-avatar size="large" src="https://via.placeholder.com/80" />
      <div class="user-info">
        <span class="name">DevOops</span>
        <span class="role">시스템 관리자</span>
            <button type="button" @click.stop="logout">
          로그아웃
        </button>
      </div>

      <!-- 알림 -->
      <el-popover
        placement="right-start"
        width="260"
        trigger="click"
      >
        <template #reference>
          <div class="alert-icon">
            <el-badge :value="unreadCount" class="badge-dot">
              <el-icon><Bell /></el-icon>
            </el-badge>
          </div>
        </template>

        <!-- 알림 목록 -->
        <div class="noti-list">

          <div
            v-for="item in notifications"
            :key="item.id"
            class="noti-item"
            @click="goToNotificationCenter"
          >
            <div class="noti-title">{{ item.title }}</div>
            <div class="noti-time">{{ item.time }}</div>
          </div>

          <!-- 더보기 -->
          <div class="noti-more" @click="goToNotificationCenter">
            전체 알림 보기 →
          </div>

        </div>
      </el-popover>

    </div>

    <!-- 메뉴 시작 -->
    <el-menu
      class="menu"
      :default-active="$route.path"
      router
      background-color="transparent"
      text-color="#333"
      active-text-color="#4F46E5"
    >
      <!-- 대시보드 -->
      <el-menu-item index="/">
        <el-icon><Grid /></el-icon>
        <span>대시보드</span>
      </el-menu-item>

      <!-- 고객 -->
      <el-sub-menu index="customer">
        <template #title>
          <el-icon><UserFilled /></el-icon>
          <span>고객 관리</span>
        </template>

        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          고객 목록
        </el-menu-item>

        <el-sub-menu index="cs">
          <template #title>
            <el-icon><ChatDotRound /></el-icon>
            <span>고객 응대</span>
          </template>
          
          <el-menu-item index="/cs/supports">
            <el-icon><QuestionFilled /></el-icon> 문의 관리
          </el-menu-item>
          
          <el-menu-item index="/cs/feedbacks">
            <el-icon><Star /></el-icon> 피드백 관리
          </el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/analysis/overview">
          <el-icon><TrendCharts /></el-icon>
          고객 분석
        </el-menu-item>

        <el-menu-item index="/customer/risk">
          <el-icon><WarningFilled /></el-icon>
          연체 관리
          
        </el-menu-item>
      </el-sub-menu>

      <!-- 영업관리 (견적/계약/캠페인) -->
      <el-sub-menu index="business">
        <template #title>
          <el-icon><Briefcase /></el-icon>
          <span>영업 관리</span>
        </template>

        <el-menu-item index="/quotes">
          <el-icon><Document /></el-icon>
          견적(상담)
        </el-menu-item>

        <el-menu-item index="/contracts">
          <el-icon><Notebook /></el-icon>
          계약(결재)
        </el-menu-item>

        <el-menu-item index="/campaign/promotions">
          <el-icon><Promotion /></el-icon>
          캠페인
        </el-menu-item>
      </el-sub-menu>

      <!-- 자산운영 -->
      <el-sub-menu index="product">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>제품 관리</span>
        </template>

        <el-menu-item index="/assets">
          <el-icon><Setting /></el-icon>
          제품 목록
        </el-menu-item>

        <el-menu-item index="/as">
          <el-icon><Tools /></el-icon>
          AS / 정기점검
        </el-menu-item>
      </el-sub-menu>

      <!-- 결재관리 -->
      <el-menu-item index="/approvals">
        <el-icon><Notebook /></el-icon>
        전자 결재
      </el-menu-item>

      <!-- 시스템메뉴 -->
      <el-menu-item index="/admin/menus">
        <el-icon><Setting /></el-icon>
        관리자 메뉴
      </el-menu-item>

    </el-menu>

  </div>
</template>

<script setup>
import api from "@/api/axios";
import { useAuthStore } from "@/store/auth.store";
import { useToastStore } from "@/store/useToast";
import {
  Bell,
  Grid,
  User,
  UserFilled,
  ChatDotRound,
  TrendCharts,
  WarningFilled,
  Briefcase,
  Document,
  Notebook,
  Promotion,
  Box,
  Setting,
  Tools,
  CreditCard,
  QuestionFilled, // 문의 관리 아이콘
  Star            // 피드백 관리 아이콘
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const toastStore = useToastStore();
const router = useRouter();

const logout = async ()=>{
  console.log('empId:',authStore.empId);
  authStore.logout();
  try{
    const response = await api.post('/emp/logout',{
      empId:authStore.empId
    })
    console.log(response.data);
  }catch(e){
    console.log('로그아웃 통신 fail');
  }
  console.log('empId:',authStore.empId);
  toastStore.showToast('로그아웃' + authStore.empId);
  router.push('/login');
}

</script>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;
  background: #fff;
  border-right: 1px solid #eee;
  padding: 20px;
}

/* 로고 */
.logo h1 {
  font-size: 22px;
  margin: 0;
  color: #374151;
  font-weight: 700;
}

.logo p {
  margin-top: 2px;
  color: #6b7280;
}

/* 사용자 박스 */
.user-section {
  display: flex;
  align-items: center;
  padding-top: 20px;
  gap: 10px;
  position: relative;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-info .name {
  font-weight: 600;
}

.user-info .role {
  font-size: 13px;
  color: #6b7280;
}

.alert-icon {
  margin-left: auto;
  font-size: 20px;
  cursor: pointer;
}

/* 메뉴 */
.menu {
  margin-top: 25px;
}

.badge {
  margin-left: 6px;
}
</style>
