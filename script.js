const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const loading = document.getElementById('loading');
const errorMsg = document.getElementById('error-msg');
const weatherContent = document.getElementById('weather-content');

const cityName = document.getElementById('city-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const currentTemp = document.getElementById('current-temp');
const weatherDesc = document.getElementById('weather-desc');
const windSpeed = document.getElementById('wind-speed');
const humidity = document.getElementById('humidity');
const apparentTemp = document.getElementById('apparent-temp');
const forecastCards = document.getElementById('forecast-cards');

// WMO коды погоды
function getWeatherMeta(code) {
  if (code === 0) return { desc: 'Ясно', icon: '☀️' };
  if (code === 1 || code === 2) return { desc: 'Преимущественно ясно', icon: '🌤️' };
  if (code === 3) return { desc: 'Пасмурно', icon: '☁️' };
  if ([45, 48].includes(code)) return { desc: 'Туман', icon: '🌫️' };
  if ([51, 53, 55].includes(code)) return { desc: 'Морось', icon: '🌦️' };
  if ([61, 63, 65].includes(code)) return { desc: 'Дождь', icon: '🌧️' };
  if ([71, 73, 75].includes(code)) return { desc: 'Снегопад', icon: '❄️' };
  if ([80, 81, 82].includes(code)) return { desc: 'Ливень', icon: '⛈️' };
  if ([95, 96, 99].includes(code)) return { desc: 'Гроза', icon: '⚡' };
  return { desc: 'Переменная облачность', icon: '⛅' };
}

async function fetchWeather(city) {
  loading.classList.remove('hidden');
  errorMsg.classList.add('hidden');
  weatherContent.classList.add('hidden');

  try {
    // 1. Поиск координат по названию города (Geocoding API от Open-Meteo)
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=ru&format=json`);
    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error('City not found');
    }

    const loc = geoData.results[0];
    const lat = loc.latitude;
    const lon = loc.longitude;
    const displayName = `${loc.name}, ${loc.country || ''}`;

    // 2. Получение погоды
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`
    );
    const data = await weatherRes.json();

    displayData(displayName, data);
  } catch (err) {
    errorMsg.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

function displayData(city, data) {
  const current = data.current;
  const meta = getWeatherMeta(current.weather_code);

  cityName.innerText = city;
  currentDate.innerText = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  weatherIcon.innerText = meta.icon;
  currentTemp.innerText = Math.round(current.temperature_2m);
  weatherDesc.innerText = meta.desc;
  windSpeed.innerText = `${Math.round(current.wind_speed_10m)} км/ч`;
  humidity.innerText = `${current.relative_humidity_2m}%`;
  apparentTemp.innerText = `${Math.round(current.apparent_temperature)}°C`;

  // Прогноз на 5 дней
  const daily = data.daily;
  let html = '';
  for (let i = 1; i <= 5; i++) {
    const dayDate = new Date(daily.time[i]);
    const dayName = dayDate.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dayMeta = getWeatherMeta(daily.weather_code[i]);
    const minTemp = Math.round(daily.temperature_2m_min[i]);
    const maxTemp = Math.round(daily.temperature_2m_max[i]);

    html += `
      <div class="forecast-card">
        <p class="forecast-day">${dayName}</p>
        <div class="forecast-icon">${dayMeta.icon}</div>
        <p class="forecast-temp">${maxTemp}° / ${minTemp}°</p>
      </div>
    `;
  }
  forecastCards.innerHTML = html;

  weatherContent.classList.remove('hidden');
}

searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeather(city);
});

cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) fetchWeather(city);
  }
});

// Город по умолчанию
fetchWeather('Москва');
