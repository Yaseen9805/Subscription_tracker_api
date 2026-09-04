import { signinUser, signupUser } from "../services/auth.service.js";

export const signup = async function (req, res, next) {
    try {
        const { name, email, password } = req.body;
        const { token, user } = await signupUser({ name, email, password });

        res.status(201).json({
            success: true,
            message: 'User created Successfully',
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

export const signin = async function (req, res, next) {
    try {
        const { email, password } = req.body;
        const { token, user } = await signinUser({ email, password });

        res.status(200).json({
            success: true,
            message: 'User signed in Successfully',
            data: { token, user },
        });
    } catch (error) {
        next(error);
    }
};

export const signout = async function (req, res, next) {
    try {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'User signed out Successfully',
        });
    } catch (error) {
        next(error);
    }
};
