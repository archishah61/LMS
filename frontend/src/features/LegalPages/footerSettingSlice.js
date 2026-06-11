import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    footerSetting: {
        address: '',
        phone: '',
        email: '',
        timing: ''
    }
};

export const footerSettingSlice = createSlice({
    name: "footer_setting_info",
    initialState,
    reducers: {
        setFooterSettingInfo: (state, action) => {
            state.footerSetting = action.payload;
        },
        unsetFooterSettingInfo: (state) => {
            state.footerSetting = {
                address: '',
                phone: '',
                email: '',
                timing: ''
            };
        },
    },
});

export const { setFooterSettingInfo, unsetFooterSettingInfo } = footerSettingSlice.actions;

export default footerSettingSlice.reducer;
