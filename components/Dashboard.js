import { useState, useEffect, useCallback } from 'react';
import Layout from './Layout';
import ControlPanel from './ControlPanel';
import QuestionCard from './QuestionCard';

function generateId() {
  return Date.now() + Math.random();
}

export default function Dashboard() {
  const [questions, setQuestions] = useState([]);
  const [currentLayout, setCurrentLayout] = useState('grid-2');
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [refreshTimer, setRefreshTimer] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load questions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('chatgpt-dashboard-questions');
    if (saved) {
      try {
        const parsedQuestions = JSON.parse(saved);
        setQuestions(parsedQuestions.map(q => ({ ...q, loading: false })));
      } catch (error) {
        console.error('Failed to load saved questions:', error);
      }
    }

    const savedLayout = localStorage.getItem('chatgpt-dashboard-layout');
    if (savedLayout) {
      setCurrentLayout(savedLayout);
    }

    const savedRefreshInterval = localStorage.getItem('chatgpt-dashboard-refresh');
    if (savedRefreshInterval) {
      setRefreshInterval(parseInt(savedRefreshInterval));
    }
  }, []);

  // Save questions to localStorage
  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-questions', JSON.stringify(questions));
  }, [questions]);

  // Save layout preference
  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-layout', currentLayout);
  }, [currentLayout]);

  // Save refresh interval preference
  useEffect(() => {
    localStorage.setItem('chatgpt-dashboard-refresh', refreshInterval.toString());
  }, [refreshInterval]);

  // Ask ChatGPT API
  const askChatGPT = useCallback(async (questionId, questionText, model) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId 
        ? { ...q, loading: true, error: null }
        : q
    ));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: questionText,
          model: model
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to get response');
      }

      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              loading: false, 
              answer: data.answer,
              error: null,
              usage: data.usage
            }
          : q
      ));

    } catch (error) {
      setQuestions(prev => prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              loading: false, 
              error: error.message
            }
          : q
      ));
    }
  }, []);

  // Add new question
  const addQuestion = useCallback((questionText, model) => {
    const newQuestion = {
      id: generateId(),
      question: questionText,
      answer: null,
      loading: false,
      error: null,
      model: model,
      timestamp: Date.now()
    };

    setQuestions(prev => [...prev, newQuestion]);
    askChatGPT(newQuestion.id, questionText, model);
  }, [askChatGPT]);

  // Refresh question
  const refreshQuestion = useCallback((questionId) => {
    const question = questions.find(q => q.id === questionId);
    if (question && !question.loading) {
      askChatGPT(questionId, question.question, question.model);
    }
  }, [questions, askChatGPT]);

  // Remove question
  const removeQuestion = useCallback((questionId) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  }, []);

  // Auto refresh functionality
  useEffect(() => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }

    if (refreshInterval > 0) {
      const timer = setInterval(() => {
        setIsRefreshing(true);
        questions.forEach(question => {
          if (!question.loading) {
            askChatGPT(question.id, question.question, question.model);
          }
        });
        setTimeout(() => setIsRefreshing(false), 3000);
      }, refreshInterval);

      setRefreshTimer(timer);
    }

    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [refreshInterval, questions, askChatGPT]);

  // Handle refresh interval change
  const handleRefreshIntervalChange = useCallback((interval) => {
    setRefreshInterval(interval);
  }, []);

  // Get loading questions count
  const loadingCount = questions.filter(q => q.loading).length;
  const totalQuestions = questions.length;

  return (
    <Layout title="ChatGPT Dynamic Dashboard">
      {/* Header */}
      <div className="glass-card header">
        <h1>🤖
