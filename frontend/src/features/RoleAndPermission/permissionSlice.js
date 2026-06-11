import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  permissions: null,             // Store all permissions
  selectedPermission: null,      // Store a single selected permission by ID
};

export const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {
    // ✅ Set All Permissions
    setPermissions: (state, action) => {
      state.permissions = action.payload.permissions;
    },

    // ✅ Unset All Permissions
    unsetPermissions: (state) => {
      state.permissions = null;
    },

    // ✅ Set Selected Permission
    setSelectedPermission: (state, action) => {
      state.selectedPermission = action.payload.permission;
    },

    // ✅ Unset Selected Permission
    unsetSelectedPermission: (state) => {
      state.selectedPermission = null;
    },
  },
});

export const {
  setPermissions,
  unsetPermissions,
  setSelectedPermission,
  unsetSelectedPermission,
} = permissionSlice.actions;

export default permissionSlice.reducer;
