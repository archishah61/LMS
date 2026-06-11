import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  admins: null, // Store all admins
  selectedAdmin: null, // Store a single admin by ID
  adminPermissions: null, // Store admin permissions
};

export const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    // ✅ Set All Admins
    setAdmins: (state, action) => {
      state.admins = action.payload.admins;
    },
    // ✅ Unset All Admins
    unsetAdmins: (state) => {
      state.admins = null;
    },
    // ✅ Set Single Admin
    setSelectedAdmin: (state, action) => {
      state.selectedAdmin = action.payload.admin;
    },
    // ✅ Unset Single Admin
    unsetSelectedAdmin: (state) => {
      state.selectedAdmin = null;
    },
    // ✅ Set Admin Permissions
    setAdminPermissions: (state, action) => {
      state.adminPermissions = action.payload.adminPermissions;
    },
    // ✅ Unset Admin Permissions
    unsetAdminPermissions: (state) => {
      state.adminPermissions = null;
    },
  },
});

export const {
  setAdmins,
  unsetAdmins,
  setSelectedAdmin,
  unsetSelectedAdmin,
  setAdminPermissions,
  unsetAdminPermissions,
} = adminSlice.actions;

export default adminSlice.reducer;