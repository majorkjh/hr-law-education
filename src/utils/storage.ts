import { DocumentData, CeremonyRow } from '../types';

const STORAGE_KEY = 'epost_culture_contest_ceremony_plan_v1';

export function getDefaultDocumentData(): DocumentData {
  return {
    title: '우체국 문화전 수상자 시상식 계획',
    purpose: `미래 세대의 따뜻한 정서 함양과 문화예술 창작 활동 지원
- 어린이 및 청소년의 창의적 표현력 계발 및 우정 문화 확산
- 우수 수상작 격려를 통한 자긍심 고취 및 가족 친화 행사 추진`,
    overview: {
      eventName: '제34회 우체국 문화전(그림·글짓기) 수상자 시상식',
      dateTime: '2026. 10. 15.(목) 14:00 ~ 15:30',
      location: '우정사업본부 2층 대강당(세종특별자치시)',
      target: '그림·글짓기 부문 대상 및 최우수상 수상자, 동반 가족',
      awardeeCount: '90명 이내',
      attendeeCount: '50~60명 내외',
      host: '우정사업본부 (주관: 한국우편사업진흥원)',
      extra: `행사장 내 수상작(그림·글짓기) 특별 전시 부스 동시 운영
- 참석 가족 편의를 위한 이동 안내 및 다과 제공`,
    },
    details: `부문별(초등 저·고학년, 중·고등부) 우수작 시상 및 부상 수여
- 그림 부문: 대상 4명, 최우수상 8명 등
- 글짓기 부문: 대상 4명, 최우수상 8명 등
수상작 전시존 운영 및 기념 포토존 설치
- 행사장 로비에 부문별 대상·최우수상 수상작 액자 전시
- 가족 단위 기념사진 촬영을 위한 우체국 캐릭터 포토월 운영`,
    ceremonyRows: [
      { id: 'row_1', time: '14:00 ~ 14:05', content: '개식 및 국민의례', remarks: '사회자' },
      { id: 'row_2', time: '14:05 ~ 14:15', content: '내빈 소개', remarks: '사회자' },
      { id: 'row_3', time: '14:15 ~ 14:25', content: '인사말씀', remarks: '주요 내빈 및 주최측' },
      { id: 'row_4', time: '14:25 ~ 14:50', content: '시상 (상장 및 부상 수여)', remarks: '시상자 및 수상자' },
      { id: 'row_5', time: '14:50 ~ 14:58', content: '기념 촬영 (참석자 전원 및 가족)', remarks: '전체' },
      { id: 'row_6', time: '14:58 ~ 15:00', content: '폐식 및 전시 관람 안내', remarks: '사회자' },
    ],
    futurePlans: `시상식 결과 보고 및 언론 보도자료 배포: 2026. 10. 16.(금)
- 수상작 e-작품집 제작 및 우체국 문화전 누리집 게시: 2026. 10. 20.(화)
- 전국 주요 총괄우체국 순회 전시회 추진: 2026. 11. 1. ~ 12. 31.`,
  };
}

export function getEmptyDocumentData(): DocumentData {
  return {
    title: '우체국 문화전 수상자 시상식 계획',
    purpose: '',
    overview: {
      eventName: '',
      dateTime: '',
      location: '',
      target: '',
      awardeeCount: '',
      attendeeCount: '',
      host: '',
      extra: '',
    },
    details: '',
    ceremonyRows: [
      { id: 'row_1', time: '14:00 ~ 14:05', content: '개식 및 국민의례', remarks: '사회자' },
      { id: 'row_2', time: '14:05 ~ 14:15', content: '내빈 소개', remarks: '사회자' },
      { id: 'row_3', time: '14:15 ~ 14:25', content: '인사말씀', remarks: '주요 내빈 및 주최측' },
      { id: 'row_4', time: '14:25 ~ 14:50', content: '시상 (상장 및 부상 수여)', remarks: '시상자 및 수상자' },
      { id: 'row_5', time: '14:50 ~ 14:58', content: '기념 촬영 (참석자 전원 및 가족)', remarks: '전체' },
      { id: 'row_6', time: '14:58 ~ 15:00', content: '폐식', remarks: '사회자' },
    ],
    futurePlans: '',
  };
}

