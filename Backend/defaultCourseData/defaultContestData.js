const Contest = require('../models/contest/contest_content/contest');
const ContestPrize = require('../models/contest/contest_content/contestPrize');
const ContestTemplate = require('../models/contest/contest_content/contestTemplate');
const ContestActivity = require('../models/contest/contest_content/contestActivity');
const ContestQuiz = require('../models/contest/contest_content/contest_type/contestQuiz');
const MCQChallenge = require('../models/challenges/daily_challenges/mcq_challenge');
const MCQOptionChallenge = require('../models/challenges/daily_challenges/mcq_option_challenge');
const FillInTheBlanksChallenge = require('../models/challenges/daily_challenges/fill_in_the_blanks_challenges');
const TrueFalseChallenge = require('../models/challenges/challenge_quest/true_false_challenges');

const insertDefaultContestData = async () => {
  try {
    // Create templates
    const templates = await ContestTemplate.bulkCreate([
      {
        title: "Weekly Coding Challenge",
        description: "A weekly coding competition for all skill levels",
        type: "recurring",
        is_active: true,
        recurrence_pattern: "week",
        recurrence_interval: 1,
        recurrence_days_of_week: ["Saturday"],
        banner_url: "/template/banner/weekly_coding.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        title: "Monthly Quiz Tournament",
        description: "Monthly quiz competition with exciting prizes",
        type: "recurring",
        is_active: true,
        recurrence_pattern: "month",
        recurrence_interval: 1,
        banner_url: "/template/banner/monthly_quiz.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        title: "On-Demand Challenges",
        description: "Join anytime challenges for quick fun",
        type: "on-demand",
        is_active: true,
        banner_url: "/template/banner/ondemand.jpeg",
        created_by: 1,
        updated_by: 1
      }
    ]);

    // Create contests
    const contests = await Contest.bulkCreate([
      // Weekly template contests
      {
        template_id: templates[0].id,
        title: "Weekly Coding Challenge - Round 1",
        description: "Test your coding skills with this weekly challenge",
        category_id: 2, // Assuming 2 is coding category
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        end_time: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 1 week + 1 day
        enrollment_start: new Date(),
        enrollment_end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        status: "active",
        total_participants: 50,
        is_limites_participants: false,
        enroll_by: "free",
        mode: "solo",
        rules: "Complete all challenges within the time limit",
        banner_url: "/contest/banner/weekly_round1.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        template_id: templates[0].id,
        title: "Weekly Coding Challenge - Round 2",
        description: "Second round of our weekly coding competition",
        category_id: 2,
        start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
        end_time: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 2 weeks + 1 day
        enrollment_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        enrollment_end: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000), // 13 days from now
        status: "draft",
        total_participants: 0,
        is_limites_participants: true,
        max_participants: 100,
        enroll_by: "points",
        enrollment_fee: 50,
        mode: "solo",
        rules: "Complete all challenges within the time limit",
        banner_url: "/contest/banner/weekly_round2.jpeg",
        created_by: 1,
        updated_by: 1
      },
      // Monthly template contests
      {
        template_id: templates[1].id,
        title: "Monthly Quiz Tournament - January",
        description: "Start the year with our January quiz tournament",
        category_id: 1, // Assuming 1 is quiz category
        start_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        end_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000), // 6 days from now
        enrollment_start: new Date(),
        enrollment_end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        status: "active",
        total_participants: 75,
        is_limites_participants: false,
        enroll_by: "free",
        mode: "solo",
        rules: "Answer all questions correctly to win",
        banner_url: "/contest/banner/january_quiz.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        template_id: templates[1].id,
        title: "Monthly Quiz Tournament - February",
        description: "February edition of our popular quiz tournament",
        category_id: 1,
        start_time: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        end_time: new Date(Date.now() + 36 * 24 * 60 * 60 * 1000), // 36 days from now
        enrollment_start: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        enrollment_end: new Date(Date.now() + 34 * 24 * 60 * 60 * 1000), // 34 days from now
        status: "draft",
        total_participants: 0,
        is_limites_participants: true,
        max_participants: 150,
        enroll_by: "paid",
        enrollment_fee: 75,
        mode: "solo",
        rules: "Answer all questions correctly to win",
        banner_url: "/contest/banner/february_quiz.jpeg",
        created_by: 1,
        updated_by: 1
      },
      // On-demand template contest
      {
        template_id: templates[2].id,
        title: "Quick Brain Teaser",
        description: "A quick on-demand challenge to test your skills",
        category_id: 3, // Assuming 3 is puzzle category
        start_time: new Date(),
        end_time: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        status: "active",
        total_participants: 25,
        is_limites_participants: false,
        enroll_by: "free",
        mode: "solo",
        rules: "Complete at your own pace",
        banner_url: "/contest/banner/brain_teaser.jpeg",
        created_by: 1,
        updated_by: 1
      },
      // Free contests without templates
      {
        title: "Weekend Trivia Challenge",
        description: "Fun trivia for the weekend",
        category_id: 1,
        start_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        enrollment_start: new Date(),
        enrollment_end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        status: "active",
        total_participants: 40,
        is_limites_participants: false,
        enroll_by: "free",
        mode: "solo",
        rules: "Have fun and learn something new",
        banner_url: "/contest/banner/weekend_trivia.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        title: "Coding Marathon",
        description: "24-hour coding marathon",
        category_id: 2,
        start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        end_time: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000), // 11 days from now
        enrollment_start: new Date(),
        enrollment_end: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
        status: "draft",
        total_participants: 0,
        is_limites_participants: true,
        max_participants: 200,
        enroll_by: "points",
        enrollment_fee: 100,
        mode: "solo",
        rules: "Code for 24 hours straight",
        banner_url: "/contest/banner/coding_marathon.jpeg",
        created_by: 1,
        updated_by: 1
      },
      {
        title: "Puzzle Championship",
        description: "Annual puzzle solving championship",
        category_id: 3,
        start_time: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        end_time: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000), // 31 days from now
        enrollment_start: new Date(),
        enrollment_end: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000), // 29 days from now
        status: "draft",
        total_participants: 0,
        is_limites_participants: true,
        max_participants: 500,
        enroll_by: "free",
        mode: "solo",
        rules: "Solve all puzzles to win the championship",
        banner_url: "/contest/banner/puzzle_championship.jpeg",
        created_by: 1,
        updated_by: 1
      }
    ]);

    // Create prizes for each contest
    await ContestPrize.bulkCreate([
      // Prizes for Weekly Coding Challenge - Round 1
      {
        contest_id: contests[0].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 500,
        prize_description: "First Place Winner",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[0].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 300,
        prize_description: "Second Place Winner",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[0].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 200,
        prize_description: "Third Place Winner",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[0].id,
        prize_type: "range",
        position_start: 4,
        position_end: 10,
        prize_points: 100,
        prize_description: "Top 10 Finalists",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Weekly Coding Challenge - Round 2 (paid contest - bigger prizes)
      {
        contest_id: contests[1].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 1000,
        prize_description: "Champion - Grand Prize",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[1].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 600,
        prize_description: "Runner-up",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[1].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 400,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[1].id,
        prize_type: "range",
        position_start: 4,
        position_end: 20,
        prize_points: 150,
        prize_description: "Top 20 Participants",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Monthly Quiz Tournament - January
      {
        contest_id: contests[2].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 750,
        prize_description: "Quiz Master Champion",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[2].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 450,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[2].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 300,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[2].id,
        prize_type: "range",
        position_start: 4,
        position_end: 15,
        prize_points: 100,
        prize_description: "Top 15 Quiz Experts",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Monthly Quiz Tournament - February (paid contest)
      {
        contest_id: contests[3].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 1200,
        prize_description: "February Quiz Champion",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[3].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 800,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[3].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 500,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[3].id,
        prize_type: "range",
        position_start: 4,
        position_end: 25,
        prize_points: 200,
        prize_description: "Top 25 Participants",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Quick Brain Teaser (on-demand, smaller prizes)
      {
        contest_id: contests[4].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 200,
        prize_description: "Brain Teaser Champion",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[4].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 100,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[4].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 50,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Weekend Trivia Challenge
      {
        contest_id: contests[5].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 300,
        prize_description: "Trivia Master",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[5].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 150,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[5].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 100,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[5].id,
        prize_type: "range",
        position_start: 4,
        position_end: 10,
        prize_points: 50,
        prize_description: "Top 10 Trivia Experts",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Coding Marathon (big contest - big prizes)
      {
        contest_id: contests[6].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 2000,
        prize_description: "Coding Marathon Champion",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[6].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 1200,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[6].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 800,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[6].id,
        prize_type: "range",
        position_start: 4,
        position_end: 10,
        prize_points: 400,
        prize_description: "Top 10 Coders",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[6].id,
        prize_type: "range",
        position_start: 11,
        position_end: 50,
        prize_points: 200,
        prize_description: "Top 50 Participants",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },

      // Prizes for Puzzle Championship (free but prestigious)
      {
        contest_id: contests[7].id,
        prize_type: "position",
        position_start: 1,
        position_end: null,
        prize_points: 1500,
        prize_description: "Puzzle Champion Title",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[7].id,
        prize_type: "position",
        position_start: 2,
        position_end: null,
        prize_points: 900,
        prize_description: "Second Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[7].id,
        prize_type: "position",
        position_start: 3,
        position_end: null,
        prize_points: 600,
        prize_description: "Third Place",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[7].id,
        prize_type: "range",
        position_start: 4,
        position_end: 20,
        prize_points: 300,
        prize_description: "Top 20 Puzzle Solvers",
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[7].id,
        prize_type: "range",
        position_start: 21,
        position_end: 100,
        prize_points: 100,
        prize_description: "Top 100 Participants",
        is_active: true,
        created_by: 1,
        updated_by: 1
      }
    ]);

    // Create activities for each contest
    const activities = await ContestActivity.bulkCreate([
      // // Activities for Weekly Coding Challenge - Round 1
      // {
      //   contest_id: contests[0].id,
      //   title: "Algorithm Challenge",
      //   description: "Solve this algorithm problem",
      //   type: "coding",
      //   difficulty: "medium",
      //   points_reward: 100,
      //   is_active: true,
      //   created_by: 1,
      //   updated_by: 1
      // },
      {
        contest_id: contests[0].id,
        title: "Data Structures Quiz",
        description: "Test your knowledge of data structures",
        type: "quiz",
        difficulty: "easy",
        points_reward: 50,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // // Activities for Weekly Coding Challenge - Round 2
      // {
      //   contest_id: contests[1].id,
      //   title: "Advanced Algorithm",
      //   description: "Challenge yourself with this advanced algorithm",
      //   type: "coding",
      //   difficulty: "hard",
      //   points_reward: 150,
      //   is_active: true,
      //   created_by: 1,
      //   updated_by: 1
      // },
      // Activities for Monthly Quiz Tournament - January
      {
        contest_id: contests[2].id,
        title: "General Knowledge Quiz",
        description: "Test your general knowledge",
        type: "quiz",
        difficulty: "medium",
        points_reward: 75,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      {
        contest_id: contests[2].id,
        title: "Science & Technology",
        description: "Questions about science and technology",
        type: "quiz",
        difficulty: "hard",
        points_reward: 100,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Activities for Monthly Quiz Tournament - February
      {
        contest_id: contests[3].id,
        title: "History Quiz",
        description: "Test your knowledge of history",
        type: "quiz",
        difficulty: "medium",
        points_reward: 80,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Activities for Quick Brain Teaser
      {
        contest_id: contests[4].id,
        title: "Logic Puzzles",
        description: "Solve these logic puzzles",
        type: "quiz",
        difficulty: "easy",
        points_reward: 40,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Activities for Weekend Trivia Challenge
      {
        contest_id: contests[5].id,
        title: "Pop Culture Trivia",
        description: "Questions about movies, music, and TV",
        type: "quiz",
        difficulty: "easy",
        points_reward: 60,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // // Activities for Coding Marathon
      // {
      //   contest_id: contests[6].id,
      //   title: "24-Hour Coding Challenge",
      //   description: "Code for 24 hours straight",
      //   type: "coding",
      //   difficulty: "expert",
      //   points_reward: 200,
      //   is_active: true,
      //   created_by: 1,
      //   updated_by: 1
      // },
      // Activities for Puzzle Championship
      {
        contest_id: contests[7].id,
        title: "Logic Puzzles",
        description: "Solve these challenging logic puzzles",
        type: "quiz",
        difficulty: "hard",
        points_reward: 120,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // {
      //   contest_id: contests[7].id,
      //   title: "Escape Room Challenge",
      //   description: "Virtual escape room experience",
      //   type: "escape_room",
      //   difficulty: "medium",
      //   points_reward: 150,
      //   is_active: true,
      //   created_by: 1,
      //   updated_by: 1
      // }
    ]);

    // Create quizzes for activities
    const quizzes = await ContestQuiz.bulkCreate([
      // Quiz for Data Structures Quiz activity
      {
        activity_id: activities[0].id,
        title: "Data Structures Fundamentals",
        description: "Test your knowledge of basic data structures",
        time_limit_seconds: 600,
        max_attempts: 3,
        qualify_percentage: 70,
        points_reward: 50,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for General Knowledge Quiz activity
      {
        activity_id: activities[1].id,
        title: "General Knowledge Test",
        description: "How much do you know about the world?",
        time_limit_seconds: 900,
        max_attempts: 2,
        qualify_percentage: 60,
        points_reward: 75,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for Science & Technology activity
      {
        activity_id: activities[2].id,
        title: "Science & Technology Quiz",
        description: "Test your knowledge of science and tech",
        time_limit_seconds: 1200,
        max_attempts: 2,
        qualify_percentage: 75,
        points_reward: 100,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for History Quiz activity
      {
        activity_id: activities[3].id,
        title: "World History Quiz",
        description: "Questions about historical events",
        time_limit_seconds: 900,
        max_attempts: 2,
        qualify_percentage: 65,
        points_reward: 80,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for Logic Puzzles activity
      {
        activity_id: activities[4].id,
        title: "Logic Puzzles Set",
        description: "Solve these logic puzzles",
        time_limit_seconds: 1800,
        max_attempts: 5,
        qualify_percentage: 80,
        points_reward: 40,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for Pop Culture Trivia activity
      {
        activity_id: activities[5].id,
        title: "Pop Culture Trivia",
        description: "Test your knowledge of popular culture",
        time_limit_seconds: 600,
        max_attempts: 3,
        qualify_percentage: 70,
        points_reward: 60,
        is_active: true,
        created_by: 1,
        updated_by: 1
      },
      // Quiz for Logic Puzzles activity (Puzzle Championship)
      {
        activity_id: activities[6].id,
        title: "Advanced Logic Puzzles",
        description: "Challenging logic puzzles for experts",
        time_limit_seconds: 2400,
        max_attempts: 2,
        qualify_percentage: 85,
        points_reward: 120,
        is_active: true,
        created_by: 1,
        updated_by: 1
      }
    ]);

    // Create MCQ questions for quizzes
    const mcqQuestions = await MCQChallenge.bulkCreate([
      // Questions for Data Structures Quiz
      {
        contest_quiz_id: quizzes[0].id,
        question_text: "Which data structure uses LIFO principle?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[0].id,
        question_text: "What is the time complexity of accessing an element in an array?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[0].id,
        question_text: "Which of these is a self-balancing binary search tree?",
        is_active: true
      },
      // Questions for General Knowledge Quiz
      {
        contest_quiz_id: quizzes[1].id,
        question_text: "What is the capital of Australia?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[1].id,
        question_text: "Which planet is known as the Red Planet?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[1].id,
        question_text: "Who painted the Mona Lisa?",
        is_active: true
      },
      // Questions for Science & Technology Quiz
      {
        contest_quiz_id: quizzes[2].id,
        question_text: "What is the chemical symbol for gold?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[2].id,
        question_text: "Which programming language was created by Guido van Rossum?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[2].id,
        question_text: "What does CPU stand for?",
        is_active: true
      },
      // Questions for History Quiz
      {
        contest_quiz_id: quizzes[3].id,
        question_text: "In which year did World War II end?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[3].id,
        question_text: "Who was the first President of the United States?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[3].id,
        question_text: "Which ancient civilization built the Machu Picchu?",
        is_active: true
      },
      // Questions for Logic Puzzles
      {
        contest_quiz_id: quizzes[4].id,
        question_text: "If all Bloops are Razzies and all Razzies are Lazzies, then all Bloops are definitely Lazzies?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[4].id,
        question_text: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?",
        is_active: true
      },
      // Questions for Pop Culture Trivia
      {
        contest_quiz_id: quizzes[5].id,
        question_text: "Who directed the movie 'Inception'?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[5].id,
        question_text: "Which artist released the album '1989'?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[5].id,
        question_text: "Which TV series features houses Stark, Lannister, and Targaryen?",
        is_active: true
      },
      // Questions for Advanced Logic Puzzles
      {
        contest_quiz_id: quizzes[6].id,
        question_text: "You are in a room with three light switches. Each switch controls one of three light bulbs in another room. You can only enter the other room once. How can you determine which switch controls which bulb?",
        is_active: true
      },
      {
        contest_quiz_id: quizzes[6].id,
        question_text: "There are 12 identical-looking balls, but one is slightly heavier or lighter. You have a balance scale. How can you find the different ball and determine if it's heavier or lighter in just three weighings?",
        is_active: true
      }
    ]);

    // Create options for MCQ questions
    await MCQOptionChallenge.bulkCreate([
      // Options for Data Structures questions
      { mcq_id: mcqQuestions[0].id, option_text: "Queue", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[0].id, option_text: "Stack", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[0].id, option_text: "Array", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[0].id, option_text: "Linked List", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[1].id, option_text: "O(1)", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[1].id, option_text: "O(n)", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[1].id, option_text: "O(log n)", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[1].id, option_text: "O(n log n)", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[2].id, option_text: "Binary Tree", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[2].id, option_text: "AVL Tree", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[2].id, option_text: "B-tree", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[2].id, option_text: "Heap", option_type: "text", is_correct: false, is_active: true },

      // Options for General Knowledge questions
      { mcq_id: mcqQuestions[3].id, option_text: "Sydney", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[3].id, option_text: "Melbourne", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[3].id, option_text: "Canberra", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[3].id, option_text: "Perth", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[4].id, option_text: "Venus", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[4].id, option_text: "Mars", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[4].id, option_text: "Jupiter", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[4].id, option_text: "Saturn", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[5].id, option_text: "Vincent van Gogh", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[5].id, option_text: "Leonardo da Vinci", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[5].id, option_text: "Pablo Picasso", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[5].id, option_text: "Michelangelo", option_type: "text", is_correct: false, is_active: true },

      // Options for Science & Technology questions
      { mcq_id: mcqQuestions[6].id, option_text: "Au", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[6].id, option_text: "Ag", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[6].id, option_text: "Fe", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[6].id, option_text: "Cu", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[7].id, option_text: "Java", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[7].id, option_text: "Python", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[7].id, option_text: "C++", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[7].id, option_text: "JavaScript", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[8].id, option_text: "Central Processing Unit", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[8].id, option_text: "Computer Processing Unit", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[8].id, option_text: "Central Program Unit", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[8].id, option_text: "Computer Program Unit", option_type: "text", is_correct: false, is_active: true },

      // Options for History questions
      { mcq_id: mcqQuestions[9].id, option_text: "1945", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[9].id, option_text: "1918", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[9].id, option_text: "1939", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[9].id, option_text: "1950", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[10].id, option_text: "Thomas Jefferson", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[10].id, option_text: "George Washington", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[10].id, option_text: "Abraham Lincoln", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[10].id, option_text: "John Adams", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[11].id, option_text: "Aztecs", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[11].id, option_text: "Mayans", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[11].id, option_text: "Incas", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[11].id, option_text: "Egyptians", option_type: "text", is_correct: false, is_active: true },

      // Options for Logic Puzzles
      { mcq_id: mcqQuestions[12].id, option_text: "True", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[12].id, option_text: "False", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[13].id, option_text: "5 cents", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[13].id, option_text: "10 cents", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[13].id, option_text: "1 dollar", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[13].id, option_text: "1.05 dollars", option_type: "text", is_correct: false, is_active: true },

      // Options for Pop Culture Trivia
      { mcq_id: mcqQuestions[14].id, option_text: "Christopher Nolan", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[14].id, option_text: "Steven Spielberg", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[14].id, option_text: "James Cameron", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[14].id, option_text: "Quentin Tarantino", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[15].id, option_text: "Taylor Swift", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[15].id, option_text: "Adele", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[15].id, option_text: "Beyoncé", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[15].id, option_text: "Lady Gaga", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[16].id, option_text: "The Walking Dead", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[16].id, option_text: "Game of Thrones", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[16].id, option_text: "Stranger Things", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[16].id, option_text: "The Crown", option_type: "text", is_correct: false, is_active: true },

      // Options for Advanced Logic Puzzles
      { mcq_id: mcqQuestions[17].id, option_text: "Turn on two switches, wait 5 minutes, turn one off, then enter the room", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[17].id, option_text: "Turn on all switches and enter the room", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[17].id, option_text: "Turn on one switch, wait 1 minute, then enter the room", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[17].id, option_text: "Turn on one switch, enter the room, then turn on another", option_type: "text", is_correct: false, is_active: true },

      { mcq_id: mcqQuestions[18].id, option_text: "Divide into groups of 4 and weigh", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[18].id, option_text: "Divide into groups of 6 and weigh", option_type: "text", is_correct: false, is_active: true },
      { mcq_id: mcqQuestions[18].id, option_text: "Divide into groups of 3 and use a specific weighing pattern", option_type: "text", is_correct: true, is_active: true },
      { mcq_id: mcqQuestions[18].id, option_text: "Weigh 6 against 6 first", option_type: "text", is_correct: false, is_active: true }
    ]);

    // Create some fill in the blanks questions
    await FillInTheBlanksChallenge.bulkCreate([
      {
        contest_quiz_id: quizzes[1].id,
        text: "The _____ is the largest ocean on Earth.",
        answers: ["Pacific Ocean", "Pacific"],
        is_active: true
      },
      {
        contest_quiz_id: quizzes[2].id,
        text: "The element with atomic number 1 is _____.",
        answers: ["Hydrogen", "H"],
        is_active: true
      },
      {
        contest_quiz_id: quizzes[3].id,
        text: "The French Revolution began in the year _____.",
        answers: ["1789"],
        is_active: true
      }
    ]);

    // Create some true/false questions
    await TrueFalseChallenge.bulkCreate([
      {
        contest_quiz_id: quizzes[1].id,
        question: "The Great Wall of China is visible from space with the naked eye.",
        answer: false,
        is_active: true
      },
      {
        contest_quiz_id: quizzes[2].id,
        question: "Water boils at 100 degrees Celsius at sea level.",
        answer: true,
        is_active: true
      },
      {
        contest_quiz_id: quizzes[3].id,
        question: "Julius Caesar was the first emperor of Rome.",
        answer: false,
        is_active: true
      }
    ]);

    console.log("Default contest data inserted successfully");
  } catch (error) {
    console.error("Error inserting default contest data:", error);
  }
};

module.exports = insertDefaultContestData;