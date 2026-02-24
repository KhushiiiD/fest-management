import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { forumAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const Forum = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // fetch existing messages
    const fetchMessages = async () => {
      try {
        const res = await forumAPI.getMessages(eventId);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('fetch messages error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // connect socket — use backend URL from env (production) or replace port (local dev)
    const socketUrl = import.meta.env.VITE_API_URL || window.location.origin.replace(':3000', ':5000');
    socketRef.current = io(socketUrl);
    socketRef.current.emit('join-forum', eventId);

    socketRef.current.on('newMessage', (msg) => {
      setMessages(prev => [...prev, msg]);
    });
    socketRef.current.on('messageDeleted', ({ messageId }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: '[message deleted]' } : m
      ));
    });
    socketRef.current.on('messagePinned', ({ messageId, isPinned }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isPinned } : m
      ));
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSending(true);
    try {
      await forumAPI.postMessage(eventId, { content: newMessage });
      setNewMessage('');
      // message will arrive via socket
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId) => {
    try {
      await forumAPI.deleteMessage(messageId);
    } catch (err) {
      alert('Failed to delete');
    }
  };

  const handlePin = async (messageId) => {
    try {
      await forumAPI.pinMessage(messageId);
    } catch (err) {
      alert('Failed to pin');
    }
  };

  const handleReact = async (messageId, emoji) => {
    try {
      await forumAPI.addReaction(messageId, { emoji });
      // update locally
      const res = await forumAPI.getMessages(eventId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('react error:', err);
    }
  };

  if (loading) return <div className="loading">Loading forum...</div>;

  return (
    <div className="page-container forum-container">
      <h2>💬 Event Forum</h2>

      <div className="forum-messages">
        {messages.length === 0 ? (
          <div className="empty-state"><p>No messages yet. Start the conversation!</p></div>
        ) : (
          messages.map(msg => (
            <div key={msg._id}
              className={`forum-message ${msg.isPinned ? 'pinned' : ''} ${msg.isDeleted ? 'deleted' : ''}`}>
              {msg.isPinned && <span className="pin-indicator">📌 Pinned</span>}
              <div className="message-header">
                <strong>
                  {msg.author?.role === 'organizer'
                    ? `${msg.author.organizerName} (Organizer)`
                    : `${msg.author?.firstName} ${msg.author?.lastName}`}
                </strong>
                <span className="message-time">
                  {new Date(msg.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="message-content">{msg.content}</p>

              {/* Reactions */}
              {msg.reactions?.length > 0 && (
                <div className="reactions">
                  {msg.reactions.map((r, i) => (
                    <span key={i} className="reaction" onClick={() => handleReact(msg._id, r.emoji)}>
                      {r.emoji} {r.users?.length || 0}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              {!msg.isDeleted && (
                <div className="message-actions">
                  <button onClick={() => handleReact(msg._id, '👍')} className="btn-icon">👍</button>
                  <button onClick={() => handleReact(msg._id, '❤️')} className="btn-icon">❤️</button>
                  <button onClick={() => handleReact(msg._id, '😂')} className="btn-icon">😂</button>
                  {(msg.author?._id === user?._id || user?.role === 'organizer') && (
                    <button onClick={() => handleDelete(msg._id)} className="btn-icon btn-danger-icon">🗑️</button>
                  )}
                  {user?.role === 'organizer' && (
                    <button onClick={() => handlePin(msg._id)} className="btn-icon">
                      {msg.isPinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="forum-input">
        <input type="text" placeholder="Type a message..." value={newMessage}
          onChange={e => setNewMessage(e.target.value)} disabled={sending} />
        <button type="submit" className="btn btn-primary" disabled={sending || !newMessage.trim()}>
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Forum;
