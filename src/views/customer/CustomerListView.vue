<template>
    <div class="page">
    <h1>고객 목록</h1>

    <div v-if="loading">로딩중...</div>

    <table v-else>
        <thead>
        <tr>
            <th>ID</th><th>고객명</th><th>연락처</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="c in customers" :key="c.id" @click="goDetail(c.id)">
            <td>{{ c.id }}</td>
            <td>{{ c.name }}</td>
            <td>{{ c.phone }}</td>
        </tr>
        </tbody>
    </table>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"

const router = useRouter()
const customers = ref([])
const loading = ref(true)

onMounted(async () => {
  // TODO: API 연동 변경
    customers.value = [
    { id: 1, name: "ABC Corp", phone: "010-1234-5678" }
    ]
    loading.value = false
})

function goDetail(id) {
    router.push(`/customers/${id}`)
}
</script>
