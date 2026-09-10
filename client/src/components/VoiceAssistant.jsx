import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FiMic, FiMicOff, FiVolume2, FiVolumeX, FiSend, FiX, FiCheck, 
  FiHelpCircle, FiChevronUp, FiChevronDown, FiRefreshCw, FiTruck, 
  FiPackage, FiDollarSign, FiBarChart2, FiMapPin, FiCpu, FiUser,
  FiSettings, FiPlay, FiSquare
} from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedLang, setSelectedLang] = useState('hi-IN'); // 'hi-IN', 'mr-IN', 'en-IN'
  const [speechRate, setSpeechRate] = useState(1.0);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [activeTab, setActiveTab] = useState('quick'); // 'quick', 'history', 'settings', 'help'
  const [history, setHistory] = useState([
    {
      id: 1,
      sender: 'ai',
      text: 'नमस्ते! मैं CROP2GO का AI साथी हूँ। आप बोलकर लॉगिन कर सकते हैं, मंडी भाव जान सकते हैं, या गाड़ी बुक कर सकते हैं।',
      payload: {
        display: 'नमस्ते! मैं CROP2GO का AI साथी हूँ। आप बोलकर लॉगिन कर सकते हैं, मंडी भाव जान सकते हैं, या गाड़ी बुक कर सकते हैं।',
        hindi: 'नमस्ते! मैं CROP2GO का AI साथी हूँ। आप बोलकर लॉगिन कर सकते हैं, मंडी भाव जान सकते हैं, या गाड़ी बुक कर सकते हैं।',
        marathi: 'नमस्कार! मी CROP2GO चा AI साथी आहे. तुम्ही बोलून लॉगिन करू शकता किंवा बाजारभाव विचारू शकता.',
        english: 'Hello! I am your CROP2GO AI assistant. You can speak to log in, check mandi prices, or book transport.'
      },
      time: 'Just now'
    }
  ]);

  const { login, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recognitionRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize Speech Recognition for speech-to-text
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = selectedLang;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('');
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          handleVoiceCommand(currentTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition event error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission needed. Please allow microphone in your browser settings.');
        } else if (event.error === 'no-speech') {
          toast('No voice detected. Please speak closer to the mic or tap a button below.', { icon: '🎤' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Speech recognition initialization failed:', e);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (_) {}
      }
      stopSpeaking();
    };
  }, [selectedLang]);

  // Stop any active audio playback
  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Fallback speech synthesis if audio stream fails
  const fallbackSpeechSynthesis = (payload) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const textToSay = payload.phonetic || payload.english || payload.display;
      const utterance = new SpeechSynthesisUtterance(textToSay);
      utterance.rate = speechRate;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  // High-Definition Studio Voice Playback via /api/tts
  const speakText = (voicePayload) => {
    if (!soundEnabled) return;

    // Stop previous audio
    stopSpeaking();

    // Determine target text and language code
    let textToSpeak = voicePayload.hindi || voicePayload.display;
    let ttsLang = 'hi';

    if (selectedLang.startsWith('mr')) {
      textToSpeak = voicePayload.marathi || voicePayload.hindi || voicePayload.display;
      ttsLang = 'mr';
    } else if (selectedLang.startsWith('en')) {
      textToSpeak = voicePayload.english || voicePayload.display;
      ttsLang = 'en';
    } else {
      textToSpeak = voicePayload.hindi || voicePayload.display;
      ttsLang = 'hi';
    }

    // Clean text of special symbols for natural speech synthesis
    const cleanSpeechText = textToSpeak
      .replace(/[#*`_~]/g, '')
      .replace(/₹/g, ' रुपये ')
      .trim();

    try {
      const url = `/api/tts?text=${encodeURIComponent(cleanSpeechText)}&lang=${ttsLang}`;
      const audio = new Audio(url);
      audio.playbackRate = speechRate;
      audioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.warn('HD Audio playback error, switching to browser TTS fallback:', e);
        fallbackSpeechSynthesis(voicePayload);
      };

      audio.play().catch(err => {
        console.warn('Audio auto-play policy prevented playback, switching to TTS:', err);
        fallbackSpeechSynthesis(voicePayload);
      });
    } catch (err) {
      console.error('Audio stream initiation error:', err);
      fallbackSpeechSynthesis(voicePayload);
    }
  };

  // Toggle listening
  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Voice recognition is not supported in this browser. Please use quick chips or type below.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      stopSpeaking();
      try {
        recognitionRef.current.lang = selectedLang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  // Test current audio voice
  const testCurrentVoice = () => {
    let testPayload = {
      display: 'नमस्ते! CROP2GO का AI साथी अब बिल्कुल साफ और स्पष्ट बोल रहा है।',
      hindi: 'नमस्ते! CROP2GO का AI साथी अब बिल्कुल साफ और स्पष्ट बोल रहा है।',
      marathi: 'नमस्कार! CROP2GO चा AI साथी आता अत्यंत स्पष्ट आणि सुंदर आवाजात बोलत आहे.',
      english: 'Hello! The CROP2GO AI assistant is now speaking with crystal clear studio audio quality.'
    };

    speakText(testPayload);
    toast.success('Playing studio-quality voice sample...');
  };

  // The Intent Engine: Maps natural speech into UI actions and studio audio
  const handleVoiceCommand = async (rawInput) => {
    if (!rawInput || !rawInput.trim()) return;
    const command = rawInput.trim();
    const lower = command.toLowerCase();

    let executedAction = null;
    let voicePayload = {
      display: '',
      hindi: '',
      marathi: '',
      english: '',
      phonetic: ''
    };

    // 1. AUTHENTICATION / VOICE LOGIN
    if (
      lower.includes('ramesh') || lower.includes('patel') || 
      lower.includes('रमेश') || lower.includes('किसान लॉगिन') || 
      (lower.includes('farmer') && lower.includes('login')) || 
      lower.includes('kisaan login')
    ) {
      executedAction = 'Farmer Login';
      try {
        await login('9999900010', 'password123', 'Ramesh', 'Patel');
        voicePayload = {
          display: 'नमस्ते रमेश पटेल जी! आपका किसान पोर्टल खोल दिया गया है।',
          hindi: 'नमस्ते रमेश पटेल जी! आपका किसान पोर्टल खोल दिया गया है।',
          marathi: 'नमस्कार रमेश पटेल जी! तुमचे शेतकरी पोर्टल उघडले आहे.',
          english: 'Welcome Ramesh Patel ji! Your farmer portal is now open.',
          phonetic: 'Namaste Ramesh Patel ji! Aapka kisaan portal open ho gaya hai.'
        };
        navigate('/farmer');
      } catch (e) {
        voicePayload = {
          display: 'लॉगिन में समस्या आई। कृपया क्रेडेंशियल जांचें।',
          hindi: 'लॉगिन में समस्या आई। कृपया क्रेडेंशियल जांचें।',
          marathi: 'लॉगिन करताना त्रुटी आली. कृपया तपासा.',
          english: 'Login failed. Please check credentials.',
          phonetic: 'Login mein samasya aayi.'
        };
      }
    } 
    else if (
      lower.includes('rajesh') || lower.includes('fpo admin') || 
      lower.includes('admin login') || lower.includes('राजेश') || 
      lower.includes('एडमिन लॉगिन') || lower.includes('fpo login')
    ) {
      executedAction = 'FPO Admin Login';
      try {
        await login('9999900001', 'password123', 'Rajesh', 'Kumar');
        voicePayload = {
          display: 'FPO एडमिन राजेश कुमार जी का मैनेजमेंट डैशबोर्ड ओपन हो गया है।',
          hindi: 'FPO एडमिन राजेश कुमार जी का मैनेजमेंट डैशबोर्ड ओपन हो गया है।',
          marathi: 'FPO ॲडमिन राजेश कुमार यांचे व्यवस्थापन डॅशबोर्ड उघडले आहे.',
          english: 'Logged in as FPO Admin Rajesh Kumar. Management console ready.',
          phonetic: 'FPO Admin Rajesh Kumar ji ka management dashboard open ho gaya hai.'
        };
        navigate('/fpo');
      } catch (e) {
        voicePayload = {
          display: 'लॉगिन में समस्या आई। कृपया क्रेडेंशियल जांचें।',
          hindi: 'लॉगिन में समस्या आई। कृपया क्रेडेंशियल जांचें।',
          marathi: 'लॉगिन त्रुटी.',
          english: 'Login failed.',
          phonetic: 'Login failed.'
        };
      }
    } 
    else if (
      lower.includes('suresh') || lower.includes('tractor driver') || 
      lower.includes('driver login') || lower.includes('transporter login') || 
      lower.includes('सुरेश') || lower.includes('ड्राइवर लॉगिन') || 
      lower.includes('गाड़ी चालक')
    ) {
      executedAction = 'Transporter Login';
      try {
        await login('9999900040', 'password123', 'Suresh', 'Yadav');
        voicePayload = {
          display: 'ट्रांसपोर्टर सुरेश यादव जी का लाइव GPS नेविगेशन पोर्टल ओपन हो गया है।',
          hindi: 'ट्रांसपोर्टर सुरेश यादव जी का लाइव GPS नेविगेशन पोर्टल ओपन हो गया है।',
          marathi: 'ट्रान्सपोर्टर सुरेश यादव यांचे थेट जीपीएस पोर्टल उघडले आहे.',
          english: 'Logged in as Transporter Suresh Yadav. Live GPS navigation portal opened.',
          phonetic: 'Transporter Suresh Yadav ji ka live GPS navigation portal open ho gaya hai.'
        };
        navigate('/transport');
      } catch (e) {
        voicePayload = {
          display: 'लॉगिन में समस्या आई।',
          hindi: 'लॉगिन में समस्या आई।',
          marathi: 'लॉगिन त्रुटी.',
          english: 'Login failed.',
          phonetic: 'Login failed.'
        };
      }
    } 
    else if (
      lower.includes('reliance') || lower.includes('buyer login') || 
      lower.includes('trader login') || lower.includes('खरीदार लॉगिन') || 
      lower.includes('बायर')
    ) {
      executedAction = 'Buyer Login';
      try {
        await login('9999900020', 'password123', 'Reliance', 'Fresh');
        voicePayload = {
          display: 'रिलायंस फ्रेश बायर पोर्टल ओपन हो गया है।',
          hindi: 'रिलायंस फ्रेश बायर पोर्टल ओपन हो गया है।',
          marathi: 'रिलायन्स फ्रेश खरेदीदार पोर्टल उघडले आहे.',
          english: 'Logged in as Reliance Fresh Buyer. Available master lots ready.',
          phonetic: 'Reliance Fresh buyer portal open ho gaya hai.'
        };
        navigate('/buyer');
      } catch (e) {
        voicePayload = {
          display: 'लॉगिन में समस्या आई।',
          hindi: 'लॉगिन में समस्या आई।',
          marathi: 'लॉगिन त्रुटी.',
          english: 'Login failed.',
          phonetic: 'Login failed.'
        };
      }
    }
    else if (lower.includes('logout') || lower.includes('लॉगआउट') || lower.includes('बाहर निकलो')) {
      executedAction = 'Logout';
      logout();
      navigate('/login');
      voicePayload = {
        display: 'आप CROP2GO से सफलतापूर्वक लॉगआउट हो गए हैं।',
        hindi: 'आप CROP2GO से सफलतापूर्वक लॉगआउट हो गए हैं।',
        marathi: 'तुम्ही CROP2GO मधून यशस्वीरित्या लॉगआउट झाले आहात.',
        english: 'You have been logged out successfully.',
        phonetic: 'Aap CROP2GO se successfully logout ho gaye hain.'
      };
    }

    // 2. MANDI PRICES & MARKET RATES
    else if (
      lower.includes('mandi') || lower.includes('bhav') || lower.includes('rate') || 
      lower.includes('मंडी') || lower.includes('भाव') || lower.includes('रेट') || 
      lower.includes('price') || lower.includes('बाजार')
    ) {
      executedAction = 'Mandi Prices';
      navigate('/farmer/mandi-prices');
      voicePayload = {
        display: 'वाशी APMC मंडी में टमाटर का मॉडल रेट ₹38 प्रति किलो और आजादपुर में ₹42 चल रहा है। FPO रेट ₹40 प्रति किलो है।',
        hindi: 'वाशी APMC मंडी में टमाटर का मॉडल रेट ₹38 प्रति किलो और आजादपुर में ₹42 चल रहा है। FPO रेट ₹40 प्रति किलो है।',
        marathi: 'वाशी बाजार समितीत टोमॅटोचा दर ₹38 प्रति किलो आणि आझादपूर दिल्लीमध्ये ₹42 चालू आहे.',
        english: 'Vashi APMC modal price for Tomato is ₹38 per kg, and Azadpur Delhi is ₹42 per kg. FPO contract rate is ₹40 per kg.',
        phonetic: 'Vashi APMC Mandi mein tamatar ka modal rate 38 rupaye per kilo chal raha hai.'
      };
    }

    // 3. CROPS & HARVEST RECORD
    else if (
      lower.includes('fasal') || lower.includes('crop') || lower.includes('tamatar') || 
      lower.includes('tomato') || lower.includes('pyaz') || lower.includes('onion') || 
      lower.includes('फसल') || lower.includes('टमाटर') || lower.includes('कांदा')
    ) {
      executedAction = 'Farmer Crops';
      navigate('/farmer/crops');
      voicePayload = {
        display: 'आपकी फसल सूची खोल दी गई है। आपके 2.5 एकड़ में अभिनव टमाटर और 1.5 एकड़ में नासिक लाल प्याज एक्टिव हैं।',
        hindi: 'आपकी फसल सूची खोल दी गई है। आपके 2.5 एकड़ में अभिनव टमाटर और 1.5 एकड़ में नासिक लाल प्याज एक्टिव हैं।',
        marathi: 'तुमची पीक यादी उघडली आहे. अडीच एकरात टोमॅटो आणि दीड एकरात नाशिक लाल कांदा लागवड आहे.',
        english: 'Opened your crop log. You have 2.5 acres of Abhinav Tomatoes and 1.5 acres of Nashik Red Onions active.',
        phonetic: 'Aapki fasal soochi khol di gayi hai.'
      };
    }

    // 4. PAYMENTS & VOUCHERS
    else if (
      lower.includes('payment') || lower.includes('paisa') || lower.includes('rupaye') || 
      lower.includes('khata') || lower.includes('भुगतान') || lower.includes('पैसे') || 
      lower.includes('पगार') || lower.includes('bank')
    ) {
      executedAction = 'Payments';
      if (user?.role === 'fpo_admin') {
        navigate('/fpo/payments');
        voicePayload = {
          display: 'FPO पेमेंट सेटलमेंट लेजर ओपन हो गया है। रमेश पटेल का ₹1,10,032 का भुगतान कम्प्लीट है।',
          hindi: 'FPO पेमेंट सेटलमेंट लेजर ओपन हो गया है। रमेश पटेल का ₹1,10,032 का भुगतान कम्प्लीट है।',
          marathi: 'FPO पेमेंट खाते उघडले आहे. रमेश पटेल यांचे ₹1,10,032 थेट खात्यावर जमा झाले आहे.',
          english: 'Opened FPO payment settlement ledger. Ramesh Patel payout of ₹1,10,032 is completed.',
          phonetic: 'FPO payment settlement ledger open ho gaya hai.'
        };
      } else {
        navigate('/farmer/payments');
        voicePayload = {
          display: 'आपका पेमेंट वाउचर चेक किया। 3,200 किलो टमाटर का ₹1,10,032 का डायरेक्ट बैंक ट्रांसफर कम्प्लीट हो चुका है!',
          hindi: 'आपका पेमेंट वाउचर चेक किया। 3,200 किलो टमाटर का ₹1,10,032 का डायरेक्ट बैंक ट्रांसफर कम्प्लीट हो चुका है!',
          marathi: 'तुमची पावती तपासली. 3,200 किलो टोमॅटोचे ₹1,10,032 थेट बँक ट्रान्सफर पूर्ण झाले आहे!',
          english: 'Payment voucher verified. ₹1,10,032 direct bank transfer for Tomato Lot TOM-0908 has been completed!',
          phonetic: 'Aapka payment voucher check kiya. Direct bank transfer complete ho chuka hai.'
        };
      }
    }

    // 5. TRANSPORT / VEHICLE / GAADI BOOKING
    else if (
      lower.includes('transport') || lower.includes('gadi') || lower.includes('gaadi') || 
      lower.includes('vahan') || lower.includes('ट्रक') || lower.includes('गाड़ी') || 
      lower.includes('वाहन') || lower.includes('गाडी')
    ) {
      executedAction = 'Transport';
      if (user?.role === 'transporter' || user?.role === 'driver') {
        navigate('/transport');
        voicePayload = {
          display: 'ट्रांसपोर्टर कंसोल ओपन है। ट्रक MH 12 AB 9021 वाशी APMC मुंबई के रूट पर है।',
          hindi: 'ट्रांसपोर्टर कंसोल ओपन है। ट्रक MH 12 AB 9021 वाशी APMC मुंबई के रूट पर है।',
          marathi: 'ट्रान्सपोर्टर कन्सोल सुरू आहे. ट्रक मुंबईकडे रवाना होत आहे.',
          english: 'Transporter console active. Truck MH 12 AB 9021 en route to Vashi APMC Mumbai.',
          phonetic: 'Transporter console open hai.'
        };
      } else if (user?.role === 'fpo_admin') {
        navigate('/fpo/transport');
        voicePayload = {
          display: 'FPO फ्लीट लॉजिस्टिक्स और ट्रांसपोर्ट ऑपरेशन्स ओपन कर दिए हैं।',
          hindi: 'FPO फ्लीट लॉजिस्टिक्स और ट्रांसपोर्ट ऑपरेशन्स ओपन कर दिए हैं।',
          marathi: 'वाहतूक व्यवस्थापन उघडले आहे.',
          english: 'Opened FPO fleet logistics and transport operations.',
          phonetic: 'FPO fleet logistics open kar diye hain.'
        };
      } else {
        navigate('/farmer/transport');
        voicePayload = {
          display: 'फसल ट्रांसपोर्ट बुकिंग पेज ओपन हो गया है। बोलेरो पिकअप और आयशर ट्रक उपलब्ध हैं।',
          hindi: 'फसल ट्रांसपोर्ट बुकिंग पेज ओपन हो गया है। बोलेरो पिकअप और आयशर ट्रक उपलब्ध हैं।',
          marathi: 'वाहतूक बुकिंग उघडले आहे. बोलेरो पिकअप आणि आयशर ट्रक उपलब्ध आहेत.',
          english: 'Opened transport booking. Bolero Pickups and Eicher Trucks are available for harvest dispatch.',
          phonetic: 'Fasal transport booking page open ho gaya hai.'
        };
      }
    }

    // 6. TRACTOR & FARM MACHINERY / EQUIPMENT
    else if (
      lower.includes('tractor') || lower.includes('machinery') || lower.includes('equipment') || 
      lower.includes('औजार') || lower.includes('ट्रैक्टर') || lower.includes('sprayer') || 
      lower.includes('rotavator')
    ) {
      executedAction = 'Equipment';
      navigate('/farmer/equipment');
      voicePayload = {
        display: 'FPO कृषि यंत्र बुकिंग ओपन हो गया है। महिंद्रा 575 DI ट्रैक्टर और बूम स्प्रेयर उपलब्ध हैं।',
        hindi: 'FPO कृषि यंत्र बुकिंग ओपन हो गया है। महिंद्रा 575 DI ट्रैक्टर और बूम स्प्रेयर उपलब्ध हैं।',
        marathi: 'कृषी अवजारे बुकिंग उघडले आहे. ट्रॅक्टर आणि फवारणी यंत्रे उपलब्ध आहेत.',
        english: 'Opened FPO machinery booking. Mahindra 575 DI Tractor and Boom Sprayers are ready for booking.',
        phonetic: 'FPO krishi yantra booking open ho gaya hai.'
      };
    }

    // 7. EXPENSES / KHARCHA
    else if (
      lower.includes('kharcha') || lower.includes('expense') || lower.includes('खर्चा') || 
      lower.includes('लागत') || lower.includes('bill')
    ) {
      executedAction = 'Expenses';
      navigate('/farmer/expenses');
      voicePayload = {
        display: 'फसल खर्च लेजर ओपन हो गया है। कुल दर्ज खर्च ₹21,500 है।',
        hindi: 'फसल खर्च लेजर ओपन हो गया है। कुल दर्ज खर्च ₹21,500 है।',
        marathi: 'शेती खर्च नोंदवही उघडली आहे. एकूण खर्च ₹21,500 नोंदवला गेला आहे.',
        english: 'Opened farm expense ledger. Total recorded seasonal expense is ₹21,500.',
        phonetic: 'Fasal kharcha ledger open ho gaya hai.'
      };
    }

    // 8. PRODUCE / LOT STATUS
    else if (
      lower.includes('produce') || lower.includes('lot') || lower.includes('maal') || 
      lower.includes('वजन') || lower.includes('माल') || lower.includes('receipt')
    ) {
      executedAction = 'Produce Status';
      navigate('/farmer/produce');
      voicePayload = {
        display: 'आपका 3,200 किलो टमाटर लॉट TOM-0908 81.25% ग्रेड-A में पास होकर डिस्पैच हो चुका है।',
        hindi: 'आपका 3,200 किलो टमाटर लॉट TOM-0908 81.25% ग्रेड-A में पास होकर डिस्पैच हो चुका है।',
        marathi: 'तुमचा 3,200 किलो टोमॅटो लॉट ग्रेड-A मध्ये पास होऊन पाठवला गेला आहे.',
        english: 'Checked produce: Lot TOM-0908 (3,200 kg Tomato) is 81.25% Grade-A and dispatched.',
        phonetic: 'Aapka tamatar lot TOM-0908 pass hokar dispatch ho chuka hai.'
      };
    }

    // 9. WEATHER & RAIN FORECAST
    else if (
      lower.includes('mausam') || lower.includes('weather') || lower.includes('मौसम') || 
      lower.includes('हवामान') || lower.includes('barish') || lower.includes('rain')
    ) {
      executedAction = 'Weather';
      navigate('/farmer/weather');
      voicePayload = {
        display: 'नासिक में आज तापमान 28 डिग्री सेल्सियस और मौसम साफ है। फसल तुड़ाई के लिए समय बहुत उत्तम है।',
        hindi: 'नासिक में आज तापमान 28 डिग्री सेल्सियस और मौसम साफ है। फसल तुड़ाई के लिए समय बहुत उत्तम है।',
        marathi: 'नाशिकमध्ये आज तापमान 28 अंश असून हवामान स्वच्छ आहे. फळ तोडणीसाठी उत्तम काळ आहे.',
        english: 'Nashik weather today: 28°C with clear skies, ideal for tomato harvesting.',
        phonetic: 'Nashik mein aaj taapmaan 28 degree Celsius aur mausam saaf hai.'
      };
    }

    // 10. FPO COLLECTION & FARMER ARRIVAL
    else if (
      lower.includes('collection') || lower.includes('arrival') || lower.includes('आवक') || 
      lower.includes('कलेक्शन') || lower.includes('किसान आगमन')
    ) {
      executedAction = 'Collection';
      navigate('/fpo/collection');
      voicePayload = {
        display: 'किसान आगमन और न्यू लॉट कलेक्शन काउंटर ओपन हो गया है।',
        hindi: 'किसान आगमन और न्यू लॉट कलेक्शन काउंटर ओपन हो गया है।',
        marathi: 'शेतकरी आगमन आणि नवीन लॉट संकलन काउंटर उघडले आहे.',
        english: 'Opened Farmer Arrival and Lot Collection module.',
        phonetic: 'Kisaan aagman aur new lot collection counter open ho gaya hai.'
      };
    }

    // 11. WEIGHING / KANTA
    else if (
      lower.includes('weighing') || lower.includes('vajan') || lower.includes('kanta') || 
      lower.includes('कांटा') || lower.includes('तौल')
    ) {
      executedAction = 'Weighing';
      navigate('/fpo/weighing');
      voicePayload = {
        display: 'इलेक्ट्रॉनिक डिजिटल कांटा वजन मॉड्यूल तैयार है।',
        hindi: 'इलेक्ट्रॉनिक डिजिटल कांटा वजन मॉड्यूल तैयार है।',
        marathi: 'इलेक्ट्रॉनिक वजन काटा तयार आहे.',
        english: 'Digital electronic weighing scale connected and ready.',
        phonetic: 'Electronic digital kaanta vajan module ready hai.'
      };
    }

    // 12. AI GRADING
    else if (
      lower.includes('grading') || lower.includes('quality') || lower.includes('ai grade') || 
      lower.includes('ग्रेडिंग') || lower.includes('गुणवत्ता')
    ) {
      executedAction = 'AI Grading';
      navigate('/fpo/grading');
      voicePayload = {
        display: 'AI कंप्यूटर विजन ग्रेडिंग सिस्टम खुल गया है। ग्रेड-A, B, C क्लासिफिकेशन चालू है।',
        hindi: 'AI कंप्यूटर विजन ग्रेडिंग सिस्टम खुल गया है। ग्रेड-A, B, C क्लासिफिकेशन चालू है।',
        marathi: 'एआय कॉम्प्युटर व्हिजन प्रतवारी प्रणाली सुरू झाली आहे.',
        english: 'AI Computer Vision grading system ready. Auto-classifying Grade-A, B, C, and rejections.',
        phonetic: 'AI computer vision grading system open ho gaya hai.'
      };
    }

    // 13. AGGREGATION / MASTER LOT
    else if (
      lower.includes('aggregation') || lower.includes('master lot') || lower.includes('मास्टर लॉट') || 
      lower.includes('इकट्ठा')
    ) {
      executedAction = 'Aggregation';
      navigate('/fpo/aggregation');
      voicePayload = {
        display: 'मास्टर लॉट एग्रीगेशन स्क्रीन ओपन है। 12,250 किलो टमाटर का बड़ा बैच तैयार है।',
        hindi: 'मास्टर लॉट एग्रीगेशन स्क्रीन ओपन है। 12,250 किलो टमाटर का बड़ा बैच तैयार है।',
        marathi: 'मास्टर लॉट एकत्रीकरण स्क्रीन उघडली आहे. 12,250 किलो टोमॅटोचा मोठा साठा तयार आहे.',
        english: 'Opened Master Lot Aggregation. 12,250 kg tomato batch ready for buyer contract.',
        phonetic: 'Master lot aggregation screen open hai.'
      };
    }

    // 14. INVENTORY / WAREHOUSE STOCK
    else if (
      lower.includes('inventory') || lower.includes('stock') || lower.includes('गोदाम') || 
      lower.includes('स्टॉक') || lower.includes('इन्वेंटरी')
    ) {
      executedAction = 'Inventory';
      navigate('/fpo/inventory');
      voicePayload = {
        display: 'गोदाम स्टॉक: 12,250 किलो टमाटर और 8,500 किलो लाल प्याज कोल्ड स्टोरेज में सुरक्षित हैं।',
        hindi: 'गोदाम स्टॉक: 12,250 किलो टमाटर और 8,500 किलो लाल प्याज कोल्ड स्टोरेज में सुरक्षित हैं।',
        marathi: 'गोदाम साठा: 12,250 किलो टोमॅटो आणि 8,500 किलो कांदा कोल्ड स्टोरेजमध्ये सुरक्षित आहे.',
        english: 'Warehouse Stock: 12,250 kg Tomato and 8,500 kg Red Onion safely stored in cold storage.',
        phonetic: 'Godam stock: 12250 kilo tamatar aur 8500 kilo pyaaz surakshit hain.'
      };
    }

    // 15. LIVE GPS DISPATCH TRACKING
    else if (
      lower.includes('dispatch') || lower.includes('tracking') || lower.includes('gps') || 
      lower.includes('map') || lower.includes('नक्शा') || lower.includes('गाड़ी कहां')
    ) {
      executedAction = 'GPS Dispatch';
      navigate('/fpo/dispatch');
      voicePayload = {
        display: 'लाइव GPS ट्रैकिंग नक्शा ओपन है। ट्रक MH 12 AB 9021 मुंबई एक्सप्रेसवे पर 48 km/h की रफ्तार से आगे बढ़ रहा है।',
        hindi: 'लाइव GPS ट्रैकिंग नक्शा ओपन है। ट्रक MH 12 AB 9021 मुंबई एक्सप्रेसवे पर 48 km/h की रफ्तार से आगे बढ़ रहा है।',
        marathi: 'थेट जीपीएस ट्रॅकिंग नकाशा उघडला आहे. ट्रक मुंबई एक्स्प्रेस वेवर धावत आहे.',
        english: 'Live GPS tracking map open. Truck MH 12 AB 9021 is live at 48 km/h on Mumbai Expressway.',
        phonetic: 'Live GPS tracking map open hai.'
      };
    }

    // 16. TRANSPORTER DESTINATION & ROUTE
    else if (
      lower.includes('destination') || lower.includes('route') || lower.includes('kaha jana') || 
      lower.includes('रास्ता') || lower.includes('कहाँ जाना') || lower.includes('trip')
    ) {
      executedAction = 'Trip Destination';
      navigate('/transport');
      voicePayload = {
        display: 'आपका डेस्टिनेशन रिलायंस फ्रेश वाशी APMC मुंबई है। कोल्ड-चेन टेम्परेचर 12 डिग्री नॉर्मल है।',
        hindi: 'आपका डेस्टिनेशन रिलायंस फ्रेश वाशी APMC मुंबई है। कोल्ड-चेन टेम्परेचर 12 डिग्री नॉर्मल है।',
        marathi: 'तुमचे गंतव्य रिलायन्स फ्रेश वाशी मुंबई आहे. तापमान 12 अंश सामान्य आहे.',
        english: 'Destination: Reliance Fresh Vashi APMC Mumbai. Cold-chain temperature is normal at 12°C.',
        phonetic: 'Aapka destination Reliance Fresh Vashi APMC Mumbai hai.'
      };
    }

    // 17. ABOUT CROP2GO
    else if (
      lower.includes('crop2go') || lower.includes('kya hai') || lower.includes('about') || 
      lower.includes('क्या है') || lower.includes('software') || lower.includes('system')
    ) {
      executedAction = 'About CROP2GO';
      voicePayload = {
        display: 'CROP2GO भारत का पहला AI-संचालित पोस्ट-हार्वेस्ट एग्रीगेशन, AI ग्रेडिंग और स्मार्ट कोल्ड-चेन लॉजिस्टिक्स प्लेटफॉर्म है जो किसानों की आमदनी 35% बढ़ाता है।',
        hindi: 'CROP2GO भारत का पहला AI-संचालित पोस्ट-हार्वेस्ट एग्रीगेशन, AI ग्रेडिंग और स्मार्ट कोल्ड-चेन लॉजिस्टिक्स प्लेटफॉर्म है जो किसानों की आमदनी 35% बढ़ाता है।',
        marathi: 'CROP2GO हे भारतातील पहिले एआय-आधारित कृषी लॉजिस्टिक्स आणि प्रतवारी व्यासपीठ आहे.',
        english: 'CROP2GO is India’s first AI-powered post-harvest aggregation, AI grading, and smart cold-chain logistics platform for FPOs and Farmers.',
        phonetic: 'CROP2GO Bharat ka pehla AI-powered post-harvest platform hai.'
      };
    }

    // 18. HELP
    else if (
      lower.includes('help') || lower.includes('madad') || lower.includes('command') || 
      lower.includes('मदद') || lower.includes('सहायता')
    ) {
      executedAction = 'Help';
      voicePayload = {
        display: "आप बोल सकते हैं: 'रमेश पटेल लॉगिन करो', 'टमाटर मंडी भाव बताओ', 'गाड़ी बुक करो', या 'लाइव GPS ट्रैकिंग दिखाओ'।",
        hindi: "आप बोल सकते हैं: 'रमेश पटेल लॉगिन करो', 'टमाटर मंडी भाव बताओ', 'गाड़ी बुक करो', या 'लाइव GPS ट्रैकिंग दिखाओ'।",
        marathi: "तुम्ही बोलू शकता: 'रमेश पटेल लॉगिन करा', 'टोमॅटो बाजारभाव', किंवा 'गाडी बुक करा'.",
        english: "You can say: 'Farmer Login', 'Tomato Mandi Rates', 'Book Transport', or 'Show Live GPS'.",
        phonetic: 'Aap bol sakte hain: Ramesh Patel login karo, Tamatar mandi bhav batao, Gaadi book karo.'
      };
    }

    // FALLBACK
    else {
      executedAction = 'Assistant Response';
      voicePayload = {
        display: `मैंने सुना: "${command}"। कृपया बोलें: "रमेश पटेल लॉगिन करो", "टमाटर मंडी भाव", "गाड़ी बुक करो", या नीचे दिए बटन दबाएं।`,
        hindi: `मैंने सुना: "${command}"। कृपया बोलें: "रमेश पटेल लॉगिन करो", "टमाटर मंडी भाव", "गाड़ी बुक करो", या नीचे दिए बटन दबाएं।`,
        marathi: `मी ऐकले: "${command}". कृपया पुन्हा सांगा किंवा खालील बटण दाबा.`,
        english: `I heard: "${command}". Try saying "Farmer Login", "Mandi Prices", "Book Transport", or choose a quick prompt below.`,
        phonetic: `Maine suna: "${command}". Kripya bolein: Ramesh Patel login karo, Tamatar mandi bhav, ya Gaadi book karo.`
      };
    }

    // Save AI response to chat history
    setLastResponse(voicePayload.display);
    const aiMsg = {
      id: Date.now() + 1,
      sender: 'ai',
      text: voicePayload.display,
      payload: voicePayload,
      action: executedAction,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setHistory(prev => [
      ...prev,
      {
        id: Date.now(),
        sender: 'user',
        text: command,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      aiMsg
    ]);

    // Speak response out loud using the studio HD Audio engine
    speakText(voicePayload);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const q = textInput;
    setTextInput('');
    handleVoiceCommand(q);
  };

  // Quick Action Prompts
  const quickActions = [
    { label: '🌾 Ramesh Patel Login', cmd: 'Ramesh Patel farmer login karo', category: 'Auth' },
    { label: '🏢 FPO Admin Login', cmd: 'Rajesh Kumar FPO admin login karo', category: 'Auth' },
    { label: '🚜 Transporter Login', cmd: 'Suresh Yadav transporter tractor driver login karo', category: 'Auth' },
    { label: '🍅 Tomato Mandi Bhav', cmd: 'Vashi mandi tamatar bhav rate batao', category: 'Farmer' },
    { label: '📦 My Crops Log', cmd: 'Mera tamatar fasal record dikhao', category: 'Farmer' },
    { label: '💰 My Bank Payment', cmd: 'Mera direct bank payment check karo', category: 'Farmer' },
    { label: '🚛 Book Transport Truck', cmd: 'Fasal dispatch ke liye gaadi book karo', category: 'Farmer' },
    { label: '🤖 AI Quality Grading', cmd: 'AI quality grading chalu karo', category: 'FPO' },
    { label: '📦 Master Lot Aggregation', cmd: 'Master lot aggregation dikhao', category: 'FPO' },
    { label: '📊 Warehouse Stock', cmd: 'Warehouse inventory stock report batao', category: 'FPO' },
    { label: '🛰️ Multi-Truck Live GPS', cmd: 'Truck live GPS tracking dispatch map dikhao', category: 'FPO' },
    { label: '📍 Driver GPS Route', cmd: 'Transporter trip destination route batao', category: 'Driver' },
    { label: '🌦️ Weather Forecast', cmd: 'Mausam kaisa rahega weather update batao', category: 'Farmer' }
  ];

  return (
    <>
      {/* Floating Omnipresent Mic Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 pointer-events-auto">
        {!isOpen && (
          <div 
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-primary-200 text-xs text-primary-900 cursor-pointer hover:bg-primary-50 transition-all animate-fade-in group"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-semibold text-primary-800">बोलकर ऐप चलाएं (HD Voice AI)</span>
            <span className="text-gray-400 group-hover:text-primary-600">›</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!isOpen) setIsOpen(true);
              toggleListening();
            }}
            className={`relative p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
              isListening 
                ? 'bg-red-600 text-white ring-4 ring-red-300 scale-110 animate-pulse' 
                : isSpeaking
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 animate-bounce'
                : 'bg-gradient-to-r from-emerald-600 to-primary-700 text-white hover:shadow-primary-500/40 hover:scale-105'
            }`}
            title="Click to talk to CROP2GO AI"
            aria-label="Voice Assistant"
          >
            {isListening && (
              <span className="absolute -inset-2 rounded-full bg-red-500/30 animate-ping"></span>
            )}
            {isSpeaking && (
              <span className="absolute -inset-2 rounded-full bg-emerald-500/30 animate-pulse"></span>
            )}
            
            {isListening ? (
              <FiMicOff className="w-7 h-7 relative z-10" />
            ) : (
              <FiMic className="w-7 h-7 relative z-10" />
            )}

            <span className={`absolute top-1 right-1 w-3 h-3 rounded-full border-2 border-white ${
              isListening ? 'bg-red-500' : isSpeaking ? 'bg-amber-400' : 'bg-emerald-400'
            }`}></span>
          </button>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2.5 bg-gray-900 text-white rounded-full shadow-md hover:bg-gray-800 transition-all text-xs"
            title={isOpen ? "Minimize Voice Assistant" : "Open Voice Assistant"}
          >
            {isOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Voice Copilot Drawer */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-24 sm:right-6 sm:left-auto sm:w-[430px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-800 via-primary-800 to-primary-900 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg border border-white/20">
                🎙️
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-white">किसान साथी AI (Voice Copilot)</h3>
                  <span className="text-[10px] bg-emerald-400 text-emerald-950 font-bold px-1.5 py-0.2 rounded font-mono">
                    HD Studio Voice
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80">
                  {user ? `Active: ${user.name} (${user.role})` : 'Ready to authenticate & navigate'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Test Audio Button */}
              <button
                onClick={testCurrentVoice}
                className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-white/10"
                title="Test Studio Audio Voice"
              >
                <FiPlay className="w-4 h-4" />
              </button>

              {/* Sound Mute/Unmute */}
              <button
                onClick={() => {
                  if (soundEnabled && isSpeaking) stopSpeaking();
                  setSoundEnabled(!soundEnabled);
                  toast(soundEnabled ? 'Voice muted' : 'Voice enabled', { icon: soundEnabled ? '🔇' : '🔊' });
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
                title={soundEnabled ? "Mute Voice" : "Unmute Voice"}
              >
                {soundEnabled ? <FiVolume2 className="w-4 h-4" /> : <FiVolumeX className="w-4 h-4 text-red-300" />}
              </button>

              {/* Close Drawer */}
              <button
                onClick={() => {
                  stopSpeaking();
                  if (isListening && recognitionRef.current) recognitionRef.current.stop();
                  setIsOpen(false);
                }}
                className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Language Selector Bar */}
          <div className="bg-primary-50 px-4 py-2 border-b border-primary-100 flex items-center justify-between text-xs">
            <span className="text-gray-700 font-semibold flex items-center gap-1">
              <span>🌐</span> भाषा (Language):
            </span>
            <div className="flex items-center gap-1">
              {[
                { code: 'hi-IN', label: '🇮🇳 हिन्दी' },
                { code: 'mr-IN', label: '🌾 मराठी' },
                { code: 'en-IN', label: '🌐 English' }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    toast.success(`Voice language set to: ${lang.label}`);
                  }}
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition-all ${
                    selectedLang === lang.code
                      ? 'bg-primary-700 text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Listening / Audio Visualizer Bar */}
          <div className={`px-4 py-3 flex items-center gap-3 transition-colors ${
            isListening ? 'bg-red-50 border-b border-red-200' : isSpeaking ? 'bg-emerald-50 border-b border-emerald-200' : 'bg-gray-50/50 border-b border-gray-100'
          }`}>
            <button
              onClick={toggleListening}
              className={`p-3 rounded-full flex-shrink-0 transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse ring-4 ring-red-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {isListening ? <FiMicOff className="w-5 h-5" /> : <FiMic className="w-5 h-5" />}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-gray-800">
                  {isListening ? (
                    <span className="text-red-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                      बोलिए, सुन रहा हूँ... (Listening...)
                    </span>
                  ) : isSpeaking ? (
                    <span className="text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                      AI बोल रहा है... (Speaking...)
                    </span>
                  ) : (
                    <span className="text-gray-600">माइक दबाकर बोलें या नीचे चुनें:</span>
                  )}
                </span>
                
                {isSpeaking ? (
                  <button 
                    onClick={stopSpeaking}
                    className="text-[11px] text-red-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <FiSquare className="w-3 h-3" /> Stop
                  </button>
                ) : (
                  <button 
                    onClick={testCurrentVoice}
                    className="text-[10px] text-primary-700 hover:underline font-semibold flex items-center gap-1"
                  >
                    <FiPlay className="w-3 h-3" /> Test Voice
                  </button>
                )}
              </div>

              {/* Live Audio Wave Graphic */}
              <div className="flex items-center gap-1 h-4">
                {[12, 24, 16, 28, 10, 20, 26, 14, 22, 18].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isListening
                        ? 'bg-red-500 animate-pulse'
                        : isSpeaking
                        ? 'bg-emerald-600 animate-pulse'
                        : 'bg-gray-300'
                    }`}
                    style={{
                      height: (isListening || isSpeaking) ? `${Math.max(4, (h * ((i % 3) + 1)) % 18)}px` : '4px'
                    }}
                  ></div>
                ))}
                <span className="text-[10px] text-gray-500 font-mono ml-2 truncate">
                  {transcript ? `"${transcript}"` : isListening ? 'Waiting for voice...' : 'HD Studio Voice Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 text-xs bg-white">
            <button
              onClick={() => setActiveTab('quick')}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
                activeTab === 'quick'
                  ? 'border-primary-600 text-primary-800 font-bold bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              ⚡ Quick Commands
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-800 font-bold bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              💬 Conversation ({history.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
                activeTab === 'settings'
                  ? 'border-primary-600 text-primary-800 font-bold bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              ⚙️ Voice Settings
            </button>
            <button
              onClick={() => setActiveTab('help')}
              className={`flex-1 py-2 font-medium border-b-2 text-center transition-all ${
                activeTab === 'help'
                  ? 'border-primary-600 text-primary-800 font-bold bg-primary-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              ❓ Voice Commands
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[290px]">
            {activeTab === 'quick' && (
              <div className="space-y-3">
                <p className="text-[11px] text-gray-500 font-medium">
                  माइक पर बोलें या सीधे टेस्ट करने के लिए नीचे टैप करें:
                </p>

                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleVoiceCommand(action.cmd)}
                      className="p-2.5 text-left rounded-xl border border-gray-200 bg-white hover:bg-emerald-50 hover:border-emerald-400 hover:shadow-xs transition-all group"
                    >
                      <div className="text-[10px] uppercase font-bold text-gray-400 group-hover:text-emerald-700 tracking-wider">
                        {action.category}
                      </div>
                      <div className="text-xs font-semibold text-gray-800 group-hover:text-emerald-900 leading-snug">
                        {action.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-2.5">
                {history.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-primary-700 text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-900 border border-gray-200 rounded-bl-none'
                      }`}
                    >
                      {msg.action && (
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="inline-block text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ⚡ {msg.action}
                          </span>
                          {msg.payload && (
                            <button
                              onClick={() => speakText(msg.payload)}
                              className="text-primary-700 hover:text-primary-900 font-bold text-[10px] flex items-center gap-0.5"
                              title="Replay Voice"
                            >
                              <FiVolume2 className="w-3 h-3" /> Replay
                            </button>
                          )}
                        </div>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 px-1 mt-0.5">{msg.time}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-3.5 text-xs text-gray-700 bg-gray-50 p-3.5 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-primary-900">
                    🔊 High-Definition Voice Engine
                  </h4>
                  <button 
                    onClick={testCurrentVoice}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-xs flex items-center gap-1"
                  >
                    <FiPlay className="w-3 h-3" /> Test Audio Now
                  </button>
                </div>

                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-950 leading-relaxed space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>✨</span> Native Studio-Quality Audio Stream
                  </div>
                  <p className="text-gray-700">
                    यह AI अब विंडोज के रोबोटिक डेविड/ज़ीरा इंजन के बजाय <strong>Native Human Indian Audio Stream (`/api/tts`)</strong> से शुद्ध, स्वाभाविक हिन्दी और मराठी बोलता है।
                  </p>
                </div>

                {/* Speech Rate / Speed */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-gray-600 font-semibold text-[11px]">Speech Speed:</label>
                    <span className="font-mono text-[11px] text-primary-700 font-bold">{speechRate}x</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { rate: 0.85, label: 'Slow (0.85x)' },
                      { rate: 1.0, label: 'Normal (1.0x)' },
                      { rate: 1.15, label: 'Fast (1.15x)' }
                    ].map(r => (
                      <button
                        key={r.rate}
                        onClick={() => {
                          setSpeechRate(r.rate);
                          toast.success(`Speed set to: ${r.label}`);
                        }}
                        className={`p-1.5 rounded-lg border text-[11px] font-medium transition-all ${
                          speechRate === r.rate
                            ? 'bg-primary-600 text-white border-primary-600 font-bold'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-2 text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <h4 className="font-bold text-primary-900 flex items-center gap-1.5">
                  <span>⚡</span> Official Voice Commands & Shortcuts:
                </h4>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">1. Instant Voice Login:</span>
                    <p className="text-gray-600">"Ramesh Patel login karo" या "FPO Admin login karo" या "Tractor Driver login"</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">2. Real-Time Mandi Prices:</span>
                    <p className="text-gray-600">"Vashi mandi me tamatar ka kya bhav hai?"</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">3. Transport & Fleet:</span>
                    <p className="text-gray-600">"Fasal le jaane ke liye gaadi book karo"</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">4. Bank Payment Voucher:</span>
                    <p className="text-gray-600">"Mera payment kitna aaya check karo"</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">5. Multi-Truck Live GPS Tracking:</span>
                    <p className="text-gray-600">"Truck live GPS tracking dikhao"</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-gray-200">
                    <span className="font-bold text-emerald-800">6. AI Quality Grading:</span>
                    <p className="text-gray-600">"AI quality grading camera chalu karo"</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Text Input Fallback Bar */}
          <form onSubmit={handleTextSubmit} className="p-3 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="बोलें या टाइप करें (e.g. Tamatar mandi bhav)..."
              className="flex-1 px-3 py-2 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="p-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl disabled:opacity-40 transition-all shadow-xs"
              title="Send Command"
            >
              <FiSend className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
