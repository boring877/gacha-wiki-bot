const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/boring877/gacha-wiki/main/src/data';

class DataFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  async fetchRawFile(path) {
    const url = `${GITHUB_RAW_BASE}${path}`;
    
    if (this.cache.has(url)) {
      const cached = this.cache.get(url);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.status}`);
      }
      
      const text = await response.text();
      this.cache.set(url, { data: text, timestamp: Date.now() });
      return text;
    } catch (error) {
      console.error(`Error fetching data from ${url}:`, error);
      throw error;
    }
  }

  parseJSModule(jsContent) {
    try {
      // Try to find simple array export first
      const exportMatch = jsContent.match(/export\s+const\s+\w+\s*=\s*(\[[\s\S]*?\]);/);
      if (exportMatch) {
        return JSON.parse(exportMatch[1].replace(/([{,]\s*)(\w+):/g, '$1"$2":'));
      }
      
      // Try named export pattern
      const namedExportMatch = jsContent.match(/export\s*{\s*(\w+)[\s\S]*?};[\s\S]*?const\s+\1\s*=\s*(\[[\s\S]*?\]);/);
      if (namedExportMatch) {
        return JSON.parse(namedExportMatch[2].replace(/([{,]\s*)(\w+):/g, '$1"$2":'));
      }

      // Try to find characters array declaration (for Silver & Blood format)
      const charactersMatch = jsContent.match(/const\s+characters\s*=\s*(\[[\s\S]*?\]);/);
      if (charactersMatch) {
        // Extract just the variable names and create simple objects
        const charactersStr = charactersMatch[1];
        const varNames = charactersStr.match(/\w+/g);
        if (varNames) {
          // Create simplified character objects from variable names
          return varNames.map(name => ({
            name: name.replace(/([A-Z])/g, ' $1').trim(),
            id: name,
            rarity: 'Unknown',
            element: 'Unknown',
            role: 'Unknown'
          }));
        }
      }

      throw new Error('Could not parse JavaScript module');
    } catch (error) {
      console.error('Error parsing JS module:', error);
      throw error;
    }
  }

  async getZoneNovaCharacters() {
    const jsContent = await this.fetchRawFile('/zone-nova/characters.js');
    return this.parseJSModule(jsContent);
  }

  async getSilverAndBloodCharacters() {
    const jsContent = await this.fetchRawFile('/silver-and-blood/characters.js');
    return this.parseJSModule(jsContent);
  }

  async getGameData(game, dataType) {
    try {
      const jsContent = await this.fetchRawFile(`/${game}/${dataType}.js`);
      return this.parseJSModule(jsContent);
    } catch (error) {
      console.error(`Failed to fetch ${dataType} data for ${game}:`, error);
      return [];
    }
  }

  async getRedeemCodes(game) {
    return await this.getGameData(game, 'redeem-codes');
  }

  async getUpdates(game) {
    return await this.getGameData(game, 'updates');
  }

  async getRifts(game) {
    return await this.getGameData(game, 'rifts');
  }

  async getMemories(game) {
    return await this.getGameData(game, 'memories');
  }

  async findCharacter(name, game = null) {
    const searches = [];
    
    if (!game || game === 'zone-nova') {
      searches.push(this.getZoneNovaCharacters().then(chars => 
        chars.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
      ));
    }
    
    if (!game || game === 'silver-and-blood') {
      searches.push(this.getSilverAndBloodCharacters().then(chars => 
        chars.find(c => c.name.toLowerCase().includes(name.toLowerCase()))
      ));
    }

    const results = await Promise.allSettled(searches);
    
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        return result.value;
      }
    }
    
    return null;
  }

  async getAllCharacters(game = null) {
    if (game === 'zone-nova') {
      return await this.getZoneNovaCharacters();
    }
    
    if (game === 'silver-and-blood') {
      return await this.getSilverAndBloodCharacters();
    }

    const [znChars, sabChars] = await Promise.allSettled([
      this.getZoneNovaCharacters(),
      this.getSilverAndBloodCharacters()
    ]);

    const allChars = [];
    if (znChars.status === 'fulfilled') allChars.push(...znChars.value);
    if (sabChars.status === 'fulfilled') allChars.push(...sabChars.value);
    
    return allChars;
  }
}

export default new DataFetcher();