import { Client, Collection, Events, GatewayIntentBits, REST, Routes, ActivityType } from 'discord.js';
import { config } from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readdir } from 'fs/promises';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.commands = new Collection();

async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFiles = (await readdir(commandsPath)).filter(file => file.endsWith('.js'));

  const commands = [];

  for (const file of commandFiles) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command = await import(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: ${command.data.name}`);
    } else {
      console.log(`⚠️ Command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }

  return commands;
}

async function deployCommands(commands) {
  const rest = new REST().setToken(process.env.DISCORD_TOKEN);
  
  try {
    console.log(`🔄 Refreshing ${commands.length} application (/) commands...`);
    
    if (process.env.GUILD_ID) {
      await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`✅ Successfully reloaded guild commands for ${process.env.GUILD_ID}`);
    } else {
      await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log('✅ Successfully reloaded global application commands');
    }
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
}

client.once(Events.ClientReady, readyClient => {
  console.log(`🚀 Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${client.guilds.cache.size} servers`);
  
  // Set bot status to online and activity
  client.user.setPresence({
    activities: [{ name: '📚 GachaWiki guides', type: ActivityType.Watching }],
    status: 'online'
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error(`❌ No command matching ${interaction.commandName} was found.`);
      return;
    }

    try {
      await command.execute(interaction);
      console.log(`✅ Executed /${interaction.commandName} for ${interaction.user.tag}`);
    } catch (error) {
      console.error(`❌ Error executing ${interaction.commandName}:`, error);
      
      // Ensure we always respond to avoid "application did not respond" error
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your command.', 
          ephemeral: true 
        });
      }
      
      const errorMessage = '❌ There was an error while executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMessage, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  } else if (interaction.isButton() || interaction.isStringSelectMenu()) {
    // Handle button and select menu interactions
    const { handleInteraction } = await import('./commands/gacha.js');
    try {
      await handleInteraction(interaction);
    } catch (error) {
      console.error('❌ Error handling interaction:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ An error occurred while processing your interaction.', 
          ephemeral: true 
        });
      }
    }
  }
});

async function main() {
  try {
    const commands = await loadCommands();
    
    if (!process.env.DISCORD_TOKEN) {
      console.error('❌ DISCORD_TOKEN is required in .env file');
      process.exit(1);
    }
    
    if (!process.env.CLIENT_ID) {
      console.error('❌ CLIENT_ID is required in .env file');
      process.exit(1);
    }

    await deployCommands(commands);
    await client.login(process.env.DISCORD_TOKEN);
    
  } catch (error) {
    console.error('❌ Error starting bot:', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

main();