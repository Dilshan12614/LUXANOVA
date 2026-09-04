const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (text) =>
  new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./auth_info");

  const sock = makeWASocket({
    auth: state,
    logger: P({ level: "silent" }),
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  if (!state.creds.registered) {
    const number = await question(
      "WhatsApp number (+ නැතුව): "
    );

    const phoneNumber = number.replace(/\D/g, "");

    console.log("\n⏳ Pairing code ලබාගනිමින්...\n");

    const code = await sock.requestPairingCode(phoneNumber);

    console.log("================================");
    console.log("🔐 PAIRING CODE:", code);
    console.log("================================\n");
    console.log(
      "WhatsApp → Settings → Linked Devices → Link a device → Link with phone number"
    );
  }

  sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
    if (connection === "open") {
      console.log("\n✅ WhatsApp successfully linked!");
      console.log("🤖 Bot is online!\n");
    }

    if (connection === "close") {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !==
        DisconnectReason.loggedOut;

      if (shouldReconnect) {
        console.log("🔄 Reconnecting...");
        startBot();
      } else {
        console.log("❌ WhatsApp logged out.");
      }
    }
  });
}

startBot().catch((err) => {
  console.error("❌ Error:", err);
});
