<template>
  <div class="edit-panel">
    <div class="header">
      <h3>회원 정보 수정</h3>
    </div>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">

      <!-- 사번 (readonly) -->
      <el-form-item label="아이디">
        <el-input v-model="form.empId" disabled />
      </el-form-item>

      <!-- 비밀번호 (초기값 = empId) -->
      <el-form-item label="비밀번호">
        <el-input v-model="form.pwd" type="password" show-password />
      </el-form-item>

      <!-- 이름 -->
      <el-form-item label="이름">
        <el-input v-model="form.name" />
      </el-form-item>

      <!-- 전화번호 -->
      <el-form-item label="전화번호">
        <el-input v-model="form.phone" />
      </el-form-item>

      <!-- 이메일 -->
      <el-form-item label="이메일">
        <el-input v-model="form.email" />
      </el-form-item>

      <!-- 주소 -->
      <el-form-item label="주소">
        <el-input v-model="form.addr" />
      </el-form-item>

      <!-- 생년월일 -->
      <el-form-item label="생년월일">
        <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <!-- 성별 -->
      <el-form-item label="성별">
        <el-radio-group v-model="form.gender">
          <el-radio label="M">남</el-radio>
          <el-radio label="F">여</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 재직 상태 -->
      <el-form-item label="재직 상태">
        <el-select v-model="form.status" style="width: 100%">
          <el-option label="재직" value="W" />
          <el-option label="퇴사" value="Q" />
        </el-select>
      </el-form-item>

      <!-- 부서 -->
      <el-form-item label="부서">
        <el-input v-model="form.dept" />
      </el-form-item>

      <!-- 입사일 -->
      <el-form-item label="입사일">
        <el-date-picker v-model="form.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
      </el-form-item>

      <!-- 퇴사일 -->
      <el-form-item label="퇴사일" prop="resignDate">
        <el-date-picker v-model="form.resignDate" type="date" value-format="YYYY-MM-DD" style="width: 100%"
          :disabled="form.status !== 'Q'" />
      </el-form-item>

      <!-- 직급 -->
      <el-form-item label="직급">
        <el-select v-model="form.positionId" style="width: 100%">
          <el-option v-for="(name, id) in props.positionMap" :key="id" :label="name" :value="String(id)" />
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="save">
          저장
        </el-button>
      </el-form-item>

    </el-form>
  </div>
</template>

<script setup>
import { reactive, watch, ref } from "vue";
import { ElMessage } from "element-plus";
import api from "@/api/axios";

const formRef = ref();

const rules = {
  resignDate: [
    {
      validator: (rule, value, callback) => {
        if (form.status === "Q" && !value) {
          callback(new Error("퇴사일을 선택해주세요"));
        } else {
          callback();
        }
      },
      trigger: ["change", "blur"]
    }
  ]
};

const props = defineProps({
  employee: {
    type: Object,
    required: true
  },
  positionMap: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(["updateEmployee"]);

const form = reactive({
  empId: "",
  pwd: "",
  name: "",
  phone: "",
  email: "",
  addr: "",
  birthday: "",
  gender: "",
  status: "",
  dept: "",
  hireDate: "",
  resignDate: null,
  positionId: ""
});

watch(
  () => form.status,
  (status) => {
    if (status !== "Q") {
      form.resignDate = null;
    }
  }
);

/* 🔁 props → form 매핑 */
watch(
  () => props.employee,
  (emp) => {
    if (!emp) return;

    form.empId = emp.emp_id;
    form.pwd = emp.emp_id; // 기본값
    form.name = emp.name;
    form.phone = emp.phone;
    form.email = emp.email;
    form.addr = emp.addr;
    form.birthday = emp.birthday?.substring(0, 10);
    form.gender = emp.gender;
    form.status = emp.status;
    form.dept = emp.dept;
    form.hireDate = emp.hire_date?.substring(0, 10);
    form.resignDate = emp.resign_date?.substring(0, 10) || null;
    form.positionId = String(emp.position?.position_id);
  },
  { immediate: true }
);

/* 💾 저장 */
const save = async () => {
  formRef.value.validate(async (valid) => {
    if (!valid) {
      // ❌ 퇴사인데 퇴사일 없으면 여기서 막힘
      return;
    }
    try {
      const payload = { ...form };
      console.log(payload);

      await api.put("/emp/admin/info/modify", payload);

      emit("updateEmployee", {
        id: props.employee.id,
        ...payload,
        position: {
          position_id: payload.positionId,
          position_name: props.employee.position?.position_name
        }
      });

      ElMessage.success("회원 정보가 수정되었습니다");
    } catch (e) {
      ElMessage.warning(e.response.data)
    }
  });
};
</script>

<style scoped>
.edit-panel {
  max-width: 520px;
  margin: 0 auto;
  /* ✅ 가로 중앙 */
}

.header {
  margin-bottom: 16px;
  text-align: center;
}

.header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}
</style>
