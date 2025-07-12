const { findUserById } = require('../repositories/user-repository');
const { NotFound } = require('../utils/error');

async function getMeService(userId) {
    const user = await findUserById(userId);
    if (!user) {
        throw new NotFound('User not found');
    }
    return user;
}

module.exports = {
    getMeService
};