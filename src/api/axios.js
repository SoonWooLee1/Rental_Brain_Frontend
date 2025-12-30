import { useAuthStore } from '@/store/auth.store';
import { useToastStore } from '@/store/useToast';
import axios from 'axios'

const api = axios.create({
    // baseURL: import.meta.env.VITE_API_BASE_URL,
    baseURL: 'http://localhost:5000',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
})

// JWT 토큰 자동 첨부
api.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore();
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }
        return config
    },
    (e) => {
        console.log('오류: ', e.message);
        toastStore.showToast('오류가 발생했습니다: '+ e.message);
        return Promise.reject(e)
    }
)

// 토큰 재발급
api.interceptors.response.use(
    response => response,
    async (e) => {
        console.log('인터셉터 호출')
        const authStore = useAuthStore();
        const toastStore = useToastStore();
        const originalRequest = e.config;

        // 무한 루프 방지
        if (originalRequest._retry) {
            return Promise.reject(e);
        }

        if (e.response?.status === 401) {
            if(e.response?.data?.message !== "access token expired"){
                return Promise.reject(e);
            }
            
            console.log('엑세스 토큰 만료')
            originalRequest._retry = true;

            try {
                const response = await api.post('/auth/validate');

                const data = response.data;

                console.log("엑세스 토큰 재발급");
                authStore.token = data.accessToken;
                return api(originalRequest);
            }
            catch (error) {
                console.log('오류: ', error.message);
                toastStore.showToast('오류가 발생했습니다: '+ error.message);
            }
        }
        console.log('오류:', e.message);
        toastStore.showToast('오류가 발생했습니다: '+ e.message);
        return Promise.reject(e);
    }
)

export default api