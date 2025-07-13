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
  const gameData = getGameContent(game);
  
  let embed = new EmbedBuilder()
    .setColor(game === 'zone-nova' ? 0x3498DB : 0x9B59B6)
    .setFooter({ text: `${getGameDisplayName(game)} • gachawiki.info` });

  if (section === 'redeem-codes') {
    const codes = gameData.redeemCodes;
    embed.setTitle('🎫 Active Redeem Codes')
      .setDescription('**Copy these codes in-game for free rewards!**');
    
    if (codes.length > 0) {
      codes.forEach(code => {
        embed.addFields({
          name: `\`${code.code}\``,
          value: `🎁 **${code.rewards}**\n⏰ Expires: ${code.expiry}`,
          inline: true
        });
      });
    } else {
      embed.addFields({
        name: '📝 No Active Codes',
        value: 'Check back later for new codes!\nCodes are usually released during events and maintenance.',
        inline: false
      });
    }
    
    embed.addFields({
      name: '📖 How to Redeem',
      value: '1. Open the game\n2. Go to Settings > Redeem Code\n3. Enter the code exactly as shown\n4. Collect rewards from mailbox',
      inline: false
    });
    
  } else if (section === 'updates') {
    const updates = gameData.updates;
    embed.setTitle('📰 Latest Updates')
      .setDescription('**Recent patches and news for ' + getGameDisplayName(game) + '**');
    
    updates.forEach(update => {
      embed.addFields({
        name: `${update.version} - ${update.title}`,
        value: `${update.description}\n**Released:** ${update.date}`,
        inline: false
      });
    });
    
  } else if (section === 'memories') {
    const memories = gameData.memories;
    embed.setTitle('💭 Character Memories')
      .setDescription('**Unlock character backstories and lore**');
    
    memories.forEach(memory => {
      embed.addFields({
        name: `✨ ${memory.title}`,
        value: `**Character:** ${memory.character}\n**Unlock:** ${memory.requirement}\n**Chapters:** ${memory.chapters}`,
        inline: true
      });
    });
    
    embed.addFields({
      name: '🎯 Tips',
      value: '• Memories unlock character development\n• Some memories affect gameplay stats\n• Complete all chapters for bonus rewards',
      inline: false
    });
    
  } else if (section === 'rifts') {
    const rifts = gameData.rifts;
    embed.setTitle('🌀 Dimensional Rifts')
      .setDescription('**Challenge powerful enemies for rare rewards**');
    
    rifts.forEach(rift => {
      embed.addFields({
        name: `${rift.difficulty} ${rift.name}`,
        value: `**Best Rewards:** ${rift.rewards}\n**Recommended Power:** ${rift.power}\n**Strategy:** ${rift.strategy}`,
        inline: false
      });
    });
    
  } else if (section === 'summon-faq') {
    const faq = gameData.summonFAQ;
    embed.setTitle('❓ Summoning Guide')
      .setDescription('**Everything you need to know about summoning**');
    
    faq.forEach(item => {
      embed.addFields({
        name: item.question,
        value: item.answer,
        inline: false
      });
    });
    
  } else if (section === 'damage-mechanics') {
    const mechanics = gameData.damageMechanics;
    embed.setTitle('⚔️ Combat Mechanics')
      .setDescription('**Master the battle system**');
    
    embed.addFields(
      {
        name: '🗡️ Damage Formula',
        value: mechanics.formula,
        inline: false
      },
      {
        name: '🔥 Element Wheel',
        value: mechanics.elements,
        inline: false
      },
      {
        name: '⭐ Critical Hits',
        value: mechanics.criticals,
        inline: false
      },
      {
        name: '🛡️ Defense Types',
        value: mechanics.defense,
        inline: false
      }
    );
    
  } else {
    embed.setTitle('📚 Coming Soon')
      .setDescription(`The ${section} section is being developed. Check back soon!`)
      .addFields({
        name: '🔗 Visit Full Wiki',
        value: `[Browse ${getGameDisplayName(game)} guides](https://gachawiki.info/guides/${game})`,
        inline: false
      });
  }

  await interaction.editReply({ embeds: [embed], components: [] });
}

