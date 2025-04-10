const API_KEY = 'AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8';
let intervalId, chart, history = [];

function startTracking() {
  clearInterval(intervalId);
  history = [];

  const videoId = document.getElementById('videoId').value;
  const targetViews = parseInt(document.getElementById('targetViews').value);
  const targetTimeMins = parseInt(document.getElementById('targetTime').value);
  const statsDiv = document.getElementById('stats');

  const endTime = new Date(new Date().getTime() + targetTimeMins * 60000);
  const loading = document.getElementById('loading');
  loading.style.display = 'block';
  statsDiv.innerHTML = '';

  if (!chart) {
    const ctx = document.getElementById('viewChart').getContext('2d');
    chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Live Views',
          data: [],
          borderColor: 'blue',
          backgroundColor: 'blue',
          fill: false,
          pointRadius: 4,
          tension: 0.3
        }]
      },
      options: {
        scales: {
          x: { display: true },
          y: {
            beginAtZero: false,
            ticks: {
              callback: value => value.toLocaleString()
            }
          }
        }
      }
    });
  } else {
    chart.data.labels = [];
    chart.data.datasets[0].data = [];
    chart.update();
  }

  const update = async () => {
    const now = new Date();
    const minsLeft = Math.max(0, Math.round((endTime - now) / 60000));
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`);
    const data = await response.json();
    const liveViews = parseInt(data.items[0].statistics.viewCount);

    const timestamp = now.toLocaleTimeString();
    history.push({ time: now, views: liveViews });
    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(liveViews);
    chart.update();

    // Get view deltas
    const getViewsInLast = mins => {
      const from = new Date(now - mins * 60000);
      const filtered = history.filter(h => h.time >= from);
      if (filtered.length < 2) return '-';
      return filtered[filtered.length - 1].views - filtered[0].views;
    };

    const last5 = getViewsInLast(5);
    const last15 = getViewsInLast(15);
    const last20 = getViewsInLast(20);
    const last25 = getViewsInLast(25);
    const last30 = getViewsInLast(30);
    const avg15 = last15 !== '-' ? (last15 / 15).toFixed(2) : '-';

    const viewsLeft = targetViews - liveViews;
    const requiredPerMin = (viewsLeft / Math.max(1, (endTime - now) / 60000)).toFixed(2);
    const projectedViews = last15 !== '-' ? Math.round(liveViews + (avg15 * minsLeft)) : liveViews;
    const forecast = projectedViews >= targetViews ? 'Yes' : 'No';
    const colorClass = forecast === 'Yes' ? 'green' : 'red';

    const viewsToMeet = targetViews - liveViews;
    const viewsToMeetColor = avg15 !== '-' && avg15 * minsLeft >= viewsToMeet ? 'green' : 'red';

    loading.style.display = 'none';

    statsDiv.innerHTML = `
      Live View Count: ${liveViews.toLocaleString()}<br>
      Last 5 min Views: ${last5 === '-' ? 'Collecting data...' : last5.toLocaleString()}<br>
      Last 15 min Views: ${last15 === '-' ? 'Collecting data...' : last15.toLocaleString()}<br>
      Last 20 min Views: ${last20 === '-' ? 'Collecting data...' : last20.toLocaleString()}<br>
      Last 25 min Views: ${last25 === '-' ? 'Collecting data...' : last25.toLocaleString()}<br>
      Last 30 min Views: ${last30 === '-' ? 'Collecting data...' : last30.toLocaleString()}<br>
      Avg Views/Min (Last 15 min): ${avg15}<br>
      Views/min Required: ${requiredPerMin}<br>
      Views Required in next 5 min: ${Math.ceil(requiredPerMin * 5).toLocaleString()}<br>
      Projected Views: ${projectedViews.toLocaleString()}<br>
      Forecast: ${forecast}<br>
      Time Left: ${minsLeft}:${String(59 - now.getSeconds()).padStart(2, '0')}<br>
      Views Left to Meet Target: <span class="${viewsToMeetColor}">${viewsToMeet.toLocaleString()}</span>
    `;
  };

  update();
  intervalId = setInterval(update, 60000);
}
