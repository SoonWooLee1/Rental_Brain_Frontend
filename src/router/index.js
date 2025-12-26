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
        path: 'cs/supports',
        name: 'cs-support-list',
        component: () => import('@/views/cs/SupportListView.vue'), // 문의 관리
      },

      {
        path: 'cs/feedbacks',
        name: 'cs-feedback-list',
        component: () => import('@/views/cs/FeedbackListView.vue'), // 피드백 관리
      },

      {
        path: 'cs/survey',
        name: 'cs-survey-list',
        component: () => import('@/views/cs/SurveyView.vue'), // 설문 관리
        children:[
          {
        path: 'cs/survey/result',
        name: 'cs-survey-result',
        component: () => import('@/views/cs/SurveyAiResultView.vue'), // 설문 결과
      },
        ]
      },

      {
        path: 'cs/survey/create',
        name: 'cs-survey-create',
        component: () => import('@/views/cs/SurveyCreateView.vue'), // 설문 생성
      },

      // --- 고객분석 ---
      {
        path: 'analysis/summary',
        name: 'analysis-summary',
        component: () => import('@/views/analysis/CustomerSummaryAnalysisView.vue'),
      },
      {
        path: 'analysis/support',
        name: 'analysis-support',
        component: () => import('@/views/analysis/CustomerSupportAnalysisView.vue'),
      },
      {
        path: 'analysis/segment',
        name: 'analysis-segment',
        component: () => import('@/views/analysis/CustomerSegmentAnalysisView.vue'),
      },

      // --- 연체관리 ---
      {
        path: 'customer/risk',
        name: 'customer-risklist',
        component: () => import('@/views/customer/overdue/RiskListView.vue'),
      },
      {
        path: 'customer/risks/pay/:overdueId',
        name: 'customer-pay-overdue-detail',
        component: () => import('@/views/customer/overdue/PayOverdueDetailView.vue'),
      },
      {
        path: 'customer/risks/item/:overdueId',
        name: 'customer-item-overdue-detail',
        component: () => import('@/views/customer/overdue/ItemOverdueDetailView.vue'),
      },

      // --- 견적 ---
      {
        path: 'quote',
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
        children: [
          {
            path: ":id/auth",
            name: "admin-user-auth",
            component: () => import("@/views/systemmenu/UserAuthView.vue"),
          },
          {
            path: ":id/edit",
            name: "admin-user-edit",
            component: () => import("@/views/systemmenu/UserEditView.vue"),
          },
          {
            path: 'create',
            name: 'admin-create-emp',
            component: () => import('@/views/systemmenu/CreateEmpView.vue'),
          },
        ],
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
      // --- 사용자 페이지 ---
      {
        path: 'mypage',
        name: 'my-page',
        component: () => import('@/views/auth/MyPageView.vue'),
      },
      {
        path: 'modifyinfo',
        name: 'modify-info-page',
        component: () => import('@/views/auth/ModifyInfoPageView.vue'),
      },
      {
        path: 'modifypwd',
        name: 'modify-pwd-page',
        component: () => import('@/views/auth/ModifyPwdView.vue'),
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
