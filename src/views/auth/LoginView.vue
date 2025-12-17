<template>
  <div class="login-page">
    <!-- 로고 영역 -->
    <div class="brand">
      <div class="brand-icon">
        <img src="@/assets/Icon-3.svg" alt="logo" />
      </div>
      <h1>렌탈 브레인</h1>
      <p>렌탈 중개업체 전용 통합 비즈니스 솔루션</p>
    </div>

    <!-- 로그인 카드 -->
    <div class="login-card">
      <header>
        <h2>로그인</h2>
        <span>ERP·CRM 통합 관리 시스템</span>
      </header>

      <form class="login-form">
        <div class="form-group">
          <label>사원 ID</label>
          <div class="input-box">
            <img src="@/assets/Icon-2.svg" />
            <input v-model="empId" type="text" @keyup.enter.stop="login" placeholder="사원 ID를 입력하세요" />
          </div>
        </div>

        <div class="form-group">
          <label>비밀번호</label>
          <div class="input-box">
            <img src="@/assets/Icon-1.svg" />
            <input v-model="pwd" type="password" @keyup.enter.stop="login" placeholder="비밀번호를 입력하세요" />
          </div>
        </div>

        <!-- <div class="remember">
          <input type="checkbox" />
          <span>로그인 상태 유지</span>
        </div> -->

        <button type="button" class="login-btn" @click.stop="login">
          로그인
        </button>
      </form>
    </div>

    <!-- 하단 -->
    <div class="security">
      <img src="@/assets/Icon.svg" />
      <span>보안 연결로 안전하게 보호됩니다</span>
    </div>

    <footer>
      <p>© 2024 렌탈 브레인. All rights reserved.</p>
      <p>B2B 렌탈 전문 ERP·CRM 통합 솔루션</p>
    </footer>
  </div>
</template>

<script setup>
import api from '@/api/axios';
import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/useToast';
import axios from 'axios';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const empId = ref('');
const pwd = ref('');
const toastStore = useToastStore();
const authStore = useAuthStore();
const router = useRouter();

const login = async () => {
  if (!empId.value || !pwd.value) {
    toastStore.showToast('아이디와 비밀번호를 입력하세요');
    return;
  }
  console.log(empId.value, pwd.value);

  try {
    const response = await api.post(`/login`, {
      empId: empId.value,
      pwd: pwd.value
    })
    console.log("response: ", response);
    const data = response.data;

    authStore.setUserInfo(
      data.id,
      data.employeeCode,
      data.empId,
      data.name,
      data.roles,
      data.accessToken
    );
    toastStore.showToast('로그인 되었습니다 :' + ' ' + authStore.employeeCode + ' ' + authStore.name);
    router.push("/");

  }
  catch (e) {
    console.log('로그인 실패', e);
    toastStore.showToast(e);
  }
};

</script>

<style>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #eff6ff, #ffffff, #eef2ff);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* 브랜드 */
.brand {
  text-align: center;
  margin-bottom: 32px;
}

.brand-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #3366cc, #1447e6);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 12px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, .15);
}

.brand h1 {
  font-size: 22px;
  font-weight: 700;
}

.brand p {
  font-size: 13px;
  color: #666;
}

/* 카드 */
.login-card {
  width: 380px;
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, .1);
}

.login-card header {
  margin-bottom: 20px;
}

.login-card h2 {
  font-size: 18px;
  font-weight: 700;
}

.login-card span {
  font-size: 13px;
  color: #6a7282;
}

/* 폼 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  font-size: 13px;
  color: #364153;
  margin-bottom: 6px;
  display: block;
}

.input-box {
  display: flex;
  align-items: center;
  border: 1px solid #d1d5dc;
  border-radius: 12px;
  padding: 0 12px;
  height: 44px;
}

.input-box img {
  width: 18px;
  margin-right: 8px;
}

.input-box input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}

/* 옵션 */
.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #364153;
  margin-bottom: 16px;
}

/* 버튼 */
.login-btn {
  width: 100%;
  height: 44px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(90deg, #3366cc, #1447e6);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(20, 71, 230, .35);
}

/* 하단 */
.security {
  margin-top: 18px;
  font-size: 12px;
  color: #6a7282;
  display: flex;
  align-items: center;
  gap: 6px;
}

footer {
  margin-top: 12px;
  text-align: center;
  font-size: 11px;
  color: #99a1af;
}
</style>
