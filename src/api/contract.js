import api from './axios'

//고객 리스트 조회
export const getContractList = (params) => {
  return api.get('/contract/list', { params })
}

export const getContractStatus = () => {
  return api.get('/contract/status')
}

