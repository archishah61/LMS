const { DataTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { Quizzes } = require('./quizzesModel');

const QuizQuestion = sequelize.define(
    'QuizQuestion',
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        quiz_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'tbl_quiz',
                key: 'id',
            },
        },
        type: {
            type: DataTypes.ENUM(
                'dragdrop',
                'audiotoscript',
                'videotoscript',
                'imagetoscript',
                'realword',
                'summarizepassage',
                'bestoption',
                'mcq',
                'complete the sentance',
                'arrangeorder',
                'video_pause',
                'audio_pause',
                'speaking'
            ),
            allowNull: false,
        },
        marks: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        question_img: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        speaking_question: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        speaking_answer: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        dragdrop_prompt: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        dragdrop_options: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        dragdrop_blanks: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        audiotoscript_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        audiotoscript_script: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        // ---------- VIDEO ----------
        videotoscript_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        videotoscript_script: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        // ---------- IMAGE ----------
        imagetoscript_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        imagetoscript_script: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        realword_words: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        realword_correct_answers: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        summarizepassage_summary: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        summarizepassage_time_limit: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        bestoption_passage: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        bestoption_blanked_words: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        mcq_question_text: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        arrangeorder_prompt: {
            type: DataTypes.TEXT, // or DataTypes.STRING if you expect shorter prompts
            allowNull: true,
        },
        sentences: {
            type: DataTypes.JSON, // store array of sentences
            allowNull: true,
        },
        correct_order: {
            type: DataTypes.JSON, // store array of indexes or IDs
            allowNull: true,
        },
        video_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        audio_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        // ---------- VIDEO PAUSE ----------
        video_pause_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        video_pause_stamps: {
            type: DataTypes.JSON, // e.g. [20,30,35,50]
            allowNull: true,
        },
        video_pause_question_ids: {
            type: DataTypes.JSON, // e.g. [2,9,11,14]
            allowNull: true,
        },

        // ---------- AUDIO PAUSE ----------
        audio_pause_url: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        audio_pause_stamps: {
            type: DataTypes.JSON, // e.g. [20,30,35,50]
            allowNull: true,
        },
        audio_pause_question_ids: {
            type: DataTypes.JSON, // e.g. [2,9,11,14]
            allowNull: true,
        },
        assigned_pause_id: {
            type: DataTypes.INTEGER,  // stores the id of video_pause/audio_pause question
            allowNull: false,
            defaultValue: 0,          // 0 means not assigned to any pause container
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        created_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        created_by_type: {
            type: DataTypes.ENUM('admin', 'partner'),
            defaultValue: 'admin',
        },
        updated_by: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        updated_by_type: {
            type: DataTypes.ENUM('admin', 'partner'),
            defaultValue: 'admin',
        }
    },
    {
        tableName: 'tbl_quiz_questions',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
);

// Associations
Quizzes.hasMany(QuizQuestion, { foreignKey: 'quiz_id' });
QuizQuestion.belongsTo(Quizzes, { foreignKey: 'quiz_id' });

QuizQuestion.associate = (models) => {
    QuizQuestion.belongsTo(models.Quizzes, { foreignKey: 'quiz_id' });
    QuizQuestion.belongsTo(models.Admin, { foreignKey: 'created_by' });
    QuizQuestion.belongsTo(models.Admin, { foreignKey: 'updated_by' });
};

module.exports = { QuizQuestion };
