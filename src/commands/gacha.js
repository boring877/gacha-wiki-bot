import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import dataFetcher from '../utils/dataFetcher.js';

export const data = new SlashCommandBuilder()
  .setName('gacha')
  .setDescription('Browse gacha wiki content with interactive menus');

export async function execute(interaction) {
  // Show main game selection hub
  await showGameSelectionHub(interaction);
}

async function showGameSelectionHub(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('🎮 GachaWiki Hub')
    .setDescription('Choose a game to explore guides, characters, and more!')
    .setColor(0x00ACC1)
    .addFields(
      {
        name: '🌟 Zone Nova',
        value: 'Strategic gacha with elemental combat',
        inline: true
      },
      {
        name: '⚔️ Silver & Blood',
        value: 'Action-packed battle systems',
        inline: true
      }
    )
    .setFooter({ text: 'Click a button below to get started!' });

  const gameButtons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('game:zone-nova')
        .setLabel('Zone Nova')
        .setEmoji('🌟')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('game:silver-and-blood')
        .setLabel('Silver & Blood')
        .setEmoji('⚔️')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.reply({
    embeds: [embed],
    components: [gameButtons]
  });
}

async function handleCharacterLookup(interaction, game) {
  const characterName = interaction.options.getString('name');
  
  if (!characterName) {
    await interaction.editReply('❌ Please provide a character name for lookup.');
    return;
  }
  
  const character = await dataFetcher.findCharacter(characterName, game);
  
  if (!character) {
    await interaction.editReply(`❌ Character "${characterName}" not found in ${game}.`);
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
}

async function handleRandomCharacter(interaction, game) {
  const rarity = interaction.options.getString('rarity');
  
  let characters = await dataFetcher.getAllCharacters(game);
  
  if (rarity) {
    characters = characters.filter(char => char.rarity === rarity);
  }

  if (characters.length === 0) {
    await interaction.editReply('❌ No characters found with the specified filters.');
    return;
  }

  const randomCharacter = characters[Math.floor(Math.random() * characters.length)];

  const embed = new EmbedBuilder()
    .setTitle(`🎲 Random Character: ${randomCharacter.name}`)
    .setColor(getRarityColor(randomCharacter.rarity))
    .addFields(
      { name: '⭐ Rarity', value: randomCharacter.rarity || 'Unknown', inline: true },
      { name: '🔥 Element', value: randomCharacter.element || 'Unknown', inline: true },
      { name: '⚔️ Role', value: randomCharacter.role || 'Unknown', inline: true }
    );

  if (randomCharacter.stats) {
    const statsText = [
      `❤️ HP: ${randomCharacter.stats.hp || 'N/A'}`,
      `⚔️ Attack: ${randomCharacter.stats.attack || 'N/A'}`,
      `🛡️ Defense: ${randomCharacter.stats.defense || 'N/A'}`
    ].join('\n');
    embed.addFields({ name: '📊 Base Stats', value: statsText, inline: false });
  }

  if (randomCharacter.image) {
    embed.setThumbnail(`https://gachawiki.info${randomCharacter.image}`);
  }

  if (randomCharacter.detailUrl) {
    embed.addFields({ 
      name: '🔗 Full Guide', 
      value: `[View on GachaWiki](https://gachawiki.info${randomCharacter.detailUrl})`,
      inline: false 
    });
  }

  embed.setFooter({ text: `From ${characters.length} characters • ${getGameDisplayName(game)} • gachawiki.info` });

  await interaction.editReply({ embeds: [embed] });
}

async function handleListCharacters(interaction, game) {
  const element = interaction.options.getString('element');
  const role = interaction.options.getString('role');
  
  let characters = await dataFetcher.getAllCharacters(game);
  
  if (element) {
    characters = characters.filter(char => char.element === element);
  }
  
  if (role) {
    characters = characters.filter(char => char.role === role);
  }

  if (characters.length === 0) {
    await interaction.editReply('❌ No characters found with the specified filters.');
    return;
  }

  characters.sort((a, b) => a.name.localeCompare(b.name));

  const embed = new EmbedBuilder()
    .setTitle(`📋 ${getGameDisplayName(game)} Characters`)
    .setColor(0x00ACC1);

  const filters = [];
  if (element) filters.push(`Element: ${element}`);
  if (role) filters.push(`Role: ${role}`);
  
  if (filters.length > 0) {
    embed.setDescription(`**Filters:** ${filters.join(' • ')}\n**Total:** ${characters.length} characters`);
  } else {
    embed.setDescription(`**Total:** ${characters.length} characters`);
  }

  const groupedByRarity = characters.reduce((acc, char) => {
    const rarity = char.rarity || 'Unknown';
    if (!acc[rarity]) acc[rarity] = [];
    acc[rarity].push(char);
    return acc;
  }, {});

  const rarityOrder = ['SSR', 'SR', 'R', 'N', 'Unknown'];
  
  for (const rarity of rarityOrder) {
    if (groupedByRarity[rarity]) {
      const charNames = groupedByRarity[rarity]
        .map(char => char.name)
        .join(' • ');
      
      const rarityEmoji = {
        'SSR': '🌟',
        'SR': '⭐',
        'R': '✨',
        'N': '💫',
        'Unknown': '❓'
      };

      embed.addFields({
        name: `${rarityEmoji[rarity]} ${rarity} (${groupedByRarity[rarity].length})`,
        value: charNames.length > 1024 ? charNames.substring(0, 1021) + '...' : charNames,
        inline: false
      });
    }
  }

  embed.setFooter({ text: `Use /gacha ${game.replace('-', '-and-')} character [name] for details • gachawiki.info` });

  await interaction.editReply({ embeds: [embed] });
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

async function handleOtherSections(interaction, game, section, action) {
  const embed = new EmbedBuilder()
    .setColor(0x00ACC1)
    .setFooter({ text: `${getGameDisplayName(game)} • gachawiki.info` });

  if (section === 'redeem-codes') {
    embed.setTitle('🎫 Redeem Codes')
      .setDescription('Check out the latest redeem codes for free rewards!')
      .addFields({
        name: '🔗 View Codes',
        value: `[See all active codes on GachaWiki](https://gachawiki.info/guides/${game}/redeem-codes)`,
        inline: false
      });
  } else if (section === 'summon-faq') {
    embed.setTitle('❓ Summon FAQ')
      .setDescription('Get answers to common summoning questions!')
      .addFields({
        name: '🔗 Read FAQ',
        value: `[View summoning guide on GachaWiki](https://gachawiki.info/guides/${game}/summon-faq)`,
        inline: false
      });
  } else if (section === 'damage-mechanics') {
    embed.setTitle('⚔️ Damage Mechanics')
      .setDescription('Understand how damage calculations work in the game!')
      .addFields({
        name: '🔗 Learn More',
        value: `[View damage mechanics guide on GachaWiki](https://gachawiki.info/guides/${game}/damage-mechanics)`,
        inline: false
      });
  } else if (section === 'updates') {
    embed.setTitle('📰 Game Updates')
      .setDescription('Stay up to date with the latest game news and patches!')
      .addFields({
        name: '🔗 Latest News',
        value: `[View all updates on GachaWiki](https://gachawiki.info/guides/${game}/updates)`,
        inline: false
      });
  } else if (section === 'memories') {
    embed.setTitle('💭 Memories')
      .setDescription('Explore character memories and their stories!')
      .addFields({
        name: '🔗 Browse Memories',
        value: `[View memories on GachaWiki](https://gachawiki.info/guides/${game}/memories)`,
        inline: false
      });
  } else if (section === 'rifts') {
    embed.setTitle('🌀 Rifts')
      .setDescription('Learn about rift mechanics and strategies!')
      .addFields({
        name: '🔗 Rift Guide',
        value: `[View rift guide on GachaWiki](https://gachawiki.info/guides/${game}/rifts)`,
        inline: false
      });
  } else {
    embed.setTitle('📚 Coming Soon')
      .setDescription(`The ${section} section is being developed. Check back soon!`)
      .addFields({
        name: '🔗 Visit Wiki',
        value: `[Browse ${getGameDisplayName(game)} on GachaWiki](https://gachawiki.info/guides/${game})`,
        inline: false
      });
  }

  await interaction.editReply({ embeds: [embed] });
}

export async function handleInteraction(interaction) {
  const customId = interaction.customId;
  
  if (customId.startsWith('game:')) {
    const game = customId.split(':')[1];
    await showSectionMenu(interaction, game);
  } else if (customId.startsWith('section:')) {
    const [_, game, section] = customId.split(':');
    await showSectionActions(interaction, game, section);
  } else if (customId.startsWith('action:')) {
    const [_, game, section, action] = customId.split(':');
    await handleSectionAction(interaction, game, section, action);
  } else if (customId === 'back_to_games') {
    await showGameSelectionHub(interaction, true);
  } else if (customId.startsWith('back_to_sections:')) {
    const game = customId.split(':')[1];
    await showSectionMenu(interaction, game, true);
  }
}

async function showSectionMenu(interaction, game, isUpdate = false) {
  const embed = new EmbedBuilder()
    .setTitle(`📚 ${getGameDisplayName(game)} Wiki`)
    .setDescription('Choose a section to explore:')
    .setColor(game === 'zone-nova' ? 0x3498DB : 0x9B59B6)
    .addFields(
      { name: '👥 Characters', value: 'Character guides and info', inline: true },
      { name: '💭 Memories', value: 'Character stories', inline: true },
      { name: '🌀 Rifts', value: 'Rift strategies', inline: true },
      { name: '📰 Updates', value: 'Latest news', inline: true },
      { name: '🎫 Redeem Codes', value: 'Free rewards', inline: true },
      { name: '❓ Summon FAQ', value: 'Summoning help', inline: true }
    )
    .setFooter({ text: 'Select a section below!' });

  const sectionMenu = new StringSelectMenuBuilder()
    .setCustomId(`section:${game}`)
    .setPlaceholder('Choose a section...')
    .addOptions(
      {
        label: 'Characters',
        description: 'Browse character guides and information',
        value: 'characters',
        emoji: '👥'
      },
      {
        label: 'Memories',
        description: 'Explore character memories and stories',
        value: 'memories',
        emoji: '💭'
      },
      {
        label: 'Rifts',
        description: 'Learn about rift mechanics',
        value: 'rifts',
        emoji: '🌀'
      },
      {
        label: 'Updates',
        description: 'Latest game news and patches',
        value: 'updates',
        emoji: '📰'
      },
      {
        label: 'Redeem Codes',
        description: 'Get free rewards with codes',
        value: 'redeem-codes',
        emoji: '🎫'
      },
      {
        label: 'Summon FAQ',
        description: 'Summoning tips and help',
        value: 'summon-faq',
        emoji: '❓'
      }
    );

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('back_to_games')
        .setLabel('← Back to Games')
        .setStyle(ButtonStyle.Secondary)
    );

  const selectRow = new ActionRowBuilder().addComponents(sectionMenu);

  if (isUpdate) {
    await interaction.update({
      embeds: [embed],
      components: [selectRow, backButton]
    });
  } else {
    await interaction.reply({
      embeds: [embed],
      components: [selectRow, backButton]
    });
  }
}

async function showSectionActions(interaction, game, section) {
  const embed = new EmbedBuilder()
    .setTitle(`${getSectionEmoji(section)} ${getSectionName(section)}`)
    .setDescription(`What would you like to do in ${getSectionName(section)}?`)
    .setColor(game === 'zone-nova' ? 0x3498DB : 0x9B59B6)
    .setFooter({ text: `${getGameDisplayName(game)} • Choose an action below` });

  let actionButtons;

  if (section === 'characters') {
    actionButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`action:${game}:${section}:random`)
          .setLabel('Random Character')
          .setEmoji('🎲')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`action:${game}:${section}:list`)
          .setLabel('List All')
          .setEmoji('📋')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId(`action:${game}:${section}:search`)
          .setLabel('Search Character')
          .setEmoji('🔍')
          .setStyle(ButtonStyle.Success)
      );
  } else {
    actionButtons = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`action:${game}:${section}:view`)
          .setLabel(`View ${getSectionName(section)}`)
          .setEmoji('👀')
          .setStyle(ButtonStyle.Primary)
      );
  }

  const backButton = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`back_to_sections:${game}`)
        .setLabel('← Back to Sections')
        .setStyle(ButtonStyle.Secondary)
    );

  await interaction.update({
    embeds: [embed],
    components: [actionButtons, backButton]
  });
}

