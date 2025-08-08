import { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { MdWaterDrop } from "react-icons/md";
import { renderToString } from "react-dom/server";

declare global {
  interface Window {
    kakao: any;
  }
}

interface KakaoMapProps {
  markRequested: boolean;
  onMarkHandled: () => void;
  moveToMyLocationRequested?: boolean;
  onMoveHandled?: () => void;
  walkId: string;
  drawingEnabled?: boolean;
  onDistanceChange?: (dist: number) => void;
  children?: React.ReactNode;
}

const KakaoMap = forwardRef(function KakaoMap(
  {
    markRequested,
    onMarkHandled,
    moveToMyLocationRequested,
    onMoveHandled,
    walkId,
    drawingEnabled = true,
    onDistanceChange,
    children,
  }: KakaoMapProps,
  ref
) {
  const mapRef = useRef<any>(null);
  const currentPosRef = useRef<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const prevPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const [totalDistance, setTotalDistance] = useState(0);

  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lng2 - lng1);

    const a =
      Math.sin(Δφ / 2) ** 2 +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // m
  }

  function interpolateColor(color1: string, color2: string, factor: number): string {
    const hexToRgb = (hex: string) => {
      const parsed = hex.replace('#', '');
      return [
        parseInt(parsed.substring(0, 2), 16),
        parseInt(parsed.substring(2, 4), 16),
        parseInt(parsed.substring(4, 6), 16),
      ];
    };

    const rgbToHex = (r: number, g: number, b: number) =>
      `#${[r, g, b]
        .map((x) => {
          const hex = Math.round(x).toString(16);
          return hex.length === 1 ? '0' + hex : hex;
        })
        .join('')}`;

    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);

    const result = [
      c1[0] + (c2[0] - c1[0]) * factor,
      c1[1] + (c2[1] - c1[1]) * factor,
      c1[2] + (c2[2] - c1[2]) * factor,
    ];

    return rgbToHex(result[0], result[1], result[2]);
  }

  // ✅ 지도 초기화 및 내 위치 화살표 마커
  useEffect(() => {
    const kakaoApiKey = import.meta.env.VITE_KAKAO_API_KEY;

    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoApiKey}&autoload=false`;
    script.async = true;

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('map');
        if (!container) return;

        navigator.geolocation.getCurrentPosition((position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const map = new window.kakao.maps.Map(container, {
            center: new window.kakao.maps.LatLng(lat, lng),
            level: 3,
          });

          mapRef.current = map;
          currentPosRef.current = { lat, lng };

          // 🔵 내 위치 화살표 마커
          const markerContent = document.createElement('div');
          markerContent.innerHTML = `
            <svg id="lucide-icon" xmlns="http://www.w3.org/2000/svg"
              width="25" height="25" viewBox="0 0 24 24" fill="none"
              stroke="rgb(80,80,255)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
              style="transform: rotate(0deg); transition: transform 0.3s ease;">
              <polygon points="12 2 19 21 12 17 5 21 12 2"></polygon>
            </svg>
          `;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: new window.kakao.maps.LatLng(lat, lng),
            content: markerContent,
            yAnchor: 1,
          });

          customOverlay.setMap(map);

          let lastHeading = 0;

          navigator.geolocation.watchPosition(
            (pos) => {
              const newLat = pos.coords.latitude;
              const newLng = pos.coords.longitude;
              const heading = pos.coords.heading;
              const speed = pos.coords.speed ?? 0;

              const newCoord = { lat: newLat, lng: newLng };
              setCoordinates((prev) => [...prev, newCoord]);
              currentPosRef.current = newCoord;

              const newPos = new window.kakao.maps.LatLng(newLat, newLng);
              const prevCoord = prevPosRef.current;

              // ✅ 속도 km/h 단위 변환 + 색상 결정
              const speedKmh = speed * 3.6;
              const minSpeed = 0;
              const maxSpeed = 6; // 6km/h 이상이면 완전 주황
              const clampedSpeed = Math.min(Math.max(speedKmh, minSpeed), maxSpeed);
              const factor = (clampedSpeed - minSpeed) / (maxSpeed - minSpeed);

              const color = interpolateColor('#4FA65B', '#FFAC74', factor);


              if (prevCoord && drawingEnabled) {
                const prevPos = new window.kakao.maps.LatLng(prevCoord.lat, prevCoord.lng);

                const segmentDist = calculateDistance(prevCoord.lat, prevCoord.lng, newCoord.lat, newCoord.lng);

                setTotalDistance((prev) => {
                  const updated = prev + segmentDist;
                  onDistanceChange?.(updated); // ✅ 외부 전달

                  // ✅ 거리 기준 색상 결정
                  let color = '#4FA65B'; // 기본 초록
                  if (updated > 4500) {
                    color = '#FF6B6B'; // 빨강
                  }

                  // ✅ 폴리라인 그리기
                  const polyline = new window.kakao.maps.Polyline({
                    path: [prevPos, newPos],
                    strokeWeight: 7,
                    strokeColor: color,
                    strokeOpacity: 0.9,
                    strokeStyle: 'solid',
                  });
                  polyline.setMap(mapRef.current);

                  return updated;
                });
              }


              prevPosRef.current = newCoord; // ✅ 이전 위치 갱신

              const icon = markerContent.querySelector('#lucide-icon') as HTMLElement;
              customOverlay.setPosition(newPos);

              if (icon && heading !== null && !isNaN(heading) && speed !== null && speed > 0.5) {
                const smoothed = lastHeading * 0.7 + heading * 0.3;
                lastHeading = smoothed;
                icon.style.transform = `rotate(${smoothed}deg)`;
              }
            },
            (err) => {
              console.error('위치 추적 실패:', err);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 100,
              timeout: 5000,
            }
          );
        });
      });
    };

    document.head.appendChild(script);
  }, []);

  // ✅ 마킹 버튼 누르면 현재 위치에 커스텀 마커 찍기
  useEffect(() => {
    if (markRequested && mapRef.current) {
      const { lat, lng } = currentPosRef.current;
      if (lat === 0 && lng === 0) return;

      const pos = new window.kakao.maps.LatLng(lat, lng);

      const iconHTML = renderToString(
        <MdWaterDrop style={{ width: "20px", height: "20px", color: "#4FA65B" }} />
      );

      const markerDiv = document.createElement('div');
      markerDiv.innerHTML = `
        <div style="
          background-color: #FFD86A;
          border-radius: 12px;
          padding: 4px;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${iconHTML}
          <div style="
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 10px solid transparent;
            border-right: 10px solid transparent;
            border-top: 10px solid #FFD86A;
          "></div>
        </div>
      `;

      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: markerDiv.firstElementChild as HTMLElement,
        yAnchor: 1,
        zIndex: 5,
      });

      customOverlay.setMap(mapRef.current);
      mapRef.current.panTo(pos);
      onMarkHandled();
    }
  }, [markRequested]);

  useEffect(() => {
    /*const interval = setInterval(() => {
      const { lat, lng } = currentPosRef.current;
      if (lat && lng) {
        const payload = {
          walkId, // 꼭 전달받은 값이어야 함
          lat,
          lng,
          timestamp: new Date().toISOString(), // 또는 pos.timestamp 사용 가능
        };

        fetch(`/api/walks/${walkId}/coordinate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch((err) => console.error('좌표 전송 실패:', err));
      }
    }, 3000);

    return () => clearInterval(interval);*/
  }, [walkId]);

  useEffect(() => {
    if (moveToMyLocationRequested && mapRef.current) {
      const { lat, lng } = currentPosRef.current;
      if (lat !== 0 && lng !== 0) {
        const pos = new window.kakao.maps.LatLng(lat, lng);
        mapRef.current.panTo(pos); // ← 내 위치로 부드럽게 이동
        onMoveHandled?.();
      }
    }
  }, [moveToMyLocationRequested]);

  useImperativeHandle(ref, () => ({
    moveToMyLocation() {
      const { lat, lng } = currentPosRef.current;
      if (lat && lng && mapRef.current) {
        const pos = new window.kakao.maps.LatLng(lat, lng);
        mapRef.current.panTo(pos);
        console.log('📍 지도 중심 이동 완료');
      }
    },
  }));

  return (
    <div className="relative w-screen h-screen">
      <div id="map" className="w-full h-full z-0" />

      {/* ✅ 지도 위에 올라가지만 마우스는 통과시키고, 버튼만 클릭 가능 */}
      <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-none">
        <div className="pointer-events-auto">{children}</div>
      </div>
    </div>

  );
});

export default KakaoMap;