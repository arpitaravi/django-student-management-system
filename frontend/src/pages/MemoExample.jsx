import { useState, memo } from "react";

const StudentCard = memo(function StudentCard({ name }) {
  console.log("StudentCard rendered");

  return <h3>Student Name: {name}</h3>;
});

function MemoExample() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h2>Count: {count}</h2>

      <button onClick={() => setCount(count + 1)}>
        Increase Count
      </button>

      <StudentCard name="Arpitha" />
    </div>
  );
}

export default MemoExample;