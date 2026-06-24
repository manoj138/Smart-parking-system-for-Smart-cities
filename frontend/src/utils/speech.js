/**
 * Web Speech API Text-to-Speech Helper
 * 
 * Synthesizes and voices text prompts dynamically using the browser-native speech engine.
 */
export const speakText = (text) => {
  if ('speechSynthesis' in window) {
    try {
      // Check if voice is enabled (default is true)
      const isEnabled = localStorage.getItem('smart_parking_voice_enabled') !== 'false';
      if (!isEnabled) return;

      // Cancel any ongoing announcements to avoid stuttering/overlaps
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95; // Slightly slower for clear, professional pacing
      utterance.pitch = 1.0;  // Natural tone pitch
      utterance.volume = 1.0;  // Full volume

      const voiceGender = localStorage.getItem('smart_parking_voice_gender') || 'female';
      const voices = window.speechSynthesis.getVoices();
      
      // Filter English voices
      const englishVoices = voices.filter(voice => voice.lang.startsWith('en'));
      
      let chosenVoice = null;
      
      if (voiceGender === 'female') {
        // Try female English voices
        chosenVoice = englishVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('zira') || name.includes('hazel') || name.includes('sabina') || (name.includes('google') && !name.includes('male'));
        });
      } else if (voiceGender === 'male') {
        // Try male English voices
        chosenVoice = englishVoices.find(v => {
          const name = v.name.toLowerCase();
          return name.includes('david') || name.includes('male') || name.includes('george') || name.includes('ravi');
        });
      }
      
      // Fallback: Selected English Google voice, or general English voice, or default system voice
      if (!chosenVoice) {
        chosenVoice = englishVoices.find(v => v.name.includes('Google')) || englishVoices[0];
      }

      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  }
};
