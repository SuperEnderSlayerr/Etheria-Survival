/**
 * Parser for Etheria Survival Discord log files
 * Built from scratch to properly identify encounter boundaries
 */

/**
 * Find all encounters in the text by looking for the standard pattern:
 * "{character name} goes {encounter type}" ... "!survival help | @eternalphoenix64#3855"
 */
export const findEncounterBlocks = (text) => {
  const lines = text.split('\n');
  const encounters = [];
    for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip lines that are clearly not encounters
    if (line.startsWith('http') || 
        line.startsWith('=====') || 
        line.includes('Exported') || 
        line.includes('message(s)') ||
        line.includes('.jpeg') ||
        line.includes('.jpg') ||
        line.includes('.png') ||
        line.includes('Guild:') ||
        line.includes('Channel:')) {
      continue;
    }
      // Look for encounter start pattern: "{character name} goes {activity}!"
    const encounterMatch = line.match(/^(.+?)\s+goes\s+(.+?)!?\s*$/);
    if (encounterMatch) {
      const characterName = encounterMatch[1].trim();
      const activity = encounterMatch[2].trim().replace(/!$/, ''); // Remove trailing !
      
      // Find the end of this encounter
      const endIndex = findEncounterEnd(lines, i);
      
      if (endIndex > i) {
        const encounterLines = lines.slice(i, endIndex + 1);
        encounters.push({
          startLine: i,
          endLine: endIndex,
          characterName,
          activity,
          lines: encounterLines,
          rawText: encounterLines.join('\n')
        });
        
        // Skip to after this encounter
        i = endIndex;
      }
    }
  }
  
  return encounters;
};

/**
 * Find the end of an encounter by looking for the help signature
 */
const findEncounterEnd = (lines, startIndex) => {
  for (let i = startIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('!survival help | @eternalphoenix64#3855')) {
      return i;
    }
    
    // Safety check - don't search more than 100 lines
    if (i - startIndex > 100) {
      break;
    }
  }
  return -1;
};

/**
 * Parse an encounter block to extract meaningful data
 */
