import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  ChevronDown,
  Loader,
  Paperclip,
  FileText,
  Image,
  File,
  Download,
  Phone,
  Video,
  ArrowLeft,
  Smile
} from "lucide-react";
import { formatChatbotResponse } from "./FormatChatResponse";
import { Link } from "react-router-dom";
import { useChatWithBotMutation } from "../../../services/AIServices";
import styled, { keyframes } from "styled-components";
import { useNavigate } from "react-router-dom";
import { useGetFeatureStatusByNameQuery } from "../../../services/Masters/featureStatusAPI";

// Keyframe animations
const fadeInScale = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(20px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
`;

const slideUp = keyframes`
  0% {
    transform: translateY(100%);
    opacity: 0;
  }
  100% {
    transform: translateY(0);
    opacity: 1;
  }
`;

const messageSlideIn = keyframes`
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

// Styled Components
const ChatContainer = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  z-index: 1000;
`;

const ChatButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  border: none;
  border-radius: 50%;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
  transition: all 0.3s ease;
  animation: ${pulse} 2s infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 35px rgba(0, 122, 255, 0.4);
  }
`;

const ChatWindow = styled.div`
  position: fixed;
  bottom: 0;
  right: 0;
  width: 100vw;
  height: 100vh;
  max-height: 100vh;
  background: #000;
  animation: ${slideUp} 0.4s ease-out;
  display: flex;
  flex-direction: column;
  
  @media (min-width: 768px) {
    width: 380px;
    height: 85vh;
    max-height: 600px;
    bottom: 2rem;
    right: 2rem;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-height: 600px) {
    height: 90vh;
  }
`;

const ChatHeader = styled.div`
  background: #fff;
  padding: 20px 16px 12px;
  border-bottom: 1px solid #e5e5e7;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  flex-shrink: 0;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #000;
  margin-bottom: 2px;
`;

const UserStatus = styled.div`
  font-size: 13px;
  color: #8e8e93;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const HeaderButton = styled.button`
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: #f2f2f7;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: #f2f2f7;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c7c7cc;
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #a8a8b0;
  }
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
  gap: 4px;
`;

const MessageBubble = styled.div`
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 18px;
  word-wrap: break-word;
  animation: ${messageSlideIn} 0.3s ease-out;
  position: relative;
  
  ${props => props.sender === 'user' ? `
    background: #007AFF;
    color: white;
    border-bottom-right-radius: 6px;
    margin-left: auto;
  ` : `
    background: white;
    color: #000;
    border-bottom-left-radius: 6px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  `}
`;

const MessageTime = styled.div`
  font-size: 11px;
  color: #8e8e93;
  margin-top: 4px;
  text-align: ${props => props.sender === 'user' ? 'right' : 'left'};
`;

const InputSection = styled.div`
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #e5e5e7;
`;

const FilePreviewArea = styled.div`
  padding: 12px 16px 0;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e5e7;
  max-height: 120px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #c7c7cc;
    border-radius: 2px;
  }
`;

const InputContainer = styled.div`
  padding: 12px 16px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: #f2f2f7;
  border-radius: 20px;
  padding: 8px 12px;
`;

const MessageInput = styled.textarea`
  flex: 1;
  border: none;
  background: none;
  outline: none;
  resize: none;
  font-size: 16px;
  font-family: inherit;
  min-height: 20px;
  max-height: 100px;
  line-height: 1.4;
  
  /* Hide scrollbar (Webkit browsers like Chrome, Edge, Safari) */
  &::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for Firefox */
  scrollbar-width: none;

  /* Hide scrollbar for IE and older Edge */
  -ms-overflow-style: none;

  &::placeholder {
    color: #8e8e93;
  }
  
  &:disabled {
    opacity: 1;
    color: inherit;
  }
`;

const SendButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: ${props => props.disabled ? '#c7c7cc' : '#007AFF'};
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover:not(:disabled) {
    background: #0056CC;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
`;

