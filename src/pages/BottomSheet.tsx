import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { nameState } from '../hooks/animalInfoAtoms';
import { currentLocationState } from '../hooks/walkAtoms';
import { getCourseRecommendations } from '../services/courses';
import { getMyWalkRecords } from '../services/users';

export default function BottomSheet() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [translateY, setTranslateY] = useState(0);
  const isDragging = useRef(false);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number>(0);

  const navigate = useNavigate();
  const name = useRecoilValue(nameState);
  const currentLocation = useRecoilValue(currentLocationState);

  const [courses, setCourses] = useState<any[]>([]);
  const [walkRecords, setWalkRecords] = useState<any[]>([]);

  useEffect(() => {
    let isLoading = false;

    const loadData = async () => {
      if (isLoading) return;
      isLoading = true;

      // 1. 추천 코스 로드 (위치 정보 있으면 사용, 없으면 기본값)
      try {
        const lat = currentLocation?.lat || 37.5665;  // 서울시청 기본값
        const lng = currentLocation?.lng || 126.9780;

        const res = await getCourseRecommendations({
          latitude: lat,
          longitude: lng,
          radius: 2000,
          sortBy: 'tailcopterScoreDesc',
          page: 1,
          size: 10,
        });
        const data = res?.data ?? res;
        const list = data?.data?.courses || data?.data || data?.courses || [];
        console.log('추천 코스 API 응답:', data);
        console.log('코스 목록:', list);
        if (list.length > 0) {
          console.log('첫 번째 코스 구조:', list[0]);
          console.log('첫 번째 코스 이미지 URL:', {
            coverImageUrl: list[0].coverImageUrl,
            photoUrl: list[0].photoUrl,
            coursePhotoUrl: list[0].coursePhotoUrl
          });
        }
        setCourses(list);
      } catch (e) {
        setCourses([]);
      }

      // 2. 산책 기록 로드
      try {
        const res = await getMyWalkRecords({
          page: 1,
          size: 5,
          sortBy: 'created_at',
        });
        const data = res?.data ?? res;
        const records = data?.walkRecords || [];
        console.log('산책 기록 API 응답:', data);
        console.log('산책 기록 목록:', records);
        if (records.length > 0) {
          console.log('첫 번째 산책 기록 구조:', records[0]);
        }
        setWalkRecords(records);
      } catch (e) {
        setWalkRecords([]);
      } finally {
        isLoading = false;
      }
    };

    // 즉시 실행
    loadData();

    return () => {
      isLoading = false;
    };
  }, [currentLocation]); // 위치 변경 시 재로드

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

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // 거리 포맷팅 함수
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };

  // 시간 포맷팅 함수
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = String(date.getFullYear()).slice(2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 w-full transition-all duration-300 bg-white rounded-t-3xl shadow-lg z-50 ${isExpanded ? 'h-[80vh]' : ''
        }`}
      style={{
        transform: `translateY(${translateY}px)`,
        height: isExpanded ? '80vh' : '200px'
      }}
    >
      {/* ✅ 드래그 핸들 (여기서만 드래그 감지) */}
      <div
        className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      />

      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-5">
          <h2 className="text-[15px] font-semibold text-gray-800 mb-3 mt-1">우리 동네 추천코스</h2>

          {/* 추천 코스 섹션 */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <span
                  onClick={() => navigate('/my_profile')}
                  className="text-sm cursor-pointer">🐕
                </span>
              </div>
              <p className="text-[13px] text-gray-600">
                <span className="font-medium text-gray-900">{name || '반려견'}</span>를 위한 추천
              </p>
              <span className="ml-auto text-[11px] text-gray-400">모두보기 ›</span>
            </div>

            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
              {courses.length > 0 ? courses.map((course: any, idx) => (
                <div
                  key={idx}
                  className="min-w-[120px] flex-shrink-0 cursor-pointer"
                  onClick={() =>
                    navigate('/course_selected_detail', { state: { course } })
                  }
                >
                  <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-50 h-[200px]">
                    {course.coverImageUrl || course.photoUrl || course.coursePhotoUrl ? (
                      <img
                        src={course.coverImageUrl || course.photoUrl || course.coursePhotoUrl}
                        alt={course.courseName || course.name || `코스 ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-3xl">🌳</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-0.5">
                      <span className="text-[8px]">🦴</span>
                      <span className="font-medium">{course.averageTailcopterScore || course.tailcopterScore || '75'}</span>
                    </div>
                  </div>
                  <div className="mt-1.5">
                    <h3 className="text-[12px] font-medium text-gray-800 truncate">
                      {course.courseName || course.name || `코스 ${idx + 1}`}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      {course.courseLengthMeters
                        ? formatDistance(course.courseLengthMeters)
                        : course.distanceText || '2.4km'}
                      {course.estimatedDurationSeconds ?
                        ` · ${Math.round(course.estimatedDurationSeconds / 60)}분` :
                        course.features?.length ? ` · ${course.features[0]}` : ''}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="w-full py-4 text-center text-gray-400">
                  <p className="text-xs">추천 코스를 불러오는 중...</p>
                </div>
              )}
            </div>
          </div>

          {/* 산책일지 섹션 */}
          {isExpanded && (
            <div className="mb-5 mt-5">
              <h2 className="text-[15px] font-semibold text-gray-800 mb-3">산책일지</h2>

              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <span
                    onClick={() => navigate('/my_profile')}
                    className="text-sm cursor-pointer">🐕
                  </span>
                </div>
                <p className="text-[13px] text-gray-600">
                  <span className="font-medium text-gray-900">{name || '반려견'}</span>의 산책 일지
                </p>
                <span className="ml-auto text-[11px] text-gray-400">모두보기 ›</span>
              </div>

              <div className="flex gap-2.5 overflow-x-auto scrollbar-hide">
                {walkRecords.length > 0 ? (
                  walkRecords.map((record: any, idx) => (
                    <div
                      key={idx}
                      className="min-w-[120px] flex-shrink-0 cursor-pointer"
                      onClick={() =>
                        navigate(`/walk_records/${record.walk_record_id || record.walkRecordId}`, { state: { record } })
                      }
                    >
                      <div className="relative rounded-lg overflow-hidden bg-gradient-to-br from-blue-100 to-blue-50 h-[200px]">
                        {record.path_image_url || record.pathImageUrl || record.photoUrl ? (
                          <img
                            src={record.path_image_url || record.pathImageUrl || record.photoUrl}
                            alt={`산책 ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-3xl">🌅</span>
                          </div>
                        )}
                        <div className="absolute top-1.5 right-1.5 bg-white/90 backdrop-blur rounded-full px-1.5 py-0.5 text-[10px] flex items-center gap-0.5">
                          <span className="text-[8px]">🦴</span>
                          <span className="font-medium">{record.tailcopter_score || record.tailcopterScore || '75'}</span>
                        </div>
                      </div>
                      <div className="mt-1.5">
                        <h3 className="text-[12px] font-medium text-gray-800 truncate">
                          {record.course_name || record.courseName || record.title || `우리동네 코스`}
                        </h3>
                        <p className="text-[10px] text-gray-500">
                          {(record.end_time || record.start_time) && formatDate(record.end_time || record.start_time)}
                          {record.distance_meters &&
                            ` · ${formatDistance(record.distance_meters)}`}
                          {record.duration_seconds &&
                            ` · ${formatTime(record.duration_seconds)}`}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="w-full text-center py-4 text-gray-400">
                    <p className="text-xs">아직 산책 기록이 없어요</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
