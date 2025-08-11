import { useNavigate } from 'react-router-dom';
// import Walk_countdown from './Walk_countdown';
import { useSetRecoilState } from 'recoil';
import { walkRecordIdState, walkStartedAtState } from '../hooks/walkAtoms';
import { startWalk } from '../services/walks';

export default function StartWalkButton() {
  const navigate = useNavigate();
  const setWalkRecordId = useSetRecoilState(walkRecordIdState);
  const setWalkStartedAt = useSetRecoilState(walkStartedAtState);

  const handleClick = () => {
    // 먼저 산책 시작 API 호출 후 카운트다운으로 이동
    startWalk({ walk_type: 'NEW_COURSE' })
      .then((res: any) => {
        const data = res?.data ?? res;
        const id = data?.data?.walk_record_id || data?.walk_record_id;
        setWalkRecordId(id || null);
        setWalkStartedAt(Date.now());
      })
      .catch(() => {
        // 실패해도 UX 위해 진행
      })
      .finally(() => {
        navigate('/walk_countdown', { state: { from: 'main' } });
      });
  };

  return (
    <button
      onClick={handleClick}
      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 
             bg-green-600 text-white py-3 rounded-full shadow-lg cursor-pointer 
             w-[40vw] max-w-xs"
    >
      산책 시작하기
    </button>
  );
}
