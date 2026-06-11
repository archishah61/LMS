// -------------------------------------PROCEDURE RELATED CODE STARTS---------------------------------

const Validation = require("../../validations");
const { callProcedure } = require("../../utils/procedure/callProcedure");

// // Create Quiz using stored procedure
exports.createQuiz = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { module_id, duration_minutes, ...rest } = req.body;

    // ✅ VALIDATIONS START
    Validation.isString(rest.title, { min: 3, max: 100 }, "Title is required and must be a string.");
    Validation.isInteger(duration_minutes, "Duration Minutes must be a positive integer.");
    Validation.isString(module_id, "Module ID must be a positive integer.");

    if (!('passing_score' in rest)) {
      return res.status(400).json({ message: "Passing Score is required" });
    }
    if (!('max_attempts' in rest)) {
      return res.status(400).json({ message: "Max Attempts is required" });
    }
    if (!('attempts_gap' in rest)) {
      return res.status(400).json({ message: "Attempts Gap is required" });
    }

    Validation.isInteger(rest.passing_score, "Passing Score must be a positive integer.");
    Validation.isInteger(rest.max_attempts, "Max Attempts must be a positive integer.");
    Validation.isInteger(rest.attempts_gap, "Attempts Gap must be a positive integer.");

    Validation.isString(rest.quizType, { min: 3, max: 50 }, "Quiz Type is required and must be a valid string.");

    // ✅ New: validate isQuizCompulsory (boolean 0/1)
    if (!('isQuizCompulsory' in rest)) {
      return res.status(400).json({ message: "isQuizCompulsory flag is required" });
    }
    if (typeof rest.isQuizCompulsory !== "boolean") {
      return res.status(400).json({ message: "isQuizCompulsory must be true or false" });
    }
    // ✅ Warning flags validation
    if (!('isWarning' in rest)) {
      return res.status(400).json({ message: "isWarning flag is required" });
    }
    if (typeof rest.isWarning !== 'boolean') {
      return res.status(400).json({ message: "isWarning must be true or false" });
    }
    if (rest.isWarning) {
      if (!('no_of_warning' in rest)) {
        return res.status(400).json({ message: "no_of_warning is required when isWarning is true" });
      }
      Validation.isInteger(rest.no_of_warning, "no_of_warning must be a positive integer >=1");
      if (parseInt(rest.no_of_warning, 10) < 1) {
        return res.status(400).json({ message: "no_of_warning must be at least 1" });
      }
    } else {
      // ensure at least default
      rest.no_of_warning = 1;
    }
    // ✅ VALIDATIONS END

    const { success, data, error } = await callProcedure("createQuiz", [
      module_id,
      duration_minutes,
      JSON.stringify(rest),
      userId,
      userId,
      role,
      role,
    ]);

    if (!success) return next(error);

    res.status(201).json({
      message: "Quiz created successfully",
      quiz: data[0],
    });
  } catch (error) {
    next(error);
  }
};

