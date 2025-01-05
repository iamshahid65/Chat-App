const express = require('express');
const router = express.Router();
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

router.post('/register', async (req, res) => {
    try {
        let sessionId = uuidv4();
        const newUser = new User({
            sessionId: sessionId
        });

        const user = await newUser.save();

        const token = jwt.sign({ sessionId: user.sessionId }, process.env.JWT_SECRET);
        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// router.post('/update-name', async (req, res) => {
//     try {
//       const { token, userName } = req.body;
   
//       if (!token || !userName) {
//         return res.status(400).json({ message: "Token and userName are required." });
//       }
   
//       const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
//       const sessionId = decodedToken.sessionId
   
//       const user = await User.findOne({ sessionId });
   
//       if (!user) {
//         return res.status(404).json({ message: "User not found" })
//       }
//       user.userName = userName;
//       await user.save();
   
//       res.status(200).json({ message: 'User name updated successfully!' });
//     } catch (error) {
//       res.status(500).json({ error: error.message });
//     }
//    });
router.post('/update-name', async (req, res) => {
    try {
        const { userName } = req.body;

        if (!userName) {
          return res.status(400).json({ message: "Username is required." });
        }
        let sessionId = uuidv4();

        const newUser = new User({
          sessionId: sessionId,
          userName: userName,
        });
        const user = await newUser.save();

        const token = jwt.sign({ sessionId: user.sessionId }, process.env.JWT_SECRET);

        res.status(200).json({ message: 'User name updated successfully!', token});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/get-user-data', async(req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ message: "Token is required." });
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const sessionId = decodedToken.sessionId;

        const user = await User.findOne({sessionId});

        if (!user) {
            return res.status(404).json({ message: "User not found."});
        }

        res.status(200).json({ userName: user.userName });
    } catch(error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;