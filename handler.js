const fs = require("fs");
const path = require("path");

const commands = new Map();
const plugins = [];

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

      if (!command.name || typeof command.execute !== "function") {
        console.log(`⚠️ Invalid command: ${file}`);
        continue;
      }

      commands.set(command.name.toLowerCase(), command);
      console.log(`✅ Command loaded: ${command.name}`);
    } catch (error) {
      console.log(`❌ Command failed: ${file}`);
      console.log(error.message);
    }
  }
}

function loadPlugins() {
  const pluginsPath = path.join(__dirname, "plugins");

  if (!fs.existsSync(pluginsPath)) {
    fs.mkdirSync(pluginsPath);
  }

  const files = fs.readdirSync(pluginsPath)
    .filter(file => file.endsWith(".js"));

  for (const file of files) {
    try {
      const plugin = require(path.join(pluginsPath, file));

      if (typeof plugin !== "function") {
        console.log(`⚠️ Invalid plugin: ${file}`);
        continue;
      }

      plugins.push(plugin);
      console.log(`🔌 Plugin loaded: ${file}`);
    } catch (error) {
      console.log(`❌ Plugin failed: ${file}`);
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
    console.log(
      `❌ Command error [${commandName}]:`,
      error.message
    );
  }
}

async function runPlugins(sock, msg) {
  for (const plugin of plugins) {
    try {
      await plugin(sock, msg);
    } catch (error) {
      console.log("❌ Plugin error:", error.message);
    }
  }
}

loadCommands();
loadPlugins();

module.exports = {
  commands,
  plugins,
  loadCommands,
  loadPlugins,
  handleCommand,
  runPlugins
};
