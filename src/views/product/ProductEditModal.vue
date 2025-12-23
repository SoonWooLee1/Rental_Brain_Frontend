<template>
  <div class="edit-backdrop" @click.self="emitClose">
    <div class="edit-modal">
      <div class="edit-header">
        <h3>제품 정보 수정</h3>
        <button class="icon-btn" @click="emitClose">✕</button>
      </div>

      <form class="edit-body" @submit.prevent="handleSubmit">
        <!-- 기본 정보 -->
        <div class="form-row">
          <label>제품명</label>
          <input v-model="form.name" type="text" />
        </div>

        <div class="form-row two-col">
          <div>
            <label>월 렌탈료</label>
            <input v-model.number="form.monthlyPrice" type="number" min="0" />
          </div>
          <div>
          <label>카테고리</label>
          <select v-model="form.categoryName">
            <option value="" disabled>카테고리를 선택하세요</option>
            <option
              v-for="c in categoryList"
              :key="c"
              :value="c"
            >
              {{ c }}
            </option>
          </select>
        </div>
        </div>

      </form>

      <div class="edit-footer">
        <button class="secondary-btn" @click="emitClose">
          취소
        </button>
        <button class="primary-btn" @click="handleSubmit">
          저장
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import api from '@/api/axios';

const props = defineProps({
  itemName: {
    type: String,
    required: true,
  },
  monthlyPrice: {
    type: [Number, String],
    required: true,
  },
  categoryName: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "updated"]);

const form = ref({
  name: "",
  monthlyPrice: 0,
  categoryName: "",
});

const categoryList = ref([]);

// 초기값 세팅
function initForm() {
  form.value.name = props.itemName || "";
  form.value.monthlyPrice = Number(props.monthlyPrice) ?? null;
  form.value.categoryName = props.categoryName || "";
  console.log(props.itemName);
  console.log("월렌탈:", Number(props.monthlyPrice));
  console.log('카테고리:', props.categoryName);
}

// 카테고리 목록 조회
async function fetchCategories() {
  try {
    const res = await api.get("/item/category");
    // 응답이 문자열 배열이라고 가정, 필요하면 map 수정
    categoryList.value = res.data.map((c) => c.name);
    console.log("카테고리:", res.data);
  } catch (err) {
    console.error("카테고리 조회 실패", err);
  }
}

function emitClose() {
  emit("close");
}

// 저장 버튼
async function handleSubmit() {
  try {
    const payload = {
      name: form.value.name,
      monthlyPrice: form.value.monthlyPrice,
      categoryName: form.value.categoryName,
    };

    await api.put(`/item/update-name/${props.itemName}`, payload);
    emit("updated", {
      itemName: payload.name,
    });
    emitClose();
  } catch (err) {
    console.error("개별 제품 수정 실패", err);
  }
}

onMounted(async () => {
  initForm();
  await fetchCategories();
});

// unit이 바뀌면 폼 다시 세팅 (다른 행 클릭해서 재사용할 경우 대비)
watch(
  () => props.unit,
  () => {
    initForm();
  },
  { deep: true }
);
</script>

<style scoped>
.edit-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.edit-modal {
  width: 520px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.edit-header {
  padding: 16px 20px;
  border-bottom: 1px solid #edf0f7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.edit-header h3 {
  margin: 0;
  font-size: 18px;
}

.icon-btn {
  border: none;
  background: transparent;
  font-size: 18px;
  cursor: pointer;
}

.edit-body {
  padding: 16px 20px 8px;
  overflow-y: auto;
}

.form-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-row.two-col {
  flex-direction: row;
  gap: 12px;
}

.form-row.two-col > div {
  flex: 1;
  display: flex;
  flex-direction: column;
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

.hint {
  margin-top: 4px;
  font-size: 11px;
  color: #9ca3af;
}

.edit-footer {
  padding: 12px 20px 16px;
  border-top: 1px solid #edf0f7;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.primary-btn {
  background: #248efff2;
  color: #fff;
  border-radius: 8px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}

.secondary-btn {
  background: #f3f4f6;
  color: #374151;
  border-radius: 8px;
  padding: 8px 16px;
  border: none;
  cursor: pointer;
}
</style>