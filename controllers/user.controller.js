import * as userService from "../services/user.service.js";

export const getUsers = async (req, res, next) => {
    try {
        const users = await userService.getUsers();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

export const getUser = async (req, res, next) => {
    try {
        const user = await userService.getUser(req.params.id);
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

export const createUser = async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        const user = await userService.createUser({ name, email, password });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

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
