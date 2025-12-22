import axios from '@/api/axios'

export const fetchAsDetail = (asId) => {
    return axios.get(`/as/${asId}`)
}