export const parseEncounterBlock = (encounterBlock) => {
  const { characterName, activity, lines } = encounterBlock;
  
  // Look for timestamp in the lines before the encounter
  let timestamp = '';
  // We don't have access to the full text here, so we'll extract it later if needed  // Determine encounter type from activity
  let encounterType = 'unknown';
  if (activity.toLowerCase().includes('hunt')) {
    encounterType = 'hunting'; // Will be refined later based on the actual item found
  } else if (activity.toLowerCase().includes('fish')) {
    encounterType = 'fishing';
  } else if (activity.toLowerCase().includes('forag')) {
    encounterType = 'foraging';
  }
  
  // Check for success/failure indicators
  let success = false;
  let item = '';
  let quantity = 0;
  let dc = null;
  
  // Look through all lines for success/failure patterns and DC
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Extract DC information (finding DC, not harvesting DC)
    const dcMatch = trimmedLine.match(/\*\*DC (\d+)\*\*/);
    const harvestDcMatch = trimmedLine.match(/\*\*DC (\d+)\*\* \(for 100%\)/);
    
    if (harvestDcMatch) {
      // Skip harvesting DCs
      continue;
    } else if (dcMatch && !dc) {
      dc = parseInt(dcMatch[1]);
    }
    
    // Check for explicit failure messages
    if (trimmedLine === "You couldn't find anything!" ||
        trimmedLine === "You didn't find anything." ||
        trimmedLine === "You didn't catch anything." ||
        trimmedLine === "You lost the fish!" ||
        trimmedLine === "The fish got away!") {
      success = false;
      item = `${encounterType} attempt`;
      quantity = 0;
      break;
    }
      // Check for hunting success
    if (trimmedLine === "You managed to find some game!") {
      success = true;
      // Continue looking for the actual item
    }
    
    // Check for finding items (before harvest)
    if (trimmedLine.includes('You end up finding:') || trimmedLine.includes('You end up coming across:')) {
      const itemMatch = trimmedLine.match(/\*\*(.+?)\*\*/);
      if (itemMatch) {
        item = itemMatch[1];
        success = true;
        
        // Only refine encounter type for hunting encounters
        if (encounterType === 'hunting') {
          if (isAquaticAnimal(item)) {
            encounterType = 'hunt-aquatic';
          } else if (isSmallAnimal(item)) {
            encounterType = 'hunt-small';
          } else if (isLargeAnimal(item)) {
            encounterType = 'hunt-large';
          }
        }
        // For fishing and foraging, keep the original type
        // Continue looking for quantity in harvest pattern
      }
    }// Check for item harvest
    const harvestMatch = trimmedLine.match(/You harvested:\s*\*\*(\d+(?:\.\d+)?)\*\*\s*lbs?\.\s*of\s*\*\*(.+?)\*\*/);
    if (harvestMatch) {
      success = true;
      quantity = parseFloat(harvestMatch[1]);
      item = harvestMatch[2];
      
      // Only refine encounter type based on item if we don't already know the activity type
      if (encounterType === 'hunting') {
        // For hunting encounters, refine based on animal type
        if (isAquaticAnimal(item)) {
          encounterType = 'hunt-aquatic';
        } else if (isSmallAnimal(item)) {
          encounterType = 'hunt-small';
        } else if (isLargeAnimal(item)) {
          encounterType = 'hunt-large';
        }
      }
      // For fishing and foraging, keep the original type
      // (fishing should stay 'fishing', foraging should stay 'foraging')
      break;
    }    // Alternative harvest pattern without double asterisks
    const simpleHarvestMatch = trimmedLine.match(/You harvested:\s*(\d+(?:\.\d+)?)\s*lbs?\.\s*of\s*(.+)/);
    if (simpleHarvestMatch) {
      success = true;
      quantity = parseFloat(simpleHarvestMatch[1]);
      item = simpleHarvestMatch[2].replace(/\*\*/g, '').trim();
      
      // Only refine encounter type based on item if we don't already know the activity type
      if (encounterType === 'hunting') {
        // For hunting encounters, refine based on animal type
        if (isAquaticAnimal(item)) {
          encounterType = 'hunt-aquatic';
        } else if (isSmallAnimal(item)) {
          encounterType = 'hunt-small';
        } else if (isLargeAnimal(item)) {
          encounterType = 'hunt-large';
        }
      }
      // For fishing and foraging, keep the original type
      // (fishing should stay 'fishing', foraging should stay 'foraging')
      break;
    }
    
    // Check for "was added to your" patterns
    const addedMatch = trimmedLine.match(/(\d+(?:\.\d+)?)\s*pounds?\s*of\s*\*\*(.+?)\*\*\s*was added to your/);
    if (addedMatch) {
      success = true;
      quantity = parseFloat(addedMatch[1]);
      item = addedMatch[2];
      break;
    }
  }  return {
    timestamp,
    item: item || `${encounterType} attempt`,
    quantity,
    location: '', // Will be filled in by calling function
    type: encounterType,
    success,
    characterName,
    dc: dc, // Add DC information
    rawLines: lines
  };
};

/**
 * Enhanced parser using the new encounter block approach
 */
export const parseAllEncounters = (text, fileName) => {  // Only process actual .txt files
  if (!fileName.endsWith('.txt')) {
    return [];
  }
  
  const location = fileName.replace('.txt', '');
  const encounterBlocks = findEncounterBlocks(text);
  const encounters = [];
  
  for (const block of encounterBlocks) {
    const encounter = parseEncounterBlock(block);    encounter.location = location;
    encounters.push(encounter);
  }
    return encounters;
};

/**
 * Filter encounters to only include valid items for the location
 */
