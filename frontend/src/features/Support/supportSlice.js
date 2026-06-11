import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  tickets: null, // Store all tickets
  selectedTicket: null, // Store a single ticket by ID
};

export const supportSlice = createSlice({
  name: "support",
  initialState,
  reducers: {
    // ✅ Set All Tickets
    setTicketsInfo: (state, action) => {
      state.tickets = action.payload.tickets;
    },
    // ✅ Unset All Tickets
    unsetTicketsInfo: (state) => {
      state.tickets = null;
    },
    // ✅ Set Selected Ticket
    setSelectedTicket: (state, action) => {
      state.selectedTicket = action.payload.ticket;
    },
    // ✅ Unset Selected Ticket
    unsetSelectedTicket: (state) => {
      state.selectedTicket = null;
    },
  },
});

export const {
  setTicketsInfo,
  unsetTicketsInfo,
  setSelectedTicket,
  unsetSelectedTicket,
} = supportSlice.actions;

export default supportSlice.reducer;
