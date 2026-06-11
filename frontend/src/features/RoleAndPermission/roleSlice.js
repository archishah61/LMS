import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  roles: null,               // Store all roles
  selectedRole: null,        // Store a single selected role by ID
};

export const roleSlice = createSlice({
  name: "role",
  initialState,
  reducers: {
    // ✅ Set All Roles
    setRoles: (state, action) => {
      state.roles = action.payload.roles;
    },

    // ✅ Unset All Roles
    unsetRoles: (state) => {
      state.roles = null;
    },

    // ✅ Set Selected Role
    setSelectedRole: (state, action) => {
      state.selectedRole = action.payload.role;
    },

    // ✅ Unset Selected Role
    unsetSelectedRole: (state) => {
      state.selectedRole = null;
    },
  },
});

export const {
  setRoles,
  unsetRoles,
  setSelectedRole,
  unsetSelectedRole,
} = roleSlice.actions;

export default roleSlice.reducer;