export const filterValidEncounters = (encounters, location, locationData) => {
  const isValidItemForLocation = (itemName, location, encounterType = null) => {
    const locationInfo = locationData[location];
    
    if (!locationInfo || !encounterType) {
      return false; // Need valid location and encounter type
    }
    
    // Check if the activity type is allowed at this location
    if (encounterType === 'fishing') {
      return locationInfo.fishing;
    }
      if (encounterType === 'hunt-aquatic') {
      return locationInfo.huntTypes && locationInfo.huntTypes.includes('aquatic');
    }
    
    if (encounterType === 'hunt-small') {
      return locationInfo.huntTypes && locationInfo.huntTypes.includes('small');
    }
    
    if (encounterType === 'hunt-big') {
      return locationInfo.huntTypes && locationInfo.huntTypes.includes('big');
    }
    
    if (encounterType === 'hunt-large') {
      return locationInfo.huntTypes && locationInfo.huntTypes.includes('large');
    }
    
    if (encounterType === 'foraging') {
      return locationInfo.foraging;
    }
      // For any hunting type that isn't specific
    if (encounterType === 'hunting') {
      return locationInfo.huntTypes && locationInfo.huntTypes.length > 0;
    }
    
    return false;
  };  return {
    valid: encounters.filter(encounter => {
      const isValid = isValidItemForLocation(encounter.item, location, encounter.type);
      return isValid;
    }),
    invalid: encounters.filter(encounter => 
      !isValidItemForLocation(encounter.item, location, encounter.type)
    )
  };
};

/**
 * Analyze DC distribution patterns across all encounters
 * This helps determine if DCs are equally weighted or have different probabilities
 */
export const analyzeDCDistribution = (allEncounters) => {
  const dcCounts = {};
  const dcByActivity = {};
  const dcByLocation = {};
  
  allEncounters.forEach(encounter => {
    if (encounter.dc && encounter.dc > 0) {
      const { dc, type, location } = encounter;
      
      // Overall DC counts
      dcCounts[dc] = (dcCounts[dc] || 0) + 1;
      
      // DC counts by activity type
      if (!dcByActivity[type]) dcByActivity[type] = {};
      dcByActivity[type][dc] = (dcByActivity[type][dc] || 0) + 1;
      
      // DC counts by location
      if (!dcByLocation[location]) dcByLocation[location] = {};
      dcByLocation[location][dc] = (dcByLocation[location][dc] || 0) + 1;
    }
  });
  
  // Calculate percentages for overall distribution
  const totalEncounters = Object.values(dcCounts).reduce((sum, count) => sum + count, 0);
  const dcPercentages = {};
  Object.entries(dcCounts).forEach(([dc, count]) => {
    dcPercentages[dc] = ((count / totalEncounters) * 100).toFixed(2);
  });
  
  console.log('\n=== DC DISTRIBUTION ANALYSIS ===');
  console.log('Overall DC Distribution:');
  Object.entries(dcCounts)
    .sort(([a], [b]) => parseInt(a) - parseInt(b))
    .forEach(([dc, count]) => {
      console.log(`DC ${dc}: ${count} encounters (${dcPercentages[dc]}%)`);
    });
  
  console.log('\nDC Distribution by Activity Type:');
  Object.entries(dcByActivity).forEach(([activityType, dcs]) => {
    const activityTotal = Object.values(dcs).reduce((sum, count) => sum + count, 0);
    console.log(`\n${activityType.toUpperCase()}:`);
    Object.entries(dcs)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([dc, count]) => {
        const percentage = ((count / activityTotal) * 100).toFixed(2);
        console.log(`  DC ${dc}: ${count} encounters (${percentage}%)`);
      });
  });
  
  console.log('\nDC Distribution by Location:');
  Object.entries(dcByLocation).forEach(([location, dcs]) => {
    const locationTotal = Object.values(dcs).reduce((sum, count) => sum + count, 0);
    console.log(`\n${location.toUpperCase()}:`);
    Object.entries(dcs)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .forEach(([dc, count]) => {
        const percentage = ((count / locationTotal) * 100).toFixed(2);
        console.log(`  DC ${dc}: ${count} encounters (${percentage}%)`);
      });
  });
  
  return {
    overall: dcCounts,
    percentages: dcPercentages,
    byActivity: dcByActivity,
    byLocation: dcByLocation,
    totalEncounters
  };
};

/**
 * Analyze success rates by DC to see if player advantage affects the data
 * This helps answer whether we need to account for advantage in calculations
 */