// Get Quizzes by Module Hash using stored procedure and callProcedure utility
exports.getQuizByModuleId = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Module ID is required" });
    }

    const { success, data, error } = await callProcedure("getQuizzesByModuleHash", [id]);

    if (!success) {
      return next(error);
    }

    // Directly use the quizzes data (no need to parse)
    const quizzesRaw = data[0]?.quizzes || [];

    if (!quizzesRaw.length) {
      return res.status(404).json({ error: "No quizzes found for this module" });
    }

    // Normalize and calculate totalMarks
    const updatedQuizzes = quizzesRaw.map((quiz) => {
      // List of all possible question type keys
      const questionTypes = [
        "QuizQuestions",
        "RealWordQuestions",
        "BestOptionQuestions",
        "AudioToScriptQuestions",
        "VideoToScriptQuestions",
        "ImageToScriptQuestions",
        "CompleteSentenceQuestions",
        "SummarizePassageQuestions",
        "SpeakingQuestions",
        "DragDropQuestions",
        "QuizPreDefinedQuestions",
        "ArrangeOrderQuestions",
        "VideoPauseQuestions",   // ✅ new
        "AudioPauseQuestions"    // ✅ new
      ];

      // Collect pause question ids
      const pauseQuestionIds = [
        ...(quiz.AudioPauseQuestions || []),
        ...(quiz.VideoPauseQuestions || [])
      ].flatMap(p => p.question_ids.flat()); // flatten nested arrays

      // Sum marks excluding pause-linked question ids
      const quizMarks = questionTypes.reduce((total, type) => {
        const questions = quiz[type] || [];
        return total + questions.reduce((sum, q) => {
          if (pauseQuestionIds.includes(q.id)) return sum; // skip
          return sum + (q.marks || 0);
        }, 0);
      }, 0);

      const predefinedMarks = quiz.QuizPreDefinedQuestions?.reduce((sum, qpq) => {
        return sum + (qpq?.PreDefinedQuestion?.marks || 0);
      }, 0) || 0;

      // Normalize booleans for QuizOptions and PreDefinedOptions
      quiz.QuizQuestions = (quiz.QuizQuestions || []).map((question) => ({
        ...question,
        QuizOptions: (question.QuizOptions || []).map((opt) => ({
          ...opt,
          is_correct: Boolean(opt.is_correct),
        })),
      }));

      quiz.QuizPreDefinedQuestions = (quiz.QuizPreDefinedQuestions || []).map((qpq) => ({
        ...qpq,
        PreDefinedQuestion: {
          ...qpq.PreDefinedQuestion,
          PreDefinedOptions: (qpq.PreDefinedQuestion?.PreDefinedOptions || []).map((opt) => ({
            ...opt,
            is_correct: Boolean(opt.is_correct),
          })),
        },
      }));

      // Normalize CompleteSentences (if they exist)
      quiz.CompleteSentences = (quiz.CompleteSentences || []).map((sentence) => ({
        ...sentence,
      }));

      // Normalize FillInBlankQuestions
      quiz.TextedBasedQuizTexts = (quiz.TextedBasedQuizTexts || []).map((tbq) => ({
        ...tbq,
        FillInBlankQuestions: (tbq.FillInBlankQuestions || []).map((fib) => ({
          ...fib,
        })),
        TrueFalseQuestions: (tbq.TrueFalseQuestions || []).map((tf) => ({
          ...tf,
          correctAnswer: Boolean(tf.correctAnswer), // normalize boolean
        })),
        MultipleChoiceQuestions: (tbq.MultipleChoiceQuestions || []).map((mc) => ({
          ...mc,
        })),
      }));

      const totalMarks = quizMarks + predefinedMarks;

      return {
        ...quiz,
        totalMarks,
        QuizPreDefinedQuestions: quiz.QuizPreDefinedQuestions || [],
        QuizQuestions: quiz.QuizQuestions || [],
        TextedBasedQuizTexts: quiz.TextedBasedQuizTexts || [],
        AudioToScriptQuestions: quiz.AudioToScriptQuestions || [],
        RealWordQuestions: quiz.RealWordQuestions || [],
        DragDropQuestions: quiz.DragDropQuestions || [],
        SpeakingQuestions: quiz.SpeakingQuestions || [],
        SummarizePassageQuestions: quiz.SummarizePassageQuestions || [],
        BestOptionQuestions: quiz.BestOptionQuestions || [],
        VideoPauseQuestions: quiz.VideoPauseQuestions || [],   // ✅ ensure always returned
        AudioPauseQuestions: quiz.AudioPauseQuestions || []    // ✅ ensure always returned
      };
    });

    // Adjust response structure to exactly match the old controller's response
    const formattedQuizzes = updatedQuizzes.map((quiz) => ({
      ...quiz,
      isWarning: !!quiz.isWarning,
      no_of_warning: quiz.no_of_warning || 1,
      QuizPreDefinedQuestions: quiz.QuizPreDefinedQuestions || [],
      QuizQuestions: quiz.QuizQuestions || [],
      TextedBasedQuizTexts: quiz.TextedBasedQuizTexts || [],
      AudioToScriptQuestions: quiz.AudioToScriptQuestions || [],
      RealWordQuestions: quiz.RealWordQuestions || [],
      DragDropQuestions: quiz.DragDropQuestions || [],
      SpeakingQuestions: quiz.SpeakingQuestions || [],
      SummarizePassageQuestions: quiz.SummarizePassageQuestions || [],
      BestOptionQuestions: quiz.BestOptionQuestions || [],
      VideoPauseQuestions: quiz.VideoPauseQuestions || [],   // ✅ normalized
      AudioPauseQuestions: quiz.AudioPauseQuestions || []    // ✅ normalized
    }));

    res.status(200).json(formattedQuizzes);
  } catch (error) {
    next(error);
  }
};

