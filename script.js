const API_KEY = "AIzaSyCo5NvQZpziJdaCsOjf1H2Rq-1YeiU9Uq8"; // Replace if needed
let interval, countdown;
let dataPoints = [];

function startTracking() {
    clearInterval(interval);
    clearInterval(countdown);
    dataPoints = [];

    const videoId = document.getElementById('videoId').value;
    const targetViews = parseInt(document.getElementById('targetViews').value);
    const targetMinutes = parseInt(document.getElementById('targetTime').value);

    const endTime = Date.now() + targetMinutes * 60000;
    const chart = initChart();

    document.getElementById("loadingSpinner").style.display = "inline-block";

    interval = setInterval(async () => {
        const viewCount = await fetchViewCount(videoId);
        const timestamp = new Date().toLocaleTimeString();
        dataPoints.push({ time: timestamp, views: viewCount });

        updateStats(viewCount, targetViews, endTime);
        updateChart(chart);
    }, 60000);

    countdown = setInterval(() => {
        const timeLeft = Math.max(0, endTime - Date.now());
        const min = Math.floor(timeLeft / 60000);
        const sec = Math.floor((timeLeft % 60000) / 1000);
        document.getElementById("timeLeft").textContent = `${min}:${sec.toString().padStart(2, '0')}`;
    }, 1000);
}

async function fetchViewCount(videoId) {
    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${API_KEY}`);
        const data = await res.json();
        document.getElementById("loadingSpinner").style.display = "none";
        return parseInt(data.items[0].statistics.viewCount);
    } catch (err) {
        console.error("Failed to fetch views:", err);
        return 0;
    }
}

function updateStats(currentViews, targetViews, endTime) {
    const now = Date.now();
    const timeLeftMin = Math.max(0, (endTime - now) / 60000);

    const views5 = calcViewChange(5);
    const views15 = calcViewChange(15);
    const views20 = calcViewChange(20);
    const views25 = calcViewChange(25);
    const views30 = calcViewChange(30);
    const avg15 = views15 / 15 || 0;
    const viewsRequired = targetViews - currentViews;
    const viewsPerMinRequired = viewsRequired / timeLeftMin;
    const projectedViews = currentViews + avg15 * timeLeftMin;
    const forecast = projectedViews >= targetViews ? "Yes" : "No";

    document.getElementById("liveViews").textContent = currentViews.toLocaleString();
    document.getElementById("views5").textContent = views5.toLocaleString();
    document.getElementById("views15").textContent = views15 > 0 ? views15.toLocaleString() : "Collecting data...";
    document.getElementById("views20").textContent = views20 > 0 ? views20.toLocaleString() : "Collecting data...";
    document.getElementById("views25").textContent = views25 > 0 ? views25.toLocaleString() : "Collecting data...";
    document.getElementById("views30").textContent = views30 > 0 ? views30.toLocaleString() : "Collecting data...";
    document.getElementById("avgViews15").textContent = avg15.toFixed(2);
    document.getElementById("viewsPerMin").textContent = viewsPerMinRequired.toFixed(2);
    document.getElementById("viewsRequired5").textContent = Math.ceil(viewsPerMinRequired * 5).toLocaleString();
    document.getElementById("projectedViews").textContent = Math.ceil(projectedViews).toLocaleString();
    document.getElementById("forecast").textContent = forecast;

    const viewsLeftElem = document.getElementById("viewsLeft");
    viewsLeftElem.textContent = viewsRequired.toLocaleString();
    viewsLeftElem.className = "views-left " + (forecast === "Yes" ? "green" : "red");
}

function calcViewChange(minutesAgo) {
    const nowIndex = dataPoints.length - 1;
    const pastIndex = nowIndex - minutesAgo;
    if (pastIndex >= 0) {
        return dataPoints[nowIndex].views - dataPoints[pastIndex].views;
    }
    return 0;
}

function initChart() {
    const ctx = document.getElementById("viewChart").getContext("2d");
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Live Views',
                data: [],
                borderColor: 'blue',
                backgroundColor: 'blue',
                fill: false,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            animation: false,
            scales: {
                x: { title: { display: true, text: 'Time' } },
                y: { title: { display: true, text: 'Views' } }
            }
        }
    });
}

function updateChart(chart) {
    chart.data.labels = dataPoints.map(p => p.time);
    chart.data.datasets[0].data = dataPoints.map(p => p.views);
    chart.update();
}
