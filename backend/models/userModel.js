const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
    },
    userName: { // NEW FIELD FOR USER NAME
        type: String,
        default: null
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;