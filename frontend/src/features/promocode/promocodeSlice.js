import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    promoCodes: null, // Stores all promo codes
    selectedPromoCode: null, // Stores a single selected promo code
};

export const promoCodeSlice = createSlice({
    name: "promoCode",
    initialState,
    reducers: {
        // Set all promo codes in the state
        setPromoCodes: (state, action) => {
            state.promoCodes = action.payload.promoCodes;
        },
        // Set a single selected promo code in the state
        setSelectedPromoCode: (state, action) => {
            state.selectedPromoCode = action.payload.promoCode;
        },
        // Clear all promo codes from the state
        unsetPromoCodes: (state) => {
            state.promoCodes = null;
        },
        // Clear the selected promo code from the state
        unsetSelectedPromoCode: (state) => {
            state.selectedPromoCode = null;
        },
    },
});

// Export the actions
export const {
    setPromoCodes,
    setSelectedPromoCode,
    unsetPromoCodes,
    unsetSelectedPromoCode,
} = promoCodeSlice.actions;

// Export the reducer
export default promoCodeSlice.reducer;
