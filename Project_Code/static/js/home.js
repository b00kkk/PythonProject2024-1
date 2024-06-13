function showPage(pageId) {
    document.querySelectorAll('.content-page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}


document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("map-container");
    const mapObject = document.getElementById("seoul-map");
    const infoBox = document.getElementById("info-box");
    const regionNameElement = document.getElementById("region-name");
    const regionDescriptionElement = document.getElementById("region-description");
    const closeInfoButton = document.getElementById("close-info");
    const legend = document.getElementById("legend");
    const mainContent = document.getElementById("main-content");
    const trafficChart = document.getElementById("trafficChart").getContext("2d");
    
    let chart;
    let selectedRegion = null;

    const fetchData = (region) => {
        fetch(`/get_data/?region=${region}`)
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    updateChart(data);
                }
            });
    };

    const updateChart = (data) => {
        if (chart) {
            chart.destroy();
        }
        chart = new Chart(trafficChart, {
            type: 'bar',
            data: {
                labels: data.time,
                datasets: [
                {
                    label: '승용차 교통량',
                    data: data.car_traffic,
                    borderColor: 'orange',
                    backgroundColor: 'transparent',
                    type: 'line',
                    fill: false
                },
                {
                    label: '버스 교통량',
                    data: data.bus_traffic,
                    borderColor: 'green',
                    backgroundColor: 'transparent',
                    type: 'line',
                    fill: false
                },
                {
                    label: '트럭 교통량',
                    data: data.truck_traffic,
                    borderColor: 'blue',
                    backgroundColor: 'transparent',
                    type: 'line',
                    fill: false
                },
                {
                    label: '전체 교통량',
                    data: data.total_traffic,
                    backgroundColor: 'skyblue',
                    type: 'bar'
                }
                ]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 1400
                    }
                }
            }
        });
    };

    const trafficData = JSON.parse('{{ traffic_data|escapejs }}');
    const trafficValues = Object.values(trafficData);
    const minTraffic = Math.min(...trafficValues);
    const maxTraffic = Math.max(...trafficValues);

    const getColor = (value) => {
        const normalizedTrafficValue = (value - minTraffic) / (maxTraffic - minTraffic + 6000);
        const colorIntensity = 230 - Math.round(normalizedTrafficValue * 230);
        return `rgb(255,${colorIntensity},${colorIntensity})`;
    };

    const centerCoordinates = {
        "도봉구": { x: 890, y: 250 },
        "동대문구": { x: 960, y: 645 },
        "동작구": { x: 600, y: 970 },
        "은평구": { x: 570, y: 470 },
        "강북구": { x: 835, y: 400 },
        "강동구": { x: 1250, y: 770 },
        "강서구": { x: 200, y: 700 },
        "금천구": { x: 450, y: 1150 },
        "구로구": { x: 300, y: 1000 },
        "관악구": { x: 600, y: 1150 },
        "광진구": { x: 1060, y: 800 },
        "강남구": { x: 970, y: 1050 },
        "종로구": { x: 720, y: 630 },
        "중구": { x: 750, y: 730 },
        "중랑구": { x: 1080, y: 570 },
        "마포구": { x: 480, y: 740 },
        "노원구": { x: 1030, y: 350 },
        "서초구": { x: 810, y: 1070 },
        "서대문구": { x: 580, y: 650 },
        "성북구": { x: 850, y: 560 },
        "성동구": { x: 910, y: 780 },
        "송파구": { x: 1120, y: 970 },
        "양천구": { x: 300, y: 900 },
        "영등포구": { x: 470, y: 920 },
        "용산구": { x: 710, y: 850 }
    };

    mapObject.addEventListener("load", function() {
        const svgDoc = mapObject.contentDocument;
        const regions = svgDoc.querySelectorAll(".region");

        regions.forEach(function(region) {
            const centroid = centerCoordinates[region.id];

            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("class", "region-text");
            text.setAttribute("x", centroid.x);
            text.setAttribute("y", centroid.y);
            text.setAttribute("dominant-baseline", "middle");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("font-size", "20px");
            text.setAttribute("font-weight", "bold");
            text.textContent = region.id.replace('-', ' ');
            svgDoc.documentElement.appendChild(text);

            const trafficValue = trafficData[region.id] || 0;
            region.style.fill = getColor(trafficValue);
            
            text.addEventListener("mouseenter", function() {
                if (region !== selectedRegion) {
                    region.style.fill = "#660000";
                    region.style.filter = "drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.8))";
                    text.setAttribute("fill", "white");
                }
            });

            text.addEventListener("mouseleave", function() {
                if (region !== selectedRegion) {
                    region.style.fill = getColor(trafficValue);
                    region.style.filter = "none";
                    text.setAttribute("fill", "black");
                }
            });

            region.addEventListener("mouseenter", function() {
                if (region !== selectedRegion) {
                    region.style.fill = "#660000";
                    region.style.filter = "drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.8))";
                    region.style.cursor = "pointer";
                    text.setAttribute("fill", "white");
                    text.setAttribute("cursor", "pointer");
                }
            });

            region.addEventListener("mouseleave", function() {
                if (region !== selectedRegion) {
                    region.style.fill = getColor(trafficValue);
                    region.style.filter = "none";
                    text.setAttribute("fill", "black");
                }
            });

            region.addEventListener("click", function() {
                if (selectedRegion) {
                    selectedRegion.style.fill = getColor(trafficData[selectedRegion.id] || 0);
                    selectedRegion.style.filter = "none";
                    const selectedText = mapObject.contentDocument.querySelector(`text[x="${centerCoordinates[selectedRegion.id].x}"][y="${centerCoordinates[selectedRegion.id].y}"]`);
                    selectedText.setAttribute("fill", "black");
                }
                selectedRegion = region;
                selectedRegion.style.fill = "#660000";
                selectedRegion.style.filter = "drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.8))";
                const regionId = region.id.replace('-', '');
                mainContent.style.transform = "translateX(-24%)";
                mapContainer.style.transform = "translateX(-180px)";
                infoBox.classList.add("active");
                legend.classList.add("active");
                text.setAttribute('fill', 'white');
                regionNameElement.textContent = regionId;
                fetchData(regionId);
            });
        });


        // 범례 추가
        const steps = 6;
        const stepSize = (maxTraffic - minTraffic) / steps;
        const legendTitle = document.createElement('b');
        legendTitle.append("교통량");
        legend.append(legendTitle);
        // 색상 범례
        const legendColors = document.createElement('div');
        legendColors.classList.add('legend-scale');
        for (let i = 0; i <= steps; i++) {
            const value = minTraffic + (i * stepSize);
            const color = getColor(value);
            const colorBox = document.createElement('span');
            colorBox.classList.add('color-box');
            colorBox.style.background = color;
            legendColors.appendChild(colorBox);
        }
        legend.appendChild(legendColors);

        // 값 범례
        const legendValues = document.createElement('div');
        legendValues.classList.add('legend-value');
        for (let i = 0; i <= steps; i++) {
            const value = minTraffic + (i * stepSize);
            const valueLabel = document.createElement('span');
            valueLabel.classList.add('legend-label');
            valueLabel.textContent = Math.round(value);
            legendValues.appendChild(valueLabel);
        }
        legend.appendChild(legendValues);
    });

    closeInfoButton.addEventListener("click", function() {
        if (selectedRegion) {
            selectedRegion.style.fill = getColor(trafficData[selectedRegion.id] || 0);
            selectedRegion.style.filter = "none";
            const selectedText = mapObject.contentDocument.querySelector(`text[x="${centerCoordinates[selectedRegion.id].x}"][y="${centerCoordinates[selectedRegion.id].y}"]`);
            selectedText.setAttribute("fill", "black");
            selectedRegion = null;
        }
        infoBox.classList.remove("active");
        mainContent.style.transform = "translateX(0)";
        mapContainer.style.transform = "translateX(0)";
        legend.classList.remove("active");
    });
});