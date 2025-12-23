<template>
  <div class="auth-panel">
    <h3>권한 관리</h3>

    <el-alert type="warning" show-icon :closable="false" class="hint">
      스위치 변경 후 저장을 눌러야 반영됩니다.
    </el-alert>
    <el-alert v-if="isMyself" type="info" show-icon :closable="false" class="hint">
      본인의 권한은 수정할 수 없습니다.
    </el-alert>

    <div class="auth-list">
      <div v-for="auth in authList" :key="auth.id" class="auth-item">
        <span>{{ auth.description }}</span>
        <el-switch :disabled="isMyself" v-model="auth.enabled" />
      </div>
    </div>

    <el-button type="primary" :disabled="!isChanged" @click="save" class="save-btn">
      저장
    </el-button>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import api from "@/api/axios";
import { useAuthStore } from "@/store/auth.store";

const props = defineProps({
  employee: {
    type: Object,
    required: false,
  },
  authMaster: {
    type: Array,
    required: false,
    default: () => [],
  },
});

const emit = defineEmits(["updateEmployee"]);
const authList = ref([]);
const originalAuthIds = ref([]);

const authStore = useAuthStore();
const myEmpId = computed(() => authStore.id);
const isMyself = computed(() => {
  return props.employee && props.employee.id === myEmpId.value;
});

watch(
  () => [props.employee, props.authMaster],
  ([emp, authMaster]) => {
    if (!emp || !authMaster || !Array.isArray(authMaster)) {
      return; // 🔒 안전 가드
    }

    const ownedIds = emp.empAuth.map(a => a.auth_id);

    authList.value = authMaster.map(auth => ({
      id: auth.id,
      description: auth.description,
      enabled: ownedIds.includes(auth.id),
    }));

    originalAuthIds.value = [...ownedIds].sort();
  },
  { immediate: true }
);

const isChanged = computed(() => {
  const current = authList.value.filter(a => a.enabled).map(a => a.id).sort();
  return JSON.stringify(current) !== JSON.stringify(originalAuthIds.value);
});

const save = async () => {
  try{
  const enabledIds = authList.value
    .filter(a => a.enabled)
    .map(a => a.id);

  await api.put("/emp/admin/auth/modify", {
    emp_id: props.employee.id,
    auth_id: enabledIds,
  });

  emit("updateEmployee", {
    id: props.employee.id,
    empAuth: enabledIds.map(id => ({ auth_id: id })),
  });

  originalAuthIds.value = [...enabledIds].sort();
  ElMessage.success("수정 완료되었습니다.");
}catch(e){
  ElMessage.warning(e.response.data)
}
};

</script>

<style scoped>
.auth-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hint {
  margin: 12px 0;
}

.auth-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.auth-item {
  display: flex;
  justify-content: space-between;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.save-btn {
  margin-top: 12px;
}
</style>
