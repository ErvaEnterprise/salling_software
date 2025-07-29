function updateLang() {
  if (recognition) {
    recognition.lang = document.getElementById("langSelect").value;
  }
}

let recognition;

function startVoice() {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = document.getElementById("langSelect").value;
  recognition.start();

  recognition.onresult = function (event) {
    const speech = event.results[0][0].transcript;
    document.getElementById("voiceOutput").innerText = "You said: " + speech;

    // Send to backend for NLP parsing
    fetch("/parse-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: speech }),
    })
      .then(res => res.json())
      .then(data => {
        document.getElementById("product").value = data.product;
        document.getElementById("quantity").value = data.quantity;
        document.getElementById("buyer").value = data.person;
        document.getElementById("total").value = data.total;
      });
  };
}
