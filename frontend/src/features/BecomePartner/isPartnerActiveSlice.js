// redux/slices/partnerActiveSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    partnerStatus: null,   // status of a single partner (Active/Inactive)
    currentPartnerId: null, // store the currently selected partner id
};

export const partnerActiveSlice = createSlice({
    name: "partner_active",
    initialState,
    reducers: {
        setPartnerActiveInfo: (state, action) => {
            if (action.payload.partnerStatus !== undefined) {
                state.partnerStatus = action.payload.partnerStatus;
            }
            if (action.payload.currentPartnerId !== undefined) {
                state.currentPartnerId = action.payload.currentPartnerId;
            }
        },
        unsetPartnerActiveInfo: (state, action) => {
            if (action.payload.partnerStatus !== undefined) {
                state.partnerStatus = null;
            }
            if (action.payload.currentPartnerId !== undefined) {
                state.currentPartnerId = null;
            }
        },
    },
});

export const { setPartnerActiveInfo, unsetPartnerActiveInfo } = partnerActiveSlice.actions;

export default partnerActiveSlice.reducer;
