import { useEffect, useRef, useState } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { SlMagnifier } from "react-icons/sl";
import { useNavigate } from "react-router-dom";
import { searchBreeds } from "../services/onboarding";

type BreedItem = { breedId: string; name: string; iconUrl?: string };

// 하이라이트 유틸
const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const Highlight = ({ text, query }: { text: string; query: string }) => {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const tokens = Array.from(new Set(q.split(/\s+/).filter(Boolean)));
  if (tokens.length === 0) return <>{text}</>;
  const regex = new RegExp(`(${tokens.map(escapeReg).join("|")})`, "gi");
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        tokens.some(t => part.toLowerCase() === t.toLowerCase()) ? (
          <span key={i} className="text-[#4FA65B]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

const SearchDog = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<BreedItem[]>([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState<number>(-1);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  // 클릭 밖 감지 → 리스트 닫기
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // 디바운스 검색
  useEffect(() => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    if (query.trim().length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    timerRef.current = window.setTimeout(async () => {
      try {
        const res = await searchBreeds(query.trim());
        const list = (res?.data ?? res ?? []) as BreedItem[];
        setItems(list);
        setOpen(true);
        setHighlight(-1);
      } catch {
        setItems([]);
        setOpen(false);
      }
    }, 200);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [query]);

  // 항목 선택
  const choose = (item: BreedItem | null) => {
    if (item) {
      localStorage.setItem("selected_breed", item.name);
      localStorage.setItem("selected_breed_id", item.breedId);
    } else {
      // 믹스/기타
      localStorage.setItem("selected_breed", "믹스견/기타");
      localStorage.removeItem("selected_breed_id");
    }
    setOpen(false);
    navigate(-1); // 필요하면 다른 경로로 수정
  };

  // 키보드 탐색
  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlight >= 0 && highlight < items.length) choose(items[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative z-0 min-h-screen bg-[#FEFFFA] flex flex-col px-4 pt-4">
      {/* 🔒 고정 배경 이미지 (워터마크) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 flex items-center justify-center">
        <img
          src="/동네 설정 사진.png"
          alt=""
          className="w-[230px] h-[230px] object-contain opacity-20"
        />
      </div>

      {/* 헤더 */}
      <div className="relative h-10 flex items-center justify-center">
        <button
          onClick={() => navigate(-1)}
          aria-label="뒤로가기"
          className="absolute left-0 p-2 -ml-2 text-gray-600 cursor-pointer"
        >
          <FaChevronLeft />
        </button>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-800">
          견종
        </h1>
      </div>

      {/* 검색창 */}
      <div className="mt-3" ref={wrapRef}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => items.length > 0 && setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="견종을 두 글자 이상 입력해 주세요."
            className="w-full bg-white px-4 pr-10 h-12 rounded-lg border border-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2"
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <SlMagnifier className="text-gray-400" />
          </span>
        </div>

        {/* places 스타일 리스트 + 하이라이트 */}
        {open && items.length > 0 && (
          <ul className="w-full mt-2 space-y-1">
            {items.map((b, idx) => (
              <li
                key={b.breedId || `breed-${idx}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(b)}
                className="px-1 py-5 border-b border-gray-200 cursor-pointer"
              >
                <p className="text-sm text-black">
                  <Highlight text={b.name} query={query} />
                </p>
                {/* 필요 시 보조 텍스트
                <p className="text-xs text-gray-500 mt-2 mb-3">
                  <Highlight text={b.englishName ?? ''} query={query} />
                </p> */}
              </li>
            ))}
          </ul>
        )}

        {open && items.length === 0 && query.trim().length >= 2 && (
          <div className="mt-2 w-full bg-white rounded-lg border border-gray-200 px-3 py-3 text-sm text-gray-500">
            검색 결과가 없어요
          </div>
        )}
      </div>

      {/* 하단 버튼 */}
      <div className="flex-1" />
      <div className="flex justify-center items-center pb-8">
        <button
          type="button"
          onClick={() => choose(null)}
          className="mt-5 inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm hover:bg-gray-50 active:scale-[0.98] transition cursor-pointer"
        >
          믹스견/기타
        </button>
      </div>
    </div>
  );
};

export default SearchDog;
