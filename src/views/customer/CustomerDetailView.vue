<template>
    <div class="page">
    <h1>고객 상세</h1>
    <p>고객 ID: {{ id }}</p>
    </div>
</template>

<script setup>
import { useRoute } from "vue-router"

const route = useRoute()
const id = route.params.id
</script>
