import { useLanguage } from '../../context/LanguageContext';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSun, FiCloudRain, FiWind, FiDroplet, FiAlertTriangle } from 'react-icons/fi';
export default function Weather() {
  const {
    t
  } = useLanguage();
  const [weather, setWeather] = useState(null);
  useEffect(() => {
    axios.get('/api/market/weather').then(r => setWeather(r.data)).catch(() => {});
  }, []);
  if (!weather) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>;
  return <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t("farmer_weather_weather_302", "Weather")}</h1>
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg opacity-80">{weather.current?.location || 'Your Area'}</p>
            <p className="text-5xl font-bold mt-2">{weather.current?.temp || 28}{t("farmer_weather_c_303", "°C")}</p>
            <p className="text-lg mt-1">{weather.current?.condition || 'Partly Cloudy'}</p>
          </div>
          <FiSun className="w-20 h-20 opacity-50" />
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2"><FiDroplet className="w-4 h-4" /><span>{weather.current?.humidity || 65}{t("farmer_weather_humidity_304", "% Humidity")}</span></div>
          <div className="flex items-center gap-2"><FiWind className="w-4 h-4" /><span>{weather.current?.wind || 12}{t("farmer_weather_km_h_wind_305", "km/h Wind")}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {(weather.forecast || []).map((f, i) => <div key={i} className="bg-white rounded-xl border p-4 text-center">
            <p className="text-sm text-gray-500">{f.day}</p>
            <p className="text-2xl my-2">{f.icon || '⛅'}</p>
            <p className="font-bold">{f.high}°</p>
            <p className="text-sm text-gray-400">{f.low}°</p>
          </div>)}
      </div>

      {weather.alerts && weather.alerts.length > 0 && <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FiAlertTriangle className="text-yellow-500" />{t("farmer_weather_weather_alerts_306", "Weather Alerts")}</h3>
          {weather.alerts.map((a, i) => <div key={i} className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="font-medium text-yellow-800">{a.title}</p>
              <p className="text-sm text-yellow-700 mt-1">{a.message}</p>
            </div>)}
        </div>}
    </div>;
}