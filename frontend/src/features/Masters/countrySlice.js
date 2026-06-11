import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  countries: null, // Store all countries
  selectedCountry: null, // Store a single country by ID
};

export const countrySlice = createSlice({
  name: "country",
  initialState,
  reducers: {
    // ✅ Set All Countries
    setCountries: (state, action) => {
      state.countries = action.payload.countries;
    },
    // ✅ Unset All Countries
    unsetCountries: (state) => {
      state.countries = null;
    },
    // ✅ Set Single Country
    setSelectedCountry: (state, action) => {
      state.selectedCountry = action.payload.country;
    },
    // ✅ Unset Single Country
    unsetSelectedCountry: (state) => {
      state.selectedCountry = null;
    },
  },
});

export const {
  setCountries,
  unsetCountries,
  setSelectedCountry,
  unsetSelectedCountry,
} = countrySlice.actions;

export default countrySlice.reducer;