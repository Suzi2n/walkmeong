import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import {
  nameState,
  breedState,
  birthState,
  sizeState,
} from '../hooks/animalInfoAtoms';

import { FaChevronLeft, FaSearch } from 'react-icons/fa';
import Resister from '../hooks/Resister'; // ✅ 모달 컴포넌트 불러오기
import { updateProfile } from '../services/users';
import { searchBreeds } from '../services/onboarding';

const Animal_Settings = () => {
  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [breedId, setBreedId] = useState<string | undefined>(undefined);
  const [birth, setBirth] = useState('');
  const [size, setSize] = useState<'소형' | '중형' | '대형' | null>(null);
  const [showModal, setShowModal] = useState(false); // ✅ 모달 상태
  const [breedSuggestions, setBreedSuggestions] = useState<
    { breedId: string; name: string; iconUrl?: string }[]
  >([]);

  const isFormValid = Boolean(name && breedId && birth && size); // 모든 필드 필수

  // 디버깅용 로그
  useEffect(() => {
    console.log('Form validation details:', {
      name: { value: name, valid: !!name },
      breedId: { value: breedId, valid: !!breedId },
      birth: { value: birth, valid: !!birth },
      size: { value: size, valid: !!size },
      isFormValid
    });
  }, [name, breedId, birth, size, isFormValid]);

  const navigate = useNavigate();

  const setNameGlobal = useSetRecoilState(nameState);
  const setBreedGlobal = useSetRecoilState(breedState);
  const setBirthGlobal = useSetRecoilState(birthState);
  const setSizeGlobal = useSetRecoilState(sizeState);

  // ✅ 모달 띄우기
  const handleSaveClick = () => {
    setShowModal(true);
  };

  // ✅ 모달의 확인 버튼 클릭 시
  const handleConfirm = async () => {
    setNameGlobal(name);
    setBreedGlobal(breed);
    setBirthGlobal(birth);
    setSizeGlobal(size);

    try {
      // 모든 필드가 필수이므로 반드시 값이 있음
      await updateProfile({
        petName: name,
        breedId: breedId,
        petBirthDate: `20${birth.slice(0, 2)}-${birth.slice(2, 4)}-${birth.slice(4, 6)}`,
        petSize: size, // 이미 한글이므로 그대로 전송
      });
    } catch (e) {
      // 저장 실패해도 로컬 진행
    }

    setShowModal(false);
    navigate('/homepage');
  };

  return (
    <div className="min-h-screen bg-[#FEFFFA] p-5 relative">
      {/* 헤더 */}
      <div className="relative flex items-center mb-6">
        <FaChevronLeft
          className="text-gray-600 cursor-pointer"
          onClick={() => navigate(-1)}
        />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-800">
          반려견에 대해 알려주세요!
        </h1>
      </div>

      {/* 이름 입력 */}
      <div className="mt-10 mb-4">
        <label className="block text-sm mb-2">이름 <span className="text-red-500">*</span></label>
        <input
          type="text"
          maxLength={8}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력해주세요 (최대 8자)"
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2"
        />
      </div>

      {/* 견종 입력 */}
      <div className="mb-4 relative">
        <label className="block text-sm mb-2">견종 <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={breed}
          onChange={async (e) => {
            const v = e.target.value;
            // 실제로 값이 변경되었을 때만 breedId 리셋
            if (v !== breed) {
              setBreed(v);
              setBreedId(undefined);
              try {
                const res = await searchBreeds(v);
                const list = res?.data ?? res ?? [];
                setBreedSuggestions(list);
              } catch (e) {
                setBreedSuggestions([]);
              }
            }
          }}
          placeholder="견종을 검색하여 선택해주세요"
          className={`w-full bg-white border rounded-lg px-4 py-3 pr-10 placeholder-gray-400 focus:outline-none focus:ring-2 ${
            breedId ? 'border-green-500 bg-green-50' : 'border-gray-300'
          }`}
        />
        <FaSearch className="absolute right-3 top-[45px] text-gray-400" />
        {breedSuggestions.length > 0 && (
          <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded mt-1 max-h-48 overflow-auto">
            {breedSuggestions.map((b, idx) => (
              <li
                key={b.breedId || `breed-${idx}`}
                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setBreed(b.name);
                  setBreedId(b.breedId);
                  setBreedSuggestions([]);
                }}
              >
                {b.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 생년월일 입력 */}
      <div className="mb-4">
        <label className="block text-sm mb-2">
          생년월일 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={birth}
          onChange={(e) => setBirth(e.target.value)}
          placeholder="예) 241120"
          className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 placeholder-gray-400 focus:outline-none focus:ring-2"
        />
      </div>

      {/* 크기 선택 */}
      <div className="mb-6">
        <label className="block text-sm mb-3">크기 <span className="text-red-500">*</span></label>
        <div className="flex justify-center items-center gap-3">
          {['소형', '중형', '대형'].map((label) => (
            <button
              key={label}
              onClick={() => setSize(label as any)}
              className={`flex-1 py-3 rounded-xl border cursor-pointer ${
                size === label
                  ? 'bg-[#E0F2D9] border-2 border-[#498252] text-[#498252]'
                  : 'bg-white text-gray-700 border border-gray-300'
              }`}
            >
              {label}
              <span className="text-sm flex flex-col text-gray-400">
                {label === '소형' && '(1~10kg)'}
                {label === '중형' && '(10~25kg)'}
                {label === '대형' && '(25kg 이상)'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        disabled={!isFormValid}
        onClick={handleSaveClick}
        className={`w-full py-3 rounded-xl text-white text-lg font-semibold transition ${
          isFormValid ? 'bg-[#4FA65B] cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
        }`}
      >
        저장하기
      </button>
      {!isFormValid && (
        <p className="text-center text-sm text-gray-500 mt-2">
          모든 정보를 입력해주세요
        </p>
      )}

      {/* 모달 렌더링 */}
      {showModal && (
        <Resister
          message="등록 완료!"
          subMessage="계정이 성공적으로 등록되었어요."
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
};

export default Animal_Settings;
