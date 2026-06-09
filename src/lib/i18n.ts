import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
const resources = {
  en: {
    translation: {
      'nav.explore': 'Explore',
      'nav.route': 'Route',
      'nav.planner': 'Planner',
      'nav.config': 'Config',
      'nav.profile': 'Profile',
      'planner.title': 'Trip Planner',
      'planner.subtitle': 'Design your perfect journey',
      'planner.empty': 'No stops added yet. Select places on the map to start building your itinerary.',
      'planner.summary': 'Route Summary',
      'planner.distance': 'Total Distance',
      'planner.duration': 'Est. Travel Time',
      'planner.clear': 'Clear All',
      'settings.title': 'Hyper-Settings',
      'settings.language': 'Interface Language',
      'settings.units': 'Measurement Units',
      'settings.aesthetic': 'Map Aesthetic',
      'settings.theme': 'Visual Theme',
      'common.close': 'Close',
      'common.km': 'km',
      'common.mi': 'mi',
      'common.min': 'min',
      'common.hr': 'hr',
      'settings.batterySaver': 'Battery Saver Mode',
      'settings.batterySaverDesc': 'Reduces 3D map frame rate and disables heavy animations'
    }
  },
  ko: {
    translation: {
      'nav.explore': '탐색',
      'nav.route': '경로',
      'nav.planner': '플래너',
      'nav.config': '설정',
      'nav.profile': '프로필',
      'planner.title': '트립 플래너',
      'planner.subtitle': '완벽한 여행을 설계하세요',
      'planner.empty': '추가된 장소가 없습니다. 지도를 클릭하여 일정을 만들어보세요.',
      'planner.summary': '경로 요약',
      'planner.distance': '총 거리',
      'planner.duration': '예상 소요 시간',
      'planner.clear': '모두 삭제',
      'settings.title': '하이퍼 설정',
      'settings.language': '인터페이스 언어',
      'settings.units': '측정 단위',
      'settings.aesthetic': '지도 미학',
      'settings.theme': '비주얼 테마',
      'common.close': '닫기',
      'common.km': 'km',
      'common.mi': 'mi',
      'common.min': '분',
      'common.hr': '시간',
      'settings.batterySaver': '배터리 절약 모드',
      'settings.batterySaverDesc': '3D 지도 프레임 속도를 줄이고 무거운 애니메이션을 비활성화합니다.'
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    }
  });

export default i18n;
