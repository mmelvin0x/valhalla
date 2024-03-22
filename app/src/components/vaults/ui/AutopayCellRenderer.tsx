import { FaCheckCircle } from "react-icons/fa";

const AutopayCellRenderer = (params) => {
  return (
    <div className="h-10 flex flex-col items-center justify-center">
      {params.value ? <FaCheckCircle className="text-success" /> : "No"}
    </div>
  );
};

export default AutopayCellRenderer;
