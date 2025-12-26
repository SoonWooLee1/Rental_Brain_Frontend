<template>
  <div class="header-actions">
    <div class="seg-toggle">
      <button class="seg-btn" :class="{ active: mode === 'this' }" @click="setThisMonth">
        이번 달
      </button>
      <button class="seg-btn" :class="{ active: mode === 'prev' }" @click="setPrevMonth">
        전월
      </button>
      <button class="seg-btn" :class="{ active: mode === 'pick' }" @click="mode = 'pick'">
        선택 월
      </button>
    </div>

    <div v-if="mode === 'pick'" class="month-pick">
      <input type="month" v-model="pickedMonth" class="month-input" />
      <button class="apply-btn" @click="applyPickedMonth">적용</button>
    </div>

    <div class="month-badge">{{ labelMonth }} 기준</div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

const props = defineProps({
  /** 화면에 표시할 기준월(백엔드가 내려주는 targetMonth 같은 값이 있으면 그걸 넣기) */
  displayMonth: { type: String, default: "" },
});

const route = useRoute();
const router = useRouter();

const ym = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const addMonths = (baseYM, diff) => {
  const [y, m] = String(baseYM).split("-").map(Number);
  return ym(new Date(y, (m - 1) + diff, 1));
};

const now = new Date();
const defaultMonth = ym(now);

const month = computed(() => route.query.month ?? defaultMonth);

const mode = ref("this");
const pickedMonth = ref("");

const setMonthQuery = (m) => {
  router.replace({ query: { ...route.query, month: m } });
};

const setThisMonth = () => {
  mode.value = "this";
  const m = ym(new Date());
  pickedMonth.value = m;
  setMonthQuery(m);
};

const setPrevMonth = () => {
  mode.value = "prev";
  const m = addMonths(ym(new Date()), -1);
  pickedMonth.value = m;
  setMonthQuery(m);
};

const applyPickedMonth = () => {
  mode.value = "pick";
  if (!pickedMonth.value) return;
  setMonthQuery(pickedMonth.value);
};

watch(
  month,
  (m) => {
    const thisM = ym(new Date());
    const prevM = addMonths(thisM, -1);

    if (m === thisM) mode.value = "this";
    else if (m === prevM) mode.value = "prev";
    else mode.value = "pick";

    pickedMonth.value = m;
  },
  { immediate: true }
);

/** 배지에 표시할 월: (백엔드 targetMonth 우선) -> query.month */
const labelMonth = computed(() => props.displayMonth || month.value);
</script>

<style scoped>
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.seg-toggle {
  display: inline-flex;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.seg-btn {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  color: #374151;
  background: transparent;
  border: 0;
  cursor: pointer;
}
.seg-btn + .seg-btn {
  border-left: 1px solid #e5e7eb;
}
.seg-btn.active {
  background: #111827;
  color: #fff;
}

.month-pick {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.month-input {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 700;
}

.apply-btn {
  border: 1px solid #111827;
  background: #111827;
  color: #fff;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.month-badge {
  font-size: 12px;
  font-weight: 900;
  color: #111827;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  border-radius: 999px;
}
</style>
