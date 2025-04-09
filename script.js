let intervalId;
let viewHistory = [];

function startTracking() {
  const videoId = document.getElementById("videoId").value;
  const targetViews = parseInt(document.getElementById("targetViews").value);
  const targetMinutes = parseInt(document.getElementById("targetTime").value);
  const endTime = Date.now() + targetMinutes * 60 * 1000;

  viewHistory = [];
  clearInterval(intervalId);
  fetchViewCount();

  intervalId = setInterval(() => {
    fetchViewCount(videoId, targetViews, endTime);
  }, 5000);
}

async function fetchViewCount(videoId, targetViews, endTime) {
  const apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8"; // 🔐 Replace with your YouTube Data API key
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (!data.items.length) return;

  const viewCount = parseInt(data.items[0].statistics.viewCount);
  document.getElementById("liveCount").textContent = viewCount;

  const now = Date.now();
  viewHistory.push({ time: now, count: viewCount });
  viewHistory = viewHistory.filter(v => now - v.time <= 5 * 60 * 1000);

  const view1Min = viewHistory.findLast(e => e.time <= now - 60 * 1000);
  const view5Min = viewHistory.findLast(e => e.time <= now - 5 * 60 * 1000);

  const views1Min = view1Min ? viewCount - view1Min.count : 0;
  const views5Min = view5Min ? viewCount - view5Min.count : 0;

  document.getElementById("views1min").textContent = views1Min;
  document.getElementById("views5min").textContent = views5Min;

  const minsLeft = (endTime - now) / (60 * 1000);
  const viewsLeft = targetViews - viewCount;
  const viewsPerMin = viewsLeft / minsLeft;
  const viewsNext5Min = viewsPerMin * 5;

  document.getElementById("viewsPerMin").textContent = viewsPerMin.toFixed(2);
  document.getElementById("viewsIn5min").textContent = Math.ceil(viewsNext5Min);
}
