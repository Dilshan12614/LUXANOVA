const fs = require("fs");
const path = require("path");

const commands = new Map();

function loadCommands() {
  const commandsPath = path.join(__dirname, "commands");

  if (!fs.existsSync(commandsPath)) {
    fs.mkdirSync(commandsPath);
  }

  const files = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    try {
      const command = require(path.join(commandsPath, file));

      if (!command.name || !command.execute) {
        console.log(`⚠️ Invalid command: ${file}`);
        continue;
      }

      commands.set(command.name.toLowerCase(), command);
      console.log(`✅ Loaded: ${command.name}`);
    } catch (error) {
      console.log(`❌ Failed: ${file}`);
      console.log(error.message);
    }
  }
}

async function handleCommand(sock, msg, text) {
  const commandName = text
    .trim()
    .split(/\s+/)[0]
    .toLowerCase()
    .replace(/^\./, "");

  const command = commands.get(commandName);

  if (!command) return;

  try {
    await command.execute(sock, msg);
  } catch (error) {
    console.log(`❌ Command error [${commandName}]:`, error.message);
  }
}

loadCommands();

module.exports = {
  commands,
  loadCommands,
  handleCommand
};
