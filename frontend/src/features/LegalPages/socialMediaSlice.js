import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    socialMedia: {
        linkedin: '',
        facebook: '',
        twitter: '',
        youtube: '',
        instagram: ''
    }
};

export const socialMediaSlice = createSlice({
    name: "social_media_info",
    initialState,
    reducers: {
        setSocialMediaInfo: (state, action) => {
            state.socialMedia = action.payload;
        },
        unsetSocialMediaInfo: (state) => {
            state.socialMedia = {
                linkedin: '',
                facebook: '',
                twitter: '',
                youtube: '',
                instagram: ''
            };
        },
    },
});

export const { setSocialMediaInfo, unsetSocialMediaInfo } = socialMediaSlice.actions;

export default socialMediaSlice.reducer;