export const analyzeSuccessRatesByDC = (allEncounters) => {
  const dcAnalysis = {};
  
  console.log(`\n=== ANALYZING ${allEncounters.length} TOTAL ENCOUNTERS ===`);
  
  // Count total encounters by success/failure
  let totalSuccesses = 0;
  let totalFailures = 0;
  let encountersWithDC = 0;
  
  allEncounters.forEach(encounter => {
    if (encounter.dc && encounter.dc > 0) {
      encountersWithDC++;
      const { dc, success, type } = encounter;
      const key = `${type}-DC${dc}`;
      
      if (!dcAnalysis[key]) {
        dcAnalysis[key] = {
          dc,
          type,
          successes: 0,
          failures: 0,
          total: 0
        };
      }
      
      dcAnalysis[key].total++;
      if (success) {
        dcAnalysis[key].successes++;
        totalSuccesses++;
      } else {
        dcAnalysis[key].failures++;
        totalFailures++;
      }
    }
  });
  
  console.log(`Total encounters with DC: ${encountersWithDC}`);
  console.log(`Overall success rate: ${totalSuccesses}/${encountersWithDC} (${((totalSuccesses/encountersWithDC)*100).toFixed(1)}%)`);
  console.log(`Overall failure rate: ${totalFailures}/${encountersWithDC} (${((totalFailures/encountersWithDC)*100).toFixed(1)}%)`);
  
  console.log('\n=== SUCCESS RATE ANALYSIS BY DC ===');
  console.log('This shows if player advantage/disadvantage affects the data distribution');
  
  Object.entries(dcAnalysis)
    .sort(([a], [b]) => {
      const [typeA, dcA] = a.split('-DC');
      const [typeB, dcB] = b.split('-DC');
      if (typeA !== typeB) return typeA.localeCompare(typeB);
      return parseInt(dcA) - parseInt(dcB);
    })
    .forEach(([key, data]) => {
      const successRate = ((data.successes / data.total) * 100).toFixed(1);
      console.log(`${data.type} DC${data.dc}: ${data.successes}/${data.total} (${successRate}% success, ${data.failures} failures)`);
    });
  
  // Check for patterns that might indicate advantage/disadvantage
  console.log('\n=== THEORETICAL vs OBSERVED SUCCESS RATES ===');
  console.log('Comparing observed success rates to theoretical d20 probabilities:');
  
  Object.entries(dcAnalysis).forEach(([key, data]) => {
    const observedRate = (data.successes / data.total) * 100;
    
    // Theoretical success rate for d20 + modifier (assuming +5 modifier)
    const theoreticalRate = Math.max(5, Math.min(95, (21 - data.dc + 5) * 5));
    const difference = observedRate - theoreticalRate;
    
    if (data.total >= 10) { // Only analyze DCs with sufficient data
      console.log(`${data.type} DC${data.dc}: Observed ${observedRate.toFixed(1)}% vs Theoretical ${theoreticalRate}% (diff: ${difference > 0 ? '+' : ''}${difference.toFixed(1)}%)`);
    }
  });
  
  return dcAnalysis;
};

/**
 * DC probability weights based on actual observed data analysis
 * These represent the server's actual weighted DC distribution by activity type
 * Data extracted from 36,804 encounters with DC information
 */
export const DC_WEIGHTS = {
  // Overall weights (for fallback)
  overall: {
    5: 0.1577,   // 15.77%
    10: 0.3663,  // 36.63% 
    15: 0.3663,  // 36.63%
    20: 0.0734,  // 7.34%
    25: 0.0362   // 3.62%
  },
  
  // Activity-specific weights based on actual data
  foraging: {
    5: 0.1871,   // 18.71% (3348 encounters)
    10: 0.2991,  // 29.91% (5353 encounters)
    15: 0.4416,  // 44.16% (7902 encounters)
    20: 0.0360,  // 3.60% (645 encounters)
    25: 0.0362   // 3.62% (648 encounters)
  },
  
  'hunt-large': {
    5: 0.1280,   // 12.80% (2049 encounters)
    10: 0.4244,  // 42.44% (6796 encounters)
    15: 0.2958,  // 29.58% (4737 encounters)
    20: 0.1125,  // 11.25% (1801 encounters)
    25: 0.0393   // 3.93% (629 encounters)
  },
  
  fishing: {
    5: 0.1357,   // 13.57% (178 encounters)
    10: 0.4710,  // 47.10% (618 encounters)
    15: 0.2881,  // 28.81% (378 encounters)
    20: 0.0938,  // 9.38% (123 encounters)
    25: 0.0114   // 1.14% (15 encounters)
  },
  
  'hunt-aquatic': {
    5: 0.1358,   // 13.58% (171 encounters)
    10: 0.4432,  // 44.32% (558 encounters)
    15: 0.2986,  // 29.86% (376 encounters)
    20: 0.0929,  // 9.29% (117 encounters)
    25: 0.0294   // 2.94% (37 encounters)
  },
  
  'hunt-small': {
    5: 0.1978,   // 19.78% (55 encounters)
    10: 0.4928,  // 49.28% (137 encounters)
    15: 0.2662,  // 26.62% (74 encounters)
    20: 0.0396,  // 3.96% (11 encounters)
    25: 0.0036   // 0.36% (1 encounter)
  },
  
  // Fallback for hunting (general) - small sample size
  hunting: {
    5: 0.1000,   // 10.00% (2 encounters)
    10: 0.5500,  // 55.00% (11 encounters)
    15: 0.3000,  // 30.00% (6 encounters)
    20: 0.0500,  // 5.00% (1 encounter)
    25: 0.0000   // 0% (0 encounters)
  }
};

