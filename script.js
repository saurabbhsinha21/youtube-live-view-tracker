let viewHistory = [];
let chart;
let interval;

const apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8"; // Replace with your actual key

function startTracking() {
  const videoId = document.getElementById("videoId").value;
  if (interval) clearInterval(interval);
  initChart();
  interval = setInterval(() => fetchViews(videoId), 60000); // every minute
  fetchViews(videoId); // initial fetch
}

function fetchViews(videoId) {
  const apiURL = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`;
  fetch(apiURL)
    .then(res => res.json())
    .then(data => {
      const liveViewCount = parseInt(data.items[0].statistics.viewCount);
      const now = Date.now();

      viewHistory.push({ time: now, views: liveViewCount });
      if (viewHistory.length > 1000) viewHistory.shift();

      updateStats(liveViewCount);
      updateChart();
    })
    .catch(err => console.error("YouTube API Error:", err));
}

function updateStats(currentViews) {
  document.getElementById("liveViewCount").innerText = currentViews;

  const views1min = getViewsInTimeRange(1);
  const views5min = getViewsInTimeRange(5);

  document.getElementById("last1min").innerText = views1min;
  document.getElementById("last5min").innerText = views5min;

  const targetViews = parseInt(document.getElementById("targetViews").value);
  const targetTime = parseInt(document.getElementById("targetTime").value);
  const viewsRemaining = targetViews - currentViews;
  const rateRequired = viewsRemaining / targetTime;
  const requiredIn5 = rateRequired * 5;

  document.getElementById("requiredRate").innerText = rateRequired.toFixed(2);
  document.getElementById("requiredIn5").innerText = Math.ceil(requiredIn5);

  calculateForecast(currentViews, targetViews, targetTime);
}

function getViewsInTimeRange(minutes) {
  const cutoff = Date.now() - minutes * 60000;
  const recent = viewHistory.filter(v => v.time >= cutoff);
  if (recent.length < 2) return 0;
  return recent[recent.length - 1].views - recent[0].views;
}

function calculateForecast(currentViews, targetViews, targetTime) {
  if (viewHistory.length < 2) {
    document.getElementById("forecastResult").innerText = "Not enough data";
    return;
  }

  const first = viewHistory[0];
  const last = viewHistory[viewHistory.length - 1];
  const totalTimeMinutes = (last.time - first.time) / 60000;
  const totalViews = last.views - first.views;
  const rate = totalViews / totalTimeMinutes;
  const projectedViews = currentViews + (rate * targetTime);

  document.getElementById("projectedViews").innerText = Math.floor(projectedViews);
  document.getElementById("forecastResult").innerText = projectedViews >= targetViews ? "Yes" : "No";
}

// Chart.js setup
function initChart() {
  const ctx = document.getElementById("viewChart").getContext("2d");
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Live Views',
        data: [],
        fill: false,
        borderColor: 'blue',
        tension: 0.2
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: 'time',
          time: { unit: 'minute' },
          title: { display: true, text: 'Time' }
        },
        y: {
          beginAtZero: false,
          title: { display: true, text: 'Views' }
        }
      }
    }
  });
}

function updateChart() {
  if (!chart) return;
  const labels = viewHistory.map(v => new Date(v.time));
  const data = viewHistory.map(v => v.views);
  chart.data.labels = labels;
  chart.data.datasets[0].data = data;
  chart.update();
}
