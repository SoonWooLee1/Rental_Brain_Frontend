<template>
    <div class="password-page">

        <!-- 헤더 -->
        <div class="header">
            <el-button text @click="router.back()">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                뒤로 가기
            </el-button>
        </div>

        <!-- 타이틀 -->
        <div class="title">
            <h2>비밀번호 변경</h2>
            <span>보안을 위해 주기적으로 비밀번호를 변경해주세요</span>
        </div>

        <!-- 폼 카드 -->
        <el-card shadow="never" class="card">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="140px">

                <el-form-item label="현재 비밀번호" prop="currentPassword">
                    <el-input v-model="form.currentPassword" type="password" show-password />
                </el-form-item>

                <el-form-item label="새 비밀번호" prop="newPassword">
                    <el-input v-model="form.newPassword" type="password" show-password />
                </el-form-item>

                <el-form-item label="새 비밀번호 확인" prop="confirmPassword">
                    <el-input v-model="form.confirmPassword" type="password" show-password />
                </el-form-item>

                <el-alert type="info" show-icon :closable="false" class="hint">
                    <ul>
                        <li>영문 대/소문자, 숫자, 특수문자 포함(개발 중에는 미적용되어 있습니다.)</li>
                        <li>8자 이상 입력</li>
                    </ul>
                </el-alert>

                <div class="actions">
                    <el-button @click="router.back()">취소</el-button>
                    <el-button type="primary" @click="onSubmit">
                        변경하기
                    </el-button>
                </div>
            </el-form>
        </el-card>

    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ArrowLeft } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import api from "@/api/axios";
import { useToastStore } from "@/store/useToast";
import { useAuthStore } from "@/store/auth.store";

const router = useRouter();
const formRef = ref();
const toastStore = useToastStore();
const authStore = useAuthStore();

const form = ref({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
});

/* 비밀번호 정규식 */
const passwordRegex = /[a-zA-Z0-9!@#$%^&*()-=_+,./<>?;':"]/;
//   /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

const rules = {
    currentPassword: [
        { required: true, message: "현재 비밀번호를 입력하세요", trigger: "blur" },
    ],
    newPassword: [
        { required: true, message: "새 비밀번호를 입력하세요", trigger: "blur" },
        {
            validator: (_, value, callback) => {
                if (!passwordRegex.test(value)) {
                    callback(new Error("비밀번호 형식이 올바르지 않습니다"));
                } else {
                    callback();
                }
            },
            trigger: "blur",
        },
    ],
    confirmPassword: [
        { required: true, message: "비밀번호를 다시 입력하세요", trigger: "blur" },
        {
            validator: (_, value, callback) => {
                if (value !== form.value.newPassword) {
                    callback(new Error("비밀번호가 일치하지 않습니다"));
                } else {
                    callback();
                }
            },
            trigger: "blur",
        },
    ],
};

const onSubmit = async () => {
    await formRef.value.validate();

    try {
        await api.put("/emp/pwdmodify", {
            empId: authStore.empId,
            pwd: form.value.currentPassword,
            modifiedPwd: form.value.newPassword,
        });

        try {
            await api.post('/emp/logout', {
                empId: authStore.empId
            })
        } catch (e) {
            console.log('로그아웃 통신 fail');
        }

        console.log('empId:', authStore.empId);
        authStore.logout();
        
        //   ElMessage.success("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        toastStore.showToast("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
        router.push('/login');
    }
    catch (e) {
        console.log(e);
        toastStore.showToast(e.response?.data||"비밀번호 변경 중 오류가 발생했습니다.");
    }
};
</script>

<style scoped>
.password-page {
    padding: 28px;
    background: #f6f8fb;
    min-height: 100vh;
}

.header {
    margin-bottom: 16px;
}

.title {
    margin-bottom: 24px;
}

.title h2 {
    margin: 0;
    font-size: 26px;
}

.title span {
    color: #6b7280;
    font-size: 14px;
}

.card {
    max-width: 520px;
    border-radius: 14px;
}

.hint {
    margin: 16px 0;
}

.actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 24px;
}
</style>
