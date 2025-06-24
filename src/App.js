import React, { useState, useEffect } from 'react';
import './App.css';
import { parseAllEncounters, filterValidEncounters, analyzeDCDistribution, analyzeSuccessRatesByDC, calculateExpectedValueWithDCWeights, DC_WEIGHTS } from './utils/parser';
import ActivityTypeAnalysis from './components/ActivityTypeAnalysis';
import ProfitEstimator from './components/ProfitEstimator';
import DataValidator from './components/DataValidator';
import GoldCalculator from './components/GoldCalculator';
import ItemComparison from './components/ItemComparison';
import FileUploader from './components/FileUploader';

const fileNames = [
  'boiling-coast.txt',
  'bubblin-bayou.txt', 
  'flaring-mountains.txt',
  'redwood-glades.txt',
  'scarlet-hills.txt',
  'valley-of-fire.txt',
  'whispering-grove.txt'
];

const locationData = {
  'boiling-coast': {
    activities: ['fish', 'hunt aquatic'],
    huntTypes: ['aquatic'],
    fishing: true,
    foraging: false
  },
  'bubblin-bayou': {
    activities: ['hunt aquatic', 'forage'],
    huntTypes: ['aquatic'],
    fishing: false,
    foraging: true
  },
  'redwood-glades': {
    activities: ['hunt small', 'hunt big', 'hunt large', 'forage'],
    huntTypes: ['small', 'big', 'large'],
    fishing: false,
    foraging: true
  },
  'whispering-grove': {
    activities: ['hunt small', 'hunt big', 'hunt large', 'forage'],
    huntTypes: ['small', 'big', 'large'],
    fishing: false,
    foraging: true
  },
  'valley-of-fire': {
    activities: ['hunt small', 'hunt big', 'hunt large', 'forage'],
    huntTypes: ['small', 'big', 'large'],
    fishing: false,
    foraging: true
  },
  'scarlet-hills': {
    activities: ['hunt small', 'hunt big', 'hunt large', 'forage'],
    huntTypes: ['small', 'big', 'large'],
    fishing: false,
    foraging: true,
    disadvantage: ['hunting'] // hunting at disadvantage
  },
  'flaring-mountains': {
    activities: ['hunt small', 'hunt big', 'hunt large', 'forage'],
    huntTypes: ['small', 'big', 'large'],
    fishing: false,
    foraging: true,
    disadvantage: ['foraging'] // foraging at disadvantage
  }
};

