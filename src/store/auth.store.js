import { defineStore } from "pinia";
import { ref, computed } from 'vue'

export const useAuthStore = defineStore(
  "auth", () => {
    const id = ref('');
    const employeeCode = ref('');
    const empId = ref('');
    const auth = ref([]);
    const token = ref('');
    const name = ref('');
    const dept = ref('');
    const positionId = ref('');

    const setUserInfo = (getId, getEmployeeCode, getEmpId, getName, getAuth, getDept, getPositionId, getToken) => {
      id.value = getId
      employeeCode.value = getEmployeeCode
      empId.value = getEmpId
      name.value = getName
      auth.value = getAuth
      dept.value = getDept
      positionId.value = getPositionId
      token.value = getToken
    }

    const logout = () => {
      id.value = ''
      employeeCode.value = ''
      empId.value = ''
      name.value = ''
      auth.value = []
      dept.value = ''
      positionId.value = ''
      token.value = ''
    }

    const hasAuth = (code) => {
      return auth.value.some(p =>
        typeof p === "string"
          ? p === code
          : p.auth === code
      );
    };

    return { id, employeeCode, empId, name, auth, token, dept, positionId ,setUserInfo, logout, hasAuth };
  },
  {
    persist: {
      enabled: true, //storage 저장유무
      storage: sessionStorage
    }
  }
);
