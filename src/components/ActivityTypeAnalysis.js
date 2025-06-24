import React from 'react';
import goldValues from '../data/goldValues';

const ActivityTypeAnalysis = ({ data }) => {
  // Early return if data is not loaded yet
  if (!data || typeof data !== 'object') {
    return <div>Loading activity analysis...</div>;
  }

  const getItemValue = (itemName) => {
    return goldValues[itemName] || 0;
  };

  // Build activity type tables
  const activityTables = {};
  const locationVariations = {};

  // Process all encounters grouped by activity type
  Object.entries(data).forEach(([fileName, dataSet]) => {
    const location = fileName.replace('.txt', '');
    // Use only valid encounters for activity analysis
    const successfulEncounters = dataSet?.valid?.filter(e => e.success && e.quantity > 0) || [];
    
    successfulEncounters.forEach(encounter => {
      const activityType = encounter.type;
      
      // Initialize activity table
      if (!activityTables[activityType]) {
        activityTables[activityType] = {};
      }
      
      // Initialize location variations tracking
      if (!locationVariations[activityType]) {
        locationVariations[activityType] = {};
      }
      if (!locationVariations[activityType][location]) {
        locationVariations[activityType][location] = {};
      }
      
      // Count items globally for this activity type
      if (!activityTables[activityType][encounter.item]) {
        activityTables[activityType][encounter.item] = 0;
      }
      activityTables[activityType][encounter.item]++;
      
      // Count items per location for this activity type
      if (!locationVariations[activityType][location][encounter.item]) {
        locationVariations[activityType][location][encounter.item] = 0;
      }
      locationVariations[activityType][location][encounter.item]++;
    });
  });
  
  // Analyze which activities have variations
  const activitiesWithVariations = [];
  const activitiesConsistent = [];
  
  Object.entries(locationVariations).forEach(([activityType, variations]) => {
    const locationAnalysis = Object.entries(variations).map(([location, locationItems]) => {
      const locationTotal = Object.values(locationItems).reduce((sum, count) => sum + count, 0);
      return { location, items: locationItems, total: locationTotal };
    }).filter(loc => loc.total > 0);
    
    if (locationAnalysis.length > 1) {
      const allItems = new Set();
      locationAnalysis.forEach(loc => Object.keys(loc.items).forEach(item => allItems.add(item)));
      
      let hasVariations = false;
      for (const item of allItems) {
        const percentages = locationAnalysis.map(loc => {
          const count = loc.items[item] || 0;
          return (count / loc.total) * 100;
        });
        
        const max = Math.max(...percentages);
        const min = Math.min(...percentages);
        if (max - min > 15) {
          hasVariations = true;
          break;
        }
      }
      
      if (hasVariations) {
        activitiesWithVariations.push(activityType);
      } else {
        activitiesConsistent.push(activityType);
      }
    }
  });

  return (
    <section className="data-section">
      <h2>Estimated Encounter Tables by Activity Type</h2>
      <p className="section-description">
        Analysis of what the underlying encounter tables might look like for each activity type (hunt-small, hunt-large, foraging, etc.).
        This combines data from all locations to estimate the base encounter tables, and shows if different areas seem to use different charts.
      </p>
      
      {/* Summary */}
      <div className="activity-summary">
        <div className="summary-cards">
          <div className="summary-card consistent">
            <h4>✅ Consistent Activities</h4>
            <p>These appear to use the same encounter table across all locations:</p>
            <div className="activity-list">
              {activitiesConsistent.length > 0 ? 
                activitiesConsistent.map(activity => 
                  <span key={activity} className="activity-tag consistent">{activity}</span>
                ) : 
                <span className="no-data">None detected</span>
              }
            </div>
          </div>
          
          <div className="summary-card variable">
            <h4>⚠️ Location-Dependent Activities</h4>
            <p>These show significant differences between locations:</p>
            <div className="activity-list">
              {activitiesWithVariations.length > 0 ? 
                activitiesWithVariations.map(activity => 
                  <span key={activity} className="activity-tag variable">{activity}</span>
                ) : 
                <span className="no-data">None detected</span>
              }
            </div>
          </div>
        </div>
      </div>
      
      {/* Individual activity tables */}
      {Object.entries(activityTables).map(([activityType, items]) => {
        const totalCount = Object.values(items).reduce((sum, count) => sum + count, 0);
        const itemList = Object.entries(items)
          .map(([item, count]) => ({
            item,
            count,
            percentage: ((count / totalCount) * 100).toFixed(1)
          }))
          .sort((a, b) => b.count - a.count);
        
        // Analyze location variations for this activity type
        const variations = locationVariations[activityType];
        const locationAnalysis = Object.entries(variations).map(([location, locationItems]) => {
          const locationTotal = Object.values(locationItems).reduce((sum, count) => sum + count, 0);
          const locationItemList = Object.entries(locationItems)
            .map(([item, count]) => ({
              item,
              count,
              percentage: ((count / locationTotal) * 100).toFixed(1)
            }))
            .sort((a, b) => b.count - a.count);
          
          return { location, items: locationItemList, total: locationTotal };
        }).filter(loc => loc.total > 0);
        
        // Check if there are significant variations between locations
        const hasVariations = locationAnalysis.length > 1 && (() => {
          const allItems = new Set();
          locationAnalysis.forEach(loc => loc.items.forEach(item => allItems.add(item.item)));
          
          // Check if any item has significantly different percentages across locations
          for (const item of allItems) {
            const percentages = locationAnalysis.map(loc => {
              const itemData = loc.items.find(i => i.item === item);
              return itemData ? parseFloat(itemData.percentage) : 0;
            });
            
            const max = Math.max(...percentages);
            const min = Math.min(...percentages);
            if (max - min > 15) return true; // 15% difference threshold
          }
          return false;
        })();
        
        if (totalCount === 0) return null;
        
        return (
          <div key={activityType} className="activity-table-section">
            <h3>{activityType.toUpperCase().replace(/-/g, ' ')} 
              <span className="activity-total">({totalCount} total encounters)</span>
            </h3>
            
            <div className="activity-analysis">
              <div className="global-table">
                <h4>Combined Table (All Locations)</h4>
                <div className="encounter-table activity-table">
                  <div className="table-header">
                    <div className="col-item">Item</div>
                    <div className="col-count">Count</div>
                    <div className="col-percentage">Estimated %</div>
                    <div className="col-value">Gold Value</div>
                  </div>
                  {itemList.map((item, index) => (
                    <div key={index} className={`table-row ${activityType}`}>
                      <div className="col-item">{item.item}</div>
                      <div className="col-count">{item.count}</div>
                      <div className="col-percentage">{item.percentage}%</div>
                      <div className="col-value">{getItemValue(item.item)} gold</div>
                    </div>
                  ))}
                </div>
              </div>
              
              {hasVariations && (
                <div className="location-variations">
                  <h4>⚠️ Location Variations Detected</h4>
                  <p className="variation-note">
                    This activity type shows significant differences between locations, suggesting they may use different encounter tables:
                  </p>
                  
                  <div className="variations-grid">
                    {locationAnalysis.map(locationData => (
                      <div key={locationData.location} className="location-variation">
                        <h5>{locationData.location.replace(/-/g, ' ').toUpperCase()}</h5>
                        <div className="mini-table">
                          {locationData.items.slice(0, 5).map((item, index) => (
                            <div key={index} className="mini-row">
                              <span className="mini-item">{item.item}</span>
                              <span className="mini-percentage">{item.percentage}%</span>
                            </div>
                          ))}
                          {locationData.items.length > 5 && (
                            <div className="mini-row">
                              <span className="mini-item">...and {locationData.items.length - 5} more</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!hasVariations && locationAnalysis.length > 1 && (
                <div className="location-consistency">
                  <p className="consistency-note">
                    ✅ <strong>Consistent across locations</strong> - This activity type appears to use the same encounter table regardless of location.
                    Tested across {locationAnalysis.length} locations: {locationAnalysis.map(l => l.location).join(', ')}.
                  </p>
                </div>
              )}
            </div>
          </div>
        );
      }).filter(Boolean)}
    </section>
  );
};

export default ActivityTypeAnalysis;
