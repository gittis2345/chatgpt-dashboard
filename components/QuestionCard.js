export default function QuestionCard({ 
  question, 
  onRefresh, 
  onRemove 
}) {
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="white-card question-card">
      <div className="question-title">
        Q: {question.question}
      </div>
      
      <div className="question-content">
        <small>Asked: {formatTimestamp(question.timestamp)}</small>
        {question.model && (
          <small style={{ marginLeft: '10px' }}>
            Model: {question.model}
          </small>
        )}
      </div>

      <div className="answer-content">
        {question.loading ? (
          <div className="loading">
            <div className="spinner"></div>
            Getting answer from ChatGPT...
          </div>
        ) : question.error ? (
          <div className="error-message">
            ❌ {question.error}
          </div>
        ) : question.answer ? (
          <div>
            <strong>A:</strong> {question.answer}
          </div>
        ) : (
          <div style={{ color: '#999', fontStyle: 'italic' }}>
            No answer yet
          </div>
        )}
      </div>

      <div className="card-actions">
        <button 
          className="btn btn-small btn-secondary"
          onClick={() => onRefresh(question.id)}
          disabled={question.loading}
        >
          🔄 Refresh
        </button>
        <button 
          className="btn btn-small btn-danger"
          onClick={() => onRemove(question.id)}
        >
          🗑️ Remove
        </button>
      </div>
    </div>
  );
}
