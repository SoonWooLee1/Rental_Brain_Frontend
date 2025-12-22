<template>
    <el-card class="summary-card" 
        :class="{ active }"
    @click="handleClick">

        <div class="card">
        <span class="title">{{ title }}</span>
        <h2>{{ value }}건</h2>
        <small>{{ sub }}</small>
        </div>
    </el-card>
</template>

<script setup>
const props = defineProps({ title: String, value: Number, sub: String, type: String, active: Boolean })

const emit = defineEmits(['click'])

const handleClick = () => { emit('click', props.type) }
</script>

<style scoped>
.summary-card { cursor: pointer; transition: all 0.2s ease; }
.summary-card.active { border: 2px solid #409eff; background-color: #ecf5ff; }
.card { text-align: center; }
.title { color: #666; }
.summary-card.active .title { color: #409eff; }
</style>