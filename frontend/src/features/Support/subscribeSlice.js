import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    subscriptions: null,
};

export const subscribeSlice = createSlice({
    name: "subscribe_info",
    initialState,
    reducers: {
        setSubscriptions: (state, action) => {
            state.subscriptions = action.payload.subscriptions;
        },
        unsetSubscriptions: (state) => {
            state.subscriptions = null;
        },
    },
});

export const { setSubscriptions, unsetSubscriptions } = subscribeSlice.actions;

export default subscribeSlice.reducer;
