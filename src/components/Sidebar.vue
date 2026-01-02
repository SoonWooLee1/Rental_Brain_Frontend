<template>
  <div class="sidebar">

    <!-- 로고 영역 -->
    <div class="logo" @click.stop="goToMain">
      <h1>Rental Brain</h1>
      <p>CRM · ERP Platform</p>
    </div>

    <!-- 사용자 정보 -->
    <div class="user-section">
      <el-avatar size="large" class="avatar">
        <el-icon><Avatar /></el-icon>
      </el-avatar>
      <div class="user-info" @click="goToMyPage">
        <span class="name">{{ authStore.name }}</span>
        <span class="role">{{ authStore.dept }}</span>
        <el-button type="primary" class="button" @click.stop="logout">
          로그아웃
        </el-button>
      </div>

      <!-- 알림 -->
      <el-popover placement="right-start" width="400" trigger="manual" popper-class="notification-popover" v-model:visible="vis">
        <template #reference>
          <div class="alert-icon" @click="vis = !vis">
            <el-badge :value="unreadCount" :show-zero="false" :max="99" type="danger">
              <el-icon>
                <Bell />
              </el-icon>
            </el-badge>
          </div>
        </template>

        <div class="noti-wrapper">
          <!-- 헤더 -->
          <div class="noti-header">
            <div class="title">
              <el-icon>
                <Bell />
              </el-icon>
              알림
              <span class="count">{{ unreadCount > 99 ? "99+" : unreadCount }}</span>
            </div>
            <el-icon class="close" @click.stop="vis = false">
              <Close />
            </el-icon>
          </div>

          <!-- 리스트 -->
          <div class="noti-list">
            <template v-if="isExist">
              <div v-for="item in notifications" :key="item.id" class="noti-item" @click.stop="goToNotificationCenter">
                <!-- 아이콘 -->
                <div class="icon" :class="item.notice.type">
                  <el-icon>
                    <component :is="getIcon(item.notice.type)" />
                  </el-icon>
                </div>

                <!-- 내용 -->
                <div class="content">
                  <div class="title">{{ item.notice.title }}</div>
                  <div class="message">{{ item.notice.message }}</div>
                  <div class="time">{{ timeAgo(item.createdAt) }}</div>
                </div>
              </div>
            </template>
            <template v-else>
              알림이 없습니다.
            </template>
          </div>


          <!-- 푸터 -->
          <div class="noti-footer" @click="goToNotificationCenter">
            모든 알림 보기
          </div>
        </div>
      </el-popover>


    </div>

    <!-- 메뉴 시작 -->
    <el-menu class="menu" :default-active="$route.path" router background-color="transparent" text-color="#333"
      active-text-color="#4F46E5">
      <!-- 대시보드 -->
      <el-menu-item index="/">
        <el-icon>
          <Grid />
        </el-icon>
        <span>대시보드</span>
      </el-menu-item>

      <!-- 고객 -->
      <el-sub-menu index="customer">
        <template #title>
          <el-icon><UserFilled /></el-icon>
          <span>고객 관리</span>
        </template>

        <el-menu-item index="/customers">
          <el-icon>
            <User />
          </el-icon>
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

          <el-menu-item index="/cs/survey">
            <el-icon><DocumentCopy /></el-icon> 설문조사 관리
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/analysis">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>고객 분석</span>
          </template>

        <el-menu-item index="/analysis/summary">
            <el-icon><PieChart /></el-icon> 고객 요약 분석
          </el-menu-item>
          
          <el-menu-item index="/analysis/support">
            <el-icon><Headset /></el-icon>고객 응대 분석
          </el-menu-item>

           <el-menu-item index="/analysis/segment">
            <el-icon><UserFilled /></el-icon>고객 세그먼트 분석
          </el-menu-item>
          
        </el-sub-menu>

        <el-menu-item index="/customer/risk">
          <el-icon>
            <WarningFilled />
          </el-icon>
          연체 관리

        </el-menu-item>
      </el-sub-menu>

      <!-- 영업관리 (견적/계약/캠페인) -->
      <el-sub-menu index="business">
        <template #title>
          <el-icon><Briefcase /></el-icon>
          <span>영업 관리</span>
        </template>

        <el-menu-item index="/quote">
          <el-icon>
            <Document />
          </el-icon>
          견적(상담)
        </el-menu-item>

        <el-menu-item index="/contracts">
          <el-icon>
            <Notebook />
          </el-icon>
          계약(결재)
        </el-menu-item>

      <el-sub-menu index="campaign">
          <template #title><el-icon>
            <Present />
          </el-icon>
          <span>캠페인</span>
          </template>

          <el-menu-item index="/campaign/promotions">
            <el-icon><Promotion /></el-icon> 프로모션
          </el-menu-item>
          
          <el-menu-item index="/campaign/coupons">
            <el-icon><Ticket /></el-icon> 쿠폰
          </el-menu-item>
        </el-sub-menu>
      </el-sub-menu>

      <!-- 자산운영 -->
      <el-sub-menu index="product">
        <template #title>
          <el-icon><Box /></el-icon>
          <span>제품 관리</span>
        </template>

        <el-menu-item index="/assets">
          <el-icon>
            <Setting />
          </el-icon>
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
        <el-icon>
          <Setting />
        </el-icon>
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
  Check,
  Calendar,
  Close,
  Grid,
  DocumentCopy,
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
  Star,            // 피드백 관리 아이콘
  DataAnalysis, // 여기서 부터 4개 고객 분석 아이콘
  PieChart,
  Headset,
  Ticket,
  Avatar,
} from "@element-plus/icons-vue";
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { useNotificationStore } from "@/store/useNotice";

