module.exports = async (sock, msg) => {
  if (!msg?.message || msg.key.fromMe) return;

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    "";

  const message = text.trim().toLowerCase();

  if (message === "hi" || message === "hello") {
    await sock.sendMessage(msg.key.remoteJid, {
      text: "👋 Hello!\n\n🤖 I'm LUXUNOVA."
    });
  }
};
