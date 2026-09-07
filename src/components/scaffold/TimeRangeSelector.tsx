import React, { useState, useEffect } from 'react';
import './TimeRangeSelector.css';

interface TimeRangeSelectorProps {
  onSelectRange: (range: string) => void;
}

const RANGES = ['<15', '15-30', '30-60', '60+'];

export default function TimeRangeSelector({
  onSelectRange,
}: TimeRangeSelectorProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const handleSelect = (range: string) => {
    setSelected(range);
    onSelectRange(range);
  };

  useEffect(() => {
    setSelected('30-60');
    onSelectRange('30-60');
  }, [onSelectRange]);

  return (
    <div className="time-range-selector">
      <label>Cooking Time</label>
      <div className="range-buttons">
        {RANGES.map((range) => (
          <button
            key={range}
            type="button"
            className={`range-button ${selected === range ? 'active' : ''}`}
            onClick={() => handleSelect(range)}
          >
            {range} min
          </button>
        ))}
      </div>
    </div>
  );
}