const authStore = useAuthStore();
const toastStore = useToastStore();
const noticeStore = useNotificationStore();
const router = useRouter();
const notifications = computed(()=>noticeStore.unread);
const unreadCount = computed(() => noticeStore.unreadCount);
const vis = ref(false)
const isExist = computed(() => notifications.value.length > 0);

const goToMain = ()=>{
  router.push('/')
}

const logout = async () => {  
  try {
    const response = await api.post('/emp/logout', {
      empId: authStore.empId
    })
    console.log(response.data);
  } catch (e) {
    console.log('로그아웃 통신 fail');
  }
  authStore.logout();
  toastStore.showToast('로그아웃' + authStore.empId);
  router.push('/login');
}
const goToNotificationCenter = ()=>{
  vis.value = false;
  router.push("/notifications");
}

const goToMyPage = ()=>{
  router.push('/mypage')
}

onMounted(async () => {
  noticeStore.fetchUnread(authStore.id);
})

watch(vis, (open) => {
  if (open) {
    noticeStore.fetchUnread(authStore.id);
  }
});

const timeAgo = (date) => { const now = dayjs();
  const target = dayjs(date);
  const diffSec = now.diff(target, "second");
  const diffMin = now.diff(target, "minute");
  const diffHour = now.diff(target, "hour");
  const diffDay = now.diff(target, "day");
  const diffWeek = now.diff(target, "week");
  const diffMonth = now.diff(target, "month");
  const diffYear = now.diff(target, "year");
  if (diffSec < 60) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffWeek < 4) return `${diffWeek}주 전`;
  if (diffMonth < 12) return `${diffMonth}개월 전`;
  return `${diffYear}년 전`;
}

const getIcon = (type) => {
  switch (type) {
    case "APPROVAL":
      return Check;
    case "AS_DUE":
      return WarningFilled;
    case "CONTRACT_EXPIRE":
      return Calendar;
    case "QUOTE_INSERT":
      return DocumentCopy;
    default:
      return Bell;
  }
};
</script>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;

  display: flex;          /* 추가 */
  flex-direction: column; /* 추가 */
  overflow: hidden;       /* 추가: 바깥은 고정, 안쪽만 스크롤 */

  background: #fff;
  border-right: 1px solid #eee;
  padding: 20px;
}

