const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const pino = require("pino");

async function startLUXUNOVA() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./session");

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: "silent" })
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("╔════════════════════════════╗");
      console.log("║       🤖 LUXUNOVA         ║");
      console.log("║       ONLINE ✅            ║");
      console.log("╚════════════════════════════╝");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startLUXUNOVA();
      } else {
        console.log("❌ Session logged out.");
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];

    if (!msg?.message || msg.key.fromMe) return;

    const jid = msg.key.remoteJid;

    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      "";

    const command = text.trim().toLowerCase();

    if (command === ".menu") {
      await sock.sendMessage(jid, {
        text:
`╭━━━〔 🤖 LUXUNOVA 〕━━━╮
┃
┃   ✦ WELCOME TO LUXUNOVA
┃
┃   ⚡ GENERAL
┃   • .ping
┃   • .alive
┃   • .owner
┃   • .help
┃
┃   🛠️ TOOLS
┃   • .time
┃   • .date
┃   • .calc
┃   • .weather
┃   • .short
┃
┃   ℹ️ INFO
┃   • .info
┃   • .uptime
┃   • .version
┃
╰━━━━━━━━━━━━━━━━━━━━╯

👇 Select a command from the menu.`
      });
    }

    if (command === ".ping") {
      await sock.sendMessage(jid, {
        text: "🏓 *PONG!*\n\n⚡ LUXUNOVA is online."
      });
    }

    if (command === ".alive") {
      await sock.sendMessage(jid, {
        text:
`🤖 *LUXUNOVA*

✅ Status: Online
⚡ System: Active
🚀 Version: V1.0.0`
      });
    }

    if (command === ".owner") {
      await sock.sendMessage(jid, {
        text: "👑 *LUXUNOVA OWNER*\n\nOwner details will be added later."
      });
    }

    if (command === ".help") {
      await sock.sendMessage(jid, {
        text:
`📖 *LUXUNOVA HELP*

Use:
.menu
.ping
.alive
.owner
.help

More features coming soon 🚀`
      });
    }

    if (command === ".info") {
      await sock.sendMessage(jid, {
        text:
`ℹ️ *LUXUNOVA INFO*

🤖 Name: LUXUNOVA
📦 Version: 1.0.0
⚡ Status: Online`
      });
    }

    if (command === ".version") {
      await sock.sendMessage(jid, {
        text: "📦 LUXUNOVA Version: *V1.0.0*"
      });
    }
  });
}

startLUXUNOVA();
