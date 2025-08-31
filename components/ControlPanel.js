import { useState } from 'react';

export default function ControlPanel({ 
  onAddQuestion, 
  onLayoutChange, 
  onRefreshIntervalChange, 
  currentLayout,
  refreshInterval 
}) {
  const [question, setQuestion] = useState('');
  const [model, setModel] = useState('gpt-3.5-turbo');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (question.trim()) {
      onAddQuestion(question.trim(), model);
      setQuestion('');
    }
  };

  const layouts = [
    { id: 'grid-2', label: 'Grid 2x2' },
    { id: 'grid-3', label: 'Grid 3x3' },
    { id: 'grid-1', label: 'Single Column' },
    { id: 'list', label: 'List View' }
  ];

  const refreshOptions = [
    { value: 0, label: 'Manual' },
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 300000, label: '5 minutes' },
    { value: 600000, label: '10 minutes' }
  ];

  return (
    <div className="white-card control-panel">
      <div className="control-group">
        <div className="form-group">
          <label>Model:</label>
          <select 
            className="form-select"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
        <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Recommended)</option>
        <option value="gpt-4o-mini">GPT-4o Mini</option>
        <option value="gpt-4o">GPT-4o (Requires Access)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Auto Refresh:</label>
          <select 
            className="form-select"
            value={refreshInterval}
            onChange={(e) => onRefreshIntervalChange(parseInt(e.target.value))}
          >
            {refreshOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="control-group">
        <div className="form-group">
          <label>Layout:</label>
          <div className="layout-controls">
            {layouts.map(layout => (
              <button
                key={layout.id}
                className={`layout-btn ${currentLayout === layout.id ? 'active' : ''}`}
                onClick={() => onLayoutChange(layout.id)}
              >
                {layout.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="questionInput">Question:</label>
            <input
              type="text"
              id="questionInput"
              className="form-input"
              placeholder="Enter your question for ChatGPT"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            ➕ Add Question
          </button>
        </div>
      </form>
    </div>
  );
}
