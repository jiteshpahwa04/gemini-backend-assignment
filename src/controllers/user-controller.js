const { getMeService } = require("../services/user-service");

async function getMeController(req, res, next) {
    try {
        const { userId } = req.user;
        const user = await getMeService(userId);
        res.json({ user });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    getMeController,
};