// Get Quiz With Active Question by Module Hash using stored procedure and callProcedure utility
exports.getActiveQuizQuestionByModuleId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "Module ID is required" });
    }

    const { success, data, error } = await callProcedure("getActiveQuizQuestionByModuleHash", [id, userId]);

    if (!success) {
      return next(error);
    }

    // quizzesRaw is already JSON aggregated from the procedure
    const quizzesRaw = data[0]?.quizzes || [];

    if (!quizzesRaw.length) {
      return res.status(404).json({ error: "No quizzes found for this module" });
    }

    // Normalize and calculate totalMarks
    const updatedQuizzes = quizzesRaw.map((quiz) => {
      const quizMarks =
        quiz.QuizQuestions?.reduce((sum, question) => sum + (question.marks || 0), 0) || 0;

      const predefinedMarks =
        quiz.QuizPreDefinedQuestions?.reduce((sum, qpq) => {
          return sum + (qpq?.PreDefinedQuestion?.marks || 0);
        }, 0) || 0;

      // Normalize booleans for QuizOptions and PreDefinedOptions
      quiz.QuizQuestions = (quiz.QuizQuestions || []).map((question) => ({
        ...question,
        QuizOptions: (question.QuizOptions || []).map((opt) => ({
          ...opt,
          is_correct: Boolean(opt.is_correct),
        })),
      }));

      quiz.QuizPreDefinedQuestions = (quiz.QuizPreDefinedQuestions || []).map((qpq) => ({
        ...qpq,
        PreDefinedQuestion: {
          ...qpq.PreDefinedQuestion,
          PreDefinedOptions: (qpq.PreDefinedQuestion?.PreDefinedOptions || []).map((opt) => ({
            ...opt,
            is_correct: Boolean(opt.is_correct),
          })),
        },
      }));

      // Normalize CompleteSentences (if they exist)
      quiz.CompleteSentences = (quiz.CompleteSentences || []).map((sentence) => ({
        ...sentence,
      }));

      // Normalize FillInBlankQuestions, TrueFalse, MCQ in TextBasedQuiz
      quiz.TextedBasedQuizTexts = (quiz.TextedBasedQuizTexts || []).map((tbq) => ({
        ...tbq,
        FillInBlankQuestions: (tbq.FillInBlankQuestions || []).map((fib) => ({
          ...fib,
        })),
        TrueFalseQuestions: (tbq.TrueFalseQuestions || []).map((tf) => ({
          ...tf,
          correctAnswer: Boolean(tf.correctAnswer),
        })),
        MultipleChoiceQuestions: (tbq.MultipleChoiceQuestions || []).map((mc) => ({
          ...mc,
        })),
      }));

      // Normalize ArrangeOrderQuestions (if they exist)
      quiz.ArrangeOrderQuestions = (quiz.ArrangeOrderQuestions || []).map((aoq) => ({
        ...aoq,
        arrangeorder_prompt: aoq.arrangeorder_prompt || "",
        sentences: Array.isArray(aoq.sentences) ? aoq.sentences : JSON.parse(aoq.sentences || "[]"),
        correct_order: Array.isArray(aoq.correct_order)
          ? aoq.correct_order
          : JSON.parse(aoq.correct_order || "[]"),
      }));

      const totalMarks = quizMarks + predefinedMarks;

      return {
        ...quiz,
        totalMarks,
        QuizPreDefinedQuestions: quiz.QuizPreDefinedQuestions || [],
        QuizQuestions: quiz.QuizQuestions || [],
        TextedBasedQuizTexts: quiz.TextedBasedQuizTexts || [],
        AudioToScriptQuestions: quiz.AudioToScriptQuestions || [],
        RealWordQuestions: quiz.RealWordQuestions || [],
        DragDropQuestions: quiz.DragDropQuestions || [],
        SpeakingQuestions: quiz.SpeakingQuestions || [],
        SummarizePassageQuestions: quiz.SummarizePassageQuestions || [],
        BestOptionQuestions: quiz.BestOptionQuestions || [],
        ArrangeOrderQuestions: quiz.ArrangeOrderQuestions || [],
        // ✅ NEW: Always default to arrays
        VideoPauseQuestions: quiz.VideoPauseQuestions || [],
        AudioPauseQuestions: quiz.AudioPauseQuestions || [],
      };
    });

    // Match old controller structure
    const formattedQuizzes = updatedQuizzes.map((quiz) => ({
      ...quiz,
      isWarning: !!quiz.isWarning,
      no_of_warning: quiz.no_of_warning || 1,
      QuizPreDefinedQuestions: quiz.QuizPreDefinedQuestions || [],
      QuizQuestions: quiz.QuizQuestions || [],
      TextedBasedQuizTexts: quiz.TextedBasedQuizTexts || [],
      AudioToScriptQuestions: quiz.AudioToScriptQuestions || [],
      RealWordQuestions: quiz.RealWordQuestions || [],
      DragDropQuestions: quiz.DragDropQuestions || [],
      SpeakingQuestions: quiz.SpeakingQuestions || [],
      SummarizePassageQuestions: quiz.SummarizePassageQuestions || [],
      BestOptionQuestions: quiz.BestOptionQuestions || [],
      ArrangeOrderQuestions: quiz.ArrangeOrderQuestions || [],
      // ✅ NEW
      VideoPauseQuestions: quiz.VideoPauseQuestions || [],
      AudioPauseQuestions: quiz.AudioPauseQuestions || [],
    }));

    res.status(200).json(formattedQuizzes);
  } catch (error) {
    next(error);
  }
};