async function handleSectionAction(interaction, game, section, action) {
  await interaction.deferUpdate();

  try {
    if (section === 'characters') {
      if (action === 'random') {
        await handleRandomCharacter(interaction, game);
      } else if (action === 'list') {
        await handleListCharacters(interaction, game);
      } else if (action === 'search') {
        // For search, we'll prompt user to use a follow-up
        const embed = new EmbedBuilder()
          .setTitle('🔍 Character Search')
          .setDescription('To search for a character, please use the `/character` command:\n\n`/character game:' + game + ' name:character_name`')
          .setColor(0x00ACC1);
        
        await interaction.editReply({ embeds: [embed], components: [] });
        return;
      }
    } else {
      await handleOtherSections(interaction, game, section, action);
    }
  } catch (error) {
    console.error('Error handling section action:', error);
    await interaction.editReply({ 
      content: '❌ An error occurred while processing your request.', 
      components: [] 
    });
  }
}

function getSectionEmoji(section) {
  const emojis = {
    'characters': '👥',
    'memories': '💭',
    'rifts': '🌀',
    'updates': '📰',
    'redeem-codes': '🎫',
    'summon-faq': '❓',
    'damage-mechanics': '⚔️'
  };
  return emojis[section] || '📄';
}

function getSectionName(section) {
  const names = {
    'characters': 'Characters',
    'memories': 'Memories',
    'rifts': 'Rifts',
    'updates': 'Updates',
    'redeem-codes': 'Redeem Codes',
    'summon-faq': 'Summon FAQ',
    'damage-mechanics': 'Damage Mechanics'
  };
  return names[section] || section;
}

function getGameDisplayName(game) {
  const gameNames = {
    'zone-nova': 'Zone Nova',
    'silver-and-blood': 'Silver & Blood'
  };
  return gameNames[game] || game;
}