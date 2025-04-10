let chart;
let chartData = [];
let chartLabels = [];
let tracking = false;
let interval;
let startTime;
let targetMinutes = 0;
let videoId = "";
let targetViews = 0;
let apiKey = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8";

function startTracking() {
  clearInterval(interval);
  tracking = true;
  videoId = document.getElementById("videoId").value;
  targetViews = parseInt(document.getElementById("targetViews").value);
  targetMinutes = parseInt(document.getElementById("targetTime").value);
  startTime = new Date();

  if (!chart) {
    initChart();
  }

  updateStats();
  interval = setInterval(updateStats, 60000); // every 1 minute
}

function initChart() {
  const ctx = document.getElementById("viewChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [{
        label: "Live Views",
        data: chartData,
        fill: false,
        borderColor: "blue",
        backgroundColor: "blue",
        tension: 0.3,
        pointRadius: 4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

function updateStats() {
  fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${apiKey}`)
    .then(res => res.json())
    .then(data => {
      const viewCount = parseInt(data.items[0].statistics.viewCount);
      const currentTime = new Date();
      const minutesPassed = Math.floor((currentTime - startTime) / 60000);
      const timeLeft = Math.max(0, targetMinutes - minutesPassed);

      chartLabels.push(currentTime.toLocaleTimeString());
      chartData.push(viewCount);
      chart.update();

      // View calculation
      const recentViews = chartData.length >= 6 ? viewCount - chartData[chartData.length - 6] : 0;
      const viewsPerMin = recentViews / 5;
      const requiredRate = (targetViews - viewCount) / timeLeft;
      const requiredNext5 = requiredRate * 5;
      const projectedViews = Math.floor(viewCount + (viewsPerMin * timeLeft));
      const forecast = projectedViews >= targetViews ? "Yes" : "No";
      const viewsLeft = Math.max(0, targetViews - viewCount);

      document.getElementById("liveViews").innerText = viewCount.toLocaleString();
      document.getElementById("last5Min").innerText = recentViews.toLocaleString();
      document.getElementById("requiredRate").innerText = requiredRate.toFixed(2);
      document.getElementById("requiredNext5").innerText = Math.round(requiredNext5).toLocaleString();
      document.getElementById("projectedViews").innerText = projectedViews.toLocaleString();
      document.getElementById("forecast").innerText = forecast;
      document.getElementById("timeLeft").innerText = `${timeLeft}:${(60 - currentTime.getSeconds()).toString().padStart(2, "0")}`;
      const viewsLeftEl = document.getElementById("viewsLeft");
      viewsLeftEl.innerText = viewsLeft.toLocaleString();

      // Apply color
      viewsLeftEl.classList.remove("green", "red", "neutral");
      viewsLeftEl.classList.add(forecast === "Yes" ? "green" : "red");
    })
    .catch(error => {
      console.error("Error fetching YouTube data:", error);
    });
}
