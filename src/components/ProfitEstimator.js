import React, { useState } from 'react';
import goldValues from '../data/goldValues';
import { calculateExpectedValueWithDCWeights, calculateSuccessProbability } from '../utils/parser';

const ProfitEstimator = ({ data, locationData }) => {
  const [skillModifier, setSkillModifier] = useState(5); // Default +5 skill modifier
  const [huntingAcModifier, setHuntingAcModifier] = useState(0); // Default +0 AC modifier for hunting

  // Early return if data is not loaded yet
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return <div>Loading profit estimates...</div>;
  }

  // Early return if locationData is not available
  if (!locationData || typeof locationData !== 'object') {
    return <div>Loading location data...</div>;
  }

  const getItemValue = (itemName) => {
    return goldValues[itemName] || 0;
  };

  // Calculate success probability for a d20 roll vs DC
  const calculateSuccessProbability = (dc, modifier, hasDisadvantage = false) => {
    const targetRoll = dc - modifier;
    
    if (targetRoll <= 1) return 1.0; // Always succeed (natural 20 or better)
    if (targetRoll > 20) return 0.0; // Impossible to succeed
    
    const baseSuccessChance = (21 - targetRoll) / 20;
    
    if (!hasDisadvantage) {
      return baseSuccessChance;
    } else {
      // With disadvantage, roll twice and take lower
      // P(success with disadvantage) = P(both rolls succeed)
      return baseSuccessChance * baseSuccessChance;
    }
  };

  // Get average DC for an activity type at a location
  const getAverageDC = (encounters) => {
    if (encounters.length === 0) return 15; // Default DC if no data
    
    const validDCs = encounters.filter(e => e.dc && e.dc > 0).map(e => e.dc);
    if (validDCs.length === 0) return 15;
    
    return validDCs.reduce((sum, dc) => sum + dc, 0) / validDCs.length;
  };  const calculateExpectedProfit = (encounters, location, activityType) => {
    if (encounters.length === 0) return 0;
    
    // Determine if this activity has disadvantage at this location
    const locationInfo = locationData[location];
    let hasDisadvantage = false;
    let effectiveModifier = skillModifier;
    
    if (locationInfo && locationInfo.disadvantage) {
      if (activityType.includes('hunt') && locationInfo.disadvantage.includes('hunting')) {
        hasDisadvantage = true;
      } else if (activityType === 'foraging' && locationInfo.disadvantage.includes('foraging')) {
        hasDisadvantage = true;
      }
    }
    
    // Apply hunting AC modifier if this is a hunting activity
    if (activityType.includes('hunt')) {
      effectiveModifier += huntingAcModifier;
    }
      // Use DC-weighted expected value calculation with activity-specific weights
    const modifiers = {
      skillModifier: effectiveModifier,
      attackBonus: skillModifier + huntingAcModifier, // Base skill + hunting AC modifier for attack rolls
      hasDisadvantage: hasDisadvantage
    };
    
    return calculateExpectedValueWithDCWeights(encounters, activityType, modifiers, getItemValue);
  };
  const getLocationActivities = (location) => {
    const locationInfo = locationData[location];
    if (!locationInfo) return [];
    
    const activities = [];
    
    // Add hunting - default to large if multiple types available
    if (locationInfo.huntTypes && Array.isArray(locationInfo.huntTypes) && locationInfo.huntTypes.length > 0) {
      if (locationInfo.huntTypes.includes('large')) {
        activities.push('hunt-large');
      } else if (locationInfo.huntTypes.includes('big')) {
        activities.push('hunt-big');
      } else if (locationInfo.huntTypes.includes('small')) {
        activities.push('hunt-small');
      } else if (locationInfo.huntTypes.includes('aquatic')) {
        activities.push('hunt-aquatic');
      }
    }
    
    // Add other activities
    if (locationInfo.fishing) {
      activities.push('fishing');
    }
    
    if (locationInfo.foraging) {
      activities.push('foraging');
    }
    
    return activities;
  };
  const getLocationProfitEstimates = () => {
    const estimates = {};
    
    Object.entries(data).forEach(([fileName, dataSet]) => {
      const location = fileName.replace('.txt', '');
      const activities = getLocationActivities(location);
      
      let totalCombinedProfit = 0;
      const activityDetails = {};
      
      activities.forEach(activityType => {
        const activityEncounters = (dataSet?.valid || []).filter(e => e.type === activityType);
        const expectedProfit = calculateExpectedProfit(activityEncounters, location, activityType);
        const avgDC = getAverageDC(activityEncounters);
        
        // Calculate actual success rate with modifiers
        const locationInfo = locationData[location];
        let hasDisadvantage = false;
        let effectiveModifier = skillModifier;
        
        if (locationInfo && locationInfo.disadvantage) {
          if (activityType.includes('hunt') && locationInfo.disadvantage.includes('hunting')) {
            hasDisadvantage = true;
          } else if (activityType === 'foraging' && locationInfo.disadvantage.includes('foraging')) {
            hasDisadvantage = true;
          }
        }
        
        if (activityType.includes('hunt')) {
          effectiveModifier += huntingAcModifier;
        }
        
        const expectedSuccessRate = calculateSuccessProbability(avgDC, effectiveModifier, hasDisadvantage) * 100;
        
        totalCombinedProfit += expectedProfit;
        
        activityDetails[activityType] = {
          encounters: activityEncounters.length,
          expectedProfit: expectedProfit,
          expectedSuccessRate: expectedSuccessRate,
          averageDC: avgDC,
          hasDisadvantage: hasDisadvantage,
          effectiveModifier: effectiveModifier
        };
      });
        estimates[location] = {
        activities: activityDetails,
        totalEncounters: (dataSet?.valid || []).length,
        combinedProfit: totalCombinedProfit,
        activityCount: activities.length
      };
    });
    
    return estimates;
  };

  const estimates = getLocationProfitEstimates();
  
  // Sort locations by combined profit (best first)
  const sortedLocations = Object.entries(estimates).sort(([,a], [,b]) => 
    b.combinedProfit - a.combinedProfit
  );

  const formatActivityName = (activityType) => {
    switch(activityType) {
      case 'hunt-large': return 'Hunt Large';
      case 'hunt-big': return 'Hunt Big';
      case 'hunt-small': return 'Hunt Small';
      case 'hunt-aquatic': return 'Hunt Aquatic';
      case 'fishing': return 'Fishing';
      case 'foraging': return 'Foraging';
      default: return activityType;
    }
  };
  return (
    <section className="data-section">
      <h2>Location Profit Comparison</h2>
      <p className="section-description">
        Expected combined profit from doing all available activities at each location, 
        accounting for DC-based failure rates and disadvantage rules. 
        When multiple hunt types are available, defaults to hunting large animals.
      </p>
      
      <div className="modifier-controls">
        <h3>Character Modifiers</h3>
        <div className="controls-grid">
          <div className="control-group">
            <label htmlFor="skillModifier">
              Skill Modifier (Investigation, History, Medicine):
              <input
                id="skillModifier"
                type="number"
                value={skillModifier}
                onChange={(e) => setSkillModifier(parseInt(e.target.value) || 0)}
                min="-5"
                max="20"
                className="modifier-input"
              />
            </label>
            <span className="control-hint">Applied to all skill checks</span>
          </div>
          
          <div className="control-group">
            <label htmlFor="huntingAcModifier">
              Attack Bonus Modifier (for hunting):
              <input
                id="huntingAcModifier"
                type="number"
                value={huntingAcModifier}
                onChange={(e) => setHuntingAcModifier(parseInt(e.target.value) || 0)}
                min="-10"
                max="10"
                className="modifier-input"
              />
            </label>
            <span className="control-hint">Additional modifier for hunting encounters</span>
          </div>
        </div>
      </div>
      
      <div className="location-rankings">
        {sortedLocations.map(([location, locationData], index) => (
          <div key={location} className={`location-profit-card ${index === 0 ? 'best-location' : ''}`}>
            <div className="location-header">
              <div className="location-info">
                <h3>{location.replace(/-/g, ' ').toUpperCase()}</h3>
                {index === 0 && <span className="crown">👑 Best Location</span>}
                {index === 1 && <span className="rank silver">🥈 2nd Best</span>}
                {index === 2 && <span className="rank bronze">🥉 3rd Best</span>}
                {index > 2 && <span className="rank">#{index + 1}</span>}
              </div>
              <div className="combined-profit">
                <div className="profit-value">{locationData.combinedProfit.toFixed(1)}</div>
                <div className="profit-label">gold/session</div>
              </div>
            </div>
            
            <div className="activities-breakdown">
              <h4>Activity Breakdown:</h4>
              <div className="activities-grid">
                {Object.entries(locationData.activities).map(([activityType, stats]) => (
                  <div key={activityType} className="activity-breakdown">
                    <div className="activity-name">
                      {formatActivityName(activityType)}
                      {stats.hasDisadvantage && <span className="disadvantage-badge">DISADV</span>}
                    </div>
                    <div className="activity-stats">
                      <span className="profit">{stats.expectedProfit.toFixed(1)} gold</span>
                      <span className="success-rate">({stats.expectedSuccessRate.toFixed(1)}% success)</span>
                      <span className="dc-info">Avg DC: {stats.averageDC.toFixed(1)} (Mod: +{stats.effectiveModifier})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="location-stats">
              <div className="stat">
                <span className="stat-label">Total Valid Encounters:</span>
                <span className="stat-value">{locationData.totalEncounters}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Activities Available:</span>
                <span className="stat-value">{locationData.activityCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="profit-summary">
        <h3>Summary</h3>
        <p>
          <strong>Best Location:</strong> {sortedLocations[0] && sortedLocations[0][0].replace(/-/g, ' ').toUpperCase()} 
          with {sortedLocations[0] && sortedLocations[0][1].combinedProfit.toFixed(1)} gold per session
        </p>
        <p className="note">
          * Session = one attempt at each available activity in the location<br/>
          * Calculations include DC-based failure rates and disadvantage penalties<br/>
          * DISADV = Disadvantage (roll twice, take lower)
        </p>
      </div>
    </section>
  );
};

export default ProfitEstimator;