export function saveDocumentData(data: DocumentData): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (err) {
    console.warn('localStorage 저장 실패:', err);
    return false;
  }
}

export function loadDocumentData(): DocumentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          title: parsed.title || '우체국 문화전 수상자 시상식 계획',
          purpose: parsed.purpose || '',
          overview: {
            eventName: parsed.overview?.eventName || '',
            dateTime: parsed.overview?.dateTime || '',
            location: parsed.overview?.location || '',
            target: parsed.overview?.target || '',
            awardeeCount: parsed.overview?.awardeeCount || '',
            attendeeCount: parsed.overview?.attendeeCount || '',
            host: parsed.overview?.host || '',
            extra: parsed.overview?.extra || '',
          },
          details: parsed.details || '',
          ceremonyRows: Array.isArray(parsed.ceremonyRows) ? parsed.ceremonyRows : [],
          futurePlans: parsed.futurePlans || '',
        };
      }
    }
  } catch (err) {
    console.warn('localStorage 불러오기 실패:', err);
  }
  return getDefaultDocumentData();
}

/**
 * Extracts start time (hours & minutes) from dateTime string or defaults to 14:00.
 * Generates default ceremony rows based on that start time.
 */
export function generateDefaultCeremonyRows(dateTimeStr: string): CeremonyRow[] {
  let startHour = 14;
  let startMinute = 0;

  if (dateTimeStr) {
    // Check 24-hr pattern like "15:00" or "14:30"
    const match24 = dateTimeStr.match(/([0-2]?\d):([0-5]\d)/);
    if (match24) {
      startHour = parseInt(match24[1], 10);
      startMinute = parseInt(match24[2], 10);
    } else {
      // Check korean afternoon/morning like "오후 2시" or "오전 10시"
      const matchKo = dateTimeStr.match(/(오전|오후)?\s*([0-1]?\d)\s*시(?:\s*([0-5]?\d)\s*분)?/);
      if (matchKo) {
        let h = parseInt(matchKo[2], 10);
        const m = matchKo[3] ? parseInt(matchKo[3], 10) : 0;
        if (matchKo[1] === '오후' && h < 12) h += 12;
        if (matchKo[1] === '오전' && h === 12) h = 0;
        startHour = h;
        startMinute = m;
      }
    }
  }

  const formatTime = (h: number, m: number) => {
    const hh = String(h % 24).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const addMinutes = (h: number, m: number, add: number) => {
    const total = h * 60 + m + add;
    return { h: Math.floor(total / 60) % 24, m: total % 60 };
  };

  const steps = [
    { dur: 5, content: '개식 및 국민의례', remarks: '사회자' },
    { dur: 10, content: '내빈 소개', remarks: '사회자' },
    { dur: 10, content: '인사말씀', remarks: '주요 내빈 및 주최측' },
    { dur: 25, content: '시상 (상장 및 부상 수여)', remarks: '시상자 및 수상자' },
    { dur: 8, content: '기념 촬영 (참석자 전원)', remarks: '참석자 전원' },
    { dur: 2, content: '폐식', remarks: '사회자' },
  ];

  let currentH = startHour;
  let currentM = startMinute;

  return steps.map((s, idx) => {
    const tStart = formatTime(currentH, currentM);
    const end = addMinutes(currentH, currentM, s.dur);
    const tEnd = formatTime(end.h, end.m);
    currentH = end.h;
    currentM = end.m;

    return {
      id: `ceremony_${Date.now()}_${idx}`,
      time: `${tStart} ~ ${tEnd}`,
      content: s.content,
      remarks: s.remarks,
    };
  });
}
