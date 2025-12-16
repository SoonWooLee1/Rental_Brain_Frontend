import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from "@/layouts/GlobalLayout.vue";

const routes = [
  {
    path: '/',
    component: GlobalLayout,
    children: [
      // --- Dashboard ---
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/dashboard/DashboardView.vue'),
      },

      // --- 고객관리 ---
      {
        path: 'customers',
        name: 'customer-list',
        component: () => import('@/views/customer/CustomerListView.vue'),
      },
      {
        path: 'customers/:id',
        name: 'customer-detail',
        component: () => import('@/views/customer/CustomerDetailView.vue'),
      },

      // --- 고객응대 ---
      {
        path: 'cs',
        name: 'cs-list',
        component: () => import('@/views/cs/CsListView.vue'),
      },

      // --- 고객분석 ---
      {
        path: 'analysis/overview',
        name: 'analysis-overview',
        component: () => import('@/views/analysis/CustomerOverviewView.vue'),
      },
      {
        path: 'analysis/segment',
        name: 'analysis-segment',
        component: () => import('@/views/analysis/SegmentAnalysisView.vue'),
      },

      // --- 연체관리 ---
      {
        path: 'customer/risk',
        name: 'customer-risklist',
        component: () => import('@/views/customer/RiskListView.vue'),
      },

      // --- 견적 ---
      {
        path: 'quotes',
        name: 'quote-list',
        component: () => import('@/views/business/QuoteListView.vue'),
      },

      // --- 계약 ---
      {
        path: 'contracts',
        name: 'contract-list',
        component: () => import('@/views/contract/ContractListView.vue'),
      },
      {
        path: 'contracts/:id',
        name: 'contract-detail',
        component: () => import('@/views/contract/ContractDetailView.vue'),
      },

      // --- 캠페인 ---
      {
        path: 'campaign/promotions',
        name: 'promotion-list',
        component: () => import('@/views/campaign/PromotionListView.vue'),
      },
      {
        path: 'campaign/coupons',
        name: 'coupon-list',
        component: () => import('@/views/campaign/CouponListView.vue'),
      },

      // --- 자산 관리 ---
      {
        path: 'assets',
        name: 'asset-list',
        component: () => import('@/views/product/ProductListView.vue'),
      },

      // --- AS ---
      {
        path: 'as',
        name: 'as-list',
        component: () => import('@/views/product/AsListView.vue'),
      },

      // --- 결재 ---
      {
        path: 'approvals',
        name: 'approval-list',
        component: () => import('@/views/approval/ApprovalListView.vue'),
      },

      // --- 알림센터 ---
      {
        path: 'notifications',
        name: 'notification-center',
        component: () => import('@/views/notification/NotificationCenterView.vue'),
      },

      // --- 관리자 메뉴 ---
      {
        path: 'admin/menus',
        name: 'admin-menu',
        component: () => import('@/views/systemmenu/AdminMenuListView.vue'),
      },
      {
        path: 'admin/roles',
        name: 'admin-role',
        component: () => import('@/views/systemmenu/RolePermissionMatrixView.vue'),
      },
      {
        path: 'admin/users',
        name: 'admin-users',
        component: () => import('@/views/systemmenu/UserManageView.vue'),
      },
    ],
  },

  // 로그인
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
