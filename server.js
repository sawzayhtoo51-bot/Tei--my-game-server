const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

let players = [
    { id: "p1", name: "Player One", balance: 5000 },
    { id: "p2", name: "Player Two", balance: 10000 }
];

let gameSettings = {
    winChancePercentage: 50 
};

app.get('/api/admin/players', (req, res) => {
    res.json(players);
});

app.post('/api/admin/update-balance', (req, res) => {
    const { playerId, amount } = req.body;
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.balance = Number(amount);
        return res.json({ success: true, message: "Balance updated successfully", player });
    }
    res.status(404).json({ success: false, message: "Player not found" });
});

app.post('/api/admin/update-settings', (req, res) => {
    const { winChance } = req.body;
    if (winChance >= 0 && winChance <= 100) {
        gameSettings.winChancePercentage = Number(winChance);
        return res.json({ success: true, message: `Win chance set to ${winChance}%` });
    }
    res.status(400).json({ success: false, message: "Invalid percentage" });
});

app.post('/api/game/spin', (req, res) => {
    const { playerId, betAmount } = req.body;
    const player = players.find(p => p.id === playerId);

    if (!player || player.balance < betAmount) {
        return res.status(400).json({ success: false, message: "Insufficient balance or invalid player" });
    }
    const randomNumber = Math.floor(Math.random() * 100) + 1;
    const isWin = randomNumber <= gameSettings.winChancePercentage;

    if (isWin) {
        const winAmount = betAmount * 2;
        player.balance += betAmount; 
        res.json({ result: "WIN", winAmount: winAmount, newBalance: player.balance });
    } else {
        player.balance -= betAmount;
        res.json({ result: "LOSE", winAmount: 0, newBalance: player.balance });
    }
});
app.use(express.static(__dirname));
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/admin', (req, res) => {
    res.sendFile(__dirname + '/admin.html');
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
