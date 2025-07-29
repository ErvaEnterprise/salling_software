function startVoiceLogin() {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = 'en-IN';
  recognition.start();

  recognition.onresult = function(event) {
    const text = event.results[0][0].transcript.toLowerCase();
    console.log('Heard:', text);

    // Example format: "email ravi@gmail.com password 1234"
    if (text.includes('email') && text.includes('password')) {
      const email = text.match(/email (.+?) password/)[1]?.trim();
      const password = text.match(/password (.+)/)[1]?.trim();

      document.getElementById('email').value = email;
      document.getElementById('password').value = password;
      
      setTimeout(() => document.forms[0].submit(), 1000);
    } else {
      alert('Please say: "Email your@email.com password yourpassword"');
    }
  };
}
