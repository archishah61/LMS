import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  cities: null, // Store all cities
  selectedCity: null, // Store a single city by ID
};

export const citySlice = createSlice({
  name: "city",
  initialState,
  reducers: {
    // ✅ Set All Cities
    setCities: (state, action) => {
      state.cities = action.payload.cities;
    },
    // ✅ Unset All Cities
    unsetCities: (state) => {
      state.cities = null;
    },
    // ✅ Set Single City
    setSelectedCity: (state, action) => {
      state.selectedCity = action.payload.city;
    },
    // ✅ Unset Single City
    unsetSelectedCity: (state) => {
      state.selectedCity = null;
    },
    // ✅ Add new city to the cities list
    addCity: (state, action) => {
      if (state.cities) {
        state.cities.push(action.payload.city);
      } else {
        state.cities = [action.payload.city];
      }
    },
    // ✅ Update city in the cities list
    updateCityInList: (state, action) => {
      if (state.cities) {
        const index = state.cities.findIndex(
          (city) => city.id === action.payload.city.id
        );
        if (index !== -1) {
          state.cities[index] = action.payload.city;
        }
      }
    },
    // ✅ Remove city from the cities list
    removeCityFromList: (state, action) => {
      if (state.cities) {
        state.cities = state.cities.filter(
          (city) => city.id !== action.payload.cityId
        );
      }
    },
  },
});

export const {
  setCities,
  unsetCities,
  setSelectedCity,
  unsetSelectedCity,
  addCity,
  updateCityInList,
  removeCityFromList,
} = citySlice.actions;

export default citySlice.reducer;