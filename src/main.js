import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from "./router";

import { createPinia } from "pinia";
import piniaPersistedstate from 'pinia-plugin-persistedstate'
// Element Plus
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";

// 아이콘
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

// ECharts
import VueECharts from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPersistedstate);
app.use(pinia);

// 모든 Element Plus 아이콘을 전역으로 등록
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component);
}

// ElementPlus 전역 적용
app.use(ElementPlus);
app.component('v-chart', VueECharts)
app.use(router);

app.mount("#app");
