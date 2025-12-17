<script setup>
    import ToastContainer from '@/components/common/ToastContainer.vue';

</script>

<template>
    <router-view />
    <ToastContainer />
</template>

<style>
body {
    margin: 0;
    background: #f7f9fc;
    font-family: 'Inter', 'Pretendard', sans-serif;
}
</style>
