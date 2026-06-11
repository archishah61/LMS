const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const CheatSheet = require('../../models/cheat_sheet/cheatsheet'); // Adjust the path as necessary
const { callProcedure } = require("../../utils/procedure/callProcedure");
const Validation = require("../../validations");
const { callProcedureChallenge } = require("../../utils/procedure/callProcedureChallenge");

// Create a new cheat sheet
const createCheatSheet = async (req, res, next) => {
    try {
        let {
            title,
            description,
            isPaid,
            price,
            discount,
            isActive,
            createdBy,
            updatedBy,
            created_by_type,
            updated_by_type,
        } = req.body;

        const imageUrl = req.file ? "/cheat-sheet/image/" + req.file.filename : null;

        createdBy = req.user?.id || createdBy;
        updatedBy = req.user?.id || updatedBy;
        created_by_type = req.user?.role || created_by_type;
        updated_by_type = req.user?.role || updated_by_type;

        // Validations
        Validation.isString(title, { min: 1, max: 255 }, "Invalid title");
        Validation.isString(description, { min: 1 }, "Invalid description");

        if (isPaid !== undefined) {
            if (isPaid !== 'true' && isPaid !== 'false') {
                Validation.throwError("isPaid must be 'true' or 'false'");
            }
        }

        if (price !== undefined) {
            Validation.isNumber(price, { min: 0 }, "Invalid price");
        }

        if (discount !== undefined) {
            Validation.isNumber(discount, { min: 0 }, "Invalid discount");
        }

        if (isActive !== undefined) {
            if (isActive !== 'true' && isActive !== 'false') {
                Validation.throwError("isActive must be 'true' or 'false'");
            }
        }

        Validation.isInteger(createdBy, "Invalid createdBy");
        Validation.isInteger(updatedBy, "Invalid updatedBy");

        Validation.isEnum(created_by_type, ['admin', 'partner'], "Invalid created_by_type");
        Validation.isEnum(updated_by_type, ['admin', 'partner'], "Invalid updated_by_type");

        // Convert string 'true'/'false' to boolean
        const isPaidBool = isPaid === 'true';
        const isActiveBool = isActive === 'true';

        // Replace undefined values with null
        const params = [
            title !== undefined ? title : null,
            imageUrl !== undefined ? imageUrl : null,
            description !== undefined ? description : null,
            isPaidBool ? 1 : 0, // Convert boolean to integer
            price !== undefined ? price : null,
            discount !== undefined ? discount : null,
            isActiveBool ? 1 : 0, // Convert boolean to integer
            createdBy !== undefined ? createdBy : null,
            updatedBy !== undefined ? createdBy : null,
            created_by_type !== undefined ? created_by_type : null,
            updated_by_type !== undefined ? updated_by_type : null,
        ];

        const { success, data, error } = await callProcedure("createCheatSheet", params);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(201).json({ message: "CheatSheet created successfully", cheatSheet: data });
    } catch (error) {
        next(error);
    }
};

const getAllCheatSheets = async (req, res, next) => {
    try {
        const role = req.role;
        const id = req.user?.id;
        let success, data, error;

        const {
            createdBy = "all",
            createdById,
            search_term = "",
            limit = "all",
            offset = "0",
        } = req.query;

        if (limit !== "all" && limit !== "ALL") {
            Validation.isInteger(limit, "Limit must be a positive integer or 'all'.");
        }

        Validation.isInteger(offset, "Offset must be a non-negative integer.");
        if (search_term) Validation.isString(search_term, { min: 1, max: 255 });

        const parsedLimit = limit === "all" ? "all" : Number(limit);
        const parsedOffset = Number(offset);

        if (role === "partner") {
            ({ success, data, error } = await callProcedureChallenge("getAllCheatSheetsByRole", [
                role,
                id || null,
                search_term,
                limit === "all" ? 0 : parsedLimit,
                parsedOffset,
                limit === "all" || false
            ]));
        } else {
            ({ success, data, error } = await callProcedureChallenge("getAllCheatSheets", [
                createdBy,
                createdById === "all" ? null : createdById,
                search_term,
                limit === "all" ? 0 : parsedLimit,
                parsedOffset,
                limit === "all" || false
            ]));
        }

        if (!success) {
            return next(error);
        }

        res.status(200).json({ totalCount: data[0][0].total_count, cheatsheets: Object.values(data[1]) });

    } catch (error) {
        next(error);
    }
};


