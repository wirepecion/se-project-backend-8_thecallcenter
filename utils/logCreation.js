const Log = require('../models/Log'); 

/* istanbul ignore next */
exports.logCreation = (userId, type, action) => {
    const logEntry = new Log({
        user: userId,
        type: type,
        action: action,
        timestamp: new Date()
    });

    logEntry.save()
        .catch((err) => {
            console.error('Error creating log entry:', err);
        });
}