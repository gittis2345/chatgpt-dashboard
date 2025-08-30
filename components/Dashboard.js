import { useState, useEffect, useCallback, useRef } from 'react';
import Layout from './Layout';
import ControlPanel from './ControlPanel';
import QuestionCard from './QuestionCard';

export default function Dashboard() {
  const [questions, setQuestions] = useState([]);
  const [currentLayout, setCurrentLayout] = useState('grid-2');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const questionsRef = useRef(questions);
  const intervalRef = useRef(null);

  // Utility to generate unique IDs
  const generateId = () => crypto.randomUUID();

  // Update questionsRef whenever questions change
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  // Load initial data from localStorage
  useEffect(() => {
    try {
      const savedQuestions = localStorage.getItem('chatgpt-dashboard-questions');
      if (savedQuestions && savedQuestions.trim() !== '') {
        const parsed = JSON.parse(savedQuestions);
        setQuestions(parsed.map(q => ({ ...q, loading: false })));
      }

      const savedLayout = localStorage.getItem('chatgpt-dashboard-layout');
      if (savedLayout) setCurrentLayout(savedLayout);

      const savedRefresh = localStorage.getItem('chatgpt-dashboard-refresh');
      if (savedRefresh) setRefreshInterval(parseInt(savedRefresh, 10));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  // Persist questions, layout, and refresh interval
  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-layout', currentLayout);
  }, [currentLayout]);

  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-refresh', refreshInterval.toString());
  }, [refreshInterval]);

  // Ask ChatGPT API
  const askChatGPT = useCallback(async (id, questionText, model) => {
    setQuestions(prev => prev.map(q =>
      q.id === id ? { ...q, loading: true, error: null } : q
    ));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText, model }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get response');

      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, loading: false, answer: data.answer, usage: data.usage, error: null } : q
      ));
    } catch (err) {
      setQuestions(prev => prev.map(q =>
        q.id === id ? { ...q, loading: false, error: err.message } : q
      ));
    }
  }, []);

  // Add new question
  const addQuestion = useCallback((questionText, model) => {
    const newQ = {
      id: generateId(),
      question: questionText,
      answer: null,
      loading: false,
      error: null,
      model,
      timestamp: Date.now()
    };
    setQuestions(prev => [...prev, newQ]);
    askChatGPT(newQ.id, questionText, model);
  }, [askChatGPT]);

  // Refresh a single question
  const refreshQuestion = useCallback((id) => {
    const q = questionsRef.current.find(q => q.id === id);
    if (q && !q.loading) askChatGPT(id, q.question, q.model);
  }, [askChatGPT]);

  // Remove question
  const removeQuestion = useCallback((id) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        setIsRefreshing(true);
        questionsRef.current.forEach(q => {
          if (!q.loading) askChatGPT(q.id, q.question, q.model);
        });
        setTimeout(() => setIsRefreshing(false), 3000);
      }, refreshInterval);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refreshInterval, askChatGPT]);

  // Refresh interval handler
  const handleRefreshIntervalChange = useCallback((interval) => {
    setRefreshInterval(interval);
  }, []);

  const loadingCount = questions.filter(q => q.loading).length;

  return (
    <Layout title="ChatGPT Dynamic Dashboard">
      <div className="glass-card header">
        <h1>🤖 ChatGPT Dynamic Dashboard</h1>
      </div>

      <ControlPanel
        onAddQuestion={addQuestion}
        onLayoutChange={setCurrentLayout}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        currentLayout={currentLayout}
        refreshInterval={refreshInterval}
      />

      <div className={`questions-grid ${currentLayout}`}>
        {questions.length === 0 ? (
          <div className="white-card empty-state">
            <h3>Welcome to ChatGPT Dashboard! 🎉</h3>
            <p>Add your first question above to get started.</p>
            <div style={{ fontSize: '3em', margin: '20px 0' }}>🚀</div>
          </div>
        ) : (
          questions.map(q => (
            <QuestionCard
              key={q.id}
              question={q}
              onRefresh={refreshQuestion}
              onRemove={removeQuestion}
            />
          ))
        )}
      </div>

      <div className="glass-card status-bar">
        <div className="status-item">
          <span>Status:</span>
          <span>
            {loadingCount > 0 
              ? `Processing ${loadingCount} question${loadingCount > 1 ? 's' : ''}...` 
              : 'All questions updated'}
          </span>
        </div>
        <div className="status-item">
          <span>Total Questions:</span>
          <span>{questions.length}</span>
        </div>
        {refreshInterval > 0 && (
          <div className="status-item">
            <span>Auto-refresh:</span>
            <span>Every {refreshInterval / 1000}s</span>
          </div>
        )}
      </div>

      <div className={`refresh-indicator ${isRefreshing ? 'show' : ''}`}>
        <div className="spinner"></div>
        Auto-refreshing questions...
      </div>
    </Layout>
  );
}
