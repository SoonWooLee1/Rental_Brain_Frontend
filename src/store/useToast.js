import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useToastStore = defineStore('toast', ()=>{
  
    const message= ref('')
    const show= ref(false)
    const timer = ref(null)
  
  const showToast = (msg) =>{
      message.value = msg
      show.value = true
      if(timer.value)clearTimeout(timer.value)
      timer.value = setTimeout(() => {
    show.value = false
    timer.value = null;
    }, 3000)
      
    }
    const pauseToast = ()=> {
      // 마우스 올렸을 때 타이머 중지
      if (timer.value) {
        clearTimeout(timer.value)
        timer.value = null
      }
    }
    const resumeToast = ()=>{
      // 마우스 나갔을 때 다시 타이머 시작
      if (!timer.value) {
        timer.value = setTimeout(() => {
          show.value = false
          timer.value = null
        }, 2000)
      }
    }
    
  return {message,show,showToast,pauseToast,resumeToast}
})