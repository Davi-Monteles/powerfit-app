import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Dumbbell, Activity, Flame } from 'lucide-react';
import { generateSmartResponse } from '../lib/ai-engine';

export default function AIChat({ student, isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: `Olá, ${student?.name?.split(' ')[0] || 'Atleta'}! 💪 Sou a IA PowerFit, seu assistente de treino pessoal.\n\nPosso te ajudar com:\n• 🏋️ Treinos e exercícios\n• 🥗 Nutrição e dieta\n• 💧 Hidratação\n• 😴 Recuperação\n• 💪 Motivação\n\nO que precisa saber?` }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || typing) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setTyping(true);

    // Simulate AI "thinking" with realistic delay
    const thinkTime = 800 + Math.random() * 1200;
    setTimeout(() => {
      const response = generateSmartResponse(userMsg, student);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      setTyping(false);
    }, thinkTime);
  };

  const quickActions = [
    { label: '🏋️ Dicas de treino', msg: 'Me dê dicas para meu treino' },
    { label: '🥗 Nutrição', msg: 'Qual dieta devo seguir?' },
    { label: '💧 Hidratação', msg: 'Quanta água devo beber?' },
    { label: '💪 Motivação', msg: 'Estou desanimado, me motive!' },
  ];

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-container animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <div className="ai-icon"><Sparkles size={18} /></div>
            <div>
              <strong>PowerFit AI</strong>
              <div className="ai-status"><div className="status-dot"></div> On-line</div>
            </div>
          </div>
          <button className="ai-close" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="ai-chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`message-bubble ${m.role === 'assistant' ? 'assistant' : 'user'}`}>
              <div className="message-icon">
                {m.role === 'assistant' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className="message-content">
                {m.content.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < m.content.split('\n').length - 1 && <br />}</span>
                ))}
              </div>
            </div>
          ))}
          {typing && (
            <div className="message-bubble assistant">
              <div className="message-icon"><Bot size={14} /></div>
              <div className="message-content typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
        </div>

        {/* Quick actions - show only if few messages */}
        {messages.length <= 2 && !typing && (
          <div className="ai-quick-actions">
            {quickActions.map((action, i) => (
              <button
                key={i}
                className="ai-quick-btn"
                onClick={() => {
                  setInput(action.msg);
                  setTimeout(() => {
                    const fakeEvent = { preventDefault: () => {} };
                    setMessages(prev => [...prev, { role: 'user', content: action.msg }]);
                    setTyping(true);
                    const thinkTime = 800 + Math.random() * 1200;
                    setTimeout(() => {
                      const response = generateSmartResponse(action.msg, student);
                      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
                      setTyping(false);
                    }, thinkTime);
                    setInput('');
                  }, 50);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <form className="ai-chat-input" onSubmit={handleSend}>
          <input 
            placeholder="Pergunte sobre treino, dieta, exercícios..." 
            value={input} 
            onChange={e => setInput(e.target.value)}
            autoFocus
          />
          <button type="submit" disabled={!input.trim() || typing}>
            <Send size={18} />
          </button>
        </form>

        <style>{`
          .ai-chat-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(4px);
            z-index: 2000;
            display: flex;
            align-items: flex-end;
            justify-content: flex-end;
            padding: 24px;
          }
          .ai-chat-container {
            width: 420px;
            height: 600px;
            max-height: 85vh;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4);
            overflow: hidden;
          }
          .ai-chat-header {
            padding: 16px 20px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .ai-chat-title { display: flex; align-items: center; gap: 12px; }
          .ai-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--gradient-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
          .ai-close {
            background: rgba(255,255,255,0.05);
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 6px;
            border-radius: var(--radius-sm);
            display: flex;
            transition: all 0.15s ease;
          }
          .ai-close:hover { color: var(--text-primary); background: rgba(255,255,255,0.1); }
          .ai-status { font-size: 0.75rem; color: #10B981; display: flex; align-items: center; gap: 4px; }
          .status-dot { width: 6px; height: 6px; border-radius: 50%; background: #10B981; animation: aiPulse 2s infinite; }
          @keyframes aiPulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
          
          .ai-chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .message-bubble { display: flex; gap: 12px; max-width: 90%; }
          .message-bubble.user { align-self: flex-end; flex-direction: row-reverse; }
          .message-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: rgba(255,255,255,0.05);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: var(--text-muted);
          }
          .user .message-icon { background: var(--gradient-primary); color: white; }
          .message-content {
            padding: 10px 14px;
            border-radius: var(--radius-md);
            font-size: 0.85rem;
            line-height: 1.5;
          }
          .assistant .message-content { background: rgba(59, 130, 246, 0.1); color: var(--text-primary); border: 1px solid rgba(59, 130, 246, 0.2); }
          .user .message-content { background: var(--gradient-secondary); color: white; border-bottom-right-radius: 2px; }
          
          .typing { display: flex; gap: 4px; padding: 12px 16px; }
          .typing span { width: 6px; height: 6px; background: var(--text-muted); border-radius: 50%; animation: typingAnim 1s infinite alternate; }
          .typing span:nth-child(2) { animation-delay: 0.3s; }
          .typing span:nth-child(3) { animation-delay: 0.6s; }
          @keyframes typingAnim { from { opacity: 0.3; transform: translateY(0); } to { opacity: 1; transform: translateY(-4px); } }

          .ai-quick-actions {
            padding: 8px 16px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            border-top: 1px solid var(--border);
          }
          .ai-quick-btn {
            padding: 6px 12px;
            border-radius: 20px;
            border: 1px solid var(--border);
            background: rgba(255,255,255,0.03);
            color: var(--text-secondary);
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
          }
          .ai-quick-btn:hover {
            background: rgba(255, 107, 53, 0.1);
            border-color: var(--primary);
            color: var(--primary);
          }
          
          .ai-chat-input {
            padding: 16px;
            border-top: 1px solid var(--border);
            display: flex;
            gap: 10px;
          }
          .ai-chat-input input {
            flex: 1;
            background: rgba(255,255,255,0.05);
            border: 1px solid var(--border);
            border-radius: var(--radius-full);
            padding: 10px 16px;
            color: var(--text-primary);
            font-size: 0.88rem;
            font-family: inherit;
            outline: none;
            transition: border-color 0.2s;
          }
          .ai-chat-input input:focus {
            border-color: var(--primary);
          }
          .ai-chat-input input::placeholder { color: var(--text-muted); }
          .ai-chat-input button {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            background: var(--gradient-primary);
            border: none;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.2s;
            flex-shrink: 0;
          }
          .ai-chat-input button:disabled { opacity: 0.5; cursor: not-allowed; }
          .ai-chat-input button:hover:not(:disabled) { transform: scale(1.05); }

          @media (max-width: 600px) {
            .ai-chat-overlay { padding: 0; }
            .ai-chat-container { width: 100vw; height: 100vh; max-height: 100vh; border-radius: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