:deep(.button.el-button--primary) {
  transition-duration: 0.2s;
  height: 25px;
  background: #22aac5;
  border-color: #ffffff;
  border-radius: 12px;
  font-weight: 700;
}
:deep(.button.el-button--primary:hover) {
  transition-duration: 0.2s;
  background: #8ad3e1;
  border-color: #ffffff;
} 

.logo{
  transition-duration: 0.2s;
  color: #0F172A;
}

.logo:hover{
  transition-duration: 0.2s;
  color: #1E3A8A;
  cursor: pointer;
}

/* 로고 */
.logo h1 {
  font-family: 'Adamina',serif;
  font-size: 22px;
  margin: 0;
  font-weight: 700;
  cursor: pointer;
}

.logo p {
  transition-duration: 0.2s;
  margin-top: 2px;
  cursor: pointer;
}

/* 사용자 박스 */
.user-section {
  display: flex;
  align-items: center;
  padding-top: 20px;
  padding-right: 7px;
  gap: 10px;
  position: relative;
}

.avatar {
  background-color: #2563eb; /* Tailwind blue-600 느낌 */
  color: #ffffff;           /* 아이콘 흰색 */
}


.user-info {
  transition-duration: 0.2s;
  display: flex;
  flex-direction: column;
  color: #0F172A;
  cursor: pointer;
}

.user-info:hover {
  transition-duration: 0.2s;
  color: #1E3A8A;
  cursor: pointer;
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
  flex: 1;         /* 추가 */
  min-height: 0;   /* 추가: flex 자식이 스크롤되려면 중요 */
  overflow-y: auto;/* 추가 */
}

.badge {
  margin-left: 6px;
}

/* popover 전체 */
.notification-popover {
  padding: 0;
  border-radius: 12px;
}

/* 래퍼 */
.noti-wrapper {
  display: flex;
  flex-direction: column;
  max-height: 500px;
}

/* 헤더 */
.noti-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px;
  border-bottom: 1px solid #eee;
  background: #f3f6fb;
}

.noti-header .close {
  transition-duration: 0.1s;
  color: #606060;
  transform: scale(1.0);
}

.noti-header .close:hover {
  transition-duration: 0.1s;
  cursor: pointer;
  color: #191919;
  transform: scale(1.1);
}

.noti-header .title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.noti-header .count {
  background: #ef4444;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
}

/* 리스트 */
.noti-list {
  overflow-y: auto;
  padding: 10px;
}

/* 아이템 */
.noti-item {
  transition-duration: 0.2s;
  display: flex;
  gap: 12px;
  padding: 14px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
}

.noti-item:hover {
  transition-duration: 0.2s;
  background: #f9fafb;
}

/* 아이콘 */
.noti-item .icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon.approval {
  background: #e6f4ea;
  color: #22c55e;
}

.icon.schedule {
  background: #fff7ed;
  color: #f97316;
}

.icon.contract {
  background: #eff6ff;
  color: #3b82f6;
}

.icon.reject {
  background: #fee2e2;
  color: #ef4444;
}

/* 내용 */
.noti-item .content {
  flex: 1;
}

.noti-item .title {
  font-weight: 600;
  font-size: 14px;
}

.noti-item .message {
  font-size: 13px;
  color: #555;
  margin: 2px 0;
}

.noti-item .time {
  font-size: 12px;
  color: #9ca3af;
}

/* 푸터 */
.noti-footer {
  transition-duration: 0.2s;
  text-align: center;
  padding: 12px;
  font-size: 13px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
}

.noti-footer:hover {
  transition-duration: 0.2s;
  text-align: center;
  padding: 12px;
  font-size: 13px;
  font-weight: 610;
  background-color: #f2f6ff;
  cursor: pointer;
}
</style>