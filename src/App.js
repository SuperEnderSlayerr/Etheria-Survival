import React, { useState, useEffect } from 'react';
import './App.css';
import { parseAllEncounters, filterValidEncounters, analyzeDCDistribution, analyzeSuccessRatesByDC, calculateExpectedValueWithDCWeights, DC_WEIGHTS } from './utils/parser';
import ActivityTypeAnalysis from './components/ActivityTypeAnalysis';
import ProfitEstimator from './components/ProfitEstimator';
import DataValidator from './components/DataValidator';
import GoldCalculator from './components/GoldCalculator';
import ItemComparison from './components/ItemComparison';

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
  useEffect(() => {
    const loadData = async () => {      try {
        const allData = {};
        let debugMessages = [];
          for (const fileName of fileNames) {
          try {            
            const response = await fetch(`/txtData/${fileName}`);
            if (!response.ok) {
              throw new Error(`Failed to load ${fileName}: ${response.status}`);
            }            const text = await response.text();
            const encounters = parseAllEncounters(text, fileName);
            const location = fileName.replace('.txt', '');// Filter encounters to separate valid from invalid
            const filteredResult = filterValidEncounters(encounters, location, locationData);
            
            allData[fileName] = {
              all: encounters,
              valid: filteredResult.valid,
              invalid: filteredResult.invalid
            };
            debugMessages.push(`${fileName}: ${encounters.length} encounters (${filteredResult.valid.length} valid, ${filteredResult.invalid.length} invalid)`);
              } catch (err) {
            console.error(`Error loading ${fileName}:`, err);
            allData[fileName] = {              all: [],
              valid: [],
              invalid: []
            };
            debugMessages.push(`${fileName}: ERROR - ${err.message}`);
          }        }
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