function getGameContent(game) {
  const content = {
    'zone-nova': {
      redeemCodes: [
        { code: 'NOVA2024', rewards: '500 Gems + 10 Summon Tickets', expiry: 'Dec 31, 2024' },
        { code: 'WELCOME100', rewards: '1000 Gems + Starter Pack', expiry: 'Permanent' },
        { code: 'LAUNCH2024', rewards: '300 Gems + 5 Energy Potions', expiry: 'Jan 15, 2025' }
      ],
      updates: [
        {
          version: 'v2.1.0',
          title: 'Winter Festival Update',
          description: 'New winter-themed characters, events, and quality of life improvements. Limited-time snow maps and holiday rewards.',
          date: 'Dec 15, 2024'
        },
        {
          version: 'v2.0.5',
          title: 'Balance Patch',
          description: 'Character balance adjustments, bug fixes, and performance optimizations. Several SSR characters received buffs.',
          date: 'Nov 28, 2024'
        }
      ],
      memories: [
        { title: 'Artemis: Hunter\'s Path', character: 'Artemis', requirement: 'Reach Bond Level 5', chapters: '3 Chapters' },
        { title: 'Naiya: Ocean\'s Call', character: 'Naiya', requirement: 'Complete Chapter 3', chapters: '4 Chapters' },
        { title: 'Kela: Sacred Duty', character: 'Kela', requirement: 'Reach Level 50', chapters: '3 Chapters' }
      ],
      rifts: [
        {
          name: 'Crimson Depths',
          difficulty: '⭐⭐⭐',
          rewards: 'Legendary Weapons, Red Crystals',
          power: '25,000+',
          strategy: 'Bring fire-resistant characters, focus on burst damage'
        },
        {
          name: 'Frozen Sanctum',
          difficulty: '⭐⭐⭐⭐',
          rewards: 'Mythic Artifacts, Ice Essence',
          power: '40,000+',
          strategy: 'Use fire elements, avoid prolonged battles'
        }
      ],
      summonFAQ: [
        { question: '🎯 What are the summon rates?', answer: 'SSR: 2% | SR: 13% | R: 85%\nPity system guarantees SSR at 90 pulls' },
        { question: '💎 How much does summoning cost?', answer: '1 Pull: 300 gems\n10 Pull: 2700 gems (10% discount)\nDaily discount: First pull 150 gems' },
        { question: '🎫 Should I save for limited banners?', answer: 'Yes! Limited characters are often stronger and cannot be obtained later. Save 27,000 gems for guaranteed limited character.' },
        { question: '🔄 What\'s the best summoning strategy?', answer: 'Always do 10-pulls for the bonus. Focus on one banner at a time. Use singles only when close to pity.' }
      ],
      damageMechanics: {
        formula: 'Final Damage = (ATK × Skill Multiplier × Element Bonus × Crit Multiplier) - Enemy DEF',
        elements: 'Fire > Wind > Earth > Water > Fire\nHoly ⟷ Chaos (mutual 50% bonus)\nAdvantage gives 30% damage bonus',
        criticals: 'Base Crit Rate: 5%\nBase Crit Damage: 200%\nMax Crit Rate: 100% (with gear)',
        defense: 'Physical DEF reduces physical damage\nMagical DEF reduces magical damage\nPenetration ignores % of enemy defense'
      }
    },
    'silver-and-blood': {
      redeemCodes: [
        { code: 'BLOOD2024', rewards: '800 Blood Crystals + Equipment', expiry: 'Dec 31, 2024' },
        { code: 'SILVER100', rewards: '1200 Silver Coins + Weapons', expiry: 'Permanent' }
      ],
      updates: [
        {
          version: 'v1.8.0',
          title: 'Bloodmoon Rising',
          description: 'New vampire-themed faction, dark magic system, and PvP improvements. Night raids and blood pact mechanics.',
          date: 'Dec 10, 2024'
        }
      ],
      memories: [
        { title: 'Vlad: Ancient Bloodline', character: 'Vlad', requirement: 'Complete Blood Ritual', chapters: '5 Chapters' },
        { title: 'Luna: Silver Moon', character: 'Luna', requirement: 'Reach Rank S', chapters: '4 Chapters' }
      ],
      rifts: [
        {
          name: 'Crimson Cathedral',
          difficulty: '⭐⭐⭐⭐⭐',
          rewards: 'Ancient Artifacts, Blood Essence',
          power: '60,000+',
          strategy: 'Bring holy damage dealers, avoid vampire abilities'
        }
      ],
      summonFAQ: [
        { question: '🎯 What are the summon rates?', answer: 'Legendary: 1.5% | Epic: 15% | Rare: 83.5%\nSpark system at 200 pulls' },
        { question: '💎 What currency is used?', answer: 'Blood Crystals for premium summons\nSilver Coins for equipment summons' },
        { question: '🌙 When do rates increase?', answer: 'During Blood Moon events (monthly)\nRates double for vampire faction characters' }
      ],
      damageMechanics: {
        formula: 'Damage = (Base ATK + Weapon ATK) × Skill % × Blood Bonus × Class Modifier',
        elements: 'Silver > Undead > Dark > Blood > Silver\nHoly damage is super effective vs all dark types',
        criticals: 'Crit Rate scales with Agility\nVampires gain crit from enemy missing health',
        defense: 'Armor reduces physical damage\nWard reduces magical damage\nBlood Shield absorbs specific damage types'
      }
    }
  };
  
  return content[game] || content['zone-nova'];
}

export async function handleInteraction(interaction) {
  const customId = interaction.customId;
  
  if (customId.startsWith('game:')) {
    const game = customId.split(':')[1];
    await showSectionMenu(interaction, game);
  } else if (customId.startsWith('section:')) {
    // Handle select menu interaction
    const game = customId.split(':')[1];
    const section = interaction.values[0]; // Get selected value from select menu
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
        await handleRandomCharacterButton(interaction, game);
      } else if (action === 'list') {
        await handleListCharactersButton(interaction, game);
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

async function handleRandomCharacterButton(interaction, game) {
  try {
    let characters = await dataFetcher.getAllCharacters(game);

    if (characters.length === 0) {
      await interaction.editReply({ content: '❌ No characters found.', components: [] });
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

    await interaction.editReply({ embeds: [embed], components: [] });
    
  } catch (error) {
    console.error('Error in random character button:', error);
    await interaction.editReply({ content: '❌ An error occurred while fetching character data.', components: [] });
  }
}

async function handleListCharactersButton(interaction, game) {
  try {
    let characters = await dataFetcher.getAllCharacters(game);

    if (characters.length === 0) {
      await interaction.editReply({ content: '❌ No characters found.', components: [] });
      return;
    }

    characters.sort((a, b) => a.name.localeCompare(b.name));

    const embed = new EmbedBuilder()
      .setTitle(`📋 ${getGameDisplayName(game)} Characters`)
      .setColor(0x00ACC1)
      .setDescription(`**Total:** ${characters.length} characters`);

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

    embed.setFooter({ text: `Use /character ${game} [name] for details • gachawiki.info` });

    await interaction.editReply({ embeds: [embed], components: [] });
    
  } catch (error) {
    console.error('Error in list characters button:', error);
    await interaction.editReply({ content: '❌ An error occurred while fetching character data.', components: [] });
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