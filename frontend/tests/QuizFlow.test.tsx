import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import { AnswerButton } from "../components/AnswerButton";

function MiniQuiz() {
  const question = {
    options: ["A) Apple", "B) Banana", "C) Cherry", "D) Date"],
    correct: "B) Banana"
  };
  const [selected, setSelected] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");

  const handleSelect = (index: number) => {
    setSelected(index);
    setFeedback(question.options[index] === question.correct ? "Correct" : "Wrong");
  };

  return (
    <div>
      {question.options.map((option, index) => (
        <AnswerButton
          key={option}
          option={option}
          index={index}
          onSelect={() => handleSelect(index)}
          state={
            selected === null
              ? "idle"
              : index === selected
              ? feedback === "Correct"
                ? "correct"
                : "wrong"
              : option === question.correct
              ? "revealed"
              : "idle"
          }
        />
      ))}
      {feedback && (
        <p role="alert" aria-live="polite">
          {feedback}
        </p>
      )}
    </div>
  );
}

describe("Quiz flow", () => {
  it("shows feedback after selecting an answer", () => {
    render(<MiniQuiz />);
    fireEvent.click(screen.getByText("B) Banana"));
    expect(screen.getByRole("alert")).toHaveTextContent("Correct");
  });
});
