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
  FiberManualRecord,
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

  const generatePrompt = (userInput, place, location) => {
    return `As a local guide AI, help with: ${userInput}
    ${place ? `Regarding: ${place.place_name}` : ""}
    Current location: Lat ${location.lat}, Lng ${location.lng}
    Please provide detailed, local-specific advice including:
    - Relevant local attractions
    - Cultural insights
    - Practical tips
    - Transportation options
    - Time-specific recommendations;`;
  };

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
      const response = await result.response;
      const aiMessage = { text: response.text(), sender: "ai" };

      setMessages((prev) => [...prev, aiMessage]);

      // If voice is enabled, sanitize and speak the response
      if (isVoiceEnabled && selectedVoice) {
        const sanitizedResponse = sanitizeText(response.text());

        const utterance = new SpeechSynthesisUtterance(sanitizedResponse);
        utterance.voice = selectedVoice;

        // Stop any ongoing speech before speaking new text
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

  // Function to sanitize text by removing unwanted symbols (e.g., asterisks, special characters)
  const sanitizeText = (text) => {
    return text.replace(/[\*\*\*\*\*\*]+/g, "").replace(/[^\w\s.,!?]/g, "");
  };

  const formatAIResponse = (response) => {
    const createSection = (title, icon, content) => (
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          {icon}
          <Typography variant="subtitle1" sx={{ fontWeight: "bold", ml: 1 }}>
            {title}
          </Typography>
        </Box>
        <Box sx={{ pl: 2 }}>{content}</Box>
      </Box>
    );

    const formatListItems = (text) => {
      return text.split("*").map((item, index) => {
        if (item.trim() === "") return null;
        return (
          <Box
            key={index}
            sx={{ display: "flex", alignItems: "flex-start", mb: 0.5 }}
          >
            <FiberManualRecord sx={{ fontSize: 8, mt: 1, mr: 1 }} />
            <Typography variant="body2">{item.trim()}</Typography>
          </Box>
        );
      });
    };

    const sections = {
      location: response.match(/^(.*?)(?=\*\*|$)/s)?.[0],
      hotels: response.match(/\*\*Hotels Nearby.*?\*\*(.*?)(?=\*\*|$)/s)?.[1],
      attractions: response.match(
        /\*\*Local Attractions:\*\*(.*?)(?=\*\*|$)/s
      )?.[1],
      cultural: response.match(
        /\*\*Cultural Insights:\*\*(.*?)(?=\*\*|$)/s
      )?.[1],
      practical: response.match(/\*\*Practical Tips:\*\*(.*?)(?=\*\*|$)/s)?.[1],
      time: response.match(/\*\*Time-Specific.*?\*\*(.*?)(?=\*\*|$)/s)?.[1],
      finding: response.match(/\*\*Finding Hotels:\*\*(.*?)(?=\*\*|$)/s)?.[1],
    };

    return (
      <Box sx={{ "& > *": { mb: 2 } }}>
        {sections.location && (
          <Typography variant="body1" sx={{ mb: 2 }}>
            {sections.location.trim()}
          </Typography>
        )}
        {sections.hotels &&
          createSection(
            "Hotels Nearby",
            <Hotel color="primary" />,
            formatListItems(sections.hotels)
          )}
        {sections.attractions &&
          createSection(
            "Local Attractions",
            <Attractions color="primary" />,
            formatListItems(sections.attractions)
          )}
        {sections.cultural &&
          createSection(
            "Cultural Insights",
            <Restaurant color="primary" />,
            formatListItems(sections.cultural)
          )}
        {sections.practical &&
          createSection(
            "Practical Tips",
            <Info color="primary" />,
            formatListItems(sections.practical)
          )}
        {sections.time &&
          createSection(
            "Time-Specific Recommendations",
            <Schedule color="primary" />,
            formatListItems(sections.time)
          )}
        {sections.finding &&
          createSection(
            "Additional Hotel Information",
            <LocationOn color="primary" />,
            <Typography variant="body2">{sections.finding.trim()}</Typography>
          )}
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
      // Stop speaking when toggling voice off
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

      <Box sx={{ p: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={isVoiceEnabled}
              onChange={handleToggleVoice}
              name="voice-toggle"
              color="primary"
            />
          }
          label="Enable Voice"
        />
        {isVoiceEnabled && (
          <Box>
            <Typography variant="body2" sx={{ mt: 2 }}>
              Select Voice
            </Typography>
            <select onChange={handleVoiceSelect} defaultValue="">
              <option value="">Choose a Voice</option>
              {window.speechSynthesis.getVoices().map((voice, index) => (
                <option key={index} value={voice.name}>
                  {voice.name}
                </option>
              ))}
            </select>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default ChatInterface;
