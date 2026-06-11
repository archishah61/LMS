// jobs/contestScheduler.js
const cron = require("node-cron");
const { Op } = require("sequelize");
const Contest = require("../models/contest/contest_content/contest");
const { callProcedure } = require("../utils/procedure/callProcedure");

cron.schedule("*/1 * * * *", async () => {
    try {
        // Get all contests that should end now
        const contests = await Contest.findAll({
            where: {
                status: "active",
                end_time: { [Op.lte]: new Date() }
            },
            attributes: ["id", "title", "end_time"]
        });

        await Promise.all(
            contests.map(contest =>
                callProcedure("EndContestAndRewardUsers", [contest.id])
            )
        );

    } catch (error) {
        console.error("❌ Error in contest scheduler:", error);
    }
});