const getAllActiveCheatSheets = async (req, res, next) => {
    try {
        let {
            search_term = "",
            filter = "all", // all, free, paid, purchased
            page = 1,
            limit = 12
        } = req.query;

        let userId = null;

        const parsedLimit = Number(limit) || 12;
        const parsedPage = Number(page) || 1;
        const offset = (parsedPage - 1) * parsedLimit;

        const { success, data, error } = await callProcedureChallenge("getAllActiveCheatSheets", [
            search_term || "",
            filter || "all",
            userId,
            parsedLimit,
            offset
        ]);

        if (!success) {
            return next(error);
        }

        // data[0] is total count (ROW PACKET), data[1] is result set
        const totalCount = data[0][0]?.total_count || 0;
        const cheatSheets = data[1] ? Object.values(data[1]) : [];

        res.status(200).json({
            total_count: totalCount,
            cheatsheets: cheatSheets,
            current_page: parsedPage,
            total_pages: Math.ceil(totalCount / parsedLimit)
        });
    } catch (error) {
        next(error);
    }
};

const getCheatSheetById = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Invalid CheatSheet ID");
        const { success, data, error } = await callProcedure("getCheatSheetById", [id]);
        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        if (data.length === 0) {
            return res.status(404).json({ message: "CheatSheet not found" });
        }

        res.status(200).json(data[0]);
    } catch (error) {
        next(error);
    }
};

const updateCheatSheet = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            isPaid,
            price,
            discount,
            updatedBy,
        } = req.body;

        Validation.isInteger(id, "Invalid CheatSheet ID");


        const cheatSheet = await CheatSheet.findByPk(id);

        if (!cheatSheet) return res.status(404).json({ message: "CheatSheet not found" });

        const imageUrl = req.file
            ? "/cheat-sheet/image/" + req.file.filename
            : cheatSheet.imageUrl; // preserve existing image

        if (title !== undefined) Validation.isString(title, { min: 1, max: 255 }, "Invalid title");
        if (description !== undefined) Validation.isString(description, { min: 1 }, "Invalid description");

        if (isPaid !== undefined) {
            if (isPaid !== 'true' && isPaid !== 'false') {
                Validation.throwError("isPaid must be 'true' or 'false'");
            }
        }

        if (price !== undefined) Validation.isNumber(price, { min: 0 }, "Invalid price");
        if (discount !== undefined) Validation.isNumber(discount, { min: 0 }, "Invalid discount");

        Validation.isInteger(updatedBy, "Invalid updatedBy");

        if (!cheatSheet) {
            return res.status(404).json({ message: "CheatSheet not found" });
        }

        // Convert string 'true'/'false' to boolean for isPaid
        const isPaidBool = isPaid === 'true';

        // Use the existing isActive status from the database
        const isActiveBool = cheatSheet.isActive;

        const { success, error } = await callProcedure("updateCheatSheet", [
            cheatSheet.id,
            title,
            imageUrl || null,
            description || null,
            isPaidBool ? 1 : 0, // Convert boolean to integer
            price !== undefined ? price : null,
            discount !== undefined ? discount : null,
            isActiveBool ? 1 : 0, // Use existing isActive status
            updatedBy || null,
        ]);

        if (!success) {
            return next(error);
        }

        res.status(200).json({ message: "CheatSheet updated successfully" });
    } catch (error) {
        next(error);
    }
};

