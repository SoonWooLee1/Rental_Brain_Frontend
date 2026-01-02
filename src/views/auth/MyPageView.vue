<template>
    <div class="my-profile">

        <!-- 상단 헤더 -->
        <div class="header">
            <el-button text @click="router.back()">
                <el-icon>
                    <ArrowLeft />
                </el-icon>
                뒤로 가기
            </el-button>

            <div class="header-actions">
            <el-button type="primary" round @click="onEdit">
                <el-icon>
                    <Edit />
                </el-icon>
                정보 수정
            </el-button>

            <el-button type="warning" plain round @click="onPwdChange" color="#ed1818">
                <el-icon>
                    <Lock />
                </el-icon>
                비밀번호 수정
            </el-button>
            </div>
        </div>

        <!-- 타이틀 -->
        <div class="title">
            <h2>내 정보</h2>
            <span>직원 정보 조회 및 수정</span>
        </div>

        <!-- 프로필 카드 -->
        <el-card shadow="never" class="profile-card">
            <div class="profile-box">
                <el-avatar :size="72" class="avatar">
                    <el-icon>
                        <Avatar />
                    </el-icon>
                </el-avatar>

                <div class="profile-meta">
                    <div class="name">{{ form.name }}</div>
                    <div class="tags">
                        <el-tag type="success" size="small">{{ form.dept }}</el-tag>
                        <el-tag type="info" size="small">{{ form.position.position_name }}</el-tag>
                    </div>
                </div>
            </div>
        </el-card>

        <!-- 정보 카드 -->
        <el-card shadow="never" class="info-card">
            <template #header>
                <div class="card-header">
                    <el-icon>
                        <User />
                    </el-icon>
                    기본 정보
                </div>
            </template>

            <el-descriptions :column="2" border size="large" class="desc">
                <el-descriptions-item label="사번번호">
                    {{ form.employeeCode }}
                </el-descriptions-item>

                <el-descriptions-item label="부서">
                    {{ form.dept }}
                </el-descriptions-item>

                <el-descriptions-item label="이름">
                    {{ form.name }}
                </el-descriptions-item>

                <el-descriptions-item label="직급">
                    {{ form.position.position_name }}
                </el-descriptions-item>

                <el-descriptions-item label="연락처">
                    {{ form.phone }}
                </el-descriptions-item>

                <el-descriptions-item label="입사일">
                    {{ dateFormatter(form.hire_date) }}
                </el-descriptions-item>

                <el-descriptions-item label="이메일">
                    {{ form.email }}
                </el-descriptions-item>

                <el-descriptions-item label="생년월일">
                    {{ dateFormatter(form.birthday) }}
                </el-descriptions-item>

                <el-descriptions-item label="주소" :span="2">
                    {{ form.addr }}
                </el-descriptions-item>

                <el-descriptions-item label="성별">
                    {{ form.gender }}
                </el-descriptions-item>
            </el-descriptions>
        </el-card>

        <!-- 안내사항 -->
        <el-alert type="info" show-icon :closable="false" class="notice">
            <ul class="notice-list">
                <li>사번번호, 부서, 직급은 관리자만 변경할 수 있습니다.</li>
                <li>개인정보 변경 시 즉시 시스템에 반영됩니다.</li>
                <li>연락처 및 이메일은 중요 알림 수신에 사용됩니다.</li>
            </ul>
        </el-alert>

    </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
    ArrowLeft,
    Edit,
    User,
    Lock,
    Avatar
} from "@element-plus/icons-vue";
import dayjs from "dayjs";
import api from "@/api/axios";

onMounted(async () => {
    const response = await api.get('/emp/mypage');
    const data = response.data;
    console.log(data);
    form.value = data;
})
const router = useRouter();

const form = ref({
    position: {}
});


const dateFormatter = (date) => {
  return date ? dayjs(date).format("YYYY-MM-DD") : "-";
};

const onEdit = () => {
    router.push("/modifyinfo");
};

const onPwdChange = () => {
    router.push("/modifypwd");
};
</script>

<style scoped>
.my-profile {
    padding: 28px;
    background: #f6f8fb;
    min-height: 100vh;
}

/* 헤더 */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 타이틀 */
.title {
    margin: 16px 0 24px;
}

.title h2 {
    margin: 0;
    font-size: 26px;
}

.title span {
    color: #6b7280;
    font-size: 14px;
}

/* 프로필 카드 */
.profile-card {
    margin-bottom: 20px;
    background: linear-gradient(135deg, #eff6ff, #f8fafc);
    border-radius: 14px;
}

.profile-box {
    display: flex;
    align-items: center;
    gap: 20px;
}

.avatar {
    background: #2563eb;
    color: #fff;
}

.profile-meta .name {
    font-size: 20px;
    font-weight: 700;
}

.tags {
    margin-top: 6px;
    display: flex;
    gap: 8px;
}

/* 정보 카드 */
.info-card {
    margin-bottom: 20px;
    border-radius: 14px;
}

.card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
}

/* descriptions */
.desc :deep(.el-descriptions__label) {
    color: #6b7280;
    font-weight: 500;
}

.desc :deep(.el-descriptions__content) {
    font-weight: 600;
}

/* 안내사항 */
.notice {
    border-radius: 12px;
}

.notice-list {
    margin: 6px 0 0;
    padding-left: 18px;
}

.notice-list li {
    font-size: 14px;
    color: #374151;
}
</style>
