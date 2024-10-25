document.addEventListener("DOMContentLoaded", async () => {
    const outputDiv = document.getElementById("output");
    const API_KEY = 'AIzaSyAHxO8ZCKPLODbhgSQcDV49Bv8cgkOA8Z4';
    const API_URL = 'http://localhost:5000/predict'; // Your API endpoint
  
    // Get the current tab's URL
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const url = tabs[0].url;
      const youtubeRegex = /^https:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/;
      const match = url.match(youtubeRegex);
  
      if (match && match[1]) {
        const videoId = match[1];
        outputDiv.innerHTML = `<div class="section-title">YouTube Video ID</div><p>${videoId}</p><p>Fetching comments...</p>`;
  
        const comments = await fetchComments(videoId);
        if (comments.length === 0) {
          outputDiv.innerHTML += "<p>No comments found for this video.</p>";
          return;
        }
  
        outputDiv.innerHTML += `<p>Fetched ${comments.length} comments. Sending for sentiment analysis...</p>`;
        const predictions = await getSentimentPredictions(comments);
  
        if (predictions) {
          const sentimentCounts = { "1": 0, "0": 0, "-1": 0 };
          predictions.forEach(prediction => sentimentCounts[prediction]++);
          const total = predictions.length;
  
          const positivePercent = ((sentimentCounts["1"] / total) * 100).toFixed(2);
          const neutralPercent = ((sentimentCounts["0"] / total) * 100).toFixed(2);
          const negativePercent = ((sentimentCounts["-1"] / total) * 100).toFixed(2);
  
          outputDiv.innerHTML += `
            <div class="section">
              <div class="section-title">Sentiment Analysis Results</div>
              <div class="sentiment-boxes">
                <div class="sentiment-box">
                  <div class="label">Positive</div>
                  <div class="percentage">${positivePercent}%</div>
                </div>
                <div class="sentiment-box">
                  <div class="label">Neutral</div>
                  <div class="percentage">${neutralPercent}%</div>
                </div>
                <div class="sentiment-box">
                  <div class="label">Negative</div>
                  <div class="percentage">${negativePercent}%</div>
                </div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Top 25 Comments with Sentiments</div>
              <ul class="comment-list">
                ${comments.slice(0, 25).map((comment, index) => `
                  <li class="comment-item">
                    <span>${index + 1}. ${comment}</span><br>
                    <span class="comment-sentiment">Sentiment: ${predictions[index]}</span>
                  </li>`).join('')}
              </ul>
            </div>`;
        }
      } else {
        outputDiv.innerHTML = "<p>This is not a valid YouTube URL.</p>";
      }
    });
  
    async function fetchComments(videoId) {
      let comments = [];
      let pageToken = "";
      try {
        while (comments.length < 500) {
          const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&pageToken=${pageToken}&key=${API_KEY}`);
          const data = await response.json();
          data.items.forEach(item => comments.push(item.snippet.topLevelComment.snippet.textOriginal));
          pageToken = data.nextPageToken;
          if (!pageToken) break;
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      }
      return comments;
    }
  
    async function getSentimentPredictions(comments) {
      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ comments })
        });
        const result = await response.json();
        return result.map(item => item.sentiment);
      } catch (error) {
        console.error("Error fetching predictions:", error);
        outputDiv.innerHTML += "<p>Error fetching sentiment predictions.</p>";
        return null;
      }
    }
  });