const deleteCheatSheet = async (req, res, next) => {
    try {
        const { id } = req.params;
        Validation.isInteger(id, "Invalid CheatSheet ID");
        const { success, error } = await callProcedure("deleteCheatSheet", [id]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(200).json({ message: "CheatSheet deleted successfully" });
    } catch (error) {
        next(error);
    }
};

const updateCheatSheetStatus = async (req, res, next) => {
    try {
        const { cheatSheetId } = req.params;
        const { status } = req.body;
        Validation.isInteger(cheatSheetId, "Invalid CheatSheet ID");
        if (status !== true && status !== false) {
            return res.status(400).json({
                message: "Invalid status value. Status must be 'true' or 'false'."
            });
        }

        const { success, error } = await callProcedure("updateCheatSheetStatus", [cheatSheetId, status]);

        if (!success) {
            return next(error);
            // return res.status(400).json({ error });
        }

        res.status(200).json({
            message: `CheatSheet ${status ? 'activated' : 'deactivated'} successfully`,
        });
    } catch (error) {
        next(error);
    }
};

// Purchase a paid cheat sheet
const purchasePaidCheatSheet = async (req, res, next) => {
    try {
        const {
            cheatsheet_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            reference_id,
            status,
            notes,
            payment_gateway,
            gateway_response,
        } = req.body;

        const user_id = req.user?.id;

        // Validations
        Validation.isInteger(user_id, "Invalid user ID");
        Validation.isInteger(cheatsheet_id, "Invalid cheatsheet ID");
        Validation.isNumber(amount, { min: 0 }, "Invalid amount");
        Validation.isEnum(currency, ['INR', 'USD', 'bank_transfer', 'upi'], "Invalid currency");
        Validation.isString(payment_method, { min: 1 }, "Invalid payment method");
        Validation.isString(transaction_id, { min: 1 }, "Invalid transaction ID");
        Validation.isEnum(status, ['pending', 'completed', 'failed', 'refunded'], "Invalid status");

        // Check if cheatsheet exists and is paid
        const cheatSheet = await CheatSheet.findByPk(cheatsheet_id);
        if (!cheatSheet) {
            return res.status(404).json({ message: "CheatSheet not found" });
        }

        if (!cheatSheet.isPaid) {
            return res.status(400).json({ message: "This cheatsheet is free and doesn't require payment" });
        }

        if (!cheatSheet.isActive) {
            return res.status(400).json({ message: "This cheatsheet is not active" });
        }

        // Check if user already has access to this cheatsheet
        const { success: accessCheckSuccess, data: accessData } = await callProcedure("checkUserCheatSheetAccess", [user_id, cheatsheet_id]);

        if (accessCheckSuccess && accessData.length > 0 && accessData[0].has_access) {
            return res.status(400).json({ message: "User already has access to this cheatsheet" });
        }

        // Prepare parameters for the procedure
        const params = [
            user_id,
            cheatsheet_id,
            amount,
            currency,
            payment_method,
            transaction_id,
            reference_id || null,
            status,
            notes || null,
            payment_gateway || null,
            gateway_response ? JSON.stringify(gateway_response) : null,
            user_id
        ];

        const { success, data, error } = await callProcedure("purchasePaidCheatSheet", params);

        if (!success) {
            return next(error);
        }

        res.status(201).json({
            message: "CheatSheet purchased successfully",
            purchase: data[0],
            cheatsheet: {
                id: cheatSheet.id,
                title: cheatSheet.title,
                description: cheatSheet.description,
                price: cheatSheet.price,
                discount: cheatSheet.discount
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get all paid cheat sheets for a user
const getUserPaidCheatSheets = async (req, res, next) => {
    try {
        const userId = req.user?.id;

        // Validation
        Validation.isInteger(userId, "Invalid user ID");

        const { success, data, error } = await callProcedure("getUserPaidCheatSheets", [userId]);


        if (!success) {
            return next(error);
        }

        // Transform data to include calculated fields
        const transformedData = data.map(item => {
            const price = Number(item.price) || 0;
            const discountPercent = Number(item.discount) || 0;

            const final_price =
                discountPercent > 0
                    ? price - (price * discountPercent) / 100
                    : price;
            return {
                cheatsheet_id: item.cheatsheet_id,
                title: item.title,
                imageUrl: item.imageUrl,
                description: item.description,
                price: parseFloat(item.price),
                discount: item.discount ? parseFloat(item.discount) : null,
                final_price: Number(final_price.toFixed(2)),
                isPaid: Boolean(item.isPaid),
                isActive: Boolean(item.isActive),
                access_granted_at: item.access_granted_at,
                payment_details: {
                    payment_id: item.payment_id,
                    paid_amount: parseFloat(item.paid_amount),
                    currency: item.currency,
                    payment_method: item.payment_method,
                    transaction_id: item.transaction_id,
                    payment_status: item.payment_status,
                    transaction_date: item.transaction_date,
                    payment_gateway: item.payment_gateway,
                    gateway_response: item.gateway_response,
                    payment_notes: item.payment_notes
                },
                cheatsheet_created_at: item.cheatsheet_created_at,
                cheatsheet_updated_at: item.cheatsheet_updated_at
            }
        });

        res.status(200).json({
            message: "User paid cheatsheets retrieved successfully",
            count: transformedData.length,
            cheatsheets: transformedData
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createCheatSheet,
    getAllCheatSheets,
    getAllActiveCheatSheets,
    getCheatSheetById,
    updateCheatSheet,
    deleteCheatSheet,
    updateCheatSheetStatus,
    purchasePaidCheatSheet,
    getUserPaidCheatSheets
};
