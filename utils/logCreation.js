const Log = require('../models/Log'); 

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