# Discord Avrae Data Scraper

A tool to analyze Avrae survival command results from Discord channels to verify and optimize encounter data.

## Setup

1. Install dependencies:
```bash
npm install discord.js dotenv csv-writer
```

2. Create a Discord Bot:
   - Go to https://discord.com/developers/applications
   - Create new application → Bot
   - Copy bot token
   - Add bot to your server with "Read Message History" permissions

3. Create `.env` file:
```
DISCORD_TOKEN=your_bot_token_here
GUILD_ID=your_server_id
CHANNEL_IDS=channel1_id,channel2_id,channel3_id
```

## Usage

```bash
node scrapeAvraeData.js
```

This will:
- Scan specified channels for Avrae survival commands
- Extract encounter results, yields, and success rates
- Generate reports comparing actual vs expected data
- Export data to CSV for analysis
- Suggest data corrections

## Output Files

- `avrae_results.csv` - Raw scraped data
- `encounter_analysis.json` - Statistical analysis
- `data_corrections.json` - Suggested corrections for your JSON files
