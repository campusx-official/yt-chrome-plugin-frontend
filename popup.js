document.getElementById("sendRequest").addEventListener("click", async () => {
    const randomText = ["This is awesome!", "Not good at all!"][Math.floor(Math.random() * 2)];
  
    try {
      const response = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ comments: [randomText] })
      });
      
      const result = await response.json();
      console.log("API Response:", result);  // Log API response to console
      document.getElementById("response").innerText = JSON.stringify(result);
    } catch (error) {
      console.error("Error:", error);  // Log errors to console
    }
  });
  