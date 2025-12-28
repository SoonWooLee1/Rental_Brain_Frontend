import api from './axios'

/**
 * 사용자 결재 상태
 */
export const getApprovalStatus = () => {
    return api.get('/approval/status')
}

/**
 * 대기 결재 목록
 */
export const getApprovalPending = (pageNum, amount, keyword) => {
    return api.get('/approval/pending', {
      params: { pageNum, amount, keyword: keyword || undefined }
    })
  }
  
  /**
   * 진행 중 결재 목록
   */
  export const getApprovalProgress = (pageNum, amount, keyword) => {
    return api.get('/approval/progress', {
      params: { pageNum, amount , keyword: keyword || undefined }
    })
  }
  
  /**
   * 완료 결재 목록
   */
  export const getApprovalCompleted = (pageNum, amount, keyword) => {
    return api.get('/approval/completed', {
      params: { pageNum, amount, keyword: keyword || undefined }
    })
  }

  /**
   * 결재 승인
   */
  export const approveApproval = (approvalMappingId) => {
    return api.patch(`/approval/approve/${approvalMappingId}`)
  }
  

    /**
   * 결재 반려
   */
  export const rejectApproval = (approvalMappinId, data) => {
    return api.patch(`/approval/reject/${approvalMappinId}`, data)
  }
  