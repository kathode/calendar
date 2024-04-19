import "./App.css";
import SelectionArea, { SelectionEvent } from "@viselect/react";
import React, { FunctionComponent, useEffect, useState } from "react";

type Indexes = {
  max: number;
  min: number;
};

const App: FunctionComponent = () => {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  const [storedIndexes, setStoredIndexes] = useState<Indexes[]>(() => []);

  // Listen for Enter key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        const minIndex = Math.min(...Array.from(selected));
        const maxIndex = Math.max(...Array.from(selected));
        setStoredIndexes((prev) => [...prev, { min: minIndex, max: maxIndex }]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected]);

  const extractIds = (els: Element[]): number[] =>
    els
      .map((v) => v.getAttribute("data-key"))
      .filter(Boolean)
      .map(Number);

  const onStart = ({ event, selection }: SelectionEvent) => {
    if (!event?.ctrlKey && !event?.metaKey) {
      selection.clearSelection();
      setSelected(() => new Set());
    }
  };

  const onMove = ({
    store: {
      changed: { added, removed },
    },
  }: SelectionEvent) => {
    setSelected((prev) => {
      const next = new Set(prev);

      extractIds(added).forEach((id) => next.add(id));
      extractIds(removed).forEach((id) => next.delete(id));
      const arrayFromSet = Array.from(next);
      const minValue = Math.min(...arrayFromSet);
      const maxValue = Math.max(...arrayFromSet);

      // Calculate the column numbers for min and max values
      const minColumn = Math.floor(minValue / 96);
      const maxColumn = Math.floor(maxValue / 96);

      // Select all numbers between min and max values across the columns
      for (let column = minColumn; column <= maxColumn; column++) {
        for (let i = 0; i < 96; i++) {
          const value = column * 96 + i;
          if (value >= minValue && value <= maxValue) {
            next.add(value);
          }
        }
      }

      return next;
    });
  };

  const indexToTimestamp = (index: number, factor: number): string => {
    let value = index;

    const hours = Math.floor((value % 96) / 4);
    const minutes = ((value % 96) % 4) * 15;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex w-screen">
      <SelectionArea className="container" onStart={onStart} onMove={onMove} selectables=".selectable">
        <div className="flex">
          {new Array(7).fill(0).map((_, columnIndex) => (
            <div key={columnIndex}>
              {new Array(96).fill(0).map((_, rowIndex) => {
                const newIndex = rowIndex + columnIndex * 96;
                const storedRange = isIndexStored(newIndex, storedIndexes);

                return (
                  <div
                    className={selected.has(newIndex) || storedRange ? "selected selectable" : "selectable"}
                    data-key={newIndex}
                    key={newIndex}
                    style={{
                      height: "1.25rem",
                      width: "12.5rem",
                      margin: "1px",
                      background: selected.has(newIndex) || storedRange ? "#629bffcf" : "lightgray",
                      position: "relative",
                    }}
                  >
                    {storedRange && newIndex === storedRange.min && (
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          color: "white",
                          fontSize: "0.75rem",
                          padding: "2px",
                        }}
                      >
                        {indexToTimestamp(storedRange.min, columnIndex * 96)} - {indexToTimestamp(storedRange.max + 1, columnIndex * 96)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </SelectionArea>
      <div>
        <h3>Stored Indexes</h3>
        <ul>
          {storedIndexes.map((indexes: Indexes, i) => (
            <li key={i}>
              {indexes.min} - {indexes.max}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

const isIndexStored = (index: number, storedIndexes: Indexes[]): Indexes | null => {
  for (let i = 0; i < storedIndexes.length; i++) {
    if (index >= storedIndexes[i].min && index <= storedIndexes[i].max) {
      return storedIndexes[i];
    }
  }
  return null;
};
