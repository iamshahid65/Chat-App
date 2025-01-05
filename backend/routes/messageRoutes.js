const express = require('express');
const router = express.Router();
const Message = require('../models/messageModel');

router.post('/add', async (req, res) => {
    try {
        const newMessage = new Message({
            room: req.body.room,
            sender: req.body.sender,
            senderName: req.body.senderName,
            message: req.body.message
        });
        const message = await newMessage.save();
        res.status(201).json({message});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.get('/:room', async (req, res) => {
    try {
        const room = req.params.room;
        const messages = await Message.find({room});
        res.status(200).json(messages)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
});

module.exports = router;