/**
 * AC values extracted from actual log data analysis
 * Based on recent encounters showing the real AC for each creature type
 */
export const CREATURE_AC_VALUES = {
  // Large animals
  'Bear': 18,
  'Elk': 16,
  'Boar': 18,
  'Deer': 14,
  'Antelope': 16,
  'Mountain Lion': 17,
  
  // Small animals  
  'Rabbit': 11,
  'Squirrel': 10,
  'Turkey': 12,
  'Waterfowl': 12, // estimated, need more data
  'Pheasant': 12, // estimated, need more data
  
  // Aquatic animals
  'Crab': 13,
  'Barracuda': 18,
  'Snapper': 12,
  'Cod': 14,
  'Yellowtail': 16,
  'Bass': 14, // estimated, need more data
  'Catfish': 12, // estimated, need more data
  'Carp': 12, // estimated, need more data
  'Salmon': 14, // estimated, need more data
  'Sturgeon': 16, // estimated, need more data
};

/**
 * Get AC value for a specific creature, with fallback estimates
 */
export const getCreatureAC = (creatureName) => {
  // Try exact match first
  if (CREATURE_AC_VALUES[creatureName]) {
    return CREATURE_AC_VALUES[creatureName];
  }
  
  // Fallback to category-based estimates
  if (isLargeAnimal(creatureName)) return 16; // Average for large animals
  if (isSmallAnimal(creatureName)) return 11; // Average for small animals  
  if (isAquaticAnimal(creatureName)) return 14; // Average for aquatic animals
  
  return 13; // Default fallback
};

/**
 * Calculate expected value using weighted DC distribution
 * This accounts for the server's actual DC probability weights by activity type
 * For hunting, this includes both skill check and attack roll probabilities with real AC values
 */
export const calculateExpectedValueWithDCWeights = (encounters, activityType, modifiers = {}, getItemValue = null) => {
  if (!encounters || encounters.length === 0) return 0;
  
  // Default item value function if none provided
  const defaultGetItemValue = (itemName) => 1; // Default value
  const valueFunction = getItemValue || defaultGetItemValue;
  
  // Get the appropriate DC weights for this activity type
  const dcWeights = DC_WEIGHTS[activityType] || DC_WEIGHTS.overall;
  
  // Calculate total successful encounters
  const successfulEncounters = encounters.filter(e => e.success && e.quantity > 0);
  if (successfulEncounters.length === 0) return 0;
  
  // For hunting, we need to calculate per-creature expected values since each has different AC
  if (activityType.startsWith('hunt')) {
    return calculateHuntingExpectedValue(successfulEncounters, dcWeights, modifiers, valueFunction);
  }
  
  // For non-hunting activities, use the original calculation
  let totalValue = 0;
  let totalSuccessfulAttempts = 0;
  
  successfulEncounters.forEach(encounter => {
    const itemValue = valueFunction(encounter.item);
    totalValue += encounter.quantity * itemValue;
    totalSuccessfulAttempts++;
  });
  
  const avgValuePerSuccessfulEncounter = totalValue / totalSuccessfulAttempts;
  
  // Calculate expected value using activity-specific DC weights
  let expectedValue = 0;
  
  Object.entries(dcWeights).forEach(([dc, weight]) => {
    const dcInt = parseInt(dc);
    const skillCheckProb = calculateSuccessProbability(dcInt, modifiers.skillModifier || 5, modifiers.hasDisadvantage || false);
    expectedValue += weight * skillCheckProb * avgValuePerSuccessfulEncounter;
  });
  
  return expectedValue;
};

