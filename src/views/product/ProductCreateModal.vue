<template>
  <div class="create-backdrop" @click.self="emitClose">
    <div class="create-modal">
      <div class="create-header">
        <h3>신규 제품 등록</h3>
        <button class="icon-btn" @click="emitClose">✕</button>
      </div>

      <form class="create-body" @submit.prevent="handleSubmit">
        <div class="form-row">
          <label>제품명</label>
          <input
            v-model="form.name"
            type="text"
            placeholder="예) 노트북 (LG 그램 17)"
          />
        </div>

        <div class="form-row">
          <label>월 렌탈료</label>
          <input
            v-model.number="form.monthlyPrice"
            type="number"
            min="0"
            placeholder="예) 80000"
          />
        </div>

        <div class="form-row">
          <label>카테고리</label>
          <select v-model="form.categoryName">
            <option value="" disabled>카테고리를 선택하세요</option>
            <option
              v-for="c in categoryList"
              :key="c.id"
              :value="c.name"
            >
              {{ c.name }}
            </option>
          </select>
        </div>
      </form>

      <div class="create-footer">
        <button class="secondary-btn" @click="emitClose">
          취소
        </button>
        <button class="primary-btn" @click="handleSubmit">
          등록
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import api from '@/api/axios';

const emit = defineEmits(["close", "success"]);

const form = ref({
  name: "",
  monthlyPrice: null,
  categoryName: "",
});

const categoryList = ref([]);

// 카테고리 목록 조회
async function fetchCategories() {
  try {
    const res = await api.get("/item/category");
    categoryList.value = res.data;
  } catch (err) {
    console.error("카테고리 조회 실패", err);
  }
}

function emitClose() {
  emit("close");
}

// 유효성 체크 간단 예시
function validate() {
  if (!form.value.name.trim()) {
    alert("제품명을 입력하세요.");
    return false;
  }
  if (form.value.monthlyPrice == null || form.value.monthlyPrice < 0) {
    alert("월 렌탈료를 입력하세요.");
    return false;
  }
  if (!form.value.categoryName) {
    alert("카테고리를 선택하세요.");
    return false;
  }
  return true;
}

// 등록
async function handleSubmit() {
  if (!validate()) return;

  try {
    const payload = {
      name: form.value.name,
      monthlyPrice: form.value.monthlyPrice,
      categoryName: form.value.categoryName,
    };

    await api.post('/item/insert', payload);
    emit("success");     // 부모(ProductListView)의 reloadList 실행
    emitClose();
  } catch (err) {
    console.error("제품 등록 실패", err);
  }
}

onMounted(async () => {
  await fetchCategories();
});
</script>

<style scoped>
.create-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.create-modal {
  width: 480px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.create-header {
  padding: 16px 20px;
  border-bottom: 1px solid #edf0f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.create-header h3 {
  margin: 0;
  font-size: 18px;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.create-body {
  padding: 16px 20px 8px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

label {
  font-size: 13px;
  margin-bottom: 4px;
  color: #4b5563;
}

input,
select {
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  font-size: 13px;
}

.create-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #edf0f7;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.primary-btn {
  background: #248efff2;
  color: #fff;
  border-radius: 5px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}

.secondary-btn {
  background: #f3f4f6;
  color: #374151;
  border-radius: 5px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}
</style>