const UserChallengePhase = require("../../models/challenges/challenge_progress/user_challenge_phases");
const UserChallengeTask = require("../../models/challenges/challenge_progress/user_challenge_tasks");
const UserChallenge = require("../../models/challenges/challenge_progress/user_challenge");
const UserPoints = require("../../models/user_points/user_points");
const ChallengePhase = require("../../models/challenges/challenge_quest/challenge_phases");
const ChallengeTask = require("../../models/challenges/challenge_quest/challenge_tasks");

async function completeUserChallengeTaskById(taskId) {
    const userChallengeTask = await UserChallengeTask.findByPk(taskId);

    if (!userChallengeTask) return null;

    // Mark the task complete
    userChallengeTask.is_completed = true;
    userChallengeTask.progress_percentage = 100;
    userChallengeTask.completed_at = new Date();
    await userChallengeTask.save();

    const userChallengePhase = await UserChallengePhase.findByPk(userChallengeTask.user_challenge_phase_id, {
        include: [{
            model: UserChallengeTask
        }]
    });

    // Recalculate phase points and progress
    const completedTasks = userChallengePhase.UserChallengeTasks.filter(t => t.is_completed);
    const totalTasks = userChallengePhase.UserChallengeTasks.length;

    userChallengePhase.completed_tasks = completedTasks.length;
    userChallengePhase.points_earned = userChallengePhase.UserChallengeTasks.reduce((sum, t) => sum + (t.points_earned || 0), 0);
    userChallengePhase.progress_percentage = totalTasks > 0 ? (completedTasks.length * 100) / totalTasks : 0;

    // Check if all mandatory tasks are completed
    const mandatoryTasks = await UserChallengeTask.findAll({
        where: {
            user_challenge_phase_id: userChallengePhase.id
        },
        include: [{
            model: ChallengeTask,
            required: true,
            where: { is_mandatory: true }
        }]
    });

    const incompleteMandatory = mandatoryTasks.filter(t => !t.is_completed);

    if (incompleteMandatory.length === 0) {
        userChallengePhase.is_completed = true;
        userChallengePhase.completed_at = new Date();
        userChallengePhase.progress_percentage = 100;
    }

    await userChallengePhase.save();

    // Update UserChallenge
    const userChallenge = await UserChallenge.findByPk(userChallengePhase.user_challenge_id, {
        include: [{
            model: UserChallengePhase,
            include: [{ model: UserChallengeTask }]
        }]
    });

    let totalPhaseTasks = 0;
    let completedPhaseTasks = 0;
    let totalPointsEarned = 0;

    userChallenge.UserChallengePhases.forEach(phase => {
        totalPointsEarned += phase.UserChallengeTasks.reduce((sum, task) => sum + (task.points_earned || 0), 0);
        totalPhaseTasks += phase.UserChallengeTasks.length;
        completedPhaseTasks += phase.UserChallengeTasks.filter(task => task.is_completed).length;
    });

    userChallenge.points_earned = totalPointsEarned;
    userChallenge.progress_percentage = totalPhaseTasks > 0 ? (completedPhaseTasks * 100) / totalPhaseTasks : 0;

    const allPhasesCompleted = userChallenge.UserChallengePhases.every(p => p.is_completed);

    if (allPhasesCompleted) {
        userChallenge.is_completed = true;
        userChallenge.completed_at = new Date();
        userChallenge.status = "completed";
        userChallenge.progress_percentage = 100;
    }

    await userChallenge.save();

    // Update user points if challenge completed
    if (userChallenge.is_completed) {
        let userPoints = await UserPoints.findOne({
            where: { user_id: userChallenge.user_id }
        });

        if (!userPoints) {
            await UserPoints.create({
                user_id: userChallenge.user_id,
                points: userChallenge.points_earned,
                total_earned: userChallenge.points_earned,
                total_spent: 0
            });
        } else {
            await UserPoints.increment(
                { points: userChallenge.points_earned, total_earned: userChallenge.points_earned },
                { where: { user_id: userChallenge.user_id } }
            );
        }
    }

    // Unlock next phase if applicable
    const allPhases = await UserChallengePhase.findAll({
        where: { user_challenge_id: userChallenge.id },
        include: [ChallengePhase],
        order: [[ChallengePhase, 'phase_number', 'ASC']]
    });

    for (let i = 0; i < allPhases.length; i++) {
        if (allPhases[i].id === userChallengePhase.id && i + 1 < allPhases.length) {
            const nextPhase = allPhases[i + 1];
            if (nextPhase.is_lock) {
                nextPhase.is_lock = false;
                await nextPhase.save();
            }
            break;
        }
    }

    return { userChallengeTask, userChallengePhase, userChallenge };
}

module.exports = { completeUserChallengeTaskById };
