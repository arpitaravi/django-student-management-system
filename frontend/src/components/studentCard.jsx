
function StudentCard(props) {
  return (
    <div className="card p-3 mb-3">
      <h3>{props.name}</h3>
      <p>Course: {props.course}</p>
    </div>
  );
}

export default StudentCard;
