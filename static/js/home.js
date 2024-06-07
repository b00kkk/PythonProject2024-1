
document.addEventListener("DOMContentLoaded", function() {
    const mapContainer = document.getElementById("map-container");
    const mapObject = document.getElementById("seoul-map");
    const infoBox = document.getElementById("info-box");
    const regionNameElement = document.getElementById("region-name");
    const regionDescriptionElement = document.getElementById("region-description");
    const closeInfoButton = document.getElementById("close-info");
    const legend = document.getElementById("legend");
    const mainContent = document.getElementById("main-content");

    const trafficData = JSON.parse('{{ traffic_data|escapejs }}');

    const regionDescriptions = {
        "도봉구": "Description for Dobong-gu",
        "동대문구": "Description for Dongdaemun-gu",
        "동작구": "Description for Dongjak-gu",
        "은평구": "Description for Eunpyeong-gu",
        "강북구": "Description for Gangbuk-gu",
        "강동구": "Description for Gangdong-gu",
        "강서구": "Description for Gangseo-gu",
        "금천구": "Description for Geumcheon-gu",
        "구로구": "Description for Guro-gu",
        "관악구": "Description for Gwanak-gu",
        "광진구": "Description for Gwangjin-gu",
        "강남구": "Description for Gangnam-gu",
        "종로구": "Description for Jongno-gu",
        "중구": "Description for Jung-gu",
        "중랑구": "Description for Jungnang-gu",
        "마포구": "Description for Mapo-gu",
        "노원구": "Description for Nowon-gu",
        "서초구": "Description for Seocho-gu",
        "서대문구": "Description for Seodaemun-gu",
        "성북구": "Description for Seongbuk-gu",
        "성동구": "Description for Seongdong-gu",
        "송파구": "Description for Songpa-gu",
        "양천구": "Description for Yangcheon-gu",
        "영등포구": "Description for Yeongdeungpo-gu",
        "용산구": "Description for Yongsan-gu"
    };

    // 최소값과 최대값 계산
    const trafficValues = Object.values(trafficData);
    const minTraffic = Math.min(...trafficValues);
    const maxTraffic = Math.max(...trafficValues);

    // 색상 범위 설정
    const getColor = (value) => {
        const normalizedTrafficValue = (value - minTraffic) / (maxTraffic - minTraffic + 6000);
        const colorIntensity = 230 - Math.round(normalizedTrafficValue * 230); // 최소값 230 설정
        return `rgb(255,${colorIntensity},${colorIntensity})`;
    };

    // 수동으로 중심 좌표를 지정한 객체
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
                region.style.fill = "#660000";
                region.style.filter = "drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.8))";
                text.setAttribute("fill", "white");
            });

            text.addEventListener("mouseleave", function() {
                region.style.fill = getColor(trafficValue);
                region.style.filter = "none";
                text.setAttribute("fill", "black");
            });


            region.addEventListener("mouseenter", function() {
                region.style.fill = "#660000";
                region.style.filter = "drop-shadow(5px 5px 5px rgba(0, 0, 0, 0.8))";
                region.style.cursor = "pointer";
                text.setAttribute("fill", "white");
                text.setAttribute("cursor", "pointer");
            });

            region.addEventListener("mouseleave", function() {
                region.style.fill = getColor(trafficValue);
                region.style.filter = "none";
                text.setAttribute("fill", "black");
            });

            region.addEventListener("click", function() {
                mainContent.style.transform = "translateX(-24%)";
                mapContainer.style.transform = "translateX(-180px)";
                infoBox.classList.add("active");
                legend.classList.add("active");
                regionNameElement.textContent = region.id.replace('-', ' ');
                regionDescriptionElement.textContent = `교통량: ${trafficValue}`;
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
        infoBox.classList.remove("active");
        mainContent.style.transform = "translateX(0)";
        mapContainer.style.transform = "translateX(0)";
        legend.classList.remove("active");
    });
});