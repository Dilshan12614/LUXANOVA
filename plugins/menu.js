module.exports = {
  name: "menu",
  description: "Show LUXUNOVA menu",

  async execute(sock, msg) {
    await sock.sendMessage(msg.key.remoteJid, {
      text:
`╭━━━〔 🤖 LUXUNOVA 〕━━━╮
┃
┃  ✦  WELCOME
┃
┃  ⚡ GENERAL
┃  • .ping
┃  • .alive
┃  • .owner
┃  • .help
┃
┃  🛠️ TOOLS
┃  • .time
┃  • .date
┃  • .calc
┃  • .weather
┃  • .short
┃
┃  ℹ️ INFO
┃  • .info
┃  • .uptime
┃  • .version
┃
╰━━━━━━━━━━━━━━━━━━━━╯`
    });
  }
};
