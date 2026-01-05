<template>
  <div class="notification-page">

    <!-- 헤더 -->
    <div class="page-header">
      <div class="title">
        <el-icon>
          <Bell />
        </el-icon>
        전체 알림
        <span class="badge">{{ unreadCount }}</span>
      </div>
    </div>

    <!-- 탭 -->
    <el-tabs v-model="activeTab" class="noti-tabs">
      <el-tab-pane v-for="tab in tabs" :key="tab.key" :label="tab.label" :name="tab.key" />
    </el-tabs>

    <!-- 선택 툴바 -->
    <div class="select-toolbar">
      <el-checkbox class="noti-check" v-model="allChecked">전체 선택</el-checkbox>

      <div class="selected-info" v-if="selectedCount > 0">
        선택됨 {{ selectedCount }}개
      </div>

      <div class="actions">
        <span class="action read" :class="{ disabled: selectedCount === 0 }"
          @click="selectedCount === 0 ? null : readSelected()">
          읽음
        </span>

        <span class="action delete" :class="{ disabled: selectedCount === 0 }"
          @click="selectedCount === 0 ? null : deleteSelected()">
          삭제
        </span>
      </div>
    </div>

    <!-- 알림 리스트 -->
    <div
  class="noti-list"
  v-loading="noticeStore.loading"
  element-loading-text="알림을 불러오는 중입니다"
  element-loading-background="rgba(255, 255, 255, 0.6)"
>
  <!-- 🔔 알림 있음 -->
  <template v-if="notifications.length > 0">
    <div
      v-for="item in notifications"
      :key="item.id"
      class="noti-card"
      :class="{ read: item.isRead === 'Y' }"
    >
      <!-- LEFT -->
      <div class="noti-left">
        <el-checkbox
          :model-value="noticeStore.isSelected(item.id)"
          @change="() => noticeStore.toggleSelect(item.id)"
        />
      </div>

      <!-- RIGHT -->
      <div class="noti-right" @click="onClickNotice(item)">
        <div class="icon" :class="item.notice.type">
          <el-icon>
            <component :is="getIcon(item.notice.type)" />
          </el-icon>
        </div>

        <div class="content">
          <div class="title-line">
            <span class="title">{{ item.notice.title }}</span>
            <span class="new" v-if="item.isRead === 'N'">NEW</span>
          </div>
          <div class="message">{{ item.notice.message }}</div>
          <div class="time">{{ timeAgo(item.createdAt) }}</div>
        </div>
      </div>
    </div>
  </template>

  <!-- 📭 알림 없음 -->
  <template v-else>
    <div class="empty-wrapper">
      <el-empty description="알림이 없습니다" />
    </div>
  </template>
</div>


    <!-- 페이징 -->
    <div class="pagination-bar">
      <!-- 페이지 크기 선택 -->
      <div class="page-size">
        <el-select v-model="size" size="small" style="width: 110px" :disabled="noticeStore.loading"
          @change="onSizeChange">
          <el-option v-for="s in pageSizeOptions" :key="s" :label="`${s}개씩`" :value="s" />
        </el-select>
      </div>

      <!-- 페이지 이동 -->
      <el-pagination background layout="prev, pager, next" :page-size="size" :current-page="page" :total="totalCount"
        :disabled="noticeStore.loading" @current-change="onPageChange" />
    </div>

    <div class="footer">
      <el-button round type="primary" @click="router.back()">뒤로 가기</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { Bell, Check, Calendar, WarningFilled, DocumentCopy, Close, User, Box } from "@element-plus/icons-vue";
import dayjs from "dayjs";
import { ElMessageBox } from "element-plus";

import { useAuthStore } from "@/store/auth.store";
import { useNotificationStore } from "@/store/useNotice";
import api from "@/api/axios";

const router = useRouter();
const authStore = useAuthStore();
const noticeStore = useNotificationStore();

