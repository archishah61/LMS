// // moduleFeedbackCheck.js

// export const isModuleReadyForFeedback = (moduleId, topicData, quizData, completedTopics, quizCompletionData) => {
//     if (!moduleId || !topicData || !quizData || !completedTopics) return false;

//     // Get all topics for this module
//     const moduleTopics = topicData?.data?.[0]?.data?.filter(
//         (topic) => topic.module_id === moduleId
//     ) || [];

//     // Check if all topics are completed
//     const allTopicsCompleted = moduleTopics.every((topic) => {
//         return completedTopics[topic.id] === true; // Check if topic.id is a key in completedTopics
//     });

//     // Get all quizzes for this module not linked to a topic
//     const topicAssociatedQuizIds = new Set(
//         topicData?.data?.[0]?.data
//             ?.filter((content) => content.quiz_id !== null)
//             .map((content) => content.quiz_id)
//     );

//     const moduleQuizzes = quizData?.filter(
//         (quiz) => quiz.module_id === moduleId && !topicAssociatedQuizIds.has(quiz.id)
//     ) || [];

//     // Check if all quizzes have been attempted
//     const allQuizzesAttempted = moduleQuizzes.length === 0 || moduleQuizzes.every((quiz) => {
//         return quizCompletionData?.some((completion) => completion.quizId === quiz.id);
//     });

//     return allTopicsCompleted && allQuizzesAttempted;
// };


// moduleFeedbackCheck.js

export const isModuleReadyForFeedback = (moduleId, topicData, quizData, completedTopics, quizCompletionData) => {
    if (!moduleId || !topicData || !quizData || !completedTopics) return false;

    // Get all topics for this module
    const moduleTopics = topicData?.data?.[0]?.data?.filter(
        (topic) => topic.module_id === moduleId
    ) || [];

    // Check if all topics are completed
    const allTopicsCompleted = moduleTopics.every((topic) => {
        return completedTopics[topic.id] === true; // Check if topic.id is a key in completedTopics
    });

    // Get all quizzes for this module not linked to a topic
    const topicAssociatedQuizIds = new Set(
        topicData?.data?.[0]?.data
            ?.filter((content) => content.quiz_id !== null)
            .map((content) => content.quiz_id)
    );

    const moduleQuizzes = quizData?.filter(
        (quiz) => quiz.module_id === moduleId && !topicAssociatedQuizIds.has(quiz.id)
    ) || [];

    // Check if all quizzes have been attempted
    const allQuizzesAttempted = moduleQuizzes.length === 0 || moduleQuizzes.every((quiz) => {
        return quizCompletionData?.some((completion) => completion.quizId === quiz.id);
    });

    return allTopicsCompleted && allQuizzesAttempted;
};
