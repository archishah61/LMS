const sequelize = require("../config/db");
const { InterviewEvaluation, InterviewEvaluationResult, QuestionEvaluation } = require("../models/aiInterview/InterviewEvaluation");
const User = require("../models/auth/user");
const UserChallenge = require("../models/challenges/challenge_progress/user_challenge");
const UserChallengePhase = require("../models/challenges/challenge_progress/user_challenge_phases");
const UserChallengeTask = require("../models/challenges/challenge_progress/user_challenge_tasks");
const ChallengePhase = require("../models/challenges/challenge_quest/challenge_phases");
const ChallengeTask = require("../models/challenges/challenge_quest/challenge_tasks");
const Challenge = require("../models/challenges/challenge_quest/challenges");
const Course = require("../models/course_management/course");
const CourseFAQOption = require("../models/course_management/courseFAQOption");
const CourseFAQ = require("../models/course_management/courseFAQs");
const { enrollments, payments } = require("../models/enrollment_management/enrollment_management");
const CourseTimeTracking = require("../models/learning_progress/courseTimeTracking");
const Review = require("../models/reviews/reviewsModel");
const StudentFAQResponse = require("../models/student_management/studentFAQResponse");

async function seedAnalyticsData() {
  try {
    const userEmails = [
      "alex@example.com",
      "sarah@example.com",
      "michael@example.com",
      "emily@example.com",
      "david@example.com",
      "olivia@example.com",
      "william@example.com",
      "sophia@example.com",
      "james@example.com",
      "ava@example.com",
      "benjamin@example.com",
      "mia@example.com",
      "daniel@example.com",
      "charlotte@example.com",
      "logan@example.com",
      "john@example.com"
    ];

    for (const email of userEmails) {
      const namePart = email.split("@")[0];
      const fullName = namePart.charAt(0).toUpperCase() + namePart.slice(1) + " Smith";

      // Create user if not exists
      const [user, created] = await User.findOrCreate({
        where: { email },
        defaults: {
          full_name: fullName,
          username: namePart,
          email: email,
          password: "hashedpassword", // Hash in real app
          is_active: true,
        },
      });

      const courses = await Course.findAll();
      if (!courses.length) {
        throw new Error("No courses found in database. Please seed courses first.");
      }


      const selectedCourses = courses
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1); // 1–3 courses


      // Create default enrollment
      for (const course of selectedCourses) {
        const is_completed = Math.random() < 0.5; // 50% chance true/false

        const completion_percentage = is_completed
          ? Math.floor(Math.random() * 21) + 80 // 80–100
          : Math.floor(Math.random() * 80);     // 0–79

        const total_time_spent = Math.floor(Math.random() * 10000) + 30; // 30–10029 mins

        const completed_at = is_completed
          ? new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30))) // within last 30 days
          : null;

        const enrollment = await enrollments.create({
          user_id: user.id,
          course_id: course.id,
          user_hash: `${user.id}-${course.id}-${Date.now()}`,
          enrollment_date: new Date(),
          expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)),
          is_completed,
          completed_at,
          total_time_spent,
          completion_percentage,
          status: is_completed ? "completed" : "active",
          created_by: user.id,
          updated_by: user.id
        });

        // ✅ Create 1–3 daily tracking records for this enrollment
        const trackingDays = Math.floor(Math.random() * 3) + 1; // 1–3 records
        for (let i = 0; i < trackingDays; i++) {
          const trackingDate = new Date();
          trackingDate.setDate(trackingDate.getDate() - i); // i days ago

          const sessionStart = new Date(trackingDate);
          sessionStart.setHours(9 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // between 9–12 AM

          const sessionEnd = new Date(sessionStart);
          sessionEnd.setMinutes(sessionEnd.getMinutes() + (30 + Math.floor(Math.random() * 120))); // session length 30–150 mins

          const dailyTime = Math.floor((sessionEnd - sessionStart) / 60000); // minutes

          await CourseTimeTracking.create({
            enrollment_id: enrollment.id,
            tracking_date: trackingDate,
            total_time_spent: dailyTime,
            last_session_start: sessionStart,
            last_session_end: sessionEnd,
            created_by: user.id,
            updated_by: user.id
          });

          console.log(`📊 Time tracking created for ${user.email} on ${trackingDate.toISOString().split('T')[0]} → ${dailyTime} mins`);
        }

        // 📌 After time tracking → insert StudentFAQResponse
        const faqs = await CourseFAQ.findAll({
          where: { course_id: course.id },
          include: [{ model: CourseFAQOption, as: "options" }] // assuming association is defined
        });

        for (const faq of faqs) {
          // pick random option or null (simulate unanswered)
          let selectedOptionId = null;
          if (faq.options && faq.options.length) {
            selectedOptionId = Math.random() < 0.8 // 80% answered
              ? faq.options[Math.floor(Math.random() * faq.options.length)].id
              : null;
          }

          await StudentFAQResponse.create({
            user_id: user.id,
            course_id: course.id,
            faq_id: faq.id,
            selected_option_id: selectedOptionId,
            created_by: user.id,
            updated_by: user.id
          });

          console.log(`💬 FAQ Response created for ${user.email} → FAQ ID ${faq.id}, Option: ${selectedOptionId || "none"}`);
        }

        // Function to get a random past date within N years
        function getRandomPastDate(yearsBack = 3) {
          const now = new Date();
          const past = new Date();
          past.setFullYear(now.getFullYear() - yearsBack);
          const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
          return new Date(randomTime);
        }

        // Decide if payment is today or in the past
        const isToday = Math.random() < 0.2; // 20% of payments will be today
        const transactionDate = isToday ? new Date() : getRandomPastDate(3);

        const paymentStatusOptions = ["pending", "completed", "failed", "refunded"];
        const paymentMethods = ["credit_card", "paypal", "upi", "bank_transfer"];
        const gateways = ["Stripe", "PayPal", "Razorpay", "Square"];

        const amount = course.price ? course.price : Math.floor(Math.random() * 5000) + 500;
        const status = Math.random() < 0.8 ? "completed" : paymentStatusOptions[Math.floor(Math.random() * paymentStatusOptions.length)];

        await payments.create({
          enrollment_id: enrollment.id,
          amount: amount,
          currency: "INR",
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          payment_gateway: gateways[Math.floor(Math.random() * gateways.length)],
          gateway_response: { message: "Transaction processed successfully" },
          transaction_id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          reference_id: `REF-${Math.floor(Math.random() * 1000000)}`,
          status: status,
          transaction_date: transactionDate,
          notes: status === "completed" ? "Payment completed successfully" : "Payment failed or pending",
          created_by: user.id,
          updated_by: user.id
        });

        console.log(`💳 Payment inserted for ${user.email} → Status: ${status}, Amount: ${amount}, Date: ${transactionDate.toDateString()}`);

        // 📌 Insert User Challenges
        const challenges = await Challenge.findAll();
        if (!challenges.length) {
          throw new Error("No challenges found in database. Please seed challenges first.");
        }

        // Assign 1–3 challenges per user
        const challengeCount = Math.floor(Math.random() * 3) + 1;
        const assignedChallenges = challenges
          .sort(() => 0.5 - Math.random())
          .slice(0, challengeCount);

        for (const challenge of assignedChallenges) {
          const is_completed = Math.random() < 0.5; // 50% chance
          const status = is_completed
            ? "completed"
            : ["pending", "in_progress", "failed"][Math.floor(Math.random() * 3)];
          const progress_percentage = is_completed
            ? 100
            : status === "in_progress"
              ? Math.floor(Math.random() * 80) + 10 // 10–89
              : 0;

          const points_earned = is_completed
            ? challenge.reward_points || Math.floor(Math.random() * 50) + 10
            : 0;

          const completed_at = is_completed
            ? new Date(new Date().setDate(new Date().getDate() - Math.floor(Math.random() * 30)))
            : null;

          // Store the created UserChallenge
          const userChallenge = await UserChallenge.create({
            user_id: user.id,
            challenge_id: challenge.id,
            is_completed,
            completed_at,
            points_earned,
            status,
            progress_percentage,
            assigned_at: new Date(),
          });

          console.log(`🏆 Challenge assigned to ${user.email} → ${challenge.title} | Status: ${status}, Progress: ${progress_percentage}%`);

          // 📌 Fetch challenge phases for this challenge
          const phases = await ChallengePhase.findAll({ where: { challenge_id: challenge.id } });

          for (const phase of phases) {
            const phaseCompleted = Math.random() < 0.6; // 60% chance
            const phaseCompletedToday = phaseCompleted && Math.random() < 0.3; // 30% of completed are today

            const userPhase = await UserChallengePhase.create({
              user_challenge_id: userChallenge.id, // link to this userChallenge
              challenge_phase_id: phase.id,
              completed_tasks: 0, // will update after tasks
              is_completed: phaseCompleted,
              points_earned: phaseCompleted ? Math.floor(Math.random() * 20) + 5 : 0,
              completed_at: phaseCompleted
                ? (phaseCompletedToday
                  ? new Date()
                  : new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000))
                : null,
              is_lock: false,
              started_at: new Date(),
              progress_percentage: phaseCompleted ? 100 : Math.floor(Math.random() * 80),
              is_active: true
            });

            // 📌 Fetch tasks for this phase
            const tasks = await ChallengeTask.findAll({ where: { challenge_phase_id: phase.id } });
            let completedTasksCount = 0;

            for (const task of tasks) {
              const taskCompleted = Math.random() < 0.5;
              const taskCompletedToday = taskCompleted && Math.random() < 0.4;

              await UserChallengeTask.create({
                user_challenge_phase_id: userPhase.id,
                challenge_task_id: task.id,
                is_completed: taskCompleted,
                attempts: Math.floor(Math.random() * 3),
                points_earned: taskCompleted ? Math.floor(Math.random() * 5) + 1 : 0,
                completed_at: taskCompleted
                  ? (taskCompletedToday
                    ? new Date()
                    : new Date(Date.now() - Math.floor(Math.random() * 15) * 86400000))
                  : null,
                progress_percentage: taskCompleted ? 100 : Math.floor(Math.random() * 80),
                is_active: true
              });

              if (taskCompleted) completedTasksCount++;
            }

            // Update phase's completed_tasks count
            await userPhase.update({ completed_tasks: completedTasksCount });
          }
        }

        // Add this block after the UserChallenge loop
        const enrollmentsForUser = await enrollments.findAll({
          where: { user_id: user.id },
          include: [{ model: Course, as: "course" }] // assuming association
        });

        // Create 1-3 reviews for random courses the user is enrolled in
        const reviewCount = Math.floor(Math.random() * 3) + 1;
        const coursesToReview = enrollmentsForUser
          .sort(() => 0.5 - Math.random())
          .slice(0, reviewCount);

        for (const enrollment of coursesToReview) {
          const rating = Math.floor(Math.random() * 5) + 1; // 1-5
          const reviewText = [
            "Great course! Learned a lot.",
            "Very informative and well-structured.",
            "Could be improved with more examples.",
            "The instructor was excellent.",
            "Not what I expected, but still useful."
          ][Math.floor(Math.random() * 5)];

          await Review.create({
            course_id: enrollment.course_id,
            user_id: user.id,
            review: reviewText,
            rating: rating,
            created_by: user.id,
            updated_by: user.id
          });
          console.log(`⭐ Review created for ${user.email} → Course: ${enrollment.course_id}, Rating: ${rating}`);
        }
      }

      // Create InterviewEvaluation
      const interviewEvaluation = await InterviewEvaluation.create({
        user_id: user.id,
        role: ["Software Engineer", "Backend Developer", "Frontend Developer", "Data Analyst"][Math.floor(Math.random() * 4)],
        category: ["Technical Interview", "Behavioral Interview", "System Design Interview"][Math.floor(Math.random() * 3)],
      });

      // Create InterviewEvaluationResult
      const interviewEvaluationResult = await InterviewEvaluationResult.create({
        user_id: user.id,
        interviewEvaluationId: interviewEvaluation.id,
        overallScore: Math.floor(Math.random() * 21) + 80, // 80-100
        overallAssessment: "The candidate demonstrated solid skills with room for improvement in certain areas.",
        fullResponse: "Full JSON response from evaluation API or system.",
      });

      // Create QuestionEvaluations
      const questionData = [
        {
          question: "What is JavaScript?",
          originalAnswer: "JavaScript is a programming language that conforms to the ECMAScript specification.",
          userAnswer: "JavaScript is used for web interactivity and logic.",
          suggestedFeedback: "Good, but could mention asynchronous features."
        },
        {
          question: "Explain closures in JavaScript.",
          originalAnswer: "A closure is the combination of a function bundled together with references to its surrounding state.",
          userAnswer: "Closures allow functions to remember variables from outer scope.",
          suggestedFeedback: "Correct, well explained."
        }
      ];

      for (const q of questionData) {
        await QuestionEvaluation.create({
          interviewEvaluationResultId: interviewEvaluationResult.id,
          question: q.question,
          originalAnswer: q.originalAnswer,
          userAnswer: q.userAnswer,
          score: (Math.random() * 2) + 8, // 8.0–10.0
          suggestedFeedback: q.suggestedFeedback,
        });
      }

      console.log(`Data seeded for ${email}`);
    }

    console.log("✅ All users seeded successfully!");
  } catch (error) {
    console.error("Error inserting seed data:", error);
  } finally {
    await sequelize.close();
  }
}

module.exports = { seedAnalyticsData };