import React from 'react';

const DataValidator = ({ data, locationData }) => {
  // Early return if data is not loaded yet
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    return <div>Loading data validation...</div>;
  }

  const locationAnalysis = Object.entries(data).map(([fileName, dataSet]) => {
    const location = fileName.replace('.txt', '');
    const locationInfo = locationData[location];
    
    // Count encounters by type
    const encounterCounts = {};
    const validCounts = {};
    const invalidCounts = {};    (dataSet?.all || []).forEach(encounter => {
      encounterCounts[encounter.type] = (encounterCounts[encounter.type] || 0) + 1;
    });
    
    (dataSet?.valid || []).forEach(encounter => {
      validCounts[encounter.type] = (validCounts[encounter.type] || 0) + 1;
    });
    
    (dataSet?.invalid || []).forEach(encounter => {
      invalidCounts[encounter.type] = (invalidCounts[encounter.type] || 0) + 1;
    });
    
    // Get examples of invalid encounters
    const invalidExamples = (dataSet?.invalid || [])
      .filter(e => e.type === 'foraging' || e.type === 'fishing')
      .slice(0, 3)
      .map(e => ({
        type: e.type,
        item: e.item,
        success: e.success,
        quantity: e.quantity
      }));
      return {
      location,
      locationInfo,
      totalEncounters: (dataSet?.all || []).length,
      validEncounters: (dataSet?.valid || []).length,
      invalidEncounters: (dataSet?.invalid || []).length,
      encounterCounts,
      validCounts,
      invalidCounts,
      invalidExamples
    };
  });
  
  return (
    <section className="data-section">
      <h2>Data Validation Report</h2>
      <p className="section-description">
        Shows what encounters are being parsed and filtered for each location. 
        Helps debug issues with missing activity types.
      </p>
      
      {locationAnalysis.map(analysis => (
        <div key={analysis.location} className="location-analysis">
          <h3>{analysis.location.charAt(0).toUpperCase() + analysis.location.slice(1).replace('-', ' ')}</h3>
          
          <div className="location-stats">
            <div className="stat-card">
              <h4>Location Config</h4>
              <p>Fishing: {analysis.locationInfo?.fishing ? '✅' : '❌'}</p>
              <p>Foraging: {analysis.locationInfo?.foraging ? '✅' : '❌'}</p>
              <p>Hunt Types: {analysis.locationInfo?.huntTypes?.join(', ') || 'None'}</p>
            </div>
            
            <div className="stat-card">
              <h4>Encounter Totals</h4>
              <p>Total Parsed: {analysis.totalEncounters}</p>
              <p>Valid: {analysis.validEncounters}</p>
              <p>Invalid: {analysis.invalidEncounters}</p>
            </div>
          </div>
          
          <div className="encounter-breakdown">
            <h4>Encounter Types Breakdown</h4>
            <table className="encounter-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Total Found</th>
                  <th>Valid</th>
                  <th>Invalid</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(analysis.encounterCounts).map(type => (
                  <tr key={type} className={
                    (type === 'foraging' || type === 'fishing') && 
                    analysis.invalidCounts[type] > 0 ? 'problem-row' : ''
                  }>
                    <td>{type}</td>
                    <td>{analysis.encounterCounts[type] || 0}</td>
                    <td>{analysis.validCounts[type] || 0}</td>
                    <td>{analysis.invalidCounts[type] || 0}</td>
                    <td>
                      {analysis.validCounts[type] > 0 ? '✅' : 
                       analysis.invalidCounts[type] > 0 ? '⚠️ Filtered' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {(analysis.invalidExamples || []).length > 0 && (
            <div className="invalid-examples">
              <h4>Invalid Foraging/Fishing Examples</h4>
              {(analysis.invalidExamples || []).map((example, index) => (
                <div key={index} className="example">
                  <p><strong>{example.type}</strong>: "{example.item}" 
                     (Success: {example.success ? 'Yes' : 'No'}, 
                      Quantity: {example.quantity})</p>
                </div>
              ))}
              <p className="example-note">
                These were filtered out because this location doesn't allow {analysis.invalidExamples[0]?.type}.
              </p>
            </div>
          )}
        </div>
      ))}
    </section>
  );
};

export default DataValidator;
