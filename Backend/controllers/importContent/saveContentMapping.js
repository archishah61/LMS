const ContentMapping = require("../../models/course_management/contentMapping");
const Module = require("../../models/course_management/module");
const Session = require("../../models/course_management/session");
const Topic = require("../../models/course_management/topic");

exports.saveContentMapping = async ({
    type,
    original_id,
    copiedObject,
    userId,
    transaction
}) => {

    // **1️⃣ Fetch existing row**
    const existing = await ContentMapping.findOne({
        where: { type, original_id },
        transaction
    });

    let original_course_id;

    if (type === "session") {
        const sessionData = await Session.findOne({
            where: { id: original_id },
            attributes: ["course_id"],
            raw: true
        })
        original_course_id = sessionData.course_id
    } else if (type === "module") {
        const moduleData = await Module.findOne({
            where: { id: original_id },
            attributes: ["course_id"],
            raw: true
        })
        original_course_id = moduleData.course_id
    } else if (type === "topic") {
        const topicData = await Topic.findOne({
            where: { id: original_id },
            attributes: ["module_id"],
            raw: true
        })

        const moduleData = await Module.findOne({
            where: { id: topicData.module_id },
            attributes: ["course_id"],
            raw: true
        })

        original_course_id = moduleData.course_id
    }


    // **2️⃣ If exists → UPDATE it**
    if (existing) {
        let copiedArr = [];

        // Convert stored to array
        if (Array.isArray(existing.copied_id)) {
            copiedArr = existing.copied_id;
        } else if (existing.copied_id) {
            copiedArr = [existing.copied_id];
        }

        copiedArr.push(copiedObject);

        // 🔥 Direct Update using "update" method
        await ContentMapping.update(
            {
                copied_id: copiedArr,
                updated_by: userId,
                updated_by_type: "admin"
            },
            {
                where: { type, original_id },
                transaction
            }
        );

        // Return fresh updated row
        return await ContentMapping.findOne({
            where: { type, original_id },
            transaction
        });
    }

    // **3️⃣ No record → CREATE**
    return await ContentMapping.create(
        {
            original_course_id,
            type,
            original_id,
            copied_id: [copiedObject],
            created_by: userId,
            updated_by: userId,
            created_by_type: "admin",
            updated_by_type: "admin"
        },
        { transaction }
    );
};
