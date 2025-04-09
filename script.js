const apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

let viewHistory = [];
let chart;
let interval;
let startTime, targetTime, targetViews;

function startTracking() {
  const videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  const time = parseInt(document.getElementById("targetTime").value);
  targetTime = Date.now() + time * 60000;
  startTime = Date.now();
  viewHistory = [];

  if (interval) clearInterval(interval);
  fetchAndUpdate(videoId);
  interval = setInterval(() => fetchAndUpdate(videoId), 60000); // every minute
}

async function fetchAndUpdate(videoId) {
  try {
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`);
    const data = await res.json();
    const viewCount = parseInt(data.items[0].statistics.viewCount);
    const timestamp = Date.now();

    viewHistory.push({ timestamp, viewCount });

    updateStats(viewCount);
    updateChart();
  } catch (e) {
    console.error("API error:", e);
  }
}

function updateStats(currentViews) {
  document.getElementById("liveViews").textContent = currentViews;

  const len = viewHistory.length;
  const now = Date.now();

  let last1min = 0;
  let last5min = 0;

  for (let i = len - 1; i >= 0; i--) {
    const delta = now - viewHistory[i].timestamp;
    const diff = currentViews - viewHistory[i].viewCount;
    if (delta <= 60000) last1min = diff;
    if (delta <= 300000) last5min = diff;
  }

  const minutesLeft = (targetTime - now) / 60000;
  const requiredPerMin = (targetViews - currentViews) / minutesLeft;
  const requiredIn5min = Math.ceil(requiredPerMin * 5);
  const elapsedMin = (now - startTime) / 60000;
  const avgRate = (currentViews - viewHistory[0].viewCount) / elapsedMin;
  const projected = Math.round(currentViews + avgRate * minutesLeft);

  document.getElementById("last1min").textContent = last1min;
  document.getElementById("last5min").textContent = last5min;
  document.getElementById("requiredRate").textContent = requiredPerMin.toFixed(2);
  document.getElementById("requiredIn5").textContent = requiredIn5min;
  document.getElementById("projected").textContent = projected;

  const forecast = projected >= targetViews ? "Yes" : "No";
  document.getElementById("forecast").textContent = forecast;
}

function updateChart() {
  const labels = viewHistory.map(e => {
    const d = new Date(e.timestamp);
    return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  const data = viewHistory.map(e => e.viewCount);

  if (chart) {
    chart.data.labels = labels;
    chart.data.datasets[0].data = data;
    chart.update();
  } else {
    const ctx = document.getElementById("viewChart").getContext("2d");
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "Live Views",
          data,
          fill: false,
          borderColor: "blue",
          tension: 0.2
        }]
      },
      options: {
        responsive: true,
        scales: {
          x: { title: { display: true, text: "Time" }},
          y: { title: { display: true, text: "Views" }}
        }
      }
    });
  }
}
