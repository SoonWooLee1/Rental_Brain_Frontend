// src/api/product.js
import api from '@/api/axios';

/**
 * 1) 제품명 목록 조회 (group by name)
 * - 제품 관리 메인 / 드롭다운 / 검색용
 */
export const getProductNameList = () =>
  api.get('/item/read-groupby-name');

/**
 * 2) 제품 상세 조회 (제품명 기준)
 * - 특정 제품명 클릭 시 상세 리스트
 */
export const getProductDetailByName = (productName) =>
  api.get(`/item/read-all/${encodeURIComponent(productName)}`);

/**
 * 3) 제품명 검색
 */
export const searchProductByName = (keyword) =>
  api.get(`/item/search/${encodeURIComponent(keyword)}`);

/**
 * 4) 제품 KPI 카드
 * - 전체 제품 수 / 사용중 / 대기 / 폐기 등
 */
export const getProductKpiCount = () =>
  api.get('/item/kpi-count');

/**
 * 5) 제품 카테고리 필터링
 */
export const filterProductByCategory = (categoryName) =>
  api.get(`/item/filtering/${encodeURIComponent(categoryName)}`);

/**
 * 6) 제품 등록
 */
export const insertProduct = (payload) =>
  api.post('/item/insert', payload);

/**
 * 7) 제품 수정
 */
export const updateProduct = (itemId, payload) =>
  api.put(`/item/update/${itemId}`, payload);

/**
 * 8) 제품 삭제
 */
export const deleteProduct = (itemId) =>
  api.delete(`/item/delete/${itemId}`);
