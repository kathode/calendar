import "./App.css";
import SelectionArea, { SelectionEvent } from "@viselect/react";
import React, { FunctionComponent, useState } from "react";

const App: FunctionComponent = () => {
  const [selected, setSelected] = useState<Set<number>>(() => new Set());

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

  return (
    <>
      <SelectionArea className="container" onStart={onStart} onMove={onMove} selectables=".selectable">
        <div className="flex justify-center w-full">
          {new Array(7).fill(0).map((_, columnIndex) => (
            <div key={columnIndex}>
              {new Array(96).fill(0).map((_, rowIndex) => {
                const newIndex = rowIndex + columnIndex * 96;

                return (
                  <div
                    className={selected.has(newIndex) ? "selected selectable" : "selectable"}
                    data-key={newIndex}
                    key={newIndex}
                    style={{
                      height: "1.25rem",
                      width: "12.5rem",
                      margin: "1px",
                      background: selected.has(newIndex) ? "#629bffcf" : "lightgray",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </SelectionArea>
    </>
  );
};

export default App;
