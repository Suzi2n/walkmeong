import { useState, useRef } from 'react';
import KakaoMap from './KakaoMap';
import BottomSheet from './BottomSheet';
import StartWalkButton from './StartWalkButton';
import MyLocationButton from './MyLocationButton';
import LocationButton from './LocationButton';

const HomePage = () => {
  const [markRequested, setMarkRequested] = useState(false);
  const mapRef = useRef<any>(null);

  const handleMoveToMyLocation = () => {
    mapRef.current?.moveToMyLocation?.(); // KakaoMap.tsx의 useImperativeHandle에서 정의한 메서드
  };

  const handleMark = () => {
    setMarkRequested(false);
    // 마커 찍고 나서 추가 작업 가능
  };

  const moveToCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        mapRef.current?.moveToMyLocation?.();
      });
    }
  };

  return (
    <div className="relative w-screen h-screen">
      <KakaoMap
        markRequested={markRequested}
        onMarkHandled={handleMark}
        drawingEnabled={false}
        walkId="dummy-id"
        ref={mapRef}
      >
        <LocationButton />
        <MyLocationButton onClick={handleMoveToMyLocation} />
        <BottomSheet />
      </KakaoMap>
      <StartWalkButton />
    </div>
  );
};

export default HomePage;
