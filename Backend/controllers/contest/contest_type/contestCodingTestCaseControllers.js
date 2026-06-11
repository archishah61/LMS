const { callProcedure } = require("../../../utils/procedure/callProcedure");

exports.createTestCase = async (req, res, next) => {
  try {
    const { coding_id, input, expected_output, is_public, order } = req.body;

    const { success, data, error } = await callProcedure("CreateContestCodingTestCase", [
      coding_id, input, expected_output, is_public || false, order || 0, req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(201).json({ success: true, testCase: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { input, expected_output, is_public, order } = req.body;

    const { success, data, error } = await callProcedure("UpdateContestCodingTestCase", [
      id, input || null, expected_output || null, is_public, order || null, req?.user?.id || 1
    ]);

    if (!success) return next(error);

    res.status(200).json({ success: true, testCase: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.toggleTestCaseStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { success, data, error } = await callProcedure("ToggleContestCodingTestCaseStatus", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, testCase: data[0] });
  } catch (error) {
    next(error);
  }
};

exports.deleteTestCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { success, error } = await callProcedure("DeleteContestCodingTestCase", [id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, message: "Test case deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getTestCases = async (req, res, next) => {
  try {
    const { coding_id } = req.params;

    const { success, data, error } = await callProcedure("GetContestCodingTestCases", [coding_id]);

    if (!success) return next(error);

    res.status(200).json({ success: true, testCases: data });
  } catch (error) {
    next(error);
  }
};
