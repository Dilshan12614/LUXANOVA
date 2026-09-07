const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
SESSION_ID: process.env.SESSION_ID || "9ZMEGLQA#FH0ziNSwik-4q_wNHCMQiR29NaU4tlHor8aa21zQBhE",

ALIVE_IMG: process.env.ALIVE_IMG || "https://i.imgur.com/VxY8k7L.jpg", // 👈 මේක ඔයාගේ image link එක
ALIVE_MSG: process.env.ALIVE_MSG || "*Hello👋 DANUWA-MD Is Alive Now😍*\n\n*Owner:* Danuwa\n*Status:* Online ✅",

BOT_OWNER: '94740534738',  // Replace with the owner's phone number
};
