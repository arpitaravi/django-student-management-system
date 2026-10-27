
function StudentCard(props) {
  return (
    <div>
      <h2>Student Name: {props.name}</h2>
      <p>Course: {props.course}</p>
    </div>
  );
}

export default StudentCard;