exports.getQuizByQuizId = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!id) {
      return res.status(400).json({ error: "Quiz ID is required" });
    }

    const { success, data, error } = await callProcedure("getQuizById", [id, userId]);

    if (!success) {
      return next(error);
    }

    // Stored procedure returns single quiz in data[0].quiz
    const quizRaw = data[0]?.quiz || null;

    if (!quizRaw) {
      return res.status(404).json({ error: "No quiz found with this ID" });
    }

    // Calculate total marks
    const quizMarks =
      quizRaw.QuizQuestions?.reduce((sum, q) => sum + (q.marks || 0), 0) || 0;

    const predefinedMarks =
      quizRaw.QuizPreDefinedQuestions?.reduce((sum, qpq) => {
        return sum + (qpq?.PreDefinedQuestion?.marks || 0);
      }, 0) || 0;

    const totalMarks = quizMarks + predefinedMarks;

    // Normalize booleans & nested fields
    const formattedQuiz = {
      ...quizRaw,
      isWarning: !!quizRaw.isWarning,
      no_of_warning: quizRaw.no_of_warning || 1,
      totalMarks,
      AllAssignedPauseIds: quizRaw.AllAssignedPauseIds || [],
      QuizQuestions: (quizRaw.QuizQuestions || []).map((q) => ({
        ...q,
        QuizOptions: (q.QuizOptions || []).map((opt) => ({
          ...opt,
          is_correct: Boolean(opt.is_correct),
        })),
      })),
      QuizPreDefinedQuestions: (quizRaw.QuizPreDefinedQuestions || []).map((qpq) => ({
        ...qpq,
        PreDefinedQuestion: {
          ...qpq.PreDefinedQuestion,
          PreDefinedOptions: (qpq.PreDefinedQuestion?.PreDefinedOptions || []).map((opt) => ({
            ...opt,
            is_correct: Boolean(opt.is_correct),
          })),
        },
      })),
      TextedBasedQuizTexts: (quizRaw.TextedBasedQuizTexts || []).map((tbq) => ({
        ...tbq,
        FillInBlankQuestions: (tbq.FillInBlankQuestions || []).map((fib) => ({ ...fib })),
        TrueFalseQuestions: (tbq.TrueFalseQuestions || []).map((tf) => ({
          ...tf,
          correctAnswer: Boolean(tf.correctAnswer),
        })),
        MultipleChoiceQuestions: (tbq.MultipleChoiceQuestions || []).map((mc) => ({ ...mc })),
      })),
      ArrangeOrderQuestions: (quizRaw.ArrangeOrderQuestions || []).map((aoq) => ({
        ...aoq,
        sentences: Array.isArray(aoq.sentences)
          ? aoq.sentences
          : JSON.parse(aoq.sentences || "[]"),
        correct_order: Array.isArray(aoq.correct_order)
          ? aoq.correct_order
          : JSON.parse(aoq.correct_order || "[]"),
      })),
      AudioToScriptQuestions: quizRaw.AudioToScriptQuestions || [],
      RealWordQuestions: quizRaw.RealWordQuestions || [],
      DragDropQuestions: quizRaw.DragDropQuestions || [],
      SummarizePassageQuestions: quizRaw.SummarizePassageQuestions || [],
      BestOptionQuestions: quizRaw.BestOptionQuestions || [],
      CompleteSentenceQuestions: quizRaw.CompleteSentenceQuestions || [],
    };

    res.status(200).json(formattedQuiz);
  } catch (error) {
    next(error);
  }
};



// Update Quiz using stored procedure
exports.updateQuiz = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    Validation.isInteger(id, "Quiz ID must be a valid positive integer.");

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    const { success, data, error } = await callProcedure("updateQuizById", [
      parseInt(id, 10),
      JSON.stringify({
        ...req.body,
        ...(req.body.isWarning === false && { no_of_warning: 1 })
      }),
      userId,
      role,
    ]);

    if (!success) return next(error);

    return res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: data[0][0],
    });
  } catch (error) {
    next(error);
  }
};

// Update Quiz Status using stored procedure
exports.updateQuizStatus = async (req, res, next) => {
  try {
    const { quizId } = req.params;
    const { status } = req.body;

    Validation.isInteger(quizId, "Quiz ID must be a valid positive integer.");
    Validation.isEnum(status, ["active", "inactive"], "Status must be 'active' or 'inactive'.");

    const { success, data, error } = await callProcedure("updateQuizStatusById", [
      quizId,
      status,
    ]);

    if (!success) return next(error);

    res.status(200).json({
      message: `Quiz ${status === "active" ? "activated" : "deactivated"} successfully`,
      quiz: data[0][0],
    });
  } catch (error) {
    next(error);
  }
};