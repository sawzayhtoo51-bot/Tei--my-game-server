const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const MONGO_URI = "mongodb+srv://sawzayhtoo51_db_user:R7YZvndVohybHYlf@cluster0.6txhcxa.mongodb.net/gameDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.error("DB Error:", err));

const PlayerSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    balance: { type: Number, default: 5000 }
});
const Player = mongoose.model('Player', PlayerSchema);

let gameSettings = { winChancePercentage: 50 };

app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }
        const existingUser = await Player.findOne({ username: username.toLowerCase().trim() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Username already exists!" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newPlayer = new Player({ username: username.toLowerCase().trim(), password: hashedPassword });
        await newPlayer.save();
        res.json({ success: true, message: "Registration successful!" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Registration error" });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ success: false, message: "Missing fields" });
        }
        const player = await Player.findOne({ username: username.toLowerCase().trim() });
        if (!player) {
            return res.status(400).json({ success: false, message: "User not found!" });
        }
        const isMatch = await bcrypt.compare(password, player.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Wrong password!" });
        }
        res.json({ success: true, playerId: player._id, username: player.username, balance: player.balance });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server login error" });
    }
});

app.get('/api/admin/players', async (req, res) => {
    try {
        const players = await Player.find({}, '-password');
        res.json(players);
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/admin/update-balance', async (req, res) => {
    try {
        const { playerId, amount } = req.body;
        const player = await Player.findByIdAndUpdate(playerId, { balance: Number(amount) }, { new: true });
        if (player) return res.json({ success: true, message: "Balance updated", player });
        res.status(404).json({ success: false, message: "Player not found" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

app.post('/api/admin/update-settings', (req, res) => {
    const { winChance } = req.body;
    gameSettings.winChancePercentage = Number(winChance);
    res.json({ success: true, message: `Win chance set to ${winChance}%` });
});

app.post('/api/game/spin', async (req, res) => {
    try {
        const { playerId, betAmount } = req.body;
        const player = await Player.findById(playerId);
        if (!player || player.balance < betAmount) {
            return res.status(400).json({ success: false, message: "Insufficient balance!" });
        }
        const randomNumber = Math.floor(Math.random() * 100) + 1;
        const isWin = randomNumber <= gameSettings.winChancePercentage;
        if (isWin) {
            const winAmount = betAmount * 2;
            player.balance += betAmount;
            await player.save();
            res.json({ result: "WIN", winAmount, newBalance: player.balance });
        } else {
            player.balance -= betAmount;
            await player.save();
            res.json({ result: "LOSE", winAmount: 0, newBalance: player.balance });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: "Server error" });
    }
});

const path = require('path');
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
