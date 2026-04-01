'use client';

import { useState } from 'react';
import { Request } from '@/types';

interface CalendarViewProps {
  requests: Request[];
  onCardClick: (request: Request) => void;
}

const DOW = ['日', '月', '火', '水', '木', '金', '土'];

export default function CalendarView({ requests, onCardClick }: CalendarViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const handlePrev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };

  const handleNext = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  // カレンダーグリッドを生成
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const cells: { day: number; isOtherMonth: boolean; isToday: boolean; dateStr: string }[] = [];

  for (let i = 0; i < totalCells; i++) {
    let day: number;
    let isOtherMonth = false;

    if (i < firstDay) {
      // 前月
      day = daysInPrevMonth - firstDay + i + 1;
      isOtherMonth = true;
    } else if (i - firstDay >= daysInMonth) {
      // 翌月
      day = i - firstDay - daysInMonth + 1;
      isOtherMonth = true;
    } else {
      // 当月
      day = i - firstDay + 1;
    }

    const cellMonth = isOtherMonth
      ? i < firstDay
        ? month === 0
          ? 11
          : month - 1
        : month === 11
        ? 0
        : month + 1
      : month;
    const cellYear = isOtherMonth
      ? i < firstDay
        ? month === 0
          ? year - 1
          : year
        : month === 11
        ? year + 1
        : year
      : year;

    const dateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday =
      !isOtherMonth &&
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();

    cells.push({ day, isOtherMonth, isToday, dateStr });
  }

  const getEventsForDate = (dateStr: string) => {
    return requests.filter((r) => r.collection_date === dateStr);
  };

  return (
    <div className="cal-wrap">
      <div className="cal-hdr">
        <button className="cal-nav" onClick={handlePrev}>
          ◀
        </button>
        <h3>
          {year}年 {month + 1}月
        </h3>
        <button className="cal-nav" onClick={handleNext}>
          ▶
        </button>
      </div>
      <div className="cal-grid">
        {/* 曜日ヘッダー */}
        {DOW.map((d) => (
          <div key={d} className="cal-dow">
            {d}
          </div>
        ))}
        {/* 日付セル */}
        {cells.map((cell, index) => {
          const events = cell.isOtherMonth ? [] : getEventsForDate(cell.dateStr);
          return (
            <div
              key={index}
              className={`cal-cell${cell.isOtherMonth ? ' other-month' : ''}${cell.isToday ? ' today' : ''}`}
            >
              <div className="cal-day">{cell.day}</div>
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`cal-event ${event.has_asbestos ? 'asb' : 'normal'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCardClick(event);
                  }}
                >
                  {event.customer_name.slice(0, 8)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
