import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  rolePermissions: null,            // All permissions assigned to a specific role
  selectedRolePermission: null,     // A single role-permission mapping (if needed)
};

export const rolePermissionSlice = createSlice({
  name: "rolePermission",
  initialState,
  reducers: {
    // ✅ Set All Role Permissions
    setRolePermissions: (state, action) => {
      state.rolePermissions = action.payload.rolePermissions;
    },

    // ✅ Unset All Role Permissions
    unsetRolePermissions: (state) => {
      state.rolePermissions = null;
    },

    // ✅ Set Selected Role Permission
    setSelectedRolePermission: (state, action) => {
      state.selectedRolePermission = action.payload.rolePermission;
    },

    // ✅ Unset Selected Role Permission
    unsetSelectedRolePermission: (state) => {
      state.selectedRolePermission = null;
    },
  },
});

export const {
  setRolePermissions,
  unsetRolePermissions,
  setSelectedRolePermission,
  unsetSelectedRolePermission,
} = rolePermissionSlice.actions;

export default rolePermissionSlice.reducer;
