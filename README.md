# Etheria Survival Calculator

A React-based web application for calculating expected gold earnings and optimizing party strategies in the Etheria D&D survival system.

## Features

### 🏆 **Gold Calculator** (Main Tool)
- **Party Management**: Add multiple characters with different skills and activities
- **Support System**: Characters can provide Help (advantage) or Guidance (+1d4 to skill checks)
- **Activity Specialization**: Separate hunting types (Large, Small, Aquatic), Foraging, and Fishing
- **Real-time Calculations**: Expected gold per attempt based on actual game log data
- **Location-specific**: Different locations have different encounter tables and modifiers

### 📊 **Item Comparison**
- Compare profitability of different items within each activity category
- **AC-Adjusted Calculations**: Uses actual creature AC values from game logs
- Attack modifier input for personalized hunting success rates
- Sortable tables with filtering by category

### 📈 **Profit Estimator**
- Historical analysis of encounter success rates
- DC distribution analysis
- Expected value calculations using weighted probabilities

### 🔍 **Activity Analysis**
- Detailed breakdown of encounter types by location
- Success rate analysis
- Data validation and debugging tools

## Game Mechanics

### Combat System
- **Skill Checks**: Survival-based rolls to find creatures/items
- **Attack Rolls**: Separate rolls against creature AC for hunting
- **DC Distribution**: Server uses custom DC 5-25 range (no "nothing here" results)

### Support Mechanics
- **Help Action**: Grants advantage (roll twice, take higher) on all rolls
- **Guidance Cantrip**: Adds 1d4 (+2.5 average) to skill checks only
- **Location Effects**: Some locations impose disadvantage on certain activities

### Real Data-Driven
- Calculations based on analysis of actual Discord bot logs
- **36,000+ encounters** analyzed for accurate probability distributions
- Creature AC values extracted from recent game sessions

## Technical Details

### Built With
- **React 18** with functional components and hooks
- **CSS Grid & Flexbox** for responsive layouts
- **Custom parser** for Discord log analysis
- **Real-time calculations** with optimized state management

### Data Sources
- Discord bot logs from 7 different locations
- Manual AC extraction from recent hunting encounters
- Gold value mappings for all harvestable items

## Live Demo

🌐 **[Try the Calculator](https://superenderslayerr.github.io/Etheria-Survival/)** - Live version with real encounter data!

The hosted version includes actual Discord log data for full functionality, while keeping private messages out of the public repository.

## Installation & Setup

### Quick Start (Recommended)

Visit the **[Live Demo](https://superenderslayerr.github.io/Etheria-Survival/)** - no setup required! The hosted version includes real encounter data.

### Local Development

#### Prerequisites
- Node.js 16+ 
- npm or yarn

#### Getting Started
```bash
# Clone the repository
git clone https://github.com/SuperEnderSlayerr/Etheria-Survival.git
cd Etheria-Survival

# Install dependencies
npm install

# Start development server
npm start
```

The app will be available at `http://localhost:3000`

### Data Setup

The **[hosted version](https://superenderslayerr.github.io/Etheria-Survival/)** includes real encounter data from the Etheria Discord server and works immediately!

#### For Your Own Server Data
If you want to use data from your own Discord server:

**Option 1: Use the Upload Data Tab (Recommended)**
- Visit the "Upload Data" tab in the app
- Upload your Discord log files directly in the browser
- Files are processed locally for privacy

**Option 2: Local Development with Files**
1. **Export Discord logs**: Use [DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter)
2. **Place files in**: `public/txtData/` directory
3. **Required filenames**:
   - `boiling-coast.txt`, `bubblin-bayou.txt`, `flaring-mountains.txt`
   - `redwood-glades.txt`, `scarlet-hills.txt`, `valley-of-fire.txt`, `whispering-grove.txt`

**Privacy Note**: Private Discord messages are excluded from the public repository but included in the deployed version for functionality.

#### For Developers: Deployment with Data
If you're forking this project and want to deploy with your own server data:

```bash
# Deploy with your txtData files included (they won't be in main repo)
npm run deploy-with-data
```

This command builds the app and includes files from `public/txtData/` in the deployment while keeping them out of the main repository.

### Building for Production
```bash
npm run build
```

## Usage Guide

### Setting Up Your Party
1. **Add Characters**: Click "Add Party Member" to create characters
2. **Configure Skills**: Set Survival Bonus and Attack Bonus for each character
3. **Choose Activities**: Select which activities each character can perform
4. **Set Support**: Have characters support each other with Help or Guidance
5. **Pick Locations**: Choose where each character will operate

### Reading Results
- **Expected Gold**: Average gold per attempt for each character
- **Activity Breakdown**: Shows which activities are most profitable
- **Support Benefits**: Clear indicators of advantage/guidance effects
- **Location Comparison**: See how different locations affect earnings

### Optimizing Strategy
- **Specialists vs Generalists**: Compare focused vs diverse activity sets
- **Support Allocation**: Determine best use of Help vs Guidance
- **Location Selection**: Find the most profitable spots for each activity type

## Data Files

The app includes processed data from:
- `public/txtData/*.txt`: Raw Discord log files
- `src/data/goldValues.js`: Item value mappings
- Embedded DC probability distributions by activity type

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Etheria D&D server community
- Thanks to @eternalphoenix64 for the survival system design
- Data analysis based on community play logs

## Changelog

### v1.0.0 (Current)
- ✅ Gold Calculator with party management
- ✅ Support system (Help & Guidance)
- ✅ Real AC values from game logs
- ✅ Item profitability comparison
- ✅ Responsive design and clean UI
- ✅ Activity specialization (hunt types separated)

### Planned Features
- 🔄 Export/import party configurations
- 🔄 Historical trend analysis
- 🔄 Optimal party composition suggestions
- 🔄 Mobile app version
