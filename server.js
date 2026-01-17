/**
 * N I N E P A C M A N . I D — SUPREME CORE ENGINE
 * Status: Final Production Build (Stable)
 * Features: Telegram Bot, Identity Generator, IBAN Engine, Temp Mail API
 *
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const fs = require('fs');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. CONFIGURATION & DATABASE ---
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const ADMIN_ID = 7815361814; //

const USER_DB = 'users.json';
if (!fs.existsSync(USER_DB)) fs.writeFileSync(USER_DB, '{}');
const loadData = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

const REGISTRY = {
    'GB': { name: 'United Kingdom', nat: 'gb', flag: '🇬🇧', bank: 'MIDL', code: '1611', len: 8 },
    'FR': { name: 'France', nat: 'fr', flag: '🇫🇷', bank: '20041', code: '1527', len: 11 },
    'DE': { name: 'Germany', nat: 'de', flag: '🇩🇪', bank: '70051540', code: '1314', len: 10 },
    'NL': { name: 'Netherlands', nat: 'nl', flag: '🇳🇱', bank: 'ABNA', code: '2321', len: 10 }
};

// --- 2. CORE ALGORITHM: IBAN ENGINE ---
function generateSecureIBAN(cc) {
    const cfg = REGISTRY[cc];
    const acc = Math.floor(Math.pow(10, cfg.len-1) + Math.random() * Math.pow(10, cfg.len-1) * 9).toString();
    let bban = (cc === 'GB') ? cfg.bank + "070093" + acc : (cc === 'FR') ? cfg.bank + "01005" + acc + "80" : cfg.bank + acc;
    let rawStr = bban + cfg.code + "00";
    let numericStr = rawStr.replace(/[A-Z]/g, char => (char.charCodeAt(0) - 55).toString());
    const mod = BigInt(numericStr) % 97n;
    const checkDigits = (98n - mod).toString().padStart(2, '0');
    return `${cc}${checkDigits}${bban}`;
}

// --- 3. MIDDLEWARES & STATIC ASSETS ---
app.use(express.json());
app.use(cookieParser());
// Melayani file dari folder 'public' secara otomatis
app.use(express.static(path.join(__dirname, 'public')));

// --- 4. API ENDPOINTS (FOR WEB INTERFACE) ---

// A. Endpoint: Provisioning Identity & IBAN
app.get('/api/v1/fetch/:cc', async (req, res) => {
    const cc = req.params.cc.toUpperCase();
    if (!REGISTRY[cc]) return res.status(400).json({ success: false });
    try {
        const response = await axios.get(`https://randomuser.me/api/?nat=${REGISTRY[cc].nat}`);
        const user = response.data.results[0];
        res.json({
            success: true,
            payload: {
                identity: { name: `${user.name.first} ${user.name.last}`, phone: user.phone },
                location: { city: user.location.city, postcode: user.location.postcode },
                finance: { iban: generateSecureIBAN(cc), node: REGISTRY[cc].name, flag: REGISTRY[cc].flag }
            }
        });
    } catch (e) { res.status(500).json({ success: false }); }
});

// B. Endpoint: Temp Mail Domains
app.get('/api/domains', async (req, res) => {
    try {
        const response = await axios.get('https://www.1secmail.com/api/v1/?action=getDomainsList');
        res.json(response.data);
    } catch (e) { res.json([]); }
});

// --- 5. TELEGRAM BOT HANDLER ---
bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, "🚀 **NINEPACMAN.ID** established. System is ready.");
});

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- 7. START SYSTEM ---
app.listen(PORT, () => {
    console.log(`\n================================================`);
    console.log(`[OK] NINEPACMAN SYSTEM: http://localhost:${PORT}`);
    console.log(`[OK] TELEGRAM BOT: ACTIVE (ID: ${ADMIN_ID})`);
    console.log(`================================================\n`);
});