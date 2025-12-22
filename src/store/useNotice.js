// src/store/useNotice.js
import { defineStore } from "pinia";
import api from "@/api/axios";

export const useNotificationStore = defineStore("notification", {
  state: () => ({
    contents: [],
    unread: [],
    totalCount: 0,
    paging: {},
    unreadCount: 0,
    selectedIds: new Set(),
    loading: false,
  }),

  getters: {
    selectedCount: (state) => state.selectedIds.size,
    isSelected: (state) => (id) => state.selectedIds.has(id),
  },

  actions: {
    async fetchPage({ empId, size, page, type }) {
      this.loading = true;
      try {
        const res = await api.get("/notice/list", {
          params: { empId, page, size, type }
        });

        this.contents = res.data.contents;
        this.totalCount = res.data.totalCount;
        this.paging = res.data.paging;
      } finally {
        this.loading = false;
      }
    },

    async fetchUnread(empId) {
      const res = await api.get(`/notice/list/new/${empId}`);
      this.unread = res.data;
      this.unreadCount = res.data.length;
    },

    toggleSelect(id) {
      if (this.selectedIds.has(id)) {
        this.selectedIds.delete(id);
      } else {
        this.selectedIds.add(id);
      }
    },

    selectMany(ids) {
      ids.forEach(id => this.selectedIds.add(id));
    },

    unselectMany(ids) {
      ids.forEach(id => this.selectedIds.delete(id));
    },

    clearSelected() {
      this.selectedIds.clear();
    },
  }
});