const page = ref(1);
const size = ref(10);
const activeTab = ref("ALL");
const selectedIds = ref([]);
const pageSizeOptions = [10, 20, 50, 100];

/* store data */
const notifications = computed(() => noticeStore.contents);
const totalCount = computed(() => noticeStore.totalCount);
const unreadCount = computed(() =>
  noticeStore.unreadCount > 99 ? "99+" : noticeStore.unreadCount
);
const selectedCount = computed(() => noticeStore.selectedCount);
const onSizeChange = (newSize) => {
  page.value = 1;              // 무조건 1페이지
  noticeStore.clearSelected(); // 선택 초기화 (추천 UX)
  fetchPage();
};

/* fetch */
const fetchPage = () => {
  noticeStore.fetchPage({
    empId: authStore.id,
    size: size.value,
    page: page.value,
    type: activeTab.value
  });
};

onMounted(() => {
  fetchPage();
  noticeStore.fetchUnread(authStore.id);
});

watch(
  () => noticeStore.unreadCount,
  () => {
    fetchPage();
  }
);


watch(activeTab, () => {
  page.value = 1;
  selectedIds.value = [];
  fetchPage();
});

/* pagination */
const onPageChange = (p) => {
  page.value = p;
  fetchPage();
};

/* 전체 선택 */
const currentPageIds = computed(() =>
  notifications.value.map(n => n.id)
);

const allChecked = computed({
  get() {
    return (
      currentPageIds.value.length > 0 &&
      currentPageIds.value.every(id => noticeStore.isSelected(id))
    );
  },
  set(checked) {
    if (checked) {
      noticeStore.selectMany(currentPageIds.value);
    } else {
      noticeStore.unselectMany(currentPageIds.value);
    }
  }
});

/* actions */
const readSelected = async () => {
  if (selectedCount.value === 0) return;

  const ids = Array.from(noticeStore.selectedIds);

  await api.put("/notice/read", { noticeId: ids });

  noticeStore.clearSelected();
  page.value = 1;
  fetchPage();
  noticeStore.fetchUnread(authStore.id);
};

const deleteSelected = async () => {
  if (selectedCount.value === 0) return;

  await ElMessageBox.confirm("선택한 알림을 삭제할까요?", "알림 삭제", {
    type: "warning"
  });

  const ids = Array.from(noticeStore.selectedIds);

  await api.delete("/notice/delete", {
    data: { noticeId: ids }
  });

  noticeStore.clearSelected();
  page.value = 1;
  fetchPage();
  noticeStore.fetchUnread(authStore.id);
};

/* tabs */
const tabs = [
  { key: "ALL", label: "전체" },
  { key: "APPROVAL", label: "결재 승인" },
  { key: "REJECT", label: "결재 반려" },
  { key: "CUSTOMER_REGIST", label: "고객 등록" },
  { key: "PRODUCT_REGIST", label: "제품 등록" },
  { key: "QUOTE_INSERT", label: "견적(상담)" },
  // { key: "AS_DUE", label: "연체" },
  // { key: "CONTRACT_EXPIRE", label: "계약 만료" },
];

/* utils */
const timeAgo = (date) => {
  const now = dayjs();
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
};

const getIcon = (type) => {
  switch (type) {
    case "APPROVAL": return Check;
    case "REJECT": return Close;
    case "CUSTOMER_REGIST": return User;
    case "PRODUCT_REGIST": return Box;
    case "AS_DUE": return WarningFilled;
    case "CONTRACT_EXPIRE": return Calendar;
    case "QUOTE_INSERT": return DocumentCopy;
    default: return Bell;
  }
};

// 알림 읽음 처리
const onClickNotice = async (item) => {
  // 이미 읽은 알림이면 패스
  if (item.isRead === "Y") return;

  try {
    await api.put("/notice/read", {
      noticeId: [item.id],
    });

    // UX 즉시 반영 (리스트에서 NEW 제거)
    item.isRead = "Y";

    // unread 카운트 갱신
    noticeStore.fetchUnread(authStore.id);
  } catch (e) {
    console.error("알림 읽음 처리 실패", e);
  }
};

