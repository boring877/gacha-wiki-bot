# 🤖 GachaWiki Discord Bot

A Discord bot that provides character information and game data from [GachaWiki](https://gachawiki.info), pulling data directly from the GitHub repository.

## ✨ Features

- **Character Lookup**: Search for characters by name across all games
- **Random Character**: Get a random character with optional filters
- **Character Lists**: Browse characters by game, element, or role
- **Real-time Data**: Automatically syncs with the latest wiki updates
- **Rich Embeds**: Beautiful character cards with stats and images

## 🎮 Supported Games

- **Zone Nova**: 32+ characters with stats, elements, and roles
- **Silver and Blood**: 37+ characters with comprehensive data

## 🛠️ Commands

| Command | Description | Options |
|---------|-------------|---------|
| `/character [name]` | Look up character info | `name` (required), `game` (optional) |
| `/random` | Get a random character | `game`, `rarity` (optional) |
| `/list` | List characters with filters | `game`, `element`, `role` (optional) |

### Command Examples

```
/character name:Artemis
/character name:Ami game:Silver and Blood
/random game:Zone Nova rarity:SSR
/list element:Fire role:DPS
```

## 🚀 Setup Instructions

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to "Bot" section and click "Add Bot"
4. Copy the bot token (keep this secret!)
5. Go to "OAuth2" → "General" and copy the Application ID

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

1. Copy `.env.example` to `.env`
2. Fill in your Discord bot credentials:

```env
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here  # Optional, for faster development
```

### 4. Invite Bot to Server

1. Go to Discord Developer Portal → OAuth2 → URL Generator
2. Select scopes: `bot` and `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
4. Use the generated URL to invite the bot

### 5. Run the Bot

```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## 📁 Project Structure

```
gacha-wiki-bot/
├── src/
│   ├── bot.js              # Main bot file
│   ├── commands/           # Slash commands
│   │   ├── character.js    # Character lookup
│   │   ├── random.js       # Random character
│   │   └── list.js         # Character listing
│   └── utils/
│       └── dataFetcher.js  # GitHub data fetching
├── .env.example            # Environment template
├── package.json
└── README.md
```

## 🔧 How It Works

The bot fetches data directly from the GachaWiki GitHub repository using raw file URLs:

```
https://raw.githubusercontent.com/boring877/gacha-wiki/main/src/data/zone-nova/characters.js
```

- **Automatic Updates**: No manual data sync needed
- **5-minute Cache**: Reduces API calls while staying current
- **Fallback Handling**: Graceful error handling for missing data
- **Cross-game Search**: Searches across all supported games

## 🎨 Features Showcase

### Character Cards
Rich embed displays with:
- Character name and rarity-colored borders
- Stats (HP, Attack, Defense)
- Element and role information
- Character artwork thumbnails
- Direct links to full wiki guides

### Smart Search
- Partial name matching: "arte" finds "Artemis"
- Cross-game search or game-specific lookups
- Case-insensitive matching

### Filtering Options
- Filter by game, element, role, or rarity
- Organized lists grouped by rarity
- Random character with constraints

## 🤝 Contributing

Found a bug or want to add features? Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Data sourced from [GachaWiki](https://gachawiki.info)
- Built with [Discord.js](https://discord.js.org/)
- Supports Zone Nova and Silver and Blood games

---

**Made with ❤️ for the gacha gaming community**