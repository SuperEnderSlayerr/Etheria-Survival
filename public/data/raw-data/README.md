# Discord Log Data

This directory contains the raw Discord channel exports that the app parses for encounter data.

## Privacy Notice

Real Discord log files containing private messages are **NOT included** in this repository for privacy reasons. Only anonymized sample files are provided to demonstrate the expected format.

## Sample Files

The included `sample-*.txt` files show the expected format of Discord logs that the parser can understand. These contain:
- Anonymized sample gameplay messages
- Examples of the bot output format the parser expects
- No real user conversations or private messages

## Setting Up Your Own Data

To use this calculator with your own Discord server data:

1. Export your Discord channel logs as .txt files
2. Place them in this directory with these exact names:
   - `boiling-coast.txt`
   - `bubblin-bayou.txt` 
   - `flaring-mountains.txt`
   - `redwood-glades.txt`
   - `scarlet-hills.txt`
   - `valley-of-fire.txt`
   - `whispering-grove.txt`

3. The files should contain Discord messages with bot outputs in this format:
   ```
   **Foraging Roll:** DC 15 | Roll: 18 | **Success!**
   You found: 2x Wild Berries, 1x Healing Herbs
   
   **Hunt Large Roll:** AC 14 | Attack: 16 | **Hit!**  
   You successfully hunted: 1x Deer Pelt, 3x Venison
   ```

## Data Format

The parser looks for specific patterns in the Discord logs:
- **Activity rolls** with DC/AC values and results
- **Loot drops** listing items found/caught/hunted
- **Success/failure** indicators

See the sample files for examples of the expected format.