</script>


<style scoped>
.notification-page {
  height: 100vh;
  background: #f8fafc;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #eef4ff;
}

.page-header .title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
}

.badge {
  background: #ef4444;
  color: white;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
}

.close {
  cursor: pointer;
}

.noti-tabs {
  padding: 0 16px;
}

.noti-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.day-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.noti-card {
  display: flex;
  background: #fff;
  border-radius: 10px;
  margin-bottom: 10px;
  overflow: hidden;
}

/* LEFT */
.noti-left {
  width: 48px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 40px;
  flex-shrink: 0;
}

/* RIGHT */
.noti-right {
  flex: 1;
  display: flex;
  gap: 12px;
  padding: 14px;
  cursor: pointer;

  transition:
    background-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

/* hover */
.noti-right:hover {
  background: #f8fafc;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

/* active */
.noti-right:active {
  transform: scale(0.985);
}

/* 읽은 알림 */
.noti-card.read .noti-right {
  opacity: 0.6;
}



.icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon.APPROVAL {
  background: #e6f4ea;
  color: #22c55e;
}

.icon.CONTRACT_EXPIRE {
  background: #fff7ed;
  color: #f97316;
}

.icon.QUOTE_INSERT {
  background: #eff6ff;
  color: #3b82f6;
}

.icon.AS_DUE {
  background: #fee2e2;
  color: #ef4444;
}

.icon.REJECT {
  background: #fee2e2;
  color: #e85e5e;
}

.icon.CUSTOMER_REGIST {
  background: #fdffe3;
  color: #363636;
}

.icon.PRODUCT_REGIST {
  background: #c5ffd0;
  color: #0000007b;
}

.content .title-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.content .title {
  font-weight: 600;
}

.new {
  background: #ef4444;
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
}

.message {
  font-size: 13px;
  color: #555;
  margin: 4px 0;
}

.time {
  font-size: 12px;
  color: #9ca3af;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 20px;
  border-top: 1px solid #eee;
  background: #fff;
}

.read-all {
  transition-duration: 0.2s;
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
}

.read-all:hover {
  transition-duration: 0.2s;
  color: #4c7ce6;
  font-weight: 600;
  cursor: pointer;
}

.noti-check {
  margin-top: 6px;
  pointer-events: auto;
  z-index: 2;
}

.noti-check:hover {
  background: transparent;
}



:deep(.noti-check) {
  transform: scale(1.2);
  /* 0.8 ~ 1.2 */
  transform-origin: left center;
}


.noti-card {
  align-items: flex-start;
}

.empty-wrapper {
  height: 100%;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}


.read-all.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}


.select-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  font-size: 14px;
}

.read-selected {
  color: #2563eb;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s;
}

.read-selected:hover {
  color: #4c7ce6;
}

.read-selected.disabled {
  color: #9ca3af;
  cursor: not-allowed;
}

.actions {
  display: flex;
  gap: 20px;
}

.action {
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: color 0.2s;
}

.action.read {
  color: #2563eb;
}

.action.delete {
  color: #ef4444;
}

.action:hover {
  opacity: 0.8;
}

.action.disabled {
  color: #9ca3af !important;
  cursor: not-allowed !important;
  pointer-events: none;
  /* ✅ 클릭/호버 완전 차단 */
  opacity: 0.7;
}

.action.disabled:hover {
  opacity: 0.7;
  /* hover로 바뀌지 않게 */
}

.pagination-bar {
  position: relative;
  display: flex;
  align-items: center;
  padding: 12px 20px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

/* 왼쪽: 페이지 사이즈 */
.page-size {
  z-index: 1;
}

/* 가운데: 페이지 버튼 */
.pagination-bar .el-pagination {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}
</style>
