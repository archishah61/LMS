const express = require('express');
const router = express.Router();
const {
  createCity,
  updateCity,
  getAllCities,
  getCityById,
  toggleCityStatus,
  deleteCity,
  getAllActiveCities,
} = require('../../controllers/masters/cityController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Route to create a new city
router.post('/create', protect, checkPermission("City","create"), createCity);

// Route to update a city
router.put('/update/:id', protect, checkPermission("City","edit"), updateCity);

// Route to get all cities
router.get('/all', getAllCities);

router.get('/all-active', getAllActiveCities);

// Route to get a city by ID
router.get('/:id', getCityById);

// Route to toggle the status of a city (active/inactive)
router.patch('/toggle-status/:id', protect, checkPermission("City","toggle"), toggleCityStatus);

// Route to delete a city by ID
router.delete('/delete/:id', protect, checkPermission("City","delete"), deleteCity);

module.exports = router;
