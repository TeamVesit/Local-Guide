import React, { useState, useEffect, useRef } from "react";
import {
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  Typography,
  IconButton,
  Chip,
  Box,
  Divider,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Send,
  LocationOn,
  Restaurant,
  Hotel,
  LocalActivity,
  Attractions,
  DirectionsBus,
  Info,
  Schedule,
} from "@mui/icons-material";
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyDQgCTCEbkJGdH4NlVV3Tei3IOAmQtRJ9Y";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

function ChatInterface({ selectedPlace, userLocation, onLocationSearch }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    { label: "Popular attractions", icon: <LocationOn /> },
    { label: "Best restaurants", icon: <Restaurant /> },
    { label: "Hotels nearby", icon: <Hotel /> },
    { label: "Local activities", icon: <LocalActivity /> },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const initializeVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setSelectedVoice(voices[0]);
      }
    };

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = initializeVoices;
      initializeVoices();
    }
  }, []);

  const generatePrompt = (userInput, place, location) => `
    As a local guide AI, help with: ${userInput}
    ${place ? `Regarding: ${place.place_name}` : ""}
    Current location: Lat ${location.lat}, Lng ${location.lng}
    Please provide detailed, local-specific advice including:
    - Relevant local attractions
    - Cultural insights
    - Practical tips
    - Transportation options
    - Time-specific recommendations.
  `;

  const handleQuickPrompt = (prompt) => {
    setInput(prompt.label);
    handleSend(prompt.label);
  };

  const extractLocationFromMessage = (text) => {
    const locationWords = text.match(
      /(?:in|at|to|visit)\s+([A-Za-z\s,]+)(?=[\s.,]|$)/i
    );
    return locationWords ? locationWords[1].trim() : null;
  };

  const sanitizeText = (text) => {
    return text
      .replace(/(\*\*.*?\*\*)/g, "\n\n$1\n\n")
      .replace(/(\*.*?\*)/g, "\n• $1")
      .replace(/[\*\*|\*]/g, "")
      .replace(/\n+/g, "\n")
      .trim();
  };

  const handleSend = async (customInput) => {
    const messageText = customInput || input;
    if (!messageText.trim()) return;

    const userMessage = { text: messageText, sender: "user" };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    const location = extractLocationFromMessage(messageText);
    if (location) {
      onLocationSearch(location);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      const prompt = generatePrompt(messageText, selectedPlace, userLocation);

      const result = await model.generateContent(prompt);
      const rawResponse = await result.response;
      const aiResponseText = rawResponse.text();

      const sanitizedResponse = sanitizeText(aiResponseText);
      const aiMessage = { text: sanitizedResponse, sender: "ai" };

      setMessages((prev) => [...prev, aiMessage]);

      if (isVoiceEnabled && selectedVoice) {
        const utterance = new SpeechSynthesisUtterance(sanitizedResponse);
        utterance.voice = selectedVoice;

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatAIResponse = (response) => {
    const createSection = (title, icon, content) => (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: "bold", ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ pl: 2 }}>
          {Array.isArray(content) ? (
            content.map((item, index) => (
              <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                • {item.trim()}
              </Typography>
            ))
          ) : (
            <Typography variant="body2">{content.trim()}</Typography>
          )}
        </Box>
      </Box>
    );

    const extractSection = (title) => {
      const regex = new RegExp(`\\*\\*${title}:?\\*\\*(.*?)(?=\\*\\*|$)`, "s");
      const match = response.match(regex);
      return match ? match[1].trim().split("\n").filter(Boolean) : null;
    };

    const sections = [
      { title: "Local Attractions", icon: <Attractions color="primary" /> },
      { title: "Cultural Insights", icon: <Info color="primary" /> },
      { title: "Practical Tips", icon: <Restaurant color="secondary" /> },
      {
        title: "Transportation Options",
        icon: <DirectionsBus color="success" />,
      },
      {
        title: "Time-Specific Recommendations",
        icon: <Schedule color="primary" />,
      },
    ];

    return (
      <Box sx={{ "& > *": { mb: 3 } }}>
        {response.split("**")[0] && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {response.split("**")[0].trim()}
          </Typography>
        )}

        {sections.map(({ title, icon }) => {
          const content = extractSection(title);
          return content ? createSection(title, icon, content) : null;
        })}
      </Box>
    );
  };

  const Message = ({ message }) => (
    <div className={message.sender}>
      {message.sender === "ai" ? (
        formatAIResponse(message.text)
      ) : (
        <Typography>{message.text}</Typography>
      )}
    </div>
  );

  const handleToggleVoice = () => {
    if (isVoiceEnabled) {
      window.speechSynthesis.cancel();
    }
    setIsVoiceEnabled((prev) => !prev);
  };

  const handleVoiceSelect = (event) => {
    const voice = window.speechSynthesis
      .getVoices()
      .find((v) => v.name === event.target.value);
    setSelectedVoice(voice);
  };

  return (
    <Paper className="chat-interface" elevation={3}>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6">AI Local Guide</Typography>
      </Box>

      <Box sx={{ p: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {quickPrompts.map((prompt, index) => (
          <Chip
            key={index}
            icon={prompt.icon}
            label={prompt.label}
            onClick={() => handleQuickPrompt(prompt)}
            clickable
          />
        ))}
      </Box>

      <List className="chat-messages">
        {messages.map((message, index) => (
          <Message key={index} message={message} />
        ))}
        {isTyping && <Message message={{ text: "Typing...", sender: "ai" }} />}
        <div ref={messagesEndRef} />
      </List>

      <Box className="chat-input">
        <TextField
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about any location or attraction..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          variant="outlined"
          size="small"
        />
        <IconButton
          onClick={() => handleSend()}
          color="primary"
          disabled={isTyping}
        >
          <Send />
        </IconButton>
      </Box>

      <Divider />
      <Box sx={{ px: 2, py: 1 }}>
        <FormControlLabel
          control={
            <Switch checked={isVoiceEnabled} onChange={handleToggleVoice} />
          }
          label="Enable voice"
        />
        {isVoiceEnabled && (
          <TextField
            select
            label="Voice"
            value={selectedVoice?.name || ""}
            onChange={handleVoiceSelect}
            SelectProps={{ native: true }}
            variant="outlined"
            size="small"
            sx={{ mt: 1 }}
          >
            {window.speechSynthesis.getVoices().map((voice, index) => (
              <option key={index} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </TextField>
        )}
      </Box>
    </Paper>
  );
}

export default ChatInterface;