const AttachButton = styled.button`
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  color: #8e8e93;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: #e5e5e7;
  }
`;

const QuickReplyContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
`;

const QuickReplyButton = styled.button`
  padding: 8px 12px;
  background: #f2f2f7;
  border: 1px solid #e5e5e7;
  border-radius: 16px;
  font-size: 14px;
  color: #007AFF;
  transition: all 0.2s;
  
  &:hover {
    background: #e5e5e7;
  }
`;

const FilePreview = styled.div`
  background: white;
  border: 1px solid #e5e5e7;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const TypingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8e8e93;
  font-size: 14px;
  
  .dots {
    display: flex;
    gap: 4px;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c7c7cc;
    animation: ${keyframes`
      0%, 60%, 100% { transform: scale(1); opacity: 0.5; }
      30% { transform: scale(1.2); opacity: 1; }
    `} 1.4s infinite ease-in-out;
    
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
`;

const ModernChatBot = () => {
  // Feature status query - no authentication required
  const { data: featureData, isLoading: featureDataLoading } =
    useGetFeatureStatusByNameQuery(
      { name: "chatbot_ai" }
    )

  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState(() => {
    const storedMessages = sessionStorage.getItem("chatbot_messages");
    return storedMessages
      ? JSON.parse(storedMessages)
      : [
        {
          text: "Hey there! 👋 I'm here to help with your e-learning questions!",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ];
  });

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem("chatbot_messages", JSON.stringify(messages));
  }, [messages]);

  const [input, setInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [chatWithBot, { isLoading }] = useChatWithBotMutation();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fix scroll issue when reopening the chat
  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e) => {
    setInput(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 100) + 'px';
  };

  const getFileIcon = (file) => {
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      return <Image size={16} className="text-green-600" />;
    } else if (fileType.includes('pdf')) {
      return <FileText size={16} className="text-red-600" />;
    } else {
      return <File size={16} className="text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSend = async (reply = null) => {
    if (!input.trim() && selectedFiles.length === 0 && !reply) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const messageContent = {
      text: reply || input,
      files: selectedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        chatBotFile: file
      })),
      sender: "user",
      timestamp
    };

    setMessages(prev => [...prev, messageContent]);
    setInput("");
    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Add typing indicator
    setMessages((prev) => [...prev, {
      isTyping: true,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    try {
      const formData = new FormData();
      formData.append('userQuery', reply || input);
      selectedFiles.forEach((attachment) => {
        formData.append("chatBotFile", attachment);
      });

      const response = await chatWithBot(formData).unwrap();


      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isTyping),
        {
          text: response.reply,
          link: response.redirectLink,
          quickReplies: response.quickReplies,
          contextType: response.contextType,
          contextData: response.contextData,
          formattedContent: response.contextType ? response : null,
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((msg) => !msg.isTyping),
        {
          text: "Sorry, I couldn't process your request. Please try again. 😔",
          sender: "bot",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
      ]);
      const errorMessage = error?.data?.error ||
        error?.data?.message ||
        error?.error ||
        error?.message ||
        'Failed to delete role';
      toast.error(errorMessage);
    }
  };

  const handleQuickReply = (reply) => {
    handleSend(reply);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Show nothing if feature is inactive or loading
  if (featureDataLoading || featureData?.is_active === 0) {
    return null;
  }

  return (
    <ChatContainer>
      {!isOpen && (
        <ChatButton onClick={() => setIsOpen(true)}>
          <MessageCircle size={24} />
        </ChatButton>
      )}

      {isOpen && (
        <ChatWindow>
          {/* Header */}
          <ChatHeader>
            <div className="flex items-center">
              <HeaderButton onClick={() => setIsOpen(false)} className="md:hidden">
                <ArrowLeft size={20} />
              </HeaderButton>

              <UserInfo>
                <Avatar>AI</Avatar>
                <UserDetails>
                  <UserName>Learning Assistant</UserName>
                  <UserStatus>Online now</UserStatus>
                </UserDetails>
              </UserInfo>
            </div>

            <HeaderActions>
              {/* <HeaderButton className="hidden md:flex">
                <Phone size={18} />
              </HeaderButton> */}
              {/* <HeaderButton className="hidden md:flex">
              <Phone size={18} />
              </HeaderButton> */}
              <HeaderButton onClick={() => setIsOpen(false)} className="hidden md:flex">
                <X size={18} />
              </HeaderButton>
            </HeaderActions>
          </ChatHeader>

          {/* Messages */}
          <MessagesContainer ref={messagesContainerRef}>
            {messages.map((msg, index) => (
              <MessageGroup key={index} sender={msg.sender}>
                <MessageBubble sender={msg.sender}>
                  {msg.isTyping ? (
                    <TypingIndicator>
                      <span>Assistant is typing</span>
                      <div className="dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    </TypingIndicator>
                  ) : (
                    <>
                      <div style={{ whiteSpace: "pre-wrap" }}>
                        {msg.formattedContent ? (
                          formatChatbotResponse(msg.formattedContent)
                        ) : (
                          <>
                            {/<[a-z][\s\S]*>/i.test(msg.text) ? (
                              <div dangerouslySetInnerHTML={{ __html: msg.text }} />
                            ) : (
                              msg.text
                            )}
                          </>
                        )}
                      </div>

                      {/* Files display */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {msg.files.map((file, fileIndex) => (
                            <FilePreview key={fileIndex}>
                              {getFileIcon(file)}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">{file.name}</div>
                                <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                              </div>
                              <Download size={16} className="text-gray-400 cursor-pointer hover:text-gray-600" />
                            </FilePreview>
                          ))}
                        </div>
                      )}

                      {/* Quick Replies */}
                      {index + 1 === messages.length && msg.quickReplies && msg.quickReplies.length > 0 && (
                        <QuickReplyContainer>
                          {msg.quickReplies.map((reply, index) => (
                            <QuickReplyButton
                              key={index}
                              onClick={() => handleQuickReply(reply.description)}
                            >
                              {reply.name}
                            </QuickReplyButton>
                          ))}
                        </QuickReplyContainer>
                      )}

                      {/* Action button */}
                      {msg.link && (
                        <button
                          onClick={() => navigate(msg.link)}
                          className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition duration-200 text-sm"
                        >
                          Go to Page
                        </button>
                      )}
                    </>
                  )}
                </MessageBubble>

                {!msg.isTyping && (
                  <MessageTime sender={msg.sender}>
                    {msg.timestamp}
                  </MessageTime>
                )}
              </MessageGroup>
            ))}
            <div ref={messagesEndRef} />
          </MessagesContainer>

          {/* Input Section */}
          <InputSection>
            {/* File preview area */}
            {selectedFiles.length > 0 && (
              <FilePreviewArea>
                {selectedFiles.map((file, index) => (
                  <FilePreview key={index}>
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getFileIcon(file)}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{file.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                    >
                      <X size={16} />
                    </button>
                  </FilePreview>
                ))}
              </FilePreviewArea>
            )}

            {/* Input */}
            <InputContainer>
              <InputWrapper>
                <AttachButton onClick={() => fileInputRef.current?.click()}>
                  <Paperclip size={18} />
                </AttachButton>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="*/*"
                />

                <MessageInput
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message"
                  rows={1}
                />

                <SendButton
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
                  className={`px-2 rounded-md flex items-center justify-center gap-1
    ${isLoading || (!input.trim() && selectedFiles.length === 0)
                      ? 'bg-white text-[#007AFF] border border-[#007AFF]'
                      : 'bg-[#007AFF] text-white'}
  `}
                >
                  <Send size={24} color="currentColor" />
                </SendButton>
              </InputWrapper>
            </InputContainer>
          </InputSection>
        </ChatWindow>
      )}
    </ChatContainer>
  );
};

export default ModernChatBot;