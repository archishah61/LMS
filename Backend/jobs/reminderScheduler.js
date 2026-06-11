// jobs/reminderScheduler.js
const cron = require("node-cron");
const { Op } = require("sequelize");
const sendMail = require("../config/mailer");
const AssignmentCompletion = require("../models/learning_progress/assignmentCompletion");
const User = require("../models/auth/user");
const { notifyAssignmentReminder } = require("../socket/socket");
const Assignment = require("../models/content_management/assignmentsModel");

// --------------------------------------------------------------------------------------------------------
// ----------------------------- Commented Code Is Useful for Different Logic -----------------------------
// --------------------------------------------------------------------------------------------------------

cron.schedule("*/1 * * * *", async () => {
    const now = new Date();

    // Get all incomplete assignments
    const assignments = await AssignmentCompletion.findAll({
        where: {
            [Op.or]: [
                { isCompleted: false },
                { isCompleted: null }
            ]
        }
    });

    //     // ✅ Fetch only latest incomplete attempts per user-assignment pair,
    //     //    excluding any pairs that have a completed record
    //     const [assignments] = await sequelize.query(`
    //     SELECT ac.*
    //     FROM tbl_assignment_completion ac
    //     INNER JOIN (
    //       SELECT MAX(id) AS latest_id
    //       FROM tbl_assignment_completion
    //       GROUP BY userId, assignmentId
    //       HAVING SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) = 0
    //     ) latest ON ac.id = latest.latest_id
    //     WHERE ac.status = 'Incomplete' OR ac.isCompleted IS NULL
    //   `);

    for (const a of assignments) {

        const hoursLeft = Math.round((a.due_date - now) / (1000 * 60 * 60));
        const assignment = await Assignment.findByPk(a.assignmentId, {
            attributes: ["title"]
        });

        const title = assignment ? assignment.title : "Assignment";

        // 🔹 24 hours reminder
        if ((hoursLeft <= 24 && hoursLeft > 12) && !a.reminder_24h_sent) {
            notifyAssignmentReminder(a.userId, {
                id: a.assignmentId,
                title: a.title || "Assignment",
                due_date: a.due_date,
            });

            if (a.userId) {
                const user = await User.findByPk(a.userId);
                if (user && user.email) {
                    await sendMail(
                        user.email,
                        "📌 Assignment Reminder - 24 Hours Left",
                        "", // plain text (optional)
                        `
                            <h3>Reminder</h3>
                            <p>Hi ${user.name || "Learner"},</p>
                            <p>Your assignment <b>${title}</b> is due in <b>24 hours</b>.</p>
                            <p><strong>Due Date:</strong> ${a.due_date}</p>
                            <br/>
                            <p>Kindly complete it before the deadline.</p>
                            <br/>
                            <p>Thanks,<br/>SmartEdu Team</p>
                        `
                    );
                }
            }

            // ✅ Mark reminder as sent
            await a.update({ reminder_24h_sent: true });

            // // ✅ Mark reminder as sent
            // await AssignmentCompletion.update(
            //     { reminder_24h_sent: true },
            //     { where: { id: a.id } }
            // );
        }

        // 🔹 12 hours reminder
        if ((hoursLeft <= 12 && hoursLeft > 0) && !a.reminder_12h_sent) {
            notifyAssignmentReminder(a.userId, {
                id: a.assignmentId,
                title: a.title || "Assignment",
                due_date: a.due_date,
            });

            if (a.userId) {
                const user = await User.findByPk(a.userId);
                if (user && user.email) {
                    await sendMail(
                        user.email,
                        "📌 Assignment Reminder - 12 Hours Left",
                        "",
                        `
                            <h3>Final Reminder</h3>
                            <p>Hi ${user.name || "Learner"},</p>
                            <p>Your assignment <b>${title}</b> is due in <b>12 hours</b>.</p>
                            <p><strong>Due Date:</strong> ${a.due_date}</p>
                            <br/>
                            <p>Hurry up and submit it on time!</p>
                            <br/>
                            <p>Thanks,<br/>SmartEdu Team</p>
                        `
                    );
                }
            }

            // ✅ Mark reminder as sent
            await a.update({ reminder_12h_sent: true });

            // // ✅ Mark reminder as sent
            // await AssignmentCompletion.update(
            //     { reminder_12h_sent: true },
            //     { where: { id: a.id } }
            // );
        }

        // 🔹 Due time reminder (0 hours left)
        if (hoursLeft === 0 && !a.reminder_due_sent) {
            notifyAssignmentReminder(a.userId, {
                id: a.assignmentId,
                title: a.title || "Assignment",
                due_date: a.due_date,
            });

            if (a.userId) {
                const user = await User.findByPk(a.userId);
                if (user && user.email) {
                    await sendMail(
                        user.email,
                        "📌 Assignment Due Today",
                        "",
                        `
                            <h3>Deadline Reached</h3>
                            <p>Hi ${user.name || "Learner"},</p>
                            <p>Your assignment <b>${title}</b> is <strong>due now</strong>.</p>
                            <p><strong>Due Date:</strong> ${a.due_date}</p>
                            <br/>
                            <p>Please submit it immediately if you haven’t already.</p>
                            <br/>
                            <p>Thanks,<br/>SmartEdu Team</p>
                        `
                    );
                }
            }

            // ✅ Mark reminder as sent
            await a.update({ reminder_due_sent: true });

            // // ✅ Mark reminder as sent
            // await AssignmentCompletion.update(
            //     { reminder_due_sent: true },
            //     { where: { id: a.id } }
            // );
        }
    }
});
