const express = require("express");
const router = express.Router();
const assignmentsController = require("../../controllers/content_management/assignmentsController");
const matchingQuestionController = require("../../controllers/content_management/matchingQuestionController");
const trueFalseQuestionController = require("../../controllers/content_management/trueFalseQuestionController");
const fillTheBlanksController = require("../../controllers/content_management/fillTheBlanksController");
const upload = require("../../config/multerConfig");
const protect = require("../../middleware/protectMiddleware");
const checkPermission = require("../../middleware/permissionMiddleware");

// Assignment Routes
router.post( // ✅ (Tested)
  "/create",
  protect,
  checkPermission("Assignment", "create"),
  upload.fields([
    { name: "assignmentFile", maxCount: 1 },
    { name: "assignmentSubmissionFile", maxCount: 1 },

    // Handle multiple matching option images dynamically
    ...Array.from({ length: 10 }, (_, qIndex) =>
      Array.from({ length: 10 }, (_, oIndex) => ({
        name: `matching_option_image_${qIndex}_${oIndex}`,
        maxCount: 1,
      }))
    ).flat(),

    ...Array.from({ length: 10 }, (_, qIndex) =>
      Array.from({ length: 10 }, (_, oIndex) => ({
        name: `matching_match_image_${qIndex}_${oIndex}`,
        maxCount: 1,
      }))
    ).flat(),
  ]),
  assignmentsController.createAssignment
);

router.get("/", protect, checkPermission("Assignment", "view"), assignmentsController.getAssignments); //✅ (Tested)
router.get("/module/:moduleId", protect, checkPermission("Assignment", "view"), assignmentsController.getAssignmentsByModuleId); // ✅ (Tested)
router.get("/active-assignment/module/:moduleId", protect, checkPermission("Assignment", "view"), assignmentsController.getActiveAssignmentsByModuleId); // ✅ (Tested)
router.get("/byId/:assignmentId", assignmentsController.getAssignmentsByAssignmentId)
router.get("/:id", protect, checkPermission("Assignment", "view"), assignmentsController.getAssignmentById); // ✅ (Tested)
router.put(
  "/update/:id",
  protect,
  checkPermission("Assignment", "edit"),
  upload.fields([
    { name: "assignmentFile", maxCount: 1 },
    { name: "assignmentSubmissionFile", maxCount: 1 },

    // Handle multiple matching option images dynamically
    ...Array.from({ length: 10 }, (_, qIndex) =>
      Array.from({ length: 10 }, (_, oIndex) => ({
        name: `matching_option_image_${qIndex}_${oIndex}`,
        maxCount: 1,
      }))
    ).flat(),

    ...Array.from({ length: 10 }, (_, qIndex) =>
      Array.from({ length: 10 }, (_, oIndex) => ({
        name: `matching_match_image_${qIndex}_${oIndex}`,
        maxCount: 1,
      }))
    ).flat(),
  ]),
  assignmentsController.updateAssignment
);
// Matching Question Routes
router.post(
  "/matching/create",
  protect,
  checkPermission("Matching Question", "create"),
  upload.fields([
    // Update to handle dynamic option and match images based on index
    ...Array.from({ length: 20 }, (_, index) => ({
      name: `option_images[${index}]`,
      maxCount: 1,
    })),
    ...Array.from({ length: 20 }, (_, index) => ({
      name: `match_images[${index}]`,
      maxCount: 1,
    })),
  ]),
  matchingQuestionController.createMatchingQuestion
);
router.get(
  "/matching/:assignmentId",
  protect,
  checkPermission("Matching Question", "view"),
  matchingQuestionController.getMatchingQuestionsByAssignmentId
);
router.put(
  "/matching/update/:id",
  protect,
  checkPermission("Matching Question", "edit"),
  upload.fields([
    // Update to handle dynamic option and match images based on index
    ...Array.from({ length: 20 }, (_, index) => ({
      name: `option_images[${index}]`,
      maxCount: 1,
    })),
    ...Array.from({ length: 20 }, (_, index) => ({
      name: `match_images[${index}]`,
      maxCount: 1,
    })),
  ]),
  matchingQuestionController.updateMatchingQuestion
);
router.delete(
  "/matching/delete/:id",
  protect,
  checkPermission("Matching Question", "delete"),
  matchingQuestionController.deleteMatchingQuestion
);

// True/False Question Routes
router.post(
  "/truefalse/create",
  protect,
  checkPermission("True/False Question", "create"),
  trueFalseQuestionController.createTrueFalseQuestion
);
router.get(
  "/truefalse/:assignmentId",
  protect,
  checkPermission("True/False Question", "view"),
  trueFalseQuestionController.getTrueFalseQuestionsByAssignmentId
);
router.put(
  "/truefalse/update/:id",
  protect,
  checkPermission("True/False Question", "edit"),
  trueFalseQuestionController.updateTrueFalseQuestion
);
router.delete(
  "/truefalse/delete/:id",
  protect,
  checkPermission("True/False Question", "delete"),
  trueFalseQuestionController.deleteTrueFalseQuestion
);

// Fill-in-the-Blank Question Routes
router.post(
  "/filltheblanks/create",
  protect,
  checkPermission("Fill-in-the-Blank Question", "create"),
  fillTheBlanksController.createFillTheBlanksQuestion
);
router.get(
  "/filltheblanks/:assignmentId",
  protect,
  checkPermission("Fill-in-the-Blank Question", "view"),
  fillTheBlanksController.getFillTheBlanksQuestionsByAssignmentId
);
router.put(
  "/filltheblanks/update/:id",
  protect,
  checkPermission("Fill-in-the-Blank Question", "edit"),
  fillTheBlanksController.updateFillTheBlanksQuestion
);
router.delete(
  "/filltheblanks/delete/:id",
  protect,
  checkPermission("Fill-in-the-Blank Question", "delete"),
  fillTheBlanksController.deleteFillTheBlanksQuestion
);


module.exports = router;
