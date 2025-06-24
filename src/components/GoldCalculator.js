import React, { useState, useEffect } from 'react';
import './GoldCalculator.css';
import { goldValues } from '../data/goldValues';
import { calculateExpectedValueWithDCWeights, calculateSuccessProbability } from '../utils/parser';

const GoldCalculator = ({ locationData, data }) => {  const [party, setParty] = useState([
    {
      id: 1,
      name: 'Character 1',
      survivalBonus: 0,
      attackBonus: 5, // Attack bonus for hunting (Str/Dex + proficiency + weapon)
      activities: ['hunt-large', 'foraging'], // Array of activities: 'hunt-large', 'hunt-small', 'hunt-aquatic', 'foraging', 'fishing'
      supportingId: null, // ID of character they're supporting
      supportType: 'help', // Type of support: 'help' (advantage) or 'guidance' (1d4 bonus)
      location: 'whispering-grove'
    }
  ]);
  const [results, setResults] = useState({});  // Add a new party member
  const addPartyMember = () => {
    const newId = Math.max(...party.map(p => p.id)) + 1;
    setParty([...party, {
      id: newId,
      name: `Character ${newId}`,
      survivalBonus: 0,
      attackBonus: 5,      activities: ['hunt-large', 'foraging'],
      supportingId: null,
      supportType: 'help',
      location: 'whispering-grove'
    }]);
  };

  // Remove a party member
  const removePartyMember = (id) => {
    if (party.length > 1) {
      const newParty = party.filter(p => p.id !== id);
      // Clear any support relationships pointing to removed character
      newParty.forEach(p => {
        if (p.supportingId === id) {
          p.supportingId = null;
        }
      });
      setParty(newParty);
    }
  };
  // Update party member
  const updatePartyMember = (id, field, value) => {
    setParty(party.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };// Calculate expected gold for a character at a location
  const calculateExpectedGold = React.useCallback((character, location) => {
    const locationInfo = locationData[location];
    if (!locationInfo || !data) return { total: 0, breakdown: [] };

    // Get the encounters for this location using the same pattern as ProfitEstimator
    const fileName = `${location}.txt`;
    const dataSet = data[fileName];
    if (!dataSet || !dataSet.valid) return { total: 0, breakdown: [] };    const encounters = dataSet.valid; // Use filtered encounters only
    
    // Check for support benefits
    const supporter = party.find(p => p.supportingId === character.id);
    const hasAdvantage = supporter && supporter.supportType === 'help';
    const hasGuidance = supporter && supporter.supportType === 'guidance';
    const guidanceBonus = hasGuidance ? 2.5 : 0; // Average of 1d4

    let totalExpectedGold = 0;
    const breakdown = [];

    // Group encounters by activity type
    const encountersByActivity = {};
    encounters.forEach(encounter => {
      // Check if character does this specific activity type
      if (character.activities.includes(encounter.type)) {
        if (!encountersByActivity[encounter.type]) {
          encountersByActivity[encounter.type] = [];
        }
        encountersByActivity[encounter.type].push(encounter);
      }
    });

    // Calculate expected value for each activity type using DC weights
    Object.entries(encountersByActivity).forEach(([encounterType, activityEncounters]) => {
      const modifiers = {
        skillModifier: character.survivalBonus + guidanceBonus, // Add guidance bonus to skill checks
        attackBonus: character.attackBonus, // Guidance doesn't affect attack rolls
        hasDisadvantage: !hasAdvantage // Advantage means no disadvantage
      };

      // Use the parser's DC weights calculation
      const expectedValue = calculateExpectedValueWithDCWeights(
        activityEncounters, 
        encounterType, 
        modifiers,
        (itemName) => goldValues[itemName] || 0
      );

      totalExpectedGold += expectedValue;      if (expectedValue > 0) {
        breakdown.push({
          type: encounterType,
          expectedGoldPerAttempt: expectedValue,
          hasAdvantage,
          hasGuidance,
          encounters: activityEncounters.length
        });
      }
    });

    return { total: totalExpectedGold, breakdown };
  }, [data, locationData, party]);// Recalculate when party or location changes
  useEffect(() => {
    const newResults = {};
    party.forEach(character => {
      if (character.activities.length > 0) {
        newResults[character.id] = calculateExpectedGold(character, character.location);
      }
    });
    setResults(newResults);  }, [party, data, locationData, calculateExpectedGold]);
  const activeCharacters = party.filter(p => p.activities.length > 0);

  // Show loading state if data isn't ready yet
  if (!data) {
    return (
      <div className="gold-calculator">
        <h2>Gold Calculator</h2>
        <p>Loading encounter data...</p>
      </div>
    );
  }

  // Helper function to display activity names
  const getActivityDisplayName = (activity) => {
    switch (activity) {
      case 'hunt-large': return 'Hunt Large';
      case 'hunt-small': return 'Hunt Small';
      case 'hunt-aquatic': return 'Hunt Aquatic';
      case 'foraging': return 'Foraging';
      case 'fishing': return 'Fishing';
      default: return activity.charAt(0).toUpperCase() + activity.slice(1);
    }
  };

  return (    <div className="gold-calculator">
      <h2>Gold Calculator</h2>
      <p>Calculate expected gold per attempt for your party members based on their skills and activities.</p>

      <div className="calculator-controls">
        <button onClick={addPartyMember} className="add-button">
          Add Party Member
        </button>
      </div>

      <div className="party-setup">
        <h3>Party Configuration</h3>
        
        {party.map(character => (
          <div key={character.id} className="character-card">
            <div className="character-header">
              <input
                type="text"
                value={character.name}
                onChange={(e) => updatePartyMember(character.id, 'name', e.target.value)}
                className="character-name"
              />
              {party.length > 1 && (
                <button 
                  onClick={() => removePartyMember(character.id)}
                  className="remove-button"
                >
                  ×
                </button>
              )}
            </div>

            <div className="character-controls">              <div className="control-group">
                <label>Survival Bonus:</label>
                <input
                  type="number"
                  value={character.survivalBonus}
                  onChange={(e) => updatePartyMember(character.id, 'survivalBonus', parseInt(e.target.value) || 0)}
                  className="bonus-input"
                />
              </div>

              <div className="control-group">
                <label>Attack Bonus (hunting):</label>
                <input
                  type="number"
                  value={character.attackBonus}
                  onChange={(e) => updatePartyMember(character.id, 'attackBonus', parseInt(e.target.value) || 0)}
                  className="bonus-input"
                />
              </div>              <div className="control-group">
                <label>Activities:</label>
                <div className="activity-checkboxes">
                  {['hunt-large', 'hunt-small', 'hunt-aquatic', 'foraging', 'fishing'].map(activity => (
                    <label key={activity} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={character.activities.includes(activity)}
                        onChange={(e) => {
                          const newActivities = e.target.checked
                            ? [...character.activities, activity]
                            : character.activities.filter(a => a !== activity);
                          updatePartyMember(character.id, 'activities', newActivities);
                        }}
                      />
                      {getActivityDisplayName(activity)}
                    </label>
                  ))}
                </div>
              </div><div className="control-group">
                <label>Supporting:</label>
                <select
                  value={character.supportingId || ''}
                  onChange={(e) => updatePartyMember(character.id, 'supportingId', parseInt(e.target.value) || null)}
                  className="support-select"
                >
                  <option value="">None (solo)</option>
                  {party.filter(p => p.id !== character.id).map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>              </div>

              {character.supportingId && (
                <div className="control-group">
                  <label>Support Type:</label>
                  <select
                    value={character.supportType}
                    onChange={(e) => updatePartyMember(character.id, 'supportType', e.target.value)}
                    className="support-select"
                  >
                    <option value="help">Help (Advantage on rolls)</option>
                    <option value="guidance">Guidance (+1d4 to skill checks)</option>
                  </select>
                </div>
              )}

              {character.activities.length > 0 && (
                <div className="control-group">
                  <label>Location:</label>
                  <select
                    value={character.location}
                    onChange={(e) => updatePartyMember(character.id, 'location', e.target.value)}
                    className="location-select"
                  >
                    {Object.keys(locationData).map(location => (
                      <option key={location} value={location}>
                        {location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>            {/* Show support status */}
            {character.activities.length > 0 && (
              <div className="support-status">
                {(() => {
                  const supporter = party.find(p => p.supportingId === character.id);
                  if (supporter) {
                    const supportText = supporter.supportType === 'help' 
                      ? 'Has Advantage' 
                      : 'Has Guidance (+2.5 avg to skill checks)';
                    return (
                      <span className="has-advantage">
                        ✓ {supportText} (from {supporter.name})
                      </span>
                    );
                  } else {
                    return <span className="no-advantage">No support</span>;
                  }
                })()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="results-section">
        <h3>Expected Gold Per Attempt</h3>
        
        {activeCharacters.map(character => {
          const result = results[character.id];
          if (!result) return null;

          return (
            <div key={character.id} className="character-results">
              <h4>{character.name} - {character.location.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</h4>
              
              <div className="total-expected">
                <strong>Total Expected Gold: {result.total.toFixed(2)}g per attempt</strong>
              </div>              {result.breakdown.length > 0 && (
                <div className="breakdown">
                  <h5>Breakdown by Activity Type:</h5>
                  <table className="breakdown-table">
                    <thead>
                      <tr>
                        <th>Activity Type</th>
                        <th>Expected per Attempt</th>
                        <th>Encounters Analyzed</th>
                        <th>Modifiers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.breakdown.map((item, index) => (
                        <tr key={index}>
                          <td>{item.type}</td>
                          <td>{item.expectedGoldPerAttempt.toFixed(2)}g</td>
                          <td>{item.encounters}</td>                          <td>
                            {item.hasAdvantage && <span className="advantage-tag">Advantage</span>}
                            {character.survivalBonus !== 0 && (
                              <span className="bonus-tag">+{character.survivalBonus} Survival</span>
                            )}
                            {character.attackBonus !== 5 && item.type.startsWith('hunt') && (
                              <span className="bonus-tag">+{character.attackBonus} Attack</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}        {activeCharacters.length === 0 && (
          <p className="no-results">No characters with active activities in the party.</p>
        )}

        {activeCharacters.length > 1 && (
          <div className="party-summary">
            <h4>Party Summary</h4>
            <div className="total-party-gold">
              <strong>
                Total Party Expected Gold: {Object.values(results).reduce((sum, r) => sum + r.total, 0).toFixed(2)}g per round
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoldCalculator;
