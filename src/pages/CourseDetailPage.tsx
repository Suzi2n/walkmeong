import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCourseDetails, getCoursePhotozones } from '../services/courses';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { walkRecordIdState, walkStartedAtState } from '../hooks/walkAtoms';
import { startWalk } from '../services/walks';
import { nameState, breedState, birthState } from '../hooks/animalInfoAtoms';

const CourseDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(location.state?.course || null);
  const courseId =
    location.state?.courseId ||
    location.state?.course?.courseId ||
    location.state?.course?.id ||
    location.state?.course?.course_id;
  
  // 디버깅용 로그
  console.log('Course data from state:', location.state?.course);
  console.log('Course ID found:', courseId);
  const setWalkRecordId = useSetRecoilState(walkRecordIdState);
  const setWalkStartedAt = useSetRecoilState(walkStartedAtState);
  
  // 강아지 정보 가져오기
  const dogName = useRecoilValue(nameState);
  const dogBreed = useRecoilValue(breedState);
  const dogBirth = useRecoilValue(birthState);
  
  // 생년월일로 나이 계산
  const dogAge = dogBirth ? new Date().getFullYear() - new Date(dogBirth).getFullYear() : null;

  const [photozones, setPhotozones] = useState<any[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    // 상세 정보 디버깅
    console.log('Course full data:', course);
    console.log('Course fields:', {
      courseLengthMeters: course?.courseLengthMeters,
      difficulty: course?.difficulty,
      recommendedPetSize: course?.recommendedPetSize,
      features: course?.features
    });
    
    // 포토존 정보만 가져오기 (상세 정보는 이미 있음)
    (async () => {
      try {
        if (courseId) {
          const pz = await getCoursePhotozones(courseId);
          const pd = (pz as any)?.data ?? pz;
          setPhotozones(pd?.data?.photozones || pd?.photozones || []);
        }
      } catch {}
    })();
  }, [courseId, course]);

  // 거리 포맷팅 함수
  const formatDistance = (meters: number) => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(1)}km`;
    }
    return `${meters}m`;
  };
  
  // 난이도 한글 변환
  const formatDifficulty = (difficulty: string) => {
    const map: any = {
      'HARD': '상',
      'NORMAL': '중',
      'MEDIUM': '중',
      'EASY': '하'
    };
    return map[difficulty] || difficulty;
  };
  
  // 추천 견종 한글 변환
  const formatPetSize = (size: string) => {
    const map: any = {
      'SMALL': '소형견',
      'MEDIUM': '중형견',
      'LARGE': '대형견'
    };
    return map[size] || size;
  };

  // 디버깅용
  console.log('Format test:', {
    difficulty: course?.difficulty,
    formatted: course?.difficulty ? formatDifficulty(course.difficulty) : 'N/A',
    petSize: course?.recommendedPetSize,
    formattedSize: course?.recommendedPetSize ? formatPetSize(course.recommendedPetSize) : 'N/A'
  });

  // 이미지 배열 생성
  const images = [];
  if (course?.coverImageUrl) images.push(course.coverImageUrl);
  if (course?.coursePhotoUrl) images.push(course.coursePhotoUrl);
  if (course?.photoUrl) images.push(course.photoUrl);
  if (course?.pathImageUrl) images.push(course.pathImageUrl);
  
  console.log('코스 이미지 URL들:', {
    coverImageUrl: course?.coverImageUrl,
    coursePhotoUrl: course?.coursePhotoUrl,
    photoUrl: course?.photoUrl,
    pathImageUrl: course?.pathImageUrl,
    totalImages: images.length
  });

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="w-full max-w-[430px] mx-auto">
        {/* 헤더 이미지 섹션 */}
        <div className="relative w-full h-64 bg-gray-100">
          <button
            className="absolute top-4 left-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10"
            onClick={() => navigate(-1)}
          >
            <span className="text-lg">‹</span>
          </button>
          
          {images.length > 0 ? (
            <>
              <img 
                src={images[currentImageIndex]}
                alt="코스 이미지"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';
                }}
              />
              {images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/50 text-white px-2 py-1 rounded text-sm">
                  {currentImageIndex + 1} / {images.length}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">🏞️</div>
                <div className="text-sm">이미지 없음</div>
              </div>
            </div>
          )}
        </div>
        {/* 내용 섹션 */}
        <div className="px-4">
          {/* 프로필 섹션 */}
          <div className="flex items-center py-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-xl">🐕</span>
            </div>
            <div className="ml-3">
              <div className="font-medium text-sm">{dogName || '반려견'}</div>
              <div className="text-xs text-gray-500">
                {dogBreed && `${dogBreed}`}
                {dogAge && `, ${dogAge}살`}
              </div>
            </div>
          </div>
          
          {/* 코스 이름과 점수 */}
          <div className="pb-4">
            <h1 className="text-xl font-bold flex items-center gap-2">
              {course?.courseName || course?.name || course?.course_name || '코스 이름'}
              {(course?.averageTailcopterScore || course?.tailcopterScore || course?.score) && (
                <span className="flex items-center gap-1 text-base font-normal text-gray-600">
                  <span>🦴</span>
                  <span>{course?.averageTailcopterScore || course?.tailcopterScore || course?.score}</span>
                </span>
              )}
            </h1>
          </div>
          {/* 코스 정보 */}
          <div className="space-y-4 pb-6">
            <div className="space-y-2">
              {/* 거리 */}
              <div className="flex items-center gap-12">
                <span className="text-sm text-gray-500 min-w-[80px]">거리</span>
                <span className="text-base font-medium">
                  {course?.courseLengthMeters !== undefined && course?.courseLengthMeters !== null 
                    ? formatDistance(course.courseLengthMeters) 
                    : '정보 없음'}
                </span>
              </div>
              
              {/* 난이도 */}
              <div className="flex items-center gap-12">
                <span className="text-sm text-gray-500 min-w-[80px]">난이도</span>
                <span className="text-base font-medium">
                  {course?.difficulty ? formatDifficulty(course.difficulty) : '정보 없음'}
                </span>
              </div>
              
              {/* 추천 견종 */}
              <div className="flex items-center gap-12">
                <span className="text-sm text-gray-500 min-w-[80px]">추천 견종</span>
                <span className="text-base font-medium">
                  {course?.recommendedPetSize ? formatPetSize(course.recommendedPetSize) : '정보 없음'}
                </span>
              </div>
              
              {/* 코스 특징 */}
              <div className="flex items-start gap-12">
                <span className="text-sm text-gray-500 min-w-[80px]">코스 특징</span>
                <div className="flex flex-wrap gap-2">
                  {course?.features && Array.isArray(course.features) && course.features.length > 0 ? (
                    course.features.map((feature: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))
                  ) : (
                    <span className="text-base font-medium">정보 없음</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 버튼들 */}
          <div className={`${photozones.length > 0 ? 'flex gap-3' : ''} pb-8`}>
            <button
              className={`${photozones.length > 0 ? 'flex-1' : 'w-full'} bg-green-500 text-white font-medium py-4 rounded-full hover:bg-green-600 transition-colors`}
              onClick={async () => {
                if (!courseId) {
                  alert('코스 정보가 없습니다. 다시 선택해주세요.');
                  navigate(-1);
                  return;
                }
                
                try {
                  console.log('Starting walk with course ID:', courseId);
                  const res = await startWalk({
                    walk_type: 'EXISTING_COURSE',
                    course_id: courseId,
                  });
                  const data = res?.data ?? res;
                  const id = data?.data?.walk_record_id || data?.walk_record_id;
                  setWalkRecordId(id || null);
                  setWalkStartedAt(Date.now());
                  navigate('/walk_countdown', { state: { from: 'main', courseId: courseId } });
                } catch (e) {
                  console.error('산책 시작 실패:', e);
                  alert('산책을 시작할 수 없습니다.');
                }
              }}
            >
              산책 시작하기
            </button>
            {photozones.length > 0 && (
              <button
                className="flex-1 bg-white border border-gray-300 text-gray-700 font-medium py-4 rounded-full hover:bg-gray-50 transition-colors"
                onClick={() =>
                  navigate('/course_photozones', { state: { photozones } })
                }
              >
                포토존
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;
