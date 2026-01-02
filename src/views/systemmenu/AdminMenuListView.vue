<template>
    <div class="admin-auth-page">
        <div class="page-title">
            <div class="title-left">
                <h2>사용자 관리</h2>
                <span>사용자별 권한을 관리합니다</span>
            </div>

            <div class="title-right">
                <el-button type="primary" size="medium" round @click="goCreate">
                    <el-icon>
                        <User />
                    </el-icon>
                    사원 등록
                </el-button>
            </div>
        </div>

        <div class="content">
            <!-- 좌측 사용자 목록 -->
            <el-card shadow="never" class="user-list">
                <template #header>
                    <div class="card-header">
                        <div class="header-top">
                            <div class="title">
                                <el-icon>
                                    <User />
                                </el-icon>
                                사용자 목록
                            </div>


                        </div>

                        <el-input v-model="keyword" placeholder="이름, 이메일, 부서 검색" clearable class="search" />
                    </div>
                </template>


                <div class="list scroll">
                    <div v-for="emp in filteredEmployees" :key="emp.id" class="user-item"
                        :class="{ active: emp.id === selectedEmployee?.id }" @click="selectEmployee(emp)">
                        <div class="left">
                            <div class="avatar">
                                <el-icon>
                                    <Avatar />
                                </el-icon>
                            </div>
                            <div class="meta">
                                <div class="name">{{ emp.name }}</div>
                                <div class="email">{{ emp.email }}</div>
                                <div class="dept">{{ emp.position.position_name }}</div>
                            </div>
                        </div>

                        <div class="actions">
                            <el-button circle size="large" class="icon-btn" @click.stop="goEdit(emp)">
                                <el-icon>
                                    <Edit />
                                </el-icon>
                            </el-button>
                        </div>
                    </div>
                </div>
            </el-card>

            <!-- 우측 패널 -->
            <el-card shadow="never" class="right-panel" v-if="$route.name">
                <router-view :key="$route.fullPath" :employee="selectedEmployee" :auth-master="authMaster"
                    :position-map="positionMap" @updateEmployee="syncEmployee" />
            </el-card>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { User, Edit } from "@element-plus/icons-vue";
import { useRouter, useRoute } from "vue-router";
import api from "@/api/axios";

const router = useRouter();
const route = useRoute();

const employees = ref([]);
const selectedEmployee = ref(null);
const keyword = ref("");
const authMaster = ref([]);
const positionMap = ref({});

onMounted(async () => {
    const [empRes, authRes, posRes] = await Promise.all([
        api.get("/emp/admin/emplist"),
        api.get("/emp/admin/empauthlist"),
        api.get("/emp/admin/positionlist"),
    ]);

    employees.value = empRes.data;
    authMaster.value = authRes.data;
    positionMap.value = posRes.data.reduce((acc, cur) => {
        acc[cur.position_id] = cur.position_name;
        return acc;
    }, {});
});

const filteredEmployees = computed(() => {
    if (!keyword.value) return employees.value;
    return employees.value.filter(e =>
        e.name.includes(keyword.value) ||
        e.email.includes(keyword.value) ||
        e.dept.includes(keyword.value)
    );
});

const selectEmployee = (emp) => {
    selectedEmployee.value = emp;
    router.push(`/admin/menus/${emp.id}/auth`);
};

const goEdit = (emp) => {
    selectedEmployee.value = emp;
    router.push(`/admin/menus/${emp.id}/edit`);
};

const goCreate = () => {
    selectedEmployee.value = null;
    router.push("/admin/menus/create");
};

const syncEmployee = (payload) => {
  const idx = employees.value.findIndex(e => e.id === payload.id);
  if (idx === -1) return;

  const prev = employees.value[idx];

  const nextPositionId =
    payload.position?.position_id != null
      ? Number(payload.position.position_id)
      : prev.position.position_id;

  employees.value[idx] = {
    ...prev,
    ...payload,
    position: {
      position_id: nextPositionId,
      position_name:
        positionMap.value[nextPositionId] ?? prev.position.position_name
    }
  };

  if (selectedEmployee.value?.id === payload.id) {
    selectedEmployee.value = employees.value[idx];
  }
};
</script>

<style scoped>
.header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.header-top .title {
    display: flex;
    align-items: center;
    gap: 6px;
}

.page-title {
    display: flex;
    justify-content: space-between;
    /* ⭐ 좌/우 분리 */
    align-items: center;
    margin-bottom: 20px;
}

.title-left {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.title-right {
    display: flex;
    align-items: center;
    padding-right: 20px;
}

.content {
    display: flex;
    gap: 20px;
    height: calc(100vh - 120px);
}

.user-list {
    width: 320px;
    border-radius: 14px;
    display: flex;
    flex-direction: column;
}

.search {
    margin-bottom: 5px;
}

.list {
    flex: 1;
    overflow-y: auto;
}

.user-item {
    position: relative;
    display: flex;
    justify-content: space-between;
    padding: 14px;
    border-radius: 12px;
    cursor: pointer;
}

.user-item:hover {
    background: #f1f5f9;
}

.user-item.active {
    background: #eff6ff;
}

.left {
    display: flex;
    gap: 12px;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: #2563eb;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
}

.meta .name {
    font-weight: 600;
}

.meta .email {
    font-size: 12px;
    color: #6b7280;
}

.meta .dept {
    font-size: 12px;
    color: #2563eb;
}

.actions {
    opacity: 0;
    transition: opacity 0.15s;
}

.user-item:hover .actions {
    opacity: 1;
}

.right-panel {
    flex: 1;
    border-radius: 14px;
    height: 100%;
}

.right-panel :deep(.el-card__body) {
    height: 100%;
    padding: 16px;
}
</style>
