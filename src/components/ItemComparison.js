import React, { useState, useEffect } from 'react';
import { goldValues } from '../data/goldValues';
import { DC_WEIGHTS, calculateSuccessProbability, getCreatureAC } from '../utils/parser';
import './ItemComparison.css';

const ItemComparison = ({ locationData }) => {
  const [itemStats, setItemStats] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('avgValueAdjusted');
  const [sortOrder, setSortOrder] = useState('desc');
  const [attackModifier, setAttackModifier] = useState(5);  const calculateHuntingExpectedValue = React.useCallback((stat) => {
    // Calculate expected value per encounter for hunting, considering actual AC per creature
    const { type, allEncounters } = stat;
    
    // Get DC weights for this hunting type
    const dcWeights = DC_WEIGHTS[type] || DC_WEIGHTS['hunt-large'] || DC_WEIGHTS.overall;
    
    // Group encounters by creature to get actual AC values
    const encountersByCreature = {};
    allEncounters.forEach(encounter => {
      if (encounter.success && encounter.quantity > 0) {
        const creature = encounter.item;
        if (!encountersByCreature[creature]) {
          encountersByCreature[creature] = [];
        }
        encountersByCreature[creature].push(encounter);
      }
    });
    
    if (Object.keys(encountersByCreature).length === 0) {
      return { expectedValue: 0, estimatedAC: 'N/A' };
    }
    
    // Calculate weighted average expected value across all creatures found
    let totalExpectedValue = 0;
    let totalWeight = 0;
    let acDisplay = [];
    
    Object.entries(encountersByCreature).forEach(([creature, creatureEncounters]) => {
      const creatureAC = getCreatureAC(creature);
      const weight = creatureEncounters.length;
      
      // Calculate average value for this specific creature
      const creatureAvgValue = creatureEncounters.reduce((sum, enc) => 
        sum + (enc.quantity * (goldValues[enc.item] || 1)), 0) / creatureEncounters.length;
      
      // Calculate expected value for this creature across all DCs
      let creatureExpectedValue = 0;
      
      Object.entries(dcWeights).forEach(([dc, dcWeight]) => {
        const dcInt = parseInt(dc);
        
        // Use the user's attack modifier
        const modifiers = {
          skillModifier: 5,  // +5 survival skill
          attackBonus: attackModifier,    // User's attack bonus
          hasDisadvantage: false
        };
        
        // Calculate probability of finding the creature (skill check)
        const skillCheckProb = calculateSuccessProbability(dcInt, modifiers.skillModifier, modifiers.hasDisadvantage);
        
        // Calculate probability of hitting the creature (attack roll)
        const attackProb = calculateSuccessProbability(creatureAC, modifiers.attackBonus, modifiers.hasDisadvantage);
        
        // Both rolls must succeed for hunting
        const combinedSuccessProb = skillCheckProb * attackProb;
        
        // Expected value = DC weight * success probability * average value per successful encounter
        creatureExpectedValue += dcWeight * combinedSuccessProb * creatureAvgValue;
      });
      
      totalExpectedValue += creatureExpectedValue * weight;
      totalWeight += weight;
      acDisplay.push(`${creature}: ${creatureAC}`);
    });
    
    const weightedExpectedValue = totalWeight > 0 ? totalExpectedValue / totalWeight : 0;
    
    return {
      expectedValue: weightedExpectedValue,
      estimatedAC: acDisplay.length <= 3 ? acDisplay.join(', ') : `${acDisplay.length} creatures`
    };
  }, [attackModifier]);

  const calculateItemStats = React.useCallback(() => {
    const stats = {};    // Process all encounters from all locations
    Object.entries(locationData).forEach(([locationKey, data]) => {
      if (!data || !data.all) return;

      // Extract clean location name from key (remove .txt extension)
      const location = locationKey.replace('.txt', '');

      data.all.forEach(encounter => {
        if (!encounter.success || encounter.quantity <= 0) return;

        const { item, quantity, type } = encounter;
        const itemValue = goldValues[item] || 0;
        const totalValue = quantity * itemValue;

        if (!stats[item]) {
          stats[item] = {
            item,
            category: getCategoryFromType(type),
            type,
            encounters: 0,
            totalQuantity: 0,
            totalValue: 0,
            locations: new Set(),
            // For calculating AC-adjusted values for hunting
            allEncounters: []
          };
        }

        stats[item].encounters++;
        stats[item].totalQuantity += quantity;
        stats[item].totalValue += totalValue;
        stats[item].locations.add(location);
        stats[item].allEncounters.push(encounter);
      });
    });

    // Calculate averages and AC-adjusted values
    Object.values(stats).forEach(stat => {
      stat.avgQuantity = stat.totalQuantity / stat.encounters;
      stat.avgValue = stat.totalValue / stat.encounters;
      stat.valuePerPound = goldValues[stat.item] || 0;
      stat.locationCount = stat.locations.size;
      stat.locations = Array.from(stat.locations);      // Calculate AC-adjusted average value for hunting items
      if (stat.category === 'Hunting') {
        const huntingData = calculateHuntingExpectedValue(stat);
        stat.avgValueAdjusted = huntingData.expectedValue;
        stat.estimatedAC = huntingData.estimatedAC;
      } else {
        // For foraging and fishing, no AC adjustment needed
        stat.avgValueAdjusted = stat.avgValue;
        stat.estimatedAC = null;
      }      // Clean up temporary data
      delete stat.allEncounters;
    });

    setItemStats(stats);  }, [locationData, calculateHuntingExpectedValue]);

  useEffect(() => {
    if (!locationData || Object.keys(locationData).length === 0) {
      return;
    }

    calculateItemStats();
  }, [locationData, calculateItemStats]);
  const getCategoryFromType = (type) => {
    if (type.startsWith('hunt')) return 'Hunting';
    if (type === 'fishing') return 'Fishing';
    if (type === 'foraging') return 'Foraging';
    return 'Other';
  };

  const getFilteredAndSortedItems = () => {
    let items = Object.values(itemStats);

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Sort items
    items.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortOrder === 'desc') {
        return bVal - aVal;
      } else {
        return aVal - bVal;
      }
    });

    return items;
  };

  const formatValue = (value) => {
    return value ? value.toFixed(2) : '0.00';
  };

  const formatQuantity = (quantity) => {
    return quantity ? quantity.toFixed(1) : '0.0';
  };
  const getBestInCategory = (category) => {
    const categoryItems = Object.values(itemStats).filter(item => item.category === category);
    if (categoryItems.length === 0) return null;
    
    return categoryItems.reduce((best, current) => 
      current.avgValueAdjusted > best.avgValueAdjusted ? current : best
    );
  };

  const categories = ['Hunting', 'Fishing', 'Foraging'];

  if (Object.keys(itemStats).length === 0) {
    return (
      <div className="item-comparison">
        <h2>Item Profitability Comparison</h2>
        <p>No encounter data available. Please load log files first.</p>
      </div>
    );
  }

  return (
    <div className="item-comparison">
      <h2>Item Profitability Comparison</h2>
      <p>Compare the average value per successful encounter for different items.</p>

      {/* Category Summary */}
      <div className="category-summary">
        <h3>Best Items by Category</h3>
        <div className="category-cards">
          {categories.map(category => {
            const best = getBestInCategory(category);
            return (
              <div key={category} className="category-card">
                <h4>{category}</h4>
                {best ? (
                  <div>
                    <div className="best-item">{best.item}</div>
                    <div className="best-value">{formatValue(best.avgValueAdjusted)} gold/attempt</div>
                    <div className="best-details">
                      {formatQuantity(best.avgQuantity)} lbs avg × {formatValue(best.valuePerPound)} gold/lb
                    </div>
                  </div>
                ) : (
                  <div className="no-data">No data</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="controls">
        <div className="filter-controls">
          <label>
            Category:
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="Hunting">Hunting</option>
              <option value="Fishing">Fishing</option>
              <option value="Foraging">Foraging</option>
            </select>
          </label>

          <label>
            Sort by:            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="avgValueAdjusted">Avg Value per Encounter</option>
              <option value="avgQuantity">Avg Quantity per Encounter</option>
              <option value="valuePerPound">Value per Pound</option>
              <option value="encounters">Number of Encounters</option>
              <option value="locationCount">Available Locations</option>
            </select>
          </label>          <label>
            Order:
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              <option value="desc">Highest First</option>
              <option value="asc">Lowest First</option>
            </select>
          </label>          <label>
            Attack Bonus (Hunting):
            <input 
              type="number" 
              value={attackModifier} 
              onChange={(e) => setAttackModifier(parseInt(e.target.value) || 0)}
              min="0"
              max="20"
              placeholder="5"
              title="Your total attack bonus for hunting creatures (affects hit chance against AC)"
            />
          </label>
        </div>
      </div>

      {/* Results Table */}
      <div className="results-table">
        <table>
          <thead>            <tr>
              <th>Item</th>
              <th>Category</th>
              <th>AC (Hunting)</th>
              <th>Avg Value/Encounter*</th>
              <th>Avg Quantity/Encounter</th>
              <th>Value/Pound</th>
              <th>Total Encounters</th>
              <th>Locations</th>
              <th>Available At</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredAndSortedItems().map((item, index) => (              <tr key={item.item} className={index < 3 ? 'top-performer' : ''}>
                <td className="item-name">{item.item}</td>
                <td className="category">{item.category}</td>
                <td className="ac-value">{item.estimatedAC ? `AC ${item.estimatedAC}` : '-'}</td>
                <td className="avg-value">{formatValue(item.avgValueAdjusted)} gold</td>
                <td className="avg-quantity">{formatQuantity(item.avgQuantity)} lbs</td>
                <td className="value-per-pound">{formatValue(item.valuePerPound)} gold/lb</td>
                <td className="encounter-count">{item.encounters}</td>
                <td className="location-count">{item.locationCount}</td>
                <td className="locations">{item.locations.join(', ')}</td>
              </tr>))}
          </tbody>
        </table>        <div className="table-note">
          <p><strong>*</strong> For hunting items, values are adjusted for the probability of missing attacks against creature AC. 
          Uses +{attackModifier} attack bonus and +5 survival skill. Foraging and fishing values are not adjusted.</p>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats-summary">
        <h3>Summary Statistics</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <div className="summary-label">Total Unique Items</div>
            <div className="summary-value">{Object.keys(itemStats).length}</div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Successful Encounters</div>
            <div className="summary-value">
              {Object.values(itemStats).reduce((sum, item) => sum + item.encounters, 0)}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-label">Total Value Harvested</div>
            <div className="summary-value">
              {formatValue(Object.values(itemStats).reduce((sum, item) => sum + item.totalValue, 0))} gold
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemComparison;
