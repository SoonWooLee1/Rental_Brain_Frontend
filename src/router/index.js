import { createRouter, createWebHistory } from 'vue-router';
import GlobalLayout from "@/layouts/GlobalLayout.vue";
import { useAuthStore } from '@/store/auth.store';
import { ElMessage } from 'element-plus';

const routes = [
  {
    path: '/',
    component: GlobalLayout,
    meta: { requiresAuth: true },
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
        meta: {
          requiresAuth: true,
          permissions: ["CUSTOMER_READ"],
        },
      },
      {
        path: 'customers/:id',
        name: 'customer-detail',
        component: () => import('@/views/customer/CustomerDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CUSTOMER_READ"],
        },
      },

      // --- 고객응대 ---
      {
        path: 'cs/supports',
        name: 'cs-support-list',
        component: () => import('@/views/cs/SupportListView.vue'), // 문의 관리
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
      },
      {
        path: 'cs/supports/:id', // 문의 상세 페이지
        name: 'cs-support-detail',
        component: () => import('@/views/cs/SupportDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
      },

      {
        path: 'cs/feedbacks',
        name: 'cs-feedback-list',
        component: () => import('@/views/cs/FeedbackListView.vue'), // 피드백 관리
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
      },
      {
        path: 'cs/feedbacks/:id', // 피드백 상세 페이지
        name: 'cs-feedback-detail',
        component: () => import('@/views/cs/FeedbackDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
      },

      {
        path: 'cs/survey',
        name: 'cs-survey-list',
        component: () => import('@/views/cs/SurveyView.vue'), // 설문 관리
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
        children:[
          {
        path: 'cs/survey/result',
        name: 'cs-survey-result',
        component: () => import('@/views/cs/SurveyAiResultView.vue'), // 설문 결과
        meta: {
          requiresAuth: true,
          permissions: ["CS_READ"],
        },
      },
        ]
      },

      {
        path: 'cs/survey/create',
        name: 'cs-survey-create',
        component: () => import('@/views/cs/SurveyCreateView.vue'), // 설문 생성
        meta: {
          requiresAuth: true,
          permissions: ["CS_PROCESS"],
        },
      },

      // --- 고객분석 ---
      {
        path: 'analysis/summary',
        name: 'analysis-summary',
        component: () => import('@/views/analysis/CustomerSummaryAnalysisView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CUSTOMER_ANALYSIS_READ"],
        },
      },
      {
        path: 'analysis/support',
        name: 'analysis-support',
        component: () => import('@/views/analysis/CustomerSupportAnalysisView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CUSTOMER_ANALYSIS_READ"],
        },
      },
      {
        path: 'analysis/segment',
        name: 'analysis-segment',
        component: () => import('@/views/analysis/CustomerSegmentAnalysisView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CUSTOMER_ANALYSIS_READ"],
        },
      },

      // --- 연체관리 ---
      {
        path: 'customer/risk',
        name: 'customer-risklist',
        component: () => import('@/views/customer/overdue/RiskListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["OVERDUE_READ"],
        },
      },
      {
        path: 'customer/risks/pay/:overdueId',
        name: 'customer-pay-overdue-detail',
        component: () => import('@/views/customer/overdue/PayOverdueDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["OVERDUE_READ"],
        },
      },
      {
        path: 'customer/risks/item/:overdueId',
        name: 'customer-item-overdue-detail',
        component: () => import('@/views/customer/overdue/ItemOverdueDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["OVERDUE_READ"],
        },
      },

      // --- 견적 ---
      {
        path: 'quote',
        name: 'quote-list',
        component: () => import('@/views/business/QuoteListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["QUOTE_READ"],
        },
      },
      {
        path: 'quote/:id',
        name: 'quote-detail',
        component: () => import('@/views/business/QuoteDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["QUOTE_READ"],
        },
      },

      // --- 계약 ---
      {
        path: 'contracts',
        name: 'contract-list',
        component: () => import('@/views/contract/ContractListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CONTRACT_READ"],
        },
      },
      {
        path: 'contracts/:id',
        name: 'contract-detail',
        component: () => import('@/views/contract/ContractDetailView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CONTRACT_READ"],
        },
      },
      {
        path: '/contracts/new',
        name: 'ContractCreate',
        component: () => import('@/views/contract/NewContractPage.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CONTRACT_WRITE"],
        },
      },
      // --- 캠페인 ---
      {
        path: 'campaign/promotions',
        name: 'promotion-list',
        component: () => import('@/views/campaign/PromotionListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CAMPAIGN_READ"],
        },
      },
      {
        path: 'campaign/coupons',
        name: 'coupon-list',
        component: () => import('@/views/campaign/CouponListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["CAMPAIGN_READ"],
        },
      },

      // --- 자산 관리 ---
      {
        path: 'assets',
        name: 'asset-list',
        component: () => import('@/views/product/ProductListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["ASSET_READ"],
        },
      },

      // --- AS ---
      {
        path: 'as',
        name: 'as-list',
        component: () => import('@/views/product/AsListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["AS_READ"],
        },
      },

      // --- 결재 ---
      {
        path: 'approvals',
        name: 'approval-list',
        component: () => import('@/views/approval/ApprovalListView.vue'),
        meta: {
          requiresAuth: true,
          permissions: ["APPROVAL_READ"],
        },
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
        meta: {
          requiresAuth: true,
          permissions: ["ADMIN_READ","ADMIN_MANAGE"],
        },
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
            meta: {
          requiresAuth: true,
          permissions: ["ADMIN_MANAGE"],
        },
          },
          {
            path: 'create',
            name: 'admin-create-emp',
            component: () => import('@/views/systemmenu/CreateEmpView.vue'),
            meta: {
          requiresAuth: true,
          permissions: ["ADMIN_MANAGE"],
        },
          },
        ],
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const token = authStore.token;

  // 로그인 페이지는 항상 허용
  if (to.name === "login") {
    next();
    return;
  }

  // 인증 필요한 페이지인데 토큰 없으면
  if (to.matched.some((route) => route.meta.requiresAuth) && !token) {
    next({
      name: "login",
      query: { redirect: to.fullPath },
    });
    return;
  }

   const requiredPerms = to.meta.permissions;
  if (requiredPerms && requiredPerms.length > 0) {
    const hasPermission = authStore.auth.some(p =>
      typeof p === "string"
        ? requiredPerms.includes(p)
        : requiredPerms.includes(p.auth)
    );

    if (!hasPermission) {
      ElMessage.warning("권한이 없습니다.");
      next({redirect: to.fullPath}); // ❌ 접근 차단
      return;
    }
  }

  next();
});

export default router;
