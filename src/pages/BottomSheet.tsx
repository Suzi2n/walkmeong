import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { nameState } from '../hooks/animalInfoAtoms';

export default function BottomSheet() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number>(0);

  const navigate = useNavigate();
  const name = useRecoilValue(nameState);

  const courseList = [
    {
      name: '덕진공원 벚나들이',
      score: 92,
      distance: '2.4KM',
      dog: '까미 (알림도 7살)',
      tags: ['#잔잔', '#벚꽃', '#왕복'],
      image: '/assets/course1.jpg',
      date: '25.05.28',
      duration: '14분',
    },
    {
      name: '노을 맛집',
      score: 88,
      distance: '3.1KM',
      dog: '코코 (치와와 3살)',
      tags: ['#감성', '#풍경', '#노을'],
      image: '/assets/course2.jpg',
      date: '25.05.27',
      duration: '19분',
    },
  ];

  // 📱 터치 이벤트
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 || !isExpanded) {
      setTranslateY(delta);
      currentY.current = delta;
    }
  };

  const handleTouchEnd = () => {
    if (currentY.current > 100) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
    setTranslateY(0);
    startY.current = null;
    currentY.current = 0;
  };

  // 🖱️ 마우스 이벤트
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current || startY.current === null) return;
    const delta = e.clientY - startY.current;
    if (delta > 0 || !isExpanded) {
      setTranslateY(delta);
      currentY.current = delta;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (currentY.current > 100) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
    setTranslateY(0);
    startY.current = null;
    currentY.current = 0;

    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-full transition-all duration-300 bg-white rounded-t-2xl shadow-xl z-50 ${
        isExpanded ? 'h-[90%]' : 'h-[25%]'
      }`}
      style={{ transform: `translateY(${translateY}px)` }}
    >
      {/* ✅ 드래그 핸들 (여기서만 드래그 감지) */}
      <div
        className="w-12 h-1.5 bg-gray-400 rounded-full mx-auto my-3 cursor-pointer"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      />

      <div className="h-full flex flex-col justify-between">
        <div className="flex-1 overflow-y-auto px-4">
          <h2 className="text-lg font-semibold mb-2">우리 동네 추천코스</h2>

          <div className="flex items-center gap-2 mb-4 mt-10">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center border border-[#CCCCCC] overflow-hidden">
              <img
                onClick={() => navigate("/my_profile")}
                src="/기본 마이 프로필.png"
                alt="profile"
                className="w-6 h-6 object-contain cursor-pointer"
              />
            </div>
            <p className="text-[17px] font-semibold">
              <span className="text-[#4FA65B] inline">{name || "반려견"}</span>
              와 함께한 즐거운 산책!
            </p>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4">
            {courseList.map((course, idx) => (
              <div
                key={idx}
                className="min-w-[180px] rounded-lg border shadow-sm overflow-hidden cursor-pointer"
                onClick={() => navigate('/course_selected_detail', { state: { course } })}
              >
                <img
                  src={course.image}
                  alt={course.name}
                  className="w-full h-24 object-cover"
                />
                <div className="p-2">
                  <h3 className="text-sm font-medium">{course.name}</h3>
                  <p className="text-xs text-gray-500">
                    {course.distance} · {course.dog}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {isExpanded && (
            <>
              <h2 className="text-md font-semibold mt-4 mb-2">산책일지</h2>
              <div className="space-y-2">
                {courseList.map((course, idx) => (
                  <div key={idx} className="border rounded-xl p-3">
                    <p className="text-sm font-medium">{course.name}</p>
                    <p className="text-xs text-gray-500">
                      {course.distance} · {course.duration} · {course.date}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
