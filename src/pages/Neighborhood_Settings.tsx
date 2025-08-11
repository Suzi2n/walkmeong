import { FaChevronLeft } from 'react-icons/fa';
import { SlMagnifier } from 'react-icons/sl';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchLocations } from '../services/onboarding';
import { updateProfile } from '../services/users';

declare global {
  interface Window {
    kakao: any;
  }
}

const Neighborhood_Settings = () => {
  const kakaoApiKey = import.meta.env.VITE_KAKAO_API_KEY;
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&libraries=services`;
    script.async = false;
    document.head.appendChild(script);
  }, []);

  const handleSearch = async (keyword: string) => {
    if (!keyword) {
      setPlaces([]);
      return;
    }
    try {
      const res = await searchLocations(keyword);
      const list = res?.data ?? res ?? [];
      setPlaces(list);
    } catch (e) {
      // fallback: 카카오 클라이언트 검색
      if (window.kakao?.maps?.services) {
        const ps = new window.kakao.maps.services.Places();
        ps.keywordSearch(keyword, (data: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            setPlaces(
              data.map((p: any) => ({
                addressName: p.address_name,
                roadAddressName: p.road_address_name,
              }))
            );
          } else {
            setPlaces([]);
          }
        });
      }
    }
  };

  const handleSelect = async (place: any) => {
    const address =
      place.roadAddressName ||
      place.addressName ||
      place.road_address_name ||
      place.address_name ||
      '';
    setQuery(address);
    setPlaces([]);

    const parts = address.split(' ');
    const cityDistrict =
      parts.length >= 3 ? `${parts[1]} ${parts[2]}` : address;

    localStorage.setItem('selected_address_full', address);
    localStorage.setItem('selected_address_cityDistrict', cityDistrict);
    if (place?.location_id) {
      localStorage.setItem('selected_location_id', place.location_id);
      try {
        await updateProfile({ preferredLocationId: place.location_id });
      } catch (e) {}
    }

    navigate('/animal_setting');
  };

  return (
    <div className="min-h-screen bg-[#FEFFFA] p-5 flex flex-col">
      {/* 헤더 */}
      <div className="relative flex items-center mb-6">
        <FaChevronLeft
          onClick={() => navigate('/agree_ment')}
          className="text-gray-600 z-10 cursor-pointer"
        />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-800">
          산책할 동네를 설정해 주세요!
        </h1>
      </div>

      {/* 검색창 */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="지번, 도로명, 건물명 검색"
          className="w-full bg-white px-4 py-3 pr-10 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2"
        />
        <SlMagnifier className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

        {places.length > 0 && (
          <ul className="w-full mt-2 space-y-1">
            {places.map((place: any, index) => (
              <li
                key={index}
                onClick={() => handleSelect(place)}
                className="px-1 py-2 border-b border-gray-200"
              >
                <p className="text-sm font-medium text-black">
                  {place.roadAddressName ||
                    place.addressName ||
                    place.road_address_name ||
                    place.address_name}
                </p>
                <p className="text-xs text-gray-500 mt-2 mb-3">
                  {place.addressName || place.address_name}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 이미지 */}
      <div className="flex-grow flex justify-center items-center">
        <img
          src="/동네 설정 사진.png"
          alt="동네 설정 일러스트"
          className="w-[230px] h-[230px] object-contain opacity-20"
        />
      </div>
    </div>
  );
};

export default Neighborhood_Settings;
