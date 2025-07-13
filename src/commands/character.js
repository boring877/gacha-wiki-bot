import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dataFetcher from '../utils/dataFetcher.js';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Quick character lookup')
  .addStringOption(option =>
    option
      .setName('game')
      .setDescription('Select the game')
      .setRequired(true)
      .addChoices(
        { name: 'Zone Nova', value: 'zone-nova' },
        { name: 'Silver and Blood', value: 'silver-and-blood' }
      )
  )
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('Character name to search for')
      .setRequired(true)
  );

export async function execute(interaction) {
  const game = interaction.options.getString('game');
  const characterName = interaction.options.getString('name');

  await interaction.deferReply();

  try {
    const character = await dataFetcher.findCharacter(characterName, game);
    
    if (!character) {
      await interaction.editReply(`❌ Character "${characterName}" not found in ${getGameDisplayName(game)}.`);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🌟 ${character.name}`)
      .setColor(getRarityColor(character.rarity))
      .addFields(
        { name: '⭐ Rarity', value: character.rarity || 'Unknown', inline: true },
        { name: '🔥 Element', value: character.element || 'Unknown', inline: true },
        { name: '⚔️ Role', value: character.role || 'Unknown', inline: true }
      );

    if (character.stats) {
      const statsText = [
        `❤️ HP: ${character.stats.hp || 'N/A'}`,
        `⚔️ Attack: ${character.stats.attack || 'N/A'}`,
        `🛡️ Defense: ${character.stats.defense || 'N/A'}`
      ].join('\n');
      embed.addFields({ name: '📊 Base Stats', value: statsText, inline: false });
    }

    if (character.image) {
      embed.setThumbnail(`https://gachawiki.info${character.image}`);
    }

    if (character.detailUrl) {
      embed.addFields({ 
        name: '🔗 Full Guide', 
        value: `[View on GachaWiki](https://gachawiki.info${character.detailUrl})`,
        inline: false 
      });
    }

    embed.setFooter({ text: `${getGameDisplayName(game)} • gachawiki.info` });

    await interaction.editReply({ embeds: [embed] });
    
  } catch (error) {
    console.error('Error in character command:', error);
    await interaction.editReply('❌ An error occurred while fetching character data. Please try again later.');
  }
}

function getRarityColor(rarity) {
  const colors = {
    'SSR': 0xFF6B35,    // Orange
    'SR': 0x9B59B6,     // Purple  
    'R': 0x3498DB,      // Blue
    'N': 0x95A5A6       // Gray
  };
  return colors[rarity] || 0x2F3136;
}

function getGameDisplayName(game) {
  const gameNames = {
    'zone-nova': 'Zone Nova',
    'silver-and-blood': 'Silver & Blood'
  };
  return gameNames[game] || game;
}