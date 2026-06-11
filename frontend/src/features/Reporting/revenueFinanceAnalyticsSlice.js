import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  revenueByCategory: null,
  customerLifetimeValue: null,
  revenueByPeriod: {
    period_type: "day",
    periodData: [],
    overallStats: {},
  },
};

export const revenueFinanceAnalyticsSlice = createSlice({
  name: "revenue_finance_analytics",
  initialState,
  reducers: {
    setRevenueByCategory: (state, action) => {
      state.revenueByCategory = action.payload.revenueByCategory;
    },
    unsetRevenueByCategory: (state) => {
      state.revenueByCategory = null;
    },

    setCustomerLifetimeValue: (state, action) => {
      state.customerLifetimeValue = action.payload.customerLifetimeValue;
    },
    unsetCustomerLifetimeValue: (state) => {
      state.customerLifetimeValue = null;
    },

    setRevenueByPeriod: (state, action) => {
      state.revenueByPeriod = action.payload.revenueByPeriod;
    },
    unsetRevenueByPeriod: (state) => {
      state.revenueByPeriod = {
        period_type: "day",
        periodData: [],
        overallStats: {},
      };
    },
  },
});

export const {
  setRevenueByCategory,
  unsetRevenueByCategory,
  setCustomerLifetimeValue,
  unsetCustomerLifetimeValue,
  setRevenueByPeriod,
  unsetRevenueByPeriod,
} = revenueFinanceAnalyticsSlice.actions;

export default revenueFinanceAnalyticsSlice.reducer;