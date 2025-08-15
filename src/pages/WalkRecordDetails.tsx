// WalkRecordDetails.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { nameState } from '../hooks/animalInfoAtoms';
import { startWalk, getWalkDiaryDetails } from '../services/walks';
import Profile from '../hooks/Profile';
import Dimmer from '../hooks/Dimmer';

/* ----------------------------- Confirm Modal ----------------------------- */
type ConfirmModalProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
};

function ConfirmModal({
  open,
  title,
  subtitle,
  confirmText = '예',
  cancelText = '아니요',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* 배경 그림자 (opacity=0.4) */}
      <Dimmer opacity={0.4} z={50} onClick={onCancel} />

      {/* 카드 */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          className="relative bg-[#FEFFFA] rounded-2xl px-5 py-5 w-[309px] h-[182px] max-w-[90%] shadow-xl flex flex-col justify-between"
        >
          <div className="flex flex-col items-center gap-3 text-center mt-2">
            <p className="text-[18px] font-semibold leading-snug">{title}</p>
            {subtitle && (
              <p className="text-sm text-[#616160] leading-relaxed whitespace-pre-line">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 h-[48px] bg-[#E5E7EB] text-[#616160] rounded-xl text-[16px] font-medium cursor-pointer active:opacity-90"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 h-[48px] bg-[#4FA65B] text-white rounded-xl text-[16px] font-medium cursor-pointer disabled:opacity-60 active:opacity-90"
            >
              {loading ? '시작 중…' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* --------------------------- WalkRecordDetails --------------------------- */
export default function WalkRecordDetails() {
  const { walkRecordId } = useParams();
  const location = useLocation();
  const [details, setDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();
  const dogName = useRecoilValue(nameState);

  useEffect(() => {
    const loadDetails = async () => {
      if (location.state?.record) {
        setDetails(location.state.record);
        return;
      }
      if (!walkRecordId) {
        setDetails({
          walk_record_id: walkRecordId,
          title: '산책 기록',
          path_image_url: null,
          markingPhotos: [],
          distance_meters: 0,
          marking_count: 0,
          tailcopter_score: 0,
          created_at: new Date().toISOString(),
        });
        return;
      }
      setIsLoading(true);
      try {
        const response = await getWalkDiaryDetails(walkRecordId);
        const data = response?.data ?? response;
        setDetails(data);
      } catch (error) {
        console.error('산책 기록 상세 정보 조회 실패:', error);
        setDetails({
          walk_record_id: walkRecordId,
          title: '산책 기록',
          path_image_url: null,
          markingPhotos: [],
          distance_meters: 0,
          marking_count: 0,
          tailcopter_score: 0,
          created_at: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadDetails();
  }, [walkRecordId, location.state]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
    return `${y}. ${m}. ${day} (${wd})`;
  };

  const formatDistance = (meters: number) => {
    if (meters >= 1000) return `${(meters / 1000).toFixed(2)}km`;
    return `${meters}m`;
  };

  const handleStartButton = () => setConfirmOpen(true);

  const handleConfirmStart = async () => {
    setStarting(true);
    try {
      if (details?.course_id || details?.courseId) {
        await startWalk({
          walk_type: 'EXISTING_COURSE',
          course_id: details.course_id || details.courseId,
        });
        setConfirmOpen(false);
        navigate('/walk_countdown?state=existing', { state: { from: 'exist' } });
      } else {
        setConfirmOpen(false);
        navigate('/walk_new');
      }
    } catch {
      alert('산책을 시작할 수 없습니다.');
    } finally {
      setStarting(false);
    }
  };

  if (isLoading || !details) {
    return (
      <div className="w-full h-screen max-w-sm mx-auto bg-[#FEFFFA] rounded-xl shadow-lg px-6 py-8 relative">
        <div className="w-full h-full grid place-items-center text-gray-400">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-w-sm mx-auto bg-[#FEFFFA] rounded-xl shadow-lg px-6 py-8 relative">
      {/* 닫기 버튼 */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 right-4 text-gray-400 text-xl font-bold cursor-pointer z-10"
        aria-label="닫기"
        title="닫기"
      >
        ×
      </button>

      {/* 날짜 */}
      <p className="text-[22px] font-semibold mb-4">
        {details.created_at ? formatDate(details.created_at) : '날짜 정보 없음'}
      </p>

      {/* 코스 제목 + 프로필 이미지 */}
      <div className="flex items-center gap-2 mt-6 mb-6">
        <Profile scale={1.4} basePadding={2.5} />
        <p className="text-[17px] font-semibold">
          <span className="text-[#4FA65B]">{dogName || '반려견'}</span>
          와 함께한 {details.course_name || details.courseName || '코스'}
        </p>
      </div>

      {/* 거리 / 마킹 / 점수 */}
      <div className="flex justify-around items-center text-center text-[14px] gap-6 mt-10 mb-10">
        <div>
          <p className="text-[#616160] mb-2">산책 거리</p>
          <p className="font-semibold text-[16px]">
            {details.distance_meters
              ? formatDistance(details.distance_meters)
              : details.distanceMeters
              ? formatDistance(details.distanceMeters)
              : '0m'}
          </p>
        </div>
        <div>
          <p className="text-[#616160] mb-2">마킹 횟수</p>
          <p className="font-semibold text-[16px]">
            {(details.marking_count ?? details.markingCount ?? 0)}회
          </p>
        </div>
        <div>
          <p className="text-[#616160] mb-2">꼬리 점수</p>
          <p className="font-semibold text-[16px]">
            {Math.round(details.tailcopter_score ?? details.tailcopterScore ?? 0)}점
          </p>
        </div>
      </div>

      {/* 지도 이미지 표시 */}
      <div className="mt-6">
        <div className="w-full rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 aspect-[3/2]">
          {details.path_image_url || details.pathImageUrl ? (
            <img
              src={details.path_image_url || details.pathImageUrl}
              alt="산책 경로"
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-center">
              <div>
                <div className="text-4xl mb-2">🗺️</div>
                <div className="text-sm text-gray-500">경로 이미지 없음</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 다시 산책하기 버튼 (하단 고정 영역) */}
      <div className="absolute bottom-0 left-0 w-full px-6 pb-6 bg-white">
        <button
          className="w-full py-3 rounded-xl text-[16px] font-semibold bg-[#4FA65B] text-white cursor-pointer active:opacity-90"
          onClick={handleStartButton}
        >
          이 코스로 다시 산책하기
        </button>
      </div>

      {/* 모달 */}
      <ConfirmModal
        open={confirmOpen}
        title="기억에 남았던 산책명소"
        subtitle="이 코스로 다시 산책할까요?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmStart}
        loading={starting}
      />
    </div>
  );
}
