import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    isStatisticModalOpen: false,
    selectedStatistic: null,
};

const frontendStatisticsSlice = createSlice({
    name: "frontendStatistics",
    initialState,
    reducers: {
        setStatisticModalOpen: (state, action) => {
            state.isStatisticModalOpen = action.payload;
        },
        setSelectedStatistic: (state, action) => {
            state.selectedStatistic = action.payload;
        },
    },
});

export const { setStatisticModalOpen, setSelectedStatistic } = frontendStatisticsSlice.actions;

export default frontendStatisticsSlice.reducer;