const App = () => {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [activeTab, setActiveTab] = useState('gold'); // New state for active tab
  const [uploadedData, setUploadedData] = useState(null); // For user-uploaded files

  // Handle user file uploads
  const handleDataUpload = async (uploadedFiles) => {
    try {
      const newData = {};
      let debugMessages = [];

      for (const fileName of fileNames) {
        if (uploadedFiles[fileName]) {
          // Process uploaded file
          const text = uploadedFiles[fileName].content;
          const encounters = parseAllEncounters(text, fileName);
          const location = fileName.replace('.txt', '');

          const filteredResult = filterValidEncounters(encounters, location, locationData);
          
          newData[fileName] = {
            all: encounters,
            valid: filteredResult.valid,
            invalid: filteredResult.invalid,
            isUserData: true
          };
          
          debugMessages.push(`${fileName}: ${encounters.length} encounters (${filteredResult.valid.length} valid, ${filteredResult.invalid.length} invalid) - using uploaded data`);
        }
      }

      // Merge with existing data (keep sample data for files not uploaded)
      const mergedData = { ...data };
      Object.keys(newData).forEach(fileName => {
        mergedData[fileName] = newData[fileName];
      });

      setData(mergedData);
      setUploadedData(uploadedFiles);
      setDebugInfo(debugMessages.join('\n'));
      
    } catch (err) {
      console.error('Error processing uploaded files:', err);
      setError(`Error processing uploaded files: ${err.message}`);
    }
  };
  useEffect(() => {
    const loadData = async () => {      try {
        const allData = {};
        let debugMessages = [];
          for (const fileName of fileNames) {
          try {
            // First try to load user's private data
            let response = await fetch(`/txtData/${fileName}`);
            let isUsingUserData = true;
            
            // If that fails, try sample data
            if (!response.ok) {
              const sampleFileName = `sample-${fileName.replace('.txt', '')}.txt`;
              response = await fetch(`/data/raw-data/${sampleFileName}`);
              isUsingUserData = false;
              
              if (!response.ok) {
                throw new Error(`No data available for ${fileName} (tried both user data and sample)`);
              }
            }
            
            const text = await response.text();
            const encounters = parseAllEncounters(text, fileName);
            const location = fileName.replace('.txt', '');

            // Filter encounters to separate valid from invalid
            const filteredResult = filterValidEncounters(encounters, location, locationData);
            
            allData[fileName] = {
              all: encounters,
              valid: filteredResult.valid,
              invalid: filteredResult.invalid,
              isUserData: isUsingUserData
            };
            
            const dataSource = isUsingUserData ? 'user data' : 'sample data';
            debugMessages.push(`${fileName}: ${encounters.length} encounters (${filteredResult.valid.length} valid, ${filteredResult.invalid.length} invalid) - using ${dataSource}`);
            
          } catch (err) {
            console.error(`Error loading ${fileName}:`, err);
            allData[fileName] = {
              all: [],
              valid: [],
              invalid: [],
              isUserData: false
            };
            debugMessages.push(`${fileName}: ERROR - ${err.message}`);
          }
        }
          // Create a flattened array of all encounters for components that need it
        const allEncounters = Object.values(allData)
          .filter(locationData => locationData && locationData.all)
          .flatMap(locationData => locationData.all);
        allData.allEncounters = allEncounters;
        
        // Run DC distribution analysis
        console.log('Running DC distribution and success rate analysis...');
        analyzeDCDistribution(allEncounters);
        analyzeSuccessRatesByDC(allEncounters);
        
        setDebugInfo(debugMessages.join('\n'));
        setData(allData);
        setLoading(false);
      } catch (err) {
        console.error('General error:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);  const getTotalEncounters = () => {
    return Object.values(data).reduce((total, dataSet) => {
      return total + (dataSet && dataSet.all ? dataSet.all.length : 0);
    }, 0);
  };

  const getDataSourceInfo = () => {
    const dataSets = Object.values(data).filter(dataSet => dataSet && dataSet.hasOwnProperty('isUserData'));
    if (dataSets.length === 0) return null;
    
    const userDataCount = dataSets.filter(ds => ds.isUserData).length;
    const sampleDataCount = dataSets.filter(ds => !ds.isUserData && ds.all && ds.all.length > 0).length;
    
    if (userDataCount > 0 && sampleDataCount > 0) {
      return { type: 'mixed', userCount: userDataCount, sampleCount: sampleDataCount };
    } else if (userDataCount > 0) {
      return { type: 'user', count: userDataCount };
    } else if (sampleDataCount > 0) {
      return { type: 'sample', count: sampleDataCount };
    }
    return { type: 'none' };
  };

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading Etheria data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app">
        <div className="error">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="app">      <header className="app-header">
        <h1>Etheria Survival Calculator</h1>
        <div className="summary">
          <p>Analyzing {getTotalEncounters()} encounters across {fileNames.length} locations</p>
          {(() => {
            const dataSource = getDataSourceInfo();
            if (dataSource?.type === 'sample') {
              return (
                <div className="data-source-notice sample">
                  <strong>Demo Mode:</strong> Using sample data for demonstration. 
                  <a href="#data-setup" style={{marginLeft: '5px'}}>Add your own Discord logs</a> for full functionality.
                </div>
              );
            } else if (dataSource?.type === 'mixed') {
              return (
                <div className="data-source-notice mixed">
                  <strong>Mixed Data:</strong> Using {dataSource.userCount} user files and {dataSource.sampleCount} sample files.
                </div>
              );
            } else if (dataSource?.type === 'user') {
              return (
                <div className="data-source-notice user">
                  <strong>Live Data:</strong> Using your Discord server data ({dataSource.count} locations).
                </div>
              );
            }
            return null;
          })()}
        </div>
        
        {debugInfo && (
          <div className="debug-info">
            <h3>Debug Info:</h3>
            <pre>{debugInfo}</pre>
          </div>
        )}      </header>

      <main className="app-main">        <div className="tabs-container">          <div className="tabs-header">
            <button 
              className={`tab-button ${activeTab === 'gold' ? 'active' : ''}`}
              onClick={() => setActiveTab('gold')}
            >
              Gold Calculator
            </button>
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Data
            </button>
            <button 
              className={`tab-button ${activeTab === 'profit' ? 'active' : ''}`}
              onClick={() => setActiveTab('profit')}
            >
              Profit Estimator
            </button>
            <button 
              className={`tab-button ${activeTab === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveTab('comparison')}
            >
              Item Comparison
            </button>
            <button 
              className={`tab-button ${activeTab === 'analysis' ? 'active' : ''}`}
              onClick={() => setActiveTab('analysis')}
            >
              Activity Analysis
            </button>
            <button 
              className={`tab-button ${activeTab === 'validator' ? 'active' : ''}`}
              onClick={() => setActiveTab('validator')}
            >
              Data Validator
            </button>
          </div>            <div className="tab-content">
              {activeTab === 'gold' && (
              <GoldCalculator locationData={locationData} data={data} />
            )}
            
              {activeTab === 'upload' && (
                <FileUploader 
                  onDataLoad={handleDataUpload}
                  expectedFiles={fileNames}
                />
              )}
            
              {activeTab === 'profit' && (
              <ProfitEstimator data={data} locationData={locationData} />
            )}
            
            {activeTab === 'comparison' && (
              <ItemComparison locationData={data} />
            )}
            {activeTab === 'analysis' && (
              <ActivityTypeAnalysis data={data} />
            )}
            
            {activeTab === 'validator' && (
              <DataValidator data={data} locationData={locationData} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
