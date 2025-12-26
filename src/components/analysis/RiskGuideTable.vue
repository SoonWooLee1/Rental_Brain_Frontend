<template>
  <div class="card">
    <table class="guide-table">
      <thead>
        <tr>
          <th>단계</th>
          <th>조건</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><span class="badge ok">정상</span></td>
          <td>≤ 10%</td>
        </tr>
        <tr>
          <td><span class="badge warn">주의</span></td>
          <td>10% ~ 15%</td>
        </tr>
        <tr>
          <td><span class="badge alert">경고</span></td>
          <td>15% ~ 20%</td>
        </tr>
        <tr>
          <td><span class="badge danger">위험</span></td>
          <td>≥ 20%</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
const props = defineProps({
  showTitle: { type: Boolean, default: true },
});

</script>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #eee;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.02);
}

.guide-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.guide-table th,
.guide-table td {
  padding: 10px 8px;
  border-top: 1px solid #e5e7eb;
  text-align: left;
  color: #111827;
}

.guide-table thead th {
  border-top: none;
  color: #6b7280;
  font-weight: 900;
}

.badge {
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 999px;
  font-weight: 900;
  font-size: 11px;
}

.badge.ok { background: #ecfdf5; color: #166534; }
.badge.warn { background: #fff7ed; color: #9a3412; }
.badge.alert { background: #fef2f2; color: #b91c1c; }
.badge.danger { background: #fee2e2; color: #991b1b; }
</style>
