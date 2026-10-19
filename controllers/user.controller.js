import * as userService from "../services/user.service.js";

export const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.user.id, req.body);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id, req.user.id);
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        next(error);
    }
};
