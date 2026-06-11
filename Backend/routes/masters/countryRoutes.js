const express = require('express');
const router = express.Router();
const {
  createCountry,
  updateCountry,
  getAllCountries,
  getCountryById,
  toggleCountryStatus,
  deleteCountry,
  getAllActiveCountries,
} = require('../../controllers/masters/countryController'); // Adjust path as needed
const protect = require('../../middleware/protectMiddleware');
const checkPermission = require('../../middleware/permissionMiddleware');

// Route to create a new country
router.post('/create', protect, checkPermission("Country","create"), createCountry);

// Route to update a country
router.put('/update/:id', protect, checkPermission("Country","edit"), updateCountry);

// Route to get all countries
router.get('/all', getAllCountries);

router.get('/all-active', getAllActiveCountries);

// Route to get a country by ID
router.get('/:id', getCountryById);

// Route to toggle the status of a country (active/inactive)
router.patch('/toggle-status/:id', protect, checkPermission("Country","toggle"), toggleCountryStatus);

// Route to delete a country by ID
router.delete('/delete/:id', protect, checkPermission("Country","delete"), deleteCountry);

module.exports = router;