/**
 * Calculate hunting expected value accounting for different AC values per creature
 */
const calculateHuntingExpectedValue = (successfulEncounters, dcWeights, modifiers, valueFunction) => {
  // Group encounters by creature type
  const encountersByCreature = {};
  
  successfulEncounters.forEach(encounter => {
    const creature = encounter.item;
    if (!encountersByCreature[creature]) {
      encountersByCreature[creature] = [];
    }
    encountersByCreature[creature].push(encounter);
  });
  
  let totalExpectedValue = 0;
  let totalWeight = 0;
  
  // Calculate expected value for each creature type
  Object.entries(encountersByCreature).forEach(([creature, encounters]) => {
    const creatureAC = getCreatureAC(creature);
    const encounterWeight = encounters.length;
    
    // Calculate average value per successful encounter for this creature
    let totalValue = 0;
    encounters.forEach(encounter => {
      const itemValue = valueFunction(encounter.item);
      totalValue += encounter.quantity * itemValue;
    });
    const avgValuePerSuccessfulEncounter = totalValue / encounters.length;
    
    // Calculate expected value for this creature across all DCs
    let creatureExpectedValue = 0;
    
    Object.entries(dcWeights).forEach(([dc, weight]) => {
      const dcInt = parseInt(dc);
      const skillCheckProb = calculateSuccessProbability(dcInt, modifiers.skillModifier || 5, modifiers.hasDisadvantage || false);
      const attackProb = calculateSuccessProbability(creatureAC, modifiers.attackBonus || 5, modifiers.hasDisadvantage || false);
      const combinedSuccessProb = skillCheckProb * attackProb;
      
      creatureExpectedValue += weight * combinedSuccessProb * avgValuePerSuccessfulEncounter;
    });
    
    totalExpectedValue += creatureExpectedValue * encounterWeight;
    totalWeight += encounterWeight;
  });
  
  return totalWeight > 0 ? totalExpectedValue / totalWeight : 0;
};

/**
 * Calculate success probability for a given DC, modifier, and advantage/disadvantage
 */
export const calculateSuccessProbability = (dc, modifier, hasDisadvantage = false) => {
  const targetRoll = dc - modifier;
  
  if (hasDisadvantage) {
    // With disadvantage: roll 2d20, take lower
    // P(success) = P(both dice >= target) = P(single die >= target)^2
    if (targetRoll <= 1) return 1.0; // Always succeed
    if (targetRoll > 20) return 0.0; // Always fail
    
    const singleDieSuccessProb = (21 - targetRoll) / 20;
    return singleDieSuccessProb * singleDieSuccessProb;
  } else {
    // Normal roll: single d20
    if (targetRoll <= 1) return 1.0; // Always succeed (nat 1 still succeeds if modifier is high enough)
    if (targetRoll > 20) return 0.0; // Always fail
    
    return (21 - targetRoll) / 20;
  }
};

// Helper functions to classify items - only used for hunting encounter refinement
const isAquaticAnimal = (name) => {
  const aquaticAnimals = ['Crab', 'Barracuda', 'Snapper', 'Cod', 'Yellowtail', 'Bass', 'Catfish', 'Carp', 'Salmon', 'Sturgeon'];
  return aquaticAnimals.some(animal => name.toLowerCase().includes(animal.toLowerCase()));
};

const isSmallAnimal = (name) => {
  const smallAnimals = ['Squirrel', 'Rabbit', 'Turkey', 'Waterfowl', 'Pheasant'];
  return smallAnimals.some(animal => name.toLowerCase().includes(animal.toLowerCase()));
};

const isLargeAnimal = (name) => {
  const largeAnimals = ['Deer', 'Elk', 'Bear', 'Boar', 'Antelope', 'Mountain Lion'];
  return largeAnimals.some(animal => name.toLowerCase().includes(animal.toLowerCase()));
};
