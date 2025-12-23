<template>
    <div class="create-panel">
        <div class="header">
            <h3>사원 등록</h3>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
            <!-- 아이디 -->
            <el-form-item label="사원 아이디" prop="empId">
                <el-input v-model="form.empId" placeholder="숫자, 문자 조합으로 작성해주십시오." />
            </el-form-item>

            <!-- 비밀번호 -->
            <el-form-item label="비밀번호" prop="pwd">
                <el-input v-model="form.pwd" type="password" show-password />
            </el-form-item>

            <!-- 이름 -->
            <el-form-item label="이름" prop="name">
                <el-input v-model="form.name" />
            </el-form-item>

            <!-- 전화번호 -->
            <el-form-item label="전화번호" prop="phone">
                <el-input v-model="form.phone" placeholder="하이픈 없이 작성해주십시오." />
            </el-form-item>

            <!-- 이메일 -->
            <el-form-item label="이메일" prop="email">
                <el-input v-model="form.email" placeholder="example@email.com" />
            </el-form-item>

            <!-- 주소 -->
            <el-form-item label="주소" prop="addr">
                <el-input v-model="form.addr" />
            </el-form-item>

            <!-- 생년월일 -->
            <el-form-item label="생년월일" prop="birthday">
                <el-date-picker v-model="form.birthday" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>

            <!-- 성별 -->
            <el-form-item label="성별" prop="gender">
                <el-radio-group v-model="form.gender">
                    <el-radio label="M">남</el-radio>
                    <el-radio label="F">여</el-radio>
                </el-radio-group>
            </el-form-item>

            <!-- 부서 -->
            <el-form-item label="부서" prop="dept">
                <el-input v-model="form.dept" />
            </el-form-item>

            <!-- 입사일 -->
            <el-form-item label="입사일" prop="hireDate">
                <el-date-picker v-model="form.hireDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
            </el-form-item>

            <!-- 직급 -->
            <el-form-item label="직급" prop="positionId">
                <el-select v-model="form.positionId" style="width: 100%">
                    <el-option v-for="(name, id) in positionMap" :key="id" :label="name" :value="Number(id)" />
                </el-select>
            </el-form-item>

            <!-- 버튼 -->
            <el-form-item>
                <div class="button-row">
                    <el-button type="primary" class="submit-btn" round @click="save">
                        등록
                    </el-button>
                </div>
                </el-form-item>
        </el-form>
    </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { useRouter } from "vue-router";
import api from "@/api/axios";

const router = useRouter();

const props = defineProps({
    positionMap: {
        type: Object,
        required: true
    }
});

const formRef = ref();

const form = reactive({
    empId: "",
    pwd: "",
    name: "",
    phone: "",
    email: "",
    addr: "",
    birthday: "",
    gender: "",
    dept: "",
    hireDate: "",
    positionId: ""
});

const rules = {
    empId: [{ required: true, message: "아이디는 필수입니다", trigger: "blur" },
    {
        pattern: /^[a-zA-Z0-9._-]+$/,
        message: "아이디 형식이 올바르지 않습니다.",
        trigger: "blur"
    }
    ],
    pwd: [{ required: true, message: "비밀번호는 필수입니다", trigger: "blur" }],
    name: [{ required: true, message: "이름은 필수입니다", trigger: "blur" }],
    phone: [{ required: true, message: "전화번호는 필수입니다", trigger: "blur" },
    {
        pattern: /^01[0-9]?\d{3,4}?\d{4}$/,
        message: "연락처 형식이 올바르지 않습니다",
        trigger: "blur"
    }
    ],
    email: [
        { required: true, message: "이메일은 필수입니다", trigger: "blur" },
        {
            pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            message: "이메일 형식이 올바르지 않습니다",
            trigger: "blur"
        }
    ],
    addr: [{ required: true, message: "주소는 필수입니다", trigger: "blur" }],
    birthday: [{ required: true, message: "생년월일은 필수입니다", trigger: "blur" }],
    gender: [{ required: true, message: "성별은 필수입니다", trigger: "blur" }],
    dept: [{ required: true, message: "부서는 필수입니다", trigger: "blur" }],
    hireDate: [{ required: true, message: "입사일은 필수입니다", trigger: "blur" }],
    positionId: [{ required: true, message: "직급을 선택해주세요", trigger: "change" }]
};

const save = async () => {
    formRef.value.validate(async (valid) => {
        if (!valid) return;

        try {
            await api.post("/emp/admin/signup", {
                ...form,
                positionId: Number(form.positionId)
            });

            ElMessage.success("사원이 등록되었습니다");

            // 등록 후 목록으로
            router.push("/admin/menus");
            // 또는 바로 수정 화면
            // router.push(`/admin/menus/${newEmpId}/edit`);
        } catch (e) {
            ElMessage.warning(e.response?.data)
        }
    });
};
</script>


<style scoped>
.create-panel {
    max-width: 520px;
    margin: 0 auto;
}

.header {
    margin-bottom: 16px;
    text-align: center;
}

.button-row {
    width: 100%;
    display: flex;
    justify-content: center;
}

.submit-btn {
    margin-top: 20px;
    width: 180px;
    height: 44px;
    font-size: 16px;
}
</style>
