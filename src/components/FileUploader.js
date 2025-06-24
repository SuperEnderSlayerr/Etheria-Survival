import React, { useState } from 'react';
import './FileUploader.css';

const FileUploader = ({ onDataLoad, expectedFiles }) => {
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (event, fileName) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const newUploadedFiles = {
        ...uploadedFiles,
        [fileName]: {
          content: text,
          file: file,
          timestamp: new Date()
        }
      };
      
      setUploadedFiles(newUploadedFiles);
      
      // If all files are uploaded, process them
      if (Object.keys(newUploadedFiles).length === expectedFiles.length) {
        setIsProcessing(true);
        onDataLoad(newUploadedFiles);
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Error reading file:', error);
      alert(`Error reading file ${file.name}: ${error.message}`);
    }
  };

  const clearFile = (fileName) => {
    const newUploadedFiles = { ...uploadedFiles };
    delete newUploadedFiles[fileName];
    setUploadedFiles(newUploadedFiles);
  };

  const clearAllFiles = () => {
    setUploadedFiles({});
  };

  return (
    <div className="file-uploader">
      <div className="uploader-header">
        <h3>Upload Your Discord Log Files</h3>
        <p>Upload your exported Discord logs to use real data instead of sample data.</p>
        <div className="upload-status">
          <span className="files-count">
            {Object.keys(uploadedFiles).length} of {expectedFiles.length} files uploaded
          </span>
          {Object.keys(uploadedFiles).length > 0 && (
            <button onClick={clearAllFiles} className="clear-all-btn">
              Clear All
            </button>
          )}
        </div>
      </div>

      <div className="file-upload-grid">
        {expectedFiles.map(fileName => {
          const locationName = fileName.replace('.txt', '').replace(/-/g, ' ');
          const isUploaded = uploadedFiles[fileName];
          
          return (
            <div key={fileName} className={`file-upload-item ${isUploaded ? 'uploaded' : ''}`}>
              <div className="file-info">
                <h4>{locationName.replace(/\b\w/g, l => l.toUpperCase())}</h4>
                <code>{fileName}</code>
              </div>
              
              <div className="file-controls">
                {isUploaded ? (
                  <div className="uploaded-info">
                    <span className="upload-success">✓ Uploaded</span>
                    <span className="file-size">
                      {(uploadedFiles[fileName].file.size / 1024).toFixed(1)} KB
                    </span>
                    <button 
                      onClick={() => clearFile(fileName)}
                      className="clear-btn"
                      title="Remove this file"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label className="file-input-label">
                    <input
                      type="file"
                      accept=".txt"
                      onChange={(e) => handleFileUpload(e, fileName)}
                      className="file-input"
                    />
                    Choose File
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isProcessing && (
        <div className="processing-indicator">
          <p>Processing uploaded files...</p>
        </div>
      )}

      <div className="upload-instructions">
        <h4>How to Export Discord Logs:</h4>
        <ol>
          <li>Use a Discord export tool like <a href="https://github.com/Tyrrrz/DiscordChatExporter" target="_blank" rel="noopener noreferrer">DiscordChatExporter</a></li>
          <li>Export each survival location channel as a .txt file</li>
          <li>Rename the files to match the expected names shown above</li>
          <li>Upload them here to use your actual game data</li>
        </ol>
        <p><strong>Privacy Note:</strong> Files are processed locally in your browser and are not sent to any server.</p>
      </div>
    </div>
  );
};

export default FileUploader;
