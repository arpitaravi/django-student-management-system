
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="container mt-4">
      <h3>Counter: {count}</h3>

      <button
        className="btn btn-primary me-2"
        onClick={() => setCount(count + 1)}
      >
        Increase
      </button>

      <button
        className="btn btn-danger"
        onClick={() => setCount(count - 1)}
      >
        Decrease
      </button>
    </div>
  );
}

export default Counter;
