import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  contacts: null,
};

export const contactSlice = createSlice({
  name: "contact_info",
  initialState,
  reducers: {
    setContacts: (state, action) => {
      state.contacts = action.payload.contacts;
    },
    unsetContacts: (state) => {
      state.contacts = null;
    },
  },
});

export const { setContacts, unsetContacts } = contactSlice.actions;

export default contactSlice.reducer;
