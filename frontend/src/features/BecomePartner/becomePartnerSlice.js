import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    partners: null,
    currentPartner: null,
    partnerTypes: null,
};

export const partnerSlice = createSlice({
    name: "partner_info",
    initialState,
    reducers: {
        setPartnerInfo: (state, action) => {
            if (action.payload.partners !== undefined) {
                state.partners = action.payload.partners;
            }
            if (action.payload.currentPartner !== undefined) {
                state.currentPartner = action.payload.currentPartner;
            }
            if (action.payload.partnerTypes !== undefined) {
                state.partnerTypes = action.payload.partnerTypes;
            }
        },
        unsetPartnerInfo: (state, action) => {
            if (action.payload.partners !== undefined) {
                state.partners = null;
            }
            if (action.payload.currentPartner !== undefined) {
                state.currentPartner = null;
            }
            if (action.payload.partnerTypes !== undefined) {
                state.partnerTypes = null;
            }
        },
    },
});

export const { setPartnerInfo, unsetPartnerInfo } = partnerSlice.actions;

export default partnerSlice.reducer;